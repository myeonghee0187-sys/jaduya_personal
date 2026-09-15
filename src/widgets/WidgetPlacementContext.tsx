import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  EMPTY_PLACEMENT,
  addWidget as placeWidget,
  canPlaceWidget,
  getPlacedAt as readAt,
  removeWidgetAt,
  removeWidgets,
  withoutWidget,
} from '../utils/placement';
import type { PlacedWidget, PlacementResult, PlacementState, SlotRef } from '../utils/placement';
import type { WidgetSize } from '../types';

/* Home '내 생활' 캔버스의 위젯 배치 상태 — Home 화면과 위젯 관리 화면(WidgetPage)이
 * 같은 값을 봐야 해서 화면 위에서 한 번만 만든다(BookmarkProvider/MyMenuProvider와 같은
 * 패턴 — in-memory, localStorage 없음. 새로고침하면 아래 기본값으로 되돌아간다).
 *
 * 배치 규칙 자체(어디에 몇 개까지, 뭘 빼야 하는지)는 utils/placement.ts 에만 있고
 * 여기서는 그 함수들을 호출해 상태만 갈아끼운다. */

/** 데모 기본 배치 — 실제 서비스라면 persona/사용자별로 다르겠지만, 지금은 위젯 관리
 * 화면의 편집/삭제/공간 부족 플로우를 바로 확인할 수 있도록 1번째 줄 M 2개 + 2번째 줄
 * S 2개를 채워서 시작한다. */
const DEFAULT_PLACEMENT: PlacementState = {
  large: null,
  medium: [
    { widgetId: 'living-cost', size: 'medium' },
    { widgetId: 'spend-analysis', size: 'medium' },
  ],
  small: [
    { widgetId: 'life-check', size: 'small' },
    { widgetId: 'today-benefit', size: 'small' },
  ],
};

interface UndoSnapshot {
  state: PlacementState;
}

interface WidgetPlacementValue {
  state: PlacementState;
  /** 이 위젯을 이 크기로 지금 놓을 수 있는지 — 상태를 바꾸지 않는 순수 조회.
   * 이미 놓여 있는 위젯이면 그 자리부터 뺀 기준으로 확인해서, 같은 자리에 그대로
   * "다시 놓는" 경우 자기 자신과 공간을 다투는 헛된 공간 부족으로 보이지 않는다. */
  checkPlacement: (widgetId: string, size: WidgetSize) => PlacementResult;
  /** 공간이 있으면 놓고 ok:true, 없으면 놓지 않고 conflict 정보를 담아 ok:false 를 준다.
   * 성공하면 직전 상태를 기억해 undoLastChange() 로 되돌릴 수 있다. */
  addWidget: (widgetId: string, size: WidgetSize) => PlacementResult;
  /** 자리 하나를 비운다 — 직전 상태를 기억해 undoLastChange() 로 되돌릴 수 있다 */
  removeAt: (ref: SlotRef) => void;
  /** 여러 자리를 한 번에 비운다(배치 공간 만들기) — 이 동작은 되돌리기 대상이 아니다 */
  removeMany: (refs: SlotRef[]) => void;
  /** 배치 공간 만들기 시트에서 "선택한 위젯 N개 제거" 이후 바로 새 위젯까지 놓는다.
   * 이 동작도 직전 상태를 기억해 undoLastChange() 로 되돌릴 수 있다. */
  resolveConflictAndAdd: (widgetId: string, size: WidgetSize, refs: SlotRef[]) => void;
  /** addWidget/removeAt/resolveConflictAndAdd 직후에만 값이 있다 —
   * "실행 취소" 토스트 표시 여부에 쓴다(추가/삭제/공간 만들기 공통) */
  undoSnapshot: UndoSnapshot | null;
  undoLastChange: () => void;
  dismissUndo: () => void;
  getPlacedAt: (ref: SlotRef) => PlacedWidget | null;
}

const WidgetPlacementContext = createContext<WidgetPlacementValue | null>(null);

export function WidgetPlacementProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlacementState>(DEFAULT_PLACEMENT);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);

  const checkPlacement = useCallback(
    (widgetId: string, size: WidgetSize): PlacementResult => canPlaceWidget(withoutWidget(state, widgetId), size),
    [state],
  );

  const addWidget = useCallback(
    (widgetId: string, size: WidgetSize): PlacementResult => {
      const baseState = withoutWidget(state, widgetId);
      const result = canPlaceWidget(baseState, size);
      if (result.ok) {
        setUndoSnapshot({ state });
        setState(placeWidget(baseState, widgetId, size));
      }
      return result;
    },
    [state],
  );

  const removeAt = useCallback(
    (ref: SlotRef) => {
      const current = readAt(state, ref);
      if (!current) return;
      setUndoSnapshot({ state });
      setState((prev) => removeWidgetAt(prev, ref));
    },
    [state],
  );

  const removeMany = useCallback((refs: SlotRef[]) => {
    setState((prev) => removeWidgets(prev, refs));
  }, []);

  const resolveConflictAndAdd = useCallback(
    (widgetId: string, size: WidgetSize, refs: SlotRef[]) => {
      setUndoSnapshot({ state });
      setState(placeWidget(removeWidgets(withoutWidget(state, widgetId), refs), widgetId, size));
    },
    [state],
  );

  const undoLastChange = useCallback(() => {
    if (!undoSnapshot) return;
    setState(undoSnapshot.state);
    setUndoSnapshot(null);
  }, [undoSnapshot]);

  const dismissUndo = useCallback(() => setUndoSnapshot(null), []);

  const getPlacedAt = useCallback((ref: SlotRef) => readAt(state, ref), [state]);

  const value = useMemo<WidgetPlacementValue>(
    () => ({
      state,
      checkPlacement,
      addWidget,
      removeAt,
      removeMany,
      resolveConflictAndAdd,
      undoSnapshot,
      undoLastChange,
      dismissUndo,
      getPlacedAt,
    }),
    [
      state,
      checkPlacement,
      addWidget,
      removeAt,
      removeMany,
      resolveConflictAndAdd,
      undoSnapshot,
      undoLastChange,
      dismissUndo,
      getPlacedAt,
    ],
  );

  return <WidgetPlacementContext.Provider value={value}>{children}</WidgetPlacementContext.Provider>;
}

export function useWidgetPlacement() {
  const value = useContext(WidgetPlacementContext);
  if (!value) throw new Error('useWidgetPlacement 은 WidgetPlacementProvider 안에서만 쓸 수 있다');
  return value;
}

export { EMPTY_PLACEMENT };
