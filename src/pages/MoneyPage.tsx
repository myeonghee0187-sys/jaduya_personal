import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { EmergencyFundCard } from '../components/money/EmergencyFundCard';
import { FundAmountSheet } from '../components/money/FundAmountSheet';
import { IncomeExpenseSection } from '../components/money/IncomeExpenseSection';
import { BottomSheet } from '../components/BottomSheet';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';
import {
  TOTAL_EXPENSE,
  TOTAL_INCOME,
  TOTAL_PREV_EXPENSE,
  TODAY_DAY,
  CATEGORY_META,
  CATEGORY_TOTALS,
  CATEGORY_PERCENTAGES,
  TOP_CATEGORY,
} from '../data/moneyTransactions';

/* 돈 관리 상단 탭 — Figma IA 그대로 4개. 이제 4개 모두 실제 화면이 있다.
 * "거래" → "수입·지출"로 이름을 바꾸고 내용도 캘린더/목록 두 보기로 전부 바꿨다
 * (IncomeExpenseSection.tsx — 레퍼런스 그대로). */
const TABS = ['이번 달', '수입·지출', '고정비', '비상금'] as const;
type Tab = (typeof TABS)[number];
const TAB_HAS_SCREEN: Record<Tab, boolean> = { '이번 달': true, '수입·지출': true, 고정비: true, 비상금: true };

/* 이번 달 요약 — 예산에서 이번 달 소비(TOTAL_EXPENSE, moneyTransactions.ts 단일 원본)를 뺀
 * 값이다. 전에는 SPENDABLE 을 따로 하드코딩해서 "예산 - 사용"과 안 맞았다(동일 데이터
 * 정합 위반) — 계산값으로 바꾼다. */
const BUDGET = 1_000_000;
const SPENDABLE = BUDGET - TOTAL_EXPENSE;
const BUDGET_USED_PERCENT = Math.round((TOTAL_EXPENSE / BUDGET) * 1000) / 10;

/* 비상금 탭 초기값 — 실제 서비스라면 서버에서 받아올 값. 여기서는 다른 탭과 같은 방식으로
 * 정적 목업을 기본값으로 두고, 사용자가 시트에서 바꾼 값은 localStorage 에 저장해
 * 새로고침/재진입에도 유지한다.
 *
 * revealedAmount — 사용자가 스크래치로 마지막까지 확인한 금액. currentAmount 와 같으면
 * (이번 방문에서 새로 늘어난 돈이 없으면) 스크래치를 건너뛰고 바로 결과를 보여주고,
 * 다르면(=채우기로 새 적립이 생겼으면) 다시 가려서 "새로운 기록이 있어요"로 긁게 한다.
 * goalCelebrated — 목표 금액을 처음 달성했을 때의 축하 화면을 이미 봤는지. */
interface FundDeposit {
  id: string;
  amount: number;
  date: string;
}

/* 이번 달 적립 내역 — "지금까지 모은 비상금" 총액이 여기서 나온다(아래 참고). 날짜는
 * TODAY_DAY(9월 20일)까지 안에서만 만든다. */
const EMERGENCY_FUND_DEPOSITS: FundDeposit[] = [
  { id: 'd1', amount: 300_000, date: '9월 1일' },
  { id: 'd2', amount: 250_000, date: '9월 8일' },
  { id: 'd3', amount: 400_000, date: '9월 14일' },
  { id: 'd4', amount: 250_000, date: '9월 20일' },
];

const EMERGENCY_FUND_DEFAULT: EmergencyFundState = {
  /* currentAmount 를 따로 하드코딩하지 않는다 — 적립 내역(EMERGENCY_FUND_DEPOSITS)의 합
   * 그 자체다. 예전엔 총액(1,200,000원)과 적립 내역(2건, 50,000원)이 서로 안 맞았다
   * (CLAUDE.md 13. 동일 데이터 정합 위반) — 총액은 항상 "이번 달 N번 모았어요"의 그
   * N건을 더한 값과 같아야 한다. */
  currentAmount: EMERGENCY_FUND_DEPOSITS.reduce((sum, d) => sum + d.amount, 0),
  targetAmount: 3_000_000,
  revealedAmount: 0,
  goalCelebrated: false,
  deposits: EMERGENCY_FUND_DEPOSITS,
};

interface EmergencyFundState {
  currentAmount: number;
  targetAmount: number;
  revealedAmount: number;
  goalCelebrated: boolean;
  deposits: FundDeposit[];
}

/* v2 → v3: 적립 내역 목업을 총액과 맞게 다시 채웠다(위 EMERGENCY_FUND_DEPOSITS) — 키를
 * 올리지 않으면 이미 v2 로 저장해 둔 예전(합계 안 맞는) 값을 그대로 읽어와 고친 게
 * 반영되지 않는다. */
const FUND_STORAGE_KEY = 'jaduya:money-fund:v3';

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

/* ---------- 소비 탭 — Figma node 2628:27950 "소비" 기준.
 * 카테고리 합계·거래 내역·소비 흐름은 전부 src/data/moneyTransactions.ts 의 단일 transaction
 * 원본에서 계산해 온다 — 이번 달 소비 총액(TOTAL_EXPENSE)도 카테고리 합계의 합과 항상 같다
 * (CLAUDE.md 13. 동일 데이터 정합). ---------- */

/* 월 선택 pill — 실제로 열리고 닫히지만, 다른 달 데이터는 아직 없어 이번 달만 선택 가능하다 */
const MONTH_OPTIONS = ['2026년 9월', '2026년 8월', '2026년 7월'] as const;
/* "이번 달" 탭 전용 "기간 선택" 바텀시트 — 연도는 실데이터가 있는 2026년 하나뿐이라
 * 탭 형태만 만들어 두고(확장 여지), 월 그리드도 드롭다운과 같은 규칙(9월만 선택 가능)을 따른다. */
const PERIOD_YEARS = ['2026년'] as const;
const PERIOD_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Figma image fill 크롭 값(%) 그대로 — 스프라이트 한 장을 여러 원형 썸네일로 나눠 쓴다. */
interface SpriteCrop {
  left: string;
  top: string;
  width: string;
  height: string;
}

/* ---------- 고정비 탭 — 리스트 리디자인(레퍼런스: 요약 카드 + 항목 리스트). 달력은
 * 걷어내고, 아이콘은 카테고리 단위로 묶어서 보여준다 — money-fixed-category-icons.png 가
 * 딱 3개 카테고리(주거비/통신·구독/보험)만 있어서, 같은 카테고리 항목은 아이콘을 공유한다.
 * '기타'(헬스장)만 해당 아이콘이 없어 이모지로 대체한다. */
const FIXED_CATEGORY_OPTIONS = ['주거비', '통신 · 구독', '보험', '기타'] as const;

interface FixedExpenseItem {
  key: string;
  label: string;
  amount: number;
  day: number;
  /** "매달 N일 | 세부내용" 의 세부내용 — 실제로 나가는 곳/서비스 이름 */
  detail: string;
  category: (typeof FIXED_CATEGORY_OPTIONS)[number];
  method: string;
  /** 자동결제 사용 여부 — 꺼도 합계에서는 빼지 않는다(결제 자체는 계속 나가는 게 보통이라). */
  enabled: boolean;
}

/* money-fixed-category-icons.png 는 724x724 정사각 아이콘 3장이 가로로 이어진
 * 스프라이트(주거비·통신,구독·보험,금융 순)다. */
const FIXED_CATEGORY_SPRITE: Partial<Record<(typeof FIXED_CATEGORY_OPTIONS)[number], SpriteCrop>> = {
  '주거비': { left: '0%', top: '0%', width: '300%', height: '100%' },
  '통신 · 구독': { left: '-100%', top: '0%', width: '300%', height: '100%' },
  '보험': { left: '-200%', top: '0%', width: '300%', height: '100%' },
};

/** '기타' 카테고리만 전용 아이콘이 없어 이모지로 대체한다. */
const FIXED_CATEGORY_EMOJI: Partial<Record<(typeof FIXED_CATEGORY_OPTIONS)[number], string>> = {
  '기타': '🏋️',
};

const FIXED_EXPENSES: FixedExpenseItem[] = [
  { key: 'rent', label: '월세', amount: 500_000, day: 1, detail: '우리집', category: '주거비', method: '자두뱅크 자동이체', enabled: true },
  { key: 'maintenance', label: '관리비', amount: 120_000, day: 5, detail: '아파트', category: '주거비', method: '자두뱅크 자동이체', enabled: true },
  { key: 'phone', label: '통신비', amount: 55_000, day: 10, detail: 'SKT', category: '통신 · 구독', method: 'SKT 자동납부', enabled: true },
  { key: 'music', label: '음악 스트리밍', amount: 11_900, day: 15, detail: 'Spotify', category: '통신 · 구독', method: '신한카드 · •• 4821', enabled: true },
  { key: 'ott', label: 'OTT 구독', amount: 13_900, day: 15, detail: '넷플릭스', category: '통신 · 구독', method: '신한카드 · •• 4821', enabled: true },
  { key: 'insurance', label: '보험료', amount: 70_000, day: 20, detail: '실손보험', category: '보험', method: '삼성카드 · •• 9012', enabled: true },
  { key: 'gym', label: '헬스장', amount: 66_000, day: 25, detail: '헬스장', category: '기타', method: '삼성카드 · •• 9012', enabled: false },
];

/* 이번 달 고정비 총액 = 항목 합 그 자체다(동일 데이터 정합) — 카테고리 세부항목까지
 * 더했던 예전 FIXED_TOTAL(894,400)처럼 근거 없이 값을 따로 만들지 않는다. 토글은
 * 자동결제 사용 여부일 뿐 합계에서 빼지 않는다.
 * 지난달엔 OTT 구독이 없었다고 보고(신규 항목), 그 차이만큼만 늘었다는 인사이트 문구를
 * 계산해서 보여준다. */
const FIXED_MONTHLY_TOTAL = FIXED_EXPENSES.reduce((sum, item) => sum + item.amount, 0);
const NEW_FIXED_ITEM = FIXED_EXPENSES.find((item) => item.key === 'ott')!;
const FIXED_PREV_MONTHLY_TOTAL = FIXED_MONTHLY_TOTAL - NEW_FIXED_ITEM.amount;
const FIXED_MONTHLY_DIFF = FIXED_MONTHLY_TOTAL - FIXED_PREV_MONTHLY_TOTAL;

/* 전체 지출(변동비) 대비 고정비 비중 — 변동비 원본(TOTAL_EXPENSE, moneyTransactions.ts)과
 * 항상 같은 계산식을 쓴다. */
const FIXED_EXPENSE_SHARE_PERCENT = Math.round(
  (FIXED_MONTHLY_TOTAL / (FIXED_MONTHLY_TOTAL + TOTAL_EXPENSE)) * 100,
);

/* 이번 달 수입·지출 — 수입/지출 두 카드만 보여준다(레퍼런스). 수입·지출 모두 수입·지출
 * 탭과 같은 원본(TOTAL_INCOME/TOTAL_EXPENSE, moneyTransactions.ts)을 그대로 써서 두 탭이
 * 항상 같은 숫자를 보여준다(동일 데이터 정합).
 * 지출 비교 — 지난달 카테고리 합계(TOTAL_PREV_EXPENSE)와 이번 달 합계의 차이 그 자체다.
 * 수입 비교 — 이번 달 수입 원본(INCOME_TRANSACTIONS)에 월급 한 건만 있고 지난달 실데이터가
 * 없다. 급여는 매달 같은 금액이 들어온다고 보는 게 자연스러운 가정이라, 근거 없는 증감을
 * 만들지 않고 0으로 둔다("변화 없음"이라는 같은 뜻을 레퍼런스의 "+0원" 표기로 보여준다). */
const EXPENSE_DIFF = TOTAL_EXPENSE - TOTAL_PREV_EXPENSE;
const INCOME_DIFF = 0;

/* "지난달보다 +12,000원 ↑" 형식 — 레퍼런스의 수입/지출 카드 증감 표기. 부호는 항상 보여주고
 * (+ 증가 / - 감소), 0일 때도 레퍼런스처럼 ↑ 를 쓴다. */
function formatTrend(diff: number): string {
  const sign = diff < 0 ? '-' : '+';
  const arrow = diff < 0 ? '↓' : '↑';
  return `지난달보다 ${sign}${Math.abs(diff).toLocaleString()}원 ${arrow}`;
}

/* "이번 달" 탭의 소비 분석 미리보기 — 소비 탭과 같은 원본(CATEGORY_META/CATEGORY_TOTALS/
 * CATEGORY_PERCENTAGES, moneyTransactions.ts)에서 그대로 가져온다(동일 데이터 정합).
 * 금액이 큰 4개 카테고리만 각자 보여주고 나머지는 "기타" 한 줄로 합친다 — 합계·비율
 * 모두 원본 값의 합이라 전체 카드(842,000원)와 항상 맞는다. */
const SPEND_ANALYSIS_TOP_COUNT = 4;
const SORTED_CATEGORIES = [...CATEGORY_META].sort((a, b) => CATEGORY_TOTALS[b.key] - CATEGORY_TOTALS[a.key]);
const SPEND_ANALYSIS_TOP = SORTED_CATEGORIES.slice(0, SPEND_ANALYSIS_TOP_COUNT);
const SPEND_ANALYSIS_REST = SORTED_CATEGORIES.slice(SPEND_ANALYSIS_TOP_COUNT);
const SPEND_ANALYSIS_REST_TOTAL = SPEND_ANALYSIS_REST.reduce((sum, c) => sum + CATEGORY_TOTALS[c.key], 0);
const SPEND_ANALYSIS_REST_PERCENT = SPEND_ANALYSIS_REST.reduce((sum, c) => sum + CATEGORY_PERCENTAGES[c.key], 0);
const SPEND_ANALYSIS_ROWS = [
  ...SPEND_ANALYSIS_TOP.map((c) => ({
    key: c.key as string,
    label: c.label,
    icon: c.icon,
    color: c.color,
    amount: CATEGORY_TOTALS[c.key],
    percent: CATEGORY_PERCENTAGES[c.key],
  })),
  ...(SPEND_ANALYSIS_REST.length > 0
    ? [
        {
          key: 'etc-merged',
          label: '기타',
          icon: 'money-cat-culture.svg',
          /* 문화/여가(#a39f9a)와 같은 회색 계열(text-tertiary)을 쓰면 도넛 차트에서 두
           * 구간이 한 덩어리로 붙어 보인다 — 다른 톤(brand-rose)으로 구분한다. */
          color: 'var(--brand-rose)',
          amount: SPEND_ANALYSIS_REST_TOTAL,
          percent: SPEND_ANALYSIS_REST_PERCENT,
        },
      ]
    : []),
];

/* "소비 인사이트" 배너 — 가장 많이 쓴 카테고리(TOP_CATEGORY)의 지난달 대비 증감.
 * 카테고리 데이터 원본(CATEGORY_META.prevAmount)에서 그대로 계산한다. */
const TOP_CATEGORY_DIFF = CATEGORY_TOTALS[TOP_CATEGORY.key] - TOP_CATEGORY.prevAmount;

/* "내 계좌" — 실제 계좌 연동 기능은 아직 없어(다른 금융기관 계좌 연결도 준비 중) 다른
 * 화면들과 같은 방식으로 정적 목업을 둔다. 은행 로고 이미지 에셋이 없어, 소비 탭 아래
 * "비슷한 자취생과 비교"의 peer-card 아바타와 같은 방식(원형 배지 + 이니셜)으로 표시한다
 * (실제 은행 브랜드 로고를 새로 만들지 않는다). */
interface MockAccount {
  id: string;
  bank: string;
  balance: number;
  initial: string;
  color: string;
}
const ACCOUNTS: MockAccount[] = [
  { id: 'kb', bank: '국민은행', balance: 1_284_500, initial: 'K', color: 'var(--brand-green)' },
  { id: 'kakao', bank: '카카오뱅크', balance: 2_350_000, initial: 'B', color: 'var(--brand-secondary)' },
  { id: 'shinhan', bank: '신한은행', balance: 820_000, initial: 'S', color: '#4a6fa5' },
];
const TOTAL_BALANCE = ACCOUNTS.reduce((sum, acc) => sum + acc.balance, 0);

/* 돈 관리 — 탭바 '돈관리' 로 들어오는 메인 화면(이번 달 탭).
 * 목적: "이번 달을 무리 없이 살아갈 수 있는가?" 를 한눈에 보여준다(CLAUDE.md 8. Money Rules).
 * 상세 고정비 결제 일정은 여기서 반복하지 않고 "이번 달 예정된 지출" 미리보기 3개 + "더보기"로만
 * 보여준다 — 고정비 탭의 "전체보기/더보기"도 아직 상세 route 가 없어 시각 요소로만 둔다. */
export function MoneyPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  /* 다른 화면에서 시작 탭을 지정해 들어올 수 있다 (예: 알림, 딥링크).
   * 넘어온 값이 실제 탭일 때만 쓰고, 아니면 기존처럼 '이번 달'로 연다. */
  const requestedTab = navigation?.options.tab;
  const [tab, setTab] = useState<Tab>(() =>
    requestedTab && (TABS as readonly string[]).includes(requestedTab) ? (requestedTab as Tab) : TABS[0],
  );
  /* 탭은 페이지 이동이 아니라 같은 화면 안에서 콘텐츠만 바뀌는 거라, 스크롤 컨테이너가
   * 그대로 재사용돼 이전 탭에서 내려간 위치가 다음 탭에도 이어진다 — 탭이 바뀔 때마다 맨 위로 올린다. */
  const scrollRef = useRef<HTMLElement>(null);
  /* 탭이 바뀔 때마다 맨 위로 올린다(기존 동작 유지). */
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [tab]);
  /* "이번 달" 탭의 모든 금액(지갑 카드 총액·돈 흐름 각 행·예산)을 한 번에 가린다 — 기본은
   * 공개 상태이고, 눈 아이콘을 누르면 전부 "₩ -----" 로 바뀐다(추세 %는 절대 금액이 아니라 계속 보여준다). */
  const [amountsHidden, setAmountsHidden] = useState(false);
  const showAmount = (n: number) => (amountsHidden ? '₩ -----' : `${n.toLocaleString()}원`);
  const [summaryMonth, setSummaryMonth] = useState<(typeof MONTH_OPTIONS)[number]>(MONTH_OPTIONS[0]);
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  /* 고정비 탭 — 리스트 UI. 정적 목록(FIXED_EXPENSES)에 사용자가 추가한 항목을 합쳐서 보여준다.
   * 토글(자동결제 on/off)은 항목별 override 로 관리하고, 없으면 데이터의 기본값(enabled)을 쓴다. */
  const [fixedAddSheetOpen, setFixedAddSheetOpen] = useState(false);
  const [addedFixedItems, setAddedFixedItems] = useState<FixedExpenseItem[]>([]);
  const [fixedToggleOverrides, setFixedToggleOverrides] = useState<Record<string, boolean>>({});
  const [fixedDetailKey, setFixedDetailKey] = useState<string | null>(null);
  const [fixedAddName, setFixedAddName] = useState('');
  const [fixedAddAmount, setFixedAddAmount] = useState('');
  const [fixedAddDay, setFixedAddDay] = useState('');
  const [fixedAddDetail, setFixedAddDetail] = useState('');
  const [fixedAddCategory, setFixedAddCategory] = useState<(typeof FIXED_CATEGORY_OPTIONS)[number]>(
    FIXED_CATEGORY_OPTIONS[0],
  );
  const [fixedAddMethod, setFixedAddMethod] = useState('');
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
  const allFixedItems = [...FIXED_EXPENSES, ...addedFixedItems];
  const isFixedItemEnabled = (item: FixedExpenseItem) => fixedToggleOverrides[item.key] ?? item.enabled;
  const toggleFixedItem = (item: FixedExpenseItem) =>
    setFixedToggleOverrides((prev) => ({ ...prev, [item.key]: !isFixedItemEnabled(item) }));
  const fixedDetailItem = allFixedItems.find((item) => item.key === fixedDetailKey) ?? null;
  /* "다음 결제일" — 오늘(9월 20일)이 이미 지난 날짜면 다음 달로, 아니면 이번 달로 계산한다
   * (하드코딩 아님). */
  const nextFixedPaymentLabel = (day: number) => {
    const base = day > TODAY_DAY ? new Date(2026, 8, day) : new Date(2026, 9, day);
    return `${base.getFullYear()}년 ${base.getMonth() + 1}월 ${base.getDate()}일`;
  };
  const renderFixedIcon = (item: FixedExpenseItem) => {
    const sprite = FIXED_CATEGORY_SPRITE[item.category];
    if (sprite) return <img src={img('money-fixed-category-icons.png')} style={sprite} alt="" />;
    return <span aria-hidden="true">{FIXED_CATEGORY_EMOJI[item.category] ?? '💳'}</span>;
  };

  /* 매번 입력하기 번거로운 테스트용 — 눌러진 순간 값이 바로 채워지는 더미 텍스트로 넣는다 */
  const fillFixedAddDummy = () => {
    setFixedAddName('넷플릭스');
    setFixedAddAmount('9500');
    setFixedAddDay('15');
    setFixedAddDetail('구독');
    setFixedAddCategory('통신 · 구독');
    setFixedAddMethod('신한카드 · •• 4821');
  };

  const resetFixedAddForm = () => {
    setFixedAddName('');
    setFixedAddAmount('');
    setFixedAddDay('');
    setFixedAddDetail('');
    setFixedAddCategory(FIXED_CATEGORY_OPTIONS[0]);
    setFixedAddMethod('');
  };
  const fixedAddDayNumber = Number(fixedAddDay);
  const canSubmitFixedAdd =
    fixedAddName.trim() !== '' &&
    Number(fixedAddAmount) > 0 &&
    fixedAddDayNumber >= 1 &&
    fixedAddDayNumber <= 31 &&
    fixedAddMethod.trim() !== '';
  const submitFixedAdd = () => {
    if (!canSubmitFixedAdd) return;
    setAddedFixedItems((prev) => [
      ...prev,
      {
        key: `added-${Date.now()}`,
        day: fixedAddDayNumber,
        label: fixedAddName.trim(),
        amount: Number(fixedAddAmount),
        detail: fixedAddDetail.trim() || fixedAddCategory,
        category: fixedAddCategory,
        method: fixedAddMethod.trim(),
        enabled: true,
      },
    ]);
    setFixedAddSheetOpen(false);
    resetFixedAddForm();
  };

  return (
    <div className="money app">
      <SubPageHeader
        title="돈 관리"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main
        className={`money__scroll${tab === '비상금' ? ' money__scroll--fund' : ''}`}
        ref={scrollRef}
      >
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

        {/* '이번 달' 탭의 월 선택 — 소비/고정비 탭과 같은 위치(탭 줄 아래, 별도 줄)에 둔다.
         * 다른 탭과 달리 드롭다운 리스트 대신 연도 탭 + 월 그리드 바텀시트("기간 선택")를 연다. */}
        {tab === '이번 달' && (
          <div className="money__month">
            <div className="money-month-dropdown">
              <button
                type="button"
                className="money__month-label money__month-label--btn"
                onClick={() => setPeriodSheetOpen(true)}
              >
                <img src={icon('menu-calendar.svg')} alt="" className="money__month-label__calendar" />
                {summaryMonth}
                <img src={icon('chevron-down-thin.svg')} alt="" />
              </button>
            </div>
          </div>
        )}

        {tab === '이번 달' && (
          <>
            <section className="money-budget">
              <button
                type="button"
                className="money-budget__eye"
                aria-label={amountsHidden ? '금액 표시' : '금액 가리기'}
                onClick={() => setAmountsHidden((v) => !v)}
              >
                <img src={icon(amountsHidden ? 'eye-slash.svg' : 'eye.svg')} alt="" />
              </button>

              <span className="money-budget__title">이번 달 쓸 수 있는 돈</span>
              <p className="money-budget__amount">{showAmount(SPENDABLE)}</p>

              {/* 예산/사용 금액은 눈 아이콘으로 가리지만, 진행률(%)은 절대 금액이 아니라
               * 추세 문구와 같은 원칙으로 계속 보여준다. */}
              <div className="money-budget__meta">
                <span className="money-budget__meta-text">
                  예산 {BUDGET.toLocaleString()}원 · 사용{' '}
                  {amountsHidden ? '-----' : `${TOTAL_EXPENSE.toLocaleString()}원`}
                </span>
                <span className="money-budget__meta-percent">{BUDGET_USED_PERCENT}%</span>
              </div>
              <div className="money-budget__progress-track">
                <span
                  className="money-budget__progress-fill"
                  style={{ width: `${Math.min(100, BUDGET_USED_PERCENT)}%` }}
                />
              </div>

              <button
                type="button"
                className="money-budget__setting-btn money-tappable"
                onClick={() => navigation?.navigate('money-budget')}
              >
                예산 설정
                <img src={icon('chevron-right-gray.svg')} alt="" />
              </button>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">이번 달 수입·지출</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setTab('수입·지출')}
                >
                  전체 보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
              <div className="money-flow-cards">
                <button
                  type="button"
                  className="money-flow-card money-flow-card--income money-tappable"
                  onClick={() => setTab('수입·지출')}
                >
                  <span className="money-flow-card__icon money-flow-card__icon--income">
                    <img src={icon('arrow-down.svg')} alt="" />
                  </span>
                  <span className="money-flow-card__label">이번 달 수입</span>
                  <span className="money-flow-card__value">
                    {amountsHidden ? '₩ -----' : `+${TOTAL_INCOME.toLocaleString()}원`}
                  </span>
                  <span className="money-flow-card__trend">{formatTrend(INCOME_DIFF)}</span>
                </button>
                <button
                  type="button"
                  className="money-flow-card money-flow-card--expense money-tappable"
                  onClick={() => setTab('수입·지출')}
                >
                  <span className="money-flow-card__icon money-flow-card__icon--expense">
                    <img src={icon('arrow-down.svg')} alt="" className="is-flipped" />
                  </span>
                  <span className="money-flow-card__label">이번 달 지출</span>
                  <span className="money-flow-card__value">
                    {amountsHidden ? '₩ -----' : `-${TOTAL_EXPENSE.toLocaleString()}원`}
                  </span>
                  <span
                    className={`money-flow-card__trend${EXPENSE_DIFF > 0 ? ' is-up' : EXPENSE_DIFF < 0 ? ' is-down' : ''}`}
                  >
                    {formatTrend(EXPENSE_DIFF)}
                  </span>
                </button>
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">소비 분석</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setTab('수입·지출')}
                >
                  전체 보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
              <div className="money-spend-bars">
                {SPEND_ANALYSIS_ROWS.slice(0, 3).map((row) => (
                  <div key={row.key} className="money-spend-bar-row">
                    <span
                      className="money-spend-bar-row__icon"
                      style={{ background: `color-mix(in srgb, ${row.color} 16%, white)` }}
                    >
                      <img src={icon(row.icon)} alt="" />
                    </span>
                    <span className="money-spend-bar-row__label">{row.label}</span>
                    <span className="money-spend-bar-row__track">
                      <span
                        className="money-spend-bar-row__fill"
                        style={{ width: `${row.percent}%`, background: row.color }}
                      />
                    </span>
                    <span className="money-spend-bar-row__amount">
                      {amountsHidden ? '-----' : `${row.amount.toLocaleString()}원`}
                    </span>
                    <span className="money-spend-bar-row__percent">{row.percent}%</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="money-insight-banner money-tappable"
                onClick={() => setTab('수입·지출')}
              >
                <span className="money-insight-banner__icon">
                  <img src={img('ai_icon.png')} alt="" />
                </span>
                <span className="money-insight-banner__text">
                  <span className="money-insight-banner__title">
                    이번 달은 {TOP_CATEGORY.label} 지출이 가장 많아요!
                  </span>
                  <span className="money-insight-banner__sub">
                    {TOP_CATEGORY_DIFF === 0
                      ? '지난달과 비슷해요.'
                      : `지난달보다 ${Math.abs(TOP_CATEGORY_DIFF).toLocaleString()}원 ${TOP_CATEGORY_DIFF > 0 ? '더 썼어요.' : '덜 썼어요.'}`}
                  </span>
                </span>
                <span className="money-insight-banner__cta">
                  소비 내역 보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </span>
              </button>
            </section>

            <section className="money-section">
              <div className="money-mini-cards">
                <button type="button" className="money-mini-card money-tappable" onClick={() => setTab('고정비')}>
                  <span className="money-mini-card__head">
                    <span className="money-mini-card__title">고정비</span>
                    <span className="money-mini-card__icon">
                      <img src={icon('menu-calendar.svg')} alt="" />
                    </span>
                  </span>
                  <span className="money-mini-card__label">이번 달 예정 금액</span>
                  <span className="money-mini-card__value">
                    {amountsHidden ? '₩ -----' : `${FIXED_MONTHLY_TOTAL.toLocaleString()}원`}
                  </span>
                  <span className="money-mini-card__sub">
                    {FIXED_EXPENSES.slice(0, 3)
                      .map((item) => item.label)
                      .join(' · ')}{' '}
                    등
                  </span>
                </button>
                <button
                  type="button"
                  className="money-mini-card money-tappable"
                  onClick={() => setNotice('계좌 전체보기 화면은 준비 중이에요.')}
                >
                  <span className="money-mini-card__head">
                    <span className="money-mini-card__title">내 계좌</span>
                    <span className="money-mini-card__icon">
                      <img src={icon('money-balance.svg')} alt="" />
                    </span>
                  </span>
                  <span className="money-mini-card__label">총 잔액</span>
                  <span className="money-mini-card__value">
                    {amountsHidden ? '₩ -----' : `${TOTAL_BALANCE.toLocaleString()}원`}
                  </span>
                  <span className="money-mini-card__sub">{ACCOUNTS.length}개 계좌</span>
                </button>
              </div>
            </section>

            <section className="money-section">
              <button type="button" className="money-fund-banner money-tappable" onClick={() => setTab('비상금')}>
                <span className="money-fund-banner__icon">
                  <img src={icon('lock.svg')} alt="" />
                </span>
                <span className="money-fund-banner__text">
                  <span className="money-fund-banner__title">비상금</span>
                  <span className="money-fund-banner__sub">열어보면 기분이 좋아지는 나만의 비상금!</span>
                </span>
                <span className="money-fund-banner__cta">
                  복권 긁어보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </span>
              </button>
            </section>
          </>
        )}

        {tab === '수입·지출' && <IncomeExpenseSection onNotice={setNotice} />}

        {tab === '고정비' && (
          <>
            <section className="money-fixed-hero">
              <div className="money-fixed-hero__stat">
                <span className="money-fixed-hero__badge">
                  <img src={icon('menu-calendar.svg')} alt="" />
                </span>
                <p className="money-fixed-hero__label">이번 달 고정비</p>
                <p className="money-fixed-hero__amount">{FIXED_MONTHLY_TOTAL.toLocaleString()}원</p>
                <p className="money-fixed-hero__share">
                  전체 지출의 {FIXED_EXPENSE_SHARE_PERCENT}%를 차지하고 있어요.
                </p>
                <span className="money-fixed-hero__track">
                  <span
                    className="money-fixed-hero__fill"
                    style={{ width: `${Math.min(100, FIXED_EXPENSE_SHARE_PERCENT)}%` }}
                  />
                </span>
              </div>
              <div className="money-fixed-hero__mascot">
                <p className="money-fixed-hero__bubble">매달 나가는 고정비를 관리해보세요!</p>
                <img src={img('money-budget-character.png')} alt="" />
              </div>
            </section>

            <section className="money-fixed-list">
              <div className="money-fixed-list__head">
                <h2 className="money-fixed-list__title">고정비 내역</h2>
                <button
                  type="button"
                  className="money-fixed-list__add"
                  aria-label="고정비 추가"
                  onClick={() => setFixedAddSheetOpen(true)}
                >
                  <img src={icon('plus-add.svg')} alt="" />
                </button>
              </div>

              <div className="money-fixed-list__items">
                {allFixedItems.map((item) => {
                  const enabled = isFixedItemEnabled(item);
                  return (
                    <div key={item.key} className="money-fixed-row">
                      <button
                        type="button"
                        className="money-fixed-row__main money-tappable"
                        onClick={() => setFixedDetailKey(item.key)}
                      >
                        <span className="money-fixed-row__icon">{renderFixedIcon(item)}</span>
                        <span className="money-fixed-row__info">
                          <span className="money-fixed-row__label">{item.label}</span>
                          <span className="money-fixed-row__amount">{item.amount.toLocaleString()}원</span>
                          <span className="money-fixed-row__sub">
                            매달 {item.day}일 | {item.detail}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`money-fixed-row__toggle${enabled ? ' is-on' : ''}`}
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${item.label} 자동결제 ${enabled ? '켜짐' : '꺼짐'}`}
                        onClick={() => toggleFixedItem(item)}
                      />
                      <img
                        src={icon('chevron-right-gray.svg')}
                        alt=""
                        className="money-fixed-row__chevron"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            <button
              type="button"
              className="money-fixed-insight money-tappable"
              onClick={() => setNotice('고정비 인사이트 상세는 준비 중이에요.')}
            >
              <img src={icon('lightbulb-tip.svg')} alt="" className="money-fixed-insight__icon" />
              <span className="money-fixed-insight__text">
                <span className="money-fixed-insight__title">
                  {FIXED_MONTHLY_DIFF > 0
                    ? '이번 달에 새로운 구독을 시작했어요!'
                    : FIXED_MONTHLY_DIFF < 0
                      ? '이번 달 고정비가 줄었어요'
                      : '지난달과 고정비가 같아요'}
                </span>
                <span className="money-fixed-insight__sub">
                  {FIXED_MONTHLY_DIFF === 0
                    ? '지난달과 같아요.'
                    : `지난달보다 고정비가 ${Math.abs(FIXED_MONTHLY_DIFF).toLocaleString()}원 ${FIXED_MONTHLY_DIFF > 0 ? '늘었어요' : '줄었어요'}.`}
                </span>
              </span>
              <img src={icon('chevron-right-gray.svg')} alt="" className="money-fixed-insight__chevron" />
            </button>
          </>
        )}

        {tab === '비상금' && (
          /* 탭을 벗어났다가 돌아오면 이 블록 자체가 매번 새로 마운트된다 — initialRevealed 를
           * 항상 false 로 둬서 탭에 들어올 때마다 매번 다시 긁게 한다. revealedAmount 는
           * "새로운 기록이 있어요" 문구를 보여줄지(새 적립이 생겼는지)만 판단하는 데 쓴다.
           * 이 화면은 스크롤 없이 한 화면(100dvh - 헤더 - 탭바)에 맞춰야 해서, 예전에
           * 있던 "적립 플랜"/"비상금 가이드" 같은 부가 섹션은 걷어내고 카드 하나로 정리했다. */
          <EmergencyFundCard
            currentAmount={fund.currentAmount}
            targetAmount={fund.targetAmount}
            initialRevealed={false}
            isNewRecord={fund.revealedAmount > 0 && fund.revealedAmount !== fund.currentAmount}
            hasCelebratedGoal={fund.goalCelebrated}
            deposits={fund.deposits}
            onReveal={() => setFund((prev) => ({ ...prev, revealedAmount: prev.currentAmount }))}
            onGoalCelebrated={() => setFund((prev) => ({ ...prev, goalCelebrated: true }))}
            onEditGoal={() => setFundSheet('goal')}
            onAddMore={() => setFundSheet('add')}
            onShowAllDeposits={() => setNotice('적립 내역 전체보기 화면은 준비 중이에요.')}
          />
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
              deposits: [{ id: `d${Date.now()}`, amount, date: `9월 ${TODAY_DAY}일` }, ...prev.deposits],
            }));
            setNotice(`${amount.toLocaleString()}원을 비상금에 추가했어요.`);
          }
        }}
      />
      <BottomSheet
        open={fixedAddSheetOpen}
        className="fixed-add-sheet"
        labelledBy="fixed-add-sheet-title"
        onDimClick={() => {
          setFixedAddSheetOpen(false);
          resetFixedAddForm();
        }}
      >
        <div className="bsheet__grip">
          <span />
        </div>
        <div className="fixed-add-sheet__header">
          <h2 className="fixed-add-sheet__title" id="fixed-add-sheet-title">
            고정비 추가
          </h2>
          <button
            type="button"
            className="fixed-add-sheet__close"
            aria-label="닫기"
            onClick={() => {
              setFixedAddSheetOpen(false);
              resetFixedAddForm();
            }}
          >
            <img src={icon('sheet-close.svg')} alt="" />
          </button>
        </div>
        <button type="button" className="fixed-add-sheet__dummy" onClick={fillFixedAddDummy}>
          더미 텍스트로 채우기
        </button>
        <form
          className="fixed-add-sheet__form"
          onSubmit={(e) => {
            e.preventDefault();
            submitFixedAdd();
          }}
        >
          <label className="fixed-add-sheet__field">
            <span className="fixed-add-sheet__label">이름</span>
            <input
              type="text"
              placeholder="예: 헬스장 회원권"
              value={fixedAddName}
              onChange={(e) => setFixedAddName(e.target.value)}
            />
          </label>
          <label className="fixed-add-sheet__field">
            <span className="fixed-add-sheet__label">세부 정보</span>
            <input
              type="text"
              placeholder="예: 헬스장, SKT, Spotify"
              value={fixedAddDetail}
              onChange={(e) => setFixedAddDetail(e.target.value)}
            />
          </label>
          <label className="fixed-add-sheet__field">
            <span className="fixed-add-sheet__label">금액</span>
            <span className="fixed-add-sheet__input-row">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={fixedAddAmount ? Number(fixedAddAmount.replace(/[^0-9]/g, '')).toLocaleString() : ''}
                onChange={(e) => setFixedAddAmount(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <span>원</span>
            </span>
          </label>
          <label className="fixed-add-sheet__field">
            <span className="fixed-add-sheet__label">결제일</span>
            <span className="fixed-add-sheet__input-row">
              <input
                type="text"
                inputMode="numeric"
                placeholder="1~31"
                value={fixedAddDay}
                onChange={(e) => setFixedAddDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              />
              <span>일</span>
            </span>
          </label>
          <label className="fixed-add-sheet__field">
            <span className="fixed-add-sheet__label">카테고리</span>
            <select
              className="fixed-add-sheet__select"
              value={fixedAddCategory}
              onChange={(e) => setFixedAddCategory(e.target.value as (typeof FIXED_CATEGORY_OPTIONS)[number])}
            >
              {FIXED_CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="fixed-add-sheet__field">
            <span className="fixed-add-sheet__label">결제수단</span>
            <input
              type="text"
              placeholder="예: 신한카드 · •• 4821"
              value={fixedAddMethod}
              onChange={(e) => setFixedAddMethod(e.target.value)}
            />
          </label>
          <button type="submit" className="fixed-add-sheet__submit" disabled={!canSubmitFixedAdd}>
            추가하기
          </button>
        </form>
      </BottomSheet>

      <BottomSheet
        open={fixedDetailItem !== null}
        className="fixed-add-sheet"
        labelledBy="fixed-detail-sheet-title"
        onDimClick={() => setFixedDetailKey(null)}
      >
        <div className="bsheet__grip">
          <span />
        </div>
        {fixedDetailItem && (
          <>
            <div className="fixed-add-sheet__header">
              <h2 className="fixed-add-sheet__title" id="fixed-detail-sheet-title">
                고정비 상세
              </h2>
              <button
                type="button"
                className="fixed-add-sheet__close"
                aria-label="닫기"
                onClick={() => setFixedDetailKey(null)}
              >
                <img src={icon('sheet-close.svg')} alt="" />
              </button>
            </div>

            <div className="money-fixed-detail__row" style={{ margin: '4px 0 0' }}>
              <span className="money-fixed-detail__icon">{renderFixedIcon(fixedDetailItem)}</span>
              <span className="money-fixed-detail__info">
                <span className="money-fixed-detail__name">{fixedDetailItem.label}</span>
                <span className="money-fixed-detail__recurrence">매월 {fixedDetailItem.day}일 자동결제</span>
              </span>
              <span className="money-fixed-detail__amount">{fixedDetailItem.amount.toLocaleString()}원</span>
            </div>

            <div className="money-fixed-detail__payment">
              <p className="money-fixed-detail__payment-title">결제 정보</p>
              <div className="money-fixed-detail__payment-row">
                <span>다음 결제일</span>
                <span>{nextFixedPaymentLabel(fixedDetailItem.day)}</span>
              </div>
              <div className="money-fixed-detail__payment-row">
                <span>결제수단</span>
                <span>{fixedDetailItem.method}</span>
              </div>
              <div className="money-fixed-detail__payment-row">
                <span>카테고리</span>
                <span>{fixedDetailItem.category}</span>
              </div>
            </div>

            <button
              type="button"
              className="money-fixed-detail__edit"
              onClick={() => setNotice('고정비 수정 화면은 준비 중이에요.')}
            >
              수정하기
            </button>
          </>
        )}
      </BottomSheet>

      <BottomSheet
        open={periodSheetOpen}
        className="period-sheet"
        labelledBy="period-sheet-title"
        onDimClick={() => setPeriodSheetOpen(false)}
      >
        <div className="bsheet__grip">
          <span />
        </div>
        <div className="period-sheet__header">
          <h2 className="period-sheet__title" id="period-sheet-title">
            기간 선택
          </h2>
          <button
            type="button"
            className="period-sheet__close"
            aria-label="닫기"
            onClick={() => setPeriodSheetOpen(false)}
          >
            <img src={icon('sheet-close.svg')} alt="" />
          </button>
        </div>
        <div className="period-sheet__years" role="tablist" aria-label="연도 선택">
          {PERIOD_YEARS.map((year, index) => (
            <button
              key={year}
              type="button"
              role="tab"
              aria-selected={index === 0}
              disabled={index > 0}
              className={`period-sheet__year${index === 0 ? ' is-active' : ''}`}
            >
              {year}
            </button>
          ))}
        </div>
        <div className="period-sheet__months">
          {PERIOD_MONTHS.map((month) => {
            const selected = month === 9;
            return (
              <button
                key={month}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={!selected}
                className={`period-sheet__month${selected ? ' is-active' : ''}`}
                onClick={() => selected && setSummaryMonth(MONTH_OPTIONS[0])}
              >
                {month}월
                {!selected && <span className="period-sheet__soon">준비 중</span>}
              </button>
            );
          })}
        </div>
        <button type="button" className="period-sheet__submit" onClick={() => setPeriodSheetOpen(false)}>
          선택하기
        </button>
      </BottomSheet>
    </div>
  );
}

export default MoneyPage;
