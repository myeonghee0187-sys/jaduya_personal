/** 맞춤 추천 콘텐츠 데이터 — 관심 분야(6) × 관심 주제(6) = 36개.
 *
 * 관심 분야·관심 주제의 원본은 data/livingProfile.ts 의 INTEREST_CATEGORIES /
 * INTEREST_TOPICS 다 — 이 파일은 그 36개 조합 각각에 보여줄 추천 콘텐츠만 담는다.
 * 분야·주제 목록 자체를 여기서 다시 정의하지 않는다.
 *
 * 아직 화면에는 연결하지 않는다 — 홈 UI 연결은 다음 작업에서 한다.
 *
 * 구조:
 *   RECOMMENDATION_TIPS[분야][주제] → { title, description, imageKey }
 *
 * imageKey → 실제 이미지 asset 경로 연결은 이 파일이 아니라 data/recommendationImages.ts 가 맡는다.
 */

import { INTEREST_TOPICS } from './livingProfile';
import type { InterestCategory, LivingProfilePreferences } from './livingProfile';
import type { RecommendationImageKey } from './recommendationImages';

export interface RecommendationTip {
  title: string;
  description: string;
  /** 카드에 함께 보여줄 이미지 식별자 — 실제 경로는 recommendationImages.ts 가 맡는다.
   * 이 파일은 "어떤 이미지가 이 topic 에 맞는지"만 고른다. */
  imageKey: RecommendationImageKey;
}

export const RECOMMENDATION_TIPS: Record<InterestCategory, Record<string, RecommendationTip>> = {
  생활: {
    '분리수거 요령': {
      title: '택배 송장은 떼고 버려요',
      description: '테이프도 떼어 종이류로 배출해요.',
      imageKey: 'recycling',
    },
    '욕실·주방 청소': {
      title: '샤워 후엔 물기부터 닦아요',
      description: '물때·곰팡이를 줄일 수 있어요.',
      imageKey: 'bathroom-cleaning',
    },
    '세탁 관리': {
      title: '수건은 완전히 말려요',
      description: '덜 마르면 냄새가 나요.',
      imageKey: 'laundry',
    },
    '생활용품 관리': {
      title: '수세미는 자주 바꿔요',
      description: '오래 쓰면 세균이 번식해요.',
      imageKey: 'household-supplies',
    },
    '날씨·외출 팁': {
      title: '외출 전 창문을 확인해요',
      description: '갑작스런 비바람에 대비해요.',
      imageKey: 'weather-alert',
    },
    '1인 가구 살림템': {
      /* '자취 추천템'(자취)과 같은 이미지를 쓴다 — 둘 다 자취 생활용 아이템 추천이다 */
      title: '개별 스위치 멀티탭을 써요',
      description: '안 쓰는 제품만 골라 꺼요.',
      imageKey: 'living-gadget',
    },
  },

  '돈 관리': {
    '월세·관리비': {
      title: '월세·관리비 따로 기록해요',
      description: '주거비를 따로 기록해두세요.',
      imageKey: 'rent-bill',
    },
    '공과금 절약': {
      title: '외출 전 플러그를 뽑아요',
      description: '대기전력만 줄여도 절약돼요.',
      imageKey: 'utility-saving',
    },
    '고정지출 관리': {
      /* 원래 '고정비 관리' 이름으로 받은 콘텐츠 — 실제 주제명은 '고정지출 관리'.
       * '월별 지출 체크'와 같은 이미지를 쓴다 — 둘 다 지출 관리 계열이다. */
      title: '자동결제 목록을 모아봐요',
      description: '매달 빠지는 구독료를 확인해요.',
      imageKey: 'money-management',
    },
    '생활비 절약': {
      /* 원래 '소비 습관' 이름으로 받은 콘텐츠 — 충동구매를 줄이는 내용이라
       * '생활비 절약' 주제로 옮겼다. */
      title: '결제 전 하루만 고민해요',
      description: '충동구매를 줄일 수 있어요.',
      imageKey: 'spending-habit',
    },
    '예산 관리': {
      title: '한 달 예산을 먼저 나눠요',
      description: '항목별로 나누면 파악이 쉬워요.',
      imageKey: 'budget-planning',
    },
    '월별 지출 체크': {
      /* '고정지출 관리'와 같은 이미지를 쓴다 — 둘 다 지출 관리 계열이다 */
      title: '지출은 주 1회 확인해요',
      description: '놓치는 소비를 줄일 수 있어요.',
      imageKey: 'money-management',
    },
  },

  장보기: {
    '장보기 할인': {
      /* '소용량 식재료'와 같은 이미지를 쓴다 — 둘 다 "필요한 만큼만 산다"는 내용이다 */
      title: '필요한 만큼만 담아요',
      description: '다 못 먹으면 오히려 손해예요.',
      imageKey: 'grocery-discount',
    },
    '식재료 보관법': {
      /* 원래 '식재료 보관' 이름으로 받은 콘텐츠 — 실제 주제명은 '식재료 보관법' */
      title: '채소는 씻기 전에 보관해요',
      description: '물기가 남으면 빨리 상해요.',
      imageKey: 'food-storage',
    },
    '냉장고 관리': {
      title: '먼저 먹을 건 앞에 둬요',
      description: '유통기한 임박 식품부터 보여두세요.',
      imageKey: 'fridge',
    },
    '소용량 식재료': {
      /* 원래 '1인분 구매' 이름으로 받은 콘텐츠 — 필요한 만큼만 사는 내용이라
       * '소용량 식재료' 주제와 가장 가깝다. '장보기 할인'과 같은 이미지를 쓴다. */
      title: '필요한 만큼만 사요',
      description: '다 못 먹으면 대용량도 손해예요.',
      imageKey: 'grocery-discount',
    },
    '식비 절약': {
      title: '공복에 장 보지 마세요',
      description: '계획에 없던 음식을 담게 돼요.',
      imageKey: 'food-budget',
    },
    '간편 요리': {
      title: '재료 세 가지면 충분해요',
      description: '달걀·밥·김이면 끝이에요.',
      imageKey: 'quick-meal',
    },
  },

  '이사·주거': {
    '이사 준비': {
      /* '집 관리'와 같은 이미지를 쓴다 — 둘 다 이사·입주 시점의 일이다 */
      title: '박스에 방 이름을 적어요',
      description: '정리 시간을 크게 줄여줘요.',
      imageKey: 'moving-home',
    },
    '전기·가스 신청': {
      title: '전기·가스는 미리 신청해요',
      description: '입주 당일 바로 쓸 수 있어요.',
      imageKey: 'utility-setup',
    },
    전입신고: {
      title: '전입신고를 잊지 마세요',
      description: '보증금을 지키는 첫 절차예요.',
      imageKey: 'address-registration',
    },
    '폐기물 배출': {
      title: '폐기물은 신고 후 버려요',
      description: '지역별 배출 방법을 확인해요.',
      imageKey: 'waste-disposal',
    },
    '계약 체크': {
      title: '계약 전 등기부등본 확인',
      description: '소유자와 권리관계를 확인해요.',
      imageKey: 'contract-check',
    },
    '집 관리': {
      /* 원래 '하자 점검' 이름으로 받은 콘텐츠 — 입주 시점 집 상태 기록이라
       * '집 관리' 주제와 가장 가깝다. '이사 준비'와 같은 이미지를 쓴다. */
      title: '입주 첫날 집 상태 촬영',
      description: '기존 하자를 사진으로 남겨요.',
      imageKey: 'moving-home',
    },
  },

  인테리어: {
    '원룸 공간 활용': {
      /* '가구 배치'와 같은 이미지를 쓴다 — 둘 다 방 안 공간·동선을 다루는 내용이다 */
      title: '큰 가구부터 자리를 정해요',
      description: '남은 공간을 활용하기 쉬워요.',
      imageKey: 'room-layout',
    },
    '수납 아이디어': {
      title: '자주 쓰는 건 눈높이에 둬요',
      description: '사용 빈도별로 수납을 나눠요.',
      imageKey: 'storage-idea',
    },
    '가구 배치': {
      /* '원룸 공간 활용'과 같은 이미지를 쓴다 */
      title: '생활 동선부터 확보해요',
      description: '움직이는 길이 막히지 않게요.',
      imageKey: 'room-layout',
    },
    홈데코: {
      title: '포인트는 한두 곳만 줘요',
      description: '작은 소품만 바꿔도 달라져요.',
      imageKey: 'home-decor',
    },
    '조명 활용': {
      title: '간접조명을 더해보세요',
      description: '공간이 한층 편안해 보여요.',
      imageKey: 'lighting',
    },
    '셀프 인테리어': {
      title: '작은 부분부터 테스트해요',
      description: '벽 손상 여부부터 확인해요.',
      imageKey: 'diy-interior',
    },
  },

  자취: {
    '자취 꿀팁': {
      /* '혼자 사는 루틴'과 같은 이미지를 쓴다 — 둘 다 집안일을 나눠서 하는 루틴 얘기다 */
      title: '집안일은 나눠서 해요',
      description: '주말에 한꺼번에 쌓이지 않아요.',
      imageKey: 'daily-routine',
    },
    '초보 자취 가이드': {
      title: '필요한 것부터 준비해요',
      description: '살아보며 하나씩 채워가요.',
      imageKey: 'beginner-guide',
    },
    '혼자 사는 루틴': {
      /* '자취 꿀팁'과 같은 이미지를 쓴다 */
      title: '집안일은 요일을 정해요',
      description: '생활 리듬을 만들기 쉬워져요.',
      imageKey: 'daily-routine',
    },
    '자취 실수 방지': {
      title: '외출 전 세 가지 확인해요',
      description: '문·창문·전열기구를 확인해요.',
      imageKey: 'safety-check',
    },
    '자취 추천템': {
      /* '1인 가구 살림템'(생활)과 같은 이미지를 쓴다 */
      title: '멀티탭과 공구는 꼭 챙겨요',
      description: '충전·간단 수리에 자주 써요.',
      imageKey: 'living-gadget',
    },
    '자취 경험담': {
      title: '직접 살아보며 방법을 찾아요',
      description: '나에게 맞는 방식이 생겨요.',
      imageKey: 'life-story',
    },
  },
};

/** 홈 추천 카드용 — 관심 분야 + 분야별 선택 주제(livingProfile 저장값 그대로)로
 * 대표 추천 콘텐츠 하나를 고른다.
 *
 * 여러 주제를 선택했다면 우연한 배열 저장 순서가 아니라 INTEREST_TOPICS 에 정의된
 * 순서 기준으로 가장 먼저인 것을 쓰고, 하나도 선택하지 않았다면 그 분야의 첫 주제를
 * fallback 으로 쓴다. category 가 아직 없으면(설정 전) null — 호출부가 기존
 * onboarding 카드를 그대로 보여주면 된다. 정상 데이터라면 항상 찾지만, 혹시 찾지
 * 못해도(mismatch) 화면이 깨지지 않도록 null 로 안전하게 반환한다. */
export function getRecommendationTip(
  category: InterestCategory | null,
  topics: LivingProfilePreferences['topics'],
): RecommendationTip | null {
  if (!category) return null;
  const orderedTopics = INTEREST_TOPICS[category];
  const selectedTopics = topics[category] ?? [];
  const primaryTopic = orderedTopics.find((topic) => selectedTopics.includes(topic)) ?? orderedTopics[0];
  return RECOMMENDATION_TIPS[category][primaryTopic] ?? null;
}

/** 회귀 방지 — INTEREST_TOPICS 36개와 RECOMMENDATION_TIPS 가 1:1로 맞는지 개발 모드에서
 * 확인한다(data/homecareGuide.ts 의 findMissingHomecareScenarios 와 같은 방식). 양쪽 다
 * 단순 문자열 Record 라 타입만으로는 철자 어긋남을 잡을 수 없어, 모듈 로드 시 1회 대조한다. */
export function findRecommendationTipMismatches(): string[] {
  const mismatches: string[] = [];
  (Object.keys(INTEREST_TOPICS) as InterestCategory[]).forEach((category) => {
    const topics = INTEREST_TOPICS[category];
    const tips = RECOMMENDATION_TIPS[category];
    topics.forEach((topic) => {
      if (!tips[topic]) mismatches.push(`missing: ${category}.${topic}`);
    });
    Object.keys(tips).forEach((topic) => {
      if (!topics.includes(topic)) mismatches.push(`extra: ${category}.${topic}`);
    });
  });
  return mismatches;
}

if (import.meta.env.DEV) {
  const mismatches = findRecommendationTipMismatches();
  if (mismatches.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[recommendationTips] INTEREST_TOPICS 와 어긋난 항목 ${mismatches.length}건:`, mismatches);
  }
}
