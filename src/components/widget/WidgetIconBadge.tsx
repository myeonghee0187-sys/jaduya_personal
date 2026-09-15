import { icon } from '../../lib/asset';
import { CATEGORY_TONE } from '../../data/widgetRegistry';
import type { WidgetCategory } from '../../types';

interface WidgetIconBadgeProps {
  icon: string;
  category: WidgetCategory;
  size?: 'sm' | 'md';
}

/** 위젯 카드/목록 카드가 함께 쓰는 아이콘 뱃지 — 배경 톤은 카테고리로 정해진다 */
export function WidgetIconBadge({ icon: iconName, category, size = 'sm' }: WidgetIconBadgeProps) {
  return (
    <span className={`wicon-badge wicon-badge--${size} wicon-badge--${CATEGORY_TONE[category]}`}>
      <img src={icon(iconName)} alt="" aria-hidden="true" />
    </span>
  );
}
