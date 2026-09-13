import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ScratchReveal } from './ScratchReveal';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { img } from '../../lib/asset';

/* JADUYA — "비상금" 탭의 대표 인터랙션. 금액을 바로 숫자로 보여주지 않고
 * 복권처럼 긁어서 확인하게 한다(대화 중 새로 정한 요구사항, Figma 소스 없음).
 *
 * 상태 머신(스펙 13.):
 *   scratch   — 은박지를 긁는 중 (ScratchReveal 이 담당)
 *   celebrate — 다 긁은 직후 ~1초 — count-up + confetti + 마스코트 bounce
 *   result    — 공개 완료. 금액/목표/진행률 + CTA 두 개
 * initialRevealed 가 true 면(이미 이번 달에 확인했으면) scratch 단계를 건너뛰고
 * 바로 result 로 시작한다(스펙 11. 재진입 규칙) — "다시 긁어보기"로만 다시 들어간다. */

const CELEBRATE_MS = 850;
const CONFETTI_COLORS = ['#a2b123', '#b43936', '#fbdd78', '#c7753b', '#e8955c', '#f6e2ac'] as const;
/* 복권 "짠!" 순간을 불꽃놀이처럼 더 풍성하게 보이려고 22 → 34조각으로 늘리고 크기 편차도 키웠다 —
 * 전부 i 기반 결정론적 계산이라 새로고침해도 같은 패턴을 그린다(다른 곳들과 동일한 방식). */
const CONFETTI_PIECES = Array.from({ length: 34 }, (_, i) => ({
  key: i,
  left: 2 + ((i * 29) % 96),
  delay: (i % 10) * 30,
  duration: 650 + (i % 7) * 90,
  rotate: (i * 53) % 360,
  drift: ((i * 31) % 90) - 45,
  size: i % 4 === 0 ? 9 : i % 3 === 0 ? 7 : 5,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

interface EmergencyFundCardProps {
  currentAmount: number;
  targetAmount: number;
  /** 이번 달에 이미 확인한 적이 있는지 — true 면 스크래치를 건너뛰고 결과부터 보여준다 */
  initialRevealed: boolean;
  /** 이번 세션에서 처음으로 다 긁었을 때 한 번 호출된다(영속 저장용) */
  onFirstReveal: () => void;
  onEditGoal: () => void;
  onAddMore: () => void;
}

export function EmergencyFundCard({
  currentAmount,
  targetAmount,
  initialRevealed,
  onFirstReveal,
  onEditGoal,
  onAddMore,
}: EmergencyFundCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [view, setView] = useState<'scratch' | 'celebrate' | 'result'>(
    initialRevealed ? 'result' : 'scratch',
  );
  const [scratchKey, setScratchKey] = useState(0);
  const percent = targetAmount > 0 ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100)) : 0;
  const [displayAmount, setDisplayAmount] = useState(initialRevealed ? currentAmount : 0);
  const [displayPercent, setDisplayPercent] = useState(initialRevealed ? percent : 0);
  const hasPersistedRef = useRef(initialRevealed);
  const [bounceKey, setBounceKey] = useState(0);

  /* 새로 들어온 값(추가로 모으기/목표 수정)은 이미 공개된 상태에서는 바로 반영한다.
   * 아직 긁는 중이면 완료될 때 count-up 이 최신 값으로 시작하도록 그대로 둔다. */
  useEffect(() => {
    if (view === 'result') {
      setDisplayAmount(currentAmount);
      setDisplayPercent(percent);
    }
  }, [currentAmount, percent, view]);

  const handleRevealed = () => {
    setBounceKey((k) => k + 1);
    setView('celebrate');
    if (!hasPersistedRef.current) {
      hasPersistedRef.current = true;
      onFirstReveal();
    }
  };

  useEffect(() => {
    if (view !== 'celebrate') return;
    if (reduceMotion) {
      setDisplayAmount(currentAmount);
      setDisplayPercent(percent);
      const t = window.setTimeout(() => setView('result'), 80);
      return () => window.clearTimeout(t);
    }
    setDisplayAmount(0);
    setDisplayPercent(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / CELEBRATE_MS);
      const eased = 1 - (1 - t) ** 3;
      setDisplayAmount(Math.round(currentAmount * eased));
      setDisplayPercent(percent * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const done = window.setTimeout(() => setView('result'), CELEBRATE_MS + 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const replay = () => {
    setScratchKey((k) => k + 1);
    setDisplayAmount(0);
    setDisplayPercent(0);
    setView('scratch');
  };

  const isOpen = view !== 'scratch';

  return (
    <section className="fund-hero">
      <p className="fund-hero__title">{isOpen ? '지금까지 모아둔' : '지금까지 잘 모아왔어요!'}</p>
      <p className="fund-hero__sub">{isOpen ? '비상금이에요!' : '이번 달 비상금을 확인해볼까요?'}</p>

      <div className={`fund-card${isOpen ? ' is-open' : ''}${view === 'celebrate' ? ' is-celebrating' : ''}`}>
        {/* 마스코트는 카드의 형제 요소 — 카드(overflow:hidden)의 둥근 모서리 밖으로
         * 얼굴이 자연스럽게 삐져나오려면 카드의 클리핑 영향을 받지 않아야 한다. */}
        <div key={bounceKey} className="fund-mascot">
          <img src={img('money-budget-character.png')} alt="" />
        </div>

        <div className="fund-card__body">
          {view === 'scratch' ? (
            <ScratchReveal key={scratchKey} onRevealed={handleRevealed}>
              <div className="fund-card__peek">
                <span className="fund-card__peek-coin" aria-hidden="true">
                  ₩
                </span>
                <p className="fund-card__peek-amount">{currentAmount.toLocaleString()}원</p>
              </div>
            </ScratchReveal>
          ) : (
            <div className="fund-card__result">
              <p className="fund-card__amount">{displayAmount.toLocaleString()}원</p>
              <p className="fund-card__target">목표 {targetAmount.toLocaleString()}원</p>
              <div className="fund-card__progress">
                <div className="fund-card__progress-track">
                  <div className="fund-card__progress-fill" style={{ width: `${displayPercent}%` }} />
                </div>
                <span className="fund-card__progress-label">{Math.round(displayPercent)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* 컨페티도 마스코트처럼 카드(overflow:hidden) 밖의 형제 요소로 둬서,
         * 카드 경계에 잘리지 않고 화면 위로 자유롭게 퍼지며 떨어지게 한다. */}
        {view === 'celebrate' && (
          <div className="fund-confetti" aria-hidden="true">
            {CONFETTI_PIECES.map((p) => (
              <span
                key={p.key}
                className="fund-confetti__piece"
                style={
                  {
                    left: `${p.left}%`,
                    width: `${p.size}px`,
                    height: `${p.size + 4}px`,
                    animationDelay: `${p.delay}ms`,
                    animationDuration: `${p.duration}ms`,
                    background: p.color,
                    '--drift': `${p.drift}px`,
                    '--rotate-end': `${p.rotate + 240}deg`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      {view === 'result' && (
        <>
          <div className="fund-cheer">
            <img src={img('money-budget-character.png')} alt="" className="fund-cheer__icon" />
            <div className="fund-cheer__text">
              <p className="fund-cheer__title">잘 모아왔어요!</p>
              <p className="fund-cheer__sub">지금처럼 차근차근 이어가요.</p>
            </div>
          </div>

          <div className="fund-actions">
            <button type="button" className="fund-actions__secondary" onClick={onEditGoal}>
              목표 수정하기
            </button>
            <button type="button" className="fund-actions__primary" onClick={onAddMore}>
              추가로 모으기
            </button>
          </div>

          <button type="button" className="fund-replay" onClick={replay}>
            스크래치 다시 보기
          </button>
        </>
      )}
    </section>
  );
}

export default EmergencyFundCard;
