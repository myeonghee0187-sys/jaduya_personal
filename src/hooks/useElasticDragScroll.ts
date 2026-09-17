import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const RESISTANCE = 0.35;
const MAX_STRETCH = 36; // px
const RELEASE_MS = 220;
/* 이 정도 안 움직이면 드래그가 아니라 그냥 탭(클릭)으로 본다 */
const DRAG_THRESHOLD = 4; // px

interface DragInfo {
  id: number;
  startX: number;
  startScrollLeft: number;
  /** 실제로 threshold 를 넘어서 드래그로 판단해 포인터를 캡처했는지 */
  captured: boolean;
}

/* 가로 스크롤 줄(카드 리스트 등)을 마우스로도 클릭+드래그해서 넘길 수 있게 하고,
 * 맨 처음/맨 끝을 넘어서 당기면 고무줄처럼 살짝 저항을 주며 늘어났다가 손을 떼면
 * 제자리로 튕겨 돌아오게 한다 (iOS 오버스크롤 바운스와 같은 느낌). */
export function useElasticDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const dragRef = useRef<DragInfo | null>(null);

  const settle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = `transform ${RELEASE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    el.style.transform = 'translateX(0)';
    window.setTimeout(() => {
      el.style.transition = '';
    }, RELEASE_MS);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<T>) => {
    if (event.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    el.style.transition = '';
    /* 여기서 바로 setPointerCapture 를 걸면 안의 칩/버튼을 그냥 탭(클릭)했을 때도 이후
     * pointerup 이 버튼이 아니라 이 컨테이너로 캡처돼버려서 버튼의 click 이 아예 안 울렸다
     * ("카테고리 탭이 작동 안 한다"의 원인) — threshold 를 넘어서 실제로 움직인 게 확인될
     * 때(onPointerMove)만 캡처한다. */
    dragRef.current = { id: event.pointerId, startX: event.clientX, startScrollLeft: el.scrollLeft, captured: false };
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<T>) => {
    const drag = dragRef.current;
    const el = ref.current;
    if (!drag || !el || drag.id !== event.pointerId) return;

    const delta = drag.startX - event.clientX;

    if (!drag.captured) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      drag.captured = true;
      el.setPointerCapture(event.pointerId);
      el.classList.add('is-dragging');
    }

    const maxScroll = el.scrollWidth - el.clientWidth;
    const rawTarget = drag.startScrollLeft + delta;

    let excess = 0;
    if (rawTarget < 0) excess = rawTarget;
    else if (rawTarget > maxScroll) excess = rawTarget - maxScroll;

    el.scrollLeft = Math.min(maxScroll, Math.max(0, rawTarget));

    const stretch = Math.max(-MAX_STRETCH, Math.min(MAX_STRETCH, -excess * RESISTANCE));
    el.style.transform = stretch ? `translateX(${stretch}px)` : '';
  }, []);

  const endDrag = useCallback(
    (event: ReactPointerEvent<T>) => {
      const drag = dragRef.current;
      const el = ref.current;
      if (!drag || !el || drag.id !== event.pointerId) return;
      dragRef.current = null;
      if (!drag.captured) return;
      el.classList.remove('is-dragging');
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
      settle();
    },
    [settle],
  );

  return {
    ref,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
