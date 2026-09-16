type Listener = () => void;

const listeners = new Set<Listener>();

/** 코치마크 "자두는 원하는 곳으로 이동할 수 있어요" 단계에 들어서면 호출한다.
 *
 * AIChatbotButton 은 App 에서 한 번만 렌더되고 Home 의 코치마크와는 다른 트리에
 * 포털로 붙어 있어 prop 으로 내려줄 수 없다 — aiFabRef.ts 와 같은 전역 싱글턴
 * 패턴으로 신호만 보낸다. 버튼은 이 신호를 받아 실제 위치(state)는 그대로 둔 채
 * 반대쪽으로 슬쩍 이동했다 되돌아오는 시각 데모만 재생한다. */
export function triggerAiFabDemoMove() {
  listeners.forEach((fn) => fn());
}

export function subscribeAiFabDemoMove(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
