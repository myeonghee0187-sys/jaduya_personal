import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useAuth } from '../auth/AuthContext';
import { greetingName } from '../data/personaHome';
import { BottomNavigation } from '../components/BottomNavigation';
import { StatementPeek } from '../components/StatementPeek';
import { SpendingHistory } from '../components/money/SpendingHistory';
import { SubPageHeader } from '../components/SubPageHeader';
import { EmergencyFundCard } from '../components/money/EmergencyFundCard';
import { FundAmountSheet } from '../components/money/FundAmountSheet';
import { BottomSheet } from '../components/BottomSheet';
import { icon, img } from '../lib/asset';
import {
  TODAY_DAY,
  CATEGORY_META,
  allTransactionsSorted,
  CONSUME_DIFF,
  EXPENSE_TRANSACTIONS,
  CONSUME_CHANGE_PERCENT,
  TOTAL_EXPENSE,
  TRANSFER_TRANSACTIONS,
} from '../data/moneyTransactions';
import {
  FIXED_CATEGORY_OPTIONS,
  FIXED_CATEGORY_SPRITE,
  FIXED_CATEGORY_EMOJI,
  FIXED_ITEM_IMAGE,
  FIXED_ITEM_IMAGE_BY_NAME,
  FIXED_EXPENSES,
  NEXT_CARD_PAYMENT,
} from '../data/moneyFixed';
import type { FixedExpenseItem } from '../data/moneyFixed';
import { ACCOUNTS, CARDS, LOANS } from '../data/moneyAccounts';
import { BENEFITS, RECOMMENDED_BENEFIT_IDS } from '../data/benefits';

/* 돈 관리 화면 안 탭 — 이번 달 / 수입·지출 / 고정비 / 비상금. 수입·지출·고정비·비상금은 예산 설정처럼 새 화면(route:
 * /money/expense, /money/fixed, /money/fund)으로 열린다. 수입·지출 화면은 내용을 비워 두었다. */
const TABS = ['이번 달', '수입·지출', '고정비', '비상금'] as const;
/* 고정비 탭의 카테고리 필터 — '전체' + 데이터 원본(moneyFixed.ts)의 카테고리 그대로 */
const FIXED_CATEGORY_FILTERS = ['전체', ...FIXED_CATEGORY_OPTIONS] as const;
type Tab = (typeof TABS)[number];

/* 예산 카드 패널 — 생활통장은 내 계좌(moneyAccounts.ts) 첫 번째 계좌, 최근 내역은 이번 달
 * 거래 원본(moneyTransactions.ts)의 가장 최근 거래다(동일 데이터 정합). */
const LIVING_ACCOUNT = ACCOUNTS[0];
/* 예산 카드의 최근 내역 — 소비 4건 + 이체 2건(오늘까지 지난 것만)을 날짜 최신순으로 섞는다. 둘 다 거래 원본
 * (moneyTransactions.ts)에서 그대로 가져온다(동일 데이터 정합). */
const RECENT_FLOWS = [
  ...allTransactionsSorted()
    .slice(0, 4)
    .map((tx) => {
      const meta = CATEGORY_META.find((c) => c.key === tx.category);
      return {
        id: tx.id,
        day: tx.day,
        title: `최근 ${tx.merchant}에서 썼어요`,
        amount: tx.amount,
        icon: meta?.icon ?? 'money-cat-culture.svg',
        bg: meta?.bg ?? 'var(--color-gray-05)',
      };
    }),
  ...[...TRANSFER_TRANSACTIONS]
    .filter((tx) => tx.day <= TODAY_DAY)
    .sort((a, b) => b.day - a.day)
    .slice(0, 2)
    .map((tx) => ({
      id: tx.id,
      day: tx.day,
      title: `최근 이체 · ${tx.label}`,
      amount: tx.amount,
      icon: 'money-balance.svg',
      bg: 'var(--color-primary-05)',
    })),
].sort((a, b) => b.day - a.day);

/* 대출 금액 표기 — 1억원 / 500만원 / 1억 2,000만원 처럼 큰 단위로 줄여서 보여준다. */
function formatLoanAmount(amount: number): string {
  const eok = Math.floor(amount / 100_000_000);
  const man = Math.round((amount % 100_000_000) / 10_000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
}

/* 결제 예정 배너 — 오늘(TODAY_DAY) 이후 가장 가까운 고정비. 이번 달에 남은 게 없으면 다음 달
 * 첫 결제일을 보여준다(동일 데이터 정합 — 항목별 day 에서 그대로 계산). */
const NEXT_FIXED_PAYMENT = (() => {
  const byDay = [...FIXED_EXPENSES].sort((a, b) => a.day - b.day);
  const upcoming = byDay.find((item) => item.day > TODAY_DAY);
  if (upcoming) return { item: upcoming, days: upcoming.day - TODAY_DAY };
  return { item: byDay[0], days: 30 - TODAY_DAY + byDay[0].day };
})();


/* 알림 배너 — 혜택 알림. 혜택 원본(data/benefits.ts)에서 마감일·금액·일치 조건을 그대로 가져온다.
 * 배너 제목은 한 줄에 들어가야 해서 혜택별 짧은 이름만 여기서 따로 둔다(표시용). */
const BENEFIT_SHORT_TITLE: Record<string, string> = {
  'seongnam-pet-medical': '반려동물 진료비',
  'gyeonggi-youth-points': '청년 복지포인트',
};

/* 혜택 배너 슬라이드의 캐릭터 이미지 — 추천은 체크리스트, 진료비는 아이디어(꿀팁), 청년 복지포인트는
 * 엄지척(조건 일치) 캐릭터. assets/img/ 기준. */
const BENEFIT_RECOMMEND_ART = '02money-insight-badge.png';
const BENEFIT_ART: Record<string, string> = {
  'seongnam-pet-medical': '02money-fund-guide-badge.png',
  'gyeonggi-youth-points': '02money-budget-character.png',
};

/* 아이콘 메뉴 — 바로가기 목록. 수입·지출 / 고정비 / 비상금은 화면 안 탭으로, 예산·계좌·혜택은 해당 화면으로
 * 이동한다. 수입은 캘린더, 지출은 목록 보기로 연다. 기본 5개가 보이고, 맨 앞 "+"에서 바꿀 수 있다. */
interface MoneyMenuItem {
  key: string;
  label: string;
  /** assets/img/ 기준 이미지 */
  image?: string;
  /** assets/icon/ 기준 아이콘 — image 대신 쓴다 */
  icon?: string;
  /** 같은 화면 안 탭으로 이동 */
  tab?: Tab;
  view?: 'calendar' | 'list';
  /** 다른 화면으로 이동 */
  go?: 'money-budget' | 'money-accounts' | 'money-fixed' | 'money-fund' | 'money-expense' | 'benefits-recommend';
}

const MONEY_MENU_POOL: MoneyMenuItem[] = [
  { key: 'income', label: '수입', image: 'money-flow-income-badge.png', go: 'money-expense' },
  { key: 'expense', label: '지출', image: 'money-flow-expense-badge.png', go: 'money-expense' },
  { key: 'fixed', label: '고정비', image: FIXED_ITEM_IMAGE.rent ?? 'money-fixed-category-icons.png', go: 'money-fixed' },
  { key: 'fund', label: '비상금', image: 'money-fund-guide-badge.png', go: 'money-fund' },
  { key: 'budget', label: '예산 설정', image: 'money-budget-character.png', go: 'money-budget' },
  { key: 'accounts', label: '내 계좌', image: 'jaduya_custom_recommendation_36/money_management/saving_money.png', go: 'money-accounts' },
  { key: 'benefit', label: '혜택', icon: 'ai-avatar.svg', go: 'benefits-recommend' },
];
const DEFAULT_MENU_KEYS = ['income', 'expense', 'fixed', 'fund', 'budget'];
const MENU_STORAGE_KEY = 'money-menu-keys';

interface MoneyBanner {
  id: string;
  label: string;
  main: string;
  aria: string;
  /** assets/img/ 기준 이미지 */
  image?: string;
  /** assets/icon/ 기준 아이콘 — image 대신 쓴다 */
  icon?: string;
  onView?: () => void;
}

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


/* 마우스로도 옆으로 끌어 넘길 수 있게 한다 — 터치는 브라우저 기본 스와이프로 되지만, 데스크톱 브라우저의
 * 마우스는 가로 스크롤 영역을 끌어도 안 움직인다. 끌고 나서 손을 뗄 때 생기는 클릭은 막아 타일이
 * 잘못 눌리지 않게 한다. deps 가 바뀌면(탭 전환 등으로 요소가 새로 만들어질 때) 다시 붙인다. */
function useDragScroll(ref: { current: HTMLElement | null }, deps: unknown[]) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      down = true;
      moved = false;
      startX = event.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (event: PointerEvent) => {
      if (!down) return;
      const dx = event.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        el.classList.add('is-dragging');
      }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const blockClick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.classList.remove('is-dragging');
      if (moved) {
        el.addEventListener('click', blockClick, { capture: true, once: true });
        window.setTimeout(() => el.removeEventListener('click', blockClick, true), 0);
      }
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* 돈 관리 — 탭바 '돈관리' 로 들어오는 메인 화면(이번 달 탭).
 * 목적: "이번 달을 무리 없이 살아갈 수 있는가?" 를 한눈에 보여준다(CLAUDE.md 8. Money Rules).
 * 상세 고정비 결제 일정은 여기서 반복하지 않고 "이번 달 예정된 지출" 미리보기 3개 + "더보기"로만
 * 보여준다 — 고정비 탭의 "전체보기/더보기"도 아직 상세 route 가 없어 시각 요소로만 둔다. */
interface MoneyPageProps {
  /** 고정비·비상금은 돈관리 안 탭이 아니라 예산 설정처럼 새 화면(route)으로 열린다 — 그때 어느 화면인지 */
  screen?: 'fixed' | 'fund' | 'expense';
}

export function MoneyPage({ screen }: MoneyPageProps = {}) {
  const navigation = useAppNavigation();
  /* 생활통장 이름 — 로그인한 계정 이름에서 성을 뺀 이름 + "님의 생활통장"(예: 이하린 → 하린님의 생활통장) */
  const { user } = useAuth();
  const accountOwner = user?.name ? greetingName(user.name) : '';
  /* 다른 화면에서 시작 탭을 지정해 들어올 수 있다 (예: 알림, 딥링크).
   * 넘어온 값이 실제 탭일 때만 쓰고, 아니면 기존처럼 '이번 달'로 연다. */
  const requestedTab = navigation?.options.tab;
  /* 고정비·비상금 화면 — route(/money/fixed, /money/fund)로 열리거나, 예전 링크(?tab=고정비 / 비상금)로 들어와도 같은 화면 */
  const activeScreen: 'fixed' | 'fund' | 'expense' | undefined =
    screen ??
    (requestedTab === '고정비' ? 'fixed' : requestedTab === '비상금' ? 'fund' : requestedTab === '수입·지출' ? 'expense' : undefined);
  const [tab, setTab] = useState<Tab>(() =>
    activeScreen === 'fixed'
      ? '고정비'
      : activeScreen === 'fund'
        ? '비상금'
        : activeScreen === 'expense'
          ? '수입·지출'
          : requestedTab && (TABS as readonly string[]).includes(requestedTab)
          ? (requestedTab as Tab)
          : TABS[0],
  );
  /* 수입·지출 화면은 예산 설정처럼 새 화면(route)으로 연다. */
  const goToIncomeExpenseList = () => navigation?.navigate('money-expense');
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
  /* 상단 예산 카드 접기 — 접으면 금액만 남기고 예산·사용·진행률·예산 설정은 접는다.
   * 마지막 상태를 기억해 다시 열어도 유지한다(저장소가 막힌 환경이면 매번 펼침으로 시작). */
  const [budgetCollapsed, setBudgetCollapsed] = useState(() => {
    try {
      return localStorage.getItem('money-budget-collapsed') === '1';
    } catch {
      return false;
    }
  });
  /* 알림 배너 닫기 — 이 화면에 있는 동안만 기억한다. 하나를 닫으면 다음 순서의 다른 알림이
   * 이어서 나오고, 돈관리에 다시 들어오면(화면이 새로 열리면) 처음부터 다시 보여준다. */
  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>([]);
  const dismissBanner = (id: string) => {
    setDismissedBannerIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  /* 최근 거래 캐러셀 — 스크롤 위치로 현재 슬라이드를 구해 아래 점을 맞춘다. */
  const recentTrackRef = useRef<HTMLDivElement>(null);
  const [recentIndex, setRecentIndex] = useState(0);
  const handleRecentScroll = () => {
    const track = recentTrackRef.current;
    if (!track || track.clientWidth === 0) return;
    setRecentIndex(Math.round(track.scrollLeft / track.clientWidth));
  };
  const toggleBudgetCollapsed = () => {
    setBudgetCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('money-budget-collapsed', next ? '1' : '0');
      } catch {
        /* 저장 실패는 무시 — 이번 세션에서만 유지된다 */
      }
      return next;
    });
  };
  /* 예산 카드의 더보기 메뉴 — 수입·지출 탭의 정렬 드롭다운(flow-sort)과 같은 방식으로
   * 바깥을 누르면 닫는다. */
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);
  const budgetMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!budgetMenuOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!budgetMenuRef.current?.contains(event.target as Node)) setBudgetMenuOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [budgetMenuOpen]);
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
  /* 알림 배너 목록 — 순서대로 하나씩 보여준다. 문구는 전부 다른 화면과 같은 원본에서 계산한다
   * (결제일: 고정비 / 지출 비교: 소비 원본 / 비상금: 비상금 상태). */
  const fundPercentForBanner =
    fund.targetAmount > 0 ? Math.min(100, Math.round((fund.currentAmount / fund.targetAmount) * 100)) : 0;
  const fundRemainingForBanner = Math.max(0, fund.targetAmount - fund.currentAmount);
  const hiddenAmount = '₩ -----';
  const banners: MoneyBanner[] = [
    {
      id: `payment-${NEXT_FIXED_PAYMENT.item.key}`,
      label: `${NEXT_FIXED_PAYMENT.days === 1 ? '내일' : `${NEXT_FIXED_PAYMENT.days}일 뒤`} ${NEXT_FIXED_PAYMENT.item.label}`,
      main: `${amountsHidden ? hiddenAmount : `${NEXT_FIXED_PAYMENT.item.amount.toLocaleString()}원`} 결제 예정`,
      aria: '결제 예정 안내',
      image: FIXED_ITEM_IMAGE[NEXT_FIXED_PAYMENT.item.key] ?? 'money-flow-icons.png',
      onView: () => navigation?.navigate('money-fixed'),
    },
    {
      id: 'spend-compare',
      label: `지출 ${CONSUME_CHANGE_PERCENT}% ${CONSUME_DIFF >= 0 ? '감소' : '증가'}`,
      main: `${amountsHidden ? hiddenAmount : `${Math.abs(CONSUME_DIFF).toLocaleString()}원`} ${CONSUME_DIFF >= 0 ? '아꼈어요' : '더 나갔어요'}`,
      aria: '지출 비교 안내',
      image: 'money-flow-expense-badge.png',
      onView: goToIncomeExpenseList,
    },
    {
      id: 'fund-goal',
      label: `비상금 ${fundPercentForBanner}% 달성`,
      main: `${amountsHidden ? hiddenAmount : `${fundRemainingForBanner.toLocaleString()}원`} 남았어요`,
      aria: '비상금 안내',
      image: 'money-fund-guide-badge.png',
      onView: () => navigation?.navigate('money-fund'),
    },
  ];
  /* 최근 7일(오늘 포함) 거래 건수 — 요약 묶음 버튼에 쓴다 */
  const weekTransactionCount = EXPENSE_TRANSACTIONS.filter((tx) => tx.day > TODAY_DAY - 7).length;
  const activeBanner = banners.find((banner) => !dismissedBannerIds.includes(banner.id));
  /* 혜택 배너 슬라이드 — 알림 3개(혜택 추천 / 진료비 / 청년 복지포인트). 내용은 혜택 원본에서 계산한다. */
  const benefitSlides = [
    {
      id: 'benefit-recommend',
      image: BENEFIT_RECOMMEND_ART,
      lines: [`내 조건에 맞는 혜택 ${RECOMMENDED_BENEFIT_IDS.length}개`] as readonly string[],
      onView: () => navigation?.navigate('benefits-recommend', { returnTo: 'money' }),
    },
    ...BENEFITS.map((benefit) => {
      const dday = benefit.deadline.match(/D-\d+/)?.[0];
      const maxAmount = benefit.amountLabel === '최대' ? Number(benefit.amount.replace(/\D/g, '')) : 0;
      return {
        id: `benefit-${benefit.id}`,
        image: BENEFIT_ART[benefit.id] ?? BENEFIT_RECOMMEND_ART,
        lines: (maxAmount > 0
          ? [
              BENEFIT_SHORT_TITLE[benefit.id] ?? benefit.title,
              `최대 ${formatLoanAmount(maxAmount)}${dday ? ` · ${dday}` : ''}`,
            ]
          : [`${BENEFIT_SHORT_TITLE[benefit.id] ?? benefit.title} · 조건 ${benefit.matchCount}개 일치`]) as readonly string[],
        onView: () => navigation?.navigate('benefit-detail', { benefitId: benefit.id, returnTo: 'money' }),
      };
    }),
  ];
  /* 혜택 배너 — 스크롤 위치로 현재 슬라이드를 구하고, 재생 중이면 4초마다 다음 슬라이드로 넘긴다
   * (모션 감소 설정이면 자동으로 넘기지 않는다). */
  const promoTrackRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  useDragScroll(promoTrackRef, [tab]);
  useDragScroll(menuRef, [tab]);
  useDragScroll(recentTrackRef, [tab]);
  /* 예산 카드의 최근 거래 캐러셀 — 4초마다 다음 거래로 자동으로 넘어간다(카드를 접었거나 모션 감소
   * 설정이면 넘기지 않는다). 마지막 다음은 처음으로 돌아간다. */
  useEffect(() => {
    if (budgetCollapsed || RECENT_FLOWS.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const track = recentTrackRef.current;
      if (!track || track.clientWidth === 0) return;
      const next = (Math.round(track.scrollLeft / track.clientWidth) + 1) % RECENT_FLOWS.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [budgetCollapsed, tab]);
  const [promoIndex, setPromoIndex] = useState(0);
  const handlePromoScroll = () => {
    const track = promoTrackRef.current;
    if (!track || track.clientWidth === 0) return;
    setPromoIndex(Math.round(track.scrollLeft / track.clientWidth));
  };
  useEffect(() => {
    if (benefitSlides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const track = promoTrackRef.current;
      if (!track) return;
      const next = (Math.round(track.scrollLeft / track.clientWidth) + 1) % benefitSlides.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [benefitSlides.length]);
  /* 아직 화면이 없는 링크는 MyPage.tsx 와 같은 방식으로 토스트만 띄운다 — 없는 route 를 만들지 않는다 */
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);
  /* "고정비 추가하기" 직후 — 알림 문구(위 notice) + 방금 추가된 행으로 스크롤·하이라이트를
   * 같이 준다(1안+2안 조합). key 를 잠깐 들고 있다가 스크롤/애니메이션이 끝나면 지운다. */
  const [highlightFixedKey, setHighlightFixedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!highlightFixedKey) return;
    const node = scrollRef.current?.querySelector(`[data-fixed-key="${highlightFixedKey}"]`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = window.setTimeout(() => setHighlightFixedKey(null), 1600);
    return () => window.clearTimeout(timer);
  }, [highlightFixedKey]);
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
    setFixedAddName('교통비');
    setFixedAddAmount('65000');
    setFixedAddDay('15');
    setFixedAddDetail('대중교통');
    setFixedAddCategory('기타');
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
    const newKey = `added-${Date.now()}`;
    const newLabel = fixedAddName.trim();
    setAddedFixedItems((prev) => [
      ...prev,
      {
        key: newKey,
        day: fixedAddDayNumber,
        label: newLabel,
        amount: Number(fixedAddAmount),
        detail: fixedAddDetail.trim() || fixedAddCategory,
        category: fixedAddCategory,
        method: fixedAddMethod.trim(),
        enabled: true,
      },
    ]);
    /* 지금 보고 있던 카테고리 필터가 새 항목의 카테고리와 다르면 목록에 아예 안 보여서
     * 아래 스크롤·하이라이트가 아무 효과가 없다 — "전체"로 되돌려 반드시 보이게 한다. */
    setActiveFixedCategory('전체');
    setNotice(`${newLabel} 고정비를 추가했어요.`);
    setHighlightFixedKey(newKey);
    setFixedAddSheetOpen(false);
    resetFixedAddForm();
  };

  /* 아이콘 메뉴 — 보이는 바로가기(저장해서 유지)와 편집 시트 */
  const [menuKeys, setMenuKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(MENU_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        const valid = MONEY_MENU_POOL.map((item) => item.key).filter((key) => parsed.includes(key));
        if (valid.length > 0) return valid;
      }
    } catch {
      /* 저장소를 못 읽으면 기본 5개로 시작한다 */
    }
    return DEFAULT_MENU_KEYS;
  });
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  /* 계좌 묶음 — 하단 링크로 같은 자리에서 계좌 / 대출 / 카드 목록을 바꿔 보여준다 */
  const [assetTab, setAssetTab] = useState<'accounts' | 'loans' | 'cards'>('accounts');
  const toggleMenuKey = (key: string) => {
    setMenuKeys((prev) => {
      /* 최소 1개는 남긴다. 순서는 항상 목록(MONEY_MENU_POOL) 순서를 따른다. */
      const wanted = prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key];
      const next = MONEY_MENU_POOL.map((item) => item.key).filter((k) => wanted.includes(k));
      try {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* 저장 실패는 무시 — 이번 세션에서만 유지된다 */
      }
      return next;
    });
  };
  const menuImageOf = (item: MoneyMenuItem) => (item.icon ? icon(item.icon) : img(item.image ?? ''));
  const pressMenuItem = (item: MoneyMenuItem, active: boolean) => {
    if (item.go) {
      navigation?.navigate(item.go, item.go === 'benefits-recommend' ? { returnTo: 'money' } : undefined);
      return;
    }
    if (active) {
      setTab('이번 달');
      return;
    }
    setTab(item.tab ?? '이번 달');
  };
  /* 아이콘 메뉴(레퍼런스) — 맨 앞 "+"로 바로가기를 추가·삭제하고, 옆으로 밀어 넘긴다. 지금 보고 있는 화면의
   * 메뉴를 다시 누르면 이번 달로 돌아온다. 이번 달에서는 예산 카드 아래에, 다른 화면에서는 맨 위에 둔다. */
  const renderMoneyMenu = (below = false) => (
    <nav ref={menuRef} className={`money-menu${below ? ' money-menu--below' : ''}`} aria-label="돈 관리 메뉴">
      <button
        type="button"
        className="money-menu__item money-menu__item--add money-tappable"
        aria-label="바로가기 추가"
        onClick={() => setMenuSheetOpen(true)}
      >
        <span className="money-menu__tile">
          <img src={icon('plus-add.svg')} alt="" />
        </span>
      </button>
      {MONEY_MENU_POOL.filter((item) => menuKeys.includes(item.key)).map((item) => {
        const active = !item.go && tab === item.tab;
        return (
          <button
            key={item.key}
            type="button"
            className={`money-menu__item money-tappable${active ? ' is-active' : ''}`}
            aria-pressed={item.go ? undefined : active}
            onClick={() => pressMenuItem(item, active)}
          >
            <span className="money-menu__tile">
              <img src={menuImageOf(item)} alt="" />
            </span>
            <span className="money-menu__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="money app">
      <SubPageHeader
        title={
          activeScreen === 'fixed'
            ? '고정비'
            : activeScreen === 'fund'
              ? '비상금'
              : activeScreen === 'expense'
                ? '수입·지출'
                : '돈 관리'
        }
        backLabel={activeScreen ? '돈관리로' : '홈으로'}
        onBack={() => navigation?.goBack(activeScreen ? 'money' : 'home')}
      />

      <main
        className={`money__scroll${tab === '이번 달' ? ' money__scroll--peek' : ''}${tab === '수입·지출' ? ' money__scroll--fill' : ''}`}
        ref={scrollRef}
      >
        {tab !== '이번 달' && !activeScreen && renderMoneyMenu()}

        {tab === '이번 달' && (
          <>
            {/* 알림 배너(레퍼런스) — 위에서부터 하나씩 보여주고, 오른쪽 ×로 닫으면 다음 알림이
             * 이어서 나온다. 문구는 고정비·소비·비상금 원본에서 그대로 가져온다. */}
            {activeBanner && (
              <section key={activeBanner.id} className="money-banner" aria-label={activeBanner.aria}>
                <span className="money-banner__icon" aria-hidden="true">
                  <img src={activeBanner.icon ? icon(activeBanner.icon) : img(activeBanner.image ?? '')} alt="" />
                </span>
                <div className="money-banner__text">
                  <p className="money-banner__title">{activeBanner.label}</p>
                  <p className="money-banner__sub">{activeBanner.main}</p>
                </div>
                {activeBanner.onView && (
                  <button
                    type="button"
                    className="money-banner__btn money-tappable"
                    onClick={activeBanner.onView}
                  >
                    보기
                  </button>
                )}
                <button
                  type="button"
                  className="money-banner__close"
                  aria-label={`${activeBanner.aria} 닫기`}
                  onClick={() => dismissBanner(activeBanner.id)}
                >
                  <img src={icon('close-sm.svg')} alt="" />
                </button>
              </section>
            )}

            {/* 예산 카드(레퍼런스) — 빨간색은 위쪽 제목 줄에만 보이고, 흰 패널이 카드 전체 폭으로
             * 그 위에 겹쳐 올라온다(패널 위쪽 모서리 뒤로만 빨간색이 비친다). 오른쪽 위 알약형
             * 토글로 접으면 계좌명·금액만 남는다. 마지막 접힘 상태는 저장해 유지한다. */}
            <section className="money-budget">
              <div className="money-budget__top">
                <h2 className="money-budget__heading">예산</h2>
                <button
                  type="button"
                  className="money-budget__toggle"
                  aria-label={budgetCollapsed ? '예산 펼치기' : '예산 접기'}
                  aria-expanded={!budgetCollapsed}
                  aria-controls="money-budget-detail"
                  onClick={toggleBudgetCollapsed}
                >
                  <img
                    src={icon('chevron-down-thin.svg')}
                    alt=""
                    className={budgetCollapsed ? '' : 'is-open'}
                  />
                </button>
              </div>

              <div className={`money-budget__panel${budgetCollapsed ? ' is-collapsed' : ''}`}>
                <div className="money-budget__panel-head">
                  <span className="money-budget__account">
                    {accountOwner ? (
                      <>
                        <span className="money-budget__owner">{accountOwner}</span>님의 생활통장
                      </>
                    ) : (
                      '내 생활통장'
                    )}
                  </span>
                  <div className="money-budget__menu-wrap" ref={budgetMenuRef}>
                    <button
                      type="button"
                      className="money-budget__kebab"
                      aria-label="더보기"
                      aria-haspopup="menu"
                      aria-expanded={budgetMenuOpen}
                      onClick={() => setBudgetMenuOpen((open) => !open)}
                    >
                      <span />
                      <span />
                      <span />
                    </button>
                    {budgetMenuOpen && (
                      <div className="money-budget__menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="money-budget__menu-item"
                          onClick={() => {
                            setAmountsHidden((v) => !v);
                            setBudgetMenuOpen(false);
                          }}
                        >
                          {amountsHidden ? '금액 보기' : '금액 가리기'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p key={String(amountsHidden)} className="money-budget__amount budget-setup__pulse">
                  {showAmount(LIVING_ACCOUNT.balance)}
                </p>

                {/* 접으면 핵심 정보(계좌명·금액)만 남기고 버튼·최근 내역이 위로 말려 사라진다. */}
                <div
                  id="money-budget-detail"
                  className={`money-budget__detail${budgetCollapsed ? ' is-collapsed' : ''}`}
                  aria-hidden={budgetCollapsed}
                >
                  <div className="money-budget__detail-inner">
                    <div className="money-budget__buttons">
                      <button
                        type="button"
                        className="money-budget__btn money-tappable"
                        onClick={() => navigation?.navigate('money-budget')}
                      >
                        예산 설정
                      </button>
                      <button
                        type="button"
                        className="money-budget__btn money-tappable"
                        onClick={() => navigation?.navigate('money-accounts')}
                      >
                        이체하기
                      </button>
                    </div>

                    {/* 최근 거래 캐러셀 — 옆으로 넘기면 아래 점이 따라 바뀐다. */}
                    <div className="money-budget__recent-wrap">
                      <div
                        className="money-budget__recent-track"
                        ref={recentTrackRef}
                        onScroll={handleRecentScroll}
                      >
                        {RECENT_FLOWS.map((flow) => (
                          <button
                            key={flow.id}
                            type="button"
                            className="money-budget__recent"
                            onClick={goToIncomeExpenseList}
                          >
                            <span className="money-budget__recent-icon" style={{ background: flow.bg }}>
                              <img src={icon(flow.icon)} alt="" />
                            </span>
                            <span className="money-budget__recent-text">
                              <span className="money-budget__recent-label">{flow.title}</span>
                              <span className="money-budget__recent-amount">
                                {amountsHidden ? '₩ -----' : `${flow.amount.toLocaleString()}원`}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="money-budget__dots" aria-hidden="true">
                        {RECENT_FLOWS.map((flow, i) => (
                          <span
                            key={flow.id}
                            className={`money-budget__dot${i === recentIndex ? ' is-active' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {renderMoneyMenu(true)}

            {/* 혜택 배너(레퍼런스) — 큰 문구 두 줄 + 오른쪽 캐릭터, 왼쪽 아래에 일시정지 버튼과 진행 점.
             * 옆으로 넘기거나 자동으로 넘어가고(4초), 내용은 혜택 원본(data/benefits.ts)에서 가져온다. */}
            <section className="money-promo" aria-label="혜택 안내">
              <div className="money-promo__track" ref={promoTrackRef} onScroll={handlePromoScroll}>
                {benefitSlides.map((slide) => (
                  <button key={slide.id} type="button" className="money-promo__slide" onClick={slide.onView}>
                    <span className="money-promo__text">
                      {slide.lines.map((line) => (
                        <span key={line} className="money-promo__line">{line}</span>
                      ))}
                    </span>
                    <img className="money-promo__art" src={img(slide.image)} alt="" />
                  </button>
                ))}
              </div>
              <div className="money-promo__controls">
                <div className="money-promo__dots" aria-hidden="true">
                  {benefitSlides.map((slide, i) => (
                    <span key={slide.id} className={`money-promo__dot${i === promoIndex ? ' is-active' : ''}`} />
                  ))}
                </div>
              </div>
            </section>

            {/* 내 자산(레퍼런스) — 세 묶음: ① 계좌 목록 + 하단 바로가기 ② 이번 달 쓴 돈 / 나갈 카드값 요약
             * ③ 비상금 상태 + 하단 바로가기. 숫자는 계좌·거래·고정비·비상금 원본에서 그대로 계산한다. */}
            <section className="money-assets" aria-label="내 자산">
              <div className="money-asset-card">
                <ul className="money-asset-list money-asset-body money-asset-body--tall">
                  {assetTab === 'accounts' &&
                    ACCOUNTS.map((account, index) => (
                      <li key={account.id} className="money-asset-row">
                        <span className="money-asset-row__logo">
                          <img src={img(account.logo)} alt="" />
                        </span>
                        <span className="money-asset-row__text">
                          <span className="money-asset-row__amount">{showAmount(account.balance)}</span>
                          <span className="money-asset-row__sub">
                            {account.bank} {account.type}
                            {index === 0 && (
                              <>
                                <span className="money-asset-row__dot" aria-hidden="true">·</span>
                                <span className="money-asset-row__primary">주계좌</span>
                              </>
                            )}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="money-asset-row__btn money-tappable"
                          onClick={() => setNotice('송금 화면은 준비 중이에요.')}
                        >
                          송금
                        </button>
                      </li>
                    ))}
                  {assetTab === 'loans' &&
                    LOANS.map((loan) => (
                      <li key={loan.id} className="money-asset-row">
                        <span className="money-asset-row__text">
                          <span className="money-asset-row__amount">
                            {amountsHidden ? '₩ -----' : formatLoanAmount(loan.amount)}
                            <span className="money-asset-row__dot" aria-hidden="true">·</span>
                            {loan.rate}%
                          </span>
                          <span className="money-asset-row__sub">
                            <strong>{loan.kind}</strong> {loan.bank}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="money-asset-row__btn money-tappable"
                          onClick={() => setNotice('대출 내역 화면은 준비 중이에요.')}
                        >
                          내역
                        </button>
                      </li>
                    ))}
                  {assetTab === 'cards' &&
                    CARDS.map((card) => (
                      <li key={card.id} className="money-asset-row">
                        <span className="money-asset-row__card" aria-hidden="true">
                          {card.issuer.replace('카드', '')}
                        </span>
                        <span className="money-asset-row__text">
                          <span className="money-asset-row__amount">{showAmount(card.amount)}</span>
                          <span className="money-asset-row__sub">
                            {card.issuer} {card.tail} · {card.note}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="money-asset-row__btn money-tappable"
                          onClick={() => navigation?.navigate('money-fixed')}
                        >
                          내역
                        </button>
                      </li>
                    ))}
                </ul>
                <div className="money-asset-foot">
                  <div className="money-asset-foot__links" role="group" aria-label="자산 종류">
                    {(
                      [
                        ['accounts', '계좌'],
                        ['loans', '대출'],
                        ['cards', '카드'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={assetTab === key ? 'is-active' : undefined}
                        aria-pressed={assetTab === key}
                        onClick={() => setAssetTab(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="money-asset-foot__more"
                    onClick={() => navigation?.navigate('money-accounts')}
                  >
                    모두보기
                  </button>
                </div>
              </div>

              <div className="money-asset-card">
                <ul className="money-asset-list money-asset-body">
                  <li className="money-asset-row">
                    <span className="money-asset-row__text">
                      <span className="money-asset-row__amount">{showAmount(TOTAL_EXPENSE)}</span>
                      <span className="money-asset-row__sub">9월에 쓴 돈</span>
                    </span>
                    <button
                      type="button"
                      className="money-asset-row__btn money-asset-row__btn--tint money-tappable"
                      onClick={goToIncomeExpenseList}
                    >
                      이번 주 {weekTransactionCount}건
                    </button>
                  </li>
                  {NEXT_CARD_PAYMENT && (
                    <li className="money-asset-row">
                      <span className="money-asset-row__text">
                        <span className="money-asset-row__amount">{showAmount(NEXT_CARD_PAYMENT.amount)}</span>
                        <span className="money-asset-row__sub">{NEXT_CARD_PAYMENT.days}일 뒤 나갈 카드값</span>
                      </span>
                      <button
                        type="button"
                        className="money-asset-row__btn money-tappable"
                        onClick={() => navigation?.navigate('money-fixed')}
                      >
                        내역
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              <div className="money-asset-card">
                <div className="money-asset-body money-asset-head">
                  <h3 className="money-asset-head__title">내 신용점수</h3>
                  <span className="money-asset-head__badge">변동 감지</span>
                </div>
                <div className="money-asset-foot money-asset-foot--even">
                  <div className="money-asset-foot__links money-asset-foot__links--even">
                    <button type="button" onClick={() => setNotice('계좌개설 화면은 준비 중이에요.')}>계좌개설</button>
                    <button type="button" onClick={() => setNotice('카드발급 화면은 준비 중이에요.')}>카드발급</button>
                    <button type="button" onClick={() => setNotice('대출받기 화면은 준비 중이에요.')}>대출받기</button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 수입·지출 화면(/money/expense) — 결제 예정 시트의 카드 아래 내용(월 이동 · 소비 분류 · 달력 · 이용 내역)을 그대로 쓴다. */}
        {tab === '수입·지출' && <SpendingHistory variant="full" className="spending-history--page" />}

        {tab === '고정비' && (
          <>
            {/* 9월 고정비 한눈에(레퍼런스) — 지출 건수 + 총액, 카테고리별 결제일 목록, 자동결제 수단 안내 배너.
             * 숫자는 고정비 원본(등록한 항목 포함)에서 그대로 계산한다. 이미 지난 결제일은 옅게, 남은 결제일은 D-day 로 보여준다. */}
            <section className="fixed-overview" aria-label="고정비 한눈에">
              <p className="fixed-overview__count">지출 {allFixedItems.length}건</p>
              <p className="fixed-overview__total">
                {allFixedItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
              </p>

              {FIXED_CATEGORY_OPTIONS.map((category) => {
                /* 기본 고정비 7건(월세~헬스장)은 목록에서 숨기고, 사용자가 추가한 항목만 보여준다 (데이터·합계는 그대로) */
                const items = addedFixedItems.filter((item) => item.category === category).sort((a, b) => a.day - b.day);
                if (items.length === 0) return null;
                return (
                  <div key={category} className="fixed-overview__group">
                    <ul aria-label={category}>
                      {items.map((item) => {
                        const paid = item.day <= TODAY_DAY;
                        return (
                          <li key={item.key}>
                            <button
                              type="button"
                              className={`fixed-overview__row money-tappable${paid ? ' is-paid' : ''}`}
                              onClick={() => setFixedDetailKey(item.key)}
                            >
                              <span
                                className={`money-fixed-row__icon${findFixedItemImage(item) ? ' money-fixed-row__icon--plain' : ''}`}
                              >
                                {renderFixedIcon(item)}
                              </span>
                              <span className="fixed-overview__info">
                                <span className="fixed-overview__name">{item.label}</span>
                                <span className="fixed-overview__sub">
                                  {item.amount.toLocaleString()}원
                                  <span className="fixed-overview__dot" aria-hidden="true">
                                    ·
                                  </span>
                                  {item.method}
                                </span>
                              </span>
                              <span className="fixed-overview__when">
                                <span className="fixed-overview__day">{item.day}일</span>
                                {!paid && <span className="fixed-overview__dday">D-{item.day - TODAY_DAY}</span>}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              <button
                type="button"
                className="fixed-overview__notice money-tappable"
                onClick={() => setNotice('자동결제 수단 변경은 준비 중이에요.')}
              >
                <img src={icon('menu-card.svg')} alt="" />
                <span>자동결제 수단 바꾸고 싶다면?</span>
                <img src={icon('chevron-right-gray.svg')} alt="" />
              </button>
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
                    <div
                      key={item.key}
                      data-fixed-key={item.key}
                      className={`money-fixed-row${item.key === highlightFixedKey ? ' money-fixed-row--highlight' : ''}`}
                    >
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
      {/* 결제 예정 카드(레퍼런스) — 이번 달 화면 아래쪽에 살짝 보이고, 누르면 바텀시트로 올라온다 */}
      <StatementPeek visible={tab === '이번 달' && !activeScreen} onViewFixed={() => navigation?.navigate('money-fixed')} />

      <p className="money__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="money" />
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
        open={menuSheetOpen}
        className="fixed-add-sheet menu-edit-sheet"
        labelledBy="menu-edit-sheet-title"
        onDimClick={() => setMenuSheetOpen(false)}
      >
        <div className="bsheet__grip">
          <span />
        </div>
        <div className="fixed-add-sheet__header">
          <h2 className="fixed-add-sheet__title" id="menu-edit-sheet-title">
            바로가기 편집
          </h2>
          <button
            type="button"
            className="fixed-add-sheet__close"
            aria-label="닫기"
            onClick={() => setMenuSheetOpen(false)}
          >
            <img src={icon('sheet-close.svg')} alt="" />
          </button>
        </div>
        <ul className="menu-edit-sheet__list">
          {MONEY_MENU_POOL.map((item) => {
            const selected = menuKeys.includes(item.key);
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`menu-edit-sheet__row${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => toggleMenuKey(item.key)}
                >
                  <span className="menu-edit-sheet__icon">
                    <img src={menuImageOf(item)} alt="" />
                  </span>
                  <span className="menu-edit-sheet__label">{item.label}</span>
                  <span className="menu-edit-sheet__check" aria-hidden="true">
                    {selected ? '✓' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

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
