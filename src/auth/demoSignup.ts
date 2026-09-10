/* 데모용 "신규 사용자" 계정(이서준)의 가입 여부를 브라우저에 저장한다.
 *
 * 이서준은 페르소나 데이터(MOCK_USERS)를 그대로 두고, 가입 전에는
 * 테스트 계정처럼 바로 로그인되지 않고 회원가입 화면으로 보내기 위한 플래그다.
 * 데모 프로젝트이므로 localStorage 만 사용한다.
 */

/** 가입 전에는 시트에서 이메일 대신 상태 문구를 보여주는 계정 */
export const DEMO_SIGNUP_EMAIL = 'seojun@jaduya.com';

/** 가입 전 항목에 노출하는 상태 문구 */
export const DEMO_SIGNUP_LABEL = '처음 시작하기 · 회원가입 필요';

const STORAGE_KEY = 'jaduya.demo.signup.seojun';

export function isDemoSignupDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

export function markDemoSignupDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'done');
  } catch {
    /* 저장 실패는 무시 — 세션 상태로만 동작 */
  }
}

/** 데모 쇼케이스에서 "새 계정으로 시작하기"를 눌렀을 때 이서준을 다시 가입 전 상태로
 * 되돌리기 위한 초기화 — 실제 로그인 화면(TestAccountSheet)에는 이 진입점이 없다. */
export function resetDemoSignupDone(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 저장 실패는 무시 — 세션 상태로만 동작 */
  }
}
