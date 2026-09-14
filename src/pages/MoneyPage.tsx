import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { EmergencyRing } from '../components/money/EmergencyRing';
import { BudgetRibbon } from '../components/money/BudgetRibbon';
import { EmergencyFundCard } from '../components/money/EmergencyFundCard';
import { FundAmountSheet } from '../components/money/FundAmountSheet';
import { CategorySwiper } from '../components/money/CategorySwiper';
import { FlowBarChart } from '../components/money/FlowBarChart';
import type { FlowChartPoint } from '../components/money/FlowBarChart';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';
import {
  CATEGORY_META,
  CATEGORY_PERCENTAGES,
  CATEGORY_TOTALS,
  TOTAL_EXPENSE,
  TOTAL_PREV_EXPENSE,
  TOP_CATEGORY,
  TODAY_DAY,
  categoryTransactions,
  dailyFlow,
  weeklyFlow,
  monthlyFlow,
} from '../data/moneyTransactions';
import type { CategoryKey } from '../data/moneyTransactions';

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
    value: `-${TOTAL_EXPENSE.toLocaleString()}원`,
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

/* 비상금 탭 초기값 — 실제 서비스라면 서버에서 받아올 값. 여기서는 다른 탭과 같은 방식으로
 * 정적 목업을 기본값으로 두고, 사용자가 시트에서 바꾼 값은 localStorage 에 저장해
 * 새로고침/재진입에도 유지한다. 스크래치 공개 여부는 더 이상 저장하지 않는다 —
 * 탭에 들어올 때마다 매번 다시 긁도록 한다는 요구사항으로 바뀌었다. */
const EMERGENCY_FUND_DEFAULT = {
  currentAmount: 1_200_000,
  targetAmount: 3_000_000,
  monthlyAdded: 50_000,
  diffFromLastMonth: 10_000,
};

interface EmergencyFundState {
  currentAmount: number;
  targetAmount: number;
  monthlyAdded: number;
  diffFromLastMonth: number;
}

const FUND_STORAGE_KEY = 'jaduya:money-fund:v1';

function loadFundState(): EmergencyFundState {
  try {
    const raw = window.localStorage.getItem(FUND_STORAGE_KEY);
    if (!raw) return EMERGENCY_FUND_DEFAULT;
    const parsed = JSON.parse(raw) as Partial<EmergencyFundState>;
    return { ...EMERGENCY_FUND_DEFAULT, ...parsed };
  } catch {
    return EMERGENCY_FUND_DEFAULT;
  }
}

const AI_TIP = {
  title: '이번 달은 식비가 조금 줄었어요.',
  sub: '배달비를 한 번 더 줄여볼까요?',
};

/* ---------- 소비 탭 — Figma node 2628:27950 "소비" 기준.
 * 카테고리 합계·거래 내역·소비 흐름은 전부 src/data/moneyTransactions.ts 의 단일 transaction
 * 원본에서 계산해 온다 — 이번 달 소비 총액(TOTAL_EXPENSE)도 카테고리 합계의 합과 항상 같다
 * (CLAUDE.md 13. 동일 데이터 정합). ---------- */
type IncomeExpense = '지출' | '수입';

/* 월 선택 pill — 실제로 열리고 닫히지만, 다른 달 데이터는 아직 없어 이번 달만 선택 가능하다 */
const MONTH_OPTIONS = ['2026년 9월', '2026년 8월', '2026년 7월'] as const;

type FlowGranularity = '일간' | '주간' | '월간';
const FLOW_GRANULARITIES: readonly FlowGranularity[] = ['일간', '주간', '월간'];

/* ---------- 소비 탭 인사이트 — 전부 위 transaction 데이터에서 실제로 계산해서 만든다.
 * 근거 없는 문장을 만들지 않는다(요구사항 12.). ---------- */

/* 핵심 소비 인사이트 — 카테고리 중 비중이 가장 큰 것을 그대로 문장으로 만든다 */
const CONSUME_INSIGHT = {
  title: `이번 달은 ${TOP_CATEGORY.label}가 가장 많이 사용됐어요.`,
  sub: '특히 배달앱 이용이 지난달보다 3번 늘었어요.',
};

/* 지난달 대비 절약/초과 — TOTAL_EXPENSE·TOTAL_PREV_EXPENSE 차이를 그대로 문장으로 만든다 */
const CONSUME_DIFF = TOTAL_PREV_EXPENSE - TOTAL_EXPENSE;
const CONSUME_CHANGE_PERCENT = Math.round((Math.abs(CONSUME_DIFF) / TOTAL_PREV_EXPENSE) * 1000) / 10;
const SAVED_INSIGHT =
  CONSUME_DIFF >= 0
    ? { title: `지난달보다 ${CONSUME_DIFF.toLocaleString()}원 절약했어요.`, sub: '지금처럼만 유지해도 좋아요!' }
    : { title: `지난달보다 ${Math.abs(CONSUME_DIFF).toLocaleString()}원 더 썼어요.`, sub: '다음 달엔 조금만 줄여볼까요?' };

/* 평일/주말 소비 비교 — 2026년 9월 실제 요일로 오늘(TODAY_DAY)까지의 일별 지출(전체 카테고리 합)을
 * 나눠 하루 평균을 비교한다 */
const ELAPSED_DAYS = dailyFlow().filter((d) => d.day <= TODAY_DAY);
const isWeekend = (day: number) => [0, 6].includes(new Date(2026, 8, day).getDay());
const weekdayDays = ELAPSED_DAYS.filter((d) => !isWeekend(d.day));
const weekendDays = ELAPSED_DAYS.filter((d) => isWeekend(d.day));
const avg = (days: typeof ELAPSED_DAYS) => (days.length ? days.reduce((s, d) => s + d.amount, 0) / days.length : 0);
const weekdayAvg = avg(weekdayDays);
const weekendAvg = avg(weekendDays);
const WEEKDAY_INSIGHT = (() => {
  const heavier = weekdayAvg >= weekendAvg ? '평일' : '주말';
  const lighter = weekdayAvg >= weekendAvg ? '주말' : '평일';
  const diff = Math.round(Math.abs(weekdayAvg - weekendAvg)).toLocaleString();
  return {
    title: `${lighter}보다 ${heavier}에 하루 평균 ${diff}원 더 써요.`,
    sub: `${heavier} 소비를 조금만 줄여봐요.`,
  };
})();

/* ---------- 고정비 탭 — Figma node 2628:27757 "고정비" 기준 목업 데이터 ---------- */
const FIXED_TOTAL = 894_400;
const FIXED_TOTAL_CAPTION = '매달 자동으로 나가는 돈이에요.';
const FIXED_SHARE_PERCENT = 47;
const FIXED_TREND_LABEL = '지난 달과 비슷해요';
const FIXED_TREND_VALUE = '+2,000원';
/* 상단 카드 우측 배지 — "이번 달 돈 흐름"의 고정비 행과 같은 스프라이트(집+동전) 크롭을 재사용한다 */
const FIXED_HERO_BADGE_SPRITE = { left: '-76.34%', top: '-128.91%', width: '386.18%', height: '259.16%' };

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
    percent: 9,
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
  /* 커뮤니티 '소비 비교'의 "전체보기" 처럼 다른 화면에서 시작 탭을 지정해 들어올 수 있다.
   * 넘어온 값이 실제 탭일 때만 쓰고, 아니면 기존처럼 '이번 달'로 연다. */
  const requestedTab = navigation?.options.tab;
  const [tab, setTab] = useState<Tab>(() =>
    requestedTab && (TABS as readonly string[]).includes(requestedTab) ? (requestedTab as Tab) : TABS[0],
  );
  /* 탭은 페이지 이동이 아니라 같은 화면 안에서 콘텐츠만 바뀌는 거라, 스크롤 컨테이너가
   * 그대로 재사용돼 이전 탭에서 내려간 위치가 다음 탭에도 이어진다 — 탭이 바뀔 때마다 맨 위로 올린다. */
  const scrollRef = useRef<HTMLElement>(null);
  /* 카테고리별 소비 그리드에서 카드를 탭하면 이 값이 채워지고, 같은 탭 화면 안에서
   * "카테고리 상세" 콘텐츠로 바뀐다(새 route 를 만들지 않고 상세 "상태"로만 전환). */
  const [categoryDetailKey, setCategoryDetailKey] = useState<CategoryKey | null>(null);
  /* 탭이 바뀌거나(기존 동작) 카테고리 상세로 들어갈 때도 맨 위로 올린다 — 소비 탭을 끝까지
   * 내린 상태에서 카테고리를 눌러도 상세 화면은 항상 최상단에서 시작해야 한다(요구사항 9). */
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [tab, categoryDetailKey]);
  /* 이번 달 쓸 수 있는 돈 — 여러 금융앱처럼 기본값은 가려진 상태(true)로 시작한다.
   * 예산 한도·사용률은 민감 정보가 아니라 가리지 않고, "쓸 수 있는 돈" 금액만 잠금 아이콘 +
   * "금액 보기" 버튼으로 가린다. 다시 누르면 가려진다. */
  const [budgetHidden, setBudgetHidden] = useState(true);
  const [summaryMonth, setSummaryMonth] = useState<(typeof MONTH_OPTIONS)[number]>(MONTH_OPTIONS[0]);
  const [summaryMonthMenuOpen, setSummaryMonthMenuOpen] = useState(false);
  const [ioType, setIoType] = useState<IncomeExpense>('지출');
  /* 전체(아그리게이트) 소비 흐름은 일간 그래프만 보여준다 — 기본 선택은 가장 최근 소비 날짜 */
  const [selectedDay, setSelectedDay] = useState(TODAY_DAY);
  /* 카테고리 상세의 소비 흐름 — 일간/주간/월간 전환과, 그 안에서 선택한 막대(index) */
  const [detailGranularity, setDetailGranularity] = useState<FlowGranularity>('일간');
  const [detailSelectedIndex, setDetailSelectedIndex] = useState(TODAY_DAY - 1);
  /* 다른 카테고리를 새로 열 때마다 일간/주간/월간은 항상 "일간"부터 다시 보여준다(요구사항 12). */
  useEffect(() => {
    if (categoryDetailKey) setDetailGranularity('일간');
  }, [categoryDetailKey]);
  /* 카테고리를 새로 열거나 일간/주간/월간을 바꾸면, 그 그래프에 맞는 기본 막대(대개 가장 최근 것)로
   * 선택을 다시 맞춘다 — 이전 카테고리·이전 단위에서 고른 index 가 엉뚱하게 남지 않게 한다. */
  useEffect(() => {
    if (!categoryDetailKey) return;
    if (detailGranularity === '일간') setDetailSelectedIndex(TODAY_DAY - 1);
    else if (detailGranularity === '주간') setDetailSelectedIndex(Math.min(3, Math.floor((TODAY_DAY - 1) / 7)));
    else setDetailSelectedIndex(1);
  }, [categoryDetailKey, detailGranularity]);
  const [catViewMode, setCatViewMode] = useState<'금액' | '비율'>('금액');
  const [consumeMonth, setConsumeMonth] = useState<(typeof MONTH_OPTIONS)[number]>(MONTH_OPTIONS[0]);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(SAVING_PLANS[0].key);
  const [fixedMonth, setFixedMonth] = useState<(typeof MONTH_OPTIONS)[number]>(MONTH_OPTIONS[0]);
  const [fixedMonthMenuOpen, setFixedMonthMenuOpen] = useState(false);
  /* 첫 화면 진입 시 가장 비중 큰 주거비를 미리 펼쳐 둔다 */
  const [expandedFixedCategories, setExpandedFixedCategories] = useState<string[]>(['housing']);
  const [expandedFixedSchedule, setExpandedFixedSchedule] = useState<string | null>(null);
  /* 비상금 — 스크래치 공개 여부·금액은 localStorage 에서 lazy init 해서 새로고침/재진입에도 유지한다 */
  const [fund, setFund] = useState<EmergencyFundState>(loadFundState);
  const [fundSheet, setFundSheet] = useState<'goal' | 'add' | null>(null);
  useEffect(() => {
    window.localStorage.setItem(FUND_STORAGE_KEY, JSON.stringify(fund));
  }, [fund]);
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
  const allFixedCategoriesExpanded = FIXED_CATEGORIES.every((cat) =>
    expandedFixedCategories.includes(cat.key),
  );

  /* 전체 소비 흐름(아그리게이트) — 카테고리 구분 없이 날짜별 전체 지출 합. dailyFlow() 는
   * EXPENSE_TRANSACTIONS 를 그대로 집계한 값이라 30일치를 다 더하면 TOTAL_EXPENSE 와 같다. */
  const aggregateDailyPoints: FlowChartPoint[] = dailyFlow().map((p) => ({
    key: `agg-${p.day}`,
    label: p.label,
    amount: p.amount,
  }));

  const categoryDetail = categoryDetailKey ? CATEGORY_META.find((c) => c.key === categoryDetailKey) : null;

  /* 카테고리 상세 그래프 — 일간/주간/월간 모두 같은 transaction 원본에서 그때그때 다시 집계한다
   * (요구사항 18. 그래프 모양만 바꾸지 않고 실제 aggregation 을 수행한다). */
  const detailPoints: FlowChartPoint[] = categoryDetail
    ? detailGranularity === '주간'
      ? weeklyFlow(categoryDetail.key).map((p, i) => ({ key: `w-${i}`, label: p.label, shortLabel: p.label, amount: p.amount }))
      : detailGranularity === '월간'
        ? monthlyFlow(categoryDetail.key).map((p, i) => ({ key: `m-${i}`, label: p.label, shortLabel: p.label, amount: p.amount }))
        : dailyFlow(categoryDetail.key).map((p) => ({ key: `d-${p.day}`, label: p.label, amount: p.amount, day: p.day }))
    : [];

  /* 일간 그래프에서 선택한 날짜의 실제 거래들 — 그래프와 거래 내역을 직접 연결한다(요구사항 20) */
  const selectedDetailDay = detailGranularity === '일간' ? detailPoints[detailSelectedIndex]?.day : undefined;
  const selectedDayTransactions =
    categoryDetail && selectedDetailDay !== undefined
      ? categoryTransactions(categoryDetail.key).filter((t) => t.day === selectedDetailDay)
      : [];

  return (
    <div className="money app">
      <SubPageHeader
        title="돈 관리"
        backLabel={categoryDetailKey ? '카테고리별 소비로' : '홈으로'}
        onBack={() => (categoryDetailKey ? setCategoryDetailKey(null) : navigation?.navigate('home'))}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="money__scroll" ref={scrollRef}>
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

        </div>

        {/* '이번 달' 탭의 월 선택 — 소비/고정비 탭과 같은 위치(탭 줄 아래, 별도 줄)에 둔다 */}
        {tab === '이번 달' && (
          <div className="money__month">
            <div className="money-month-dropdown">
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
          </div>
        )}

        {tab === '이번 달' && (
          <>
            <section className="money-budget">
              {/* 리본 탭 — 카드 오른쪽 위 모서리에 살짝 튀어나온 한 줄짜리 미니 페이저.
               * 좌우로 밀면 "예산 설정 >" ↔ 현재 예산 금액이 한 줄 안에서 바뀌고, 탭하면 예산 설정으로 이동한다. */}
              <BudgetRibbon
                editLabel="예산 설정"
                amountText={`${BUDGET.toLocaleString()}원`}
                onNavigate={() => navigation?.navigate('money-budget')}
              />

              <img src={img('money-budget-character.png')} alt="" className="money-budget__mascot" />
              <div className="money-budget__head">
                <span className="money-budget__title-group">
                  <span className="money-budget__title">이번 달 쓸 수 있는 돈</span>
                  <img src={icon('info.svg')} alt="" className="money-budget__info" />
                </span>
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
                <span className="money-budget__percent">{BUDGET_USED_PERCENT}% 사용</span>
              </div>
              <div className="money-budget__bar">
                <div className="money-budget__bar-fill" style={{ width: `${BUDGET_USED_PERCENT}%` }} />
              </div>
            </section>

            <div className="money-today-compare">
              <button
                type="button"
                className="money-today-compare__col money-tappable"
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
              </div>
              <div className="money-flow">
                {FLOW_ROWS.map((row) => {
                  const rowContent = (
                    <>
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
                        {row.key !== 'balance' && (
                          <img src={icon('chevron-right-gray.svg')} alt="" />
                        )}
                      </span>
                    </>
                  );

                  /* 현재 여유자금은 화살표(다음 화면 안내)가 없는 순수 표시용 행이라
                   * 다른 행과 달리 탭 눌림 효과/클릭 동작을 주지 않는다. */
                  if (row.key === 'balance') {
                    return (
                      <div key={row.key} className="money-flow__row">
                        {rowContent}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={row.key}
                      type="button"
                      className="money-flow__row money-tappable"
                      onClick={() => {
                        if (row.key === 'income') {
                          setTab('소비');
                          setIoType('수입');
                        } else if (row.key === 'spend') {
                          setTab('소비');
                          setIoType('지출');
                        } else if (row.key === 'fixed') {
                          setTab('고정비');
                        }
                      }}
                    >
                      {rowContent}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">이번 달 예정된 지출</h2>
                <button type="button" className="money-section__more" onClick={() => setTab('고정비')}>
                  더보기
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
              </div>
              <div className="money-upcoming-grid">
                {UPCOMING_EXPENSES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="money-upcoming-card money-tappable"
                    onClick={() => setTab('고정비')}
                  >
                    <span className="money-upcoming-card__icon">
                      <img src={img('money-fixed-schedule-icons.png')} style={item.spriteStyle} alt="" />
                    </span>
                    <span className="money-upcoming-card__label">{item.label}</span>
                    <span className="money-upcoming-card__value">{item.value}</span>
                    <span className="money-upcoming-card__date">{item.date}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="money-section money-section--tip">
              <h2 className="money-section__title">자두의 한마디</h2>
              <button
                type="button"
                className="money-tip money-tip--clickable money-tappable"
                onClick={() => navigation?.navigate('ai-chat')}
              >
                <img src={img('money-insight-badge.png')} alt="" className="money-tip__badge" />
                <p className="money-tip__title">{AI_TIP.title}</p>
                <p className="money-tip__sub">{AI_TIP.sub}</p>
              </button>
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
                  <img src={icon('menu-calendar.svg')} alt="" className="money__month-label__calendar" />
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
            ) : categoryDetail ? (
              <>
                <section className="money-card money-cat-hero">
                  <button
                    type="button"
                    className="money-cat-hero__crumb"
                    onClick={() => setCategoryDetailKey(null)}
                    aria-label="카테고리별 소비 목록으로 돌아가기"
                  >
                    {categoryDetail.label}
                    <img src={icon('chevron-right-thin.svg')} alt="" />
                  </button>
                  <span
                    className="money-cat-hero__badge"
                    style={{ background: `color-mix(in srgb, ${categoryDetail.color} 18%, white)` }}
                  >
                    <img src={icon(categoryDetail.icon)} alt="" />
                  </span>
                  <p className="money-cat-hero__amount">{CATEGORY_TOTALS[categoryDetail.key].toLocaleString()}원</p>
                  <div className="money-cat-hero__row">
                    <span className="money-cat-hero__track">
                      <span
                        className="money-cat-hero__fill"
                        style={{ width: `${CATEGORY_PERCENTAGES[categoryDetail.key]}%`, background: categoryDetail.color }}
                      />
                    </span>
                    <span className="money-cat-hero__percent">{`${CATEGORY_PERCENTAGES[categoryDetail.key]}%`}</span>
                  </div>
                  {(() => {
                    const amount = CATEGORY_TOTALS[categoryDetail.key];
                    const diff = amount - categoryDetail.prevAmount;
                    const isUp = diff >= 0;
                    const percent = Math.abs(Math.round((diff / categoryDetail.prevAmount) * 1000) / 10);
                    return (
                      <p className="money-cat-hero__trend">
                        {`지난달보다 ${Math.abs(diff).toLocaleString()}원 ${isUp ? '더' : '적게'} 썼어요.`}
                        <span className={`money-cat-hero__trend-badge${isUp ? ' is-up' : ' is-down'}`}>
                          {isUp ? '▲' : '▼'} {percent}%
                        </span>
                      </p>
                    );
                  })()}
                </section>

                <section className="money-section">
                  <div className="money-section__head">
                    <h2 className="money-section__title">{`${categoryDetail.label} 소비 흐름`}</h2>
                    <div className="money-cat-view-toggle" role="tablist" aria-label="소비 흐름 단위">
                      {FLOW_GRANULARITIES.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          role="tab"
                          aria-selected={detailGranularity === mode}
                          className={`money-cat-view-toggle__btn${detailGranularity === mode ? ' is-active' : ''}`}
                          onClick={() => setDetailGranularity(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <FlowBarChart
                    points={detailPoints}
                    selectedIndex={detailSelectedIndex}
                    onSelect={setDetailSelectedIndex}
                    axisStart="1일"
                    axisMid="15일"
                    axisEnd="30일"
                    categoryLabel={categoryDetail.label}
                  />
                  {detailGranularity === '일간' && selectedDayTransactions.length > 0 && (
                    <div className="money-card money-cat-day-detail">
                      <p className="money-cat-day-detail__head">
                        {detailPoints[detailSelectedIndex]?.label}
                        <span>{`총 ${selectedDayTransactions
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}원`}</span>
                      </p>
                      {selectedDayTransactions.map((t) => (
                        <div key={t.id} className="money-cat-day-detail__row">
                          <span>{t.merchant}</span>
                          <span>{t.amount.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="money-section">
                  <div className="money-section__head">
                    <h2 className="money-section__title">{`${categoryDetail.label} 주요 내역`}</h2>
                    <button
                      type="button"
                      className="money-section__more"
                      onClick={() => setNotice(`${categoryDetail.label} 내역 전체보기 화면은 준비 중이에요.`)}
                    >
                      전체보기
                      <img src={icon('chevron-right-thin.svg')} alt="" />
                    </button>
                  </div>
                  <div className="money-card money-cat-merchant-list">
                    {categoryTransactions(categoryDetail.key)
                      .slice(0, 5)
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="money-cat-merchant-row money-tappable"
                          onClick={() => setNotice('거래 상세 화면은 준비 중이에요.')}
                        >
                          <span
                            className="money-cat-merchant-row__badge"
                            style={{ background: `color-mix(in srgb, ${categoryDetail.color} 18%, white)` }}
                          >
                            {t.merchant.charAt(0)}
                          </span>
                          <span className="money-cat-merchant-row__text">
                            <span className="money-cat-merchant-row__name">{t.merchant}</span>
                            <span className="money-cat-merchant-row__date">{`9월 ${t.day}일`}</span>
                          </span>
                          <span className="money-cat-merchant-row__amount">{t.amount.toLocaleString()}원</span>
                        </button>
                      ))}
                  </div>
                </section>

                <section className="money-section money-section--tip">
                  <button
                    type="button"
                    className="money-card money-highlight-insight money-highlight-insight--clickable money-tappable"
                    onClick={() => setNotice('소비 인사이트 상세 화면은 준비 중이에요.')}
                  >
                    <img src={img('money-insight-badge.png')} alt="" className="money-highlight-insight__badge" />
                    <p className="money-highlight-insight__title">
                      {`${categoryDetail.label}를 조금만 줄여보는 건 어때요?`}
                    </p>
                    <p className="money-highlight-insight__sub">{CONSUME_INSIGHT.sub}</p>
                  </button>
                </section>
              </>
            ) : (
              <>
                <section className="money-card money-consume-summary">
                  <div className="money-consume-summary__head">
                    <span className="money-consume-summary__title">이번 달 소비</span>
                    <img src={icon('info.svg')} alt="" className="money-consume-summary__info" />
                  </div>
                  <span className="money-consume-summary__badge" aria-hidden="true">
                    <img src={icon('menu-wallet.svg')} alt="" />
                  </span>
                  <p className="money-consume-summary__amount">{TOTAL_EXPENSE.toLocaleString()}원</p>
                  <p className="money-consume-summary__compare">
                    {CONSUME_DIFF >= 0 ? (
                      <img src={icon('arrow-down.svg')} alt="" />
                    ) : (
                      <span className="money-consume-summary__compare-up" aria-hidden="true">▲</span>
                    )}
                    {CONSUME_DIFF >= 0
                      ? `지난달 ${TOTAL_PREV_EXPENSE.toLocaleString()}원보다 ${CONSUME_CHANGE_PERCENT}% 적게 썼어요.`
                      : `지난달 ${TOTAL_PREV_EXPENSE.toLocaleString()}원보다 ${CONSUME_CHANGE_PERCENT}% 더 썼어요.`}
                  </p>
                </section>

                <section className="money-section">
                  <div className="money-section__head">
                    <h2 className="money-section__title">소비 흐름</h2>
                    <button
                      type="button"
                      className="money-section__more"
                      onClick={() => setNotice('소비 흐름 전체보기 화면은 준비 중이에요.')}
                    >
                      전체보기
                      <img src={icon('chevron-right-thin.svg')} alt="" />
                    </button>
                  </div>
                  <FlowBarChart
                    points={aggregateDailyPoints}
                    selectedIndex={selectedDay - 1}
                    onSelect={(index) => setSelectedDay(index + 1)}
                    axisStart="1일"
                    axisMid="15일"
                    axisEnd="30일"
                  />
                </section>

                <section className="money-section">
                  <div className="money-section__head">
                    <h2 className="money-section__title">카테고리별 소비</h2>
                    <div className="money-cat-view-toggle" role="tablist" aria-label="카테고리 표시 기준">
                      {(['금액', '비율'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          role="tab"
                          aria-selected={catViewMode === mode}
                          className={`money-cat-view-toggle__btn${catViewMode === mode ? ' is-active' : ''}`}
                          onClick={() => setCatViewMode(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CategorySwiper ariaLabel="카테고리별 소비">
                    {CATEGORY_META.map((c) => {
                      const amount = CATEGORY_TOTALS[c.key];
                      const percent = CATEGORY_PERCENTAGES[c.key];
                      return (
                        <button
                          key={c.key}
                          type="button"
                          className="money-card money-cat-tile money-tappable"
                          onClick={() => setCategoryDetailKey(c.key)}
                          aria-label={`${c.label} ${amount.toLocaleString()}원, ${percent}%, 상세 보기`}
                        >
                          <span
                            className="money-cat-tile__badge"
                            style={{ background: `color-mix(in srgb, ${c.color} 18%, white)` }}
                          >
                            <img src={icon(c.icon)} alt="" />
                          </span>
                          <span className="money-cat-tile__label">{c.label}</span>
                          <span className="money-cat-tile__value">
                            {catViewMode === '금액' ? `${amount.toLocaleString()}원` : `${percent}%`}
                          </span>
                          <span className="money-cat-tile__track">
                            <span
                              className="money-cat-tile__fill"
                              style={{ width: `${percent}%`, background: c.color }}
                            />
                          </span>
                          <span className="money-cat-tile__sub">
                            {catViewMode === '금액' ? `${percent}%` : `${amount.toLocaleString()}원`}
                          </span>
                        </button>
                      );
                    })}
                  </CategorySwiper>
                </section>

                <section className="money-section money-section--tip">
                  <button
                    type="button"
                    className="money-card money-highlight-insight money-highlight-insight--clickable money-tappable"
                    onClick={() => setCategoryDetailKey(TOP_CATEGORY.key)}
                  >
                    <img src={img('money-insight-badge.png')} alt="" className="money-highlight-insight__badge" />
                    <p className="money-highlight-insight__title">{CONSUME_INSIGHT.title}</p>
                    <p className="money-highlight-insight__sub">{CONSUME_INSIGHT.sub}</p>
                  </button>
                </section>

                <section className="money-section money-section--tip">
                  <div className="money-section__head">
                    <h2 className="money-section__title">이번 달 소비 인사이트</h2>
                    <button
                      type="button"
                      className="money-section__more"
                      onClick={() => setNotice('소비 인사이트 전체보기 화면은 준비 중이에요.')}
                    >
                      전체보기
                      <img src={icon('chevron-right-thin.svg')} alt="" />
                    </button>
                  </div>
                  <div className="money-insight-grid">
                    <div className="money-card money-insight-tile money-insight-tile--positive">
                      <img src={icon('money-trend-flat.svg')} alt="" />
                      <p className="money-insight-tile__title">{SAVED_INSIGHT.title}</p>
                      <p className="money-insight-tile__sub">{SAVED_INSIGHT.sub}</p>
                    </div>
                    <div className="money-card money-insight-tile">
                      <img src={icon('menu-tip.svg')} alt="" />
                      <p className="money-insight-tile__title">{WEEKDAY_INSIGHT.title}</p>
                      <p className="money-insight-tile__sub">{WEEKDAY_INSIGHT.sub}</p>
                    </div>
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
                  <img src={icon('menu-calendar.svg')} alt="" className="money__month-label__calendar" />
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

            <section className="money-fixed-hero">
              <span className="money-fixed-hero__badge">
                <img src={img('money-flow-icons.png')} style={FIXED_HERO_BADGE_SPRITE} alt="" />
              </span>
              <span className="money-fixed-hero__title-group">
                <span className="money-fixed-hero__title">이번 달 고정비</span>
                <img src={icon('info.svg')} alt="" className="money-fixed-hero__info" />
              </span>
              <p className="money-fixed-hero__amount">{FIXED_TOTAL.toLocaleString()}원</p>
              <p className="money-fixed-hero__caption">{FIXED_TOTAL_CAPTION}</p>

              <div className="money-fixed-hero__stats">
                <div className="money-fixed-hero__stat">
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
                  <div className="money-fixed-hero__stat-text">
                    <span className="money-fixed-hero__stat-label">전체 지출에서</span>
                    <span className="money-fixed-hero__stat-value">{FIXED_SHARE_PERCENT}%</span>
                  </div>
                </div>
                <div className="money-fixed-hero__stat money-fixed-hero__stat--trend">
                  <img className="money-fixed-hero__stat-icon" src={icon('money-trend-flat.svg')} alt="" />
                  <div className="money-fixed-hero__stat-text">
                    <span className="money-fixed-hero__stat-label">{FIXED_TREND_LABEL}</span>
                    <span className="money-fixed-hero__stat-value">{FIXED_TREND_VALUE}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">매달 반복되는 고정비</h2>
                <button
                  type="button"
                  className="money-section__more"
                  aria-expanded={allFixedCategoriesExpanded}
                  onClick={() =>
                    setExpandedFixedCategories(
                      allFixedCategoriesExpanded ? [] : FIXED_CATEGORIES.map((cat) => cat.key),
                    )
                  }
                >
                  {allFixedCategoriesExpanded ? '접기' : '전체보기'}
                  <img
                    src={icon('chevron-down-thin.svg')}
                    alt=""
                    className={allFixedCategoriesExpanded ? 'is-open' : ''}
                  />
                </button>
              </div>
              <div className="money-fixed-cat-list">
                {FIXED_CATEGORIES.map((cat) => {
                  const isExpanded = expandedFixedCategories.includes(cat.key);
                  return (
                    <div key={cat.key} className={`money-fixed-cat-item${isExpanded ? ' is-expanded' : ''}`}>
                      <button
                        type="button"
                        className="money-fixed-cat-row money-tappable"
                        aria-expanded={isExpanded}
                        onClick={() => toggleFixedCategory(cat.key)}
                      >
                        <span className="money-fixed-cat-row__thumb">
                          <img src={img('money-fixed-category-icons.png')} style={cat.spriteStyle} alt="" />
                        </span>
                        <div className="money-fixed-cat-row__body">
                          <div className="money-fixed-cat-row__top">
                            <div className="money-fixed-cat-row__info">
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
              <h2 className="money-section__title">이번 달 결제 예정</h2>
              <div className="money-fixed-timeline">
                {FIXED_SCHEDULE.map((item, index) => {
                  const isExpanded = expandedFixedSchedule === item.key;
                  return (
                    <div key={item.key} className="money-fixed-timeline__row">
                      <button
                        type="button"
                        className="money-fixed-timeline__hit money-tappable"
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
                className="money-insight money-insight--clickable money-tappable"
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
            {/* 탭에 들어올 때마다 매번 다시 긁도록 initialRevealed 를 항상 false 로 둔다 —
             * 다른 탭으로 갔다가 돌아오면 이 블록 자체가 매번 새로 마운트되므로 이것으로 충분하다. */}
            <EmergencyFundCard
              currentAmount={fund.currentAmount}
              targetAmount={fund.targetAmount}
              initialRevealed={false}
              onFirstReveal={() => {}}
              onEditGoal={() => setFundSheet('goal')}
              onAddMore={() => setFundSheet('add')}
            />

            <section className="money-section">
              <h2 className="money-section__title">이번 달 적립</h2>
              <div className="money-fund-add">
                <img src={icon('money-fund-check.svg')} alt="" />
                <span className="money-fund-add__amount">+{fund.monthlyAdded.toLocaleString()}원</span>
              </div>
              <p className="money-fund-add__caption">
                지난달보다 {fund.diffFromLastMonth.toLocaleString()}원 더 적립했어요.
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
                    className={`money-fund-plan money-tappable${savingPlan === plan.key ? ' is-selected' : ''}`}
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
      <FundAmountSheet
        open={fundSheet !== null}
        mode={fundSheet ?? 'goal'}
        referenceAmount={fundSheet === 'add' ? fund.currentAmount : fund.targetAmount}
        onClose={() => setFundSheet(null)}
        onSubmit={(amount) => {
          if (fundSheet === 'goal') {
            setFund((prev) => ({ ...prev, targetAmount: amount }));
          } else if (fundSheet === 'add') {
            setFund((prev) => ({
              ...prev,
              currentAmount: prev.currentAmount + amount,
              monthlyAdded: prev.monthlyAdded + amount,
            }));
            setNotice(`${amount.toLocaleString()}원을 비상금에 추가했어요.`);
          }
        }}
      />
      <AIChatbot />
    </div>
  );
}

export default MoneyPage;
