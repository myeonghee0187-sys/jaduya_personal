/* JADUYA — 돈관리 > 소비 탭의 단일 진실 공급원(single source of truth).
 *
 * 이 파일의 EXPENSE_TRANSACTIONS 배열이 "이번 달 소비" 총액, 카테고리별 합계·비율,
 * 카테고리 상세의 주요 내역, 일/주/월간 소비 흐름까지 전부 계산해 내는 유일한 원본이다.
 * MoneyPage.tsx 는 이 값들을 그대로 가져다 쓸 뿐, 화면에 숫자를 따로 하드코딩하지 않는다
 * (CLAUDE.md 13. 동일 데이터 정합 — 전체 합계 = 카테고리 합계 = 거래 내역 합계 = 일별 소비 흐름 합계).
 *
 * 2026년 9월 기준, "오늘"은 9월 20일(TODAY_DAY)이라 그 이후 날짜의 거래는 아직 없다.
 */

export type CategoryKey = 'food' | 'shopping' | 'transport' | 'culture' | 'life' | 'etc';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  icon: string;
  color: string;
  /** 지난달(8월) 카테고리 총액 — 트렌드 문구·월간 그래프에만 쓰는 단일 값이라
   * 지난달 거래 내역까지는 만들지 않는다(이번 달만 실제 transaction 단위로 관리). */
  prevAmount: number;
}

/* culture/life/etc 는 전용 아이콘이 없어 기존 결정대로 money-cat-culture.svg 를 공유한다
 * (임의로 새 아이콘 에셋을 만들지 않는다). 색만 서로 겹치지 않게 기존 브랜드 토큰에서 고른다. */
export const CATEGORY_META: readonly CategoryMeta[] = [
  { key: 'food', label: '식비', icon: 'money-cat-food.svg', color: 'var(--brand-primary)', prevAmount: 286_000 },
  { key: 'shopping', label: '쇼핑', icon: 'money-cat-shopping.svg', color: 'var(--brand-orange)', prevAmount: 235_000 },
  { key: 'transport', label: '교통', icon: 'money-cat-transport.svg', color: 'var(--brand-green)', prevAmount: 95_000 },
  { key: 'culture', label: '문화/여가', icon: 'money-cat-culture.svg', color: '#a39f9a', prevAmount: 68_000 },
  { key: 'life', label: '생활', icon: 'money-cat-culture.svg', color: 'var(--brand-rose)', prevAmount: 60_000 },
  { key: 'etc', label: '기타', icon: 'money-cat-culture.svg', color: 'var(--text-tertiary)', prevAmount: 51_000 },
] as const;

export interface ExpenseTransaction {
  id: string;
  /** 2026년 9월의 날짜(1~30) */
  day: number;
  category: CategoryKey;
  merchant: string;
  amount: number;
}

/** 이번 달 마지막 거래 날짜 — 소비 흐름 그래프의 기본 선택 날짜로도 쓴다. */
export const TODAY_DAY = 20;

/* 카테고리별 실제 거래 내역. 각 카테고리 합계는 이 목록의 합으로 "정의"된다 —
 * 총액을 먼저 정해두고 거래를 끼워 맞추지 않는다. */
export const EXPENSE_TRANSACTIONS: readonly ExpenseTransaction[] = [
  // ---- 식비 (합계 328,000원) ----
  { id: 'food-1', day: 1, category: 'food', merchant: 'GS25', amount: 8_000 },
  { id: 'food-2', day: 2, category: 'food', merchant: '배달의민족', amount: 26_000 },
  { id: 'food-3', day: 3, category: 'food', merchant: '스타벅스', amount: 4_500 },
  { id: 'food-4', day: 4, category: 'food', merchant: '김밥천국', amount: 9_000 },
  { id: 'food-5', day: 5, category: 'food', merchant: '이마트', amount: 12_000 },
  { id: 'food-6', day: 6, category: 'food', merchant: '배달의민족', amount: 31_000 },
  { id: 'food-7', day: 7, category: 'food', merchant: '파리바게뜨', amount: 5_500 },
  { id: 'food-8', day: 8, category: 'food', merchant: 'GS25', amount: 6_000 },
  { id: 'food-9', day: 9, category: 'food', merchant: '스타벅스', amount: 4_500 },
  { id: 'food-10', day: 9, category: 'food', merchant: '이마트', amount: 36_000 },
  { id: 'food-11', day: 10, category: 'food', merchant: '파리바게뜨', amount: 6_500 },
  { id: 'food-12', day: 11, category: 'food', merchant: '배달의민족', amount: 28_000 },
  { id: 'food-13', day: 12, category: 'food', merchant: '이마트', amount: 35_000 },
  { id: 'food-14', day: 13, category: 'food', merchant: '요기요', amount: 19_000 },
  { id: 'food-15', day: 14, category: 'food', merchant: '김밥천국', amount: 8_500 },
  { id: 'food-16', day: 15, category: 'food', merchant: '김밥천국', amount: 8_000 },
  { id: 'food-17', day: 16, category: 'food', merchant: '배달의민족', amount: 24_000 },
  { id: 'food-18', day: 17, category: 'food', merchant: '이마트', amount: 33_000 },
  { id: 'food-19', day: 18, category: 'food', merchant: '스타벅스', amount: 4_500 },
  { id: 'food-20', day: 19, category: 'food', merchant: 'GS25', amount: 7_000 },
  { id: 'food-21', day: 20, category: 'food', merchant: '배달의민족', amount: 12_000 },

  // ---- 쇼핑 (합계 182,000원) ----
  { id: 'shopping-1', day: 2, category: 'shopping', merchant: '쿠팡', amount: 22_000 },
  { id: 'shopping-2', day: 5, category: 'shopping', merchant: '무신사', amount: 38_000 },
  { id: 'shopping-3', day: 9, category: 'shopping', merchant: '올리브영', amount: 15_000 },
  { id: 'shopping-4', day: 13, category: 'shopping', merchant: '자라', amount: 41_000 },
  { id: 'shopping-5', day: 16, category: 'shopping', merchant: '쿠팡', amount: 19_000 },
  { id: 'shopping-6', day: 19, category: 'shopping', merchant: '무신사', amount: 47_000 },

  // ---- 교통 (합계 91,000원) ----
  { id: 'transport-1', day: 1, category: 'transport', merchant: '교통카드 충전', amount: 30_000 },
  { id: 'transport-2', day: 6, category: 'transport', merchant: '카카오T', amount: 9_500 },
  { id: 'transport-3', day: 10, category: 'transport', merchant: '교통카드 충전', amount: 30_000 },
  { id: 'transport-4', day: 14, category: 'transport', merchant: '카카오T', amount: 6_500 },
  { id: 'transport-5', day: 18, category: 'transport', merchant: 'SRT', amount: 15_000 },

  // ---- 문화/여가 (합계 63,000원) ----
  { id: 'culture-1', day: 5, category: 'culture', merchant: '넷플릭스 외 구독', amount: 30_000 },
  { id: 'culture-2', day: 13, category: 'culture', merchant: 'CGV', amount: 18_000 },
  { id: 'culture-3', day: 17, category: 'culture', merchant: '교보문고', amount: 15_000 },

  // ---- 생활 (합계 48,000원) ----
  { id: 'life-1', day: 6, category: 'life', merchant: '다이소', amount: 12_000 },
  { id: 'life-2', day: 11, category: 'life', merchant: '올리브영', amount: 9_000 },
  { id: 'life-3', day: 16, category: 'life', merchant: '세탁특공대', amount: 14_000 },
  { id: 'life-4', day: 20, category: 'life', merchant: '다이소', amount: 13_000 },

  // ---- 기타 (합계 18,000원) ----
  { id: 'etc-1', day: 8, category: 'etc', merchant: '문화상품권', amount: 10_000 },
  { id: 'etc-2', day: 17, category: 'etc', merchant: '기타 결제', amount: 8_000 },
] as const;

/* ---------- 아래는 전부 위 두 원본(CATEGORY_META.prevAmount, EXPENSE_TRANSACTIONS)에서
 * 계산해 내는 파생 데이터다. 여기서부터는 숫자를 새로 만들지 않는다. ---------- */

/** 이번 달 카테고리 합계 — 해당 카테고리 거래 내역의 합 그 자체다. */
export function categoryTotal(category: CategoryKey): number {
  return EXPENSE_TRANSACTIONS.filter((t) => t.category === category).reduce((sum, t) => sum + t.amount, 0);
}

export const CATEGORY_TOTALS: Readonly<Record<CategoryKey, number>> = Object.fromEntries(
  CATEGORY_META.map((c) => [c.key, categoryTotal(c.key)]),
) as Record<CategoryKey, number>;

/** 이번 달 전체 소비 = 모든 거래 내역의 합 = 모든 카테고리 합계의 합 (항상 같다). */
export const TOTAL_EXPENSE = EXPENSE_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0);

/** 지난달 전체 소비 = 카테고리별 지난달 합계의 합. */
export const TOTAL_PREV_EXPENSE = CATEGORY_META.reduce((sum, c) => sum + c.prevAmount, 0);

/** 최대잔여법(largest remainder method) — 반올림한 비율의 합이 항상 정확히 100%가 되도록 맞춘다.
 * 각 카테고리 비율을 따로 반올림해서 하드코딩하면 합이 100%를 벗어날 수 있어(요구사항 16), 정수부는
 * 내림으로 먼저 배분하고 소수부가 큰 순서대로 남은 1%p씩을 채운다. */
function distributePercentages(amounts: Readonly<Record<CategoryKey, number>>, total: number): Record<CategoryKey, number> {
  const keys = Object.keys(amounts) as CategoryKey[];
  if (total <= 0) return Object.fromEntries(keys.map((k) => [k, 0])) as Record<CategoryKey, number>;
  const shares = keys.map((key) => {
    const exact = (amounts[key] / total) * 100;
    return { key, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let used = shares.reduce((sum, s) => sum + s.floor, 0);
  const result = Object.fromEntries(shares.map((s) => [s.key, s.floor])) as Record<CategoryKey, number>;
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; used < 100 && i < byRemainder.length; i += 1, used += 1) {
    result[byRemainder[i].key] += 1;
  }
  return result;
}

export const CATEGORY_PERCENTAGES: Readonly<Record<CategoryKey, number>> = distributePercentages(
  CATEGORY_TOTALS,
  TOTAL_EXPENSE,
);

/** 소비 비중이 가장 큰 카테고리 — "이번 달은 OO가 가장 많이 사용됐어요" 인사이트에 쓴다. */
export const TOP_CATEGORY = CATEGORY_META.reduce((max, c) =>
  CATEGORY_TOTALS[c.key] > CATEGORY_TOTALS[max.key] ? c : max,
);

/** 카테고리의 주요 내역 — 최근 날짜 순으로 정렬한다(레퍼런스처럼 최근 거래부터 보여준다). */
export function categoryTransactions(category: CategoryKey): ExpenseTransaction[] {
  return EXPENSE_TRANSACTIONS.filter((t) => t.category === category).sort((a, b) => b.day - a.day);
}

export interface FlowPoint {
  label: string;
  amount: number;
}

/** 일별 소비 흐름(1~30일). category 를 주면 그 카테고리만, 안 주면 전체 합산. */
export function dailyFlow(category?: CategoryKey): (FlowPoint & { day: number })[] {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return days.map((day) => ({
    day,
    label: `9월 ${day}일`,
    amount: EXPENSE_TRANSACTIONS.filter((t) => t.day === day && (!category || t.category === category)).reduce(
      (sum, t) => sum + t.amount,
      0,
    ),
  }));
}

const WEEK_RANGES = [
  { label: '9/1~9/7', from: 1, to: 7 },
  { label: '9/8~9/14', from: 8, to: 14 },
  { label: '9/15~9/21', from: 15, to: 21 },
  { label: '9/22~9/30', from: 22, to: 30 },
] as const;

/** 주별 소비 흐름 — 1~30일 거래를 4개 주 구간으로 묶어서 합산한다. */
export function weeklyFlow(category?: CategoryKey): FlowPoint[] {
  return WEEK_RANGES.map((w) => ({
    label: w.label,
    amount: EXPENSE_TRANSACTIONS.filter(
      (t) => t.day >= w.from && t.day <= w.to && (!category || t.category === category),
    ).reduce((sum, t) => sum + t.amount, 0),
  }));
}

/** 월별 소비 흐름 — 지난달은 거래 단위 데이터가 없어 카테고리 총액(prevAmount) 하나만 쓴다.
 * 근거 없는 숫자를 만들지 않기 위해, 실제 거래 데이터가 있는 이번 달과 지난달 두 달치만 보여준다. */
export function monthlyFlow(category: CategoryKey): FlowPoint[] {
  const meta = CATEGORY_META.find((c) => c.key === category);
  return [
    { label: '8월', amount: meta?.prevAmount ?? 0 },
    { label: '9월', amount: CATEGORY_TOTALS[category] },
  ];
}

/* ---------- 소비 탭 "디지털 영수증" 전용 파생 데이터 ----------
 * 지난달 대비 절약/초과 문구는 이번 달·지난달 총액의 차이 그 자체에서 계산한다
 * (근거 없는 문장을 만들지 않는다 — CLAUDE.md 13). */
export const CONSUME_DIFF = TOTAL_PREV_EXPENSE - TOTAL_EXPENSE;
export const CONSUME_CHANGE_PERCENT = TOTAL_PREV_EXPENSE > 0
  ? Math.round((Math.abs(CONSUME_DIFF) / TOTAL_PREV_EXPENSE) * 1000) / 10
  : 0;

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 거래 하나를 특정 짓는 id 문자열에서 결정적(항상 같은 값)인 의사난수를 뽑아낸다.
 * 실제 결제수단·승인번호·시간 데이터가 없어 목업으로 채워야 하는데, 매 렌더마다 값이
 * 바뀌면 안 되니 Math.random() 대신 id 를 시드로 쓴다. */
function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

/* 카드번호 뒷자리 표기는 기존 고정비 탭 결제수단 문구("신한카드 · •• 4821")와 같은 형식을 쓴다 —
 * 새 표기 규칙을 만들지 않는다. */
const PAYMENT_METHODS = [
  '신한카드 · •• 4821',
  '카카오뱅크 카드 · •• 5678',
  '삼성카드 · •• 9012',
  '국민카드 · •• 2468',
] as const;

/** 거래 상세의 결제수단 — 실제 카드 데이터가 없어 id 시드로 고정 배정한 목업. */
export function transactionPaymentMethod(id: string): string {
  return PAYMENT_METHODS[seedFromId(id) % PAYMENT_METHODS.length];
}

/** 거래 상세의 승인번호 — 8자리 목업(레퍼런스 표기와 동일한 자릿수). */
export function transactionApprovalNumber(id: string): string {
  return String(10_000_000 + (seedFromId(id) % 90_000_000));
}

/** 거래 상세의 결제 시각(HH:MM) — 원본 데이터엔 날짜(day)만 있어 시각은 id 시드로 만든 목업. */
export function transactionTime(id: string): string {
  const seed = seedFromId(id);
  const hour = 8 + (seed % 14); // 08~21시
  const minute = Math.floor(seed / 14) % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** "2026.09.14 (목)" — 거래 상세 헤더의 전체 날짜 표기. */
export function formatFullDate(day: number): string {
  const weekday = WEEKDAY_LABELS[new Date(2026, 8, day).getDay()];
  return `2026.09.${String(day).padStart(2, '0')} (${weekday})`;
}

/** 영수증 거래 목록의 날짜 그룹 라벨 — 오늘/어제는 상대 표현, 그 외는 "9월 N일 (요일)". */
export function relativeDayLabel(day: number): string {
  if (day === TODAY_DAY) return `오늘 · 9월 ${day}일`;
  if (day === TODAY_DAY - 1) return `어제 · 9월 ${day}일`;
  const weekday = WEEKDAY_LABELS[new Date(2026, 8, day).getDay()];
  return `9월 ${day}일 (${weekday})`;
}

/** id 로 원본 거래 하나를 찾는다 — 거래 상세 화면 진입용. */
export function findTransaction(id: string): ExpenseTransaction | undefined {
  return EXPENSE_TRANSACTIONS.find((t) => t.id === id);
}

/** 전체 거래를 최근 날짜 순으로 정렬한다 — 영수증은 최근 거래부터 보여준다. */
export function allTransactionsSorted(): ExpenseTransaction[] {
  return [...EXPENSE_TRANSACTIONS].sort((a, b) => b.day - a.day || a.id.localeCompare(b.id));
}

export interface TransactionDayGroup {
  day: number;
  label: string;
  items: ExpenseTransaction[];
}

/** 검색/카테고리 필터가 적용된 거래를 날짜별로 묶는다 — predicate 없이 부르면 전체 목록. */
export function transactionsGroupedByDay(predicate?: (t: ExpenseTransaction) => boolean): TransactionDayGroup[] {
  const list = allTransactionsSorted().filter((t) => !predicate || predicate(t));
  const byDay = new Map<number, ExpenseTransaction[]>();
  for (const t of list) {
    const bucket = byDay.get(t.day);
    if (bucket) bucket.push(t);
    else byDay.set(t.day, [t]);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([day, items]) => ({ day, label: relativeDayLabel(day), items }));
}
