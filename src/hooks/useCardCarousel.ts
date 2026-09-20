import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/* 카드 한 칸씩 넘기는 캐러셀 — 생활 페이지(LifePage.tsx) "자취생들의 해결팁" 캐러셀과
 * 같은 조작 방식을 쓴다:
 *   - 좌우 버튼은 양 끝에서도 비활성화하지 않는다. 마지막에서 다음을 누르면 처음으로,
 *     처음에서 이전을 누르면 마지막으로 이어진다(무한 루프) — 버튼이 죽어있는 순간이 없다.
 *   - 스와이프는 가로 이동이 세로 이동의 axisRatio 배를 넘어야 카드 이동으로 본다 —
 *     그 전까지는 세로 스크롤로 보고 그대로 흘려보낸다(페이지 스크롤을 가로채지 않는다).
 *   - 드래그 중에는 transition 을 꺼서 손가락을 그대로 따라가고, 손을 떼면 다시 켜서
 *     자연스럽게 다음/이전 칸(또는 원래 자리)으로 미끄러진다.
 *
 * 실제 카드 폭을 몰라도 되도록 이동 거리는 "현재 칸(%) + 드래그 중 오프셋(px)" 으로만
 * 계산한다 — 트랙에는 `translateX(calc(-${index * 100}% + ${dragOffset}px))` 를 그대로
 * 쓰면 된다(라이브러리 없이 순수 CSS transform 하나로 충분하다). */

interface UseCardCarouselOptions {
  /** 전체 칸 수 — 데이터 배열의 length 를 그대로 넘긴다. 데이터가 늘어나도 이 값만 커질 뿐
   * 캐러셀 로직은 그대로다. */
  count: number;
  /** 스와이프로 다음 칸까지 넘기는 데 필요한 최소 드래그 거리(px) — 생활 페이지와 같은 값 */
  swipeThreshold?: number;
  /** 가로/세로 방향을 가르는 기준 비율 — 생활 페이지와 같은 값(가로 이동이 세로의 이 배수를
   * 넘어야 스와이프로 본다) */
  axisRatio?: number;
  /** 처음·마지막에서 이어붙일지 여부. 기본값 true 는 위 주석의 무한 루프 동작 그대로다.
   * false 면 첫 칸에서 이전, 마지막 칸에서 다음이 모두 제자리에 머물고(루프 없음),
   * 양 끝에서 더 당기면 드래그 오프셋도 줄여 끝이라는 걸 손끝으로 알려준다. */
  loop?: boolean;
}

interface SwipeTracking {
  pointerId: number;
  startX: number;
  startY: number;
  axis: 'x' | 'y' | 'none';
}

export interface CardCarousel {
  /** 지금 보이는 칸 */
  index: number;
  goTo: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  /** 드래그 중 손가락을 따라가는 px 오프셋 — 드래그가 끝나면 0으로 돌아간다 */
  dragOffset: number;
  /** 드래그 중인 동안만 true — 이 동안 트랙의 transition 을 꺼야 손가락을 그대로 따라간다 */
  isDragging: boolean;
  /** 캐러셀 뷰포트(스와이프를 받을 요소)에 그대로 펼쳐서 쓴다 */
  viewportHandlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  };
}

export function useCardCarousel({
  count,
  swipeThreshold = 45,
  axisRatio = 1.4,
  loop = true,
}: UseCardCarouselOptions): CardCarousel {
  const [index, setIndexState] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const indexRef = useRef(0);
  const swipeRef = useRef<SwipeTracking | null>(null);

  const wrap = useCallback(
    (value: number) => {
      if (count <= 0) return 0;
      if (!loop) return Math.min(count - 1, Math.max(0, value));
      return ((value % count) + count) % count;
    },
    [count, loop],
  );

  const setIndex = useCallback(
    (value: number) => {
      const next = wrap(value);
      indexRef.current = next;
      setIndexState(next);
    },
    [wrap],
  );

  /* 선택한 관심 주제 수가 바뀌는 등 count 자체가 바뀌면 index 가 범위를 벗어날 수 있다 —
   * 그때만 다시 wrap 해서 안전한 값으로 되돌린다. */
  useEffect(() => {
    setIndex(indexRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const goTo = useCallback((value: number) => setIndex(value), [setIndex]);
  const goNext = useCallback(() => setIndex(indexRef.current + 1), [setIndex]);
  const goPrev = useCallback(() => setIndex(indexRef.current - 1), [setIndex]);

  /* 루프를 쓰지 않을 때 양 끝에서 더 당기면 따라오는 거리를 줄인다 — 넘어갈 칸이
   * 없다는 걸 손끝으로 알려주고, 손을 떼면 제자리로 돌아간다. */
  const resist = useCallback(
    (dx: number) => {
      if (loop) return dx;
      const atStart = indexRef.current === 0 && dx > 0;
      const atEnd = indexRef.current === count - 1 && dx < 0;
      return atStart || atEnd ? dx * 0.3 : dx;
    },
    [count, loop],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (count <= 1) return;
      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        axis: 'none',
      };
    },
    [count],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId || swipe.axis === 'y') return;
      const dx = event.clientX - swipe.startX;
      const dy = event.clientY - swipe.startY;
      if (swipe.axis === 'none') {
        /* 8px 안에서는 아직 방향을 정하지 않는다(떨림 방지) */
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dx) <= Math.abs(dy) * axisRatio) {
          swipe.axis = 'y';
          return;
        }
        swipe.axis = 'x';
        setIsDragging(true);
        /* 일부 환경(테스트 자동화, 오래된 WebView)에서는 setPointerCapture 자체가
         * 던지기도 한다 — 캡처는 손가락이 카드 밖으로 나가도 드래그를 계속 받기 위한
         * 보조 수단일 뿐이라, 실패해도 이후 로직(오프셋 계산·스냅)은 그대로 진행한다. */
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* 캡처 실패는 무시 — 드래그 자체는 계속 동작한다 */
        }
      }
      event.preventDefault();
      setDragOffset(resist(dx));
    },
    [axisRatio, resist],
  );

  const endSwipe = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      swipeRef.current = null;
      if (!swipe) return;
      if (swipe.axis === 'x') {
        const dx = event.clientX - swipe.startX;
        if (dx <= -swipeThreshold) goNext();
        else if (dx >= swipeThreshold) goPrev();
        try {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        } catch {
          /* 캡처 해제 실패는 무시 */
        }
      }
      setIsDragging(false);
      setDragOffset(0);
    },
    [goNext, goPrev, swipeThreshold],
  );

  return {
    index,
    goTo,
    goNext,
    goPrev,
    dragOffset,
    isDragging,
    viewportHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endSwipe,
      onPointerCancel: endSwipe,
    },
  };
}
