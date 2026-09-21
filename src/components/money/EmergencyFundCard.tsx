import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ScratchReveal } from './ScratchReveal';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { icon, img } from '../../lib/asset';

/* JADUYA — "비상금" 탭의 대표 인터랙션. 금액을 바로 숫자로 보여주지 않고
 * 문질러서 확인하게 한다(대화 중 새로 정한 요구사항, Figma 소스 없음).
 *
 * 처음엔 Minimal/Calm 톤을 지키려고 코인·색종이·캐릭터·폭죽을 일부러 뺐었는데,
 * 긁은 직후 곧바로 금액이 떠서 "발견하는 순간"이 잘 안 느껴진다는 피드백으로
 * 스크래치 인터랙션에 한해서만 반짝임(sparkle) + 색종이 폭죽(confetti)을 더했다 —
 * 돈 액수 자체를 화려하게 부풀리는 게 아니라 마스코트(saving_money.png)가 "짠!"
 * 하고 튀어 오르는 한 박자를 더해주는 정도로만 쓴다.
 *
 * 상태 머신:
 *   scratch   — 커버를 긁는 중 (ScratchReveal 이 담당)
 *   celebrate — 다 긁은 직후, 두 박자로 나뉜다(showMascotMoment 로 구분):
 *     1) 마스코트만 — 카드 안에 다른 내용(금액/라벨 등) 없이 마스코트만 튀어 올랐다
 *        반짝임·색종이와 함께 사라진다(MASCOT_MS).
 *     2) 그다음에야 "지금까지 모은 비상금" 라벨/금액/진행률이 나타나며 count-up 된다
 *        (CELEBRATE_MS) — 마스코트와 금액이 동시에 뜨지 않는다.
 *   result    — 공개 완료. 금액/목표/진행률만 보여준다(상세 적립 내역은 화면 밖 — 아래 참고)
 * initialRevealed 가 true 면(이번 방문에서 새로 늘어난 돈이 없으면) 스크래치를
 * 건너뛰고 바로 result 로 시작한다 — "새로운 기록이 있어요"는 새 적립이 생겨
 * 다시 가려졌을 때만(isNewRecord) 보여준다.
 *
 * 상단에는 saving_money.png 를 크게 두고, 적립 상세는 기본으로 "이번 달 N번 모았어요"
 * 한 줄만 보여주고 누르면 그 자리에서 아코디언으로 펼쳐진다(depositsExpanded) — 목록은
 * 내부 스크롤 없이 그대로 늘어나고, 넘치면 다른 탭들처럼 화면 전체가 스크롤된다. */

/* 마스코트만 보이는 첫 박자 — fund-pig-pop-out(money.css) 애니메이션 길이와 맞춘 값이다.
 * 둘 중 하나를 바꾸면 다른 쪽도 같이 바꿔야 한다. */
const MASCOT_MS = 2000;
const CELEBRATE_MS = 600;

/* 색종이 조각 — 카드 한가운데(.fund-card__result 전체 기준, 마스코트만 있는 자리라
 * 크기가 작은 마스코트가 아니라 카드 전체에 맞춰 넓게 퍼진다)에서 부채꼴로 터진다
 * (각도 -175~5, 0°=오른쪽 기준 시계방향). distance/delay 를 조금씩 다르게 둬서 한
 * 번에 똑같이 움직이지 않게 한다. 색은 브랜드 톤(레드/그린) + 반짝이 아이콘과 같은
 * 톤의 금색만 섞어서, 이 앱이 안 쓰기로 했던 "무지개 컨페티" 느낌은 피한다. delay 는
 * MASCOT_MS(2초)에 맞춰 넓게 퍼뜨려서 한꺼번에 터졌다 바로 끝나지 않고 계속 떨어지는
 * 느낌을 준다. */
const CONFETTI_COLORS = ['var(--brand-primary)', 'var(--brand-green)', '#e3b23c'] as const;
const CONFETTI_PIECES = [
  { angle: -175, distance: 110, delay: 0 },
  { angle: -155, distance: 140, delay: 140 },
  { angle: -135, distance: 95, delay: 40 },
  { angle: -115, distance: 150, delay: 220 },
  { angle: -95, distance: 120, delay: 90 },
  { angle: -75, distance: 145, delay: 260 },
  { angle: -55, distance: 100, delay: 20 },
  { angle: -35, distance: 135, delay: 190 },
  { angle: -15, distance: 105, delay: 310 },
  { angle: 5, distance: 125, delay: 70 },
  { angle: -165, distance: 80, delay: 350 },
  { angle: -105, distance: 85, delay: 400 },
  { angle: -65, distance: 90, delay: 450 },
  { angle: -25, distance: 78, delay: 500 },
].map((piece, i) => ({ ...piece, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }));

function radialStyle(angleDeg: number, distance: number, delay: number, color: string): CSSProperties {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    '--tx': `${Math.cos(rad) * distance}px`,
    '--ty': `${Math.sin(rad) * distance}px`,
    background: color,
    animationDelay: `${delay}ms`,
  } as CSSProperties;
}

/* 반짝임 — money-benefit-sparkle.svg(이미 이 앱이 쓰는 금색 톤 아이콘)를 카드 곳곳에
 * 흩어 놓고 각자 다른 타이밍에 반짝인다. delay 를 MASCOT_MS(2초) 안에 넓게 펼쳐서
 * 처음에만 반짝이고 끝나지 않고 마스코트가 떠 있는 내내 계속 반짝이게 한다. */
const SPARKLE_SPOTS = [
  { top: '10%', left: '8%', size: 16, delay: 0 },
  { top: '70%', left: '6%', size: 12, delay: 320 },
  { top: '6%', left: '85%', size: 14, delay: 640 },
  { top: '78%', left: '88%', size: 18, delay: 960 },
  { top: '40%', left: '4%', size: 11, delay: 1280 },
  { top: '18%', left: '46%', size: 13, delay: 480 },
  { top: '82%', left: '48%', size: 15, delay: 1100 },
  { top: '48%', left: '92%', size: 12, delay: 800 },
];

/* 불꽃놀이 — 카드 위쪽 두 지점에서 서로 다른 타이밍에 작은 불빛이 사방으로 터졌다
 * 사라진다(색종이보다 짧고 굵게, 진짜 불꽃놀이처럼 두 번 연달아 터지는 느낌). */
const FIREWORK_BURSTS = [
  {
    top: '26%',
    left: '30%',
    delay: 150,
    color: '#e3b23c',
    sparks: [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => ({ angle, distance: 44 })),
  },
  {
    top: '20%',
    left: '72%',
    delay: 750,
    color: 'var(--brand-primary)',
    sparks: [20, 65, 110, 155, 200, 245, 290, 335].map((angle) => ({ angle, distance: 40 })),
  },
  {
    top: '46%',
    left: '50%',
    delay: 1350,
    color: 'var(--brand-green)',
    sparks: [10, 55, 100, 145, 190, 235, 280, 325].map((angle) => ({ angle, distance: 38 })),
  },
] as const;

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
  /** "목표까지 N원 남았어요" 를 눌렀을 때 — 별도 화면 없이 적립 요약을 알림으로 보여준다 */
  onShowDepositSummary: () => void;
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
  onShowDepositSummary,
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
  /* celebrate 의 첫 박자 — true 인 동안은 마스코트만 보이고 금액/라벨은 아직 렌더링하지
   * 않는다. MASCOT_MS 가 지나면 false 로 바뀌며 두 번째 박자(count-up)가 시작된다. */
  const [showMascotMoment, setShowMascotMoment] = useState(false);
  /* 목표를 이번에 처음 달성했을 때만 잠깐 보여주는 축하 화면 */
  const [showAchievement, setShowAchievement] = useState(false);
  /* "이번 달 N번 모았어요" — 레퍼런스처럼 눌렀을 때 아코디언으로 펼쳐진다(별도 화면 아님).
   * 이미 공개된 채로 시작하면(initialRevealed) 처음부터 펼쳐 두고, 방금 긁어서 공개한
   * 경우에도(handleRevealed) 바로 펼쳐서 레퍼런스 04번처럼 금액과 내역을 함께 보여준다. */
  const [depositsExpanded, setDepositsExpanded] = useState(!isEmpty && initialRevealed);
  /* 적립 내역 목록 — 기본은 2건까지만 보여주고 "더보기"를 눌러야 나머지가 펼쳐진다
   * (아코디언 자체를 접는 depositsExpanded 와는 별개의, 한 단계 더 깊은 펼치기). */
  const [depositsListExpanded, setDepositsListExpanded] = useState(false);
  const DEPOSITS_PREVIEW_COUNT = 2;

  /* 이미 공개된 상태에서 값이 바뀌면(목표 수정 등) count-up 없이 바로 반영한다 */
  useEffect(() => {
    if (view === 'result') {
      setDisplayAmount(currentAmount);
      setDisplayPercent(percent);
    }
  }, [currentAmount, percent, view]);

  const handleRevealed = () => {
    setView('celebrate');
    setShowMascotMoment(true);
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
      /* 접근성: 움직임을 줄인 환경에서는 마스코트 박자를 건너뛰고 바로 최종 값으로 */
      setShowMascotMoment(false);
      setDisplayAmount(currentAmount);
      setDisplayPercent(percent);
      const t = window.setTimeout(finish, 80);
      return () => window.clearTimeout(t);
    }

    setDisplayAmount(0);
    setDisplayPercent(0);
    let raf = 0;
    /* 1박자 — 마스코트만 MASCOT_MS 동안 보여준 다음, 2박자(count-up)로 넘어간다 */
    const mascotTimer = window.setTimeout(() => {
      setShowMascotMoment(false);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / CELEBRATE_MS);
        const eased = 1 - (1 - t) ** 3;
        setDisplayAmount(Math.round(currentAmount * eased));
        setDisplayPercent(percent * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, MASCOT_MS);
    const done = window.setTimeout(finish, MASCOT_MS + CELEBRATE_MS + 100);
    return () => {
      window.clearTimeout(mascotTimer);
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
                {showMascotMoment ? (
                  <>
                    <div className={`fund-card__mascot${reduceMotion ? '' : ' is-popping'}`}>
                      <img src={img('saving_money.png')} alt="" />
                    </div>
                    {!reduceMotion && (
                      <>
                        <span className="fund-confetti" aria-hidden="true">
                          {CONFETTI_PIECES.map((piece, i) => (
                            <span
                              key={i}
                              className="fund-confetti__piece"
                              style={radialStyle(piece.angle, piece.distance, piece.delay, piece.color)}
                            />
                          ))}
                        </span>
                        <span className="fund-sparkles" aria-hidden="true">
                          {SPARKLE_SPOTS.map((spot, i) => (
                            <img
                              key={i}
                              className="fund-sparkles__spot"
                              src={icon('money-benefit-sparkle.svg')}
                              alt=""
                              style={{
                                top: spot.top,
                                left: spot.left,
                                width: spot.size,
                                height: spot.size,
                                animationDelay: `${spot.delay}ms`,
                              }}
                            />
                          ))}
                        </span>
                        {FIREWORK_BURSTS.map((burst, bi) => (
                          <span
                            key={bi}
                            className="fund-firework"
                            aria-hidden="true"
                            style={{ top: burst.top, left: burst.left }}
                          >
                            {burst.sparks.map((spark, si) => (
                              <span
                                key={si}
                                className="fund-firework__spark"
                                style={radialStyle(spark.angle, spark.distance, burst.delay, burst.color)}
                              />
                            ))}
                          </span>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
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
                      <button
                        type="button"
                        className="fund-card__remaining fund-card__remaining--tap"
                        onClick={onShowDepositSummary}
                      >
                        <span>
                          목표까지 <b>{remaining.toLocaleString()}원</b> 남았어요.
                        </span>
                        <img src={icon('chevron-right-thin.svg')} alt="" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "이번 달 N번 모았어요" — 누르면 그 자리에서 아코디언으로 펼쳐지고(접기/펴기),
       * 목록은 내부 스크롤 없이 그대로 늘어난다. */}
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
                <>
                  <div className="fund-deposit-panel__list">
                    {(depositsListExpanded ? deposits : deposits.slice(0, DEPOSITS_PREVIEW_COUNT)).map((deposit) => (
                      <div key={deposit.id} className="fund-deposit-row">
                        <span className="fund-deposit-row__badge" aria-hidden="true">
                          <img src={icon('money-fund-check.svg')} alt="" />
                        </span>
                        <span className="fund-deposit-row__date">{deposit.date}</span>
                        <span className="fund-deposit-row__amount">+{deposit.amount.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                  {deposits.length > DEPOSITS_PREVIEW_COUNT && (
                    <button
                      type="button"
                      className="fund-deposit-panel__more"
                      aria-expanded={depositsListExpanded}
                      onClick={() => setDepositsListExpanded((v) => !v)}
                    >
                      {depositsListExpanded ? '접기' : '더보기'}
                      <img
                        src={icon('chevron-down-thin.svg')}
                        alt=""
                        className={depositsListExpanded ? 'is-open' : ''}
                      />
                    </button>
                  )}
                </>
              )}
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
