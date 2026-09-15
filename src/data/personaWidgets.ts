import type { Persona } from '../auth/mockUsers';

/* persona 별 Home '내 생활' 위젯 조합.
 *
 * Figma "JADUYA Home Widget Library" (1465:4192) 의 규격을 그대로 쓴다.
 *   Home Widget Container 342 × 194
 *     = Medium(167 × 114) × 2  +  gap 8
 *     + Small(128.5 × 72) × 2 + Add Slot(69 × 72)
 * 조합만 persona 별로 바꾸고, 크기·padding·gap·radius 는 건드리지 않는다.
 * 새 위젯을 만들지 않고 라이브러리에 있는 종류만 골라 쓴다.
 */

/** 슬롯에 넣을 수 있는 위젯 id — Figma 라이브러리에 정의된 것만 */
export type MediumWidgetId =
  | 'living-cost' // 생활비
  | 'rent' // 월세·관리비
  | 'fridge' // 냉장고
  | 'todo' // 오늘 할 일
  | 'deposit' // 보증금 안전
  | 'benefit' // 혜택
  | 'vet'; // 병원 일정 (Medium 규격 재사용, 콘텐츠만 반려동물용)

export type SmallWidgetId =
  | 'fridge-s' // 냉장고
  | 'fixed-cost' // 고정지출
  | 'todo-s' // 오늘 할 일
  | 'clean-s' // 청소
  | 'budget-s' // 예산
  | 'pet-cost' // 반려 지출 (Small 규격 재사용)
  | 'pet-supply'; // 사료·용품 (Small 규격 재사용)

export interface PersonaWidgetLayout {
  /** Medium 167 × 114 — 항상 2개 */
  medium: [MediumWidgetId, MediumWidgetId];
  /** Small 128.5 × 72 — 항상 2개 (+ Add Slot 69 × 72) */
  small: [SmallWidgetId, SmallWidgetId];
}

export const PERSONA_WIDGETS: Record<Persona, PersonaWidgetLayout> = {
  /* 이서준 · 자취 초보 — 첫 자취 준비/정착 */
  beginner: {
    medium: ['deposit', 'todo'],
    small: ['fridge-s', 'clean-s'],
  },

  /* 김하린 · 직장인 월세 자취 — 생활비/고정비 관리
   * Figma Main home_2(2628:27073) 예시가 냉장고("우유 D-2") + 고정지출 순서라 그대로 맞춘다. */
  worker: {
    medium: ['living-cost', 'rent'],
    small: ['fridge-s', 'fixed-cost'],
  },

  /* 조아영 · 반려동물과 함께 자취 — 생활비 + 반려생활 */
  pet: {
    medium: ['living-cost', 'vet'],
    small: ['fridge-s', 'pet-cost'],
  },
};

export const DEFAULT_PERSONA_LAYOUT = PERSONA_WIDGETS.beginner;
