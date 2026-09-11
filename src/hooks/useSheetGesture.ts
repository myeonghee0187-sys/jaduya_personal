import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type { SheetState } from '../types';

const SHEET_TOP: Record<SheetState, number> = { peek: 575, expanded: 113 };
const DRAG_THRESHOLD = 40; // px

/* 실기기(작은/짧은 화면)에서는 CSS 의 --sheet-top 이
 * calc(100% - 299px) 로 화면 높이에서 역산되므로, 드래그 중에도
 * 874px 프레임 기준 상수(SHEET_TOP) 를 그대로 쓰면 짧은 화면에서
 * 시트가 튄다. .sheet 의 offsetParent(.app) 실제 높이를 기준으로
 * peek/expanded px 를 CSS 와 동일한 공식(peek: 100% - 299px,
 * expanded: min(113px, peek))으로 다시 계산한다. .app 을 찾을 수
 * 없으면(테스트 환경 등) 기존 상수로 폴백한다. */
function getSheetTop(sheet: HTMLElement | null): Record<SheetState, number> {
  const parent = sheet?.offsetParent as HTMLElement | null;
  const appHeight = parent?.clientHeight;
  if (!appHeight) return SHEET_TOP;
  const peek = appHeight - 299;
  const expanded = Math.min(SHEET_TOP.expanded, peek);
  return { peek, expanded };
}

interface DragInfo {
  id: number;
  startY: number;
  y: number;
  moved: boolean;
}

/* js/home.js 의 Bottom Sheet 제스처를 그대로 옮긴 훅.
 *
 * 드래그 중에는 기존과 동일하게 sheet.style.top 을 직접 쓴다.
 * (프레임마다 setState 하면 시트가 끊긴다 — 원본의 의도된 설계)
 * 상태는 pointerup 에서 한 번만 커밋한다.
 */
export function useSheetGesture() {
  /* Figma 디자인상 Home 진입 시 기본 모습은 시트가 헤더 바로 아래까지 올라온
   * "expanded"(내 생활 위젯 + 자두가 알려드려요까지 보이는 모습)다 — peek(히어로만
   * 보이고 시트는 살짝 걸쳐 있는 상태)은 그 상태에서 아래로 내렸을 때의 모습이라
   * 기본값이 아니다. peek ↔ expanded 를 오가는 드래그/토글 로직 자체는 그대로다. */
  const [state, setState] = useState<SheetState>('expanded');
  const stateRef = useRef<SheetState>(state);
  stateRef.current = state;

  const sheetRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragInfo | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const apply = useCallback((next: SheetState) => {
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
    if (next === 'peek' && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const toggle = useCallback(() => {
    apply(stateRef.current === 'peek' ? 'expanded' : 'peek');
  }, [apply]);

  /* ---- Drag ---- */

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { id: e.pointerId, startY: e.clientY, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.id) return;
    drag.y = e.clientY;

    const delta = drag.y - drag.startY;
    if (Math.abs(delta) > 3) drag.moved = true;

    const bounds = getSheetTop(sheetRef.current);
    const base = bounds[stateRef.current];
    const top = Math.min(bounds.peek, Math.max(bounds.expanded, base + delta));
    if (sheetRef.current) sheetRef.current.style.top = `${top}px`;
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.id) return;

      const delta = drag.y - drag.startY;
      const moved = drag.moved;

      if (sheetRef.current) sheetRef.current.style.top = '';
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(drag.id)) {
        e.currentTarget.releasePointerCapture(drag.id);
      }
      dragRef.current = null;

      if (!moved) {
        toggle();
        return;
      }
      if (delta <= -DRAG_THRESHOLD) apply('expanded');
      else if (delta >= DRAG_THRESHOLD) apply('peek');
    },
    [apply, toggle],
  );

  /* ---- Keyboard ---- */

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowUp':
          e.preventDefault();
          apply('expanded');
          break;
        case 'ArrowDown':
          e.preventDefault();
          apply('peek');
          break;
        default:
          break;
      }
    },
    [apply, toggle],
  );

  /* ---- Wheel ----
   * React 의 onWheel 은 passive 로 붙어 preventDefault 가 통하지 않으므로
   * 원본과 동일하게 { passive: false } 로 직접 등록한다. */
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onWheel = (e: WheelEvent) => {
      const scroll = scrollRef.current;
      if (stateRef.current === 'peek' && e.deltaY > 0) {
        e.preventDefault();
        apply('expanded');
      } else if (
        stateRef.current === 'expanded' &&
        e.deltaY < 0 &&
        scroll &&
        scroll.scrollTop === 0
      ) {
        e.preventDefault();
        apply('peek');
      }
    };

    sheet.addEventListener('wheel', onWheel, { passive: false });
    return () => sheet.removeEventListener('wheel', onWheel);
  }, [apply]);

  return {
    state,
    isDragging,
    sheetRef,
    handleRef,
    scrollRef,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
    },
  };
}
