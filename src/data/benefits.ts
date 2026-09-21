export interface BenefitDetail {
  id: string;
  title: string;
  status: string;
  deadline: string;
  amountLabel: string;
  amount: string;
  frequency?: string;
  organizer: string;
  description: string;
  eligibility: string;
  matchCount: number;
  documents: string[];
  process: string[];
  notices: string[];
  applyUrl?: string;
  /** Figma 또는 공식 데이터가 없어 임시 안내값을 쓰는 항목이 있는지 표시한다. */
  isMockDetail?: boolean;
}

export const BENEFITS: BenefitDetail[] = [
  {
    id: 'seongnam-pet-medical',
    title: '성남시 반려동물 진료비 지원',
    status: '신청 가능',
    deadline: '마감 D-30',
    amountLabel: '최대',
    amount: '200,000원',
    frequency: '연 1회',
    organizer: '성남시 · 경기도',
    description:
      '반려동물 예방접종 · 중성화 · 기본 진료비를 연 1회, 최대 20만 원까지 지원해요.',
    eligibility: '성남시에 주소를 둔 시민 중 동물등록을 마친 반려동물 보호자',
    matchCount: 4,
    documents: ['동물등록증', '진료비 영수증', '통장 사본'],
    process: [
      '지정 동물병원에서 진료받기',
      '동물등록증 · 영수증 준비',
      '온라인 신청서 제출',
      '심사 결과 · 지급일 확인',
    ],
    notices: ['지정 동물병원 진료 내역만 인정돼요.', '예산 소진 시 조기 마감될 수 있어요.'],
  },
  {
    id: 'gyeonggi-youth-points',
    title: '경기도 청년 복지포인트',
    status: '신청 가능',
    deadline: '상세 일정 확인 필요',
    amountLabel: '지원 금액',
    amount: '공식 공고 확인 필요',
    organizer: '경기도',
    description: '성남시 거주 · 중소기업 재직 중인 31세 조건에 맞아요.',
    eligibility: '경기 거주 만 19-39세 중소기업 재직 청년',
    matchCount: 4,
    documents: ['세부 제출 서류는 공식 공고 확인이 필요해요.'],
    process: ['세부 신청 절차는 공식 공고 확인이 필요해요.'],
    notices: ['지원 금액과 신청 일정은 공식 공고에서 확인해 주세요.'],
    isMockDetail: true,
  },
];

export const RECOMMENDED_BENEFIT_IDS = ['seongnam-pet-medical', 'gyeonggi-youth-points'] as const;

export function getBenefitById(id?: string): BenefitDetail | undefined {
  return BENEFITS.find((benefit) => benefit.id === id);
}

/* 혜택·복지 탭 — 전체 / 주거 / 생활비 / 반려동물 / 의료.
 * 각 AppPage 로 이동하는 독립 화면이다 (혜택은 IA상 메인 페이지가 아니라 money 하위 탭). */
export const BENEFIT_CATEGORIES = ['전체', '주거', '생활비', '반려동물', '의료'] as const;
export type BenefitCategory = (typeof BENEFIT_CATEGORIES)[number];

export const BENEFIT_CATEGORY_PAGES: Record<BenefitCategory, import('../navigation/routes').AppPage> = {
  전체: 'benefits',
  주거: 'benefits-housing',
  생활비: 'benefits-cost',
  반려동물: 'benefits-pet',
  의료: 'benefits-medical',
};

export interface BenefitListItem {
  id: string;
  category: BenefitCategory;
  title: string;
  region: string;
  /** 지역 옆 메타 문구 — "상시 접수" 또는 마감 D-day 등 */
  meta: string;
  /** 실제 신청인원 데이터가 없는 항목은 비워서 줄 자체를 생략한다. */
  applicants?: string;
  target: string;
}

/* 전체 탭의 기존 3건 + AI맞춤 추천에서 이미 쓰던 반려동물 지원(seongnam-pet-medical)을
 * 카테고리별로 분류해 재사용한다. '의료'는 실제 데이터가 없어 항목을 만들지 않는다. */
export const BENEFIT_LIST_ITEMS: BenefitListItem[] = [
  {
    id: 'youth-rent',
    category: '주거',
    title: '청년 월세 특별지원',
    region: '전국',
    meta: '상시 접수',
    applicants: '1240명',
    target: '만 19-34세 무주택 청년 1인 가구',
  },
  {
    id: 'youth-leap',
    category: '생활비',
    title: '청년도약계좌',
    region: '경기',
    meta: '상시 접수',
    applicants: '980명',
    target: '만 19-34세 근로 · 사업 소득 청년',
  },
  {
    id: 'gyeonggi-points',
    category: '생활비',
    title: '경기도 청년 복지포인트',
    region: '경기',
    meta: '상시 접수',
    applicants: '760명',
    target: '경기 거주 만 19-39세 중소기업 재직 청년',
  },
  {
    id: 'seongnam-pet-medical',
    category: '반려동물',
    title: '성남시 반려동물 진료비 지원',
    region: '성남시 · 경기도',
    meta: '마감 D-30',
    target: '성남시에 주소를 둔 시민 중 동물등록을 마친 반려동물 보호자',
  },
];

export function benefitListItemsByCategory(category: BenefitCategory): BenefitListItem[] {
  return BENEFIT_LIST_ITEMS.filter((item) => item.category === category);
}

/* 카테고리 탭(주거/생활비/반려동물/의료) 목록 정렬 — 커뮤니티 댓글 정렬과 같은
 * community-filter 드롭다운 디자인을 재사용한다. '추천순'은 BENEFIT_LIST_ITEMS 에 이미
 * 정리해 둔 큐레이션 순서를 그대로 쓴다. */
export const BENEFIT_SORTS = ['추천순', '인기순'] as const;
export type BenefitSort = (typeof BENEFIT_SORTS)[number];

/** "1,240명" 같은 신청 인원 문자열에서 숫자만 뽑는다 — 데이터가 없는 항목은 0명 취급해 뒤로 밀린다. */
export function benefitApplicantCount(item: BenefitListItem): number {
  if (!item.applicants) return 0;
  const digits = item.applicants.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

export function sortBenefitListItems(items: BenefitListItem[], sort: BenefitSort): BenefitListItem[] {
  if (sort === '인기순') return [...items].sort((a, b) => benefitApplicantCount(b) - benefitApplicantCount(a));
  return items;
}

/* 전체 탭 "또래가 많이 신청한 지원" 순위 — 이 탭에서만 순위 배지를 보여주므로
 * BenefitListItem 자체가 아니라 여기서만 순서를 관리한다. */
export const RANKED_BENEFIT_IDS = ['youth-rent', 'youth-leap', 'gyeonggi-points'] as const;
