import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { EmergencyFundCard } from '../components/money/EmergencyFundCard';
import { FundAmountSheet } from '../components/money/FundAmountSheet';
import { SpendingReceipt } from '../components/money/SpendingReceipt';
import { FixedExpenseCalendar } from '../components/money/FixedExpenseCalendar';
import { BottomSheet } from '../components/BottomSheet';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';
import {
  TOTAL_EXPENSE,
  TODAY_DAY,
  CATEGORY_META,
  CATEGORY_TOTALS,
  CATEGORY_PERCENTAGES,
} from '../data/moneyTransactions';
import { PEER_COMPARISONS, SPEND_INSIGHT_APP_LINK } from '../data/spendCompare';
import { useElasticDragScroll } from '../hooks/useElasticDragScroll';

/* 돈 관리 상단 탭 — Figma IA 그대로 4개. 이제 4개 모두 실제 화면이 있다. */
const TABS = ['이번 달', '거래', '고정비', '비상금'] as const;
type Tab = (typeof TABS)[number];
const TAB_HAS_SCREEN: Record<Tab, boolean> = { '이번 달': true, 거래: true, 고정비: true, 비상금: true };

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

const EMERGENCY_FUND_DEFAULT: EmergencyFundState = {
  currentAmount: 1_200_000,
  targetAmount: 3_000_000,
  revealedAmount: 0,
  goalCelebrated: false,
  deposits: [
    { id: 'd1', amount: 30_000, date: '9월 1일' },
    { id: 'd2', amount: 20_000, date: '9월 14일' },
  ],
};

interface EmergencyFundState {
  currentAmount: number;
  targetAmount: number;
  revealedAmount: number;
  goalCelebrated: boolean;
  deposits: FundDeposit[];
}

const FUND_STORAGE_KEY = 'jaduya:money-fund:v2';

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

/* ---------- 고정비 탭 — 달력 중심 리디자인. 카테고리별 분류(FIXED_CATEGORIES)는 걷어내고
 * "언제 얼마가 빠지는가"만 보여주는 날짜 기준 데이터 하나로 합쳤다. day 는 달력 그리드에
 * 바로 쓸 숫자, amount 는 계산용 숫자(표시는 toLocaleString()), category 는 결제 정보의
 * "카테고리" 행에만 쓰는 라벨이다(기존 FIXED_CATEGORIES 이름 그대로 재사용). */
interface FixedScheduleItem {
  key: string;
  day: number;
  label: string;
  amount: number;
  category: string;
  method: string;
  /** 없으면 Netflix 코드-배지(원형 N)를 쓴다 — Figma 도 Netflix 만 로고 이미지가 아니라 배지다. */
  spriteStyle?: SpriteCrop;
}

/* 아이콘은 기존 스프라이트(money-fixed-schedule-icons.png, 월세·공과금·보험료·휴대폰요금
 * 2x2 그리드)를 그대로 재사용한다 — 새 에셋을 만들지 않는다. */
const FIXED_SCHEDULE: FixedScheduleItem[] = [
  {
    key: 'netflix',
    day: 5,
    label: 'Netflix',
    amount: 17_000,
    category: '통신 · 구독',
    method: '신한카드 · •• 4821',
  },
  {
    key: 'rent',
    day: 10,
    label: '월세',
    amount: 650_000,
    category: '주거비',
    method: '자두뱅크 자동이체',
    spriteStyle: { left: '-93.67%', top: '-15.79%', width: '451.9%', height: '313.16%' },
  },
  {
    key: 'phone',
    day: 15,
    label: '휴대폰 요금',
    amount: 58_000,
    category: '통신 · 구독',
    method: 'SKT 자동납부',
    spriteStyle: { left: '-257.61%', top: '-168.45%', width: '451.9%', height: '313.16%' },
  },
  {
    key: 'insurance-fee',
    day: 20,
    label: '보험료',
    amount: 32_000,
    category: '보험',
    method: '삼성카드 · •• 9012',
    spriteStyle: { left: '-93.13%', top: '-168.45%', width: '451.9%', height: '313.16%' },
  },
];

/* 이번 달 총액은 캘린더에 실제로 찍히는 날짜들의 합과 항상 같다(동일 데이터 정합) —
 * 카테고리 세부항목까지 더했던 예전 FIXED_TOTAL(894,400)은 이 화면에서 더 이상 안 쓴다. */
const FIXED_MONTHLY_TOTAL = FIXED_SCHEDULE.reduce((sum, item) => sum + item.amount, 0);
/* 지난달 실데이터가 없어 다른 목업 트렌드 값(FIXED_TREND_VALUE 등)과 같은 수준의 상수 하나로 둔다 */
const FIXED_PREV_MONTHLY_TOTAL = 745_000;
const FIXED_MONTHLY_DIFF = FIXED_MONTHLY_TOTAL - FIXED_PREV_MONTHLY_TOTAL;

const FIXED_CATEGORY_OPTIONS = ['주거비', '통신 · 구독', '보험', '기타'] as const;

/* 이번 달 돈 흐름 — 수입/지출 두 카드만 보여준다(레퍼런스). 지출은 소비 탭과 같은
 * TOTAL_EXPENSE(moneyTransactions.ts 단일 원본)를 그대로 써서 예산 카드의 "사용" 금액과
 * 항상 같다(동일 데이터 정합). 아이콘은 기존 스프라이트(money-flow-icons.png)에서
 * 수입·소비 자리를 그대로 재사용한다 — Figma image fill 크롭 값이라 임의로 바꾸지 않는다. */
const INCOME_THIS_MONTH = 2_500_000;
const INCOME_SPRITE_STYLE = { left: '-76.34%', top: '-10.04%', width: '386.18%', height: '259.16%' };
const EXPENSE_SPRITE_STYLE = { left: '-207.24%', top: '-10.04%', width: '386.18%', height: '259.16%' };

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
          color: 'var(--text-tertiary)',
          amount: SPEND_ANALYSIS_REST_TOTAL,
          percent: SPEND_ANALYSIS_REST_PERCENT,
        },
      ]
    : []),
];

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
  /* 고정비 탭 — 달력에 보여줄 달(초기값 2026년 9월, 유일하게 mock 데이터가 있는 달)과
   * 선택된 날짜. 달을 옮기면 그 달엔 실데이터가 없으니 선택을 비운다(억지로 1일을 골라두지 않는다). */
  const [fixedCalendarDate, setFixedCalendarDate] = useState(() => new Date(2026, 8, 1));
  const [selectedFixedDay, setSelectedFixedDay] = useState<number | null>(TODAY_DAY);
  const [fixedAddSheetOpen, setFixedAddSheetOpen] = useState(false);
  const [addedFixedItems, setAddedFixedItems] = useState<FixedScheduleItem[]>([]);
  const [fixedAddName, setFixedAddName] = useState('');
  const [fixedAddAmount, setFixedAddAmount] = useState('');
  const [fixedAddDay, setFixedAddDay] = useState('');
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
  /* 소비 탭 맨 아래 "비슷한 자취생과 비교" 가로 스크롤 — 커뮤니티 소비 비교 탭에서 그대로 가져왔다 */
  const peersDrag = useElasticDragScroll<HTMLDivElement>();

  /* 고정비 캘린더 — 2026년 9월(mock 데이터가 있는 유일한 달)일 때만 실제 항목을 보여준다.
   * 다른 달로 이동하면 정직하게 빈 상태를 보여준다(예전 드롭다운의 "준비 중" 잠금 대신). */
  const fixedCalendarYear = fixedCalendarDate.getFullYear();
  const fixedCalendarMonth = fixedCalendarDate.getMonth();
  const isFixedMockMonth = fixedCalendarYear === 2026 && fixedCalendarMonth === 8;
  const fixedItemsThisMonth = isFixedMockMonth ? [...FIXED_SCHEDULE, ...addedFixedItems] : [];
  /* 요약 총액은 이 달에 실제로 캘린더에 찍히는 항목의 합이다 — 데이터가 없는 달로 이동하면
   * 총액도 0원이어야 한다(이전 달에서 이번 달 총액을 그대로 보여주면 동일 데이터 정합이 깨진다). */
  const fixedMonthlyTotal = fixedItemsThisMonth.reduce((sum, item) => sum + item.amount, 0);
  const fixedItemsByDay = new Map<number, FixedScheduleItem[]>();
  for (const item of fixedItemsThisMonth) {
    const list = fixedItemsByDay.get(item.day);
    if (list) list.push(item);
    else fixedItemsByDay.set(item.day, [item]);
  }
  const goFixedMonth = (delta: number) => {
    setFixedCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setSelectedFixedDay(null);
  };
  const selectedFixedItems =
    selectedFixedDay !== null ? (fixedItemsByDay.get(selectedFixedDay) ?? []) : [];
  /* "다음 결제일" — 선택된 항목의 날짜로 다음 달 같은 날짜를 실제로 계산한다(하드코딩 아님) */
  const nextFixedPaymentLabel = (day: number) => {
    const next = new Date(fixedCalendarYear, fixedCalendarMonth + 1, day);
    return `${next.getFullYear()}년 ${next.getMonth() + 1}월 ${next.getDate()}일`;
  };

  const resetFixedAddForm = () => {
    setFixedAddName('');
    setFixedAddAmount('');
    setFixedAddDay('');
    setFixedAddCategory(FIXED_CATEGORY_OPTIONS[0]);
    setFixedAddMethod('');
  };
  const fixedAddDayNumber = Number(fixedAddDay);
  const fixedCalendarDaysInMonth = new Date(fixedCalendarYear, fixedCalendarMonth + 1, 0).getDate();
  const canSubmitFixedAdd =
    fixedAddName.trim() !== '' &&
    Number(fixedAddAmount) > 0 &&
    fixedAddDayNumber >= 1 &&
    fixedAddDayNumber <= fixedCalendarDaysInMonth &&
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
        category: fixedAddCategory,
        method: fixedAddMethod.trim(),
      },
    ]);
    setSelectedFixedDay(fixedAddDayNumber);
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
                <h2 className="money-section__title">이번 달 돈 흐름</h2>
                <button type="button" className="money-section__more" onClick={() => setTab('거래')}>
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
              <div className="money-flow-cards">
                <button
                  type="button"
                  className="money-flow-card money-flow-card--income money-tappable"
                  onClick={() => setTab('거래')}
                >
                  <span className="money-flow-card__icon">
                    <img src={img('money-flow-icons.png')} style={INCOME_SPRITE_STYLE} alt="" />
                  </span>
                  <span className="money-flow-card__label">수입</span>
                  <span className="money-flow-card__value">
                    {amountsHidden ? '₩ -----' : `+${INCOME_THIS_MONTH.toLocaleString()}원`}
                  </span>
                </button>
                <button
                  type="button"
                  className="money-flow-card money-flow-card--expense money-tappable"
                  onClick={() => setTab('거래')}
                >
                  <span className="money-flow-card__icon">
                    <img src={img('money-flow-icons.png')} style={EXPENSE_SPRITE_STYLE} alt="" />
                  </span>
                  <span className="money-flow-card__label">지출</span>
                  <span className="money-flow-card__value">
                    {amountsHidden ? '₩ -----' : `-${TOTAL_EXPENSE.toLocaleString()}원`}
                  </span>
                </button>
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">소비 분석</h2>
                <button type="button" className="money-section__more" onClick={() => setTab('거래')}>
                  전체 보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
              <div className="money-spend-analysis">
                {SPEND_ANALYSIS_ROWS.map((row) => (
                  <div key={row.key} className="money-spend-analysis__row">
                    <span className="money-spend-analysis__icon">
                      <img src={icon(row.icon)} alt="" />
                    </span>
                    <span className="money-spend-analysis__label">{row.label}</span>
                    <span className="money-spend-analysis__bar-track">
                      <span
                        className="money-spend-analysis__bar-fill"
                        style={{ width: `${row.percent}%`, background: row.color }}
                      />
                    </span>
                    <span className="money-spend-analysis__amount">
                      {amountsHidden ? '-----' : `${row.amount.toLocaleString()}원`}
                    </span>
                    <span className="money-spend-analysis__percent">{row.percent}%</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">고정비</h2>
                <button type="button" className="money-section__more" onClick={() => setTab('고정비')}>
                  전체 보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
              <button type="button" className="money-fixed-preview money-tappable" onClick={() => setTab('고정비')}>
                <span className="money-fixed-preview__badge">
                  <img src={icon('menu-calendar.svg')} alt="" />
                </span>
                <span className="money-fixed-preview__text">
                  <span className="money-fixed-preview__label">이번 달 예정 금액</span>
                  <span className="money-fixed-preview__amount">
                    {amountsHidden ? '₩ -----' : `${FIXED_MONTHLY_TOTAL.toLocaleString()}원`}
                  </span>
                </span>
                <span className="money-fixed-preview__items">
                  {FIXED_SCHEDULE.map((item) => item.label).join(' · ')} 등
                </span>
              </button>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">내 계좌</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={() => setNotice('계좌 전체보기 화면은 준비 중이에요.')}
                >
                  전체 보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
              <div className="money-accounts">
                {ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className="money-accounts__row money-tappable"
                    onClick={() => setNotice('계좌 상세 화면은 준비 중이에요.')}
                  >
                    <span className="money-accounts__badge" style={{ background: acc.color }}>
                      {acc.initial}
                    </span>
                    <span className="money-accounts__name">{acc.bank}</span>
                    <span className="money-accounts__balance">
                      {amountsHidden ? '₩ -----' : `${acc.balance.toLocaleString()}원`}
                    </span>
                    <img src={icon('chevron-right-gray.svg')} alt="" />
                  </button>
                ))}
                <button
                  type="button"
                  className="money-accounts__add money-tappable"
                  onClick={() => setNotice('다른 금융기관 계좌 연결은 준비 중이에요.')}
                >
                  <span className="money-accounts__add-icon">
                    <img src={icon('plus-add.svg')} alt="" />
                  </span>
                  <span className="money-accounts__add-label">다른 금융기관 계좌 연결</span>
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
            </section>

            <section className="money-section">
              <h2 className="money-section__title">비상금</h2>
              <button type="button" className="money-fund-banner money-tappable" onClick={() => setTab('비상금')}>
                <span className="money-fund-banner__icon">
                  <img src={icon('lock.svg')} alt="" />
                </span>
                <span className="money-fund-banner__text">
                  <span className="money-fund-banner__title">예상치 못한 순간을 위한 돈</span>
                  <span className="money-fund-banner__sub">금액은 비공개예요.</span>
                </span>
                <img src={icon('chevron-right-gray.svg')} alt="" />
              </button>
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

        {tab === '거래' && (
          <>
            <SpendingReceipt onNotice={setNotice} />

            {/* ============ 비슷한 자취생과 비교 — 커뮤니티 '소비 비교' 탭에서 그대로 옮겨왔다 ============ */}
            <section className="spend-compare-peers">
              <h2 className="spend-compare-peers__title">비슷한 자취생과 비교</h2>
              <p className="spend-compare-peers__sub">나와 비슷한 조건의 자취생 3명과 비교했어요</p>

              <div className="spend-compare-peers__row" ref={peersDrag.ref} {...peersDrag.dragProps}>
                {PEER_COMPARISONS.map((peer) => (
                  <article key={peer.id} className="peer-card">
                    <div className="peer-card__top">
                      <span
                        className="peer-card__avatar"
                        style={{ backgroundColor: peer.avatarColor }}
                        aria-hidden="true"
                      >
                        {peer.avatarInitial}
                      </span>
                      <span className="peer-card__names">
                        <span className="peer-card__name">{peer.name}</span>
                        <span className="peer-card__condition">{peer.condition}</span>
                      </span>
                    </div>
                    <p className="peer-card__amount">총 {peer.amount.toLocaleString()}원</p>
                    <span className={`peer-card__badge peer-card__badge--${peer.deltaTone}`}>
                      {peer.deltaLabel}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            {/* ============ 소비 인사이트 공유 ============ */}
            <section className="spend-compare-insight">
              <h2 className="spend-compare-insight__title">소비 인사이트 공유</h2>

              <button
                type="button"
                className="spend-app-link"
                onClick={() => setNotice('가계부 앱 연동은 준비 중이에요.')}
              >
                <span className="spend-app-link__left">
                  <span className="spend-app-cluster">
                    <span className="spend-app-icon">
                      <span className="spend-app-icon__clip">
                        <img src={icon('spend-app-icon-1.png')} alt="" />
                      </span>
                    </span>
                    <span className="spend-app-icon spend-app-icon--yellow">
                      <img src={icon('spend-app-icon-2.svg')} alt="" />
                    </span>
                    <span className="spend-app-icon">
                      <img src={icon('spend-app-icon-3.png')} alt="" />
                    </span>
                    <img className="spend-app-cluster__marker" src={icon('spend-app-marker.svg')} alt="" />
                  </span>
                  <span className="spend-app-link__text">
                    <span className="spend-app-link__title">{SPEND_INSIGHT_APP_LINK.title}</span>
                    <span className="spend-app-link__sub">{SPEND_INSIGHT_APP_LINK.sub}</span>
                  </span>
                </span>
                <img className="spend-app-link__arrow" src={icon('spend-east-arrow.svg')} alt="" />
              </button>
            </section>
          </>
        )}

        {tab === '고정비' && (
          <>
            <div className="money-fixed-month-nav">
              <button
                type="button"
                className="money-fixed-month-nav__arrow"
                aria-label="이전 달"
                onClick={() => goFixedMonth(-1)}
              >
                <img src={icon('chevron-right-sm.svg')} alt="" className="is-prev" />
              </button>
              <span className="money-fixed-month-nav__label">
                {fixedCalendarYear}년 {fixedCalendarMonth + 1}월
              </span>
              <button
                type="button"
                className="money-fixed-month-nav__arrow"
                aria-label="다음 달"
                onClick={() => goFixedMonth(1)}
              >
                <img src={icon('chevron-right-sm.svg')} alt="" />
              </button>
              <button
                type="button"
                className="money-fixed-month-nav__add"
                aria-label="고정비 추가"
                onClick={() => setFixedAddSheetOpen(true)}
              >
                <img src={icon('plus-add.svg')} alt="" />
              </button>
            </div>

            <section className="money-fixed-summary">
              {/* 월 이동 드롭다운에도 쓰는 기존 달력 아이콘을 재사용한다 — 새 이미지를 만들지 않는다 */}
              <span className="money-fixed-summary__badge">
                <img src={icon('menu-calendar.svg')} alt="" />
              </span>
              <p className="money-fixed-summary__label">이번 달 고정비</p>
              <p className="money-fixed-summary__amount">{fixedMonthlyTotal.toLocaleString()}원</p>
              {isFixedMockMonth && (
                <p className={`money-fixed-summary__diff${FIXED_MONTHLY_DIFF > 0 ? ' is-up' : FIXED_MONTHLY_DIFF < 0 ? ' is-down' : ''}`}>
                  {FIXED_MONTHLY_DIFF !== 0 && (
                    <img
                      src={icon('arrow-down.svg')}
                      alt=""
                      className={FIXED_MONTHLY_DIFF > 0 ? 'is-flipped' : ''}
                    />
                  )}
                  {FIXED_MONTHLY_DIFF === 0
                    ? '지난달과 같아요.'
                    : `지난달보다 ${Math.abs(FIXED_MONTHLY_DIFF).toLocaleString()}원 ${FIXED_MONTHLY_DIFF > 0 ? '늘었어요' : '줄었어요'}.`}
                </p>
              )}
            </section>

            <FixedExpenseCalendar
              year={fixedCalendarYear}
              month={fixedCalendarMonth}
              itemsByDay={fixedItemsByDay}
              selectedDay={selectedFixedDay}
              todayDay={isFixedMockMonth ? TODAY_DAY : null}
              onSelectDay={(day) => setSelectedFixedDay(day)}
            />

            <section className="money-fixed-detail">
              {selectedFixedDay === null ? (
                <p className="money-fixed-detail__empty">날짜를 선택하면 고정비를 확인할 수 있어요.</p>
              ) : (
                <>
                  <h2 className="money-fixed-detail__heading">
                    {fixedCalendarMonth + 1}월 {selectedFixedDay}일
                  </h2>
                  {selectedFixedItems.length === 0 ? (
                    <p className="money-fixed-detail__empty">예정된 고정비가 없어요.</p>
                  ) : (
                    selectedFixedItems.map((item, index) => (
                      <div key={item.key} className="money-fixed-detail__item">
                        {index > 0 && <hr className="money-fixed-detail__divider" />}
                        <div className="money-fixed-detail__row">
                          <span className="money-fixed-detail__icon">
                            {item.spriteStyle ? (
                              <img src={img('money-fixed-schedule-icons.png')} style={item.spriteStyle} alt="" />
                            ) : (
                              <span className="money-fixed-detail__badge">{item.label.charAt(0)}</span>
                            )}
                          </span>
                          <span className="money-fixed-detail__info">
                            <span className="money-fixed-detail__name">{item.label}</span>
                            <span className="money-fixed-detail__recurrence">
                              매월 {item.day}일 자동결제
                            </span>
                          </span>
                          <span className="money-fixed-detail__amount">{item.amount.toLocaleString()}원</span>
                        </div>

                        <div className="money-fixed-detail__payment">
                          <p className="money-fixed-detail__payment-title">결제 정보</p>
                          <div className="money-fixed-detail__payment-row">
                            <span>다음 결제일</span>
                            <span>{nextFixedPaymentLabel(item.day)}</span>
                          </div>
                          <div className="money-fixed-detail__payment-row">
                            <span>결제수단</span>
                            <span>{item.method}</span>
                          </div>
                          <div className="money-fixed-detail__payment-row">
                            <span>카테고리</span>
                            <span>{item.category}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="money-fixed-detail__edit"
                          onClick={() => setNotice('고정비 수정 화면은 준비 중이에요.')}
                        >
                          수정하기
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </section>
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
                placeholder={`1~${fixedCalendarDaysInMonth}`}
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
