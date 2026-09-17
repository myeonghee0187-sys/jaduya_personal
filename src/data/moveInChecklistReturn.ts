/* 이서준 pre-move-check 플로우에서 "입주 체크리스트 전체보기 → 체크리스트로 이동"을 눌러
 * life-first 로 나갔다가, 그 화면의 뒤로가기(→ 자두AI로 돌아가기, AppNavigation.goBack 의
 * reopenAIChat)로 돌아왔을 때만 대화를 자동으로 이어가기 위한 1회용 신호다.
 *
 * localStorage 가 아니라 모듈 스코프 변수로만 둔다 — 새로고침(완전한 페이지 재로딩)까지
 * 넘어 살아있어야 할 이유가 없고(그 경우는 새로 시작하는 게 자연스럽다), AIChatPage 는
 * SPA 안에서 마운트/언마운트만 반복하므로 이 모듈은 계속 같은 JS 인스턴스로 남아 있다.
 * consumePendingMoveInChecklistReturn() 이 값을 한 번 읽으면 바로 꺼지므로, 같은 세션을
 * 두 번 이어가거나 다른 이유로 자두AI를 다시 열었을 때 메시지가 중복 생성되지 않는다. */
let pending = false;

export function markPendingMoveInChecklistReturn(): void {
  pending = true;
}

export function consumePendingMoveInChecklistReturn(): boolean {
  const value = pending;
  pending = false;
  return value;
}
