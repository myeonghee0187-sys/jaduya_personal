import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
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
  /** 타겟이 이 단계가 떠 있는 동안 스스로(CSS 애니메이션 등으로) 계속 움직이는 경우에만
   * true — 예: AI 챗봇 버튼이 "이동 데모"를 재생하는 단계. 스포트라이트가 그 움직임을
   * 따라가도록 한동안 매 프레임 다시 잰다. 기본(false)은 마운트 시 한두 번만 재서
   * 정적인 타겟에 맞춘다 — 그렇지 않으면 직전 단계에서 시트가 열리며(peek→expanded)
   * 함께 움직이는 이전 타겟을 계속 뒤쫓다가, 다음 단계로 넘어가는 순간 새 타겟으로
   * 갑자기 튀어 보이는 문제가 있었다. */
  trackContinuously?: boolean;
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
/* 말풍선(정확히는 꼬리 삼각형 끝)과 강조 영역(스포트라이트 링) 사이 간격 — 꼬리
 * 높이(10px)를 빼면 실제로 남는 틈은 이 값보다 작다. 16이었을 때는 남는 틈이 6px뿐이라,
 * 링 바깥의 은은한 글로우(.coachmark__dim 의 20px blur + 6px spread, 실제로 닿는
 * 범위는 그보다 넓다)가 꼬리 바로 밑까지 번져서 꼬리와 링이 하나로 이어진 것처럼
 * 진한 선으로 보였다(요구사항 아님, 발견된 버그 수정 — 말풍선 자체의 그림자를 고쳐도
 * 이 글로우 때문에 남아 있던 문제). 글로우가 눈에 띄게 옅어질 만큼 틈을 넉넉히 둔다. */
const BUBBLE_GAP = 30;
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

/* Home(.app) 위에 얹는 코치마크 오버레이.
 *
 * 좌표를 하드코딩하지 않고 매 단계 타겟의 실제 DOM 크기를 ref 로 실측해서 딤(dim) 위에
 * 스포트라이트 컷아웃(box-shadow 트릭)을 낸다. 말풍선은 타겟이 화면 위쪽 절반이면
 * 아래에, 아래쪽 절반이면 위에 붙는다 — Figma 코치마크 컴포넌트와 같은 규칙이다.
 * 말풍선 안에 건너뛰기/이전/다음(마지막 단계는 완료) 버튼을 두고, 딤을 탭해도(강조
 * 영역 포함) 다음으로 넘어간다 — 버튼은 명시적 조작, 딤 탭은 빠른 진행용 보조 수단으로
 * 같이 둔다. 마지막 단계는 평소의 작은 말풍선에 더해 화면 가운데에 큰 "아무 곳이나
 * 탭해서 자두야 시작하기" 안내가 함께 뜬다. */
export function Coachmark({ steps, onFinish, onStepChange }: CoachmarkProps) {
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const tapCatcherRef = useRef<HTMLButtonElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  /* 말풍선 전용 rect — 스포트라이트(rect)는 시트가 움직이는 동안 매 프레임 다시 재서
   * 부드럽게 따라가지만, 말풍선까지 그 값을 그대로 쓰면 위/아래 배치(placeBelow)가
   * 중간에 뒤집히거나 좌표가 프레임마다 훌쩍훌쩍 바뀌어("들뜬다") 보였다 — 말풍선은
   * 전환이 끝난 뒤의 최종 위치로 한 번만 옮긴다. */
  const [bubbleRect, setBubbleRect] = useState<Rect | null>(null);
  /* 타겟이 완전히 바뀌는 모든 전환에서 false 로 시작한다(advance()/back() 이 끈다) —
   * 새 타겟 위치를 확정하기 전에 말풍선부터 보여주면, 스포트라이트가 아직 옛 자리에서
   * 새 자리로 딤(0.32s)을 타고 이동하는 중인데 말풍선(텍스트)은 이미 새 자리에 뚝
   * 떨어져 있어 "따로 논다"는 느낌을 줬다(요구사항: 시트 변경이 없는 3→4단계 같은
   * 전환도 마찬가지). 딤이 도착한 뒤에야 그 자리에서 말풍선이 나타나게 한다 —
   * 화면에 보이는 동안은 절대 위치가 바뀌지 않는다. 이동 데모(trackContinuously)
   * 단계만 예외 — 타겟이 제자리로 돌아오므로 시작 위치가 이미 맞아 숨길 필요가 없다. */
  const [bubbleReady, setBubbleReady] = useState(true);
  const finishedRef = useRef(false);
  /* advance()/back() 가 "이번 전환은 시트도 같이 움직인다"를 표시해 두는 한 번 쓰고
   * 버리는 신호 — 클릭 즉시 스텝을 바꾸고, 아래 layout effect 가 이 신호를 보고 잠깐
   * 매 프레임 재측정해서 스포트라이트가 시트 전환(peek↔expanded, 320ms)을 실시간으로
   * 따라가게 한다. 예전엔 시트 전환이 끝나길 기다렸다가(340ms) 스텝을 바꿔서, 버튼을
   * 눌러도 그동안 아무 반응이 없어 "느리고 끊긴다"는 문제가 있었다(요구사항). */
  const sheetChangingRef = useRef(false);
  /* 시트를 따라가는 추적 루프(chasingSheet)가 매 프레임 remeasure() 로 딤의 목표
   * 좌표를 계속 다시 정하는 동안엔 true — Framer Motion 은 목표가 프레임마다 바뀌어도
   * 그때까지의 진행(0.32s 트윈)을 매끄럽게 이어서 재조준하는데, 그 재조준 도중에도
   * onAnimationComplete 가 몇 번 불릴 수 있어(아직 시트가 움직이는 중간에 "이 프레임
   * 목표까지는 도착했다"는 식으로) revealBubbleWhenSettled 가 너무 일찍 말풍선을 켜고,
   * 그 뒤로도 딤이 한동안 계속 미세하게 움직이는 게 관찰됐다. 이 루프가 도는 동안은
   * onAnimationComplete 를 무시하고, 루프가 완전히 멈춘 뒤 마지막으로 한 번 더 잰
   * remeasure() 가 만든 진짜 마지막 트윈의 완료만 받아들인다. */
  const trackingRef = useRef(false);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const remeasure = useCallback(() => {
    const root = rootRef.current;
    const target = step?.targetRef.current;
    if (!root || !target) return;
    setRect(measure(target, root, getScale(root)));
  }, [step]);

  const remeasureBubble = useCallback(() => {
    const root = rootRef.current;
    const target = step?.targetRef.current;
    if (!root || !target) return;
    setBubbleRect(measure(target, root, getScale(root)));
  }, [step]);

  /* .coachmark__dim 의 실제 onAnimationComplete 에 물린다 — "시트 전환은 320ms 니까
   * 500ms쯤 기다리면 끝났겠지" 식으로 고정 시간을 추측하는 대신, 딤이 진짜로 새 자리에
   * 도착한 순간을 정확히 안다. 예전 방식(고정 setTimeout)은 시트가 움직이는 전환(예:
   * 2→3단계, peek→expanded)에서 어긋났다 — 추적 루프가 500ms 만에 멈추고 그 즉시
   * 말풍선을 보여줬는데, 그 마지막 프레임에 새로 잰 값으로 딤이 320ms 짜리 전환을 막
   * 다시 시작한 참이면(시트가 그 근처까지 움직이다 멈췄으면) 딤은 아직 0.3초 넘게 더
   * 움직여야 하는데 말풍선은 이미 도착해 있어 스포트라이트와 어긋나 보였다(요구사항:
   * "말풍선 아래 검정 라인" — 매번 다른 단계에서 보였다 안 보였다 한 이유가 바로 이
   * 타이밍 추측이 프레임마다 들쭉날쭉 맞고 안 맞고 했기 때문이었다). 실제 애니메이션
   * 완료 콜백을 쓰면 프레임 타이밍과 무관하게 항상 정확히 도착한 뒤에만 말풍선이
   * 나타난다. */
  const revealBubbleWhenSettled = useCallback(() => {
    if (trackingRef.current) return;
    remeasureBubble();
    setBubbleReady(true);
  }, [remeasureBubble]);

  useLayoutEffect(() => {
    remeasure();
    /* 이번 전환이 시트도 같이 움직이는 전환이었다면(advance()/back() 이 미리 표시해
     * 둔다) 한 번 읽고 바로 소비한다 — 다음 렌더에 잘못 남아있지 않도록. */
    const chasingSheet = sheetChangingRef.current;
    sheetChangingRef.current = false;
    /* "처음 뜨는 중"인지는 ref 플래그 대신 bubbleRect 가 아직 한 번도 안 재졌는지로
     * 판단한다 — StrictMode(개발 모드)는 이 effect 를 마운트 시 한 번 더 실행해 보는데,
     * ref 를 직접 뒤집는 플래그는 그 두 번째 실행에서 이미 true 로 남아 있어 "처음이
     * 아니다"로 잘못 판단했다(그 결과 첫 단계 말풍선이 한 번 나타났다 숨었다 다시
     * 나타났다). bubbleRect 는 state 라 이 렌더의 클로저 값을 그대로 읽으므로 두 번째
     * 실행에서도 여전히 null 이다. */
    const isFirstMount = bubbleRect === null;

    if (isFirstMount) {
      /* 첫 등장은 숨길 이유가 없다 — 원래처럼 바로 잰 자리에 보여준다. */
      remeasureBubble();
      setBubbleReady(true);
      const raf = requestAnimationFrame(() => {
        remeasure();
        remeasureBubble();
      });
      const settleTimer = window.setTimeout(() => {
        remeasure();
        remeasureBubble();
      }, 360);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(settleTimer);
      };
    }

    if (step?.trackContinuously) {
      /* 이동 데모는 타겟이 제자리로 돌아오므로 시작 위치가 이미 맞다 — 바로 보여준다. */
      remeasureBubble();
      setBubbleReady(true);
      /* 스포트라이트만 애니메이션(잠깐 멈췄다가 5.2초 이동, ai-chatbot.css 의
       * animation-delay 450ms 포함)이 끝날 때까지 매 프레임 다시 재서 버튼이
       * 실제로 움직이는 모습을 실시간으로 따라간다. */
      const start = performance.now();
      let raf = requestAnimationFrame(function tick(now) {
        remeasure();
        if (now - start < 5800) raf = requestAnimationFrame(tick);
      });
      return () => cancelAnimationFrame(raf);
    }

    /* 시트 전환이 있든 없든, 딤(스포트라이트)이 새 자리로 다 이동한 뒤에야 말풍선을
     * 보여준다 — 그 전에 보여주면 말풍선(텍스트)은 이미 새 자리에 뚝 떨어져 있는데
     * 스포트라이트만 뒤늦게 따라오는 것처럼 보여 따로 노는 느낌을 줬다(요구사항: 시트
     * 변경이 없는 전환도 마찬가지 — 3→4단계처럼 타겟만 멀리 바뀌어도 딤 자체는 여전히
     * .coachmark__dim 의 0.32s transition 을 타고 이동한다). */
    setBubbleReady(false);
    /* revealBubbleWhenSettled 는 딤의 목표값이 실제로 바뀔 때만 동작한다 — 재측정한
     * 값이 직전과 완전히 같으면(자리가 그대로인 채로 다시 쟀을 뿐이면) Framer Motion 이
     * 새 트윈을 아예 시작하지 않아 onAnimationComplete 가 안 불릴 수 있다. 그러면
     * 말풍선이 영영 다시 안 켜지므로, 이 전환에서 "아무리 늦어도 이 시점까지는 켠다"는
     * 안전망을 하나 더 둔다 — chasingSheet(추적 500ms + 트윈 최대 0.32s)보다 넉넉한
     * 900ms. 정상적으로 onAnimationComplete 가 먼저 불리면 이 타이머는 그냥 취소된다. */
    const fallbackTimer = window.setTimeout(() => {
      trackingRef.current = false;
      remeasureBubble();
      setBubbleReady(true);
    }, 900);

    if (chasingSheet) {
      /* 스포트라이트만 시트가 실제로 움직이는 동안(peek↔expanded, 320ms) 매 프레임
       * 다시 재서 그 움직임을 실시간으로 따라간다 — 말풍선을 다시 보여주는 시점은
       * 더 이상 이 루프가 멈추는 시점(고정 500ms)으로 추측하지 않는다. trackingRef 를
       * 켜 두는 동안은 revealBubbleWhenSettled(딤의 onAnimationComplete)가 "아직
       * 추적 중"으로 보고 무시하고, 루프가 완전히 멈춘 뒤 마지막 remeasure() 가 만든
       * 진짜 마지막 트윈이 끝났을 때만 말풍선을 켠다. */
      trackingRef.current = true;
      const DURATION = 500;
      const start = performance.now();
      let raf = requestAnimationFrame(function tick(now) {
        remeasure();
        if (now - start < DURATION) {
          raf = requestAnimationFrame(tick);
        } else {
          trackingRef.current = false;
          remeasure();
        }
      });
      return () => {
        cancelAnimationFrame(raf);
        trackingRef.current = false;
        window.clearTimeout(fallbackTimer);
      };
    }

    /* 시트는 안 움직이지만 타겟 자체는 바뀌었다 — AIChatbotButton 이 마운트 후 위치를
     * 한 번 더 settle 하는 등, 타겟이 레이아웃 직후 한 프레임 늦게 자리 잡는 경우를
     * 대비해 다음 프레임에 한 번 더 잰다. 말풍선은 위와 같은 이유로 고정 시간이 아니라
     * revealBubbleWhenSettled(딤의 onAnimationComplete)가 켠다. */
    const raf = requestAnimationFrame(remeasure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallbackTimer);
    };
  }, [remeasure, remeasureBubble, step?.trackContinuously]);

  useEffect(() => {
    const remeasureBoth = () => {
      remeasure();
      remeasureBubble();
    };
    window.addEventListener('resize', remeasureBoth);
    /* 시트 드래그/스크롤로 타겟이 움직일 수 있어 스크롤도 같이 듣는다(capture) */
    window.addEventListener('scroll', remeasureBoth, true);
    return () => {
      window.removeEventListener('resize', remeasureBoth);
      window.removeEventListener('scroll', remeasureBoth, true);
    };
  }, [remeasure, remeasureBubble]);

  useEffect(() => {
    nextRef.current?.focus();
  }, [stepIndex]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  /* 다음 단계가 시트 상태를 바꿔야 하면(예: 2→3) 예전엔 시트 전환(320ms)이 끝나길
   * 기다렸다가(340ms) 스텝을 바꿨다 — 스포트라이트가 엉뚱한 자리로 튀지는 않았지만,
   * 버튼을 눌러도 그동안 아무 반응이 없어 "느리고 끊긴다"는 문제가 있었다(요구사항).
   * 이제 스텝은 클릭 즉시 바꾸고, sheetChangingRef 로 표시해 두면 위 layout effect 가
   * 시트가 실제로 움직이는 동안 스포트라이트를 매 프레임 다시 재서 실시간으로 따라가게
   * 한다 — 텍스트도 스포트라이트도 클릭 즉시 반응하면서, 위치도 한 번에 깔끔히 맞는다. */
  const advance = () => {
    if (isLast) {
      finish();
      return;
    }
    const nextIndex = stepIndex + 1;
    const next = steps[nextIndex];
    /* prefers-reduced-motion 에서는 .sheet 자체가 transition 없이 즉시 자리 잡으므로
     * (home.css) 따라갈 필요가 없다 — 한두 번만 재는 기본 분기로 충분하다 */
    sheetChangingRef.current =
      Boolean(next.sheetState) && next.sheetState !== step.sheetState && !reduceMotion;
    onStepChange?.(next);
    setStepIndex(nextIndex);
  };

  /* advance() 와 대칭 — 1단계에서는 "이전" 버튼 자체가 비활성화되어 있어 호출되지
   * 않는다. */
  const back = () => {
    if (stepIndex === 0) return;
    const prevIndex = stepIndex - 1;
    const prev = steps[prevIndex];
    sheetChangingRef.current =
      Boolean(prev.sheetState) && prev.sheetState !== step.sheetState && !reduceMotion;
    onStepChange?.(prev);
    setStepIndex(prevIndex);
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

  /* 데스크톱 프리뷰(768px 이상)에서는 .app 조상이 zoom: var(--phone-scale) 로 줄어 있다
   * (scale < 1). PAD/BUBBLE_GAP 같은 "로컬" px 상수는 이 줌에 그대로 곱해져서 화면에
   * 찍히므로, 값을 그대로 쓰면 실제 화면 여백이 scale 만큼 줄어든다 — 모바일 폭(zoom
   * 없음, scale=1)에서 딱 맞게 잡은 값이 데스크톱 프리뷰에서는 스케일만큼 좁아져
   * 꼬리와 스포트라이트 글로우가 다시 붙어 보였다(요구사항 아님, 발견된 문제 — "모바일
   * 에서는 안 보이는데 웹에서 보인다"로 확인됨). 1/scale 을 곱해 두면 화면에 실제로
   * 찍히는 여백이 줌 배율과 무관하게 항상 같은 px 로 유지된다. */
  const scale = rootRef.current ? getScale(rootRef.current) : 1;
  const zoomComp = scale > 0 ? 1 / scale : 1;
  const padLocal = PAD * zoomComp;
  const bubbleGapLocal = BUBBLE_GAP * zoomComp;
  const tailHalfLocal = TAIL_HALF * zoomComp;

  const holeRadius =
    step.radius === 'circle' ? Math.max(rect.width, rect.height) / 2 + padLocal : (step.radius ?? 16);
  const hole = {
    top: rect.top - padLocal,
    left: rect.left - padLocal,
    width: rect.width + padLocal * 2,
    height: rect.height + padLocal * 2,
  };

  /* 말풍선 배치는 스포트라이트(rect)가 아니라 bubbleRect(전환이 끝난 뒤 한 번만 갱신)를
   * 기준으로 계산한다 — rect 로 계산하면 시트가 올라가는 동안 targetCenterY 가 매 프레임
   * 바뀌면서 placeBelow 가 전환 도중 뒤집히거나 말풍선 좌표가 계속 바뀌어 들뜬 것처럼
   * 보였다. */
  const bubbleTarget = bubbleRect ?? rect;

  /* offsetHeight — getScale() 이 쓰는 offsetWidth 와 같은 "로컬(줌 반영 전)" 단위라야
   * 아래 top/bottom 계산이 rect 와 같은 좌표계에서 맞아떨어진다 */
  const rootHeight = rootRef.current?.offsetHeight ?? 874;
  const bubbleTargetCenterY = bubbleTarget.top + bubbleTarget.height / 2;
  const placeBelow = bubbleTargetCenterY < rootHeight / 2;
  const bubbleHole = {
    top: bubbleTarget.top - padLocal,
    height: bubbleTarget.height + padLocal * 2,
  };

  const cs = rootRef.current ? getComputedStyle(rootRef.current) : null;
  const margin = (cs && parseFloat(cs.getPropertyValue('--screen-margin'))) || 30;
  const contentWidth = (cs && parseFloat(cs.getPropertyValue('--content-width'))) || 342;

  const bubbleTargetCenterX = bubbleTarget.left + bubbleTarget.width / 2;
  const tailX = Math.min(
    Math.max(bubbleTargetCenterX - margin, tailHalfLocal * 2),
    contentWidth - tailHalfLocal * 2,
  );

  return (
    <div
      ref={rootRef}
      className="coachmark"
      role="dialog"
      aria-modal="true"
      aria-label="홈 화면 안내"
      style={{ '--coachmark-zoom-comp': zoomComp } as CSSProperties}
    >
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
        onAnimationComplete={revealBubbleWhenSettled}
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

      {/* 단계마다 반복하지 않고 화면 우측 상단에 한 번만 고정 — 말풍선 안 "건너뛰기"와
       * 별개로, 말풍선이 화면 어디에 뜨든 항상 같은 자리에서 바로 투어를 끝낼 수 있게
       * 둔다(요구사항: 삭제됐던 버튼 복구). */}
      <button
        type="button"
        className="coachmark__skip"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        SKIP
      </button>

      <AnimatePresence>
        {bubbleReady && (
        <motion.div
          key={step.key}
          className="coachmark__bubble"
          style={{
            left: margin,
            width: contentWidth,
            top: placeBelow ? bubbleHole.top + bubbleHole.height + bubbleGapLocal : undefined,
            bottom: placeBelow ? undefined : rootHeight - bubbleHole.top + bubbleGapLocal,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: placeBelow ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
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

          {/* 건너뛰기/이전/다음(마지막 단계는 완료) — 레퍼런스와 동일하게 말풍선 안
           * 한 줄에 같이 둔다(요구사항: 삭제됐던 버튼 복구). 건너뛰기는 어느 단계에서든
           * 바로 종료, 이전은 1단계에서 비활성화된다. */}
          <div className="coachmark__actions">
            <button type="button" className="coachmark__action-skip" onClick={finish}>
              건너뛰기
            </button>
            <div className="coachmark__actions-nav">
              <button
                type="button"
                className="coachmark__action-back"
                disabled={stepIndex === 0}
                onClick={back}
              >
                이전
              </button>
              <button
                ref={nextRef}
                type="button"
                className="coachmark__action-next"
                onClick={advance}
              >
                {isLast ? '완료' : '다음'}
              </button>
            </div>
          </div>
        </motion.div>
        )}
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
