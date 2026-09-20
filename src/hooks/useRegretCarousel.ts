import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';

const SWIPE_DISTANCE = 45;
const TRANSITION_MS = 280;

type Gesture = {
  pointerId: number;
  x: number;
  y: number;
  axis: 'pending' | 'horizontal' | 'vertical';
};

/** 후기 전용 회전 상태. 체크 티켓이 쓰는 공용 캐러셀 훅에는 영향을 주지 않는다. */
export function useRegretCarousel(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const reduceMotion = useReducedMotion();
  const gestureRef = useRef<Gesture | null>(null);
  const lockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  const rotate = useCallback((direction: 1 | -1) => {
    if (lockedRef.current || count < 2) return;
    // React가 다시 그리기 전 들어오는 두 번째 이벤트도 같은 잠금을 확인한다.
    lockedRef.current = true;
    setIsAnimating(true);
    setActiveIndex((index) => (index + direction + count) % count);
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      setIsAnimating(false);
      timerRef.current = null;
    }, reduceMotion ? 0 : TRANSITION_MS + 32);
  }, [count, reduceMotion]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (lockedRef.current || gestureRef.current || count < 2 || !event.isPrimary || event.button !== 0) return;
    // 화살표에서 시작한 입력은 드래그·회전 상태에 아예 등록하지 않는다.
    if ((event.target as Element).closest('button, a, input, select, textarea')) return;
    gestureRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, axis: 'pending' };
    // 영역 밖에서 손을 떼도 종료를 받는다. 세로 터치는 pan-y와 pointercancel이 처리한다.
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* 캡처 미지원 환경 */ }
  }, [count]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || gesture.axis === 'vertical') return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (gesture.axis === 'pending') {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        gesture.axis = 'vertical';
        return;
      }
      gesture.axis = 'horizontal';
      setIsDragging(true);
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* 캡처 미지원 환경 */ }
    }
    if (event.cancelable) event.preventDefault();
    const limit = event.currentTarget.clientWidth * 0.75;
    setDragOffset(Math.max(-limit, Math.min(limit, dx)));
  }, []);

  const finishPointer = useCallback((event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (!cancelled && gesture.axis === 'horizontal') {
      const dx = event.clientX - gesture.x;
      if (Math.abs(dx) >= SWIPE_DISTANCE) rotate(dx < 0 ? 1 : -1);
    }
    setIsDragging(false);
    setDragOffset(0);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch { /* 이미 취소된 포인터 */ }
  }, [rotate]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    // 내부 화살표 버튼의 Enter/Space는 커뮤니티 이동 동작을 그대로 쓴다.
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    if (event.repeat || gestureRef.current) return;
    rotate(event.key === 'ArrowRight' ? 1 : -1);
  }, [rotate]);

  return {
    activeIndex, dragOffset, isDragging, isAnimating,
    viewportHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => finishPointer(event, false),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finishPointer(event, true),
      onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => finishPointer(event, true),
      onKeyDown,
    },
  };
}
