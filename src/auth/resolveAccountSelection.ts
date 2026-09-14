import type { MockAccount } from './mockUsers';
import { getDemoAccountId } from './mockUsers';
import type { DemoAccountId } from './mockUsers';
import { DEMO_SIGNUP_EMAIL } from './demoSignup';

export type AccountSelection =
  | { target: 'signup'; email: string }
  | { target: 'demo'; personaId: DemoAccountId };

/* "테스트 계정 선택"에서 계정을 골랐을 때 어디로 보낼지 결정한다.
 * 원래 Login.tsx 의 handleSelectAccount 에만 있던 분기를 그대로 옮긴 것 —
 * 가입 전인 데모 계정(이서준)은 회원가입으로, 나머지는 password input 없이 즉시 로그인한다.
 * Login.tsx(테스트 계정 바텀시트)와 LoginShowcase.tsx(Demo Account 패널)가 함께 쓴다. */
export function resolveAccountSelection(account: MockAccount, demoSignedUp: boolean): AccountSelection {
  const pendingSignupEmail = demoSignedUp ? null : DEMO_SIGNUP_EMAIL;
  if (account.email === pendingSignupEmail) {
    return { target: 'signup', email: account.email };
  }
  const personaId = getDemoAccountId(account.email);
  if (!personaId) return { target: 'signup', email: account.email };
  return { target: 'demo', personaId };
}
