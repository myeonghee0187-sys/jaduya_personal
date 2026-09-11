/* 생활 > 먹거리 데이터. Figma daily_eat (3084:23495).
 *
 * 이 화면은 검색 입력이 없는 큐레이션 화면이라(살림의 "버릴 물건 검색"과 다름),
 * Figma가 보여주는 예시를 그대로 옮긴다 — 임의로 항목을 더 채우지 않는다. */

export interface FridgeItem {
  id: string;
  name: string;
  /** 수량 — "반 모" 처럼 단어면 SUIT, "500ml" 처럼 숫자+단위면 Asta Sans로 렌더링한다 */
  amount: string;
  amountIsNumeric: boolean;
  storage: string;
  ddayLabel: string;
}

export const FRIDGE_ITEMS: FridgeItem[] = [
  {
    id: 'tofu',
    name: '두부',
    amount: '반 모',
    amountIsNumeric: false,
    storage: '냉장 보관 중',
    ddayLabel: 'D-1',
  },
  {
    id: 'milk',
    name: '우유',
    amount: '500ml',
    amountIsNumeric: true,
    storage: '냉장 보관 중',
    ddayLabel: 'D-2',
  },
];

export interface Recipe {
  id: string;
  /** public/assets/img/life 안의 파일명 */
  image: string;
  title: string;
  tags: [string, string];
}

export const RECIPES: Recipe[] = [
  { id: 'tofu-rice', image: 'life-recipe-tofu-rice.png', title: '두부 덮밥', tags: ['10분', '두부 활용'] },
  { id: 'egg-rice', image: 'life-recipe-egg-rice.png', title: '계란 볶음밥', tags: ['10분', '계란 활용'] },
  {
    id: 'french-toast',
    image: 'life-recipe-french-toast.png',
    title: '프렌치 토스트',
    tags: ['5분', '우유 활용'],
  },
];

export interface KeepTip {
  meta: string;
  quoteLines: [string, string];
  bodyLines: [string, string];
}

export const KEEP_TIP: KeepTip = {
  meta: '대파 보관 방법',
  quoteLines: ['“ 금방 물러버리던 대파가', '이 방법으로 훨씬 오래 갔어요. ”'],
  bodyLines: [
    '대파를 썰어 물기를 충분히 제거하고,',
    '밀폐용기에 담아 식용유를 살짝 섞은 뒤 냉동 보관해요.',
  ],
};
