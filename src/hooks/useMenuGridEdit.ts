import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { MenuSizeKey } from '../data/menuWidgetAssets';

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 8;
const COLUMNS = 4;
const ROWS = 2;
const SLOT_COUNT = COLUMNS * ROWS;
const REFLOW_MS = 200;
const REFLOW_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EXPAND_HOVER_MS = 450;

interface GridItem {
  id: string;
  menuId: string;
  size: MenuSizeKey;
  slot?: number;
  compactAssetId?: string;
  expandedAsset?: { assetId: string; variant: string };
}
interface Gesture {
  id: string; pointerId: number; startX: number; startY: number;
  longPressed: boolean; dragging: boolean; grabX: number; grabY: number; timer: number | null;
}
interface AssetReplacement {
  fromAssetId: string;
  widget: { assetId: string; menuId: string; size: MenuSizeKey; variant: string };
}
interface DropPlan {
  placements: { assetId: string; slot: number }[];
  slot: number;
  span: 1 | 2;
  replacement?: AssetReplacement;
}
interface DropPreview { slot: number; span: 1 | 2; invalid: boolean; waiting?: boolean }
interface Options {
  gridRef: RefObject<HTMLUListElement>;
  sectionRef: RefObject<HTMLElement>;
  items: GridItem[];
  editing: boolean;
  onEnterEdit: () => void;
  onExitEdit: () => void;
  onReorder: (placements: { assetId: string; slot: number }[], replacement?: AssetReplacement) => void;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const screenPerCss = (el: HTMLElement) => (el.offsetWidth > 0 ? el.getBoundingClientRect().width / el.offsetWidth : 1);

/** 드롭 대상을 먼저 고정하고 나머지를 기존 상대 순서대로 남은 첫 빈칸에 채운다. */
function planDrop(
  items: readonly GridItem[],
  draggedId: string,
  targetSlot: number,
  resultSize?: MenuSizeKey,
  resultAssetId?: string,
  resultVariant = 'default',
): DropPlan | null {
  const dragged = items.find((item) => item.id === draggedId);
  if (!dragged) return null;
  const resolvedSize = resultSize ?? dragged.size;
  const resolvedAssetId = resultAssetId ?? dragged.id;
  const span: 1 | 2 = resolvedSize === '2x2' ? 2 : 1;
  const targetRow = Math.floor(targetSlot / COLUMNS);
  const targetCol = targetSlot % COLUMNS;
  if (targetSlot < 0 || targetSlot >= SLOT_COUNT || targetCol + span > COLUMNS || targetRow + span > ROWS) return null;

  const occupied = Array<boolean>(SLOT_COUNT).fill(false);
  const starts = new Map<string, number>();
  const canPlace = (slot: number, itemSpan: 1 | 2) => {
    const row = Math.floor(slot / COLUMNS);
    const col = slot % COLUMNS;
    if (col + itemSpan > COLUMNS || row + itemSpan > ROWS) return false;
    for (let r = row; r < row + itemSpan; r += 1) {
      for (let c = col; c < col + itemSpan; c += 1) if (occupied[r * COLUMNS + c]) return false;
    }
    return true;
  };
  const place = (id: string, slot: number, itemSpan: 1 | 2) => {
    const row = Math.floor(slot / COLUMNS);
    const col = slot % COLUMNS;
    for (let r = row; r < row + itemSpan; r += 1) {
      for (let c = col; c < col + itemSpan; c += 1) occupied[r * COLUMNS + c] = true;
    }
    starts.set(id, slot);
  };

  place(resolvedAssetId, targetSlot, span);
  for (const item of items) {
    if (item.id === dragged.id) continue;
    const itemSpan: 1 | 2 = item.size === '2x2' ? 2 : 1;
    let slot = typeof item.slot === 'number' ? item.slot - 1 : 0;
    if (!canPlace(slot, itemSpan)) slot = 0;
    while (slot < SLOT_COUNT && !canPlace(slot, itemSpan)) slot += 1;
    if (slot >= SLOT_COUNT) return null;
    place(item.id, slot, itemSpan);
  }
  return {
    placements: [...starts.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([assetId, slot]) => ({ assetId, slot: slot + 1 })),
    slot: targetSlot,
    span,
    ...(resolvedAssetId !== dragged.id ? {
      replacement: {
        fromAssetId: dragged.id,
        widget: { assetId: resolvedAssetId, menuId: dragged.menuId, size: resolvedSize, variant: resultVariant },
      },
    } : {}),
  };
}

/** 1×1 전용 이동. 빈칸이면 source만 비우고, 다른 1×1이면 두 slot만 정확히 교환한다.
 * 2×2가 점유한 칸과의 충돌은 기존 2×2 규칙을 침범하지 않도록 허용하지 않는다. */
function planOneByOneDrop(items: readonly GridItem[], draggedId: string, targetSlot: number): DropPlan | null {
  const dragged = items.find((item) => item.id === draggedId);
  if (!dragged || dragged.size !== '1x1' || typeof dragged.slot !== 'number') return null;
  if (targetSlot < 0 || targetSlot >= SLOT_COUNT) return null;
  const sourceSlot = dragged.slot - 1;
  if (sourceSlot === targetSlot) {
    return {
      placements: items.map((item) => ({ assetId: item.id, slot: item.slot ?? 1 })),
      slot: targetSlot,
      span: 1,
    };
  }

  const targetWidget = items.find((item) => {
    if (typeof item.slot !== 'number') return false;
    const start = item.slot - 1;
    if (item.size === '1x1') return start === targetSlot;
    const row = Math.floor(start / COLUMNS);
    const col = start % COLUMNS;
    const targetRow = Math.floor(targetSlot / COLUMNS);
    const targetCol = targetSlot % COLUMNS;
    return targetRow >= row && targetRow < row + 2 && targetCol >= col && targetCol < col + 2;
  });
  if (targetWidget?.size === '2x2') return null;

  const placements = items.map((item) => {
    if (item.id === dragged.id) return { assetId: item.id, slot: targetSlot + 1 };
    if (item.id === targetWidget?.id) return { assetId: item.id, slot: sourceSlot + 1 };
    return { assetId: item.id, slot: item.slot ?? 1 };
  });
  return { placements, slot: targetSlot, span: 1 };
}

export function useMenuGridEdit({ gridRef, sectionRef, items, editing, onEnterEdit, onExitEdit, onReorder }: Options) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, setDropPlan] = useState<DropPlan | null>(null);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [expandedPreviewAssetId, setExpandedPreviewAssetId] = useState<string | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const planRef = useRef<DropPlan | null>(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const callbacks = useRef({ onEnterEdit, onExitEdit, onReorder });
  callbacks.current = { onEnterEdit, onExitEdit, onReorder };
  const suppressClick = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const prevPositions = useRef(new Map<string, { left: number; top: number }>());
  const dropFlipRects = useRef<Map<string, DOMRect> | null>(null);
  const expandTimer = useRef<number | null>(null);
  const expandCandidate = useRef<string | null>(null);
  const setPlan = (plan: DropPlan | null, preview: DropPreview | null = null) => {
    planRef.current = plan;
    setDropPlan(plan);
    setDropPreview(preview ?? (plan ? { slot: plan.slot, span: plan.span, invalid: false } : null));
  };
  const clearExpansion = () => {
    if (expandTimer.current !== null) window.clearTimeout(expandTimer.current);
    expandTimer.current = null;
    expandCandidate.current = null;
    setExpandedPreviewAssetId(null);
  };

  const draggedElement = () => {
    const g = gesture.current;
    return g?.dragging ? gridRef.current?.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(g.id)}"]`) ?? null : null;
  };
  const positionDragged = () => {
    const g = gesture.current;
    const el = draggedElement();
    const grid = gridRef.current;
    if (!g || !el || !grid) return;
    const box = grid.getBoundingClientRect();
    const k = screenPerCss(grid);
    const left = (pointer.current.x - box.left - g.grabX) / k;
    const top = (pointer.current.y - box.top - g.grabY) / k;
    el.style.transform = `translate(${left - el.offsetLeft}px, ${top - el.offsetTop}px)`;
  };

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    /* 숨겨진 페이지(예: 메뉴 관리에 가 있는 동안의 홈)에서는 모든 칸의 위치가 0 으로 측정된다 — 그때 기록하거나
     * 비교하면 다시 보일 때 카드가 엉뚱한 위치에서 날아 들어오므로, 보이지 않을 때는 건너뛴다. */
    if (grid.getClientRects().length === 0) return;
    const reduce = prefersReducedMotion();
    const dropRects = dropFlipRects.current;
    dropFlipRects.current = null;
    const next = new Map<string, { left: number; top: number }>();
    grid.querySelectorAll<HTMLElement>('.menu-slot').forEach((el) => {
      const id = el.dataset.widgetId;
      if (!id) return;
      /* 드래그 중 inline transform을 paint 전에 제거하고 최종 Slot 좌표를 측정한다. */
      if (dropRects?.has(id)) el.style.transform = '';
      const pos = { left: el.offsetLeft, top: el.offsetTop };
      next.set(id, pos);
      const first = dropRects?.get(id);
      if (first && !reduce) {
        const last = el.getBoundingClientRect();
        const k = screenPerCss(grid);
        const dx = (first.left - last.left) / k;
        const dy = (first.top - last.top) / k;
        if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) {
          el.getAnimations().forEach((animation) => animation.cancel());
          el.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
            { duration: REFLOW_MS, easing: REFLOW_EASING },
          );
        }
        return;
      }
      const prev = prevPositions.current.get(id);
      if (!prev || reduce || dropRects || el.classList.contains('is-dragging')) return;
      const dx = prev.left - pos.left;
      const dy = prev.top - pos.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: REFLOW_MS, easing: REFLOW_EASING });
    });
    prevPositions.current = next;
    positionDragged();
  });

  const endGesture = (commit: boolean) => {
    const g = gesture.current;
    if (!g) return;
    if (g.timer !== null) window.clearTimeout(g.timer);
    clearExpansion();
    gesture.current = null;
    if (!g.dragging) return;
    const finalPlan = planRef.current;
    const grid = gridRef.current;
    if (commit && finalPlan) {
      /* 현재 drag transform을 포함한 화면 좌표를 먼저 저장한다. asset 교체 시에는 새 id로 연결한다. */
      const firstRects = new Map<string, DOMRect>();
      grid?.querySelectorAll<HTMLElement>('.menu-slot').forEach((element) => {
        const id = element.dataset.widgetId;
        if (!id) return;
        const finalId = id === g.id ? finalPlan.replacement?.widget.assetId ?? id : id;
        firstRects.set(finalId, element.getBoundingClientRect());
      });
      dropFlipRects.current = firstRects;
      flushSync(() => {
        callbacks.current.onReorder(finalPlan.placements, finalPlan.replacement);
        setPlan(null);
        setDraggingId(null);
      });
      return;
    }

    const el = grid?.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(g.id)}"]`);
    const settle = el?.style.transform;
    if (el) el.style.transform = '';
    setPlan(null);
    setDraggingId(null);
    if (el && settle && !prefersReducedMotion()) {
      el.animate([{ transform: settle }, { transform: 'translate(0, 0)' }], { duration: REFLOW_MS, easing: REFLOW_EASING });
    }
  };

  const startDrag = (grid: HTMLUListElement, g: Gesture, event: ReactPointerEvent<HTMLElement>) => {
    const el = grid.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(g.id)}"]`);
    if (!el) return;
    /* 이전 SWAP 애니메이션 도중 다시 잡아도 새 pointer drag가 transform을 온전히 제어한다. */
    const visualRect = el.getBoundingClientRect();
    el.getAnimations().forEach((animation) => animation.cancel());
    const settledRect = el.getBoundingClientRect();
    const k = screenPerCss(grid);
    el.style.transform = `translate(${(visualRect.left - settledRect.left) / k}px, ${(visualRect.top - settledRect.top) / k}px)`;
    if (g.timer !== null) window.clearTimeout(g.timer);
    g.timer = null;
    const rect = visualRect;
    g.grabX = pointer.current.x - rect.left;
    g.grabY = pointer.current.y - rect.top;
    g.dragging = true;
    grid.setPointerCapture(event.pointerId);
    setDraggingId(g.id);
    setPlan(null);
    clearExpansion();
  };

  const updateDrag = (grid: HTMLUListElement, g: Gesture) => {
    positionDragged();
    if (!draggedElement()) return;
    const box = grid.getBoundingClientRect();
    const k = screenPerCss(grid);
    const style = window.getComputedStyle(grid);
    const gapX = Number.parseFloat(style.columnGap) || 0;
    const gapY = Number.parseFloat(style.rowGap) || 0;
    const cellWidth = (grid.offsetWidth - gapX * (COLUMNS - 1)) / COLUMNS;
    /* 행 높이가 px 로 고정된 grid(메뉴 관리 MY 메뉴)는 그 값을 쓴다 — 행이 1개뿐이어도 정확하다 */
    const fixedRow = Number.parseFloat(style.gridAutoRows);
    const cellHeight = Number.isFinite(fixedRow) ? fixedRow : (grid.offsetHeight - gapY * (ROWS - 1)) / ROWS;
    const left = (pointer.current.x - box.left - g.grabX) / k;
    const top = (pointer.current.y - box.top - g.grabY) / k;
    const col = Math.max(0, Math.min(COLUMNS - 1, Math.round(left / (cellWidth + gapX))));
    const row = Math.max(0, Math.min(ROWS - 1, Math.round(top / (cellHeight + gapY))));
    const dragged = itemsRef.current.find((item) => item.id === g.id);
    if (!dragged) return;
    if (dragged.size === '2x2') {
      if (col < 2) {
        setPlan(planDrop(itemsRef.current, g.id, 0, '2x2'));
        return;
      }
      const slot = row * COLUMNS + col;
      const plan = dragged.compactAssetId
        ? planDrop(itemsRef.current, g.id, slot, '1x1', dragged.compactAssetId)
        : null;
      setPlan(plan, { slot, span: 1, invalid: !plan });
      return;
    }
    if (col < 2 && dragged.expandedAsset) {
      const leftSlots = new Set([0, 1, 4, 5]);
      const blocked = itemsRef.current.some((item) => {
        if (item.id === dragged.id || typeof item.slot !== 'number') return false;
        const start = item.slot - 1;
        if (item.size === '1x1') return leftSlots.has(start);
        return true;
      });
      if (!blocked) {
        if (expandedPreviewAssetId === dragged.expandedAsset.assetId) {
          setPlan(planDrop(itemsRef.current, g.id, 0, '2x2', dragged.expandedAsset.assetId, dragged.expandedAsset.variant));
          return;
        }
        const oneByOnePlan = planOneByOneDrop(itemsRef.current, g.id, row * COLUMNS + col);
        setPlan(oneByOnePlan, { slot: 0, span: 2, invalid: false, waiting: true });
        if (expandCandidate.current !== dragged.id) {
          clearExpansion();
          expandCandidate.current = dragged.id;
          expandTimer.current = window.setTimeout(() => {
            const current = gesture.current;
            const latest = itemsRef.current.find((item) => item.id === dragged.id);
            if (!current?.dragging || current.id !== dragged.id || !latest?.expandedAsset) return;
            const expandedPlan = planDrop(itemsRef.current, dragged.id, 0, '2x2', latest.expandedAsset.assetId, latest.expandedAsset.variant);
            if (!expandedPlan) return;
            expandTimer.current = null;
            setExpandedPreviewAssetId(latest.expandedAsset.assetId);
            setPlan(expandedPlan);
          }, EXPAND_HOVER_MS);
        }
        return;
      }
    }
    clearExpansion();
    setPlan(planOneByOneDrop(itemsRef.current, g.id, row * COLUMNS + col));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (gesture.current) return;
    const target = event.target as HTMLElement;
    if (target.closest('.menu-slot__remove')) return;
    const slot = target.closest<HTMLElement>('.menu-slot');
    if (!slot?.dataset.widgetId) return;
    suppressClick.current = false;
    pointer.current = { x: event.clientX, y: event.clientY };
    const g: Gesture = { id: slot.dataset.widgetId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, longPressed: false, dragging: false, grabX: 0, grabY: 0, timer: null };
    gesture.current = g;
    if (!editingRef.current) {
      g.timer = window.setTimeout(() => {
        g.timer = null;
        g.longPressed = true;
        suppressClick.current = true;
        callbacks.current.onEnterEdit();
      }, LONG_PRESS_MS);
    }
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLUListElement>) => {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    pointer.current = { x: event.clientX, y: event.clientY };
    if (!g.dragging) {
      if (Math.hypot(event.clientX - g.startX, event.clientY - g.startY) < MOVE_THRESHOLD) return;
      if (editingRef.current || g.longPressed) {
        startDrag(event.currentTarget, g, event);
        if (g.dragging) updateDrag(event.currentTarget, g);
      } else endGesture(false);
      return;
    }
    updateDrag(event.currentTarget, g);
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLUListElement>) => { if (gesture.current?.pointerId === event.pointerId) endGesture(true); };
  const onPointerCancel = (event: ReactPointerEvent<HTMLUListElement>) => { if (gesture.current?.pointerId === event.pointerId) endGesture(false); };
  const onClickCapture = (event: ReactMouseEvent<HTMLUListElement>) => {
    if ((event.target as HTMLElement).closest('.menu-slot__remove')) return;
    if ((event.target as HTMLElement).closest('.menu-grid__empty-button')) return;
    if (editingRef.current || suppressClick.current) { suppressClick.current = false; event.preventDefault(); event.stopPropagation(); }
  };
  const onContextMenu = (event: ReactMouseEvent<HTMLUListElement>) => event.preventDefault();

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const block = (event: TouchEvent) => {
      const g = gesture.current;
      if (g && (g.dragging || g.longPressed || editingRef.current)) event.preventDefault();
    };
    grid.addEventListener('touchmove', block, { passive: false });
    return () => grid.removeEventListener('touchmove', block);
  }, [gridRef]);
  useEffect(() => {
    if (!editing) return;
    const outside = (event: PointerEvent) => {
      if (!gesture.current?.dragging && !sectionRef.current?.contains(event.target as Node)) callbacks.current.onExitEdit();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !gesture.current?.dragging) callbacks.current.onExitEdit(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [editing, sectionRef]);
  useEffect(() => () => {
    if (gesture.current?.timer != null) window.clearTimeout(gesture.current.timer);
    if (expandTimer.current !== null) window.clearTimeout(expandTimer.current);
  }, []);

  const dropPlaceholder = dropPreview ? {
    style: {
      gridColumn: `${(dropPreview.slot % COLUMNS) + 1} / span ${dropPreview.span}`,
      gridRow: `${Math.floor(dropPreview.slot / COLUMNS) + 1} / span ${dropPreview.span}`,
    } as CSSProperties,
    invalid: dropPreview.invalid,
    waiting: dropPreview.waiting ?? false,
  } : null;
  return {
    renderIds: items.map((item) => item.id),
    draggingId,
    expandedPreviewAssetId,
    dropPlaceholder,
    gridProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture, onContextMenu },
  };
}
