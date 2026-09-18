/* JADUYA — 돈관리 > 고정비의 단일 진실 공급원(single source of truth).
 *
 * MoneyPage.tsx("고정비" 탭)가 요약 카드부터 카테고리 필터·전체 목록까지 이 정적 목록
 * 하나로 전부 계산해서 보여준다(CLAUDE.md 13. 동일 데이터 정합) — 별도 상세 페이지 없이
 * 탭 하나에 다 있다.
 */
import { TODAY_DAY, TOTAL_EXPENSE } from './moneyTransactions';

/* money-fixed-category-icons.png 는 724x724 정사각 아이콘 3장이 가로로 이어진
 * 스프라이트(주거비·통신,구독·보험 순)라 카테고리는 그 3개 + '기타'로 묶는다. */
export const FIXED_CATEGORY_OPTIONS = ['주거비', '통신 · 구독', '보험', '기타'] as const;

export interface SpriteCrop {
  left: string;
  top: string;
  width: string;
  height: string;
}

export interface FixedExpenseItem {
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

export const FIXED_CATEGORY_SPRITE: Partial<Record<(typeof FIXED_CATEGORY_OPTIONS)[number], SpriteCrop>> = {
  '주거비': { left: '0%', top: '0%', width: '300%', height: '100%' },
  '통신 · 구독': { left: '-100%', top: '0%', width: '300%', height: '100%' },
  '보험': { left: '-200%', top: '0%', width: '300%', height: '100%' },
};

/** '기타' 카테고리만 전용 아이콘이 없어 이모지로 대체한다. */
export const FIXED_CATEGORY_EMOJI: Partial<Record<(typeof FIXED_CATEGORY_OPTIONS)[number], string>> = {
  '기타': '🏋️',
};

/* 항목 하나만 따로 골라 실제 이미지 아이콘을 쓸 때 여기에 추가한다 — item.key 로 찾고,
 * 있으면 카테고리 스프라이트/이모지보다 우선한다(월세만 바꾸고 같은 카테고리인 관리비는
 * 그대로 스프라이트를 쓰는 식). 경로는 assets/img/ 기준(lib/asset.ts 의 img()). */
export const FIXED_ITEM_IMAGE: Partial<Record<string, string>> = {
  rent: 'jaduya_custom_recommendation_36/money_management/image 287.png',
  maintenance: 'jaduya_custom_recommendation_36/money_management/image 288.png',
  phone: 'jaduya_custom_recommendation_36/money_management/image 280.png',
  music: 'jaduya_custom_recommendation_36/money_management/image 281.png',
  ott: 'jaduya_custom_recommendation_36/money_management/image 282.png',
  insurance: 'jaduya_custom_recommendation_36/money_management/image 283.png',
  gym: 'jaduya_custom_recommendation_36/money_management/image 284.png',
};

/* "고정비 추가하기" 로 새로 만든 항목은 key 가 매번 새로 생겨(added-${Date.now()})
 * FIXED_ITEM_IMAGE 로 못 찾는다 — 이름으로도 한 번 더 찾아서, 더미 채우기("교통비")로
 * 추가한 항목도 카테고리 스프라이트 대신 이 아이콘을 쓰게 한다. */
export const FIXED_ITEM_IMAGE_BY_NAME: Partial<Record<string, string>> = {
  '교통비': 'jaduya_custom_recommendation_36/money_management/image 286.png',
};

export const FIXED_EXPENSES: FixedExpenseItem[] = [
  { key: 'rent', label: '월세', amount: 500_000, day: 1, detail: '우리집', category: '주거비', method: '자두뱅크 자동이체', enabled: true },
  { key: 'maintenance', label: '관리비', amount: 120_000, day: 5, detail: '아파트', category: '주거비', method: '자두뱅크 자동이체', enabled: true },
  { key: 'phone', label: '통신비', amount: 55_000, day: 10, detail: 'SKT', category: '통신 · 구독', method: 'SKT 자동납부', enabled: true },
  { key: 'music', label: '음악 스트리밍', amount: 11_900, day: 15, detail: 'Spotify', category: '통신 · 구독', method: '신한카드 · •• 4821', enabled: true },
  { key: 'ott', label: 'OTT 구독', amount: 13_900, day: 15, detail: '디즈니플러스', category: '통신 · 구독', method: '신한카드 · •• 4821', enabled: true },
  { key: 'insurance', label: '보험료', amount: 70_000, day: 20, detail: '실손보험', category: '보험', method: '삼성카드 · •• 9012', enabled: true },
  { key: 'gym', label: '헬스장', amount: 66_000, day: 25, detail: '헬스장', category: '기타', method: '삼성카드 · •• 9012', enabled: false },
];

/* 이번 달 고정비 총액 = 항목 합 그 자체다(동일 데이터 정합) — 근거 없이 값을 따로 만들지
 * 않는다. 토글은 자동결제 사용 여부일 뿐 합계에서 빼지 않는다.
 * 지난달엔 OTT 구독이 없었다고 보고(신규 항목), 그 차이만큼만 늘었다는 인사이트를 계산한다. */
export const FIXED_MONTHLY_TOTAL = FIXED_EXPENSES.reduce((sum, item) => sum + item.amount, 0);
const NEW_FIXED_ITEM = FIXED_EXPENSES.find((item) => item.key === 'ott')!;
export const FIXED_PREV_MONTHLY_TOTAL = FIXED_MONTHLY_TOTAL - NEW_FIXED_ITEM.amount;
export const FIXED_MONTHLY_DIFF = FIXED_MONTHLY_TOTAL - FIXED_PREV_MONTHLY_TOTAL;
/* "지난달보다 -2.2%" 같은 퍼센트 표기 — 지난달 총액 대비 증감폭 */
export const FIXED_MONTHLY_DIFF_PERCENT = Math.round((FIXED_MONTHLY_DIFF / FIXED_PREV_MONTHLY_TOTAL) * 1000) / 10;

/* 전체 지출(변동비) 대비 고정비 비중 — 변동비 원본(TOTAL_EXPENSE, moneyTransactions.ts)과
 * 항상 같은 계산식을 쓴다. */
export const FIXED_EXPENSE_SHARE_PERCENT = Math.round(
  (FIXED_MONTHLY_TOTAL / (FIXED_MONTHLY_TOTAL + TOTAL_EXPENSE)) * 100,
);

/* "이번 달 고정비 지출 현황" 진행률 — 오늘(TODAY_DAY)까지 이미 결제일이 지난 항목만
 * "지출"로 세고, 나머지는 "예정"에 남겨 둔다(동일 데이터 정합 — 항목별 day 에서 그대로 계산). */
export const FIXED_PAID_TOTAL = FIXED_EXPENSES.filter((item) => item.day <= TODAY_DAY).reduce(
  (sum, item) => sum + item.amount,
  0,
);
/* 아직 안 나간 금액 — "예정 총액"을 그대로 반복해 보여주는 대신 남은 금액을 보여줄 때 쓴다 */
export const FIXED_REMAINING_TOTAL = FIXED_MONTHLY_TOTAL - FIXED_PAID_TOTAL;
/* "91% 지출 완료" 같은 진행률 헤드라인에 쓰는 값 — 진행률 바 폭과 항상 같은 계산식이다 */
export const FIXED_PAID_PERCENT = Math.min(100, Math.round((FIXED_PAID_TOTAL / FIXED_MONTHLY_TOTAL) * 100));
