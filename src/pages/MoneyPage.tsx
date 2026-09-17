import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TransitionEvent } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { EmergencyFundCard } from '../components/money/EmergencyFundCard';
import { FundAmountSheet } from '../components/money/FundAmountSheet';
import { IncomeExpenseSection } from '../components/money/IncomeExpenseSection';
import { useAnimatedPercent } from '../components/money/useAnimatedPercent';
import { BottomSheet } from '../components/BottomSheet';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';
import {
  TOTAL_EXPENSE,
  TOTAL_INCOME,
  TODAY_DAY,
  CATEGORY_META,
  CATEGORY_TOTALS,
  CATEGORY_PERCENTAGES,
  TOP_CATEGORY,
  dayFlowTotals,
} from '../data/moneyTransactions';
import {
  FIXED_CATEGORY_OPTIONS,
  FIXED_CATEGORY_SPRITE,
  FIXED_CATEGORY_EMOJI,
  FIXED_ITEM_IMAGE,
  FIXED_ITEM_IMAGE_BY_NAME,
  FIXED_EXPENSES,
  FIXED_MONTHLY_TOTAL,
  FIXED_PAID_TOTAL,
  FIXED_REMAINING_TOTAL,
  FIXED_PAID_PERCENT,
} from '../data/moneyFixed';
import type { FixedExpenseItem } from '../data/moneyFixed';
import { ACCOUNTS, TOTAL_BALANCE } from '../data/moneyAccounts';

/* 돈 관리 상단 탭 — Figma IA 그대로 4개. 이제 4개 모두 실제 화면이 있다.
 * "거래" → "수입·지출"로 이름을 바꾸고 내용도 캘린더/목록 두 보기로 전부 바꿨다
 * (IncomeExpenseSection.tsx — 레퍼런스 그대로). */
const TABS = ['이번 달', '수입·지출', '고정비', '비상금'] as const;
/* 고정비 탭의 카테고리 필터 — '전체' + 데이터 원본(moneyFixed.ts)의 카테고리 그대로 */
const FIXED_CATEGORY_FILTERS = ['전체', ...FIXED_CATEGORY_OPTIONS] as const;
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

/* "이번 달" 탭 상단의 월 선택 드롭다운 — 실데이터가 있는 달은 9월 하나뿐이라 나머지는
 * 선택할 수 없게 "준비 중"으로 비활성화한다(다른 화면의 월 선택과 같은 원칙). */
const MONTH_OPTIONS = ['9월', '8월', '7월'] as const;

/* 이번 달 수입·지출 — 요일 스트립(레퍼런스). 오늘(TODAY_DAY)이 속한 7일 구간을 기본으로
 * 보여준다 — 소비 탭 주별 흐름(moneyTransactions.ts WEEK_RANGES)과 같은 규칙(1~7, 8~14,
 * 15~21…)으로 나눠서, TODAY_DAY=20일 땐 9/15~9/21 구간이 된다. 화살표로 9월 안의 다른
 * 주(1~30일)를 오갈 수 있다 — 실데이터가 있는 달이 9월뿐이라 그 범위 밖으로는 못 넘어간다. */
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const DEFAULT_WEEK_START = Math.floor((TODAY_DAY - 1) / 7) * 7 + 1;

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


/* 예산/소비 분석/고정비 진행률 바 — 비상금 탭의 count-up(useAnimatedPercent)과 같은 방식으로
 * 0에서 값까지 차오르게 한다. 텍스트(퍼센트)와 바(fill 너비)가 같은 값을 각자 애니메이션하니
 * 살짝 다른 인스턴스로 계산되지만 같은 프레임에서 시작해 사실상 완전히 같이 움직인다. */
function AnimatedPercentText({ percent }: { percent: number }) {
  return <>{Math.round(useAnimatedPercent(percent))}%</>;
}

interface AnimatedProgressFillProps {
  percent: number;
  className: string;
  /** 지출이 예산을 넘어서는 등 percent 가 100을 넘을 수 있는 바만 너비를 100%로 잘라낸다 */
  clamp?: boolean;
  background?: string;
}

function AnimatedProgressFill({ percent, className, clamp = false, background }: AnimatedProgressFillProps) {
  const display = useAnimatedPercent(percent);
  const width = clamp ? Math.min(100, display) : display;
  return <span className={className} style={{ width: `${width}%`, ...(background ? { background } : {}) }} />;
}

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
  /* "소비 분석 전체 보기"처럼 수입·지출 탭에 목록 보기로 바로 들어가고 싶을 때만 'list'로
   * 바꿔서 setTab 과 같이 호출한다 — 상단 탭 바를 직접 눌러 들어올 때(selectTab)는
   * 항상 캘린더 보기 기본값으로 되돌린다. */
  const [incomeExpenseInitialView, setIncomeExpenseInitialView] = useState<'calendar' | 'list'>('calendar');
  const selectTab = (next: Tab) => {
    setIncomeExpenseInitialView('calendar');
    setTab(next);
  };
  const goToIncomeExpenseList = () => {
    setIncomeExpenseInitialView('list');
    setTab('수입·지출');
  };
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
  /* "이번 달" 탭의 월 선택 드롭다운 — 수입·지출 탭의 정렬 드롭다운(flow-sort)과 같은 방식으로
   * 바깥을 누르면 닫는다. */
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!monthMenuOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!monthMenuRef.current?.contains(event.target as Node)) setMonthMenuOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [monthMenuOpen]);
  /* "이번 달" 탭의 요일 스트립 — 화살표로 9월 안의 다른 7일 구간을 오간다. */
  const [weekStart, setWeekStart] = useState(DEFAULT_WEEK_START);
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i).filter((day) => day >= 1 && day <= 30);
  const isFirstWeek = weekStart <= 1;
  const isLastWeek = weekStart + 7 > 30;
  const goPrevWeek = () => setWeekStart((prev) => Math.max(1, prev - 7));
  const goNextWeek = () => setWeekStart((prev) => (prev + 7 <= 30 ? prev + 7 : prev));
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
  /* "다음 결제" — 오늘(TODAY_DAY) 이후 날짜를 먼저, 이미 지난 날짜는 다음 달 몫으로 보고
   * 뒤로 보낸다(nextFixedPaymentLabel 과 같은 "이미 지났으면 다음 달" 규칙). */
  const nextFixedItem =
    [...allFixedItems].sort((a, b) => {
      const aRank = a.day > TODAY_DAY ? a.day : a.day + 100;
      const bRank = b.day > TODAY_DAY ? b.day : b.day + 100;
      return aRank - bRank;
    })[0] ?? null;
  /* "고정비 내역" — 미리보기 없이 전체를 카테고리 필터와 함께 탭 안에서 그대로 보여준다
   * (전에는 "전체 보기"로 별도 페이지에 들어가야 했는데, 미리보기와 내용이 그대로 겹치는
   * 화면이라 걷어내고 하나로 합쳤다). */
  const [activeFixedCategory, setActiveFixedCategory] = useState<(typeof FIXED_CATEGORY_FILTERS)[number]>('전체');
  /* 카테고리를 바꾸면 목록 항목 수가 바뀌면서 아래 CTA 버튼까지 순간적으로 튀어
   * 올라오는 "끊김"이 있었다 — 클릭 시점의 높이를 얼려두고, 새 목록이 그려진 다음 프레임에
   * 실제 높이로 풀어주는 방식(FLIP)으로 컨테이너 height 만 부드럽게 애니메이션한다.
   *
   * (이전 버전의 버그) 클릭 이벤트 한 번에 "이전 높이 고정" + "카테고리 변경"을 같이
   * 커밋해버리면, 아래 useLayoutEffect 가 scrollHeight 를 잴 때 이미 그 이전 높이가
   * style 로 박혀 있어서 — 새 목록이 그보다 짧아지는 경우(예: 주거비 2건) scrollHeight 가
   * 실제 콘텐츠 높이가 아니라 "이미 걸려 있는 그 높이" 자체를 그대로 돌려준다(스펙상
   * scrollHeight 는 clientHeight 보다 작을 수 없다). 그래서 줄어드는 방향으로는 전혀
   * 줄어들지 않고 그대로 얼어붙어 있었다 — 카테고리를 눌러도 리스트 아래 빈 공간만 남고
   * 화면이 안 정리되던 게 "끊긴다"의 정체다.
   *
   * 고쳐서: 클릭 시점엔 "이전 높이"를 ref 에만 적어 두고 state 는 안 건드린다 → 새 콘텐츠가
   * 자유 높이(auto)로 먼저 그려진다 → useLayoutEffect 가 그 자연 높이를 정확히 잰 다음,
   * 이전 높이로 순간 고정했다가 다음 프레임에 새 높이로 풀어준다(진짜 FLIP). */
  const fixedListRef = useRef<HTMLDivElement>(null);
  const [fixedListHeight, setFixedListHeight] = useState<number | 'auto'>('auto');
  const fixedListPrevHeightRef = useRef<number | null>(null);
  const selectFixedCategory = (category: (typeof FIXED_CATEGORY_FILTERS)[number]) => {
    const node = fixedListRef.current;
    if (node) fixedListPrevHeightRef.current = node.getBoundingClientRect().height;
    setActiveFixedCategory(category);
  };
  const handleFixedListTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName === 'height') setFixedListHeight('auto');
  };
  /* "결제일 순" 버튼 — 누르면 아래 드롭다운 메뉴가 열리고, 항목을 고르면 그 기준으로 정렬한다. */
  const FIXED_SORT_OPTIONS = ['결제일순', '금액순'] as const;
  const [fixedSortOrder, setFixedSortOrder] = useState<(typeof FIXED_SORT_OPTIONS)[number]>('결제일순');
  const [fixedSortMenuOpen, setFixedSortMenuOpen] = useState(false);
  const selectFixedSortOrder = (option: (typeof FIXED_SORT_OPTIONS)[number]) => {
    setFixedSortOrder(option);
    setFixedSortMenuOpen(false);
  };
  const sortedFixedItems = [...allFixedItems].sort((a, b) =>
    fixedSortOrder === '결제일순' ? a.day - b.day : b.amount - a.amount,
  );
  const filteredFixedItems =
    activeFixedCategory === '전체'
      ? sortedFixedItems
      : sortedFixedItems.filter((item) => item.category === activeFixedCategory);
  useLayoutEffect(() => {
    const node = fixedListRef.current;
    const prevHeight = fixedListPrevHeightRef.current;
    if (!node || prevHeight == null) return;
    fixedListPrevHeightRef.current = null;
    /* 이 렌더는 새 목록이 이미 자유 높이(auto)로 그려진 상태다 — 여기서 재는 게 진짜
     * 콘텐츠 높이. (혹시 이전 애니메이션이 안 끝나 height 가 아직 숫자로 박혀 있으면
     * 잠깐 풀어서 재고 원래대로 되돌린다 — 페인트 전이라 화면엔 안 보인다.) */
    const lockedInlineHeight = node.style.height;
    node.style.height = 'auto';
    const target = node.scrollHeight;
    node.style.height = lockedInlineHeight;
    setFixedListHeight(prevHeight);
    const raf = requestAnimationFrame(() => setFixedListHeight(target));
    return () => cancelAnimationFrame(raf);
  }, [activeFixedCategory, filteredFixedItems.length]);
  /* "다음 결제일" — 오늘(9월 20일)이 이미 지난 날짜면 다음 달로, 아니면 이번 달로 계산한다
   * (하드코딩 아님). */
  const nextFixedPaymentLabel = (day: number) => {
    const base = day > TODAY_DAY ? new Date(2026, 8, day) : new Date(2026, 9, day);
    return `${base.getFullYear()}년 ${base.getMonth() + 1}월 ${base.getDate()}일`;
  };
  /* key 로 못 찾으면(예: 고정비 추가하기로 새로 만든 항목) 이름으로 한 번 더 찾는다 —
   * "--plain" 스타일 분기도 이 기준과 항상 같이 써야 한다. */
  const findFixedItemImage = (item: FixedExpenseItem) => FIXED_ITEM_IMAGE[item.key] ?? FIXED_ITEM_IMAGE_BY_NAME[item.label];
  const renderFixedIcon = (item: FixedExpenseItem) => {
    const itemImage = findFixedItemImage(item);
    if (itemImage) {
      return (
        <img
          src={img(itemImage)}
          alt=""
          style={{ position: 'static', width: '100%', height: '100%', objectFit: 'contain' }}
        />
      );
    }
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
        onBack={() => navigation?.goBack('home')}
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
                onClick={TAB_HAS_SCREEN[item] ? () => selectTab(item) : undefined}
              >
                {item}
              </button>
            ))}
          </div>

        </div>

        {/* '이번 달' 탭의 월 선택 — 왼쪽 정렬 라벨을 누르면 월 목록 드롭다운이 열린다.
         * 실데이터가 있는 달은 9월 하나뿐이라 나머지는 "준비 중"으로 비활성화한다. */}
        {tab === '이번 달' && (
          <div className="money__month">
            <div className="money-month-dropdown" ref={monthMenuRef}>
              <button
                type="button"
                className="money__month-label money__month-label--btn"
                aria-haspopup="listbox"
                aria-expanded={monthMenuOpen}
                onClick={() => setMonthMenuOpen((open) => !open)}
              >
                {MONTH_OPTIONS[0]}
                <img
                  src={icon('chevron-down-thin.svg')}
                  alt=""
                  className={monthMenuOpen ? 'is-open' : ''}
                />
              </button>
              {monthMenuOpen && (
                <div className="money-month-menu" role="listbox" aria-label="월 선택">
                  {MONTH_OPTIONS.map((label, index) => {
                    const selected = index === 0;
                    return (
                      <button
                        key={label}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={!selected}
                        className={`money-month-menu__item${selected ? ' is-active' : ''}`}
                        onClick={() => setMonthMenuOpen(false)}
                      >
                        {label}
                        {!selected && <span className="money-month-menu__soon">준비 중</span>}
                      </button>
                    );
                  })}
                </div>
              )}
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
              <p key={String(amountsHidden)} className="money-budget__amount budget-setup__pulse">
                {showAmount(SPENDABLE)}
              </p>

              {/* 예산/사용 금액은 눈 아이콘으로 가리지만, 진행률(%)은 절대 금액이 아니라
               * 추세 문구와 같은 원칙으로 계속 보여준다. */}
              <div className="money-budget__meta">
                <span className="money-budget__meta-text">
                  예산 {BUDGET.toLocaleString()}원 · 사용{' '}
                  {amountsHidden ? '-----' : `${TOTAL_EXPENSE.toLocaleString()}원`}
                </span>
                <span className="money-budget__meta-percent">
                  <AnimatedPercentText percent={BUDGET_USED_PERCENT} />
                </span>
              </div>
              <div className="money-budget__progress-track">
                <AnimatedProgressFill percent={BUDGET_USED_PERCENT} className="money-budget__progress-fill" clamp />
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
                  onClick={() => selectTab('수입·지출')}
                >
                  전체 보기
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
              <div className="money-flow-cards">
                <div className="money-flow-card">
                  <img className="money-flow-card__icon-img" src={img('budget_management.png')} alt="" />
                  <span className="money-flow-card__title">이번 달 수입</span>
                  <span
                    key={String(amountsHidden)}
                    className="money-flow-card__value money-flow-card__value--income budget-setup__pulse"
                  >
                    {amountsHidden ? '₩ -----' : `+${TOTAL_INCOME.toLocaleString()}원`}
                  </span>
                </div>
                <div className="money-flow-card">
                  <img
                    className="money-flow-card__icon-img"
                    src={img('jaduya_custom_recommendation_36/money_management/spending_management.png')}
                    alt=""
                  />
                  <span className="money-flow-card__title">이번 달 지출</span>
                  <span
                    key={String(amountsHidden)}
                    className="money-flow-card__value money-flow-card__value--expense budget-setup__pulse"
                  >
                    {amountsHidden ? '₩ -----' : `-${TOTAL_EXPENSE.toLocaleString()}원`}
                  </span>
                </div>
              </div>

              <div className="money-week-strip">
                <button
                  type="button"
                  className="money-week-strip__arrow"
                  aria-label="이전 주"
                  disabled={isFirstWeek}
                  onClick={goPrevWeek}
                >
                  <img src={icon('chevron-right-gray.svg')} alt="" className="is-prev" />
                </button>
                <div className="money-week-strip__grid">
                  {weekDays.map((day) => {
                    const totals = dayFlowTotals(day);
                    return (
                      <div
                        key={day}
                        className={`money-week-strip__day${day === TODAY_DAY ? ' is-today' : ''}`}
                      >
                        <span className="money-week-strip__weekday">
                          {WEEKDAY_LABELS[new Date(2026, 8, day).getDay()]}
                        </span>
                        <span className="money-week-strip__date">{day}</span>
                        {totals.income > 0 && (
                          <span className="money-week-strip__amount money-week-strip__amount--income">
                            +{totals.income.toLocaleString()}
                          </span>
                        )}
                        {totals.expense > 0 && (
                          <span className="money-week-strip__amount money-week-strip__amount--expense">
                            -{totals.expense.toLocaleString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="money-week-strip__arrow"
                  aria-label="다음 주"
                  disabled={isLastWeek}
                  onClick={goNextWeek}
                >
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </div>
            </section>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">소비 분석</h2>
                <button
                  type="button"
                  className="money-section__more"
                  onClick={goToIncomeExpenseList}
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
                      <AnimatedProgressFill
                        percent={row.percent}
                        className="money-spend-bar-row__fill"
                        background={row.color}
                      />
                    </span>
                    <span className="money-spend-bar-row__amount">
                      {amountsHidden ? '-----' : `${row.amount.toLocaleString()}원`}
                    </span>
                    <span className="money-spend-bar-row__percent">
                      <AnimatedPercentText percent={row.percent} />
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="money-insight-banner money-tappable"
                onClick={() => navigation?.navigate('benefits', { returnTo: 'money' })}
              >
                <span className="money-insight-banner__text">
                  <span className="money-insight-banner__title">
                    {TOP_CATEGORY.label}가{' '}
                    {TOP_CATEGORY_DIFF === 0
                      ? '지난달과 비슷해요.'
                      : `평소보다 ${Math.abs(TOP_CATEGORY_DIFF).toLocaleString()}원 더 ${TOP_CATEGORY_DIFF > 0 ? '늘었어요.' : '줄었어요.'}`}
                  </span>
                  <span className="money-insight-banner__sub">
                    이번 달 {TOP_CATEGORY.label} 지출이 가장 많아요.
                  </span>
                </span>
                <span className="money-insight-banner__icon">
                  <img src={img('02money-insight-badge.png')} alt="" />
                </span>
              </button>
            </section>

            <section className="money-section money-section--tight">
              <div className="money-mini-cards">
                <button type="button" className="money-mini-card money-tappable" onClick={() => setTab('고정비')}>
                  <span className="money-mini-card__head">
                    <span className="money-mini-card__title">고정비</span>
                    <img className="money-mini-card__icon-img" src={img('fixed_expenses.png')} alt="" />
                  </span>
                  <span className="money-mini-card__label">이번 달 예정 금액</span>
                  <span key={String(amountsHidden)} className="money-mini-card__value budget-setup__pulse">
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
                  onClick={() => navigation?.navigate('money-accounts')}
                >
                  <span className="money-mini-card__head">
                    <span className="money-mini-card__title">내 계좌</span>
                    <img className="money-mini-card__icon-img" src={img('budget_management.png')} alt="" />
                  </span>
                  <span className="money-mini-card__label">총 잔액</span>
                  <span key={String(amountsHidden)} className="money-mini-card__value budget-setup__pulse">
                    {amountsHidden ? '₩ -----' : `${TOTAL_BALANCE.toLocaleString()}원`}
                  </span>
                  <span className="money-mini-card__sub">{ACCOUNTS.length}개 계좌</span>
                </button>
              </div>
            </section>

            <section className="money-section money-section--tight">
              <button type="button" className="money-fund-banner money-tappable" onClick={() => setTab('비상금')}>
                <span className="money-fund-banner__text">
                  <span className="money-fund-banner__title">비상금</span>
                  <span className="money-fund-banner__sub">기분 좋아지는 나의 비상금</span>
                </span>
                <img className="money-fund-banner__chevron" src={icon('chevron-right-gray.svg')} alt="" />
                <img className="money-fund-banner__icon-img" src={img('saving_money.png')} alt="" />
              </button>
            </section>
          </>
        )}

        {tab === '수입·지출' && (
          <IncomeExpenseSection onNotice={setNotice} initialView={incomeExpenseInitialView} />
        )}

        {tab === '고정비' && (
          <>
            {/* 진행률 중심 구성(B안) — "총액을 두 번 보여주는" 대신 "이번 달 지출이 얼마나
             * 진행됐는지"를 헤드라인으로 삼는다. 총액은 서브텍스트로 한 번만, 증감은 오른쪽
             * 위 작은 배지 하나로 압축, 진행률 바 아래엔 총액 반복 대신 "남은 금액"을 보여준다. */}
            <section className="money-fixed-summary">
              <div className="money-fixed-summary__head">
                <div className="money-fixed-summary__stat">
                  <p className="money-fixed-summary__label">이번 달 고정비 지출 현황</p>
                  <p className="money-fixed-summary__amount">
                    <AnimatedPercentText percent={FIXED_PAID_PERCENT} /> 지출 완료
                  </p>
                  <p className="money-fixed-summary__total">
                    이번 달 고정비 {FIXED_MONTHLY_TOTAL.toLocaleString()}원
                  </p>
                </div>
                <img className="money-fixed-summary__icon" src={img('fixed_expenses.png')} alt="" />
              </div>
              <div className="money-fixed-status__track">
                <AnimatedProgressFill percent={FIXED_PAID_PERCENT} className="money-fixed-status__fill" />
              </div>
              <div className="money-fixed-status__labels">
                <span>지출 {FIXED_PAID_TOTAL.toLocaleString()}원</span>
                <span>남은 {FIXED_REMAINING_TOTAL.toLocaleString()}원</span>
              </div>
            </section>

            {nextFixedItem && (
              <section className="money-section">
                <h2 className="money-section__title">다음 결제</h2>
                <button
                  type="button"
                  className="money-fixed-next money-tappable"
                  onClick={() => setFixedDetailKey(nextFixedItem.key)}
                >
                  <span
                    className={`money-fixed-next__icon${findFixedItemImage(nextFixedItem) ? ' money-fixed-next__icon--plain' : ''}`}
                  >
                    {renderFixedIcon(nextFixedItem)}
                  </span>
                  <span className="money-fixed-next__info">
                    <span className="money-fixed-next__label">{nextFixedItem.label}</span>
                    <span className="money-fixed-next__sub">
                      {nextFixedPaymentLabel(nextFixedItem.day)} 자동결제
                    </span>
                  </span>
                  <span className="money-fixed-next__amount">{nextFixedItem.amount.toLocaleString()}원</span>
                  <img src={icon('chevron-right-gray.svg')} alt="" />
                </button>
              </section>
            )}

            <div className="money-fixed-toggle-guide">
              <span className="money-fixed-toggle-guide__icon" aria-hidden="true">
                i
              </span>
              <span className="money-fixed-toggle-guide__text">토글은 자동결제 사용 여부만 기록해요.</span>
            </div>

            <section className="money-section">
              <div className="money-section__head">
                <h2 className="money-section__title">고정비 내역 {filteredFixedItems.length}개</h2>
                <div className="money-fixed-sort">
                  <button
                    type="button"
                    className="money-fixed-list__sort"
                    aria-haspopup="listbox"
                    aria-expanded={fixedSortMenuOpen}
                    onClick={() => setFixedSortMenuOpen((open) => !open)}
                  >
                    {fixedSortOrder}
                    <img
                      src={icon('chevron-down-thin.svg')}
                      alt=""
                      className={fixedSortMenuOpen ? 'is-open' : ''}
                    />
                  </button>
                  {fixedSortMenuOpen && (
                    <>
                      {/* 메뉴 바깥 아무 곳이나 누르면 닫힌다 */}
                      <button
                        type="button"
                        className="money-fixed-sort__backdrop"
                        aria-label="정렬 메뉴 닫기"
                        onClick={() => setFixedSortMenuOpen(false)}
                      />
                      <ul className="money-fixed-sort__menu" role="listbox">
                        {FIXED_SORT_OPTIONS.map((option) => (
                          <li key={option}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={fixedSortOrder === option}
                              className={`money-fixed-sort__option${fixedSortOrder === option ? ' is-active' : ''}`}
                              onClick={() => selectFixedSortOrder(option)}
                            >
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <div className="money-fixed-category-tabs" role="tablist" aria-label="고정비 카테고리">
                {FIXED_CATEGORY_FILTERS.map((category) => (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={activeFixedCategory === category}
                    className={`money-fixed-category-tab${activeFixedCategory === category ? ' is-active' : ''}`}
                    onClick={() => selectFixedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div
                className="money-fixed-list__items"
                ref={fixedListRef}
                style={fixedListHeight === 'auto' ? undefined : { height: fixedListHeight }}
                onTransitionEnd={handleFixedListTransitionEnd}
              >
                {filteredFixedItems.length === 0 && (
                  <p className="money-fixed-list__empty">이 카테고리에 등록된 고정비가 없어요.</p>
                )}
                {filteredFixedItems.map((item) => {
                  const enabled = isFixedItemEnabled(item);
                  return (
                    <div key={item.key} className="money-fixed-row">
                      <button
                        type="button"
                        className="money-fixed-row__main money-tappable"
                        onClick={() => setFixedDetailKey(item.key)}
                      >
                        <span
                          className={`money-fixed-row__icon${findFixedItemImage(item) ? ' money-fixed-row__icon--plain' : ''}`}
                        >
                          {renderFixedIcon(item)}
                        </span>
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
              className="money-fixed-add-cta money-tappable"
              onClick={() => setFixedAddSheetOpen(true)}
            >
              <img src={icon('plus-add.svg')} alt="" />
              고정비 추가하기
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
              <span
                className={`money-fixed-detail__icon${findFixedItemImage(fixedDetailItem) ? ' money-fixed-detail__icon--plain' : ''}`}
              >
                {renderFixedIcon(fixedDetailItem)}
              </span>
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

    </div>
  );
}

export default MoneyPage;
