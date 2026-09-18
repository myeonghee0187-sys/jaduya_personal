import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Persona } from '../auth/mockUsers';
import { DEFAULT_PERSONA } from '../data/personaHome';
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
 * 같은 값을 봐야 해서 화면 위에서 한 번만 만든다(BookmarkProvider와 같은
 * 패턴 — in-memory, localStorage 없음. 새로고침하면 아래 기본값으로 되돌아간다).
 *
 * 배치 규칙 자체(어디에 몇 개까지, 뭘 빼야 하는지)는 utils/placement.ts 에만 있고
 * 여기서는 그 함수들을 호출해 상태만 갈아끼운다. */

/** 데모 기본 배치 — persona별로 다르게 시작한다(요구사항: 세 계정이 전부 같은 배치를
 * 받던 문제 수정). 세 계정이 쓰는 위젯은 서로 겹치지 않고, 사이즈도 L/M/S로 갈린다.
 *   beginner(이서준·자취 초보) — L: 자취 체크 / S: 집 살펴보기·보증금 안전
 *   worker(김하린·깔끔·음식)   — M: 냉장고·생활 체크 / S: 다음 청소·오늘 할 일
 *   pet(조아영·돈관리·혜택)    — L: 소비 분석 / S: 생활비·오늘의 혜택
 *   (L과 M은 1번째 줄을 배타적으로 나눠 쓰므로(placement.ts) 소비 분석을 L로 두면서
 *   같은 줄에 있던 M(생활비)은 S로 옮겨 자리를 지켰다) */
const PERSONA_DEFAULT_PLACEMENT: Record<Persona, PlacementState> = {
  beginner: {
    large: { widgetId: 'life-check', size: 'large' },
    medium: [null, null],
    small: [
      { widgetId: 'house-check', size: 'small' },
      { widgetId: 'deposit-safety', size: 'small' },
    ],
  },
  worker: {
    large: null,
    medium: [
      { widgetId: 'fridge', size: 'medium' },
      { widgetId: 'home-checklist', size: 'medium' },
    ],
    small: [
      { widgetId: 'next-cleaning', size: 'small' },
      { widgetId: 'todo-today', size: 'small' },
    ],
  },
  pet: {
    large: { widgetId: 'spend-analysis', size: 'large' },
    medium: [null, null],
    small: [
      { widgetId: 'living-cost', size: 'small' },
      { widgetId: 'today-benefit', size: 'small' },
    ],
  },
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
  const { user } = useAuth();
  const persona = user?.persona ?? DEFAULT_PERSONA;
  /* 계정을 바꾸면 App.tsx의 <AppNavigationProvider key={user.email}>가 이 아래를
   * 통째로 리마운트하므로, 여기서는 마운트 시점의 persona로 한 번만 고르면 된다. */
  const [state, setState] = useState<PlacementState>(() => PERSONA_DEFAULT_PLACEMENT[persona]);
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
