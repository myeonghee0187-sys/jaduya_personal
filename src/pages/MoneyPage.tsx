import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  TOTAL_PREV_EXPENSE,
  TOTAL_INCOME,
  TOTAL_PREV_INCOME,
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
    /* '생활' → '주거·생활' — 이 미리보기 그리드에서만 쓰는 표기다(카테고리 원본 라벨은
     * 소비 탭 등 다른 화면에서 계속 '생활'로 쓰이니 원본 자체를 바꾸지 않는다). */
    label: c.key === 'life' ? '주거·생활' : c.label,
    icon: c.icon,
    color: c.color,
    bg: c.bg,
    amount: CATEGORY_TOTALS[c.key],
    percent: CATEGORY_PERCENTAGES[c.key],
  })),
  ...(SPEND_ANALYSIS_REST.length > 0
    ? [
        {
          key: 'etc-merged',
          label: '기타',
          icon: 'money-cat-culture.svg',
          /* '생활' 4위 밖으로 밀려나면 '기타'로 합쳐지는 나머지 묶음 — 카테고리 전용
           * 토큰(tokens.css "Color / Category")의 기타 색을 그대로 쓴다. 예전엔 문화/여가와
           * 같은 회색(#a39f9a)이 겹쳐서 도넛 차트 두 구간이 붙어 보였는데, 지금은 카테고리마다
           * 색이 전부 달라 이 문제가 생기지 않는다. */
          color: 'var(--category-etc)',
          bg: 'var(--category-etc-bg)',
          amount: SPEND_ANALYSIS_REST_TOTAL,
          percent: SPEND_ANALYSIS_REST_PERCENT,
        },
      ]
    : []),
];

/* "소비 인사이트" 배너 — 가장 많이 쓴 카테고리(TOP_CATEGORY)의 지난달 대비 증감.
 * 카테고리 데이터 원본(CATEGORY_META.prevAmount)에서 그대로 계산한다. */
const TOP_CATEGORY_DIFF = CATEGORY_TOTALS[TOP_CATEGORY.key] - TOP_CATEGORY.prevAmount;

/* "이번 달 수입·지출" 카드 아래 "지난달보다 ~원 많아요/줄었어요" 비교 문구 — 지출은
 * 소비 탭 디지털 영수증(CONSUME_DIFF)과 같은 원본(TOTAL_PREV_EXPENSE)에서, 수입은 같은
 * 성격의 지난달 기준값(TOTAL_PREV_INCOME)에서 그대로 계산한다. */
const INCOME_DIFF = TOTAL_INCOME - TOTAL_PREV_INCOME;
const EXPENSE_DIFF = TOTAL_PREV_EXPENSE - TOTAL_EXPENSE;


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

/* 소비 분석 카드 5개 각자의 % 만큼 아래에서부터 차오르는 물 채워지는 바 — 세로판 AnimatedProgressFill.
 * 카드 흔들림(--wiggle)이 걸리면 이 fill 도 같이 물결치도록 money.css 에서 별도 keyframe 을 건다. */
function AnimatedFillLevel({ percent, className }: { percent: number; className: string }) {
  const display = useAnimatedPercent(percent);
  return <span className={className} style={{ height: `${Math.min(100, display)}%` }} />;
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
  /* 소비 분석 카드(5개) 탭 피드백 — 문패처럼 위쪽을 축으로 흔들린다. 같은 카드를 다시 눌러도
   * 애니메이션이 처음부터 다시 재생되도록, 카드 React key에 이 카운터를 섞어 눌릴 때마다
   * 새로 마운트시킨다(CSS만으로는 재생 중인 animation을 같은 클래스로 재시작할 수 없다).
   * --wiggle 이 붙어 있는 동안은 money.css 의 평상시 물결(money-spend-fill-idle)보다
   * 더 센 출렁임이 우선하도록 덮어 쓴다 — 그래서 재생이 끝나면(700ms) 다시 null 로 돌려
   * --wiggle 을 떼어내야 평상시 물결이 이어서 보인다(안 떼면 계속 덮인 채로 멈춰 있다). */
  const [spendCardWiggle, setSpendCardWiggle] = useState<{ key: string; n: number } | null>(null);
  const spendWiggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSpendCardTap = (key: string) => {
    setSpendCardWiggle((prev) => ({ key, n: prev?.key === key ? prev.n + 1 : 1 }));
    if (spendWiggleTimer.current) clearTimeout(spendWiggleTimer.current);
    spendWiggleTimer.current = setTimeout(() => setSpendCardWiggle(null), 700);
  };
  useEffect(() => () => {
    if (spendWiggleTimer.current) clearTimeout(spendWiggleTimer.current);
  }, []);
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
  /* (v3) 카테고리를 바꾸면 아래 목록 높이가 즉시 바뀐다 — 애니메이션을 걷어내고 위젯 페이지의
   * "전체 위젯" 목록(WidgetPage.tsx)처럼 즉시 리플로우하게 했는데도, 항목 수 차이가 큰
   * 카테고리(예: 전체 7건 → 보험 1건)로 바꾸면 한 번에 훅 줄어드는 게 여전히 "꿀렁"거려
   * 보였다 — 스크롤이 내려가 있었다면 그 순간 스크롤 가능 범위 자체가 줄어서 화면까지
   * 같이 밀렸기 때문이다(애니메이션 유무와 무관하게, 컨테이너 실제 높이가 바뀌는 한 피할
   * 수 없다).
   *
   * (v4) 아예 안 바뀌게 한다: '전체'는 정의상 모든 카테고리의 합집합이라 항상 다른 어떤
   * 카테고리보다 항목이 많거나 같다 — 그래서 '전체'일 때 한 번 잰 높이를 min-height 로
   * 고정해 두면, 이후 어떤 카테고리를 눌러도(전체보다 짧을 수밖에 없으니) 컨테이너 자체가
   * 절대 더 줄어들지 않는다. 탭·CTA·스크롤 위치 전부 클릭 전과 똑같이 "그 자리에 고정"된다
   * — 항목이 적은 카테고리에서는 그만큼 빈 여백이 남지만, 화면이 흔들리는 것보다 낫다. */
  const fixedListRef = useRef<HTMLDivElement>(null);
  const [fixedListMinHeight, setFixedListMinHeight] = useState(0);
  const selectFixedCategory = (category: (typeof FIXED_CATEGORY_FILTERS)[number]) => {
    setActiveFixedCategory(category);
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
  /* '전체'를 보고 있을 때만 다시 잰다 — '전체'는 항상 다른 모든 카테고리의 합집합이라
   * 이 값이 곧 전체 카테고리 중 최댓값이다(한 번 자리 잡으면 다시 줄어들 일이 없다).
   * tab 을 의존성에 넣어야 한다 — 처음 마운트될 때는 '고정비' 탭이 아직 안 그려져서
   * fixedListRef 가 null 이고(그래서 아무 것도 못 잰다), activeFixedCategory 는 이미
   * 기본값 '전체'라 이후 '고정비' 탭으로 처음 전환해도 이 값 자체는 안 바뀌어 effect 가
   * 다시 안 돈다 — tab 이 '고정비'로 바뀌는 순간을 직접 걸어줘야 그때 실제로 잰다. */
  useEffect(() => {
    if (tab !== '고정비' || activeFixedCategory !== '전체') return;
    const node = fixedListRef.current;
    if (node) setFixedListMinHeight(node.scrollHeight);
  }, [tab, activeFixedCategory, filteredFixedItems.length]);
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
                <div className="money-flow-card money-flow-card--income">
                  <span className="money-flow-card__title-row">
                    {/* 풋자두 배경 위에서 장식 스티커(icon-badge.png) 대신 --category-life
                     * 단색 아이콘을 쓴다 — 래스터 이미지는 CSS 로 색을 바꿀 수 없어, 배경과
                     * 무관하게 항상 같은 톤인 스티커로는 "아이콘도 딥그린" 요구를 못 맞춘다. */}
                    <svg
                      className="money-flow-card__title-icon"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 16V4M10 4L5 9M10 4l5 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="money-flow-card__title">이번 달 수입</span>
                  </span>
                  <span
                    key={String(amountsHidden)}
                    className="money-flow-card__value money-flow-card__value--income budget-setup__pulse"
                  >
                    {amountsHidden ? '₩ -----' : `+${TOTAL_INCOME.toLocaleString()}원`}
                  </span>
                  <span className="money-flow-card__sub">
                    지난달보다 {Math.abs(INCOME_DIFF).toLocaleString()}원 {INCOME_DIFF >= 0 ? '많아요!' : '적어요!'}
                  </span>
                </div>
                <div className="money-flow-card money-flow-card--expense">
                  <span className="money-flow-card__title-row">
                    <svg
                      className="money-flow-card__title-icon"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 4V16M10 16L5 11M10 16l5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="money-flow-card__title">이번 달 지출</span>
                  </span>
                  <span
                    key={String(amountsHidden)}
                    className="money-flow-card__value money-flow-card__value--expense budget-setup__pulse"
                  >
                    {amountsHidden ? '₩ -----' : `-${TOTAL_EXPENSE.toLocaleString()}원`}
                  </span>
                  <span className="money-flow-card__sub">
                    지난달보다 {Math.abs(EXPENSE_DIFF).toLocaleString()}원 {EXPENSE_DIFF >= 0 ? '줄었어요!' : '늘었어요!'}
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
              <div className="money-spend-grid">
                {SPEND_ANALYSIS_ROWS.map((row) => {
                  const wiggleN = spendCardWiggle?.key === row.key ? spendCardWiggle.n : 0;
                  return (
                    <button
                      type="button"
                      key={`${row.key}-${wiggleN}`}
                      className={`money-spend-grid-card money-tappable${wiggleN > 0 ? ' money-spend-grid-card--wiggle' : ''}`}
                      style={{ '--spend-fill-color': row.color } as CSSProperties}
                      onClick={() => handleSpendCardTap(row.key)}
                    >
                      <AnimatedFillLevel percent={row.percent} className="money-spend-grid-card__fill" />
                      <span className="money-spend-grid-card__icon" style={{ background: row.bg }}>
                        <img src={icon(row.icon)} alt="" />
                      </span>
                      <span className="money-spend-grid-card__label">{row.label}</span>
                      <span className="money-spend-grid-card__amount">
                        {amountsHidden ? '-----' : `${row.amount.toLocaleString()}원`}
                      </span>
                      <span className="money-spend-grid-card__percent">
                        <AnimatedPercentText percent={row.percent} />
                      </span>
                    </button>
                  );
                })}
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
                <button
                  type="button"
                  className="money-mini-card money-mini-card--fixed money-tappable"
                  onClick={() => setTab('고정비')}
                >
                  <span className="money-mini-card__head">
                    <span className="money-mini-card__title-group">
                      <img
                        className="money-mini-card__title-icon"
                        src={img('jaduya_custom_recommendation_36/money_management/icon-badge-2.png')}
                        alt=""
                      />
                      <span className="money-mini-card__title">고정비</span>
                    </span>
                    <img className="money-mini-card__chevron" src={icon('chevron-right-gray.svg')} alt="" />
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
                  className="money-mini-card money-mini-card--accounts money-tappable"
                  onClick={() => navigation?.navigate('money-accounts')}
                >
                  <span className="money-mini-card__head">
                    <span className="money-mini-card__title-group">
                      <img
                        className="money-mini-card__title-icon"
                        src={img('jaduya_custom_recommendation_36/money_management/icon-badge-3.png')}
                        alt=""
                      />
                      <span className="money-mini-card__title">내 계좌</span>
                    </span>
                    <img className="money-mini-card__chevron" src={icon('chevron-right-gray.svg')} alt="" />
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
                style={fixedListMinHeight ? { minHeight: fixedListMinHeight } : undefined}
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
