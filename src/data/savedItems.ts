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
  /** 원본 콘텐츠(커뮤니티 게시글·혜택 등)의 실제 id — SavedPage 가 이 id 로 원본을
   * 다시 찾아 상세로 이동하거나 북마크를 해제한다. */
  id: string;
  category: SavedCategory;
  title: string;
  description: string;
  /** 저장 시각을 따로 기록하지 않아, 원본 콘텐츠 자체의 날짜성 문구(작성 시각·마감일 등)를
   * 그대로 보여준다 — "YYYY.MM.DD 저장" 형식이 아닐 수 있다. */
  savedAt: string;
  /** 이미 완성된 절대경로(예: resolveCommunityPostImage() 결과) — 원본 콘텐츠마다
   * 이미지가 저장된 폴더가 달라서(커뮤니티는 assets/img/community, 혜택은 아직 없음
   * 등) 파일명만 받지 않고 각 sourceType 이 자기 방식대로 완성한 URL을 그대로 받는다.
   * 없으면(원본에 실제 이미지가 없으면) icon 으로 대체한다. */
  thumbnail?: string;
  /** public/assets/icon/ 아래 파일명 — thumbnail 이 없는 항목의 대체 이미지 */
  icon: string;
}
