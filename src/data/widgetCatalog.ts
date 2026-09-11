import type { WidgetDef, WidgetSize } from '../types';

/** 위젯 추가 시트가 다루는 위젯 — Figma add_widget (1693:6166) 기준
 *
 * 카드 내용은 위젯마다 형태가 달라 WidgetPickCard 안에서 id 로 분기해 렌더링한다.
 * 여기서는 선택/검색/크기에 필요한 메타데이터만 갖는다. */
export const WIDGET_CATALOG: WidgetDef[] = [
  /* 현재 사용 중인 위젯 */
  { id: 'living-cost', name: '생활비', size: 'medium', category: '돈 관리' },
  { id: 'fridge', name: '냉장고', size: 'medium', category: '생활' },
  { id: 'fridge-s', name: '냉장고', size: 'small', category: '생활' },
  { id: 'rent', name: '월세·관리비', size: 'medium', category: '돈 관리' },
  /* 추천 위젯 */
  { id: 'spend-analysis', name: '소비 분석', size: 'large', category: '돈 관리' },
  { id: 'benefit', name: '혜택', size: 'medium', category: '혜택' },
  { id: 'todo-s', name: '오늘 할 일', size: 'small', category: '생활' },
  { id: 'todo-m', name: '오늘 할 일', size: 'medium', category: '생활' },
  { id: 'clean-s', name: '청소', size: 'small', category: '생활' },
  { id: 'clean-m', name: '다음 청소', size: 'medium', category: '생활' },
  /* Figma "JADUYA Home Widget Library"(1465:4192)엔 있지만 시트 카탈로그엔 없던 위젯 */
  { id: 'budget-s', name: '예산', size: 'small', category: '돈 관리' },
  { id: 'fixed-cost', name: '고정지출', size: 'small', category: '돈 관리' },
  { id: 'deposit', name: '보증금 안전', size: 'medium', category: '생활' },
  { id: 'neighborhood', name: '동네 소식', size: 'medium', category: '커뮤니티' },
  { id: 'popular-post', name: '인기 글', size: 'medium', category: '커뮤니티' },
  { id: 'mate', name: '자두메이트', size: 'medium', category: '마이' },
  { id: 'saved-content', name: '저장한 콘텐츠', size: 'medium', category: '마이' },
  /* pet persona 전용으로만 쓰이던 위젯 — 위젯 추가 시트에서도 켜고 끌 수 있도록 등록 */
  { id: 'vet', name: '병원 일정', size: 'medium', category: '생활' },
  { id: 'pet-cost', name: '반려 지출', size: 'small', category: '돈 관리' },
  { id: 'pet-supply', name: '사료·용품', size: 'small', category: '생활' },
];

/** Home '내 생활'에 기본으로 올라가 있는 위젯 */
export const DEFAULT_WIDGETS = ['living-cost', 'fridge', 'rent'];

/** Home 마크업에 원래부터 존재하는 위젯 (정적 버전의 data-widget-id 와 동일)
 *  이 셋은 숨김/노출로 처리하고, 나머지는 새 카드로 추가한다. */
export const HOME_NATIVE_WIDGETS = ['living-cost', 'rent', 'fridge'];

export const MAX_WIDGET = 4;

/** 위젯이 캔버스에서 차지하는 칸 수 — Large(342×114)는 Medium 2개와 같은 폭을 쓰므로 2칸이다.
 *  '4개'는 개수가 아니라 이 칸 수의 합으로 판단한다. */
export function widgetWeight(size: WidgetSize): number {
  return size === 'large' ? 2 : 1;
}
