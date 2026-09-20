/* 계정별 "데모를 어디까지 봤는가" 상태.
 *
 * demoSignup.ts 와 같은 방식이다 — persona 기본 데이터(MOCK_USERS / personaProfile)는
 * 코드 상수라 절대 건드리지 않고, 브라우저에 쌓인 진행 상태만 다룬다.
 *
 * 지금 이 프로젝트에 실제로 존재하는 계정별 진행 상태는 다섯 가지다.
 *   1) 온보딩(첫 맞춤 설정) 완료 여부  — AuthUser.onboarded
 *   2) 자취 프로필 설정               — jaduya.livingProfile.<email>
 *   3) 냉장고 재료 진행 상태          — jaduya.life-eat.*:<email>
 *   4) 홈 코치마크(4단계 가이드) 시청 — coachmarkProgress.ts / jaduya.demo.coachmarkSeen.<email>
 *   5) MY 메뉴 구성                   — jaduya.menuWidgets.<email> (지우면 persona 최초 추천 구성으로 돌아간다)
 *
 * onboarded 는 MOCK_USERS 에 true 로 박혀 있어 login() 이 매번 true 로 되돌린다.
 * 그래서 "이 계정은 온보딩부터 다시" 를 계정 전환 후에도 기억하려면 이 플래그가 필요하다.
 */

import { clearLivingProfile } from '../data/livingProfile';
import { clearMenuWidgets } from '../data/menuWidgets';
import { clearFridgeStorage } from '../data/lifeEat';
import { clearCoachmarkSeen } from './coachmarkProgress';

const ONBOARDING_PENDING_PREFIX = 'jaduya.demo.onboardingPending.';

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** 이 계정을 다음 진입 때 온보딩부터 다시 보여줄지 */
export function isOnboardingPending(email: string): boolean {
  try {
    return localStorage.getItem(ONBOARDING_PENDING_PREFIX + normalize(email)) === 'pending';
  } catch {
    return false;
  }
}

export function markOnboardingPending(email: string): void {
  try {
    localStorage.setItem(ONBOARDING_PENDING_PREFIX + normalize(email), 'pending');
  } catch {
    /* 저장 실패는 무시 — 세션 상태로만 동작 */
  }
}

/** 온보딩을 마쳤다 — 이후 로그인은 곧바로 Home 으로 간다 */
export function markOnboardingDone(email: string): void {
  try {
    localStorage.removeItem(ONBOARDING_PENDING_PREFIX + normalize(email));
  } catch {
    /* 삭제 실패는 무시 */
  }
}

/** '처음부터 시작하기' — 이 계정의 진행 상태만 지우고 온보딩 대기로 되돌린다.
 * 이름·프로필 이미지·자취 경험·주거 형태·레벨 등 persona 기본 데이터는 코드 상수라 그대로 남는다. */
export function resetAccountDemo(email: string): void {
  const key = normalize(email);
  clearLivingProfile(key);
  clearFridgeStorage(key);
  clearCoachmarkSeen(key);
  clearMenuWidgets(key);
  markOnboardingPending(key);
}
