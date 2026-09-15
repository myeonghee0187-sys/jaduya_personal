import type { WidgetSize } from '../types';

/* Placement 로직 — Home '내 생활' 캔버스 배치 규칙만 다루는 순수 함수 모음.
 *
 * 캔버스는 항상 2줄이다.
 *   1번째 줄(top)   — Medium 최대 2개, 또는 Large 1개가 단독으로 그 줄을 통째로 쓴다.
 *   2번째 줄(bottom) — Small 최대 2개.
 * Large 와 Medium 은 같은 줄을 공유하는 배타 관계라 동시에 있을 수 없다.
 *
 * UI(WidgetPage/WidgetSlot 등)는 이 파일의 함수만 호출하고, 배치 규칙을 직접 계산하지 않는다.
 */

export interface PlacedWidget {
  widgetId: string;
  size: WidgetSize;
}

export interface PlacementState {
  /** 1번째 줄이 Large 하나로 채워져 있으면 그 위젯, 아니면 null */
  large: PlacedWidget | null;
  /** 1번째 줄 — Large 가 없을 때만 유효. 항상 길이 2 */
  medium: [PlacedWidget | null, PlacedWidget | null];
  /** 2번째 줄. 항상 길이 2 */
  small: [PlacedWidget | null, PlacedWidget | null];
}

export const EMPTY_PLACEMENT: PlacementState = {
  large: null,
  medium: [null, null],
  small: [null, null],
};

/** 배치된 위젯 하나를 가리키는 참조 — 삭제/변경 대상 지정에 쓴다 */
export type SlotRef =
  | { row: 'large' }
  | { row: 'medium'; index: 0 | 1 }
  | { row: 'small'; index: 0 | 1 };

export interface PlacementConflict {
  /** 비워야 하는 줄 */
  row: 'medium' | 'small';
  /** 지금 그 줄에서 실제로 위젯이 있는 자리 — 사용자가 이 중에서 골라 뺀다 */
  occupied: SlotRef[];
  /** 새 위젯을 놓으려면 이 중 몇 개를 반드시 빼야 하는지 */
  requiredRemovalCount: number;
}

export interface PlacementResult {
  ok: boolean;
  reason?: string;
  conflict?: PlacementConflict;
}

/** 위젯 크기가 같은 줄에서 차지하는 칸 수 — Large 는 Medium 두 자리를 통째로 쓴다 */
export function getRequiredUnits(size: WidgetSize): number {
  return size === 'large' ? 2 : 1;
}

function mediumOccupiedRefs(state: PlacementState): SlotRef[] {
  const refs: SlotRef[] = [];
  state.medium.forEach((slot, i) => {
    if (slot) refs.push({ row: 'medium', index: i as 0 | 1 });
  });
  return refs;
}

function smallOccupiedRefs(state: PlacementState): SlotRef[] {
  const refs: SlotRef[] = [];
  state.small.forEach((slot, i) => {
    if (slot) refs.push({ row: 'small', index: i as 0 | 1 });
  });
  return refs;
}

/** 지금 이 크기를 추가할 수 있는지 — 안 되면 이유와, 해결 가능하면 conflict 정보까지 준다 */
export function canPlaceWidget(state: PlacementState, size: WidgetSize): PlacementResult {
  if (size === 'small') {
    const occupied = smallOccupiedRefs(state);
    if (occupied.length < 2) return { ok: true };
    return {
      ok: false,
      reason: '배치할 공간이 부족해요.',
      conflict: { row: 'small', occupied, requiredRemovalCount: 1 },
    };
  }

  if (size === 'medium') {
    if (state.large) {
      return {
        ok: false,
        reason: '큰 위젯이 있으면 1번째 줄에 다른 위젯을 담을 수 없어요.',
        conflict: { row: 'medium', occupied: [{ row: 'large' }], requiredRemovalCount: 1 },
      };
    }
    const occupied = mediumOccupiedRefs(state);
    if (occupied.length < 2) return { ok: true };
    return {
      ok: false,
      reason: '1번째 줄에는 위젯을 2개까지 담을 수 있어요.',
      conflict: { row: 'medium', occupied, requiredRemovalCount: 1 },
    };
  }

  /* large */
  if (state.large) {
    return {
      ok: false,
      reason: '큰 위젯은 한 번에 하나만 담을 수 있어요.',
      conflict: { row: 'medium', occupied: [{ row: 'large' }], requiredRemovalCount: 1 },
    };
  }
  const occupied = mediumOccupiedRefs(state);
  if (occupied.length === 0) return { ok: true };
  return {
    ok: false,
    reason: `L 위젯은 M 위젯 ${occupied.length}개의 공간이 필요해요.`,
    conflict: { row: 'medium', occupied, requiredRemovalCount: occupied.length },
  };
}

function firstEmptyIndex(pair: [PlacedWidget | null, PlacedWidget | null]): 0 | 1 | undefined {
  if (!pair[0]) return 0;
  if (!pair[1]) return 1;
  return undefined;
}

/** 공간이 있다는 전제 하에 위젯을 놓는다 — 호출 전에 canPlaceWidget 으로 반드시 확인한다 */
export function addWidget(state: PlacementState, widgetId: string, size: WidgetSize): PlacementState {
  const placed: PlacedWidget = { widgetId, size };

  if (size === 'large') {
    return { large: placed, medium: [null, null], small: state.small };
  }
  if (size === 'medium') {
    const index = firstEmptyIndex(state.medium);
    if (index === undefined) return state;
    const medium: [PlacedWidget | null, PlacedWidget | null] = [...state.medium];
    medium[index] = placed;
    return { ...state, medium };
  }
  const index = firstEmptyIndex(state.small);
  if (index === undefined) return state;
  const small: [PlacedWidget | null, PlacedWidget | null] = [...state.small];
  small[index] = placed;
  return { ...state, small };
}

/** ref 가 가리키는 자리 하나를 비운다 */
export function removeWidgetAt(state: PlacementState, ref: SlotRef): PlacementState {
  if (ref.row === 'large') return { ...state, large: null };
  if (ref.row === 'medium') {
    const medium: [PlacedWidget | null, PlacedWidget | null] = [...state.medium];
    medium[ref.index] = null;
    return { ...state, medium };
  }
  const small: [PlacedWidget | null, PlacedWidget | null] = [...state.small];
  small[ref.index] = null;
  return { ...state, small };
}

/** 여러 자리를 한 번에 비운다 — 배치 공간 만들기 시트에서 선택한 항목 일괄 제거 */
export function removeWidgets(state: PlacementState, refs: SlotRef[]): PlacementState {
  return refs.reduce((acc, ref) => removeWidgetAt(acc, ref), state);
}

/** 지금 배치돼 있는 위젯을 전부 나열한다 — 편집 모드, 위젯 추가 화면의 "이미 추가됨" 표시 등에 쓴다 */
export function listPlaced(
  state: PlacementState,
): { ref: SlotRef; widgetId: string; size: WidgetSize }[] {
  const list: { ref: SlotRef; widgetId: string; size: WidgetSize }[] = [];
  if (state.large) list.push({ ref: { row: 'large' }, widgetId: state.large.widgetId, size: 'large' });
  state.medium.forEach((slot, i) => {
    if (slot) list.push({ ref: { row: 'medium', index: i as 0 | 1 }, widgetId: slot.widgetId, size: slot.size });
  });
  state.small.forEach((slot, i) => {
    if (slot) list.push({ ref: { row: 'small', index: i as 0 | 1 }, widgetId: slot.widgetId, size: slot.size });
  });
  return list;
}

/** widgetId 가 지금 놓여 있는 자리를 비운 상태를 새로 만든다 — 없으면 그대로 돌려준다.
 * "이미 추가된 위젯"을 다시 고를 때(크기 변경 등) 자기 자신과 공간을 다투지 않도록,
 * 배치 가능 여부를 확인하기 전에 항상 이 함수로 자기 자리부터 뺀 상태를 기준으로 삼는다. */
export function withoutWidget(state: PlacementState, widgetId: string): PlacementState {
  const found = findWidgetSlot(state, widgetId);
  return found ? removeWidgetAt(state, found.ref) : state;
}

/** 이 위젯(concept id)이 지금 어디에 놓여 있는지 — 없으면 undefined */
export function findWidgetSlot(
  state: PlacementState,
  widgetId: string,
): { ref: SlotRef; size: WidgetSize } | undefined {
  const found = listPlaced(state).find((p) => p.widgetId === widgetId);
  return found ? { ref: found.ref, size: found.size } : undefined;
}

/** ref 가 가리키는 자리에 지금 뭐가 놓여 있는지 — 없으면 null. 순수 조회. */
export function getPlacedAt(state: PlacementState, ref: SlotRef): PlacedWidget | null {
  if (ref.row === 'large') return state.large;
  if (ref.row === 'medium') return state.medium[ref.index];
  return state.small[ref.index];
}

export function slotRefEquals(a: SlotRef, b: SlotRef): boolean {
  if (a.row !== b.row) return false;
  if (a.row === 'large' || b.row === 'large') return true;
  return (a as { index: number }).index === (b as { index: number }).index;
}
