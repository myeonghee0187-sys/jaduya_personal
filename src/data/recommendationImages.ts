/** 추천 카드 이미지 연결 구조 — RecommendationTip.imageKey → 실제 이미지 asset 경로.
 *
 * data/recommendationTips.ts 의 36개 콘텐츠와 분리해서 관리한다 — 이미지 준비 상황이
 * 카피와는 별개로 바뀌기 때문이다.
 *
 * 실제 이미지 36장은 public/assets/img/jaduya_custom_recommendation_36/ 아래 분야별
 * 폴더(living/money_management/grocery_shopping/moving_housing/interior/living_alone)에
 * 있다 — 이 프로젝트는 이미지를 public/assets/img/ 한 곳에서만 관리하고 화면에서는
 * src/lib/asset.ts 의 img() 헬퍼로만 참조한다(CLAUDE.md 10-1). img() 는 배포 환경의
 * BASE_URL 을 붙인 절대 경로 문자열을 만들 뿐, 번들 import 가 아니다.
 */

import { img } from '../lib/asset';

/** 36개 관심 주제 각각의 이미지 key — 주제 하나마다 서로 다른 이미지를 쓴다
 * (분야 단위로 뭉뚱그리지 않는다). */
export type RecommendationImageKey =
  // 생활
  | 'recycling'
  | 'bathroom-cleaning'
  | 'laundry'
  | 'household-supplies'
  | 'weather-alert'
  | 'living-gadget'
  // 돈 관리
  | 'rent-bill'
  | 'utility-saving'
  | 'money-management'
  | 'spending-habit'
  | 'budget-planning'
  | 'spending-check'
  // 장보기
  | 'grocery-discount'
  | 'food-storage'
  | 'fridge'
  | 'small-quantity'
  | 'food-budget'
  | 'quick-meal'
  // 이사·주거
  | 'moving-home'
  | 'utility-setup'
  | 'address-registration'
  | 'waste-disposal'
  | 'contract-check'
  | 'home-repair'
  // 인테리어
  | 'room-layout'
  | 'storage-idea'
  | 'furniture-layout'
  | 'home-decor'
  | 'lighting'
  | 'diy-interior'
  // 자취
  | 'daily-routine'
  | 'beginner-guide'
  | 'living-routine'
  | 'safety-check'
  | 'alone-essentials'
  | 'life-story';

/** 이미지 36장이 들어있는 공용 폴더 — public/assets/img/ 기준 상대경로.
 * img() 가 여기에 'assets/img/' 와 BASE_URL 을 붙여 최종 절대 경로를 만든다. */
const RECOMMENDATION_IMAGE_BASE = 'jaduya_custom_recommendation_36';

/** key → 실제 asset 경로. 36개 전부 채워져 있다(정상적인 추천에서는 fallback 이 나올
 * 일이 없다) — 그래도 getRecommendationImagePath() 는 안전하게 null 을 돌려줄 수 있게
 * Partial 타입을 유지한다(혹시 모를 오타·미등록 key 방어). */
export const RECOMMENDATION_IMAGES: Partial<Record<RecommendationImageKey, string>> = {
  // 생활 — living/
  recycling: img(`${RECOMMENDATION_IMAGE_BASE}/living/recycling.png`),
  'bathroom-cleaning': img(`${RECOMMENDATION_IMAGE_BASE}/living/cleaning.png`),
  laundry: img(`${RECOMMENDATION_IMAGE_BASE}/living/laundry.png`),
  'household-supplies': img(`${RECOMMENDATION_IMAGE_BASE}/living/kitchen_care.png`),
  'weather-alert': img(`${RECOMMENDATION_IMAGE_BASE}/living/bathroom_care.png`),
  'living-gadget': img(`${RECOMMENDATION_IMAGE_BASE}/living/pest_control.png`),

  // 돈 관리 — money_management/
  'rent-bill': img(`${RECOMMENDATION_IMAGE_BASE}/money_management/monthly_living_costs.png`),
  'utility-saving': img(`${RECOMMENDATION_IMAGE_BASE}/money_management/utility_bills.png`),
  'money-management': img(`${RECOMMENDATION_IMAGE_BASE}/money_management/fixed_expenses.png`),
  'spending-habit': img(`${RECOMMENDATION_IMAGE_BASE}/money_management/saving_money.png`),
  'budget-planning': img(`${RECOMMENDATION_IMAGE_BASE}/money_management/budget_management.png`),
  'spending-check': img(`${RECOMMENDATION_IMAGE_BASE}/money_management/spending_management.png`),

  // 장보기 — grocery_shopping/
  'grocery-discount': img(`${RECOMMENDATION_IMAGE_BASE}/grocery_shopping/discount_info.png`),
  'food-storage': img(`${RECOMMENDATION_IMAGE_BASE}/grocery_shopping/food_storage.png`),
  fridge: img(`${RECOMMENDATION_IMAGE_BASE}/grocery_shopping/groceries.png`),
  'small-quantity': img(`${RECOMMENDATION_IMAGE_BASE}/grocery_shopping/small_quantity_purchase.png`),
  'food-budget': img(`${RECOMMENDATION_IMAGE_BASE}/grocery_shopping/shopping_list.png`),
  'quick-meal': img(`${RECOMMENDATION_IMAGE_BASE}/grocery_shopping/daily_essentials.png`),

  // 이사·주거 — moving_housing/
  'moving-home': img(`${RECOMMENDATION_IMAGE_BASE}/moving_housing/moving_preparation.png`),
  'utility-setup': img(`${RECOMMENDATION_IMAGE_BASE}/moving_housing/home_inspection.png`),
  'address-registration': img(`${RECOMMENDATION_IMAGE_BASE}/moving_housing/move_in_administration.png`),
  'waste-disposal': img(`${RECOMMENDATION_IMAGE_BASE}/moving_housing/home_search.png`),
  'contract-check': img(`${RECOMMENDATION_IMAGE_BASE}/moving_housing/housing_contract.png`),
  'home-repair': img(`${RECOMMENDATION_IMAGE_BASE}/moving_housing/home_repairs.png`),

  // 인테리어 — interior/
  'room-layout': img(`${RECOMMENDATION_IMAGE_BASE}/interior/small_space_living.png`),
  'storage-idea': img(`${RECOMMENDATION_IMAGE_BASE}/interior/storage.png`),
  'furniture-layout': img(`${RECOMMENDATION_IMAGE_BASE}/interior/furniture_layout.png`),
  'home-decor': img(`${RECOMMENDATION_IMAGE_BASE}/interior/bedding.png`),
  lighting: img(`${RECOMMENDATION_IMAGE_BASE}/interior/lighting.png`),
  'diy-interior': img(`${RECOMMENDATION_IMAGE_BASE}/interior/diy_interior.png`),

  // 자취 — living_alone/
  'daily-routine': img(`${RECOMMENDATION_IMAGE_BASE}/living_alone/simple_cooking.png`),
  'beginner-guide': img(`${RECOMMENDATION_IMAGE_BASE}/living_alone/first_time_living_alone.png`),
  'living-routine': img(`${RECOMMENDATION_IMAGE_BASE}/living_alone/living_alone_routine.png`),
  'safety-check': img(`${RECOMMENDATION_IMAGE_BASE}/living_alone/safety_security.png`),
  'alone-essentials': img(`${RECOMMENDATION_IMAGE_BASE}/living_alone/living_alone_essentials.png`),
  'life-story': img(`${RECOMMENDATION_IMAGE_BASE}/living_alone/sick_alone.png`),
};

/** imageKey 로 실제 이미지 경로를 찾는다. 등록되지 않은 key 면 null —
 * 호출부(카드 UI)가 이미지 없이도 안전하게 렌더링할 수 있게 한다. */
export function getRecommendationImagePath(key: RecommendationImageKey): string | null {
  return RECOMMENDATION_IMAGES[key] ?? null;
}
