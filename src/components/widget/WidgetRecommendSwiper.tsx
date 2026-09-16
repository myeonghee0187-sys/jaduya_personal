import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import type { WidgetDef } from '../../data/widgetRegistry';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { WidgetRecommendCard } from './WidgetRecommendCard';

/* "추천 위젯" 가로 Swiper — 돈관리 "카테고리별 소비"의 CategorySwiper.tsx와 같은 결의
 * 인터랙션(네이티브 overflow-x + scroll-snap을 기반으로, 마우스 드래그와 점 페이지네이션만
 * 얹는다)을 이 화면 전용으로 그대로 옮겼다. 화면(브랜치)마다 다른 파일이라 공용 훅으로
 * 묶지 않고 그대로 복제한다. */

const DRAG_MOVE_TOLERANCE = 6;
/* 자동으로 다음 페이지로 넘어가는 간격 — 사용자가 직접 조작한 뒤 다시 재생을
 * 시작하기까지의 대기 시간도 동일하게 맞춘다. */
const AUTO_SCROLL_INTERVAL_MS = 4000;

/* 카드 4장이 clientWidth(한 페이지 폭)에 정확히 나누어떨어지지 않아서(예: 카드 폭 175px ×
 * 4 = 700px가 346px 페이지 폭의 정확히 2배가 아님), "페이지 = clientWidth × n" 으로
 * 계산하면 마지막 페이지 목표 지점이 실제 스크롤 가능한 최대 거리(scrollWidth-clientWidth)를
 * 넘어서서 브라우저가 조용히 clamp해버린다. 그러면 scrollLeft로 역산한 현재 페이지 번호가
 * 실제와 어긋나 자동 재생이 같은 자리에서 멈추거나 다음 바퀴에 엉뚱한 페이지로 튄다
 * (요구사항 아님, 발견된 버그 수정). 대신 [0, 실제 최대 스크롤 거리] 구간을
 * pageCount-1 등분해 페이지 목표/현재 페이지를 계산한다 — 마지막 페이지는 항상 정확히
 * 최대 스크롤 지점에 닿고, 첫 페이지는 항상 정확히 0에 닿는다. */
function maxScrollOf(el: HTMLElement): number {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

function scrollTargetFor(el: HTMLElement, page: number, pageCount: number): number {
  if (pageCount <= 1) return 0;
  return (page / (pageCount - 1)) * maxScrollOf(el);
}

function currentPageOf(el: HTMLElement, pageCount: number): number {
  const max = maxScrollOf(el);
  if (max <= 0 || pageCount <= 1) return 0;
  const idx = Math.round((el.scrollLeft / max) * (pageCount - 1));
  return Math.max(0, Math.min(pageCount - 1, idx));
}

interface WidgetRecommendSwiperProps {
  widgets: WidgetDef[];
  onSelect: (widgetId: string) => void;
}

export function WidgetRecommendSwiper({ widgets, onSelect }: WidgetRecommendSwiperProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  /* 자동 재생 일시정지 — 사용자가 방금 만졌으면 true. 닫는 타이머가 지나면 스스로 풀린다. */
  const autoPausedRef = useRef(false);
  const resumeTimerRef = useRef<number>();
  const reduceMotion = usePrefersReducedMotion();

  const recomputePageCount = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth <= 0) return;
    setPageCount(Math.max(1, Math.ceil((el.scrollWidth - 1) / el.clientWidth)));
  }, []);

  useEffect(() => {
    recomputePageCount();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', recomputePageCount);
      return () => window.removeEventListener('resize', recomputePageCount);
    }
    const observer = new ResizeObserver(recomputePageCount);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recomputePageCount, widgets.length]);

  /* 화면에 보일 때만 자동 재생한다 — 스크롤로 내려가 안 보이는 동안 계속 넘어가지 않게 */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.4,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* 사용자가 직접 넘기면 잠시 자동 재생을 멈추고, AUTO_SCROLL_INTERVAL_MS 뒤에 스스로 재개한다 */
  const pauseAutoScroll = useCallback(() => {
    autoPausedRef.current = true;
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      autoPausedRef.current = false;
    }, AUTO_SCROLL_INTERVAL_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(resumeTimerRef.current), []);

  /* 자동 재생 — reduced motion을 켠 사용자, 페이지가 1장뿐일 때, 화면 밖일 때는 돌지 않는다.
   * 탭이 백그라운드에 있을 때도 매 tick마다 document.hidden을 확인해서 건너뛴다. */
  useEffect(() => {
    if (reduceMotion || pageCount <= 1 || !isVisible) return;
    const id = window.setInterval(() => {
      if (autoPausedRef.current || document.hidden) return;
      const el = trackRef.current;
      if (!el || el.clientWidth <= 0) return;
      const current = currentPageOf(el, pageCount);
      const next = (current + 1) % pageCount;
      el.scrollTo({ left: scrollTargetFor(el, next, pageCount), behavior: 'smooth' });
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, pageCount, isVisible]);

  const goToPage = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, index));
    el.scrollTo({ left: scrollTargetFor(el, clamped, pageCount), behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth <= 0) return;
    const idx = currentPageOf(el, pageCount);
    setPage((prev) => (idx === prev ? prev : idx));
  };

  const pointerIdRef = useRef<number | null>(null);

  /* 마우스 드래그로 스크롤 — 터치는 브라우저 네이티브 스크롤이 이미 처리하므로 mouse 포인터일 때만 개입한다.
   * setPointerCapture는 down 시점이 아니라 실제로 DRAG_MOVE_TOLERANCE를 넘겨 움직인 뒤에만 건다 —
   * down 즉시 걸면(포인터 캡처가 클릭 이벤트의 타겟 결정에 관여해) 카드를 그냥 눌렀다 뗀
   * 클릭조차 카드의 onClick까지 전달되지 않고 사라지는 문제가 있었다(움직임이 전혀 없어도). */
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    /* 마우스 드래그든 터치 스와이프든, 사용자가 손을 댄 순간엔 항상 자동 재생을 멈춘다
     * (터치는 이 아래 로직 없이 네이티브 스크롤로 넘어가지만 pointerdown 자체는 그대로 온다) */
    pauseAutoScroll();
    if (e.pointerType !== 'mouse') return;
    const el = trackRef.current;
    if (!el) return;
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
    pointerIdRef.current = e.pointerId;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > DRAG_MOVE_TOLERANCE) {
      /* 진짜 드래그로 확정된 첫 순간에만 캡처한다 — 이후 커서가 트랙 밖으로 나가도
       * move/up 이 계속 이 엘리먼트로 들어온다(클릭에는 영향 없다, 이미 드래그로 확정됐으니). */
      if (!movedRef.current && pointerIdRef.current !== null) {
        el.setPointerCapture(pointerIdRef.current);
      }
      movedRef.current = true;
    }
    el.scrollLeft = startScrollRef.current - delta;
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  /* 드래그로 카드가 밀린 채 손을 놓으면 그 아래 카드의 클릭이 그대로 열려버린다 —
   * 실제로 움직였을 때만 클릭을 막는다(탭은 그대로 통과시킨다). */
  const handleClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      pauseAutoScroll();
      goToPage(page + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pauseAutoScroll();
      goToPage(page - 1);
    }
  };

  return (
    <div className="wpg-recommend-swiper-wrap" ref={wrapRef}>
      <div
        className="wpg-recommend-swiper"
        ref={trackRef}
        role="group"
        aria-label="추천 위젯"
        tabIndex={0}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => draggingRef.current && endDrag()}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
      >
        {widgets.map((def) => (
          <WidgetRecommendCard key={def.id} def={def} onSelect={() => onSelect(def.id)} />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="wpg-recommend-swiper__dots" role="tablist" aria-label="추천 위젯 페이지">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={page === i}
              aria-label={`${i + 1}번째 추천 위젯 그룹 보기`}
              className={`wpg-recommend-swiper__dot${page === i ? ' is-active' : ''}`}
              onClick={() => {
                pauseAutoScroll();
                goToPage(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
