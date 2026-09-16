function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/* 헤더 "가이드" 버튼의 위젯 배치 방법 모달(PlacementGuideSheet) — Coachmark 와 같은
 * beginner persona(이서준, 이서준으로 새로 가입한 테스트 계정)에서만 위젯 페이지에
 * 처음 들어왔을 때 "가이드" 버튼을 누르지 않아도 자동으로 열어준다. */
const GUIDE_SHEET_SEEN_PREFIX = 'jaduya.demo.widgetPlacementGuideSheetSeen.';

export function isWidgetGuideSheetSeen(email: string): boolean {
  try {
    return localStorage.getItem(GUIDE_SHEET_SEEN_PREFIX + normalize(email)) === 'seen';
  } catch {
    return false;
  }
}

export function markWidgetGuideSheetSeen(email: string): void {
  try {
    localStorage.setItem(GUIDE_SHEET_SEEN_PREFIX + normalize(email), 'seen');
  } catch {
    /* 저장 실패는 무시 — 세션 상태로만 동작 */
  }
}
