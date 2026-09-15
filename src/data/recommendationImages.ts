/** 추천 카드 이미지 연결 구조 — RecommendationTip.imageKey → 실제 이미지 asset 경로.
 *
 * data/recommendationTips.ts 의 36개 콘텐츠와 분리해서 관리한다 — 이미지 준비 상황이
 * 카피와는 별개로 바뀌기 때문이다. 이번 단계는 "연결 구조"만 만드는 단계라 화면에
 * <img> 를 아직 그리지 않고(다음 작업), 실제 이미지 파일도 아직 없다.
 *
 * public/assets/img/ 아래에 파일이 생기면 lib/asset.ts 의 img() 헬퍼로 참조한다
 * (이 프로젝트는 이미지를 public/assets/img/ 한 곳에서만 관리하고 img()/icon() 로만
 * 부른다 — CLAUDE.md 10-1. 번들 import(`import x from 'assets/...'`)는 쓰지 않는다).
 *   예: laundry: img('recommendation/laundry.png'),
 *
 * RECOMMENDATION_IMAGES 를 아직 비워둔 이유 — 존재하지 않는 파일 경로를 미리 적어두면
 * 나중에 그 경로를 그대로 <img src> 에 써서 404 가 나는 사고로 이어지기 쉽다. 대신
 * RecommendationImageKey 유니온만 확정해두면, 이미지가 준비될 때 이 객체에 값만
 * 채우면 되고 오타난 key·존재하지 않는 key는 그 순간 타입 에러로 바로 잡힌다.
 */

/** topic 의미를 바로 알아볼 수 있는 이미지 key. 의미가 겹치는 topic끼리는
 * (recommendationTips.ts 쪽 주석에 어떤 topic이 공유하는지 적어뒀다) 같은 key를
 * 재사용한다 — 36개 topic 전부가 서로 다른 key를 가질 필요는 없다. */
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
  // 장보기
  | 'grocery-discount'
  | 'food-storage'
  | 'fridge'
  | 'food-budget'
  | 'quick-meal'
  // 이사·주거
  | 'moving-home'
  | 'utility-setup'
  | 'address-registration'
  | 'waste-disposal'
  | 'contract-check'
  // 인테리어
  | 'room-layout'
  | 'storage-idea'
  | 'home-decor'
  | 'lighting'
  | 'diy-interior'
  // 자취
  | 'daily-routine'
  | 'beginner-guide'
  | 'safety-check'
  | 'life-story';

/** key → 실제 asset 경로. 이미지가 준비된 key만 채운다(Partial) — 아직은 전부 비어있다.
 * 누락된 key는 오류가 아니라 "아직 이미지가 없다"는 정상 상태이므로,
 * getRecommendationImagePath() 로 null-safe 하게 읽는다. */
export const RECOMMENDATION_IMAGES: Partial<Record<RecommendationImageKey, string>> = {};

/** imageKey 로 실제 이미지 경로를 찾는다. 아직 등록되지 않은 key 면 null —
 * 호출부(다음 작업의 카드 UI)가 이미지 없이도 안전하게 렌더링할 수 있게 한다. */
export function getRecommendationImagePath(key: RecommendationImageKey): string | null {
  return RECOMMENDATION_IMAGES[key] ?? null;
}
