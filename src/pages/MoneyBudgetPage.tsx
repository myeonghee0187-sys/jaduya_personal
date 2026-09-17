import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { BottomSheet } from '../components/BottomSheet';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';

/* 돈관리 > 예산 설정 — Figma node 2628:28275 "예산" 기준.
 * "이번 달" 탭의 "예산 설정" 버튼으로 들어오는 하위 화면이다(탭바는 '돈관리' active 유지).
 * 다른 하위 화면들과 같은 방식으로 이 화면만의 정적 목업 데이터를 쓰고, 저장 시 MoneyPage의
 * 예산 값과 실제로 동기화하지는 않는다 — 필요해지면 작은 공용 상태(Context)로 옮긴다.
 *
 * 인터랙션은 Figma에 모션 스펙이 없어(get_motion_context 결과 없음) 앱 전반의 관례를 따라
 * 순수 CSS transition + key-remount 트릭으로만 만든다(별도 애니메이션 라이브러리 없음). */

const BUDGET_STEP = 10_000;
const BUDGET_MIN = 0;
const RECOMMENDED_BUDGET = 850_000;
const RECOMMENDED_CAPTION = '지난달 소비와 이번 달 고정비를 기준으로 약 85만원을 추천해요.';
/* 저장 버튼을 누른 뒤 "설정 완료!" 상태를 보여주는 시간 — 이 시간만큼 지나면 돈관리로 이동한다 */
const SUBMIT_CONFIRM_MS = 260;

/* 이번 달 이미 쓴 금액 — 예산을 조절해도 바뀌지 않는 값이다 */
const CURRENT_USED = 730_000;
/* 이번 달 남은 일수 — 남은 예산을 균등하게 나눠 "오늘 쓸 수 있는 금액"을 계산한다 */
const DAYS_LEFT_IN_MONTH = 10;

export function MoneyBudgetPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const [budget, setBudget] = useState(1_000_000);
  const [justSaved, setJustSaved] = useState(false);

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

  /* 진행률 바 진입 애니메이션 — 처음엔 0%로 그렸다가 다음 프레임에 실제 값으로 올려서
   * width transition이 "차오르는" 연출로 재생되게 한다 */
  const [progressMounted, setProgressMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgressMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const remaining = budget - CURRENT_USED;
  const isOverBudget = remaining < 0;
  const percentUsed = budget > 0 ? Math.min(100, Math.max(0, Math.round((CURRENT_USED / budget) * 100))) : 100;
  const todaySpendable = Math.round(remaining / DAYS_LEFT_IN_MONTH);
  /* 초과는 아니지만 거의 다 썼을 때(80%+) 미리 알려주는 중간 경고 단계 */
  const isNearLimit = !isOverBudget && percentUsed >= 80;
  const progressState = isOverBudget ? ' is-over' : isNearLimit ? ' is-near' : '';

  const decreaseBudget = () => setBudget((prev) => Math.max(BUDGET_MIN, prev - BUDGET_STEP));
  const increaseBudget = () => setBudget((prev) => prev + BUDGET_STEP);
  const applyRecommended = () => {
    setBudget(RECOMMENDED_BUDGET);
    setRecommendFlashKey((key) => key + 1);
  };

  const handleSubmit = () => {
    if (justSaved) return;
    setJustSaved(true);
    window.setTimeout(() => navigation?.navigate('money'), SUBMIT_CONFIRM_MS);
  };

  return (
    <div className="budget-setup app">
      <SubPageHeader
        title="예산 설정"
        backLabel="돈관리로"
        onBack={() => navigation?.navigate('money')}
        onMenu={() => setGnbOpen(true)}
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
              aria-label="예산 10,000원 줄이기"
              onClick={decreaseBudget}
              disabled={budget <= BUDGET_MIN}
            >
              −
            </button>
            <span key={pulseKey} className="budget-setup__stepper-value budget-setup__pulse">
              {budget.toLocaleString()}원
            </span>
            <button
              type="button"
              className="budget-setup__stepper-btn"
              aria-label="예산 10,000원 늘리기"
              onClick={increaseBudget}
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
                {budget.toLocaleString()}원
              </span>
            </div>
            <div className="budget-setup__stats-row">
              <span className="budget-setup__stats-label">현재 사용</span>
              <span className="budget-setup__stats-value">{CURRENT_USED.toLocaleString()}원</span>
            </div>
            <div className="budget-setup__stats-row">
              <span className="budget-setup__stats-label">남은 예산</span>
              <span
                key={pulseKey}
                className={`budget-setup__stats-value budget-setup__pulse${isOverBudget ? ' is-negative' : ''}`}
              >
                {remaining.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className={`budget-setup__progress${progressState}`}>
            <div
              className="budget-setup__progress-fill"
              style={{ width: `${progressMounted ? percentUsed : 0}%` }}
            />
          </div>
          <p className="budget-setup__progress-label">
            진행률{' '}
            <span key={pulseKey} className="budget-setup__pulse">
              {percentUsed}%
            </span>
          </p>

          <div className={`budget-setup__today${isOverBudget ? ' is-negative' : ''}`}>
            {isOverBudget ? (
              <>
                <span>이미 예산을 초과했어요</span>
                <span key={pulseKey} className="budget-setup__today-value budget-setup__pulse">
                  {Math.abs(remaining).toLocaleString()}원 초과
                </span>
              </>
            ) : (
              <>
                <span>오늘 쓸 수 있는 금액</span>
                <span key={pulseKey} className="budget-setup__today-value budget-setup__pulse">
                  약 {todaySpendable.toLocaleString()}원
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

        <button
          type="button"
          className={`budget-setup__submit${justSaved ? ' is-done' : ''}`}
          onClick={handleSubmit}
          disabled={justSaved}
        >
          {justSaved ? '설정 완료!' : '예산 설정하기'}
        </button>
      </main>

      <BottomNavigation activeTab="money" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />

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
