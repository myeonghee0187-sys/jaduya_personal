/** Home 위에 상태로만 열리는 레이어 */
export type LayerName = 'gnb' | 'menuEdit' | 'addWidget';

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

/** 위젯 추가 시트가 다루는 위젯 */
export interface WidgetDef {
  id: string;
  /** 검색 대상이 되는 표시 이름 */
  name: string;
  size: WidgetSize;
}

/** history 에 저장하는 레이어 스택 */
export interface LayerHistoryState {
  jaduyaLayers?: LayerName[];
}
