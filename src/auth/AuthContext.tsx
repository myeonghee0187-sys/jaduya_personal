import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEMO_ACCOUNT_EMAILS, MOCK_USERS } from './mockUsers';
import { DEMO_SIGNUP_EMAIL, isDemoSignupDone, markDemoSignupDone, resetDemoSignupDone } from './demoSignup';
import { isOnboardingPending, markOnboardingDone, resetAccountDemo } from './demoProgress';
import type { AuthUser, DemoAccountId, MockAccount, UserPreferences } from './mockUsers';

/* 로그인/회원가입 상태 전역 관리.
 * 라우터/외부 라이브러리 없이 Context + useState + localStorage 만 사용한다. */

const STORAGE_KEY = 'jaduya.auth.user';

interface SignupInput {
  email: string;
  password: string;
  nickname: string;
}

interface AuthValue {
  user: AuthUser | null;
  login(email: string, password: string): boolean;
  /** 발표용 mock 계정 전용 로그인 — password input과 비밀번호 검증을 거치지 않는다. */
  loginDemo(personaId: DemoAccountId): boolean;
  signup(input: SignupInput): boolean;
  /** 첫 맞춤 설정 완료 — onboarded 를 true 로 올리고 결과를 저장한다 */
  completeOnboarding(preferences: UserPreferences): void;
  /** 계정 관리 화면에서 바꾼 사용자명·프로필 사진을 현재 세션과 저장소에 반영한다. */
  updateProfile(profile: Pick<AuthUser, 'name' | 'profileImage'>): void;
  logout(): void;
  /** 데모 신규 사용자(이서준)가 회원가입을 마쳤는지 — 시트 표시/동작 분기용 */
  demoSignedUp: boolean;
  /** 이서준을 다시 가입 전 상태로 되돌린다(쇼케이스의 "새 계정으로 시작하기" 전용) —
   * localStorage 뿐 아니라 demoSignedUp 상태도 즉시 갱신해서 새로고침 없이 반영된다. */
  resetDemoSignup(): void;
  /** 데모 '처음부터 시작하기' — 이 계정의 진행 상태만 지우고 온보딩부터 다시 시작한다.
   * persona 기본 데이터(이름·프로필·자취 경험·주거 형태·레벨)는 건드리지 않는다.
   * 계정을 찾지 못하면 false. */
  startFreshDemo(email: string): boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.email) return null;
    const key = parsed.email.trim().toLowerCase();
    /* 목업 계정(이서준·김하린·조아영)은 onboarded 의 "진짜" 값이 항상 MOCK_USERS + 대기
     * 플래그로 정해진다(login/loginDemo 의 toAuthenticatedUser 와 같은 기준). 저장된
     * onboarded 값을 그냥 믿으면, 예전에 한 번이라도 false 로 저장된 적이 있는 계정은
     * 새로고침/재진입할 때마다 계속 온보딩으로 가버린다 — 여기서도 같은 기준으로
     * 다시 계산해서 로그인했을 때와 항상 같은 결과(바로 Home)가 나오게 한다. */
    const mockAccount = MOCK_USERS[key];
    return {
      name: parsed.name ?? mockAccount?.name ?? '',
      email: parsed.email,
      persona: parsed.persona ?? mockAccount?.persona ?? 'beginner',
      profileImage: parsed.profileImage,
      onboarded: mockAccount ? mockAccount.onboarded && !isOnboardingPending(key) : (parsed.onboarded ?? true),
      preferences: parsed.preferences ?? mockAccount?.preferences ?? null,
    };
  } catch {
    return null;
  }
}

function saveStoredUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* 저장 실패는 무시 — 세션 상태로만 동작 */
  }
}

function toAuthenticatedUser(account: MockAccount, key: string): AuthUser {
  return {
    name: account.name,
    email: account.email,
    persona: account.persona,
    onboarded: account.onboarded && !isOnboardingPending(key),
    preferences: account.preferences,
    profileImage: undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  /* 세션 중 signup 으로 생성된 계정 (mockUsers 는 읽기 전용) */
  const [signedUpUsers, setSignedUpUsers] = useState<Record<string, { password: string } & AuthUser>>({});
  /* 데모 신규 사용자(이서준) 가입 여부 — localStorage 에서 초기화 */
  const [demoSignedUp, setDemoSignedUp] = useState<boolean>(() => isDemoSignupDone());

  const value = useMemo<AuthValue>(
    () => ({
      user,
      demoSignedUp,
      login(email, password) {
        const key = email.trim().toLowerCase();
        /* 이서준은 회원가입을 마치기 전까지 로그인 대상이 아니다 */
        if (key === DEMO_SIGNUP_EMAIL && !demoSignedUp) return false;
        const account = MOCK_USERS[key] ?? signedUpUsers[key];
        if (!account || account.password !== password) return false;
        /* '처음부터 시작하기' 로 초기화해 둔 계정은 다시 로그인해도 온보딩부터 본다 —
         * MOCK_USERS 의 onboarded 는 true 로 박혀 있어 그것만 믿으면 초기화가 풀린다 */
        const nextUser = toAuthenticatedUser(account, key);
        setUser(nextUser);
        saveStoredUser(nextUser);
        return true;
      },
      loginDemo(personaId) {
        const key = DEMO_ACCOUNT_EMAILS[personaId];
        /* 가입 전 이서준은 기존 회원가입 시연 흐름을 유지한다. */
        if (key === DEMO_SIGNUP_EMAIL && !demoSignedUp) return false;
        const account = MOCK_USERS[key];
        if (!account) return false;
        const nextUser = toAuthenticatedUser(account, key);
        setUser(nextUser);
        saveStoredUser(nextUser);
        return true;
      },
      signup({ email, password, nickname }) {
        const key = email.trim().toLowerCase();
        /* 이서준은 신규 가입 시연용이라 같은 브라우저에서 몇 번이든 다시 가입할 수 있다 —
         * 지난 시연에서 남은 가입 완료 플래그와 계정 진행 상태를 먼저 지운다.
         * 나머지 계정(김하린·조아영·세션 중 가입한 계정)의 중복 검사는 그대로 둔다. */
        if (key === DEMO_SIGNUP_EMAIL) {
          resetDemoSignupDone();
          resetAccountDemo(key);
        } else if (MOCK_USERS[key] || signedUpUsers[key]) {
          return false;
        }
        /* 신규 가입자는 아직 맞춤 설정 전 — onboarded: false 로 시작한다 */
        const account = {
          name: nickname,
          email: key,
          persona: 'beginner' as const,
          password,
          onboarded: false,
          preferences: null,
        };
        setSignedUpUsers((prev) => ({ ...prev, [key]: account }));
        /* 이서준으로 가입하면 이후부터는 다른 테스트 계정과 동일하게 취급한다 */
        if (key === DEMO_SIGNUP_EMAIL) {
          markDemoSignupDone();
          setDemoSignedUp(true);
        }
        const nextUser: AuthUser = {
          name: account.name,
          email: account.email,
          persona: account.persona,
          onboarded: account.onboarded,
          preferences: account.preferences,
        };
        setUser(nextUser);
        saveStoredUser(nextUser);
        return true;
      },
      completeOnboarding(preferences) {
        if (!user) return;
        /* 초기화 플래그도 같이 걷어내야 다음 로그인에서 온보딩이 또 뜨지 않는다 */
        markOnboardingDone(user.email);
        const nextUser: AuthUser = { ...user, onboarded: true, preferences };
        setUser(nextUser);
        saveStoredUser(nextUser);
        /* 다시 로그인해도 맞춤 설정을 반복하지 않도록 세션 계정에도 반영한다 */
        setSignedUpUsers((prev) =>
          prev[nextUser.email]
            ? { ...prev, [nextUser.email]: { ...prev[nextUser.email], onboarded: true, preferences } }
            : prev,
        );
      },
      updateProfile(profile) {
        if (!user) return;
        const nextUser: AuthUser = { ...user, ...profile };
        setUser(nextUser);
        saveStoredUser(nextUser);
        setSignedUpUsers((prev) =>
          prev[nextUser.email]
            ? { ...prev, [nextUser.email]: { ...prev[nextUser.email], ...profile } }
            : prev,
        );
      },
      logout() {
        setUser(null);
        saveStoredUser(null);
      },
      resetDemoSignup() {
        resetDemoSignupDone();
        setDemoSignedUp(false);
      },
      startFreshDemo(email) {
        const key = email.trim().toLowerCase();
        const account = MOCK_USERS[key] ?? signedUpUsers[key];
        if (!account) return false;
        /* 계정별 진행 상태만 지운다 — MOCK_USERS / personaProfile 의 기본 데이터는 코드 상수다 */
        resetAccountDemo(key);
        const nextUser: AuthUser = {
          name: account.name,
          email: account.email,
          persona: account.persona,
          onboarded: false,
          preferences: null,
        };
        setUser(nextUser);
        saveStoredUser(nextUser);
        return true;
      },
    }),
    [user, signedUpUsers, demoSignedUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
