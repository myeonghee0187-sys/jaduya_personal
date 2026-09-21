import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import type { ReactNode, RefObject } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const EASE = [0.22, 1, 0.36, 1] as const;
/* 활성화 전/후 마커 배경 — CSS 변수(--dc-white, --brand-green)와 같은 값을
 * 리터럴로도 둔다. useTransform 의 색 보간은 실제 문자열이 필요해 var() 를 못 읽는다. */
const MARKER_BG_INACTIVE = '#fffdfb';
const MARKER_BG_ACTIVE = '#a2b123';
/* Active Line(progress, 0~1)이 마커 자신의 위치(threshold)에 못 미쳐도 이 정도 가까워지면
 * "도달"로 본다 — 정확히 같은 값이어야만 반응하면 오히려 부자연스럽다. */
const MARKER_ACTIVATE_WINDOW = 0.06;
const REVEAL_LOOKAHEAD = 0.04;

/* 이 타임라인은 항상 STEP 01~04 4단계 고정 구조다(48개 Scenario 전부 동일하게
 * step1·step2·step3·services 4개). 그래서 마커 3개(1~3)의 useTransform 을 고정 개수로
 * 선언해도 렌더마다 호출 순서가 같아 Hooks 규칙에 어긋나지 않는다. */

interface GuideTimelineItem {
  /** 단계 제목 — 예: "먼저 해볼 수 있어요" */
  title: string;
  children: ReactNode;
}

interface GuideTimelineProps {
  items: GuideTimelineItem[];
  /** 실제 스크롤이 일어나는 컨테이너(.daily-care__scroll) — window 스크롤을 쓰지 않는다 */
  scrollContainerRef: RefObject<HTMLElement | null>;
}

/* STEP Title / Card 등장 — variants 로 둬서 STEP04 의 서비스 카드가 부모(.dc-timeline__content
 * 의 두 번째 motion.div)의 visible 상태를 그대로 물려받아 자기 stagger 를 실행하게 한다
 * (LifeHomecarePage.tsx 의 서비스 카드 컨테이너는 이 부모의 variants 상태를 propagation 으로
 * 받는다 — 별도 useInView 트리거를 두지 않는다). */
/* Title 280ms / Card 350ms, Card 가 Title 보다 50ms 늦게 시작 — 기존(220ms/300ms/40ms)보다
 * 약 10~20% 느리게 조정해 "Line이 마커에 도달 → 콘텐츠가 열린다"는 인과관계가 눈에 보일
 * 여유를 준다. 급하게 튀어나오는 느낌은 피하되, duration 자체를 크게 늘리지는 않는다. */
const headVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE, delay: 0.05 } },
};

/** 왼쪽 세로 타임라인 + 단계별 카드.
 *
 * 두 가지 성격이 다른 모션을 분리한다.
 *   1. Rail(track + 활성 progress) — 시간이 아니라 "사용자가 .daily-care__scroll 을
 *      얼마나 내렸는지"로만 채워진다(useScroll → scrollYProgress, scroll-linked,
 *      reversible). STEP01 마커 중심부터 STEP04의 마지막 서비스 카드 하단까지
 *      하나로 이어진 연속된 선 두 겹(track/progress)이다.
 *   2. STEP Title·Card(및 서비스 카드) — 스크롤 위치에 계속 연동되지 않는다. "Active
 *      Line 이 실제로 그 마커 위치까지 왔는가"를 같은 progress 값으로 직접 판정해서
 *      한 번만(once) fade-up 한다(별도의 useInView 감지가 progress 계산과 어긋날 수
 *      있어 쓰지 않는다 — 반드시 같은 값에서 파생시킨다). */
export function GuideTimeline({ items, scrollContainerRef }: GuideTimelineProps) {
  const reduceMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const markerRefs = useRef<Array<HTMLSpanElement | null>>([]);

  /* 각 마커의 wrapper 안 중심 위치(px, wrapper 상단 기준) — 카드 높이가 저마다 달라도
   * 실제 DOM 위치를 그대로 쓴다(고정 px 나 균등 분할을 가정하지 않는다). Guide 가
   * 바뀌면(부모가 key 로 이 컴포넌트를 다시 마운트) 새 DOM 기준으로 다시 측정된다. */
  const [markerCenters, setMarkerCenters] = useState<number[]>([0, 0, 0, 0]);
  const [railBottom, setRailBottom] = useState(0);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const list = listRef.current;
    if (!wrapper || !list) return;

    /* transform 전의 레이아웃 좌표를 wrapper 기준으로 누적한다.
     * 마커와 마지막 행에 같은 좌표계를 적용해 데스크톱 미리보기 배율과 무관하게 맞춘다. */
    const layoutTop = (element: HTMLElement) => {
      let top = 0;
      let node: HTMLElement | null = element;
      while (node && node !== wrapper) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return top;
    };

    const measure = () => {
      const centers = markerRefs.current.map((marker) => {
        if (!marker) return 0;
        return layoutTop(marker) + marker.offsetHeight / 2;
      });
      /* 마지막 행은 서비스 카드 묶음의 실제 높이로 결정된다. fade-up transform은
       * 측정에 포함하지 않아 등장 애니메이션 중에도 끝점이 흔들리지 않는다. */
      const lastRow = list.lastElementChild as HTMLElement | null;
      setMarkerCenters(centers);
      setRailBottom(lastRow ? layoutTop(lastRow) + lastRow.offsetHeight : 0);
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, [items]);

  /* STEP04 아래 서비스 영역도 연속 레일에 포함한다. 카드 수·텍스트 높이가 바뀌면
   * ResizeObserver가 마지막 카드 하단을 새로 측정한다. */
  const railTop = markerCenters[0];
  const railHeight = Math.max(railBottom - railTop, 0);

  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
    target: wrapperRef,
    // "가이드 시작이 뷰포트 70% 지점에 들어오면 0, STEP04 끝이 뷰포트 90% 지점에 오면 1".
    // .daily-care__scroll 은 탭바 높이만큼 padding-bottom(고정 131px)이 항상 붙어 있어
    // 최대로 스크롤해도 가이드 끝이 뷰포트 중앙까지 올라오지 못한다(실측 시 최대
    // 스크롤에서도 약 86~87% 지점에 머무른다) — 반드시 실제 도달 가능한 값을 써야 한다.
    offset: ['start 70%', 'end 90%'],
  });

  /* 손가락 스크롤을 그대로 따라가되 아주 살짝만 부드럽게 — 멈춘 뒤 라인이 한참
   * 따라오지 않도록 stiffness 를 충분히 높게 둔다. reduced motion 에서는 스프링 없이
   * 스크롤 값을 즉시 그대로 쓴다(기능 정보는 유지하고 이징만 없앤다). */
  const smoothed = useSpring(scrollYProgress, { stiffness: 300, damping: 40, mass: 0.4 });
  const progress = reduceMotion ? scrollYProgress : smoothed;

  /* 전체 레일 길이로 마커 위치를 정규화한다. STEP04는 레일 끝보다 앞에 있으므로
   * 서비스 카드가 먼저 열린 뒤에도 활성선이 마지막 카드 하단까지 계속 진행한다. */
  const markerThresholds = useMemo(() => {
    if (railHeight <= 0) return [0, 1 / 3, 2 / 3, 1];
    return markerCenters.map((c) => (c - railTop) / railHeight);
  }, [markerCenters, railTop, railHeight]);

  /* STEP Title/Card reveal 상태 — "Active Line 이 실제 마커 위치까지 왔는가"로만 연다.
   * 한 번 열리면 다시 닫지 않는다(once). STEP01(index 0)은 Guide 진입 시 바로 연다. */
  const [revealed, setRevealed] = useState<boolean[]>(() => [true, false, false, false]);

  useMotionValueEvent(progress, 'change', (latest) => {
    setRevealed((prev) => {
      if (prev[1] && prev[2] && prev[3]) return prev;
      let changed = false;
      const next = prev.map((already, i) => {
        if (already || i === 0) return true;
        const reached = latest >= markerThresholds[i] - REVEAL_LOOKAHEAD;
        if (reached) changed = true;
        return reached;
      });
      return changed ? next : prev;
    });
  });

  const marker1Scale = useMarkerScale(progress, markerThresholds[1]);
  const marker1Bg = useMarkerBg(progress, markerThresholds[1]);
  const marker2Scale = useMarkerScale(progress, markerThresholds[2]);
  const marker2Bg = useMarkerBg(progress, markerThresholds[2]);
  const marker3Scale = useMarkerScale(progress, markerThresholds[3]);
  const marker3Bg = useMarkerBg(progress, markerThresholds[3]);
  const markerStyleByIndex = [
    undefined,
    { scale: marker1Scale, backgroundColor: marker1Bg },
    { scale: marker2Scale, backgroundColor: marker2Bg },
    { scale: marker3Scale, backgroundColor: marker3Bg },
  ] as const;

  return (
    <div className="dc-timeline-wrapper" ref={wrapperRef}>
      {/* Rail — track(연한 Point 그린, 전체 구조) + progress(Point 그린, scaleY 로 스크롤
       * 진행도만큼만 자란다). <ol> 의 형제이지 자식이 아니다 — <ol> 의 direct child 는
       * 항상 <li> 만 유지된다. */}
      <span className="dc-timeline__track" style={{ top: railTop, height: railHeight }} aria-hidden="true" />
      <motion.span
        className="dc-timeline__progress"
        style={{ top: railTop, height: railHeight, transformOrigin: 'top', scaleY: progress }}
        aria-hidden="true"
      />

      <ol className="dc-timeline" ref={listRef}>
        {items.map((item, index) => (
          <li key={item.title} className="dc-timeline__row">
            <motion.span
              ref={(el) => {
                markerRefs.current[index] = el;
              }}
              className={`dc-timeline__marker${index === 0 ? ' is-first' : ''}`}
              aria-hidden="true"
              style={index === 0 || reduceMotion ? undefined : markerStyleByIndex[index]}
            />

            <div className="dc-timeline__content">
              <motion.div
                className="dc-timeline__head"
                variants={headVariants}
                initial={reduceMotion ? false : 'hidden'}
                animate={revealed[index] ? 'visible' : 'hidden'}
              >
                <span className="dc-timeline__num">{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
              </motion.div>
              <motion.div
                variants={cardVariants}
                initial={reduceMotion ? false : 'hidden'}
                animate={revealed[index] ? 'visible' : 'hidden'}
              >
                {item.children}
              </motion.div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* 마커 활성 스타일(scale·배경색)을 마커 3개(1~3)마다 반복해 만드는 작은 커스텀 훅.
 * 항상 고정 4단계 구조라(파일 상단 주석) 호출 순서가 렌더마다 절대 바뀌지 않는다. */
function useMarkerScale(progress: MotionValue<number>, threshold: number) {
  return useTransform(progress, [Math.max(threshold - MARKER_ACTIVATE_WINDOW, 0), threshold], [0.95, 1], {
    clamp: true,
  });
}
function useMarkerBg(progress: MotionValue<number>, threshold: number) {
  return useTransform(
    progress,
    [Math.max(threshold - MARKER_ACTIVATE_WINDOW, 0), threshold],
    [MARKER_BG_INACTIVE, MARKER_BG_ACTIVE],
  );
}

export default GuideTimeline;
