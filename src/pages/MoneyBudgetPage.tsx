import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, MouseEvent, PointerEvent } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { BottomSheet } from '../components/BottomSheet';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon, img } from '../lib/asset';
import { getBudget, saveBudget } from '../data/moneyBudget';
import { TOTAL_EXPENSE } from '../data/moneyTransactions';

/* 돈관리 > 예산 설정 — Figma node 2628:28275 "예산" 기준.
 * "이번 달" 탭의 "예산 설정" 버튼으로 들어오는 하위 화면이다(탭바는 '돈관리' active 유지).
 * 저장하면 공용 저장소(data/moneyBudget.ts)에 기록해 홈 위젯 등 다른 화면에도 그대로 반영된다.
 *
 * 인터랙션은 Figma에 모션 스펙이 없어(get_motion_context 결과 없음) 앱 전반의 관례를 따라
 * 순수 CSS transition + key-remount 트릭으로만 만든다(별도 애니메이션 라이브러리 없음). */

const BUDGET_STEP = 10_000;
const BUDGET_MIN = 0;
const RECOMMENDED_BUDGET = 850_000;
const RECOMMENDED_CAPTION = '지난달 소비와 이번 달 고정비를 기준으로 약 85만원을 추천해요.';
/* 저장 버튼을 누른 뒤 "설정 완료!" 상태를 보여주는 시간 — 이 시간만큼 지나면 돈관리로 이동한다 */
const SUBMIT_CONFIRM_MS = 700;
/* 화면에 머물러 있어도 버튼이 "설정 완료!"에 갇히지 않고 다시 "예산 설정하기"로 돌아오는 시간 */
const SUBMIT_RESET_MS = 1600;

/* 이번 달 이미 쓴 금액 — 소비 원본에서 가져온다. 예산을 조절해도 바뀌지 않는 값이다 */
const CURRENT_USED = TOTAL_EXPENSE;
/* 이번 달 남은 일수 — 남은 예산을 균등하게 나눠 "오늘 쓸 수 있는 금액"을 계산한다 */
const DAYS_LEFT_IN_MONTH = 10;

/* −/+ 길게 누르기 — 누른 채 0.38초가 지나면 0.09초마다 한 단계씩 반복하고, 1.2초 넘게 누르고 있으면 5만원씩 빨라진다 */
const HOLD_DELAY_MS = 380;
const HOLD_INTERVAL_MS = 90;
const HOLD_FAST_AFTER_MS = 1200;
const BUDGET_FAST_STEP = 50_000;
/* 추천 금액 적용·직접 입력처럼 큰 폭으로 바뀔 때 숫자가 굴러가는 시간 */
const BUDGET_TWEEN_MS = 380;
/* 화면에 처음 들어올 때 숫자가 0에서 올라가는 시간 */
const INTRO_MS = 900;

/* 버튼을 누르고 있는 동안 onStep 을 반복한다. 마우스·터치는 pointerdown 으로 시작하고,
 * 키보드(Enter/Space)는 click(detail 0)으로 한 번만 처리해 두 번 실행되지 않게 한다. */
function useHoldRepeat(onStep: (fast: boolean) => void) {
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  const timerRef = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
  }, []);
  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    stop();
    stepRef.current(false);
    const startedAt = performance.now();
    const tick = () => {
      stepRef.current(performance.now() - startedAt > HOLD_FAST_AFTER_MS);
      timerRef.current = window.setTimeout(tick, HOLD_INTERVAL_MS);
    };
    timerRef.current = window.setTimeout(tick, HOLD_DELAY_MS);
    /* 버튼 밖에서 손을 떼거나 버튼이 비활성으로 바뀌어도 반복이 멈추도록 창 전체에서 듣는다 */
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }, [stop]);

  const bind = {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button === 0) start();
    },
    onPointerLeave: stop,
    onContextMenu: (e: MouseEvent<HTMLButtonElement>) => e.preventDefault(),
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) stepRef.current(false);
    },
  };
  return { bind, stop };
}

export function MoneyBudgetPage() {
  const navigation = useAppNavigation();
  /* 저장해 둔 예산에서 시작한다 — 다시 들어와도 지난번에 정한 값이 그대로 보인다 */
  const [budget, setBudget] = useState(getBudget);
  const [justSaved, setJustSaved] = useState(false);
  const saveTimersRef = useRef<number[]>([]);
  useEffect(() => () => saveTimersRef.current.forEach((timer) => window.clearTimeout(timer)), []);
  /* 저장한 뒤에도 −/+ 나 직접 입력으로 값을 바꾸면 곧바로 다시 저장할 수 있게 한다 */
  useEffect(() => {
    if (justSaved && budget !== getBudget()) setJustSaved(false);
  }, [budget, justSaved]);

  /* 값이 바뀔 때마다 key 를 올려 숫자에 짧은 펄스를 준다(리마운트로 CSS 애니메이션을 재생) */
  const [pulseKey, setPulseKey] = useState(0);
  const prevBudgetRef = useRef(budget);
  useEffect(() => {
    if (prevBudgetRef.current !== budget) {
      prevBudgetRef.current = budget;
      setPulseKey((key) => key + 1);
    }
  }, [budget]);

  /* 추천 금액 적용처럼 큰 폭으로 바뀔 때만 스테퍼 테두리를 한 번 더 강조한다 */
  const [recommendFlashKey, setRecommendFlashKey] = useState(0);

  /* "직접 입력" — 10,000원 단위로만 조절되던 +/- 스테퍼와 별개로, 원하는 금액을 바로
   * 타이핑해서 넣을 수 있는 바텀시트. 스테퍼 가운데 숫자를 인풋으로 바꿔 끼우는
   * 방식(v1)은 브라우저 기본 input 폭이 span 보다 넓어서 -/+ 버튼이 밀리는 문제가
   * 있었다 — 스테퍼 자체는 손대지 않고, 비상금 탭의 FundAmountSheet 와 같은 톤의
   * 별도 시트로 분리한다. */
  const budgetSheetTitleId = useId();
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [budgetSheetValue, setBudgetSheetValue] = useState('');

  const openBudgetSheet = () => {
    setBudgetSheetValue(String(budget));
    setBudgetSheetOpen(true);
  };
  const closeBudgetSheet = () => setBudgetSheetOpen(false);
  const budgetSheetNumeric = Number(budgetSheetValue.replace(/[^0-9]/g, ''));
  const submitBudgetSheet = (e: FormEvent) => {
    e.preventDefault();
    if (budgetSheetValue.trim() === '') return;
    setBudget(Math.max(BUDGET_MIN, budgetSheetNumeric));
    closeBudgetSheet();
  };

  /* 진입 애니메이션 — 화면에 처음 들어오면 예산·현재 사용·남은 예산·진행률·오늘 쓸 수 있는 금액과
   * 진행 바가 0에서 실제 값까지 한꺼번에 올라간다(intro 0→1, 감속 곡선). 끝나면 실제 값을 그대로 쓴다.
   * 움직임 줄이기 설정이면 처음부터 실제 값을 보여준다. */
  const [intro, setIntro] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0,
  );
  useEffect(() => {
    if (intro >= 1) return;
    const startedAt = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - startedAt) / INTRO_MS);
      setIntro(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // 처음 한 번만 재생한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const introDone = intro >= 1;
  const shown = (value: number) => (introDone ? value : Math.round(value * intro));

  const remaining = budget - CURRENT_USED;
  const isOverBudget = remaining < 0;
  const percentUsed = budget > 0 ? Math.min(100, Math.max(0, Math.round((CURRENT_USED / budget) * 100))) : 100;
  const todaySpendable = Math.round(remaining / DAYS_LEFT_IN_MONTH);
  /* 초과는 아니지만 거의 다 썼을 때(80%+) 미리 알려주는 중간 경고 단계 */
  const isNearLimit = !isOverBudget && percentUsed >= 80;
  const progressState = isOverBudget ? ' is-over' : isNearLimit ? ' is-near' : '';

  const stepAmount = (fast: boolean) => (fast ? BUDGET_FAST_STEP : BUDGET_STEP);
  const { bind: decreaseHold, stop: stopDecrease } = useHoldRepeat((fast) =>
    setBudget((prev) => Math.max(BUDGET_MIN, prev - stepAmount(fast))),
  );
  const { bind: increaseHold } = useHoldRepeat((fast) => setBudget((prev) => prev + stepAmount(fast)));
  /* 0원에 닿으면 − 를 누르고 있어도 반복을 멈춘다 */
  useEffect(() => {
    if (budget <= BUDGET_MIN) stopDecrease();
  }, [budget, stopDecrease]);

  /* 스테퍼 큰 숫자 — 한 단계씩 바뀔 땐 바로, 추천 금액 적용·직접 입력처럼 크게 바뀔 땐 굴러가듯 바뀐다
   * (움직임 줄이기 설정이면 바로 바뀐다). 아래 요약 숫자는 실제 값(budget)을 그대로 보여준다. */
  const [displayBudget, setDisplayBudget] = useState(budget);
  const displayRef = useRef(budget);
  useEffect(() => {
    const from = displayRef.current;
    const diff = budget - from;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || Math.abs(diff) <= BUDGET_FAST_STEP) {
      displayRef.current = budget;
      setDisplayBudget(budget);
      return;
    }
    const startedAt = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - startedAt) / BUDGET_TWEEN_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = t < 1 ? Math.round((from + diff * eased) / BUDGET_STEP) * BUDGET_STEP : budget;
      displayRef.current = value;
      setDisplayBudget(value);
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [budget]);
  const applyRecommended = () => {
    setBudget(RECOMMENDED_BUDGET);
    setRecommendFlashKey((key) => key + 1);
  };

  const handleSubmit = () => {
    if (justSaved) return;
    saveBudget(budget);
    setJustSaved(true);
    saveTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    saveTimersRef.current = [
      window.setTimeout(() => navigation?.navigate('money'), SUBMIT_CONFIRM_MS),
      window.setTimeout(() => setJustSaved(false), SUBMIT_RESET_MS),
    ];
  };

  return (
    <div className="budget-setup app">
      <SubPageHeader
        title="예산 설정"
        backLabel="돈관리로"
        onBack={() => navigation?.goBack('money')}
      />

      <main className="budget-setup__scroll">
        <div className="budget-setup__intro">
          <h2 className="budget-setup__intro-title">이번 달 생활비 예산을 정해보세요</h2>
          <p className="budget-setup__intro-desc">고정비를 제외하고, 이번 달 자유롭게 사용할 금액이에요.</p>
        </div>

        <div className="budget-setup__hero">
          <img src={img('02money-budget-character.png')} alt="" />
        </div>

        <div
          key={recommendFlashKey}
          className={`budget-setup__stepper${recommendFlashKey > 0 ? ' budget-setup__stepper--flash' : ''}`}
        >
          <span className="budget-setup__stepper-label">이번 달 생활비 예산</span>
          <div className="budget-setup__stepper-row">
            <button
              type="button"
              className="budget-setup__stepper-btn"
              aria-label="예산 10,000원 줄이기 (길게 누르면 계속 줄어요)"
              disabled={budget <= BUDGET_MIN}
              {...decreaseHold}
            >
              −
            </button>
            <span key={pulseKey} className="budget-setup__stepper-value budget-setup__pulse">
              {shown(displayBudget).toLocaleString()}원
            </span>
            <button
              type="button"
              className="budget-setup__stepper-btn"
              aria-label="예산 10,000원 늘리기 (길게 누르면 계속 늘어요)"
              {...increaseHold}
            >
              +
            </button>
          </div>
          <button type="button" className="budget-setup__stepper-edit" onClick={openBudgetSheet}>
            직접 입력
          </button>
        </div>

        <section className="budget-setup__recommend">
          <div className="budget-setup__recommend-row">
            <div>
              <span className="budget-setup__recommend-label">자두의 추천</span>
              <p className="budget-setup__recommend-amount">{RECOMMENDED_BUDGET.toLocaleString()}원</p>
            </div>
            <button
              type="button"
              className="budget-setup__recommend-apply"
              onClick={applyRecommended}
              disabled={budget === RECOMMENDED_BUDGET}
            >
              추천 금액 적용
            </button>
          </div>
          <p className="budget-setup__recommend-caption">{RECOMMENDED_CAPTION}</p>
        </section>

        <section className="budget-setup__manage">
          <h2 className="money-section__title">이렇게 관리해요</h2>

          <div className="budget-setup__stats">
            <div className="budget-setup__stats-row">
              <span className="budget-setup__stats-label">예산</span>
              <span key={pulseKey} className="budget-setup__stats-value budget-setup__pulse">
                {shown(budget).toLocaleString()}원
              </span>
            </div>
            <div className="budget-setup__stats-row">
              <span className="budget-setup__stats-label">현재 사용</span>
              <span className="budget-setup__stats-value">{shown(CURRENT_USED).toLocaleString()}원</span>
            </div>
            <div className="budget-setup__stats-row">
              <span className="budget-setup__stats-label">남은 예산</span>
              <span
                key={pulseKey}
                className={`budget-setup__stats-value budget-setup__pulse${isOverBudget ? ' is-negative' : ''}`}
              >
                {shown(remaining).toLocaleString()}원
              </span>
            </div>
          </div>

          <div className={`budget-setup__today${isOverBudget ? ' is-negative' : ''}`}>
            {isOverBudget ? (
              <>
                <span>이미 예산을 초과했어요</span>
                <span key={pulseKey} className="budget-setup__today-value budget-setup__pulse">
                  {shown(Math.abs(remaining)).toLocaleString()}원 초과
                </span>
              </>
            ) : (
              <>
                <span>오늘 쓸 수 있는 금액</span>
                <span key={pulseKey} className="budget-setup__today-value budget-setup__pulse">
                  약 {shown(todaySpendable).toLocaleString()}원
                </span>
              </>
            )}
          </div>
          {!isOverBudget && (
            <div className="budget-setup__today-guide">
              <span className="budget-setup__today-guide-icon" aria-hidden="true">
                i
              </span>
              <span className="budget-setup__today-guide-title">
                남은 예산을 이번 달 남은 {DAYS_LEFT_IN_MONTH}일로 나눈 금액이에요.
              </span>
            </div>
          )}
        </section>
      </main>

      {/* 진행 막대 — 예산 설정하기 버튼처럼 스크롤을 따라가지 않고 그 바로 위에 고정된다(예산을 바꾸는 동안 사용률이 늘 보인다) */}
      <div className="budget-setup__dock">
        <div className={`budget-setup__progress${progressState}${introDone ? '' : ' is-intro'}`}>
          <div
            className="budget-setup__progress-fill"
            style={{ width: `${introDone ? percentUsed : percentUsed * intro}%` }}
          />
        </div>
        <p className="budget-setup__progress-label">
          진행률{' '}
          <span key={pulseKey} className="budget-setup__pulse">
            {shown(percentUsed)}%
          </span>
          {(isOverBudget || isNearLimit) && (
            <span className={`budget-setup__progress-status${isOverBudget ? ' is-over' : ''}`}>
              {' · '}
              {isOverBudget ? '예산 초과' : '거의 다 썼어요'}
            </span>
          )}
        </p>

      </div>

      <button
        type="button"
        className={`budget-setup__submit${justSaved ? ' is-done' : ''}`}
        onClick={handleSubmit}
        disabled={justSaved}
      >
        {justSaved ? '설정 완료!' : '예산 설정하기'}
      </button>

      <BottomNavigation activeTab="money" />

      <BottomSheet
        open={budgetSheetOpen}
        className="budget-sheet"
        labelledBy={budgetSheetTitleId}
        onDimClick={closeBudgetSheet}
      >
        <div className="bsheet__grip">
          <span />
        </div>
        <div className="budget-sheet__header">
          <h2 className="budget-sheet__title" id={budgetSheetTitleId}>
            예산을 직접 입력해볼까요?
          </h2>
          <button type="button" className="budget-sheet__close" aria-label="닫기" onClick={closeBudgetSheet}>
            <img src={icon('sheet-close.svg')} alt="" />
          </button>
        </div>
        <form className="budget-sheet__form" onSubmit={submitBudgetSheet}>
          <label className="budget-sheet__field">
            <span className="budget-sheet__label">예산 금액</span>
            <span className="budget-sheet__input-row">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                autoFocus
                value={budgetSheetValue ? budgetSheetNumeric.toLocaleString() : ''}
                onChange={(e) => setBudgetSheetValue(e.target.value)}
                aria-label="예산 금액"
              />
              <span>원</span>
            </span>
          </label>
          <button type="submit" className="budget-sheet__submit" disabled={budgetSheetValue.trim() === ''}>
            적용하기
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}

export default MoneyBudgetPage;
