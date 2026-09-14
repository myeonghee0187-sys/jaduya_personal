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
