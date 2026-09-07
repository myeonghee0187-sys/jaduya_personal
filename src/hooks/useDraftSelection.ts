import { useCallback, useState } from 'react';

/* 내 메뉴 편집 / 위젯 추가가 공유하는 draft 선택 로직.
 *
 * 시트를 열 때 저장본을 draft 로 복사하고, 저장/완료 시에만 반영한다.
 * 최대 개수를 넘는 추가는 무시한다(원본 동작과 동일 — 조용히 no-op).
 */
export function useDraftSelection(initial: string[], max: number) {
  const [draft, setDraft] = useState<string[]>(initial);

  /** 시트를 열 때: 저장본으로 draft 초기화 */
  const reset = useCallback((from: string[]) => {
    setDraft(from.slice());
  }, []);

  const add = useCallback(
    (id: string) => {
      setDraft((prev) => {
        if (prev.includes(id) || prev.length >= max) return prev;
        return [...prev, id];
      });
    },
    [max],
  );

  const remove = useCallback((id: string) => {
    setDraft((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setDraft((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= max) return prev;
        return [...prev, id];
      });
    },
    [max],
  );

  return {
    draft,
    count: draft.length,
    isFull: draft.length >= max,
    has: (id: string) => draft.includes(id),
    reset,
    add,
    remove,
    toggle,
  };
}
