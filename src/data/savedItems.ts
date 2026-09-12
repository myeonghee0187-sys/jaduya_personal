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

/* 아직 실제 저장 기능이 없어 목록은 비어 있다 — 화면은 이 배열만 렌더하므로
 * 지금은 Empty State 가 그려진다. 커뮤니티 북마크 등 실제 저장 데이터를 연결할 때
 * 이 배열을 채우거나(또는 같은 SavedItem[] 을 돌려주는 함수로 바꿔) 넘기면 된다.
 * 화면에 예시 카드를 박아두지 않는다. */
export const SAVED_ITEMS: SavedItem[] = [];

/** 최신 저장순 — savedAt 은 YYYY.MM.DD 라 문자열 비교로 정렬된다 */
export function sortByLatest(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
