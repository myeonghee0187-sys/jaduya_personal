import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getDemoAccountId } from '../auth/mockUsers';
import { MENU_CATALOG } from '../data/menuCatalog';
import { MENU_WIDGET_ASSETS } from '../data/menuWidgetAssets';
import type { MenuSizeKey } from '../data/menuWidgetAssets';
import {
  DEFAULT_MENU_WIDGETS,
  MENU_WIDGET_DEFS,
  PERSONA_MENU_PRESETS,
  baseMenuWidgetAssetId,
  menuWidgetStorageKey,
  placeMenuWidgets,
} from '../data/menuWidgets';
import type { MenuWidgetItem, MenuWidgetType, SelectedMenuWidget } from '../data/menuWidgets';

const catalogItems = MENU_CATALOG.flatMap((section) => section.items);
const catalogById = new Map(catalogItems.map((menu) => [menu.id, menu]));
const catalogByWidgetType = new Map(
  catalogItems.flatMap((menu) => (menu.widgetType ? [[menu.widgetType, menu] as const] : [])),
);
const assetsById = new Map(MENU_WIDGET_ASSETS.map((asset) => [asset.id, asset]));
const catalogByBaseAssetId = new Map(catalogItems.map((menu) => [baseMenuWidgetAssetId(menu.id), menu]));

function normalize(items: SelectedMenuWidget[]): SelectedMenuWidget[] {
  const latestByMenu = new Map<string, SelectedMenuWidget>();
  [...items].sort((a, b) => a.order - b.order).forEach((item) => {
    latestByMenu.set(item.menuId, item);
  });
  const ordered = [...latestByMenu.values()]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
  const slotByAssetId = new Map(placeMenuWidgets(ordered).map(({ item, row, col }) => [
    item.assetId,
    row * 4 + col + 1,
  ]));
  return ordered.map((item) => ({ ...item, slot: slotByAssetId.get(item.assetId) }));
}

/** 삭제된 자리만 비우고 나머지 위젯의 명시적 slot은 유지한다. */
export function withoutWidget(items: readonly SelectedMenuWidget[], assetId: string): SelectedMenuWidget[] {
  return normalize(items.filter((item) => item.assetId !== assetId));
}

/** 같은 메뉴의 크기·variant는 별도 위젯이 아니라 하나의 presentation option이다.
 * 기존 메뉴의 자리는 유지하고 해당 menuId의 asset만 교체한 뒤 8칸 제한을 검증한다. */
function replaceSelectedWidget(
  current: readonly SelectedMenuWidget[],
  widget: Omit<SelectedMenuWidget, 'order'>,
  placeFirst = false,
): SelectedMenuWidget[] | null {
  const previous = current.find((item) => item.menuId === widget.menuId);
  const remaining = current.filter((item) => item.menuId !== widget.menuId);
  const replacement = {
    ...widget,
    previous2x2AssetId: widget.previous2x2AssetId
      ?? (previous?.size === '2x2' ? previous.assetId : previous?.previous2x2AssetId),
    order: placeFirst ? 0 : (previous?.order ?? current.length + 1),
  };
  const next = normalize(placeFirst ? [replacement, ...remaining] : [...remaining, replacement]);
  return countUsedSlots(next) <= 8 ? next : null;
}

function removeDuplicateAssets(items: SelectedMenuWidget[]): SelectedMenuWidget[] {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.assetId)) return false;
      seen.add(item.assetId);
      return true;
    });
}

/** menuId당 선택은 하나다. 선택된 presentation이 2×2면 네 칸, 1×1이면 한 칸을 사용한다. */
export function countUsedSlots(items: readonly SelectedMenuWidget[]): number {
  const displaySizeByMenu = new Map<string, MenuSizeKey>();
  items.forEach((item) => {
    if (!displaySizeByMenu.has(item.menuId) || item.size === '2x2') {
      displaySizeByMenu.set(item.menuId, item.size);
    }
  });
  return [...displaySizeByMenu.values()].reduce(
    (total, size) => total + (size === '2x2' ? 4 : 1),
    0,
  );
}

function isLegacyItem(value: unknown): value is MenuWidgetItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MenuWidgetItem>;
  return typeof item.id === 'string'
    && typeof item.order === 'number'
    && item.size === '1x1'
    && typeof item.type === 'string'
    && Object.prototype.hasOwnProperty.call(MENU_WIDGET_DEFS, item.type);
}

function migrateLegacy(items: readonly MenuWidgetItem[]): SelectedMenuWidget[] {
  return normalize(items.flatMap((item) => {
    const menu = catalogByWidgetType.get(item.type as MenuWidgetType);
    if (!menu) return [];
    return [{
      assetId: baseMenuWidgetAssetId(menu.id),
      menuId: menu.id,
      size: '1x1' as const,
      variant: 'default',
      order: item.order,
    }];
  }));
}

function isSelectedItem(value: unknown): value is SelectedMenuWidget {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SelectedMenuWidget>;
  if (typeof item.assetId !== 'string' || typeof item.menuId !== 'string'
    || typeof item.variant !== 'string' || typeof item.order !== 'number'
    || (item.size !== '1x1' && item.size !== '2x2')) return false;
  if (!catalogById.has(item.menuId)) return false;
  if (item.size === '1x1') return item.assetId === baseMenuWidgetAssetId(item.menuId);
  const asset = assetsById.get(item.assetId);
  return asset?.menuId === item.menuId && asset.sizes.includes('2x2');
}

/** 저장값이 없을 때의 최초 구성 — 데모 계정이면 그 계정의 persona preset(1×1·2×2 모두), 아니면 공통 기본값.
 * preset 의 assetId 는 2×2 에셋이거나 메뉴의 1×1 이며, 카탈로그·에셋에 없는 항목은 건너뛴다. */
export function createInitialWidgets(ownerKey: string): SelectedMenuWidget[] {
  const accountId = getDemoAccountId(ownerKey);
  const preset = accountId ? PERSONA_MENU_PRESETS[accountId] : undefined;
  if (!preset) return migrateLegacy(DEFAULT_MENU_WIDGETS);
  const widgets = preset.widgets.flatMap(({ assetId, slot }): SelectedMenuWidget[] => {
    const asset = assetsById.get(assetId);
    if (asset?.sizes.includes('2x2')) {
      return [{ assetId, menuId: asset.menuId, size: '2x2', variant: 'default', order: slot, slot }];
    }
    const menu = catalogByBaseAssetId.get(assetId);
    return menu ? [{ assetId, menuId: menu.id, size: '1x1', variant: 'default', order: slot, slot }] : [];
  });
  return normalize(widgets);
}

function loadSelectedWidgets(ownerKey: string): SelectedMenuWidget[] {
  try {
    const raw = localStorage.getItem(menuWidgetStorageKey(ownerKey));
    if (raw === null) return createInitialWidgets(ownerKey);
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createInitialWidgets(ownerKey);
    if (parsed.every(isLegacyItem)) return migrateLegacy(parsed);
    return normalize(removeDuplicateAssets(parsed.filter(isSelectedItem)));
  } catch {
    return createInitialWidgets(ownerKey);
  }
}

/** 위젯 하나를 선택/해제한 결과를 돌려준다(상태는 바꾸지 않는다). null 이면 막힌 것 —
 * 2×2 는 MY 메뉴 전체에서 하나만 쓰고(이미 있으면 새로 고를 수 없다), 8칸(1×1=1, 2×2=4)을 넘길 수 없다.
 * 기존 위젯은 절대 지우거나 교체하지 않는다. 새 2×2 는 order 맨 앞 = 홈 왼쪽 영역에 놓는다. */
export function toggleSelection(
  current: readonly SelectedMenuWidget[],
  widget: Omit<SelectedMenuWidget, 'order'>,
): SelectedMenuWidget[] | null {
  if (current.some((item) => item.assetId === widget.assetId)) return withoutWidget(current, widget.assetId);
  /* 다른 메뉴에 이미 2×2 가 있으면 막는다 — 같은 메뉴의 2×2 를 다른 위젯으로 바꾸는 것은 새로 늘리는 게 아니다 */
  if (widget.size === '2x2' && current.some((item) => item.size === '2x2' && item.menuId !== widget.menuId)) return null;
  return replaceSelectedWidget(current, widget, widget.size === '2x2');
}

/** 위젯 교체 — removeIds 를 빼고 add 를 넣은 새 목록(상태는 바꾸지 않는다). 8칸을 넘으면 null.
 * anchorFrom(제거되는 위젯 중 하나)을 주면 add 는 그 위젯의 자리(order·slot)를 그대로 이어받고, 다른 위젯은 재정렬하지 않는다.
 * anchorFrom 이 없으면 2×2 는 맨 앞(왼쪽 영역), 1×1 은 맨 뒤에 놓는다. add 와 같은 menuId 의 기존 위젯은 함께 빠진다. */
export function replaceSelection(
  current: readonly SelectedMenuWidget[],
  removeIds: readonly string[],
  add: Omit<SelectedMenuWidget, 'order' | 'slot'>,
  anchorFrom?: string,
): SelectedMenuWidget[] | null {
  const anchor = anchorFrom ? current.find((item) => item.assetId === anchorFrom) : undefined;
  const remaining = current.filter((item) => !removeIds.includes(item.assetId) && item.menuId !== add.menuId);
  const previous = current.find((item) => item.menuId === add.menuId);
  const added: SelectedMenuWidget = {
    ...add,
    previous2x2AssetId: add.previous2x2AssetId
      ?? (previous?.size === '2x2' ? previous.assetId : previous?.previous2x2AssetId),
    order: anchor ? anchor.order : (add.size === '2x2' ? 0 : current.length + 1),
    slot: anchor?.slot,
  };
  const next = normalize([...remaining, added]);
  return countUsedSlots(next) <= 8 ? next : null;
}

/** 드래그 결과(placements: 드롭 후 배치 순서·시작 칸)를 반영한 새 목록 — 상태는 바꾸지 않는다. */
export function reorderSelection(
  current: readonly SelectedMenuWidget[],
  placements: { assetId: string; slot: number }[],
  replacement?: {
    fromAssetId: string;
    widget: { assetId: string; menuId: string; size: MenuSizeKey; variant: string };
  },
): SelectedMenuWidget[] {
  const replaced = replacement
    ? current.map((item) => item.assetId === replacement.fromAssetId
      ? {
        ...replacement.widget,
        previous2x2AssetId: replacement.widget.size === '1x1'
          ? item.assetId
          : item.previous2x2AssetId,
        order: item.order,
        slot: item.slot,
      }
      : item)
    : current;
  const byId = new Map(replaced.map((item) => [item.assetId, item]));
  const slots = new Map(placements.map((placement) => [placement.assetId, placement.slot]));
  const assetIds = placements.map((placement) => placement.assetId);
  /* placements 는 드롭 후 배치 순서(시작 칸 순)다 — normalize 는 order 로 정렬하므로 order 를 그 순서로 다시 매긴다 */
  const ordered = assetIds.flatMap((id, index) => {
    const item = byId.get(id);
    return item ? [{ ...item, order: index + 1, slot: slots.get(id) }] : [];
  });
  const rest = replaced
    .filter((item) => !assetIds.includes(item.assetId))
    .map((item, index) => ({ ...item, order: ordered.length + index + 1 }));
  return normalize([...ordered, ...rest]);
}

interface MenuWidgetSelectionValue {
  selectedWidgets: SelectedMenuWidget[];
  /** false면 선택 후 MY 메뉴의 8칸 배치 공간을 초과해 선택값을 바꾸지 않은 것. */
  toggleWidget: (widget: Omit<SelectedMenuWidget, 'order'>) => boolean;
  removeWidget: (assetId: string) => void;
  /** 편집 화면(메뉴 관리)의 draft 를 실제 저장 상태로 반영한다 — 여기서 localStorage 저장까지 이어진다. */
  commitWidgets: (next: SelectedMenuWidget[]) => void;
  /** 이 계정의 최초 추천 구성(persona preset, 없으면 공통 기본값). draft 를 되돌릴 때 쓴다. */
  getInitialWidgets: () => SelectedMenuWidget[];
  reorderWidgets: (
    placements: { assetId: string; slot: number }[],
    replacement?: {
      fromAssetId: string;
      widget: { assetId: string; menuId: string; size: MenuSizeKey; variant: string };
    },
  ) => void;
  usedSlots: number;
}

const MenuWidgetSelectionContext = createContext<MenuWidgetSelectionValue | null>(null);

export function MenuWidgetSelectionProvider({ ownerKey, children }: { ownerKey: string; children: ReactNode }) {
  const [selectedWidgets, setSelectedWidgets] = useState<SelectedMenuWidget[]>(() => loadSelectedWidgets(ownerKey));

  useEffect(() => {
    try {
      localStorage.setItem(menuWidgetStorageKey(ownerKey), JSON.stringify(selectedWidgets));
    } catch {
      /* 저장 실패 시에도 현재 세션의 공통 React 상태는 유지한다. */
    }
  }, [ownerKey, selectedWidgets]);

  const toggleWidget = useCallback((widget: Omit<SelectedMenuWidget, 'order'>) => {
    const next = toggleSelection(selectedWidgets, widget);
    if (!next) return false;
    setSelectedWidgets(next);
    return true;
  }, [selectedWidgets]);

  const removeWidget = useCallback((assetId: string) => {
    setSelectedWidgets((current) => withoutWidget(current, assetId));
  }, []);

  const commitWidgets = useCallback((next: SelectedMenuWidget[]) => setSelectedWidgets(next), []);

  const getInitialWidgets = useCallback(() => createInitialWidgets(ownerKey), [ownerKey]);

  const reorderWidgets = useCallback((
    placements: { assetId: string; slot: number }[],
    replacement?: {
      fromAssetId: string;
      widget: { assetId: string; menuId: string; size: MenuSizeKey; variant: string };
    },
  ) => {
    setSelectedWidgets((current) => reorderSelection(current, placements, replacement));
  }, []);

  const value = useMemo<MenuWidgetSelectionValue>(() => ({
    selectedWidgets,
    toggleWidget,
    removeWidget,
    commitWidgets,
    getInitialWidgets,
    reorderWidgets,
    usedSlots: countUsedSlots(selectedWidgets),
  }), [removeWidget, commitWidgets, getInitialWidgets, reorderWidgets, selectedWidgets, toggleWidget]);

  return <MenuWidgetSelectionContext.Provider value={value}>{children}</MenuWidgetSelectionContext.Provider>;
}

export function useMenuWidgetSelection(): MenuWidgetSelectionValue {
  const value = useContext(MenuWidgetSelectionContext);
  if (!value) throw new Error('useMenuWidgetSelection은 MenuWidgetSelectionProvider 안에서만 쓸 수 있다');
  return value;
}

export type { MenuSizeKey };
