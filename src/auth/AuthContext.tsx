import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MOCK_USERS } from './mockUsers';
import { DEMO_SIGNUP_EMAIL, isDemoSignupDone, markDemoSignupDone, resetDemoSignupDone } from './demoSignup';
import { isOnboardingPending, markOnboardingDone, resetAccountDemo } from './demoProgress';
import type { AuthUser, UserPreferences } from './mockUsers';

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
  signup(input: SignupInput): boolean;
  /** 첫 맞춤 설정 완료 — onboarded 를 true 로 올리고 결과를 저장한다 */
  completeOnboarding(preferences: UserPreferences): void;
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
    /* onboarded 도입 전에 저장된 사용자는 이미 Home 을 쓰던 사용자로 본다 */
    return {
      name: parsed.name ?? '',
      email: parsed.email,
      persona: parsed.persona ?? 'beginner',
      onboarded: parsed.onboarded ?? true,
      preferences: parsed.preferences ?? null,
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
        const nextUser: AuthUser = {
          name: account.name,
          email: account.email,
          persona: account.persona,
          onboarded: account.onboarded && !isOnboardingPending(key),
          preferences: account.preferences,
        };
        setUser(nextUser);
        saveStoredUser(nextUser);
        return true;
      },
      signup({ email, password, nickname }) {
        const key = email.trim().toLowerCase();
        /* 가입 전 데모 계정(이서준)의 이메일은 아직 사용 가능한 것으로 본다 */
        const takenAsMock = Boolean(MOCK_USERS[key]) && !(key === DEMO_SIGNUP_EMAIL && !demoSignedUp);
        if (takenAsMock || signedUpUsers[key]) return false;
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
