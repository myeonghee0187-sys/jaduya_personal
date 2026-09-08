import { MOCK_USERS, TEST_PASSWORD } from './mockUsers';
import { DEMO_SIGNUP_EMAIL } from './demoSignup';

/* 회원가입 폼 자동입력용 더미 프로필 (개발·발표 편의 기능).
 *
 * 값은 여기에서만 정의하고 화면에서는 재사용만 한다.
 * 이서준 프로필은 로그인 데모 데이터(MOCK_USERS / DEMO_SIGNUP_EMAIL / TEST_PASSWORD)를
 * 그대로 가져와 로그인 시나리오와 값이 어긋나지 않게 한다.
 */

export interface SignupTestProfile {
  id: 'seojunDemo' | 'generic';
  /** 시트에 노출하는 이름 */
  label: string;
  /** 시트에 노출하는 보조 문구 */
  description: string;
  /** 닉네임 필드에 채우는 값 */
  name: string;
  email: string;
  password: string;
}

export const SIGNUP_TEST_PROFILES: Record<SignupTestProfile['id'], SignupTestProfile> = {
  /* 발표용 신규 사용자 시나리오 — 가입 후 기존 이서준 플로우(온보딩 포함)를 그대로 탄다 */
  seojunDemo: {
    id: 'seojunDemo',
    label: MOCK_USERS[DEMO_SIGNUP_EMAIL].name,
    description: '신규 사용자 데모 · 온보딩 포함',
    name: MOCK_USERS[DEMO_SIGNUP_EMAIL].name,
    email: DEMO_SIGNUP_EMAIL,
    password: TEST_PASSWORD,
  },
  /* 단순 validation 확인용 — 이서준 페르소나/가입 플래그와 무관하다 */
  generic: {
    id: 'generic',
    label: '일반 테스트 계정',
    description: '회원가입 폼 자동입력용',
    name: '테스트유저',
    email: 'testuser@jaduya.com',
    password: TEST_PASSWORD,
  },
};

/** 시트 노출 순서 */
export const SIGNUP_TEST_PROFILE_LIST: SignupTestProfile[] = [
  SIGNUP_TEST_PROFILES.seojunDemo,
  SIGNUP_TEST_PROFILES.generic,
];
