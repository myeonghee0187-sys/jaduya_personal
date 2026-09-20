import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react';

/* 홈 '내 메뉴' 그리드의 편집 제스처.
 *
 *   길게 누르기        → 편집 모드 진입 (짧게 탭하면 그대로 위젯 이동)
 *   편집 모드에서 잡기 → 드래그로 순서 변경, 주변 위젯은 자리를 비켜 재배치
 *   바깥 탭 / Esc      → 편집 종료 (드래그 중에는 종료하지 않는다)
 *
 * 위젯 배치의 source of truth 는 Home 의 items 하나다. 여기서는 드래그하는 동안만
 * 미리보기 순서(draftIds)를 들고 있다가, 놓는 순간 onReorder 로 넘기고 비운다.
 * 포인터 이벤트만 쓰고 별도 라이브러리는 없다. */

const LONG_PRESS_MS = 500;
/** 이 거리(px) 이상 움직여야 실제 끌기가 시작된다 — 누르자마자 카드가 움직이지 않게 (스크롤도 이걸로 구분) */
const MOVE_THRESHOLD = 8;
const COLUMNS = 4;
/** 주변 위젯이 자리를 옮기는 시간·곡선 — 천천히 감속하는 ease-out */
const REFLOW_MS = 240;
const REFLOW_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';
/** 순서를 바꾸려면 손가락이 옮겨 갈 칸의 '중심부'에 들어와야 한다 — 칸 폭·높이의 이 비율만큼이 중심부.
 * 칸 가장자리에 스치거나 몇 px 흔들리는 정도로는 순서가 바뀌지 않는다. */
const REORDER_ZONE = 0.5;
/** 한 번 순서가 바뀐 뒤 다음 변경까지의 최소 간격(ms) — 두 칸 사이를 왔다 갔다 하며 떠는 것을 막는다 */
const REORDER_COOLDOWN_MS = 160;

interface Gesture {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  longPressed: boolean;
  dragging: boolean;
  grabX: number;
  grabY: number;
  timer: number | null;
}

interface Options {
  gridRef: RefObject<HTMLUListElement>;
  sectionRef: RefObject<HTMLElement>;
  /** 지금 홈에 놓인 위젯 id — order 순서 */
  ids: string[];
  editing: boolean;
  onEnterEdit: () => void;
  onExitEdit: () => void;
  /** 드래그를 놓았을 때 새 순서 */
  onReorder: (ids: string[]) => void;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 화면 px 과 CSS px 의 비율. 데스크톱 iPhone 목업은 앱을 zoom(< 1)으로 줄여 보여줘서
 * getBoundingClientRect / 포인터 좌표(화면 px)와 offsetLeft·offsetWidth·transform(CSS px)이 서로
 * 다른 단위다. 두 단위를 섞어 빼면 위젯이 엉뚱한 자리에서 출발해 그리드 전체가 쪼그라들었다 커지므로,
 * 화면 px 로 잰 값은 반드시 이 비율로 나눠 CSS px 로 바꿔서 쓴다. 배율이 없는 실기기에서는 1이다. */
const screenPerCss = (el: HTMLElement) => (el.offsetWidth > 0 ? el.getBoundingClientRect().width / el.offsetWidth : 1);

export function useMenuGridEdit({ gridRef, sectionRef, ids, editing, onEnterEdit, onExitEdit, onReorder }: Options) {
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  /* 이벤트 핸들러는 렌더마다 새로 만들어지므로 최신 값은 ref 로 읽는다 */
  const gesture = useRef<Gesture | null>(null);
  const draftRef = useRef<string[] | null>(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const callbacks = useRef({ onEnterEdit, onExitEdit, onReorder });
  callbacks.current = { onEnterEdit, onExitEdit, onReorder };
  const suppressClick = useRef(false);
  const lastReorderAt = useRef(0);
  const reorderTimer = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const prevPositions = useRef(new Map<string, { left: number; top: number }>());

  const setDraft = (next: string[] | null) => {
    draftRef.current = next;
    setDraftIds(next);
  };

  const draggedElement = (): HTMLElement | null => {
    const g = gesture.current;
    if (!g?.dragging) return null;
    return gridRef.current?.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(g.id)}"]`) ?? null;
  };

  /* 잡고 있는 위젯을 손가락 위치에 붙인다 — 배치 위치(offsetLeft/Top)가 바뀔 때마다 다시 계산 */
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

  /* 순서가 바뀌면(드래그·삭제) 자리가 바뀐 위젯이 이전 자리에서 새 자리로 미끄러지게 한다(FLIP) */
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const reduce = prefersReducedMotion();
    const next = new Map<string, { left: number; top: number }>();

    grid.querySelectorAll<HTMLElement>('.menu-slot').forEach((el) => {
      const id = el.dataset.widgetId;
      if (!id) return;
      const pos = { left: el.offsetLeft, top: el.offsetTop };
      next.set(id, pos);
      const prev = prevPositions.current.get(id);
      if (!prev || reduce || el.classList.contains('is-dragging')) return;
      /* 배치가 실제로 바뀐 위젯만 움직인다 — 다른 이유로 다시 그려질 때(시트 드래그 등)는 건드리지 않는다 */
      const shiftX = prev.left - pos.left;
      const shiftY = prev.top - pos.top;
      if (Math.abs(shiftX) < 0.5 && Math.abs(shiftY) < 0.5) return;
      /* 아직 움직이던 중이면 그 위치에서 이어서 움직이도록, 지금 적용 중인 이동량(CSS px)을 더한다 */
      const current = new DOMMatrix(window.getComputedStyle(el).transform);
      const dx = shiftX + current.m41;
      const dy = shiftY + current.m42;
      el.getAnimations().forEach((animation) => animation.cancel());
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: REFLOW_MS, easing: REFLOW_EASING },
      );
    });

    prevPositions.current = next;
    positionDragged();
  });

  const endGesture = (commit: boolean) => {
    const g = gesture.current;
    if (!g) return;
    if (g.timer !== null) window.clearTimeout(g.timer);
    if (reorderTimer.current !== null) {
      window.clearTimeout(reorderTimer.current);
      reorderTimer.current = null;
    }
    gesture.current = null;
    if (!g.dragging) return;

    const el = gridRef.current?.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(g.id)}"]`);
    const settle = el?.style.transform;
    if (el) el.style.transform = '';
    /* 놓는 순간 손가락 위치에서 자기 자리로 내려앉는다 */
    if (el && settle && !prefersReducedMotion()) {
      el.animate([{ transform: settle }, { transform: 'translate(0, 0)' }], {
        duration: REFLOW_MS,
        easing: REFLOW_EASING,
      });
    }

    const finalIds = draftRef.current;
    setDraft(null);
    setDraggingId(null);
    if (commit && finalIds) callbacks.current.onReorder(finalIds);
  };

  const startDrag = (grid: HTMLUListElement, g: Gesture, event: ReactPointerEvent<HTMLElement>) => {
    const el = grid.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(g.id)}"]`);
    if (!el) return;
    if (g.timer !== null) {
      window.clearTimeout(g.timer);
      g.timer = null;
    }
    /* 끌기가 시작되는 그 지점을 잡은 것으로 본다 — 활성 거리만큼 카드가 툭 튀지 않고 거기서부터 따라온다 */
    const rect = el.getBoundingClientRect();
    g.grabX = pointer.current.x - rect.left;
    g.grabY = pointer.current.y - rect.top;
    g.dragging = true;
    lastReorderAt.current = 0;
    /* 이제부터 포인터는 그리드가 받는다 — 순서가 바뀌며 위젯 DOM 이 옮겨져도 끊기지 않게 */
    grid.setPointerCapture(event.pointerId);
    setDraft([...ids]);
    setDraggingId(g.id);
  };

  /* 카드는 손가락을 그대로 따라오고, 주변 위젯의 재배치는 여기서 차분하게 판단한다 */
  const updateDrag = (grid: HTMLUListElement, g: Gesture) => {
    positionDragged();

    const list = draftRef.current;
    const el = grid.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(g.id)}"]`);
    if (!list || !el) return;

    const box = grid.getBoundingClientRect();
    const k = screenPerCss(grid);
    const style = window.getComputedStyle(grid);
    const gapX = Number.parseFloat(style.columnGap) || 0;
    const gapY = Number.parseFloat(style.rowGap) || 0;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const px = (pointer.current.x - box.left) / k;
    const py = (pointer.current.y - box.top) / k;
    const col = Math.floor(px / (w + gapX));
    const row = Math.floor(py / (h + gapY));
    if (col < 0 || col >= COLUMNS || row < 0) return;

    /* 그 칸의 중심부에 들어왔을 때만 */
    const localX = px - col * (w + gapX);
    const localY = py - row * (h + gapY);
    if (Math.abs(localX - w / 2) > (w * REORDER_ZONE) / 2) return;
    if (Math.abs(localY - h / 2) > (h * REORDER_ZONE) / 2) return;

    /* 마지막 줄의 빈 칸 중심부는 맨 끝으로 옮기는 것으로 본다 */
    const target = Math.min(row * COLUMNS + col, list.length - 1);
    const from = list.indexOf(g.id);
    if (from === -1 || from === target) return;

    /* 방금 바뀌었다면 잠깐 기다렸다가, 그때도 그 자리에 있으면 바꾼다 */
    const wait = REORDER_COOLDOWN_MS - (performance.now() - lastReorderAt.current);
    if (wait > 0) {
      if (reorderTimer.current === null) {
        reorderTimer.current = window.setTimeout(() => {
          reorderTimer.current = null;
          const current = gesture.current;
          const currentGrid = gridRef.current;
          if (current?.dragging && currentGrid) updateDrag(currentGrid, current);
        }, wait);
      }
      return;
    }

    const next = [...list];
    next.splice(from, 1);
    next.splice(target, 0, g.id);
    lastReorderAt.current = performance.now();
    setDraft(next);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (gesture.current) return; /* 두 번째 손가락은 무시 */
    const target = event.target as HTMLElement;
    if (target.closest('.menu-slot__remove')) return;
    const slot = target.closest<HTMLElement>('.menu-slot');
    if (!slot?.dataset.widgetId) return;

    suppressClick.current = false;
    pointer.current = { x: event.clientX, y: event.clientY };
    const g: Gesture = {
      id: slot.dataset.widgetId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      longPressed: false,
      dragging: false,
      grabX: 0,
      grabY: 0,
      timer: null,
    };
    gesture.current = g;

    if (!editingRef.current) {
      g.timer = window.setTimeout(() => {
        g.timer = null;
        g.longPressed = true;
        /* 길게 누른 뒤에 따라오는 click 은 위젯 이동으로 이어지지 않게 막는다 */
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
        /* 빠르게 끌어서 첫 move 가 이미 다른 칸이어도 그 칸으로 바로 반영한다 */
        if (g.dragging) updateDrag(event.currentTarget, g);
      } else {
        /* 편집 모드가 아닌데 움직였다 = 스크롤/스와이프. 길게 누르기를 취소한다 */
        endGesture(false);
      }
      return;
    }
    updateDrag(event.currentTarget, g);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (gesture.current && event.pointerId === gesture.current.pointerId) endGesture(true);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (gesture.current && event.pointerId === gesture.current.pointerId) endGesture(false);
  };

  /* 편집 중에는 위젯 이동을 잠시 끄고, 길게 누른 직후의 click 도 삼킨다. 삭제(-) 버튼은 통과. */
  const onClickCapture = (event: ReactMouseEvent<HTMLUListElement>) => {
    if ((event.target as HTMLElement).closest('.menu-slot__remove')) return;
    if (editingRef.current || suppressClick.current) {
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  /* 길게 누를 때 뜨는 브라우저 컨텍스트 메뉴를 막는다 */
  const onContextMenu = (event: ReactMouseEvent<HTMLUListElement>) => event.preventDefault();

  /* 편집 중이거나 길게 누른 손가락이 끌기 시작할 때 화면(시트)이 같이 스크롤되지 않게 한다 */
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

  /* 편집 종료: 내 메뉴 영역 밖을 누르거나 Esc. 드래그 중에는 종료하지 않는다. */
  useEffect(() => {
    if (!editing) return;
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (gesture.current?.dragging) return;
      if (sectionRef.current?.contains(event.target as Node)) return;
      callbacks.current.onExitEdit();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !gesture.current?.dragging) callbacks.current.onExitEdit();
    };
    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [editing, sectionRef]);

  useEffect(() => () => {
    if (gesture.current?.timer != null) window.clearTimeout(gesture.current.timer);
  }, []);

  return {
    /** 그릴 순서 — 드래그 중에는 미리보기 순서, 아니면 ids 그대로 */
    renderIds: draftIds ?? ids,
    draggingId,
    gridProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture, onContextMenu },
  };
}
