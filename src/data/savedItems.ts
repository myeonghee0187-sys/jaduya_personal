/* 저장한 정보 데이터 — Figma saved_list (1565:6953)
 *
 * 화면은 이 배열만 렌더한다. 카드 6개를 화면에 박아두지 않는다.
 * 개수 표시(총 N개)와 필터도 전부 이 배열에서 계산한다.
 */

/** 저장 카테고리 — IA 대분류를 그대로 쓴다 */
export type SavedCategory = '생활' | '돈 관리' | '음식' | '혜택' | '커뮤니티';

/** 필터 순서 — '전체' 가 기본 선택값이다 */
export const SAVED_FILTERS = ['전체', '생활', '돈 관리', '음식', '혜택', '커뮤니티'] as const;
export type SavedFilter = (typeof SAVED_FILTERS)[number];

/** 카테고리 칩 색 — Figma 토큰 (Point/Secondary/Oat Cream/Roasted Plum 1.5) */
export const SAVED_CHIP_COLOR: Record<SavedCategory, string> = {
  생활: '#e2e8bc',
  '돈 관리': '#fef5d6',
  음식: '#f6f0e6',
  혜택: '#f0d7d7',
  커뮤니티: '#eed6c4',
};

export interface SavedItem {
  id: number;
  category: SavedCategory;
  title: string;
  description: string;
  /** YYYY.MM.DD — 최신 저장순 정렬 기준 */
  savedAt: string;
  /** public/assets/img/thumb/ 아래 파일명. 없으면 icon 으로 대체한다 */
  thumbnail?: string;
  /** public/assets/icon/ 아래 파일명 — thumbnail 이 없는 항목의 대체 이미지 */
  icon: string;
}

/* 앞 6개는 Figma 카드 그대로다. 나머지는 필터(혜택 포함)와 총 12개 표시를 위해 같은 규칙으로 채웠다. */
export const SAVED_ITEMS: SavedItem[] = [
  {
    id: 1,
    category: '생활',
    title: '분리수거 헷갈리는 품목 정리',
    description: '플라스틱·비닐·스티로폼 분류 기준',
    savedAt: '2026.02.18',
    thumbnail: 'thumb-recycle.webp',
    icon: 'menu-recycle.svg',
  },
  {
    id: 2,
    category: '돈 관리',
    title: '전기요금 납부 방법 & 자동이체 신청',
    description: '놓치지 않게 미리 준비해요',
    savedAt: '2026.02.14',
    thumbnail: 'thumb-electricity.webp',
    icon: 'menu-card.svg',
  },
  {
    id: 3,
    category: '음식',
    title: '냉장고 식재료 오래 보관하는 팁',
    description: '식재료별 보관 위치와 오래 두는 방법',
    savedAt: '2026.02.10',
    thumbnail: 'thumb-fridge.png',
    icon: 'menu-food.svg',
  },
  {
    id: 4,
    category: '생활',
    title: '욕실 곰팡이 5분 만에 없애는 관리',
    description: '초보도 쉽게 따라 하는 욕실 청소 팁',
    savedAt: '2026.02.05',
    thumbnail: 'thumb-bathroom.png',
    icon: 'menu-broom.svg',
  },
  {
    id: 5,
    category: '커뮤니티',
    title: '자취 3년차가 추천하는 가성비 수납 아이템 7',
    description: '직접 써보고 만족한 자취 필수템',
    savedAt: '2026.01.28',
    thumbnail: 'thumb-storage.png',
    icon: 'menu-tip.svg',
  },
  {
    id: 6,
    category: '돈 관리',
    title: '월세 세액공제 신청 서류 총정리',
    description: '놓치기 쉬운 공제 조건과 준비서류 정리',
    savedAt: '2026.01.20',
    thumbnail: 'thumb-tax.png',
    icon: 'menu-receipt.svg',
  },
  {
    id: 7,
    category: '혜택',
    title: '청년 월세 특별지원 신청 방법',
    description: '월 최대 20만원 · 12개월 지원',
    savedAt: '2026.01.15',
    icon: 'menu-gift.svg',
  },
  {
    id: 8,
    category: '혜택',
    title: '청년 교통비 환급 신청 정리',
    description: '대중교통 이용액 일부를 돌려받아요',
    savedAt: '2026.01.09',
    icon: 'menu-gift.svg',
  },
  {
    id: 9,
    category: '음식',
    title: '1인분 밀프렙 3일치 만들기',
    description: '주말 한 번에 만들어 평일에 나눠 먹기',
    savedAt: '2026.01.06',
    icon: 'menu-food.svg',
  },
  {
    id: 10,
    category: '생활',
    title: '겨울철 결로·곰팡이 막는 환기 습관',
    description: '하루 두 번 10분이면 충분해요',
    savedAt: '2025.12.28',
    icon: 'menu-checklist.svg',
  },
  {
    id: 11,
    category: '커뮤니티',
    title: '자취 첫 달에 사길 잘한 물건 모음',
    description: '자취 꿀팁 · 댓글 24',
    savedAt: '2025.12.21',
    icon: 'menu-board.svg',
  },
  {
    id: 12,
    category: '돈 관리',
    title: '구독 서비스 정리하고 월 3만원 줄이기',
    description: '안 쓰는 구독부터 확인해요',
    savedAt: '2025.12.14',
    icon: 'menu-wallet.svg',
  },
];

/** 최신 저장순 — savedAt 은 YYYY.MM.DD 라 문자열 비교로 정렬된다 */
export function sortByLatest(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
