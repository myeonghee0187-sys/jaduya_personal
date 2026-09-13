import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

/* JADUYA — 돈관리 > 소비 "카테고리별 소비" 가로 Swiper.
 * BudgetRibbon.tsx 의 포인터 드래그 페이저와 같은 결의 인터랙션이지만, 여기서는 카드 개수가
 * 화면 너비에 따라 자연스럽게 달라져야 해서(요구사항 4) 고정 페이지 폭 대신 브라우저 네이티브
 * 가로 스크롤(overflow-x + scroll-snap)을 기반으로 삼는다 — 그 위에 마우스 드래그와
 * 키보드 이동, 그리고 "묶음" 단위 페이지네이션만 얹는다.
 * 터치 스와이프/모멘텀은 네이티브 스크롤 그대로 쓰고, 새로 만드는 건 마우스 드래그뿐이다. */

const DRAG_MOVE_TOLERANCE = 6;

interface CategorySwiperProps {
  children: ReactNode[];
  ariaLabel: string;
}

export function CategorySwiper({ children, ariaLabel }: CategorySwiperProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);

  /* 카드 개수 · 화면 너비가 바뀌면 "한 화면 분량"을 다시 계산한다.
   * 실제 스크롤 가능한 폭을 컨테이너 폭으로 나눈 값이 곧 페이지 수다. */
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
  }, [recomputePageCount, children.length]);

  const goToPage = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, index));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth <= 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPage((prev) => {
      const next = Math.max(0, Math.min(pageCount - 1, idx));
      return next === prev ? prev : next;
    });
  };

  /* 마우스 드래그로 스크롤 — 터치는 브라우저 네이티브 스크롤이 이미 처리하므로 mouse 포인터일 때만 개입한다. */
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = trackRef.current;
    if (!el) return;
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > DRAG_MOVE_TOLERANCE) movedRef.current = true;
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
      goToPage(page + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPage(page - 1);
    }
  };

  return (
    <div className="money-cat-swiper-wrap">
      <div
        className="money-cat-swiper"
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
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
        {children}
      </div>
      {pageCount > 1 && (
        <div className="money-cat-swiper__dots" role="tablist" aria-label={`${ariaLabel} 페이지`}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={page === i}
              aria-label={`${i + 1}번째 카테고리 그룹 보기`}
              className={`money-cat-swiper__dot${page === i ? ' is-active' : ''}`}
              onClick={() => goToPage(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CategorySwiper;
