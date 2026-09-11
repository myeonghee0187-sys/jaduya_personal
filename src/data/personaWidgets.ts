import type { Persona } from '../auth/mockUsers';
import type { WidgetSize } from '../types';

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

/* 슬롯 id → 위젯 추가 시트(WIDGET_CATALOG)의 동일 위젯 id.
 * 같은 위젯이 크기만 다른 경우가 있어 매핑해 둔다. */
const LAYOUT_TO_CATALOG: Partial<Record<MediumWidgetId | SmallWidgetId, string>> = {
  'living-cost': 'living-cost',
  rent: 'rent',
  fridge: 'fridge',
  'fridge-s': 'fridge',
  todo: 'todo-m',
  'todo-s': 'todo-s',
  'clean-s': 'clean-s',
  benefit: 'benefit',
  deposit: 'deposit',
  'fixed-cost': 'fixed-cost',
  vet: 'vet',
  'pet-cost': 'pet-cost',
  'pet-supply': 'pet-supply',
};

/** 슬롯 id → 실제 배치된 크기(medium/small)까지 담은 카탈로그 항목.
 *  위젯 추가 시트의 '현재 사용 중인 위젯'이 Home 캔버스와 같은 크기로 보이도록 쓴다. */
export function layoutCatalogEntries(
  layout: PersonaWidgetLayout,
): { id: string; size: WidgetSize }[] {
  const entries: { id: string; size: WidgetSize }[] = [];
  layout.medium.forEach((slot) => {
    const id = LAYOUT_TO_CATALOG[slot];
    if (id) entries.push({ id, size: 'medium' });
  });
  layout.small.forEach((slot) => {
    const id = LAYOUT_TO_CATALOG[slot];
    if (id) entries.push({ id, size: 'small' });
  });
  return entries;
}

/** 지금 draft/저장된 위젯 목록(catalog id)을 기준으로, persona 고정 슬롯 중
 *  실제로 켜져 있는 것만 남긴다 — 위젯 추가 시트에서 끄면 Home에서도 그 자리가 사라지고,
 *  다시 켜면 원래 자리에 돌아온다. 총 개수는 항상 widgets.length 이하로 유지된다. */
export function activeLayoutSlots(
  layout: PersonaWidgetLayout,
  widgets: string[],
): { medium: MediumWidgetId[]; small: SmallWidgetId[] } {
  const isActive = (slotId: MediumWidgetId | SmallWidgetId) => {
    const catalogId = LAYOUT_TO_CATALOG[slotId];
    return catalogId ? widgets.includes(catalogId) : true;
  };
  return {
    medium: layout.medium.filter(isActive),
    small: layout.small.filter(isActive),
  };
}

/** 캔버스 슬롯이 이미 보여주는 위젯 id (슬롯 id + 카탈로그 동치 id).
 *  추가 행에서 같은 위젯이 중복 노출되는 걸 막는 데 쓴다. */
export function layoutWidgetIds(layout: PersonaWidgetLayout): string[] {
  const slots = [...layout.medium, ...layout.small];
  const mapped = slots
    .map((id) => LAYOUT_TO_CATALOG[id])
    .filter((id): id is string => Boolean(id));
  return [...new Set([...slots, ...mapped])];
}

/** 위젯 추가 시트의 초기 선택 상태 — 카탈로그에 있는 위젯만 */
export function layoutCatalogIds(layout: PersonaWidgetLayout): string[] {
  const ids = [...layout.medium, ...layout.small]
    .map((id) => LAYOUT_TO_CATALOG[id])
    .filter((id): id is string => Boolean(id));
  return [...new Set(ids)];
}
