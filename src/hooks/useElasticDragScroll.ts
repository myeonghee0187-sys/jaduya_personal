import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const RESISTANCE = 0.35;
const MAX_STRETCH = 36; // px
const RELEASE_MS = 220;

interface DragInfo {
  id: number;
  startX: number;
  startScrollLeft: number;
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
    dragRef.current = { id: event.pointerId, startX: event.clientX, startScrollLeft: el.scrollLeft };
    el.setPointerCapture(event.pointerId);
    el.classList.add('is-dragging');
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<T>) => {
    const drag = dragRef.current;
    const el = ref.current;
    if (!drag || !el || drag.id !== event.pointerId) return;

    const delta = drag.startX - event.clientX;
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
