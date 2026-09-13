import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from './homecare/usePrefersReducedMotion';
import type { SheetState } from '../types';

export interface CoachmarkStep {
  /** React key + AnimatePresence 전환 키로 함께 쓴다 */
  key: string;
  title: string;
  /** 줄바꿈은 그대로 살린다(\n) — 말풍선은 pre-line 으로 렌더링 */
  body: string;
  /** 강조할 실제 DOM 엘리먼트. Home 이 각 타겟 컴포넌트에 내려준 ref 를 그대로 받는다 */
  targetRef: RefObject<HTMLElement | null>;
  /** 강조 영역 모서리 반경. 'circle' 이면 폭/높이 중 큰 쪽 기준 원형(FAB 등)으로 판다 */
  radius?: number | 'circle';
  /** 이 단계를 보여줄 때 Home 바텀시트가 있어야 할 상태. 타겟이 peek 상태에서 화면
   * 밖(시트 접힌 부분 아래)에 가려지는 단계에서만 지정한다 — 없으면 현재 상태를 그대로 둔다. */
  sheetState?: SheetState;
}

interface CoachmarkProps {
  steps: CoachmarkStep[];
  /** 마지막 단계를 탭했거나 건너뛰기를 눌렀을 때 한 번 호출된다 */
  onFinish: () => void;
  /** 단계가 바뀔 때마다 호출 — Home 이 sheetState 를 보고 필요하면 시트를 올리고 내린다 */
  onStepChange?: (step: CoachmarkStep) => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8; // 강조 영역과 실제 타겟 사이 여백
const BUBBLE_GAP = 16; // 말풍선과 강조 영역 사이 간격
const TAIL_HALF = 10; // 말풍선 꼬리 삼각형 절반 폭
const EASE = [0.22, 1, 0.36, 1] as const;

/* 데스크톱 프리뷰(IPhoneFrame)는 .app 을 zoom: var(--phone-scale) 로 축소해서 보여준다.
 * getBoundingClientRect() 는 항상 "실제 화면" px(줌 적용 후)를 돌려주는데, root(.coachmark)도
 * 그 축소된 .app 안에 있는 자식이라 root 의 자식에게 그 실제 화면 px 를 그대로 top/left 로
 * 박아넣으면 줌이 한 번 더 걸려 좌표가 절반 넘게 안쪽(왼쪽 위)으로 쏠린다. offsetWidth(줌의
 * 영향을 받지 않는 로컬 박스 크기) 대비 getBoundingClientRect 폭 비율로 배율을 구해 되돌린다. */
function getScale(el: HTMLElement): number {
  const real = el.getBoundingClientRect().width;
  return el.offsetWidth ? real / el.offsetWidth : 1;
}

function measure(target: HTMLElement, root: HTMLElement, scale: number): Rect {
  const t = target.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return {
    top: (t.top - r.top) / scale,
    left: (t.left - r.left) / scale,
    width: t.width / scale,
    height: t.height / scale,
  };
}

/* Home(.app) 위에 얹는 4단계 코치마크 오버레이.
 *
 * 좌표를 하드코딩하지 않고 매 단계 타겟의 실제 DOM 크기를 ref 로 실측해서 딤(dim) 위에
 * 스포트라이트 컷아웃(box-shadow 트릭)을 낸다. 말풍선은 타겟이 화면 위쪽 절반이면
 * 아래에, 아래쪽 절반이면 위에 붙는다 — Figma 코치마크 컴포넌트와 같은 규칙이다.
 * 인터랙션은 "화면 아무 곳이나 탭 = 다음". SKIP 은 단계별 버튼이 아니라 화면 우측 상단에
 * 고정으로 한 번만 뜬다(Figma "코지 마크" 온보딩과 동일). 마지막 단계는 평소의 작은
 * 말풍선 대신 화면 가운데에 큰 "아무 곳이나 탭해서 자두야 시작하기" 안내로 끝맺는다. */
export function Coachmark({ steps, onFinish, onStepChange }: CoachmarkProps) {
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const tapCatcherRef = useRef<HTMLButtonElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  /* 다음 단계가 시트를 올리고/내려야 할 때만 true — 그동안 현재 스포트라이트를 그대로
   * 둔 채 시트가 먼저 자리 잡기를 기다린다(끊겨 보이는 것 방지). 자세한 이유는 advance() 참고 */
  const [pending, setPending] = useState(false);
  const finishedRef = useRef(false);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const remeasure = useCallback(() => {
    const root = rootRef.current;
    const target = step?.targetRef.current;
    if (!root || !target) return;
    setRect(measure(target, root, getScale(root)));
  }, [step]);

  useLayoutEffect(() => {
    remeasure();
    /* AIChatbotButton 은 마운트 후 위치를 한 번 더 settle 하는 등, 타겟이 레이아웃
     * 직후 한 프레임 늦게 자리 잡는 경우를 대비해 다음 프레임에 한 번 더 잰다 */
    const raf = requestAnimationFrame(remeasure);
    /* sheetState 로 바텀시트를 올리고/내리는 단계는 .sheet 의 top 전환(320ms)이 끝난
     * 뒤에야 타겟이 실제 자리에 있다 — 여유를 두고 한 번 더 잰다 */
    const settleTimer = window.setTimeout(remeasure, 360);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
    };
  }, [remeasure]);

  useEffect(() => {
    window.addEventListener('resize', remeasure);
    /* 시트 드래그/스크롤로 타겟이 움직일 수 있어 스크롤도 같이 듣는다(capture) */
    window.addEventListener('scroll', remeasure, true);
    return () => {
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [remeasure]);

  useEffect(() => {
    skipRef.current?.focus();
  }, [stepIndex]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  /* 다음 단계가 시트 상태를 바꿔야 하면(예: 2→3), 스텝을 먼저 바꾸고 뒤늦게 자리를
   * 다시 재는 대신 — 시트 전환(320ms)을 먼저 끝내고 나서 스텝을 바꾼다. 그래야 스포트
   * 라이트가 "엉뚱한 자리로 한 번 움직였다가 다시 튀는" 대신 한 번에 깔끔하게 이동한다. */
  const advance = () => {
    if (pending) return;
    if (isLast) {
      finish();
      return;
    }
    const nextIndex = stepIndex + 1;
    const next = steps[nextIndex];
    const sheetChanging = Boolean(next.sheetState) && next.sheetState !== step.sheetState;
    onStepChange?.(next);
    /* prefers-reduced-motion 에서는 .sheet 자체가 transition 없이 즉시 자리 잡으므로
     * (home.css) 기다릴 이유가 없다 — 그대로 기다리면 애니메이션도 없이 340ms 만
     * 멎어 있는 것처럼 보인다 */
    if (sheetChanging && !reduceMotion) {
      setPending(true);
      window.setTimeout(() => {
        setStepIndex(nextIndex);
        setPending(false);
      }, 340);
    } else {
      setStepIndex(nextIndex);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [finish]);

  if (!step) return null;

  if (!rect) {
    /* 첫 measure 전(레이아웃 직후) — root 만 마운트해 target ref 를 잴 자리를 만든다 */
    return <div ref={rootRef} className="coachmark" aria-hidden="true" />;
  }

  const holeRadius =
    step.radius === 'circle' ? Math.max(rect.width, rect.height) / 2 + PAD : (step.radius ?? 16);
  const hole = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  /* offsetHeight — getScale() 이 쓰는 offsetWidth 와 같은 "로컬(줌 반영 전)" 단위라야
   * 아래 top/bottom 계산이 rect 와 같은 좌표계에서 맞아떨어진다 */
  const rootHeight = rootRef.current?.offsetHeight ?? 874;
  const targetCenterY = rect.top + rect.height / 2;
  const placeBelow = targetCenterY < rootHeight / 2;

  const cs = rootRef.current ? getComputedStyle(rootRef.current) : null;
  const margin = (cs && parseFloat(cs.getPropertyValue('--screen-margin'))) || 30;
  const contentWidth = (cs && parseFloat(cs.getPropertyValue('--content-width'))) || 342;

  const targetCenterX = rect.left + rect.width / 2;
  const tailX = Math.min(
    Math.max(targetCenterX - margin, TAIL_HALF * 2),
    contentWidth - TAIL_HALF * 2,
  );

  return (
    <div ref={rootRef} className="coachmark" role="dialog" aria-modal="true" aria-label="홈 화면 안내">
      <motion.div
        className="coachmark__dim"
        animate={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          borderRadius: holeRadius,
        }}
        transition={{ duration: reduceMotion ? 0 : 0.32, ease: EASE }}
      />

      {/* 딤 바깥은 물론 강조 영역을 탭해도 다음 단계로 넘어간다 — 투어 중엔 실제 UI 조작을
       * 막고 진행만 시킨다 */}
      <button
        ref={tapCatcherRef}
        type="button"
        className="coachmark__tap-catcher"
        aria-label="다음 단계"
        onClick={advance}
      />

      {/* 건너뛰기는 단계마다 반복하지 않고 화면 우측 상단에 고정 — 모든 단계에서 같은 자리 */}
      <button
        ref={skipRef}
        type="button"
        className="coachmark__skip"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        SKIP
      </button>

      {/* 진행 도트 — 텍스트 라벨보다 한눈에 몇 단계 남았는지 보여준다 */}
      <div className="coachmark__dots" role="presentation">
        {steps.map((s, i) => (
          <span
            key={s.key}
            className={`coachmark__dot${i === stepIndex ? ' is-current' : ''}${i < stepIndex ? ' is-done' : ''}`}
          />
        ))}
      </div>

      <AnimatePresence>
        <motion.div
          key={step.key}
          className="coachmark__bubble"
          style={{
            left: margin,
            width: contentWidth,
            top: placeBelow ? hole.top + hole.height + BUBBLE_GAP : undefined,
            bottom: placeBelow ? undefined : rootHeight - hole.top + BUBBLE_GAP,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: placeBelow ? -8 : 8 }}
          /* 시트가 자리 잡는 동안(pending)은 살짝 흐려져 "곧 다음으로 넘어간다"는 걸 알려준다 —
           * 스포트라이트/내용은 그대로 두고 아무 반응이 없어 보이지 않게 하기 위함 */
          animate={{ opacity: pending ? 0.35 : 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: placeBelow ? -8 : 8 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className={`coachmark__tail coachmark__tail--${placeBelow ? 'up' : 'down'}`}
            style={{ left: tailX }}
            aria-hidden="true"
          />
          <p className="coachmark__label">
            <span className="coachmark__label-step">
              {stepIndex + 1} / {steps.length} ·{' '}
            </span>
            {step.title}
          </p>
          <p className="coachmark__body">{step.body}</p>
        </motion.div>
      </AnimatePresence>

      {/* 마지막 단계에서만: 작은 말풍선 대신 화면 가운데에 크게 "탭해서 시작" 안내 */}
      {isLast && (
        <motion.div
          className="coachmark__finale"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="coachmark__finale-text">아무 곳이나 탭해서 자두야 시작하기</p>
          <span className="coachmark__tap-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
              <circle cx="20" cy="20" r="11" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <circle cx="20" cy="20" r="4" fill="currentColor" />
            </svg>
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default Coachmark;
