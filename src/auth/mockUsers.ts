/* 로그인/회원가입 목업 계정 데이터.
 * Figma "테스트 계정 선택" Bottom Sheet 노출 목록 = TEST_ACCOUNTS. */

export type Persona = 'worker' | 'beginner' | 'pet';
export type DemoAccountId = 'seojun' | 'harin' | 'ayoung';

/** 첫 맞춤 설정 결과.
 * 설문 항목이 Figma 에서 확정되지 않아 answers 는 아직 비어 있는 형태로 둔다.
 * 항목이 정해지면 answers 의 키를 확정하고 이 타입만 좁히면 된다. */
export interface UserPreferences {
  /** 맞춤 설정을 마친 시각 (ISO) */
  completedAt: string;
  /** 설문 항목 id → 선택한 값 목록 */
  answers: Record<string, string[]>;
}

export interface AuthUser {
  name: string;
  email: string;
  persona: Persona;
  /** 첫 맞춤 설정을 마쳤는지. false 면 Home 대신 맞춤 설정으로 보낸다. */
  onboarded: boolean;
  /** 맞춤 설정 결과 — Home 개인화에서 참조한다. 아직 없으면 null */
  preferences: UserPreferences | null;
}

export interface MockAccount extends AuthUser {
  password: string;
  /** 테스트 계정 시트에 노출하는 한 줄 설명 */
  description: string;
}

export const TEST_PASSWORD = '1234';

export const MOCK_USERS: Record<string, MockAccount> = {
  'harin@jaduya.com': {
    email: 'harin@jaduya.com',
    password: '1234',
    name: '김하린',
    persona: 'worker',
    onboarded: true,
    preferences: null,
    description: '직장인 자취러',
  },
  'seojun@jaduya.com': {
    email: 'seojun@jaduya.com',
    password: '1234',
    name: '이서준',
    persona: 'beginner',
    onboarded: true,
    preferences: null,
    description: '자취 초보',
  },
  'ayoung@jaduya.com': {
    email: 'ayoung@jaduya.com',
    password: '1234',
    name: '조아영',
    persona: 'pet',
    onboarded: true,
    preferences: null,
    description: '반려동물과 함께 사는 자취러',
  },
};

/** 데모 로그인은 password input을 거치지 않고 이 id로 기존 mock 계정을 찾는다. */
export const DEMO_ACCOUNT_EMAILS: Record<DemoAccountId, string> = {
  seojun: 'seojun@jaduya.com',
  harin: 'harin@jaduya.com',
  ayoung: 'ayoung@jaduya.com',
};

export function getDemoAccountId(email: string): DemoAccountId | null {
  const key = email.trim().toLowerCase();
  const entry = Object.entries(DEMO_ACCOUNT_EMAILS).find(([, accountEmail]) => accountEmail === key);
  return (entry?.[0] as DemoAccountId | undefined) ?? null;
}

/** 시트 노출 순서 고정 — 이서준 → 김하린 → 조아영 */
export const TEST_ACCOUNTS: MockAccount[] = [
  MOCK_USERS['seojun@jaduya.com'],
  MOCK_USERS['harin@jaduya.com'],
  MOCK_USERS['ayoung@jaduya.com'],
];
