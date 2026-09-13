import { useEffect, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { ConsumptionRadar, type RadarCategory } from '../components/money/ConsumptionRadar';
import { EmergencyRing } from '../components/money/EmergencyRing';
import { ScratchReveal } from '../components/money/ScratchReveal';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';

/* 돈 관리 상단 탭 — Figma IA 그대로 4개. 이제 4개 모두 실제 화면이 있다. */
const TABS = ['이번 달', '소비', '고정비', '비상금'] as const;
type Tab = (typeof TABS)[number];
const TAB_HAS_SCREEN: Record<Tab, boolean> = { '이번 달': true, 소비: true, 고정비: true, 비상금: true };

/* 이번 달 요약 — 실제 백엔드 없이 다른 화면들과 같은 방식으로 정적 목업 데이터를 쓴다. */
const SPENDABLE = 358_000;
const BUDGET = 1_000_000;
const BUDGET_USED_PERCENT = 64;
const TODAY_SPENDABLE = 19_900;
/* "지난달보다" 는 라벨과 값을 분리해 오늘/비교 카드 두 칸에 각각 쓴다 */
const COMPARE_LABEL = '지난달보다';
const COMPARE_VALUE = '128,000원 적게 썼어요.';

/* 돈 흐름 아이콘은 한 장의 스프라이트(money-flow-icons.png, 수입·소비·고정비·현재 여유자금 2x2 그리드)에서
 * 원형으로 잘라 쓴다. spriteStyle 은 Figma image fill 크롭 값 그대로 옮긴 것이라 임의로 바꾸지 않는다.
 * date 는 "이번 달 예정된 지출" 타임라인과 동일한 값으로 맞춰 둔다(CLAUDE.md 13. 동일 데이터 정합). */
const FLOW_ROWS = [
  {
    key: 'income',
    label: '수입',
    date: '9월 5일',
    value: '+2,500,000원',
    emphasis: false,
    spriteStyle: { left: '-76.34%', top: '-10.04%', width: '386.18%', height: '259.16%' },
  },
  {
    key: 'spend',
    label: '소비',
    date: '9월 5일',
    value: '-642,000원',
    emphasis: false,
    spriteStyle: { left: '-207.24%', top: '-10.04%', width: '386.18%', height: '259.16%' },
  },
  {
    key: 'fixed',
    label: '고정비',
    date: '9월 3일',
    value: '-894,400원',
    emphasis: false,
    spriteStyle: { left: '-76.34%', top: '-128.91%', width: '386.18%', height: '259.16%' },
  },
  {
    key: 'balance',
    label: '현재 여유자금',
    date: '9월 1일',
    value: '963,600원',
    emphasis: true,
    spriteStyle: { left: '-206.77%', top: '-128.91%', width: '386.18%', height: '259.16%' },
  },
] as const;

/* 예정된 지출 미리보기 카드 — 아이콘은 "고정비" 탭 결제 예정 타임라인과 같은 스프라이트
 * (money-fixed-schedule-icons.png)를 그대로 쓴다. date 도 그 타임라인 값과 동일하게 맞춘다. */
const UPCOMING_EXPENSES = [
  {
    key: 'rent',
    label: '월세',
    value: '-650,000원',
    date: '9월 10일',
    spriteStyle: { left: '-93.67%', top: '-15.79%', width: '451.9%', height: '313.16%' },
  },
  {
    key: 'telecom',
    label: '통신비',
    value: '-58,000원',
    date: '9월 15일',
    spriteStyle: { left: '-257.61%', top: '-168.45%', width: '451.9%', height: '313.16%' },
  },
  {
    key: 'insurance',
    label: '보험료',
    value: '-32,000원',
    date: '9월 20일',
    spriteStyle: { left: '-93.13%', top: '-168.45%', width: '451.9%', height: '313.16%' },
  },
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

/* ---------- 소비 탭 — Figma node 2628:27950 "소비" 기준 목업 데이터 ---------- */
type IncomeExpense = '지출' | '수입';

const CONSUME_TOTAL = 642_000;
const CONSUME_PREV = 917_000;
const CONSUME_CHANGE_PERCENT = 8.2;

/* 이번 달 소비 흐름 — 1~30일 일별 막대(px, 최대 76px 트랙 기준)+ 실제 사용 금액.
 * 오늘(9월 20일) 이후는 아직 지출이 없어 막대만 최소 높이로 두고 금액은 0으로 둔다.
 * 막대를 탭하면 그 날짜로 헤더가 바뀐다 — 기본 선택은 오늘. */
const TODAY_DAY = 20;
const DAILY_FLOW = [
  { day: 1, height: 8, amount: 4_000 },
  { day: 2, height: 20, amount: 9_000 },
  { day: 3, height: 31, amount: 14_000 },
  { day: 4, height: 5, amount: 2_000 },
  { day: 5, height: 15, amount: 7_000 },
  { day: 6, height: 51, amount: 23_000 },
  { day: 7, height: 23, amount: 10_000 },
  { day: 8, height: 10, amount: 5_000 },
  { day: 9, height: 36, amount: 16_000 },
  { day: 10, height: 18, amount: 8_000 },
  { day: 11, height: 8, amount: 4_000 },
  { day: 12, height: 28, amount: 13_000 },
  { day: 13, height: 64, amount: 29_000 },
  { day: 14, height: 13, amount: 6_000 },
  { day: 15, height: 20, amount: 9_000 },
  { day: 16, height: 5, amount: 2_000 },
  { day: 17, height: 15, amount: 7_000 },
  { day: 18, height: 23, amount: 10_000 },
  { day: 19, height: 10, amount: 5_000 },
  { day: 20, height: 31, amount: 12_000 },
  { day: 21, height: 2, amount: 0 },
  { day: 22, height: 2, amount: 0 },
  { day: 23, height: 2, amount: 0 },
  { day: 24, height: 2, amount: 0 },
  { day: 25, height: 2, amount: 0 },
  { day: 26, height: 2, amount: 0 },
  { day: 27, height: 2, amount: 0 },
  { day: 28, height: 2, amount: 0 },
  { day: 29, height: 2, amount: 0 },
  { day: 30, height: 2, amount: 0 },
] as const;

/* 내 소비 리포트 — 레이더 차트 5축. value 는 0~100 상대 비중, compare 는 지난달 평균선 */
const RADAR_CATEGORIES: RadarCategory[] = [
  { key: 'food', label: '식비', value: 92 },
  { key: 'shopping', label: '쇼핑', value: 58 },
  { key: 'transport', label: '교통', value: 30 },
  { key: 'life', label: '생활', value: 22 },
  { key: 'leisure', label: '여가', value: 46 },
];
const RADAR_COMPARE = [55, 68, 32, 25, 40];
const RADAR_CAPTION = '식비는 평균보다 높고, 쇼핑은 지난번 보다 줄었어요.';

/* 어디에 많이 썼을까요? — 상위 4개는 Figma 그대로, 나머지 2개는 "더보기"에서만 노출 */
const SPEND_CATEGORIES = [
  { key: 'food', icon: 'money-cat-food.svg', label: '식비', amount: 328_000, percent: 39, color: 'var(--brand-primary)' },
  { key: 'shopping', icon: 'money-cat-shopping.svg', label: '쇼핑', amount: 182_000, percent: 22, color: 'var(--brand-orange)' },
  { key: 'transport', icon: 'money-cat-transport.svg', label: '교통', amount: 91_000, percent: 11, color: 'var(--brand-green)' },
  { key: 'culture', icon: 'money-cat-culture.svg', label: '문화/여가', amount: 63_000, percent: 7, color: '#a39f9a' },
  { key: 'life', icon: 'money-cat-culture.svg', label: '생활', amount: 48_000, percent: 6, color: '#a39f9a' },
  { key: 'etc', icon: 'money-cat-culture.svg', label: '기타', amount: 18_000, percent: 2, color: '#a39f9a' },
] as const;
const SPEND_CATEGORIES_PREVIEW = 4;

/* 카테고리 행을 탭하면 펼쳐지는 가맹점 상위 내역. 합계가 카테고리 금액과 정확히 맞을 필요는 없다
 * (다른 화면들도 정적 목업 데이터라 완전히 정합하지 않는다). */
const CATEGORY_MERCHANTS: Record<string, { name: string; amount: number }[]> = {
  food: [
    { name: '배달의민족', amount: 84_000 },
    { name: '스타벅스', amount: 42_000 },
    { name: 'GS25', amount: 28_000 },
  ],
  shopping: [
    { name: '무신사', amount: 96_000 },
    { name: '쿠팡', amount: 58_000 },
  ],
  transport: [
    { name: '대중교통', amount: 71_000 },
    { name: '카카오T', amount: 20_000 },
  ],
  culture: [
    { name: 'CGV', amount: 33_000 },
    { name: '넷플릭스 외 구독', amount: 30_000 },
  ],
  life: [{ name: '다이소', amount: 48_000 }],
  etc: [{ name: '기타 결제', amount: 18_000 }],
};

/* 카테고리 리스트 선택 → 레이더 차트 축 강조 매핑. '기타'는 레이더에 대응 축이 없어 강조하지 않는다 */
const CATEGORY_TO_RADAR_KEY: Record<string, string | undefined> = {
  food: 'food',
  shopping: 'shopping',
  transport: 'transport',
  culture: 'leisure',
  life: 'life',
};

/* 월 선택 pill — 실제로 열리고 닫히지만, 다른 달 데이터는 아직 없어 이번 달만 선택 가능하다 */
const MONTH_OPTIONS = ['2026년 9월', '2026년 8월', '2026년 7월'] as const;

const CONSUME_INSIGHT = {
  title: '식비가 평소보다 42,000원 더 늘었어요.',
  sub: '특히 배달앱 이용이 3번 늘었어요.',
};

const BENEFIT_TEXT = '서준님에게 맞는 생활비 지원 혜택을 찾았어요!';

/* ---------- 고정비 탭 — Figma node 2628:27757 "고정비" 기준 목업 데이터 ---------- */
const FIXED_TOTAL = 894_400;
const FIXED_TOTAL_CAPTION = '매달 자동으로 나가는 돈이에요.';
const FIXED_SHARE_PERCENT = 47;
const FIXED_TREND_LABEL = '지난 달과 비슷해요';
const FIXED_TREND_VALUE = '+2,000원';

/** Figma image fill 크롭 값(%) 그대로 — 스프라이트 한 장을 여러 원형 썸네일로 나눠 쓴다. */
interface SpriteCrop {
  left: string;
  top: string;
  width: string;
  height: string;
}

interface FixedCategory {
  key: string;
  name: string;
  sub: string | null;
  apps: readonly ('netflix' | 'youtube' | 'disney')[] | null;
  appsMore?: number;
  amount: number;
  percent: number;
  barColor: string;
  spriteStyle: SpriteCrop;
  /** 행을 탭하면 펼쳐지는 세부 항목 — 합은 amount 와 맞춰 둔다(CLAUDE.md 13. 동일 데이터 정합). */
  items: { name: string; amount: number }[];
}

/* 카테고리 썸네일은 한 장의 스프라이트(money-fixed-category-icons.png, 주거비·통신·보험 순)에서
 * 원형으로 잘라 쓴다. spriteStyle 은 Figma image fill 크롭 값 그대로 옮긴 것이라 임의로 바꾸지 않는다. */
const FIXED_CATEGORIES: FixedCategory[] = [
  {
    key: 'housing',
    name: '주거비',
    sub: '월세 · 관리비 · 공과금',
    apps: null,
    amount: 737_400,
    percent: 82,
    barColor: 'var(--brand-rose)',
    spriteStyle: { left: '-33.64%', top: '-5.45%', width: '398.15%', height: '130.3%' },
    items: [
      { name: '월세', amount: 550_000 },
      { name: '관리비', amount: 120_000 },
      { name: '공과금', amount: 67_400 },
    ],
  },
  {
    key: 'telecom',
    name: '통신 · 구독',
    sub: null,
    apps: ['netflix', 'youtube', 'disney'],
    appsMore: 2,
    amount: 72_900,
    percent: 10,
    barColor: 'var(--brand-rose)',
    spriteStyle: { left: '-148.95%', top: '-5.45%', width: '398.15%', height: '130.3%' },
    /* Netflix 17,000원은 "이번 달 결제 예정" 타임라인과 동일한 값으로 맞춰 둔다 */
    items: [
      { name: 'Netflix', amount: 17_000 },
      { name: 'Youtube Premium', amount: 14_900 },
      { name: 'Disney+', amount: 9_900 },
      { name: '기타 구독 2건', amount: 31_100 },
    ],
  },
  {
    key: 'insurance',
    name: '보험',
    sub: '건강보험 · 애견보험',
    apps: null,
    amount: 84_100,
    percent: 8,
    barColor: 'var(--brand-orange)',
    spriteStyle: { left: '-263.67%', top: '-5.45%', width: '398.15%', height: '130.3%' },
    /* 애견보험 32,000원도 타임라인의 "보험료" 항목과 동일한 값 */
    items: [
      { name: '건강보험', amount: 52_100 },
      { name: '애견보험', amount: 32_000 },
    ],
  },
];

interface FixedScheduleItem {
  key: string;
  date: string;
  label: string;
  value: string;
  dday: string;
  urgent: boolean;
  /** 없으면 Netflix 코드-배지(원형 N)를 쓴다 — Figma 도 Netflix 만 로고 이미지가 아니라 배지다. */
  spriteStyle?: SpriteCrop;
  /** 행을 탭하면 펼쳐지는 결제 수단 한 줄 */
  method: string;
  auto: boolean;
}

/* 결제 예정 아이콘은 스프라이트(money-fixed-schedule-icons.png, 월세·공과금·보험료·휴대폰요금
 * 2x2 그리드) 하나를 공유한다. */
const FIXED_SCHEDULE: FixedScheduleItem[] = [
  {
    key: 'netflix',
    date: '9.5',
    label: 'Netflix',
    value: '-17,000원',
    dday: 'D-1',
    urgent: true,
    method: '신한카드 · •• 4821',
    auto: true,
  },
  {
    key: 'rent',
    date: '9.10',
    label: '월세',
    spriteStyle: { left: '-93.67%', top: '-15.79%', width: '451.9%', height: '313.16%' },
    value: '-650,000원',
    dday: 'D-6',
    urgent: false,
    method: '자두뱅크 자동이체',
    auto: true,
  },
  {
    key: 'phone',
    date: '9.15',
    label: '휴대폰 요금',
    spriteStyle: { left: '-257.61%', top: '-168.45%', width: '451.9%', height: '313.16%' },
    value: '-58,000원',
    dday: 'D-11',
    urgent: false,
    method: 'SKT 자동납부',
    auto: true,
  },
  {
    key: 'insurance-fee',
    date: '9.20',
    label: '보험료',
    spriteStyle: { left: '-93.13%', top: '-168.45%', width: '451.9%', height: '313.16%' },
    value: '-32,000원',
    dday: 'D-16',
    urgent: false,
    method: '삼성카드 · •• 9012',
    auto: true,
  },
];

const FIXED_INSIGHT = {
  title: '이번 달 고정비가 지난 달과 비슷해요.',
  sub: '서준님의 조건에 맞는 혜택을 한번 찾아볼까요?',
};

/* ---------- 비상금 탭 — Figma node 2628:27675 "비상금" 기준 목업 데이터 ---------- */
const FUND_MONTHLY_ADD = { amount: 50_000, diffFromLastMonth: 10_000 };
const SIMILAR_USERS_AVG = 3_000_000;

interface SavingPlan {
  key: string;
  monthlyAmount: number;
  monthsLeft: number;
}

const SAVING_PLANS: SavingPlan[] = [
  { key: 'p10', monthlyAmount: 100_000, monthsLeft: 18 },
  { key: 'p15', monthlyAmount: 150_000, monthsLeft: 12 },
];

const FUND_GUIDE = {
  title: '나와 비슷한 자취생은',
  sub: `평균 ${SIMILAR_USERS_AVG.toLocaleString()}원을 준비하고 있어요.`,
};

/* 돈 관리 — 탭바 '돈관리' 로 들어오는 메인 화면(이번 달 탭).
 * 목적: "이번 달을 무리 없이 살아갈 수 있는가?" 를 한눈에 보여준다(CLAUDE.md 8. Money Rules).
 * 상세 고정비 결제 일정은 여기서 반복하지 않고 "이번 달 예정된 지출" 미리보기 3개 + "더보기"로만
 * 보여준다 — 고정비 탭의 "전체보기/더보기"도 아직 상세 route 가 없어 시각 요소로만 둔다. */
export function MoneyPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const [tab, setTab] = useState<Tab>('이번 달');
  /* 이번 달 쓸 수 있는 돈 — 여러 금융앱처럼 기본값은 가려진 상태(true)로 시작한다.
   * 예산 한도·사용률은 민감 정보가 아니라 가리지 않고, "쓸 수 있는 돈" 금액만 잠금 아이콘 +
   * "금액 보기" 버튼으로 가린다. 다시 누르면 가려진다. */
  const [budgetHidden, setBudgetHidden] = useState(true);
  const [summaryMonth, setSummaryMonth] = useState<(typeof MONTH_OPTIONS)[number]>(MONTH_OPTIONS[0]);
  const [summaryMonthMenuOpen, setSummaryMonthMenuOpen] = useState(false);
  const [ioType, setIoType] = useState<IncomeExpense>('지출');
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [selectedDay, setSelectedDay] = useState(TODAY_DAY);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [consumeMonth, setConsumeMonth] = useState<(typeof MONTH_OPTIONS)[number]>(MONTH_OPTIONS[0]);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(SAVING_PLANS[0].key);
  const [fixedMonth, setFixedMonth] = useState<(typeof MONTH_OPTIONS)[number]>(MONTH_OPTIONS[0]);
  const [fixedMonthMenuOpen, setFixedMonthMenuOpen] = useState(false);
  const [expandedFixedCategories, setExpandedFixedCategories] = useState<string[]>([]);
  const [expandedFixedSchedule, setExpandedFixedSchedule] = useState<string | null>(null);
  /* 아직 화면이 없는 링크는 MyPage.tsx 와 같은 방식으로 토스트만 띄운다 — 없는 route 를 만들지 않는다 */
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const toggleFixedCategory = (key: string) =>
    setExpandedFixedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const selectedDayFlow = DAILY_FLOW.find((d) => d.day === selectedDay) ?? DAILY_FLOW[TODAY_DAY - 1];

  return (
    <div className="money app">
      <SubPageHeader
        title="돈 관리"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="money__scroll">
        <div className="money__tabs-row">
          <div className="money__tabs" role="tablist" aria-label="돈 관리 구분">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={`money__tab${tab === item ? ' is-active' : ''}`}
                /* 화면이 없는 탭(고정비/비상금)은 누를 수만 있고 내용은 안 바뀐다 */
                onClick={TAB_HAS_SCREEN[item] ? () => setTab(item) : undefined}
              >
                {item}
              </button>
            ))}
          </div>

          {/* '이번 달' 탭의 월 선택 — 소비/고정비 탭과 같은 드롭다운 컴포넌트를 탭 줄 오른쪽에 붙인다 */}
          {tab === '이번 달' && (
            <div className="money-month-dropdown money-month-dropdown--end">
              <button
                type="button"
                className="money__month-label money__month-label--btn"
                aria-expanded={summaryMonthMenuOpen}
                onClick={() => setSummaryMonthMenuOpen((v) => !v)}
              >
                <img src={icon('menu-calendar.svg')} alt="" className="money__month-label__calendar" />
                {summaryMonth}
                <img
                  src={icon('chevron-down-thin.svg')}
                  alt=""
                  className={summaryMonthMenuOpen ? 'is-open' : ''}
                />
              </button>
              {summaryMonthMenuOpen && (
                <div className="money-month-menu" role="listbox" aria-label="월 선택">
                  {MONTH_OPTIONS.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      role="option"
                      aria-selected={summaryMonth === month}
                      disabled={index > 0}
                      className={`money-month-menu__item${summaryMonth === month ? ' is-active' : ''}`}
                      onClick={() => {
                        setSummaryMonth(month);
                        setSummaryMonthMenuOpen(false);
                      }}
                    >
                      {month}
                      {index > 0 && <span className="money-month-menu__soon">준비 중</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {tab === '이번 달' && (
          <>
            <section className="money-budget">
              <img src={img('money-budget-character.png')} alt="" className="money-budget__mascot" />
              <div className="money-budget__head">
                <span className="money-budget__title-group">
                  <span className="money-budget__title">이번 달 쓸 수 있는 돈</span>
                  <img src={icon('info.svg')} alt="" className="money-budget__info" />
                </span>
                <button
                  type="button"
                  className="money-budget__edit"
                  onClick={() => navigation?.navigate('money-budget')}
                >
                  예산 설정
                  <img src={icon('chevron-right-primary.svg')} alt="" />
                </button>
              </div>

              {budgetHidden ? (
                <>
                  <button
                    type="button"
                    className="money-budget__reveal"
                    onClick={() => setBudgetHidden(false)}
                  >
                    <img src={icon('lock.svg')} alt="" />
                    금액 보기
                  </button>
                  <p className="money-budget__reveal-caption">내 예산을 확인하고 현명하게 사용해요.</p>
                </>
              ) : (
                <button
                  type="button"
                  className="money-budget__amount"
                  aria-label="금액 가리기"
                  onClick={() => setBudgetHidden(true)}
                >
                  {SPENDABLE.toLocaleString()}원
                </button>
              )}

              <div className="money-budget__foot">
                <span className="money-budget__cap">예산 {BUDGET.toLocaleString()}원</span>
                <span className="money-budget__percent">{BUDGET_USED_PERCENT}% 사용</span>
              </div>
              <div className="money-budget__bar">
                <div className="money-budget__bar-fill" style={{ width: `${BUDGET_USED_PERCENT}%` }} />
              </div>
            </section>

            <div className="money-today-compare">
              <button
                type="button"
                className="money-today-compare__col"
                onClick={() => setNotice('오늘 쓸 수 있는 돈 상세 화면은 준비 중이에요.')}
              >
                <span className="money-today-compare__label">오늘 쓸 수 있는 돈</span>
                <span className="money-today-compare__value">
                  {TODAY_SPENDABLE.toLocaleString()}원
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </span>
              </button>
              <span className="money-today-compare__divider" aria-hidden="true" />
              <div className="money-today-compare__col">
                <span className="money-today-compare__label">{COMPARE_LABEL}</span>
                <span className="money-today-compare__value money-today-compare__value--compare">
                  <img src={icon('arrow-down.svg')} alt="" />
                  {COMPARE_VALUE}
                </span>
              </div>
            </div>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">이번 달 돈 흐름</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setNotice('돈 흐름 전체보기 화면은 준비 중이에요.')}
                >
                  전체 보기
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
              </div>
              <div className="money-flow">
                {FLOW_ROWS.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    className="money-flow__row"
                    onClick={() => setNotice(`${row.label} 내역 화면은 준비 중이에요.`)}
                  >
                    <span className="money-flow__left">
                      <span className="money-flow__badge">
                        <img src={img('money-flow-icons.png')} style={row.spriteStyle} alt="" />
                      </span>
                      <span className="money-flow__text">
                        <span className="money-flow__label">{row.label}</span>
                        <span className="money-flow__date">{row.date}</span>
                      </span>
                    </span>
                    <span className="money-flow__right">
                      <span className={`money-flow__value${row.emphasis ? ' is-emphasis' : ''}`}>
                        {row.value}
                      </span>
                      <img src={icon('chevron-right-gray.svg')} alt="" />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">이번 달 예정된 지출</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setNotice('예정된 지출 화면은 준비 중이에요.')}
                >
                  더보기
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
              </div>
              <div className="money-upcoming-grid">
                {UPCOMING_EXPENSES.map((item) => (
                  <div key={item.key} className="money-upcoming-card">
                    <span className="money-upcoming-card__icon">
                      <img src={img('money-fixed-schedule-icons.png')} style={item.spriteStyle} alt="" />
                    </span>
                    <span className="money-upcoming-card__label">{item.label}</span>
                    <span className="money-upcoming-card__value">{item.value}</span>
                    <span className="money-upcoming-card__date">{item.date}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">비상금</h2>
                <button type="button" className="money-section__more" onClick={() => setTab('비상금')}>
                  관리
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
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
          </>
        )}

        {tab === '소비' && (
          <>
            <div className="money__month money__month--row">
              <div className="money-month-dropdown">
                <button
                  type="button"
                  className="money__month-label money__month-label--btn"
                  aria-expanded={monthMenuOpen}
                  onClick={() => setMonthMenuOpen((v) => !v)}
                >
                  {consumeMonth}
                  <img
                    src={icon('chevron-down-thin.svg')}
                    alt=""
                    className={monthMenuOpen ? 'is-open' : ''}
                  />
                </button>
                {monthMenuOpen && (
                  <div className="money-month-menu" role="listbox" aria-label="월 선택">
                    {MONTH_OPTIONS.map((month, index) => (
                      <button
                        key={month}
                        type="button"
                        role="option"
                        aria-selected={consumeMonth === month}
                        disabled={index > 0}
                        className={`money-month-menu__item${consumeMonth === month ? ' is-active' : ''}`}
                        onClick={() => {
                          setConsumeMonth(month);
                          setMonthMenuOpen(false);
                        }}
                      >
                        {month}
                        {index > 0 && <span className="money-month-menu__soon">준비 중</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="money-io-toggle" role="tablist" aria-label="지출 수입 구분">
                {(['지출', '수입'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={ioType === type}
                    className={`money-io-toggle__btn${ioType === type ? ' is-active' : ''}`}
                    onClick={() => setIoType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {ioType === '수입' ? (
              <p className="money-consume-empty">수입 내역은 아직 준비 중이에요.</p>
            ) : (
              <>
                <section className="money-consume-summary">
                  <span className="money-consume-summary__title">이번 달 소비</span>
                  <div className="money-consume-summary__row">
                    <p className="money-consume-summary__amount">{CONSUME_TOTAL.toLocaleString()}원</p>
                    <div className="money-consume-summary__compare">
                      <span className="money-consume-summary__percent">▼ {CONSUME_CHANGE_PERCENT}%</span>
                      <span className="money-consume-summary__prev">지난달 {CONSUME_PREV.toLocaleString()}원</span>
                    </div>
                  </div>
                </section>

                <section className="money-section">
                  <h2 className="money-section__title">이번 달 소비 흐름</h2>
                  <div className="money-flow-chart">
                    <div className="money-flow-chart__head">
                      <span className="money-flow-chart__date">{`9월 ${selectedDayFlow.day}일`}</span>
                      <span className="money-flow-chart__value">
                        {selectedDayFlow.amount > 0
                          ? `${selectedDayFlow.amount.toLocaleString()}원 사용`
                          : '지출 내역 없음'}
                      </span>
                    </div>
                    <div className="money-flow-chart__bars">
                      {DAILY_FLOW.map(({ day, height }) => (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={day === selectedDay}
                          aria-label={`9월 ${day}일`}
                          className={`money-flow-chart__bar${day === selectedDay ? ' is-selected' : ''}`}
                          style={{ height: `${height}px` }}
                          onClick={() => setSelectedDay(day)}
                        />
                      ))}
                    </div>
                    <div className="money-flow-chart__axis">
                      <span>1일</span>
                      <span>15일</span>
                      <span>30일</span>
                    </div>
                  </div>
                </section>

                <section className="money-section">
                  <h2 className="money-section__title">내 소비 리포트</h2>
                  <div className="money-consume-report">
                    <ConsumptionRadar
                      categories={RADAR_CATEGORIES}
                      compareValues={RADAR_COMPARE}
                      highlightKey={expandedCategory ? CATEGORY_TO_RADAR_KEY[expandedCategory] : null}
                    />
                  </div>
                  <p className="money-consume-report__caption">{RADAR_CAPTION}</p>
                </section>

                <section className="money-section">
                  <div className="money-section__head">
                    <h2 className="money-section__title">어디에 많이 썼을까요?</h2>
                    <button
                      type="button"
                      className="money-section__more"
                      onClick={() => setNotice('지출 내역 전체보기 화면은 준비 중이에요.')}
                    >
                      전체보기
                      <img src={icon('chevron-right-thin.svg')} alt="" />
                    </button>
                  </div>
                  <div className="money-cat-list">
                    {(showMoreCategories
                      ? SPEND_CATEGORIES
                      : SPEND_CATEGORIES.slice(0, SPEND_CATEGORIES_PREVIEW)
                    ).map((c) => {
                      const isExpanded = expandedCategory === c.key;
                      const merchants = CATEGORY_MERCHANTS[c.key];
                      return (
                        <div key={c.key} className={`money-cat-item${isExpanded ? ' is-expanded' : ''}`}>
                          <button
                            type="button"
                            className="money-cat-row"
                            aria-expanded={isExpanded}
                            onClick={() => setExpandedCategory(isExpanded ? null : c.key)}
                          >
                            <span className="money-cat-row__badge">
                              <img src={icon(c.icon)} alt="" />
                            </span>
                            <span className="money-cat-row__label">{c.label}</span>
                            <span className="money-cat-row__value">{c.amount.toLocaleString()}원</span>
                            <span className="money-cat-row__track">
                              <span
                                className="money-cat-row__fill"
                                style={{ width: `${c.percent}%`, background: c.color }}
                              />
                            </span>
                            <span className="money-cat-row__percent">{c.percent}%</span>
                          </button>
                          {isExpanded && merchants && (
                            <div className="money-cat-merchants">
                              {merchants.map((m) => (
                                <div key={m.name} className="money-cat-merchants__row">
                                  <span>{m.name}</span>
                                  <span>{m.amount.toLocaleString()}원</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {SPEND_CATEGORIES.length > SPEND_CATEGORIES_PREVIEW && (
                      <button
                        type="button"
                        className="money-cat-more"
                        onClick={() => setShowMoreCategories((v) => !v)}
                      >
                        {showMoreCategories
                          ? '접기'
                          : `${SPEND_CATEGORIES.length - SPEND_CATEGORIES_PREVIEW}개 더 보기`}
                        <img
                          src={icon('chevron-down-thin.svg')}
                          alt=""
                          className={showMoreCategories ? 'is-open' : ''}
                        />
                      </button>
                    )}
                  </div>
                </section>

                <section className="money-section money-section--tip">
                  <h2 className="money-section__title">이번 달 소비 인사이트</h2>
                  <div className="money-insight">
                    <img src={img('money-insight-badge.png')} alt="" className="money-insight__badge" />
                    <p className="money-insight__title">{CONSUME_INSIGHT.title}</p>
                    <p className="money-insight__sub">{CONSUME_INSIGHT.sub}</p>
                  </div>
                  <div className="money-benefit">
                    <img src={icon('money-benefit-sparkle.svg')} alt="" />
                    <span>{BENEFIT_TEXT}</span>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {tab === '고정비' && (
          <>
            <div className="money__month">
              <div className="money-month-dropdown">
                <button
                  type="button"
                  className="money__month-label money__month-label--btn"
                  aria-expanded={fixedMonthMenuOpen}
                  onClick={() => setFixedMonthMenuOpen((v) => !v)}
                >
                  {fixedMonth}
                  <img
                    src={icon('chevron-down-thin.svg')}
                    alt=""
                    className={fixedMonthMenuOpen ? 'is-open' : ''}
                  />
                </button>
                {fixedMonthMenuOpen && (
                  <div className="money-month-menu" role="listbox" aria-label="월 선택">
                    {MONTH_OPTIONS.map((month, index) => (
                      <button
                        key={month}
                        type="button"
                        role="option"
                        aria-selected={fixedMonth === month}
                        disabled={index > 0}
                        className={`money-month-menu__item${fixedMonth === month ? ' is-active' : ''}`}
                        onClick={() => {
                          setFixedMonth(month);
                          setFixedMonthMenuOpen(false);
                        }}
                      >
                        {month}
                        {index > 0 && <span className="money-month-menu__soon">준비 중</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <section className="money-fixed-total">
              <span className="money-fixed-total__title">이번 달 고정비</span>
              <p className="money-fixed-total__amount">{FIXED_TOTAL.toLocaleString()}원</p>
              <p className="money-fixed-total__caption">{FIXED_TOTAL_CAPTION}</p>
            </section>

            <div className="money-fixed-stats">
              <div className="money-fixed-stats__card">
                <EmergencyRing
                  percent={FIXED_SHARE_PERCENT}
                  size={42}
                  stroke={5}
                  trackColor="var(--border-warm)"
                  progressColor="var(--brand-primary)"
                  valueColor="var(--brand-primary)"
                  valueSize={10.5}
                  valueFontFamily="var(--font-a2z)"
                  className="money-fixed-ring"
                />
                <div className="money-fixed-stats__text">
                  <span className="money-fixed-stats__label">전체 지출에서</span>
                  <span className="money-fixed-stats__value">{FIXED_SHARE_PERCENT}%</span>
                </div>
              </div>
              <div className="money-fixed-stats__card money-fixed-stats__card--trend">
                <img className="money-fixed-stats__icon" src={icon('money-trend-flat.svg')} alt="" />
                <div className="money-fixed-stats__text">
                  <span className="money-fixed-stats__label">{FIXED_TREND_LABEL}</span>
                  <span className="money-fixed-stats__value">{FIXED_TREND_VALUE}</span>
                </div>
              </div>
            </div>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">매달 반복되는 고정비</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setNotice('고정비 전체보기 화면은 준비 중이에요.')}
                >
                  전체보기
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
              </div>
              <div className="money-fixed-cat-list">
                {FIXED_CATEGORIES.map((cat) => {
                  const isExpanded = expandedFixedCategories.includes(cat.key);
                  return (
                    <div key={cat.key} className={`money-fixed-cat-item${isExpanded ? ' is-expanded' : ''}`}>
                      <button
                        type="button"
                        className="money-fixed-cat-row"
                        aria-expanded={isExpanded}
                        onClick={() => toggleFixedCategory(cat.key)}
                      >
                        <span className="money-fixed-cat-row__thumb">
                          <img src={img('money-fixed-category-icons.png')} style={cat.spriteStyle} alt="" />
                        </span>
                        <div className="money-fixed-cat-row__body">
                          <div className="money-fixed-cat-row__top">
                            <div>
                              <p className="money-fixed-cat-row__name">{cat.name}</p>
                              {cat.sub && <p className="money-fixed-cat-row__sub">{cat.sub}</p>}
                              {cat.apps && (
                                <div className="money-fixed-apps">
                                  {cat.apps.map((app) => (
                                    <span key={app} className={`money-fixed-chip money-fixed-chip--${app}`}>
                                      {app === 'netflix' && 'N'}
                                      {app === 'disney' && 'D+'}
                                      {app === 'youtube' && <img src={icon('chip-youtube.svg')} alt="" />}
                                    </span>
                                  ))}
                                  {cat.appsMore ? (
                                    <span className="money-fixed-apps__more">+{cat.appsMore}</span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                            <div className="money-fixed-cat-row__amount">
                              <span className="money-fixed-cat-row__won">{cat.amount.toLocaleString()}원</span>
                              <span className="money-fixed-cat-row__percent">{cat.percent}%</span>
                            </div>
                          </div>
                          <div className="money-fixed-cat-row__bar">
                            <div
                              className="money-fixed-cat-row__bar-fill"
                              style={{ width: `${cat.percent}%`, background: cat.barColor }}
                            />
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="money-fixed-cat-detail">
                          {cat.items.map((item) => (
                            <div key={item.name} className="money-fixed-cat-detail__row">
                              <span>{item.name}</span>
                              <span>{item.amount.toLocaleString()}원</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">이번 달 결제 예정</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setNotice('결제 예정 전체보기 화면은 준비 중이에요.')}
                >
                  더보기
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
              </div>
              <div className="money-fixed-timeline">
                {FIXED_SCHEDULE.map((item, index) => {
                  const isExpanded = expandedFixedSchedule === item.key;
                  return (
                    <div key={item.key} className="money-fixed-timeline__row">
                      <button
                        type="button"
                        className="money-fixed-timeline__hit"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedFixedSchedule(isExpanded ? null : item.key)}
                      >
                        <div className="money-fixed-timeline__rail">
                          <span className={`money-fixed-timeline__dot${item.urgent ? ' is-urgent' : ''}`} />
                          {index < FIXED_SCHEDULE.length - 1 && <span className="money-fixed-timeline__line" />}
                        </div>
                        <div className="money-fixed-timeline__body">
                          <div className="money-fixed-timeline__left">
                            <span className="money-fixed-timeline__date">{item.date}</span>
                            <span className="money-fixed-timeline__label">
                              {item.spriteStyle ? (
                                <span className="money-fixed-timeline__icon">
                                  <img
                                    src={img('money-fixed-schedule-icons.png')}
                                    style={item.spriteStyle}
                                    alt=""
                                  />
                                </span>
                              ) : (
                                <span className="money-fixed-timeline__badge">N</span>
                              )}
                              {item.label}
                            </span>
                          </div>
                          <div className="money-fixed-timeline__right">
                            <span className="money-fixed-timeline__value">{item.value}</span>
                            <span className={`money-fixed-timeline__dday${item.urgent ? ' is-urgent' : ''}`}>
                              {item.dday}
                            </span>
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="money-fixed-timeline__detail">
                          <span>{item.method}</span>
                          {item.auto && <span className="money-fixed-timeline__auto">자동이체</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="money-section money-section--tip">
              <button
                type="button"
                className="money-insight money-insight--clickable"
                onClick={() => navigation?.navigate('ai-chat')}
              >
                <img src={img('money-insight-badge.png')} alt="" className="money-insight__badge" />
                <p className="money-insight__title">{FIXED_INSIGHT.title}</p>
                <p className="money-insight__sub">{FIXED_INSIGHT.sub}</p>
              </button>
            </section>
          </>
        )}

        {tab === '비상금' && (
          <>
            <p className="money-fund__intro">
              갑작스러운 순간을 위해
              <br />
              조금씩 준비하고 있어요.
            </p>

            <ScratchReveal>
              <div className="money-fund__ring-section">
                <EmergencyRing percent={EMERGENCY_FUND.percent} />
                <p className="money-fund__amount">{EMERGENCY_FUND.current.toLocaleString()}원</p>
                <p className="money-fund__target">목표 {EMERGENCY_FUND.target.toLocaleString()}원</p>
              </div>
            </ScratchReveal>

            <section className="money-section">
              <h2 className="money-section__title">이번 달 적립</h2>
              <div className="money-fund-add">
                <img src={icon('money-fund-check.svg')} alt="" />
                <span className="money-fund-add__amount">+{FUND_MONTHLY_ADD.amount.toLocaleString()}원</span>
              </div>
              <p className="money-fund-add__caption">
                지난달보다 {FUND_MONTHLY_ADD.diffFromLastMonth.toLocaleString()}원 더 적립했어요.
              </p>
            </section>

            <section className="money-section">
              <h2 className="money-section__title">목표까지 이렇게 가볼까요?</h2>
              <div className="money-fund-plans" role="radiogroup" aria-label="비상금 적립 플랜">
                {SAVING_PLANS.map((plan) => (
                  <button
                    key={plan.key}
                    type="button"
                    role="radio"
                    aria-checked={savingPlan === plan.key}
                    className={`money-fund-plan${savingPlan === plan.key ? ' is-selected' : ''}`}
                    onClick={() => setSavingPlan(plan.key)}
                  >
                    <span className="money-fund-plan__radio" aria-hidden="true" />
                    <span className="money-fund-plan__text">
                      <span className="money-fund-plan__label">
                        월 {plan.monthlyAmount.toLocaleString()}원 적립
                      </span>
                      <span className="money-fund-plan__months">약 {plan.monthsLeft}개월 후 달성</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="money-section money-section--tip">
              <div className="money-section__head">
                <h2 className="money-section__title">비상금 가이드</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setNotice('비상금 가이드 화면은 준비 중이에요.')}
                >
                  자세히 보기
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
              </div>
              <div className="money-fund-guide">
                <img src={img('money-fund-guide-badge.png')} alt="" className="money-fund-guide__badge" />
                <div className="money-fund-guide__text">
                  <p className="money-fund-guide__title">{FUND_GUIDE.title}</p>
                  <p className="money-fund-guide__sub">{FUND_GUIDE.sub}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* 스크롤 끝이 아니라 탭바 바로 위에 띄워, 누른 자리에서 바로 보이게 한다 (MyPage.tsx 와 동일 패턴) */}
      <p className="money__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

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
      <AIChatbot />
    </div>
  );
}

export default MoneyPage;
