import type { WidgetDef } from '../types';

/** 위젯 추가 시트가 다루는 위젯 — Figma add_widget (1693:6166) 기준
 *
 * 카드 내용은 위젯마다 형태가 달라 WidgetPickCard 안에서 id 로 분기해 렌더링한다.
 * 여기서는 선택/검색/크기에 필요한 메타데이터만 갖는다. */
export const WIDGET_CATALOG: WidgetDef[] = [
  /* 현재 사용 중인 위젯 */
  { id: 'living-cost', name: '생활비', size: 'medium' },
  { id: 'fridge', name: '냉장고', size: 'medium' },
  { id: 'rent', name: '월세·관리비', size: 'medium' },
  /* 추천 위젯 */
  { id: 'spend-analysis', name: '소비 분석', size: 'large' },
  { id: 'benefit', name: '혜택', size: 'medium' },
  { id: 'todo-s', name: '오늘 할 일', size: 'small' },
  { id: 'todo-m', name: '오늘 할 일', size: 'medium' },
  { id: 'clean-s', name: '청소', size: 'small' },
  { id: 'clean-m', name: '다음 청소', size: 'medium' },
];

/** Home '내 생활'에 기본으로 올라가 있는 위젯 */
export const DEFAULT_WIDGETS = ['living-cost', 'fridge', 'rent'];

/** Home 마크업에 원래부터 존재하는 위젯 (정적 버전의 data-widget-id 와 동일)
 *  이 셋은 숨김/노출로 처리하고, 나머지는 새 카드로 추가한다. */
export const HOME_NATIVE_WIDGETS = ['living-cost', 'rent', 'fridge'];

export const MAX_WIDGET = 4;
