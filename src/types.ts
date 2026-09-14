/** Home 위에 상태로만 열리는 레이어 */
export type LayerName = 'gnb' | 'menuEdit';

/** Bottom Sheet 상태 (home_1 / home_2) */
export type SheetState = 'peek' | 'expanded';

/** GNB 내 메뉴 바로가기 항목 */
export interface MenuItem {
  id: string;
  name: string;
  /** assets/icon/ 아래 파일명 */
  icon: string;
}

/** 위젯 카드 크기 — Figma 규격 그대로 */
export type WidgetSize = 'small' | 'medium' | 'large';

/** 위젯이 속한 IA 카테고리 — 위젯 추가 시트의 카테고리 아코디언 분류 기준 */
export type WidgetCategory = '생활' | '돈 관리' | '혜택' | '커뮤니티' | '마이';

/** 위젯 추가 시트가 다루는 위젯 */
export interface WidgetDef {
  id: string;
  /** 검색 대상이 되는 표시 이름 */
  name: string;
  size: WidgetSize;
  category: WidgetCategory;
}

/** history 에 저장하는 레이어 스택 */
export interface LayerHistoryState {
  jaduyaLayers?: LayerName[];
}

/** Home 상단 인사 영역(Hero 위)의 persona 별 문구 */
export interface HomeHeroContent {
  /** 상단 상태 한 줄 (예: 입주까지 D-12) */
  situation: string;
  /** 인사 두 번째 줄. 첫 줄은 "{이름}님," 로 고정 */
  headline: string;
  /** 다음 행동 한 줄 */
  sub: string;
}

/** TipBox 가 보여주는 팁 한 건 */
export interface HomeTip {
  title: string;
  detail: string;
}

/** persona 별 Home 콘텐츠 묶음 */
export interface HomePersonaContent {
  hero: HomeHeroContent;
  tips: HomeTip[];
}
