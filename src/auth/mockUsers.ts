/* 로그인/회원가입 목업 계정 데이터.
 * Figma "테스트 계정 선택" Bottom Sheet 노출 목록 = TEST_ACCOUNTS. */

export type Persona = 'worker' | 'beginner' | 'pet';

export interface AuthUser {
  name: string;
  email: string;
  persona: Persona;
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
    description: '직장인 자취러',
  },
  'seojun@jaduya.com': {
    email: 'seojun@jaduya.com',
    password: '1234',
    name: '이서준',
    persona: 'beginner',
    description: '자취 초보',
  },
  'ayoung@jaduya.com': {
    email: 'ayoung@jaduya.com',
    password: '1234',
    name: '조아영',
    persona: 'pet',
    description: '반려동물과 함께 사는 자취러',
  },
};

/** 시트 노출 순서 고정 */
export const TEST_ACCOUNTS: MockAccount[] = [
  MOCK_USERS['harin@jaduya.com'],
  MOCK_USERS['seojun@jaduya.com'],
  MOCK_USERS['ayoung@jaduya.com'],
];
