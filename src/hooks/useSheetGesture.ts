import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type { SheetState } from '../types';

const SHEET_TOP: Record<SheetState, number> = { peek: 575, expanded: 113 };
const DRAG_THRESHOLD = 40; // px

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
  const [state, setState] = useState<SheetState>('peek');
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

    const base = SHEET_TOP[stateRef.current];
    const top = Math.min(SHEET_TOP.peek, Math.max(SHEET_TOP.expanded, base + delta));
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
