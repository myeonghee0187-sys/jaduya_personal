import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayerHistoryState, LayerName } from '../types';

/* js/overlays.js 의 레이어 스택 + history 연동을 그대로 옮긴 훅.
 *
 * - 열기  : stack push + history.pushState
 * - 닫기  : history.back() → popstate 가 stack 을 되돌린다
 *           (닫기 버튼과 브라우저/하드웨어 뒤로가기가 완전히 같은 경로)
 * - Escape: 최상단 레이어 닫기
 *
 * StrictMode 대비: pushState 는 effect 가 아니라 이벤트 핸들러에서만 호출하고,
 * 최신 스택은 ref 로 읽는다. replaceState 는 멱등이라 두 번 실행돼도 안전하다.
 */
export function useLayerStack() {
  const [stack, setStack] = useState<LayerName[]>([]);
  const stackRef = useRef<LayerName[]>(stack);
  stackRef.current = stack;

  /* 현재 history 항목을 '레이어 없음'으로 표시해 두면
   * 새로고침 이후에도 뒤로가기가 항상 Home 으로 돌아온다. */
  useEffect(() => {
    const state: LayerHistoryState = { jaduyaLayers: [] };
    window.history.replaceState(state, '');
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const next = (e.state as LayerHistoryState | null)?.jaduyaLayers ?? [];
      setStack(next.slice());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const open = useCallback((name: LayerName) => {
    if (stackRef.current.includes(name)) return;
    const next = [...stackRef.current, name];
    stackRef.current = next;
    setStack(next);
    const state: LayerHistoryState = { jaduyaLayers: next };
    window.history.pushState(state, '');
  }, []);

  /* UI 의 닫기는 항상 history 를 통해 되돌린다 */
  const close = useCallback(() => {
    if (stackRef.current.length === 0) return;
    window.history.back();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stackRef.current.length > 0) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close]);

  const isOpen = useCallback((name: LayerName) => stack.includes(name), [stack]);

  return { stack, open, close, isOpen };
}
