import { icon } from '../../lib/asset';
import { CATEGORY_TONE } from '../../data/widgetRegistry';
import type { WidgetCategory } from '../../types';

interface WidgetIconBadgeProps {
  icon: string;
  category: WidgetCategory;
  size?: 'sm' | 'md';
}

/** 위젯 카드/목록 카드가 함께 쓰는 아이콘 뱃지 — 배경 톤은 카테고리로 정해진다.
 * 아이콘은 <img>가 아니라 CSS mask로 그린다 — 원본 SVG 파일마다 채움색이 제각각
 * 박혀 있어서(빨강/검정/올리브 등) <img>로는 색을 통일할 수 없었다(요구사항: 아이콘
 * 색 통일). mask-image는 SVG를 도형 틀로만 쓰고 실제 색은 background-color 하나로
 * 정하므로, 어떤 아이콘 파일을 골라도 항상 같은 색으로 보인다. */
export function WidgetIconBadge({ icon: iconName, category, size = 'sm' }: WidgetIconBadgeProps) {
  const maskUrl = `url(${icon(iconName)})`;
  return (
    <span className={`wicon-badge wicon-badge--${size} wicon-badge--${CATEGORY_TONE[category]}`}>
      <span
        className="wicon-badge__glyph"
        style={{ WebkitMaskImage: maskUrl, maskImage: maskUrl }}
        aria-hidden="true"
      />
    </span>
  );
}
