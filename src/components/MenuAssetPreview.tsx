import { GlyphIcon } from './GlyphIcon';
import { WidgetAsset } from './WidgetAsset';
import { sizeLabel } from '../data/menuCatalog';
import type { MenuCatalogItem } from '../data/menuCatalog';
import type { MenuSizeKey, MenuWidgetAsset } from '../data/menuWidgetAssets';
import { icon } from '../lib/asset';

/* 메뉴 관리에서 보여주는 위젯 에셋 preview 한 칸.
 *
 *   <button.menu-asset>          누르면 선택 (aria-pressed)
 *     <span.menu-asset__frame>   선택 테두리 + 체크 — 에셋 종류와 무관한 공통 wrapper
 *       에셋                     1×1 = 홈 위젯 그대로 / 2×2 = Figma 카드(WidgetAsset)
 *     <span.menu-asset__caption> 배리언트 이름 (같은 크기 그룹에 여럿일 때만 있다)
 *
 * 1×1 은 홈 '내 메뉴'와 같은 마크업·클래스(.menu-slot > .menu-widget)를 그대로 쓴다. */

interface MenuAssetPreviewProps {
  menu: MenuCatalogItem;
  size: MenuSizeKey;
  /** size 가 2×2 일 때 그릴 Figma 카드 */
  asset?: MenuWidgetAsset;
  selected: boolean;
  /** 홈 자리 컬러 번호(1~8, slotColorOf) — 홈에 있으면 그 자리 색, 아니면 1 */
  slot: number;
  onSelect: () => void;
}

export function MenuAssetPreview({ menu, size, asset, selected, slot, onSelect }: MenuAssetPreviewProps) {
  const label = asset?.variant ? `${sizeLabel(size)} ${asset.variant}` : sizeLabel(size);

  return (
    <button
      type="button"
      className={`menu-asset${selected ? ' is-selected' : ''}`}
      data-size={size}
      aria-pressed={selected}
      aria-label={`${menu.label} ${label}${selected ? ' 사용 중' : ''}`}
      onClick={onSelect}
    >
      <span className="menu-asset__frame">
        {size === '2x2' && asset ? (
          <WidgetAsset asset={asset} />
        ) : (
          <span className={`menu-slot menu-slot--${slot}`}>
            <span className="menu-widget" data-size="1x1">
              <span className="menu-widget__label">{menu.label}</span>
              <GlyphIcon file={menu.icon} size={26} className="menu-widget__icon" />
            </span>
          </span>
        )}
        <span className="menu-asset__check" aria-hidden="true">
          <img src={icon('widget-check.svg')} alt="" />
        </span>
      </span>
      {asset?.variant && <span className="menu-asset__caption">{asset.variant}</span>}
    </button>
  );
}
