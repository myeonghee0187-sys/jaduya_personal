import type { MockAccount } from './mockUsers';
import { TEST_PASSWORD } from './mockUsers';
import { DEMO_SIGNUP_EMAIL } from './demoSignup';

export type AccountSelection =
  | { target: 'signup'; email: string }
  | { target: 'login'; email: string; password: string };

/* "테스트 계정 선택"에서 계정을 골랐을 때 어디로 보낼지 결정한다.
 * 원래 Login.tsx 의 handleSelectAccount 에만 있던 분기를 그대로 옮긴 것 —
 * 가입 전인 데모 계정(이서준)은 로그인 대신 회원가입으로, 나머지는 email/password 를 채운다.
 * Login.tsx(테스트 계정 바텀시트)와 LoginShowcase.tsx(Demo Account 패널)가 함께 쓴다. */
export function resolveAccountSelection(account: MockAccount, demoSignedUp: boolean): AccountSelection {
  const pendingSignupEmail = demoSignedUp ? null : DEMO_SIGNUP_EMAIL;
  if (account.email === pendingSignupEmail) {
    return { target: 'signup', email: account.email };
  }
  return { target: 'login', email: account.email, password: TEST_PASSWORD };
}
