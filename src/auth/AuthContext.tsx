import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MOCK_USERS } from './mockUsers';
import type { AuthUser } from './mockUsers';

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
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
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

  const value = useMemo<AuthValue>(
    () => ({
      user,
      login(email, password) {
        const key = email.trim().toLowerCase();
        const account = MOCK_USERS[key] ?? signedUpUsers[key];
        if (!account || account.password !== password) return false;
        const nextUser: AuthUser = { name: account.name, email: account.email, persona: account.persona };
        setUser(nextUser);
        saveStoredUser(nextUser);
        return true;
      },
      signup({ email, password, nickname }) {
        const key = email.trim().toLowerCase();
        if (MOCK_USERS[key] || signedUpUsers[key]) return false;
        const account = { name: nickname, email: key, persona: 'beginner' as const, password };
        setSignedUpUsers((prev) => ({ ...prev, [key]: account }));
        const nextUser: AuthUser = { name: account.name, email: account.email, persona: account.persona };
        setUser(nextUser);
        saveStoredUser(nextUser);
        return true;
      },
      logout() {
        setUser(null);
        saveStoredUser(null);
      },
    }),
    [user, signedUpUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
