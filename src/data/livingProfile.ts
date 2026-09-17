/* 마이페이지 > 자취 프로필 설정값 — Figma node 1565:7326.
 *
 * 백엔드가 없으므로 lifeEat.ts 와 같은 방식으로 localStorage 에 사용자(ownerKey)별로
 * 저장한다. 화면에서 localStorage 를 직접 부르지 않고 이 파일의 함수만 쓴다.
 *
 * 홈 개인화는 다음 작업에서 연결한다 — 그때는 getSelectedInterestTopics(ownerKey) /
 * loadLivingProfile(ownerKey) 만 읽으면 된다.
 */

const STORAGE_PREFIX = 'jaduya.livingProfile.';

/** ownerKey(대부분 이메일)를 한 형태로 통일한다 — 호출하는 화면마다 trim/lowercase 를
 * 따로 하거나 안 해서(Home/MyPage/AIChat 는 원본 그대로, DiscoverySection 만
 * trim+lowercase) 같은 계정인데 다른 localStorage 키로 갈리는 문제가 있었다. 이제는
 * 어디서 어떤 형태로 넘기든 이 파일 안에서만 정규화한다 — 호출부는 신경 쓰지 않아도 된다. */
function normalizeOwnerKey(ownerKey: string): string {
  return ownerKey.trim().toLowerCase();
}

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

/** 관심 분야로 고를 수 있는 최대 개수 — 이 이상은 '+ 관심 분야 추가'가 사라진다 */
export const MAX_INTEREST_CATEGORIES = 2;

export interface LivingProfilePreferences {
  experience: LivingExperience | null;
  housing: HousingType | null;
  /** 관심 분야 — 최대 MAX_INTEREST_CATEGORIES(2)개, 고른 순서 그대로 담는다
   * (배열의 첫 항목이 처음 고른 분야다 — 탭 순서·홈 추천의 기준 분야로 쓴다).
   * 아직 하나도 안 골랐으면 빈 배열. */
  categories: InterestCategory[];
  /** 분야별 관심 주제 — 분야를 바꿔도(혹은 두 번째 분야를 추가해도) 각자 독립적으로
   * 유지된다(분야마다 복수 선택) */
  topics: Record<InterestCategory, string[]>;
}

export interface OnboardingRecommendationInput {
  interests: string[];
  stage: string;
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
    categories: [],
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
    const normalizedKey = normalizeOwnerKey(ownerKey);
    let raw = localStorage.getItem(STORAGE_PREFIX + normalizedKey);
    /* 정규화 전에 저장된 값이 있을 수 있다(예: 대문자가 섞인 이메일로 저장된 적이 있는
     * 계정) — 정규화된 키에 아직 없으면 원래 형태 그대로의 키도 한 번 더 찾아보고,
     * 찾으면 정규화된 키로 옮겨 써서 다음부터는 항상 같은 키를 쓰게 한다(값을 잃지
     * 않는 마이그레이션, 원래 키는 지우지 않는다). */
    if (!raw && normalizedKey !== ownerKey) {
      const legacyRaw = localStorage.getItem(STORAGE_PREFIX + ownerKey);
      if (legacyRaw) {
        raw = legacyRaw;
        try {
          localStorage.setItem(STORAGE_PREFIX + normalizedKey, legacyRaw);
        } catch {
          /* 옮겨 쓰기 실패는 무시 — 이번 읽기는 legacyRaw 로 정상 진행된다 */
        }
      }
    }
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Partial<LivingProfilePreferences> & {
      /* 관심 분야가 단일 선택(문자열 하나)이던 시절의 키 — 이미 저장된 값을 버리지 않고
       * 배열의 첫 항목으로 이어받는다 */
      category?: unknown;
      /* 그보다도 더 예전, 복수 선택이던 시절의 키 — 유효한 값만 앞에서부터 받는다 */
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
    /* categories(신규) → category(단일 선택 시절) → selectedCategories(그 이전) 순으로
     * 첫 번째로 유효하게 읽히는 형태를 쓴다. 중복은 제거하고 최대 개수로 자른다. */
    const categoriesSource: unknown = Array.isArray(stored.categories)
      ? stored.categories
      : stored.category !== undefined
        ? [stored.category]
        : (stored.selectedCategories ?? []);
    const categories: InterestCategory[] = [];
    if (Array.isArray(categoriesSource)) {
      for (const value of categoriesSource) {
        const category = pick(value, INTEREST_CATEGORIES);
        if (category && !categories.includes(category)) categories.push(category);
        if (categories.length >= MAX_INTEREST_CATEGORIES) break;
      }
    }
    return {
      experience: pick(stored.experience, LIVING_EXPERIENCES),
      housing: pick(stored.housing, HOUSING_TYPES),
      categories,
      topics,
    };
  } catch {
    return fallback;
  }
}

/** 아직 없는 분야면 골라진 순서 뒤에 추가한다 — 이미 있거나 이미 최대치(2개)면
 * 그대로 둔다(불변). 홈 시트·마이페이지 두 곳이 관심 분야를 고르는 로직을 각자
 * 복붙하지 않고 여기 하나만 쓴다. */
export function addInterestCategory(
  categories: InterestCategory[],
  category: InterestCategory,
): InterestCategory[] {
  if (categories.includes(category) || categories.length >= MAX_INTEREST_CATEGORIES) return categories;
  return [...categories, category];
}

/** 두 번째로 추가한 분야를 뺀다(불변) — 관심 분야는 항상 최소 1개를 유지해야 하므로
 * 1개만 남았을 때는 그대로 둔다(첫 분야는 이 함수로 빼지 않는다 — 호출부인
 * InterestPicker 도 첫 분야에는 제거 버튼을 두지 않는다). 주제 선택값(topics)은
 * 건드리지 않는다 — 같은 분야를 나중에 다시 추가하면 이전에 고른 주제가 그대로
 * 돌아온다. */
export function removeInterestCategory(
  categories: InterestCategory[],
  category: InterestCategory,
): InterestCategory[] {
  if (categories.length <= 1) return categories;
  return categories.filter((item) => item !== category);
}

/** 특정 분야의 관심 주제 하나를 켜고 끈다(불변) — 다른 분야의 선택에는 영향이 없다. */
export function toggleInterestTopic(
  topics: Record<InterestCategory, string[]>,
  category: InterestCategory,
  topic: string,
): Record<InterestCategory, string[]> {
  const current = topics[category] ?? [];
  return {
    ...topics,
    [category]: current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
  };
}

export function saveLivingProfile(ownerKey: string, preferences: LivingProfilePreferences): boolean {
  try {
    localStorage.setItem(STORAGE_PREFIX + normalizeOwnerKey(ownerKey), JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

/** 온보딩의 넓은 관심 분야를 기존 추천 설정의 최대 2개 분야로 연결한다.
 * 선택하지 않은 분야는 추가하지 않고, 같은 추천 분야로 겹치면 한 번만 사용한다. */
const ONBOARDING_INTEREST_CATEGORY: Readonly<Record<string, InterestCategory>> = {
  '자취 준비': '이사·주거',
  '음식 · 장보기': '장보기',
  '생활 꿀팁': '생활',
  '돈 관리': '돈 관리',
  인테리어: '인테리어',
  '동네 · 커뮤니티': '자취',
};

const ONBOARDING_STAGE_TOPICS: Readonly<Record<string, Record<InterestCategory, readonly string[]>>> = {
  '자취 준비 중': {
    생활: ['1인 가구 살림템', '생활용품 관리'],
    '돈 관리': ['예산 관리', '월세·관리비'],
    장보기: ['소용량 식재료', '식비 절약'],
    '이사·주거': ['계약 체크', '이사 준비'],
    인테리어: ['가구 배치', '원룸 공간 활용'],
    자취: ['초보 자취 가이드', '자취 실수 방지'],
  },
  '자취를 막 시작했어요': {
    생활: ['분리수거 요령', '생활용품 관리'],
    '돈 관리': ['공과금 절약', '월세·관리비'],
    장보기: ['장보기 할인', '간편 요리'],
    '이사·주거': ['전입신고', '전기·가스 신청'],
    인테리어: ['수납 아이디어', '원룸 공간 활용'],
    자취: ['초보 자취 가이드', '자취 꿀팁'],
  },
  '자취에 조금 익숙해졌어요': {
    생활: ['욕실·주방 청소', '세탁 관리'],
    '돈 관리': ['생활비 절약', '월별 지출 체크'],
    장보기: ['식재료 보관법', '냉장고 관리'],
    '이사·주거': ['집 관리', '폐기물 배출'],
    인테리어: ['원룸 공간 활용', '셀프 인테리어'],
    자취: ['혼자 사는 루틴', '자취 꿀팁'],
  },
};

/** 저장된 추천 설정이 없을 때만 온보딩 선택으로 최소 초기값을 만든다.
 * categories가 하나라도 있으면 사용자가 이미 저장한 값으로 보고 절대 덮어쓰지 않는다. */
export function initializeLivingProfileFromOnboarding(
  ownerKey: string,
  base: Partial<Pick<LivingProfilePreferences, 'experience' | 'housing'>>,
  onboarding: OnboardingRecommendationInput | null | undefined,
): LivingProfilePreferences {
  const current = loadLivingProfile(ownerKey, base);
  if (current.categories.length > 0 || !onboarding) return current;

  const categories: InterestCategory[] = [];
  for (const interest of onboarding.interests) {
    const category = ONBOARDING_INTEREST_CATEGORY[interest];
    if (category && !categories.includes(category)) categories.push(category);
    if (categories.length >= MAX_INTEREST_CATEGORIES) break;
  }
  if (categories.length === 0) return current;

  const stageTopics = ONBOARDING_STAGE_TOPICS[onboarding.stage];
  const topics = { ...current.topics };
  for (const category of categories) {
    topics[category] = [...(stageTopics?.[category] ?? INTEREST_TOPICS[category].slice(0, 1))];
  }

  const initialized = { ...current, categories, topics };
  saveLivingProfile(ownerKey, initialized);
  return initialized;
}

/** 이 계정이 저장한 자취 프로필 설정을 지운다 (데모 '처음부터 시작하기' 전용).
 * persona 기본값(personaProfile.ts)은 코드 상수라 지워지지 않고, 다음 진입 때 그 값으로 다시 시작한다.
 * 정규화 전 키에 남아있을 수 있는 값도 함께 지운다(마이그레이션 이전 계정 대비). */
export function clearLivingProfile(ownerKey: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + normalizeOwnerKey(ownerKey));
    localStorage.removeItem(STORAGE_PREFIX + ownerKey);
  } catch {
    /* 삭제 실패는 무시 */
  }
}

/** 홈 개인화용 — 처음 고른(기준) 관심 분야의 관심 주제 목록. 분야를 아직 안 골랐으면 빈 배열.
 * 두 번째 분야를 추가해도 이 함수가 다루는 홈 개인화 기준은 바뀌지 않는다(첫 분야 그대로). */
export function getSelectedInterestTopics(ownerKey: string): string[] {
  const { categories, topics } = loadLivingProfile(ownerKey);
  const category = categories[0];
  return category ? topics[category] : [];
}
