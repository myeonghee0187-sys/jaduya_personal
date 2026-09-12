/* 마이페이지 > 자취 프로필 설정값 — Figma node 1565:7326.
 *
 * 백엔드가 없으므로 lifeEat.ts 와 같은 방식으로 localStorage 에 사용자(ownerKey)별로
 * 저장한다. 화면에서 localStorage 를 직접 부르지 않고 이 파일의 함수만 쓴다.
 *
 * 홈 개인화는 다음 작업에서 연결한다 — 그때는 getSelectedInterestTopics(ownerKey) /
 * loadLivingProfile(ownerKey) 만 읽으면 된다.
 */

const STORAGE_PREFIX = 'jaduya.livingProfile.';

/** 자취 경험 — 단일 선택 */
export const LIVING_EXPERIENCES = [
  '자취 준비중',
  '1개월 미만',
  '1개월 ~ 6개월',
  '6개월 ~ 1년',
  '1년 이상',
  '3년 이상',
] as const;
export type LivingExperience = (typeof LIVING_EXPERIENCES)[number];

/** 주거 형태 — 단일 선택 */
export const HOUSING_TYPES = [
  '원룸',
  '오피스텔',
  '빌라·투룸',
  '아파트',
  '쉐어하우스',
  '기타 주거',
] as const;
export type HousingType = (typeof HOUSING_TYPES)[number];

/** 관심 분야 — 복수 선택 */
export const INTEREST_CATEGORIES = [
  '생활',
  '돈 관리',
  '장보기',
  '이사·주거',
  '인테리어',
  '자취',
] as const;
export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

/** 분야별 관심 주제 — 각 6개, 화면에는 선택한 분야 것만 보여준다 */
export const INTEREST_TOPICS: Record<InterestCategory, readonly string[]> = {
  생활: ['분리수거 요령', '욕실·주방 청소', '세탁 관리', '생활용품 관리', '날씨·외출 팁', '1인 가구 살림템'],
  '돈 관리': ['월세·관리비', '공과금 절약', '고정지출 관리', '생활비 절약', '예산 관리', '월별 지출 체크'],
  장보기: ['장보기 할인', '식재료 보관법', '냉장고 관리', '소용량 식재료', '식비 절약', '간편 요리'],
  '이사·주거': ['이사 준비', '전기·가스 신청', '전입신고', '폐기물 배출', '계약 체크', '집 관리'],
  인테리어: ['원룸 공간 활용', '수납 아이디어', '가구 배치', '홈데코', '조명 활용', '셀프 인테리어'],
  자취: ['자취 꿀팁', '초보 자취 가이드', '혼자 사는 루틴', '자취 실수 방지', '자취 추천템', '자취 경험담'],
};

/** 관심 주제 섹션의 설명 — 지금 보고 있는 분야에 따라 바뀐다 */
export function interestTopicHint(category: InterestCategory): string {
  return `${category}에서 어떤 정보가 궁금하세요?`;
}

export interface LivingProfilePreferences {
  experience: LivingExperience | null;
  housing: HousingType | null;
  /** 관심 분야 — 자취 경험·주거 형태와 같은 단일 선택. 아직 고르지 않았으면 null.
   * '보고 있는 분야' 와 '선택한 분야' 를 따로 두지 않는다 — 둘이 어긋나면
   * 선택이 풀린 버튼에 선택 표시만 남는다. */
  category: InterestCategory | null;
  /** 분야별 관심 주제 — 분야를 바꿔도 각자 유지된다(복수 선택) */
  topics: Record<InterestCategory, string[]>;
}

function emptyTopics(): Record<InterestCategory, string[]> {
  return { 생활: [], '돈 관리': [], 장보기: [], '이사·주거': [], 인테리어: [], 자취: [] };
}

/** 아직 저장한 적이 없을 때의 시작값.
 * 자취 경험·주거 형태는 persona 프로필(personaProfile.ts)이 원본이라 그 값을 받아 채운다 —
 * 관심 분야·주제는 사용자가 직접 고르는 값이라 미리 선택해두지 않는다. */
export function createDefaultLivingProfile(
  base: Partial<Pick<LivingProfilePreferences, 'experience' | 'housing'>> = {},
): LivingProfilePreferences {
  return {
    experience: base.experience ?? null,
    housing: base.housing ?? null,
    category: null,
    topics: emptyTopics(),
  };
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** 저장된 값을 읽는다 — 형식이 깨졌거나 모르는 값은 버리고 기본값으로 채운다.
 * `base` 는 저장값이 없을 때 쓸 persona 기본값이다(사용자가 저장한 값이 항상 우선한다). */
export function loadLivingProfile(
  ownerKey: string,
  base: Partial<Pick<LivingProfilePreferences, 'experience' | 'housing'>> = {},
): LivingProfilePreferences {
  const fallback = createDefaultLivingProfile(base);
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + ownerKey);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Partial<LivingProfilePreferences> & {
      /* 관심 분야가 복수 선택이던 시절의 키 — 이미 저장된 값을 버리지 않고 첫 항목만 받는다 */
      activeCategory?: unknown;
      selectedCategories?: unknown;
    };
    const storedTopics = (stored.topics ?? {}) as Record<string, unknown>;
    const topics = emptyTopics();
    for (const category of INTEREST_CATEGORIES) {
      const list = storedTopics[category];
      if (!Array.isArray(list)) continue;
      topics[category] = INTEREST_TOPICS[category].filter((topic) => list.includes(topic));
    }
    return {
      experience: pick(stored.experience, LIVING_EXPERIENCES),
      housing: pick(stored.housing, HOUSING_TYPES),
      category:
        pick(stored.category, INTEREST_CATEGORIES) ??
        pick(
          Array.isArray(stored.selectedCategories) ? stored.selectedCategories[0] : undefined,
          INTEREST_CATEGORIES,
        ),
      topics,
    };
  } catch {
    return fallback;
  }
}

export function saveLivingProfile(ownerKey: string, preferences: LivingProfilePreferences): boolean {
  try {
    localStorage.setItem(STORAGE_PREFIX + ownerKey, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

/** 이 계정이 저장한 자취 프로필 설정을 지운다 (데모 '처음부터 시작하기' 전용).
 * persona 기본값(personaProfile.ts)은 코드 상수라 지워지지 않고, 다음 진입 때 그 값으로 다시 시작한다. */
export function clearLivingProfile(ownerKey: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + ownerKey);
  } catch {
    /* 삭제 실패는 무시 */
  }
}

/** 홈 개인화용 — 선택한 관심 분야의 관심 주제 목록. 분야를 아직 안 골랐으면 빈 배열 */
export function getSelectedInterestTopics(ownerKey: string): string[] {
  const { category, topics } = loadLivingProfile(ownerKey);
  return category ? topics[category] : [];
}
