/* 생활 > 먹거리 데이터. Figma daily_eat (3084:23495).
 *
 * 기본 재료·레시피·보관 팁은 Figma 예시를 유지한다.
 * 현재 남은 재료와 수정한 기한을 계정별로 이 브라우저에 저장한다. */

export type IngredientKey = 'tofu' | 'milk' | 'egg';

export interface FridgeItem {
  id: string;
  name: string;
  /** 수량 — "반 모" 처럼 단어면 SUIT, "500ml" 처럼 숫자+단위면 Asta Sans로 렌더링한다 */
  amount: string;
  amountIsNumeric: boolean;
  storage: string;
  ddayLabel: string;
  /** 사용자가 입력한 기한. 시간대 없는 현지 달력 날짜(YYYY-MM-DD). */
  useByDate?: string;
  ingredientKey?: IngredientKey;
}

export const FRIDGE_ITEMS: FridgeItem[] = [
  {
    id: 'tofu',
    name: '두부',
    amount: '반 모',
    amountIsNumeric: false,
    storage: '냉장 보관 중',
    ddayLabel: 'D - 1',
  },
  {
    id: 'milk',
    name: '우유',
    amount: '500ml',
    amountIsNumeric: true,
    storage: '냉장 보관 중',
    ddayLabel: 'D - 2',
  },
];

export type FridgeStorageMethod = '냉장' | '냉동' | '실온';

export interface NewFridgeItemInput {
  name: string;
  amount: string;
  storageMethod: FridgeStorageMethod;
  useByDate?: string;
}

const INGREDIENT_STORAGE_PREFIX = 'jaduya.life-eat.ingredients.v1:';
const ACTIVE_STORAGE_PREFIX = 'jaduya.life-eat.active.v2:';
const DAY_MS = 86_400_000;

const INGREDIENT_ALIASES: Record<IngredientKey, readonly string[]> = {
  tofu: ['두부', 'tofu'],
  milk: ['우유', 'milk'],
  egg: ['계란', '달걀', 'egg', 'eggs'],
};

function normalizeIngredientName(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
}

export function ingredientKeyFor(item: FridgeItem): IngredientKey | null {
  if (item.ingredientKey) return item.ingredientKey;
  if (item.id === 'tofu' || item.id === 'milk' || item.id === 'egg') return item.id;
  const name = normalizeIngredientName(item.name);
  return (Object.keys(INGREDIENT_ALIASES) as IngredientKey[]).find((key) =>
    INGREDIENT_ALIASES[key].some((alias) => normalizeIngredientName(alias) === name),
  ) ?? null;
}

export function localDateString(date = new Date()): string {
  if (!Number.isFinite(date.getTime())) return '';
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 실제로 존재하는 날짜만 받는다. 2월 30일 등의 자동 이월을 허용하지 않는다. */
function dateDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
    ? time / DAY_MS
    : null;
}

export function isValidConsumeDate(value: string): boolean {
  return dateDay(value) !== null;
}

export function fridgeItemDaysRemaining(item: FridgeItem, now = new Date()): number | null {
  if (item.useByDate !== undefined) {
    const dueDay = dateDay(item.useByDate);
    if (dueDay === null || !Number.isFinite(now.getTime())) return null;
    // 현지 연·월·일을 UTC 달력에 옮겨, 서머타임의 23/25시간 하루 영향을 없앤다.
    const today = new Date(0);
    today.setUTCFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    return dueDay - today.getTime() / DAY_MS;
  }
  if (/^D-day$/i.test(item.ddayLabel)) return 0;
  const legacy = /^D\s*-\s*(\d+)$/i.exec(item.ddayLabel);
  if (!legacy) return null;
  const days = Number(legacy[1]);
  return Number.isSafeInteger(days) ? days : null;
}

export function fridgeItemDdayLabel(item: FridgeItem, now = new Date()): string {
  const days = fridgeItemDaysRemaining(item, now);
  if (days === null) return '기한 미입력';
  if (days === 0) return 'D-day';
  return days > 0 ? `D - ${days}` : `${Math.abs(days)}일 지남`;
}

/** 활성 목록에서 가장 이른 기한을 고른다. 같은 기한과 미입력끼리는 입력 순서를 유지한다. */
export function mostUrgentFridgeItem(items: readonly FridgeItem[], now = new Date()): FridgeItem | null {
  let mostUrgent: FridgeItem | null = null;
  let earliestDay = Infinity;
  for (const item of items) {
    const days = fridgeItemDaysRemaining(item, now) ?? Infinity;
    if (mostUrgent === null || days < earliestDay) {
      mostUrgent = item;
      earliestDay = days;
    }
  }
  return mostUrgent;
}

export function createFridgeItem(input: NewFridgeItemInput): FridgeItem {
  const amount = input.amount.trim();
  const useByDate = input.useByDate?.trim();
  const item: FridgeItem = {
    id: `ingredient-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`,
    name: input.name.trim(),
    amount,
    amountIsNumeric: /^\d+(?:[.,]\d+)?\s*(?:[a-zA-Z]+|개|모|봉|봉지|팩|통|병|캔|장|알|줄|단|묶음|인분|그램|킬로그램|밀리리터|리터)?$/.test(amount),
    storage: `${input.storageMethod} 보관 중`,
    ddayLabel: '기한 미입력',
    ...(useByDate && dateDay(useByDate) !== null ? { useByDate } : {}),
  };
  const ingredientKey = ingredientKeyFor(item);
  return {
    ...item,
    ...(ingredientKey ? { ingredientKey } : {}),
    ddayLabel: fridgeItemDdayLabel(item),
  };
}

function isFridgeItem(value: unknown): value is FridgeItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' && item.id.trim().length > 0 &&
    typeof item.name === 'string' && item.name.trim().length > 0 &&
    typeof item.amount === 'string' && item.amount.trim().length > 0 &&
    typeof item.amountIsNumeric === 'boolean' &&
    (item.storage === '냉장 보관 중' || item.storage === '냉동 보관 중' || item.storage === '실온 보관 중') &&
    typeof item.ddayLabel === 'string' && item.ddayLabel.trim().length > 0 &&
    (item.useByDate === undefined || (typeof item.useByDate === 'string' && dateDay(item.useByDate) !== null)) &&
    (item.ingredientKey === undefined || item.ingredientKey === 'tofu' || item.ingredientKey === 'milk' || item.ingredientKey === 'egg')
  );
}

export function loadAddedFridgeItems(ownerKey: string): FridgeItem[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(INGREDIENT_STORAGE_PREFIX + ownerKey) ?? '[]');
    if (!Array.isArray(stored)) return [];
    const seen = new Set(FRIDGE_ITEMS.map((item) => item.id));
    return stored.filter((item): item is FridgeItem => {
      if (!isFridgeItem(item) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } catch {
    return [];
  }
}

export function saveAddedFridgeItems(ownerKey: string, items: readonly FridgeItem[]): boolean {
  try {
    if (!items.every(isFridgeItem)) return false;
    const seen = new Set(FRIDGE_ITEMS.map((item) => item.id));
    const added = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    localStorage.setItem(INGREDIENT_STORAGE_PREFIX + ownerKey, JSON.stringify(added));
    return true;
  } catch {
    return false;
  }
}

/** 첫 표시일에만 Figma의 D-1/D-2를 실제 날짜로 고정한다. */
export function createDefaultFridgeItems(now = new Date()): FridgeItem[] {
  const today = dateDay(localDateString(now));
  return FRIDGE_ITEMS.map((item) => {
    const days = fridgeItemDaysRemaining(item, now);
    const ingredientKey = ingredientKeyFor(item);
    const useByDate = today !== null && days !== null
      ? new Date((today + days) * DAY_MS).toISOString().slice(0, 10)
      : undefined;
    return {
      ...item,
      ...(useByDate && isValidConsumeDate(useByDate) ? { useByDate } : {}),
      ...(ingredientKey ? { ingredientKey } : {}),
    };
  });
}

function uniqueFridgeItems(values: readonly unknown[]): FridgeItem[] {
  const seen = new Set<string>();
  return values.filter((item): item is FridgeItem => {
    if (!isFridgeItem(item) || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).map((item) => ({ ...item }));
}

/** 빈 배열도 완료된 목록이다. v2가 있으면 기본 재료를 다시 끼워 넣지 않는다. */
export function loadFridgeItems(ownerKey: string, now = new Date()): FridgeItem[] {
  let active: string | null;
  try {
    active = localStorage.getItem(ACTIVE_STORAGE_PREFIX + ownerKey);
  } catch {
    // 저장 기능을 쓸 수 없어도 현재 화면에서는 재료를 관리할 수 있다.
    return createDefaultFridgeItems(now);
  }
  if (active !== null) {
    try {
      const stored: unknown = JSON.parse(active);
      return Array.isArray(stored) ? uniqueFridgeItems(stored) : [];
    } catch {
      // 손상된 v2를 초기 목록으로 덮어쓰거나, 소비한 기본 재료를 부활시키지 않는다.
      return [];
    }
  }
  const initial = [...createDefaultFridgeItems(now), ...loadAddedFridgeItems(ownerKey)];
  saveFridgeItems(ownerKey, initial);
  return initial;
}

export function saveFridgeItems(ownerKey: string, items: readonly FridgeItem[]): boolean {
  try {
    if (!items.every(isFridgeItem)) return false;
    localStorage.setItem(ACTIVE_STORAGE_PREFIX + ownerKey, JSON.stringify(uniqueFridgeItems(items)));
    return true;
  } catch {
    return false;
  }
}

export interface Recipe {
  id: string;
  /** public/assets/img/life 안의 파일명 */
  image: string;
  title: string;
  tags: [string, string];
  usedIngredientKeys: readonly IngredientKey[];
  time: string;
  ingredients: readonly string[];
  steps: readonly string[];
}

export const RECIPES: Recipe[] = [
  {
    id: 'tofu-rice', image: 'life-recipe-tofu-rice.png', title: '두부 덮밥', tags: ['10분', '두부 활용'],
    usedIngredientKeys: ['tofu'],
    time: '10분',
    ingredients: ['두부 반 모', '밥 1공기', '간장 1큰술', '참기름 약간', '김가루 또는 깨 선택'],
    steps: [
      '두부를 먹기 좋은 크기로 잘라요.',
      '팬에 기름을 아주 조금 두르고 두부 표면을 가볍게 구워요.',
      '밥 위에 두부를 올리고 간장과 참기름을 더해요.',
      '김가루나 깨가 있다면 마지막에 뿌려 마무리해요.',
    ],
  },
  {
    id: 'egg-rice', image: 'life-recipe-egg-rice.png', title: '계란 볶음밥', tags: ['10분', '계란 활용'],
    usedIngredientKeys: ['egg'],
    time: '10분',
    ingredients: ['밥 1공기', '계란 1~2개', '대파 또는 남은 채소', '간장 약간', '식용유'],
    steps: [
      '팬에 기름을 두르고 대파나 남은 채소를 먼저 볶아요.',
      '계란을 넣고 가볍게 익혀요.',
      '밥을 넣어 재료와 고르게 섞어 볶아요.',
      '간장을 조금 넣어 간을 맞춰요.',
    ],
  },
  {
    id: 'french-toast',
    image: 'life-recipe-french-toast.png',
    title: '프렌치 토스트',
    tags: ['5분', '우유 활용'],
    usedIngredientKeys: ['milk', 'egg'],
    time: '5~10분',
    ingredients: ['식빵 1~2장', '우유', '계란 1개', '설탕 약간', '버터 또는 식용유'],
    steps: [
      '계란과 우유를 섞어요.',
      '식빵을 계란물에 앞뒤로 적셔요.',
      '팬에 버터나 기름을 두르고 약불에서 앞뒤로 구워요.',
      '기호에 따라 설탕이나 시럽을 더해요.',
    ],
  },
];

export function recipeUsesIngredient(recipe: Recipe, item: FridgeItem): boolean {
  const key = ingredientKeyFor(item);
  return key !== null && recipe.usedIngredientKeys.includes(key);
}

export interface StorageTip {
  ingredientId: string;
  eyebrow: string;
  quote: string;
  description: string;
}

/** 선택 전에는 원래 Figma의 대파 카드를 표시한다. 인용 부호는 화면에서 붙인다. */
export const DEFAULT_STORAGE_TIP: Readonly<StorageTip> = {
  ingredientId: 'green-onion',
  eyebrow: '대파 보관 방법',
  quote: '금방 물러버리던 대파가 이 방법으로 훨씬 오래 갔어요.',
  description: '대파를 썰어 물기를 충분히 제거하고,\n밀폐용기에 담아 식용유를 살짝 섞은 뒤 냉동 보관해요.',
};

type ExtraStorageTipKey = 'bread' | 'green-onion';
type StorageTipKey = IngredientKey | ExtraStorageTipKey;

const STORAGE_TIPS: Record<StorageTipKey, Readonly<StorageTip>> = {
  'green-onion': DEFAULT_STORAGE_TIP,
  tofu: {
    ingredientId: 'tofu',
    eyebrow: '두부 보관 방법',
    quote: '남은 두부도 물만 잘 갈아주면 조금 더 신선하게 보관할 수 있어요.',
    description: '개봉한 두부는 깨끗한 물과 함께 밀폐용기에 담아 냉장 보관해요.\n가능하면 매일 물을 갈아주고, 냄새나 색이 달라졌다면 상태를 확인해요.',
  },
  milk: {
    ingredientId: 'milk',
    eyebrow: '우유 보관 방법',
    quote: '냉장고 문보다 안쪽에 두면 온도 변화가 적어 더 안정적으로 보관할 수 있어요.',
    description: '우유는 냉장고 문쪽보다 안쪽 선반에 보관해요.\n사용한 뒤에는 바로 냉장고에 넣고 개봉 후에는 가능한 빨리 소비해요.',
  },
  egg: {
    ingredientId: 'egg',
    eyebrow: '계란 보관 방법',
    quote: '온도 변화가 적은 곳에 보관하면 조금 더 안정적으로 두고 먹을 수 있어요.',
    description: '계란은 냉장고 문보다 안쪽에 보관해요.\n깨진 계란은 다른 계란과 분리하고 사용 전에 상태를 먼저 확인해요.',
  },
  bread: {
    ingredientId: 'bread',
    eyebrow: '식빵 보관 방법',
    quote: '바로 먹지 않을 식빵은 냉동해두면 식감 변화를 줄일 수 있어요.',
    description: '한 번 먹을 양만큼 나눠 밀폐한 뒤 냉동 보관해요.\n먹기 전 자연 해동하거나 토스터로 바로 데워도 좋아요.',
  },
};

/** 보관법만 지원하는 별칭이다. 레시피 추천·소비 관계에는 추가하지 않는다. */
const EXTRA_STORAGE_TIP_ALIASES: Record<ExtraStorageTipKey, readonly string[]> = {
  bread: ['식빵', '토스트빵', 'bread', 'white bread', 'sliced bread'],
  'green-onion': ['대파', 'green onion', 'green onions', 'spring onion', 'scallion', 'scallions'],
};

export function storageTipForIngredient(item: FridgeItem | null): StorageTip {
  if (!item) return { ...DEFAULT_STORAGE_TIP };
  const name = normalizeIngredientName(item.name);
  const key = ingredientKeyFor(item) ??
    (Object.keys(EXTRA_STORAGE_TIP_ALIASES) as ExtraStorageTipKey[]).find((candidate) =>
      item.id === candidate || EXTRA_STORAGE_TIP_ALIASES[candidate].some((alias) =>
        normalizeIngredientName(alias) === name,
      ),
    );
  if (key) return { ...STORAGE_TIPS[key], ingredientId: item.id };
  return {
    ingredientId: item.id,
    eyebrow: `${item.name} 보관 방법`,
    quote: '포장지의 보관 방법과 소비기한을 먼저 확인해요.',
    description: '개봉 후에는 밀폐해 권장 보관 위치에 두고,\n상태를 확인하면서 가능한 빨리 소비하는 것이 좋아요.',
  };
}
