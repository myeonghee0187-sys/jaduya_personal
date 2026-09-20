import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type { SheetState } from '../types';

const DRAG_THRESHOLD = 40; // px
/** peek 일 때 시트가 보여주는 높이 — home.css .sheet 의 translateY(calc(100% - 299px)) 와 같은 값 */
const PEEK_VISIBLE_HEIGHT = 299;

/* 시트는 펼친 위치에 top 을 고정해 두고 transform: translateY 로만 움직인다(home.css .sheet).
 * shift = 펼친 위치에서 내려간 거리 — expanded 는 0, peek 는 (시트 높이 - 299px). CSS 와 같은
 * 식이라 실기기 화면 높이가 달라도 드래그 시작·끝에서 튀지 않는다. */
function getMaxShift(sheet: HTMLElement | null): number {
  return Math.max(0, (sheet?.offsetHeight ?? 0) - PEEK_VISIBLE_HEIGHT);
}

interface DragInfo {
  id: number;
  startY: number;
  y: number;
  moved: boolean;
  /** 드래그를 시작한 순간의 시트 위치(shift) 와 움직일 수 있는 최대 거리 */
  baseShift: number;
  maxShift: number;
}

/* js/home.js 의 Bottom Sheet 제스처를 그대로 옮긴 훅.
 *
 * 드래그 중에는 sheet.style.transform(translateY) 만 직접 쓴다 — 시트 안쪽 레이아웃은
 * 건드리지 않는다. (프레임마다 setState 하면 시트가 끊긴다 — 원본의 의도된 설계)
 * 상태는 pointerup 에서 한 번만 커밋한다.
 */
export function useSheetGesture() {
  /* Home 진입 시 기본 모습은 히어로(마스코트 일러스트 + 팁박스)가 먼저 보이는
   * "peek" 상태다 — 시트를 위로 드래그하거나 스크롤하면 "expanded"(내 생활 위젯 +
   * 자두가 알려드려요까지 보이는 모습)로 넘어간다. peek ↔ expanded 를 오가는
   * 드래그/토글 로직 자체는 그대로다. */
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
    const maxShift = getMaxShift(sheetRef.current);
    dragRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      y: e.clientY,
      moved: false,
      baseShift: stateRef.current === 'peek' ? maxShift : 0,
      maxShift,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.id) return;
    drag.y = e.clientY;

    const delta = drag.y - drag.startY;
    if (Math.abs(delta) > 3) drag.moved = true;

    /* 정수 px 로 옮긴다 — 소수점 위치에서는 안쪽 글자·테두리가 요소마다 다르게 반올림돼 흔들려 보인다 */
    /* 포인터 이동량은 화면 px, shift 는 CSS px — 데스크톱 iPhone 목업처럼 zoom 으로 줄여 보이는 화면에서는
     * 비율이 1 이 아니라서 그대로 쓰면 시트가 손가락보다 덜 움직인다 */
    const sheet = sheetRef.current;
    const screenPerCss = sheet && sheet.offsetHeight > 0 ? sheet.getBoundingClientRect().height / sheet.offsetHeight : 1;
    const shift = Math.round(Math.min(drag.maxShift, Math.max(0, drag.baseShift + delta / screenPerCss)));
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${shift}px)`;
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.id) return;

      const delta = drag.y - drag.startY;
      const moved = drag.moved;

      if (sheetRef.current) sheetRef.current.style.transform = '';
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
    /** 드래그/토글 없이 상태를 직접 지정한다 — 코치마크가 "내 생활" 아래쪽을 보여줘야
     * 할 때처럼, 사용자 제스처 없이도 peek ↔ expanded 를 강제로 넘길 때만 쓴다. */
    apply,
  };
}
