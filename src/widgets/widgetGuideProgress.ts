/* 위젯 관리 화면의 "처음 사용자 안내" 배너를 닫았는지 — coachmarkProgress.ts 와 같은 방식.
 * 계정별로 기억해서, 닫은 뒤에는 새로고침해도 다시 뜨지 않는다(요구사항 22).
 * 배너를 닫아도 헤더의 "가이드"에서는 언제든 같은 내용을 다시 볼 수 있다(요구사항 23). */

const GUIDE_DISMISSED_PREFIX = 'jaduya.demo.widgetPlacementGuideDismissed.';

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function isWidgetGuideDismissed(email: string): boolean {
  try {
    return localStorage.getItem(GUIDE_DISMISSED_PREFIX + normalize(email)) === 'dismissed';
  } catch {
    return false;
  }
}

export function markWidgetGuideDismissed(email: string): void {
  try {
    localStorage.setItem(GUIDE_DISMISSED_PREFIX + normalize(email), 'dismissed');
  } catch {
    /* 저장 실패는 무시 — 세션 상태로만 동작 */
  }
}

/* 헤더 "가이드" 버튼의 위젯 배치 방법 모달(PlacementGuideSheet) — 위 배너와는 별개로
 * 기억한다(배너를 닫아도 이 모달은 계정당 한 번은 자동으로 뜬다). Coachmark 와 같은
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
