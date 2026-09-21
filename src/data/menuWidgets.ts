import type { AppPage, NavigateOptions } from '../navigation/routes';
import type { DemoAccountId } from '../auth/mockUsers';
import type { MenuSizeKey } from './menuWidgetAssets';

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

/** 메뉴 관리와 홈이 함께 사용하는 asset 단위 선택값. */
export interface SelectedMenuWidget {
  assetId: string;
  menuId: string;
  size: MenuSizeKey;
  variant: string;
  order: number;
  /** 홈 4×2 Grid의 시작 슬롯(1~8). 기존 저장값에는 없을 수 있어 로딩 시 계산한다. */
  slot?: number;
  /** 이 메뉴에서 마지막으로 사용한 2×2 variant. 1×1 자동 확장 시에만 참조한다. */
  previous2x2AssetId?: string;
}

/** menuWidgetAssets.ts에 별도 레코드가 없는 기존 1×1 위젯의 안정적인 asset id. */
export const baseMenuWidgetAssetId = (menuId: string): string => `${menuId}-1x1`;

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
  RecentExpense: { label: '최근지출', icon: 'menu-receipt.svg', page: 'money-expense' },
  FixedExpense: { label: '고정비', icon: 'menu-calendar.svg', page: 'money-fixed' },
  EmergencyFund: { label: '비상금', icon: 'menu-wallet.svg', page: 'money-fund' },
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

/** 데모 계정별 최초 MY 메뉴 추천 구성 — 의도된 정적 preset 이다(저장값이 없을 때만 쓴다).
 * 1×1·2×2 모두 계정의 생활 상황에 맞춰 명시적으로 고르고, DEFAULT_MENU_WIDGETS 에서 잘라 쓰지 않는다.
 *   assetId — 2×2 는 menuWidgetAssets.ts 의 에셋 id, 1×1 은 baseMenuWidgetAssetId(menuId)
 *   slot    — 홈 4×2 Grid 의 시작 칸(1~8). 2×2 는 왼쪽 위(1), 1×1 은 남은 칸.
 * 한 menuId 는 크기 하나만 선택할 수 있어서 같은 메뉴의 1×1 과 2×2 를 함께 넣지 않는다. */
export interface PersonaMenuPreset {
  widgets: { assetId: string; slot: number }[];
}

export const PERSONA_MENU_PRESETS: Record<DemoAccountId, PersonaMenuPreset> = {
  /* 서준 — 2주 뒤 이사 예정, 첫 자취 준비 중. 계약·입주 준비와 초기 비용 파악 → 2×2 + 1×1 3개 = 7/8 (슬롯 8 은 비워 둔다) */
  seojun: {
    widgets: [
      { assetId: 'first-home-checklist', slot: 1 },
      { assetId: baseMenuWidgetAssetId('home-care'), slot: 3 },
      { assetId: baseMenuWidgetAssetId('recent-expense'), slot: 4 },
      { assetId: baseMenuWidgetAssetId('fixed-expense'), slot: 7 },
    ],
  },
  /* 하린 — 자취 3년차 원룸. 집 관리와 반복 생활비 → 2×2 + 1×1 2개 = 6/8 */
  harin: {
    widgets: [
      { assetId: 'home-care', slot: 1 },
      { assetId: baseMenuWidgetAssetId('fixed-expense'), slot: 7 },
      { assetId: baseMenuWidgetAssetId('emergency-fund'), slot: 8 },
    ],
  },
  /* 아영 — 직장인, 빌라·투룸. 지출·계좌·혜택으로 비용을 챙기고 집 유지 관리 → 2×2 + 1×1 4개 = 8/8 */
  ayoung: {
    widgets: [
      { assetId: 'recent-expense', slot: 1 },
      { assetId: baseMenuWidgetAssetId('account'), slot: 3 },
      { assetId: baseMenuWidgetAssetId('fixed-expense'), slot: 4 },
      { assetId: baseMenuWidgetAssetId('custom-benefit'), slot: 7 },
      { assetId: baseMenuWidgetAssetId('home-care'), slot: 8 },
    ],
  },
};

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

export function menuWidgetStorageKey(ownerKey: string): string {
  return STORAGE_PREFIX + ownerKey.trim().toLowerCase();
}

/** 저장된 MY 메뉴를 지운다 — 다음 진입 때 계정의 최초 추천 구성(persona preset)으로 다시 시작한다.
 * '처음부터 시작하기'(demoProgress.resetAccountDemo)가 쓴다. */
export function clearMenuWidgets(ownerKey: string): void {
  try {
    localStorage.removeItem(menuWidgetStorageKey(ownerKey));
  } catch {
    /* 삭제 실패는 무시 */
  }
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
    const raw = localStorage.getItem(menuWidgetStorageKey(ownerKey));
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
    localStorage.setItem(menuWidgetStorageKey(ownerKey), JSON.stringify(items));
  } catch {
    /* 저장 실패는 무시 — 이번 세션에서만 바뀐 상태로 동작 */
  }
}

/* ---- 홈 그리드 칸 계산 ----
 * 홈 그리드는 4열이고 위젯은 order 순서대로 CSS grid 자동 배치(sparse)로 놓인다. 각 위젯이 어느 칸에 놓이는지는
 * 저장값이 아니라 order 에서 계산한다(슬롯 색이 이 칸을 따른다). */

export const HOME_GRID_COLUMNS = 4;

interface MenuWidgetPlacement {
  item: SelectedMenuWidget;
  row: number;
  col: number;
  span: 1 | 2;
}

/** order 순서대로 각 위젯이 차지하는 칸을 계산한다 (홈 .menu-grid 의 자동 배치와 같은 규칙) */
export function placeMenuWidgets(items: readonly SelectedMenuWidget[]): MenuWidgetPlacement[] {
  const used = new Set<string>();
  const free = (row: number, col: number, span: number) => {
    for (let r = row; r < row + span; r += 1) {
      for (let c = col; c < col + span; c += 1) if (used.has(`${r},${c}`)) return false;
    }
    return col + span <= HOME_GRID_COLUMNS;
  };
  let cursor = 0;
  return [...items].sort((a, b) => a.order - b.order).map((item) => {
    const span: 1 | 2 = item.size === '2x2' ? 2 : 1;
    const preferred = typeof item.slot === 'number' ? item.slot - 1 : -1;
    let index = preferred >= 0 && free(Math.floor(preferred / HOME_GRID_COLUMNS), preferred % HOME_GRID_COLUMNS, span)
      ? preferred
      : cursor;
    while (!free(Math.floor(index / HOME_GRID_COLUMNS), index % HOME_GRID_COLUMNS, span)) index += 1;
    const row = Math.floor(index / HOME_GRID_COLUMNS);
    const col = index % HOME_GRID_COLUMNS;
    for (let r = row; r < row + span; r += 1) for (let c = col; c < col + span; c += 1) used.add(`${r},${c}`);
    cursor = Math.min(cursor, index);
    return { item, row, col, span };
  });
}
