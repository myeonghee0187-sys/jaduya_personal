import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';

/** 이 거리(px)를 넘겨야 한 장이 넘어간다. 그보다 짧은 터치는 제자리로 돌아온다. */
const SWIPE_DISTANCE = 45;
/** 앞 카드가 옆으로 빠져나가는 시간. 다 빠져나간 뒤에야 순서를 한 칸 돌린다. */
const EXIT_MS = 220;
/** 순서를 돌린 뒤 다음 입력을 받기까지의 여유. 뒷장이 올라오는 동안의 중복 입력만 막는다. */
const SETTLE_MS = 90;
/** 이 거리 안에서는 가로·세로를 판정하지 않는다. 손가락이 떨린 정도는 제스처가 아니다. */
const AXIS_SLOP = 8;

type Gesture = {
  pointerId: number;
  x: number;
  y: number;
  axis: 'pending' | 'horizontal' | 'vertical';
};

export interface RegretCarousel {
  /** 맨 앞에 있는 카드의 원본 배열 인덱스. 이 값 하나만 순서를 만든다. */
  activeIndex: number;
  dragOffset: number;
  isDragging: boolean;
  isAnimating: boolean;
  /** 앞 카드가 빠져나가는 가로 방향. -1 왼쪽, 1 오른쪽, 0 이면 빠져나가는 중이 아니다. */
  exitSign: 0 | 1 | -1;
  /** 순서를 돌린 직후 한 프레임. 위치가 바뀐 카드가 화면을 가로질러 이동하지 않게 한다. */
  isSettling: boolean;
  settlingDepth: number;
  reduceMotion: boolean;
  move: (step: -1 | 1) => boolean;
  viewportHandlers: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  };
}

/* 후기 전용 회전 상태. 체크 티켓이 쓰는 공용 캐러셀 훅에는 영향을 주지 않는다.
 *
 * 카드는 언제나 세 장 모두 그려져 있고, 이 훅은 "맨 앞이 몇 번 카드인가"(activeIndex)
 * 하나만 들고 있다. 넘기는 동작은 두 단계로 나뉜다.
 *   1) exitSign 을 세워 앞 카드를 옆으로 내보낸다. 이 동안 activeIndex 는 그대로다.
 *   2) EXIT_MS 뒤에 advance() 로 순서를 한 칸 옮긴다.
 * 두 단계를 나누지 않으면 손을 떼는 순간 앞 카드가 뒤로 순간이동하면서
 * 화면을 가로질러 되돌아가는 것처럼 보인다.
 *
 * 왼쪽으로 넘기면 다음 카드, 오른쪽으로 넘기면 이전 카드가 올라온다. */
export function useRegretCarousel(count: number): RegretCarousel {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitSign, setExitSign] = useState<0 | 1 | -1>(0);
  const [isSettling, setIsSettling] = useState(false);
  const [settlingDepth, setSettlingDepth] = useState(count - 1);
  const reduceMotion = useReducedMotion() ?? false;
  const gestureRef = useRef<Gesture | null>(null);
  const lockedRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
    if (unlockTimerRef.current !== null) clearTimeout(unlockTimerRef.current);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const unlockAfter = useCallback((delay: number) => {
    unlockTimerRef.current = setTimeout(() => {
      unlockTimerRef.current = null;
      lockedRef.current = false;
      setIsAnimating(false);
    }, delay);
  }, []);

  /* 순서를 한 칸 옮긴다 — 이 캐러셀에서 순서를 바꾸는 곳은 여기 하나뿐이다.
   * 위치가 바뀐 카드는 한 프레임 동안 애니메이션을 끄고 제자리에 가져다 둔 뒤(isSettling),
   * 다음 프레임에 그 자리에서 다시 보이게 한다. */
  const advance = useCallback((step: -1 | 1) => {
    setActiveIndex((index) => (index + step + count) % count);
    setExitSign(0);
    setDragOffset(0);
    setSettlingDepth(step === 1 ? count - 1 : 1);
    setIsSettling(true);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setIsSettling(false);
      });
    });
  }, [count]);

  /* 다음 카드는 왼쪽, 이전 카드는 오른쪽으로 내보낸 뒤 순서를 옮긴다.
   * 회전을 시작했으면 true. 잠겨 있으면 아무것도 하지 않고 false 를 준다. */
  const move = useCallback((step: -1 | 1) => {
    if (lockedRef.current || gestureRef.current || count < 2) return false;
    // React 가 다시 그리기 전 들어오는 두 번째 이벤트도 같은 잠금을 확인한다.
    lockedRef.current = true;
    setIsAnimating(true);
    if (reduceMotion) {
      // 큰 이동을 만들지 않고 순서만 바꾼다.
      advance(step);
      unlockAfter(0);
      return true;
    }
    setExitSign(step === 1 ? -1 : 1);
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      advance(step);
      unlockAfter(SETTLE_MS);
    }, EXIT_MS);
    return true;
  }, [advance, count, reduceMotion, unlockAfter]);

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
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_SLOP) return;
      // 세로로 더 많이 움직였으면 이 제스처는 끝까지 페이지 스크롤이다.
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
    const dx = event.clientX - gesture.x;
    const swiped = !cancelled && gesture.axis === 'horizontal' && Math.abs(dx) >= SWIPE_DISTANCE;
    setIsDragging(false);
    // 넘어가는 경우에는 붙잡고 있던 위치에서 그대로 이어서 빠져나가야 한다.
    // dragOffset 은 advance() 에서 0 으로 되돌린다.
    // 회전이 시작되지 않았으면(잠금 중) 붙잡고 있던 위치를 제자리로 되돌린다.
    if (!swiped || !move(dx < 0 ? 1 : -1)) setDragOffset(0);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch { /* 이미 취소된 포인터 */ }
  }, [move]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    // 내부 화살표 버튼의 Enter/Space는 커뮤니티 이동 동작을 그대로 쓴다.
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    if (event.repeat || gestureRef.current) return;
    move(event.key === 'ArrowRight' ? 1 : -1);
  }, [move]);

  return {
    activeIndex, dragOffset, isDragging, isAnimating, exitSign, isSettling, settlingDepth, reduceMotion, move,
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
