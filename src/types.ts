/** Bottom Sheet 상태 (home_1 / home_2) */
export type SheetState = 'peek' | 'expanded';

/** 위젯 카드 크기 — Figma 규격 그대로 */
export type WidgetSize = 'small' | 'medium' | 'large';

/** 위젯이 속한 IA 카테고리 — 위젯 관리 화면의 카테고리 필터 분류 기준 */
export type WidgetCategory = '생활' | '돈 관리' | '혜택' | '커뮤니티' | '마이';

/** Home 상단 인사 영역(Hero 위)의 persona 별 문구 */
export interface HomeHeroContent {
  /** 상단 상태 한 줄 (예: 입주까지 D-12) */
  situation: string;
  /** 인사 두 번째 줄. 첫 줄은 "{이름}님," 로 고정 */
  headline: string;
  /** 다음 행동 한 줄 */
  sub: string;
}

/** persona 별 Home 콘텐츠 묶음 */
export interface HomePersonaContent {
  hero: HomeHeroContent;
}
