import type { AppPage, NavigateOptions } from '../navigation/routes';

/* 홈 '내 메뉴'의 위젯 데이터.
 *
 * 홈에 놓인 위젯 하나는 { id, type, size, order } 다 (Figma Widget/1x1 컴포넌트 세트와 같은 구조).
 *   id    — 위젯 인스턴스 고유값. 같은 type 을 여러 개 놓아도 구분되고, 삭제·이동의 키가 된다.
 *   type  — 위젯 종류. 라벨·아이콘·이동 화면은 이 값으로만 정해진다 (MENU_WIDGET_DEFS).
 *   size  — 지금은 '1x1' 뿐. 2x2 등이 생기면 여기에 값을 더하고 렌더링만 size 로 나눈다.
 *   order — 홈에서의 배치 순서 (1부터).
 *
 * Slot(자리)은 위젯 데이터에 저장하지 않는다. order 에서 화면이 계산하는 위치이고,
 * 위젯 컬러도 type 이 아니라 이 자리(order)를 따른다 → slotColorOf().
 * 그래서 위젯을 추가·삭제·재정렬해 order 만 다시 매기면 색은 자리에 맞게 저절로 따라온다. */

export type MenuWidgetType =
  | 'FirstHome' | 'HomeCare'
  | 'RecentExpense' | 'FixedExpense' | 'EmergencyFund'
  | 'LivingTip' | 'LocalReview' | 'WritePost'
  | 'Benefit'
  | 'LivingLevel' | 'MyActivity';

/** 지금은 1x1 만 있다. 2x2 를 만들 때 '1x1' | '2x2' 로 넓힌다. */
export type MenuWidgetSize = '1x1';

export interface MenuWidgetItem {
  id: string;
  type: MenuWidgetType;
  size: MenuWidgetSize;
  order: number;
}

interface MenuWidgetDef {
  label: string;
  /** public/assets/icon/ 아래 파일명 — 화면에서는 lib/asset 의 icon() 으로만 참조한다 */
  icon: string;
  /** 눌렀을 때 이동할 화면 */
  page: AppPage;
  options?: NavigateOptions;
}

export const MENU_WIDGET_DEFS: Record<MenuWidgetType, MenuWidgetDef> = {
  FirstHome: { label: '첫자취', icon: 'menu-truck.svg', page: 'life-first' },
  HomeCare: { label: '홈케어', icon: 'menu-broom.svg', page: 'life-homecare' },
  RecentExpense: { label: '최근지출', icon: 'menu-receipt.svg', page: 'money', options: { tab: '수입·지출' } },
  FixedExpense: { label: '고정비', icon: 'menu-calendar.svg', page: 'money', options: { tab: '고정비' } },
  EmergencyFund: { label: '비상금', icon: 'menu-wallet.svg', page: 'money', options: { tab: '비상금' } },
  LivingTip: { label: '자취꿀팁', icon: 'menu-tip.svg', page: 'community-tip' },
  LocalReview: { label: '지역후기', icon: 'menu-location.svg', page: 'community-region' },
  WritePost: { label: '글쓰기', icon: 'community-pencil.svg', page: 'community' },
  Benefit: { label: '혜택', icon: 'menu-gift.svg', page: 'benefits' },
  LivingLevel: { label: '자취레벨', icon: 'menu-plum.svg', page: 'mission' },
  MyActivity: { label: '나의 활동', icon: 'community-book.svg', page: 'saved' },
};

/** 위젯 컬러 종류 수 — 홈 '내 메뉴' 확정 팔레트 8종(styles/home.css .menu-slot--1~8) */
export const SLOT_COLOR_COUNT = 8;

/** order 번째 자리의 컬러 번호(1~8). 8개를 넘으면 처음부터 반복한다. */
export function slotColorOf(order: number): number {
  return ((order - 1) % SLOT_COLOR_COUNT) + 1;
}

/** 홈 '내 메뉴'의 기본 위젯 — 4열 × 2줄 = 8개. 사용자가 위젯 편집 화면에서 추가·삭제하면
 * 개수는 달라질 수 있고, 그 저장값이 생기면 이 초기값을 대체한다. */
export const DEFAULT_MENU_WIDGETS: MenuWidgetItem[] = [
  { id: 'menu-first-home', type: 'FirstHome', size: '1x1', order: 1 },
  { id: 'menu-home-care', type: 'HomeCare', size: '1x1', order: 2 },
  { id: 'menu-recent-expense', type: 'RecentExpense', size: '1x1', order: 3 },
  { id: 'menu-fixed-expense', type: 'FixedExpense', size: '1x1', order: 4 },
  { id: 'menu-emergency-fund', type: 'EmergencyFund', size: '1x1', order: 5 },
  { id: 'menu-living-tip', type: 'LivingTip', size: '1x1', order: 6 },
  { id: 'menu-local-review', type: 'LocalReview', size: '1x1', order: 7 },
  { id: 'menu-benefit', type: 'Benefit', size: '1x1', order: 8 },
];

/* ---- 편집(삭제·재정렬)과 저장 ----
 * 홈에서 위젯을 지우거나 순서를 바꾸면 { id, type, size, order } 배열만 바뀐다.
 * order 는 항상 1..n 으로 다시 매기고, 저장도 이 배열 하나뿐이다(별도의 배치 상태 없음). */

/** order 순으로 정렬하고 order 를 1..n 으로 다시 매긴다 */
export function normalizeMenuOrder(items: MenuWidgetItem[]): MenuWidgetItem[] {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
}

/** 위젯 하나를 지우고 남은 위젯을 앞쪽부터 다시 정렬한다 */
export function removeMenuWidget(items: MenuWidgetItem[], id: string): MenuWidgetItem[] {
  return normalizeMenuOrder(items.filter((item) => item.id !== id));
}

/** ids 순서대로 위젯을 다시 배치한다 (ids 에 없는 위젯은 뒤에 원래 순서로 붙는다) */
export function reorderMenuWidgets(items: MenuWidgetItem[], ids: string[]): MenuWidgetItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = ids.flatMap((id) => byId.get(id) ?? []);
  const rest = normalizeMenuOrder(items).filter((item) => !ids.includes(item.id));
  return [...ordered, ...rest].map((item, index) => ({ ...item, order: index + 1 }));
}

/* 홈 위젯 배치는 사용자(ownerKey)별로 localStorage 에 저장한다 — livingProfile.ts 와 같은 방식.
 * 화면에서 localStorage 를 직접 부르지 않고 아래 두 함수만 쓴다. */
const STORAGE_PREFIX = 'jaduya.menuWidgets.';

function storageKey(ownerKey: string): string {
  return STORAGE_PREFIX + ownerKey.trim().toLowerCase();
}

function isMenuWidgetItem(value: unknown): value is MenuWidgetItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MenuWidgetItem>;
  return (
    typeof item.id === 'string'
    && typeof item.order === 'number'
    && item.size === '1x1'
    && typeof item.type === 'string'
    && Object.prototype.hasOwnProperty.call(MENU_WIDGET_DEFS, item.type)
  );
}

/** 저장된 배치를 읽는다. 저장한 적이 없거나 값이 깨져 있으면 기본 8개.
 * 전부 지운 상태(빈 배열)도 저장값으로 그대로 돌려준다. */
export function loadMenuWidgets(ownerKey: string): MenuWidgetItem[] {
  try {
    const raw = localStorage.getItem(storageKey(ownerKey));
    if (raw === null) return DEFAULT_MENU_WIDGETS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_MENU_WIDGETS;
    const seen = new Set<string>();
    const valid = parsed.filter((item): item is MenuWidgetItem => {
      if (!isMenuWidgetItem(item) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return normalizeMenuOrder(valid);
  } catch {
    return DEFAULT_MENU_WIDGETS;
  }
}

export function saveMenuWidgets(ownerKey: string, items: MenuWidgetItem[]): void {
  try {
    localStorage.setItem(storageKey(ownerKey), JSON.stringify(items));
  } catch {
    /* 저장 실패는 무시 — 이번 세션에서만 바뀐 상태로 동작 */
  }
}
