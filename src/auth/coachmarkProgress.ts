/* 계정별 "홈 코치마크(첫 진입 4단계 가이드)를 봤는지" 상태.
 *
 * demoProgress.ts 와 같은 방식이다 — persona 기본 데이터(MOCK_USERS 등)는 코드 상수라
 * 건드리지 않고, 브라우저에 쌓인 진행 상태만 계정별 key 로 다룬다.
 * 코치마크는 이서준(persona: beginner)과 이서준으로 새로 가입한 일반 테스트 계정에서만
 * 뜬다 — 노출 조건 자체는 Home 쪽에서 persona 로 가른다. 여기서는 "한 번 봤다"만 기억한다.
 */

const COACHMARK_SEEN_PREFIX = 'jaduya.demo.coachmarkSeen.';

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** 이 계정이 홈 코치마크를 끝까지 보거나 건너뛴 적이 있는지 */
export function isCoachmarkSeen(email: string): boolean {
  try {
    return localStorage.getItem(COACHMARK_SEEN_PREFIX + normalize(email)) === 'seen';
  } catch {
    return false;
  }
}

/** 코치마크를 마쳤다(끝까지 보기/건너뛰기 모두 포함) — 이후 로그인부터는 다시 띄우지 않는다 */
export function markCoachmarkSeen(email: string): void {
  try {
    localStorage.setItem(COACHMARK_SEEN_PREFIX + normalize(email), 'seen');
  } catch {
    /* 저장 실패는 무시 — 세션 상태로만 동작 */
  }
}

/** '처음부터 시작하기' 등 데모 초기화 시 함께 지운다 */
export function clearCoachmarkSeen(email: string): void {
  try {
    localStorage.removeItem(COACHMARK_SEEN_PREFIX + normalize(email));
  } catch {
    /* 삭제 실패는 무시 */
  }
}
