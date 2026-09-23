import { useRef } from 'react';
import type { RefObject } from 'react';
import { GlyphIcon } from './GlyphIcon';
import { MenuWidgetSlot } from './MenuWidget';
import { useMenuGridEdit } from '../hooks/useMenuGridEdit';
import { HOME_GRID_COLUMNS, baseMenuWidgetAssetId, placeMenuWidgets } from '../data/menuWidgets';
import type { SelectedMenuWidget } from '../data/menuWidgets';
import { MENU_CATALOG } from '../data/menuCatalog';
import { resolveAutoExpandAsset } from '../data/menuWidgetAssets';

/* ② 내 메뉴
 *
 * 사용자가 고른 1×1 위젯을 4열 그리드로 보여준다 (data/menuWidgets.ts).
 * 위젯은 { id, type, size, order } 아이템이고, 여기서는 order 순서대로 그릴 뿐이다.
 * 길게 누르면 같은 화면에서 편집 모드가 되고, 헤더의 메뉴 관리 버튼은 별도 관리 화면으로
 * 이동한다. 삭제(-)와 드래그 재정렬은 items 를 바꿔 다시 내려받는 방식으로만 반영된다. */

interface MyLifeSectionProps {
  /** 홈에 놓인 위젯 — order 순서로 그려진다 */
  widgets: SelectedMenuWidget[];
  editing: boolean;
  /** 코치마크의 "메뉴를 자유롭게 바꿔보세요" 단계 전용 — 첫 번째 타일이 옆 칸까지 실제로
   * 옮겨졌다 돌아오는 배치 데모를 재생한다(AIChatbotButton.tsx 의 이동 데모와 같은 역할).
   * 기본은 안 보여준다. */
  showDragHint?: boolean;
  onOpenWidget: (item: SelectedMenuWidget) => void;
  /** 상세 메뉴 관리 화면으로 이동 — 홈의 편집 mode를 직접 켜지 않는다. */
  onManageMenu: () => void;
  onEnterEdit: () => void;
  onExitEdit: () => void;
  onRemoveWidget: (id: string) => void;
  /** 드래그를 놓았을 때 새 순서(위젯 id 배열) */
  onReorderWidgets: (
    placements: { assetId: string; slot: number }[],
    replacement?: {
      fromAssetId: string;
      widget: { assetId: string; menuId: string; size: '1x1' | '2x2'; variant: string };
    },
  ) => void;
  /** 위젯 그리드(.menu-grid) DOM 참조 — 코치마크가 강조 영역을 잴 때도 쓴다 */
  gridRef: RefObject<HTMLUListElement>;
}

export function MyLifeSection({
  widgets,
  editing,
  showDragHint = false,
  onOpenWidget,
  onManageMenu,
  onEnterEdit,
  onExitEdit,
  onRemoveWidget,
  onReorderWidgets,
  gridRef,
}: MyLifeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const ordered = [...widgets].sort((a, b) => a.order - b.order);
  const byId = new Map(ordered.map((item) => [item.assetId, item]));
  const compactMenuIds = new Set(
    MENU_CATALOG.flatMap((section) => section.items)
      .filter((menu) => menu.showBaseWidgetInMenuManage !== false)
      .map((menu) => menu.id),
  );

  const { renderIds, draggingId, expandedPreviewAssetId, dropPlaceholder, gridProps } = useMenuGridEdit({
    gridRef,
    sectionRef,
    items: ordered.map((item) => ({
      id: item.assetId,
      menuId: item.menuId,
      size: item.size,
      slot: item.slot,
      compactAssetId: compactMenuIds.has(item.menuId) ? baseMenuWidgetAssetId(item.menuId) : undefined,
      expandedAsset: (() => {
        const asset = resolveAutoExpandAsset(item.assetId, item.menuId, item.previous2x2AssetId);
        return asset ? { assetId: asset.id, variant: asset.variant ?? 'default' } : undefined;
      })(),
    })),
    editing,
    onEnterEdit,
    onExitEdit,
    onReorder: onReorderWidgets,
  });

  /* 색상은 배열 순번이 아니라 실제 4열 Grid의 시작 칸에 붙는다.
   * 드래그 중에는 renderIds 순서를 임시 order로 사용해 이동 중인 새 슬롯 색도 즉시 반영한다. */
  const renderedItems = renderIds.flatMap((id, index) => {
    const item = byId.get(id);
    return item ? [{ ...item, order: index + 1 }] : [];
  });
  const placements = placeMenuWidgets(renderedItems);
  const placementByAssetId = new Map(placements.map(({ item, row, col, span }) => [
    item.assetId,
    { slotIndex: row * HOME_GRID_COLUMNS + col + 1, row, col, span },
  ]));
  const occupiedSlots = new Set<number>();
  placements.forEach(({ row, col, span }) => {
    for (let r = row; r < row + span; r += 1) {
      for (let c = col; c < col + span; c += 1) occupiedSlots.add(r * HOME_GRID_COLUMNS + c);
    }
  });
  const emptySlots = Array.from({ length: 8 }, (_, slot) => slot).filter((slot) => !occupiedSlots.has(slot));

  return (
    <section className="my-life" ref={sectionRef}>
      <div className="section-header">
        <div className="section-header__title">
          <h2>내 메뉴</h2>
        </div>
        <button
          type="button"
          className="section-header__edit"
          aria-label="내 메뉴 관리 화면으로 이동"
          onClick={onManageMenu}
        >
          <span className="fill_box">
            <span className="home-action-button__icon">
              <GlyphIcon file="gear.svg" size={15} />
            </span>
            <span>메뉴 관리</span>
          </span>
        </button>
      </div>
      <p className="my-life__hint">꾹 눌러 위치를 바꿔보세요</p>

      <ul
        className={`menu-grid${editing ? ' is-editing' : ''}`}
        ref={gridRef}
        aria-label="내 메뉴"
        {...gridProps}
      >
        {dropPlaceholder && (
          <li
            className={`menu-grid__drop-placeholder${dropPlaceholder.invalid ? ' is-invalid' : ''}${dropPlaceholder.waiting ? ' is-waiting' : ''}`}
            style={dropPlaceholder.style}
            aria-hidden="true"
          />
        )}
        {renderIds.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          const placement = placementByAssetId.get(item.assetId);
          return (
            <MenuWidgetSlot
              key={item.assetId}
              item={item}
              slotIndex={placement?.slotIndex ?? 1}
              row={placement?.row ?? 0}
              col={placement?.col ?? 0}
              span={placement?.span ?? 1}
              editing={editing}
              dragging={draggingId === item.assetId}
              previewAssetId={draggingId === item.assetId ? expandedPreviewAssetId ?? undefined : undefined}
              /* 코치마크 전용 — 첫 번째 타일만 옆 칸까지 실제로 옮겨졌다 돌아오는 배치 데모를 재생한다 */
              demoMove={showDragHint && index === 0}
              onOpen={onOpenWidget}
              onRemove={onRemoveWidget}
            />
          );
        })}
        {emptySlots.map((slot) => (
          <li
            key={`empty-${slot + 1}`}
            className="menu-grid__empty"
            style={{
              gridColumn: `${(slot % HOME_GRID_COLUMNS) + 1} / span 1`,
              gridRow: `${Math.floor(slot / HOME_GRID_COLUMNS) + 1} / span 1`,
            }}
          >
            <button
              type="button"
              className="menu-grid__empty-button"
              aria-label={`빈 슬롯 ${slot + 1}, 메뉴 추가`}
              onClick={onManageMenu}
            >
              <span aria-hidden="true">+</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
