import { useEffect, useState } from 'react';
import { ScratchReveal } from './ScratchReveal';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { icon } from '../../lib/asset';

/* JADUYA — "비상금" 탭의 대표 인터랙션. 금액을 바로 숫자로 보여주지 않고
 * 문질러서 확인하게 한다(대화 중 새로 정한 요구사항, Figma 소스 없음).
 *
 * 실제 금융앱처럼 보이도록 복권 연출(코인·색종이·캐릭터·폭죽·금색)은 쓰지 않는다 —
 * Minimal / Calm / Premium 톤을 유지하고, 숫자 count-up 과 아주 짧은 scale 정도로만
 * "내가 모은 돈을 발견하는 순간"을 표현한다.
 *
 * 상태 머신:
 *   scratch   — 커버를 긁는 중 (ScratchReveal 이 담당)
 *   celebrate — 다 긁은 직후 ~600ms — count-up 만 있고 색종이는 없다
 *   result    — 공개 완료. 금액/목표/진행률만 보여준다(상세 적립 내역은 화면 밖 — 아래 참고)
 * initialRevealed 가 true 면(이번 방문에서 새로 늘어난 돈이 없으면) 스크래치를
 * 건너뛰고 바로 result 로 시작한다 — "새로운 기록이 있어요"는 새 적립이 생겨
 * 다시 가려졌을 때만(isNewRecord) 보여준다.
 *
 * 화면 전체가 스크롤 없이 한 화면(100dvh - 공용 헤더 - 상단 4탭 바)에 들어와야 해서
 * (MoneyPage.tsx 의 .money__scroll--fund 참고), 예전에 있던 "적립 플랜"/"비상금 가이드"는
 * 없앴다. 적립 상세는 기본으로는 "이번 달 N번 모았어요" 한 줄만 보여주고, 누르면 그
 * 자리에서 아코디언으로 펼쳐진다(depositsExpanded) — 목록 자체는 내부 스크롤이라
 * 항목이 많아도 페이지 전체 스크롤은 여전히 생기지 않는다. */

const CELEBRATE_MS = 600;

export interface FundDeposit {
  id: string;
  amount: number;
  date: string;
}

interface EmergencyFundCardProps {
  currentAmount: number;
  targetAmount: number;
  /** 이번 방문에서 이미 다 긁어서 확인한 상태인지 — true 면 스크래치를 건너뛰고 결과부터 보여준다 */
  initialRevealed: boolean;
  /** 예전에 확인한 적은 있지만 그 뒤 새 적립이 생겨 다시 가려진 상태인지("새로운 기록이 있어요") */
  isNewRecord: boolean;
  /** 목표 달성 축하를 이미 한 번 보여줬는지 — 다시 보여주지 않기 위함 */
  hasCelebratedGoal: boolean;
  deposits: FundDeposit[];
  onReveal: () => void;
  onGoalCelebrated: () => void;
  onEditGoal: () => void;
  onAddMore: () => void;
  onShowAllDeposits: () => void;
}

export function EmergencyFundCard({
  currentAmount,
  targetAmount,
  initialRevealed,
  isNewRecord,
  hasCelebratedGoal,
  deposits,
  onReveal,
  onGoalCelebrated,
  onEditGoal,
  onAddMore,
  onShowAllDeposits,
}: EmergencyFundCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const isEmpty = currentAmount <= 0;
  const [view, setView] = useState<'scratch' | 'celebrate' | 'result'>(
    isEmpty || initialRevealed ? 'result' : 'scratch',
  );
  const percent = targetAmount > 0 ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100)) : 0;
  const isGoalMet = targetAmount > 0 && currentAmount >= targetAmount;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const [displayAmount, setDisplayAmount] = useState(view === 'result' ? currentAmount : 0);
  const [displayPercent, setDisplayPercent] = useState(view === 'result' ? percent : 0);
  /* 목표를 이번에 처음 달성했을 때만 잠깐 보여주는 축하 화면 */
  const [showAchievement, setShowAchievement] = useState(false);
  /* "이번 달 N번 모았어요" — 레퍼런스처럼 눌렀을 때 아코디언으로 펼쳐진다(별도 화면 아님).
   * 이미 공개된 채로 시작하면(initialRevealed) 처음부터 펼쳐 두고, 방금 긁어서 공개한
   * 경우에도(handleRevealed) 바로 펼쳐서 레퍼런스 04번처럼 금액과 내역을 함께 보여준다. */
  const [depositsExpanded, setDepositsExpanded] = useState(!isEmpty && initialRevealed);

  /* 이미 공개된 상태에서 값이 바뀌면(목표 수정 등) count-up 없이 바로 반영한다 */
  useEffect(() => {
    if (view === 'result') {
      setDisplayAmount(currentAmount);
      setDisplayPercent(percent);
    }
  }, [currentAmount, percent, view]);

  const handleRevealed = () => {
    setView('celebrate');
    setDepositsExpanded(true);
    onReveal();
  };

  useEffect(() => {
    if (view !== 'celebrate') return;
    const finish = () => {
      setShowAchievement(isGoalMet && !hasCelebratedGoal);
      setView('result');
    };
    if (reduceMotion) {
      setDisplayAmount(currentAmount);
      setDisplayPercent(percent);
      const t = window.setTimeout(finish, 80);
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
    const done = window.setTimeout(finish, CELEBRATE_MS + 100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const confirmAchievement = () => {
    setShowAchievement(false);
    onGoalCelebrated();
  };

  const scratchTitle = isNewRecord ? '새로운 기록이 있어요' : '긁어서 확인하기';
  const scratchCue = isNewRecord ? '긁어서 확인해보세요' : '손가락으로 살짝 문질러보세요';

  return (
    <section className="fund-hero">
      <p className="fund-hero__title">
        언제든 든든하게,
        <br />
        내가 지켜두는 돈
      </p>

      <div className={`fund-card${view === 'result' ? ' is-open' : ''}${view === 'celebrate' ? ' is-celebrating' : ''}`}>
        <div className="fund-card__body">
          <div className="fund-card__stage">
            {isEmpty ? (
              <div className="fund-card__empty">
                <img src={icon('lock.svg')} alt="" className="fund-card__empty-icon" />
                <p className="fund-card__empty-title">아직 모은 비상금이 없어요.</p>
                <p className="fund-card__empty-sub">첫 비상금을 만들어볼까요?</p>
              </div>
            ) : view === 'scratch' ? (
              <ScratchReveal title={scratchTitle} cue={scratchCue} onRevealed={handleRevealed}>
                <div className="fund-card__peek">
                  <p className="fund-card__peek-amount">{currentAmount.toLocaleString()}원</p>
                </div>
              </ScratchReveal>
            ) : showAchievement ? (
              <div className="fund-achieved">
                <span className="fund-achieved__badge" aria-hidden="true">
                  <img src={icon('widget-check.svg')} alt="" />
                </span>
                <p className="fund-achieved__title">비상금 목표를 달성했어요!</p>
                <p className="fund-achieved__sub">꾸준히 모은 나, 정말 멋져요.</p>
                <button type="button" className="fund-achieved__confirm" onClick={confirmAchievement}>
                  확인
                </button>
                <button type="button" className="fund-achieved__edit" onClick={onEditGoal}>
                  목표 변경하기
                </button>
              </div>
            ) : (
              <div className="fund-card__result">
                <p className="fund-card__label">지금까지 모은 비상금</p>
                <p className="fund-card__amount">{displayAmount.toLocaleString()}원</p>
                <button type="button" className="fund-card__target" onClick={onEditGoal}>
                  목표 {targetAmount.toLocaleString()}원
                </button>
                <div className="fund-card__progress">
                  <div className="fund-card__progress-track">
                    <div className="fund-card__progress-fill" style={{ width: `${displayPercent}%` }} />
                  </div>
                  <span className="fund-card__progress-label">{Math.round(displayPercent)}%</span>
                </div>
                {isGoalMet ? (
                  <p className="fund-card__remaining">목표를 모두 모았어요.</p>
                ) : (
                  <button type="button" className="fund-card__remaining fund-card__remaining--tap" onClick={onShowAllDeposits}>
                    <span>
                      목표까지 <b>{remaining.toLocaleString()}원</b> 남았어요.
                    </span>
                    <img src={icon('chevron-right-thin.svg')} alt="" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "이번 달 N번 모았어요" — 레퍼런스처럼 누르면 그 자리에서 아코디언으로 펼쳐진다.
       * 목록 자체는 내부 스크롤(max-height)로 가둬서, 항목이 많아져도 화면 전체 스크롤은
       * 여전히 생기지 않는다("+ 비상금 채우기" 버튼이 항상 보여야 한다). */}
      {!isEmpty && !showAchievement && (
        <>
          <button
            type="button"
            className="fund-hint"
            aria-expanded={depositsExpanded}
            onClick={() => setDepositsExpanded((v) => !v)}
          >
            <img src={icon('menu-calendar.svg')} alt="" />
            <span>이번 달 {deposits.length}번 모았어요</span>
            <img
              src={icon('chevron-right-thin.svg')}
              alt=""
              className={`fund-hint__chevron${depositsExpanded ? ' is-open' : ''}`}
            />
          </button>

          {depositsExpanded && (
            <div className="fund-deposit-panel">
              {deposits.length === 0 ? (
                <p className="fund-deposit-panel__empty">아직 이번 달 적립 기록이 없어요.</p>
              ) : (
                <div className="fund-deposit-panel__list">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="fund-deposit-row">
                      <span className="fund-deposit-row__badge" aria-hidden="true">
                        <img src={icon('money-fund-check.svg')} alt="" />
                      </span>
                      <span className="fund-deposit-row__date">{deposit.date}</span>
                      <span className="fund-deposit-row__amount">+{deposit.amount.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="fund-deposit-panel__more" onClick={onShowAllDeposits}>
                전체보기
                <img src={icon('chevron-right-thin.svg')} alt="" />
              </button>
            </div>
          )}
        </>
      )}

      {!showAchievement && (
        <button type="button" className="fund-fill-cta" onClick={onAddMore}>
          + 비상금 채우기
        </button>
      )}
    </section>
  );
}

export default EmergencyFundCard;
