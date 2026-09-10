import { useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { icon } from '../lib/asset';

/* 돈 관리 상단 탭 — Figma IA 그대로 4개. '이번 달'만 실제 화면이 있고
 * 소비/고정비/비상금은 아직 route 가 없어 시각적으로만 존재한다
 * (LifePage.tsx 의 "첫 자취만 화면 있고 나머지는 route 안 만든다"와 같은 방식). */
const TABS = ['이번 달', '소비', '고정비', '비상금'] as const;
type Tab = (typeof TABS)[number];

/* 이번 달 요약 — 실제 백엔드 없이 다른 화면들과 같은 방식으로 정적 목업 데이터를 쓴다. */
const MONTH_LABEL = '2026년 9월';
const SPENDABLE = 358_000;
const BUDGET = 1_000_000;
const BUDGET_USED_PERCENT = 64;
const TODAY_SPENDABLE = 19_900;
const COMPARE_TEXT = '+ 지난달보다 128,000원 적게 썼어요.';

const FLOW_ROWS = [
  { key: 'income', icon: 'money-income.svg', label: '수입', value: '+2,500,000원', emphasis: false },
  { key: 'spend', icon: 'money-spend.svg', label: '소비', value: '-642,000원', emphasis: false },
  { key: 'fixed', icon: 'money-fixed.svg', label: '고정비', value: '-894,400원', emphasis: false },
  { key: 'balance', icon: 'money-balance.svg', label: '현재 여유자금', value: '963,600원', emphasis: true },
] as const;

const UPCOMING_EXPENSES = [
  { key: 'rent', label: '월세', value: '-650,000원' },
  { key: 'telecom', label: '통신비', value: '-58,000원' },
  { key: 'insurance', label: '보험료', value: '-32,000원' },
] as const;

const EMERGENCY_FUND = {
  current: 1_200_000,
  target: 3_000_000,
  percent: 40,
  caption: '예상치 못한 순간을 위해, 조금씩 준비하고 있어요.',
};

const AI_TIP = {
  title: '이번 달은 식비가 조금 줄었어요.',
  sub: '배달비를 한 번 더 줄여볼까요?',
};

/* 돈 관리 — 탭바 '돈관리' 로 들어오는 메인 화면(이번 달 탭).
 * 목적: "이번 달을 무리 없이 살아갈 수 있는가?" 를 한눈에 보여준다(CLAUDE.md 8. Money Rules).
 * 상세 고정비 결제 일정은 여기서 반복하지 않고 "이번 달 예정된 지출" 미리보기 3개 + "더보기"로만
 * 보여준다 — 고정비 탭 화면이 아직 없어 지금은 링크 동작을 만들지 않는다. */
export function MoneyPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('이번 달');

  return (
    <div className="money app">
      <SubPageHeader
        title="돈관리"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="money__scroll">
        <div className="money__tabs" role="tablist" aria-label="돈 관리 구분">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={`money__tab${tab === item ? ' is-active' : ''}`}
              /* '이번 달' 외에는 아직 화면이 없어 탭 자체를 누를 수만 있고 내용은 안 바뀐다 */
              onClick={item === '이번 달' ? () => setTab(item) : undefined}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="money__month">
          <span className="money__month-label">{MONTH_LABEL}</span>
        </div>

        <section className="money-budget">
          <div className="money-budget__head">
            <span className="money-budget__title">이번 달 쓸 수 있는 돈</span>
            <button type="button" className="money-budget__edit">
              예산 설정
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </button>
          </div>
          <p className="money-budget__amount">{SPENDABLE.toLocaleString()}원</p>
          <div className="money-budget__foot">
            <span className="money-budget__cap">예산 {BUDGET.toLocaleString()}원</span>
            <span className="money-budget__percent">{BUDGET_USED_PERCENT}% 사용</span>
          </div>
          <div className="money-budget__bar">
            <div className="money-budget__bar-fill" style={{ width: `${BUDGET_USED_PERCENT}%` }} />
          </div>
        </section>

        <button type="button" className="money-today">
          <span>오늘 쓸 수 있는 돈</span>
          <span className="money-today__value">
            {TODAY_SPENDABLE.toLocaleString()}원
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </span>
        </button>

        <p className="money-compare">{COMPARE_TEXT}</p>

        <section className="money-section">
          <h2 className="money-section__title">이번 달 돈 흐름</h2>
          <div className="money-flow">
            {FLOW_ROWS.map((row) => (
              <div key={row.key} className="money-flow__row">
                <span className="money-flow__left">
                  <span className="money-flow__badge">
                    <img src={icon(row.icon)} alt="" />
                  </span>
                  <span className="money-flow__label">{row.label}</span>
                </span>
                <span className={`money-flow__value${row.emphasis ? ' is-emphasis' : ''}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="money-section">
          <div className="money-section__head">
            <h2 className="money-section__title">이번 달 예정된 지출</h2>
            <span className="money-section__more">
              더보기
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </span>
          </div>
          <div className="money-upcoming">
            {UPCOMING_EXPENSES.map((item) => (
              <div key={item.key} className="money-upcoming__row">
                <span className="money-upcoming__label">{item.label}</span>
                <span className="money-upcoming__value">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="money-section">
          <div className="money-section__head">
            <h2 className="money-section__title">비상금</h2>
            <span className="money-section__more">
              관리
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </span>
          </div>
          <div className="money-emergency">
            <div className="money-emergency__row">
              <p className="money-emergency__amount">
                {EMERGENCY_FUND.current.toLocaleString()}원
                <span className="money-emergency__target"> / {EMERGENCY_FUND.target.toLocaleString()}원</span>
              </p>
              <span className="money-emergency__percent">{EMERGENCY_FUND.percent}%</span>
            </div>
            <div className="money-emergency__bar">
              <div className="money-emergency__bar-fill" style={{ width: `${EMERGENCY_FUND.percent}%` }} />
            </div>
            <p className="money-emergency__caption">{EMERGENCY_FUND.caption}</p>
          </div>
        </section>

        <section className="money-section money-section--tip">
          <h2 className="money-section__title">자두의 한마디</h2>
          <div className="money-tip">
            <p className="money-tip__title">{AI_TIP.title}</p>
            <p className="money-tip__sub">{AI_TIP.sub}</p>
          </div>
        </section>
      </main>

      <BottomNavigation activeTab="money" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={DEFAULT_MENU}
        onClose={() => setGnbOpen(false)}
        onEditMenu={() => setGnbOpen(false)}
      />
      <AIChatbot />
    </div>
  );
}

export default MoneyPage;
