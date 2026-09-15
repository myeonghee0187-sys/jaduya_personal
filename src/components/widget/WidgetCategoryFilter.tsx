import { WIDGET_CATEGORY_ORDER } from '../../data/widgetRegistry';
import type { WidgetCategory } from '../../types';

export type CategoryFilter = '전체' | WidgetCategory;

interface WidgetCategoryFilterProps {
  value: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

/** 카테고리 가로 스크롤 필(pill) — 위젯 관리 화면과 위젯 추가 화면이 공유한다. */
export function WidgetCategoryFilter({ value, onChange }: WidgetCategoryFilterProps) {
  const categories: CategoryFilter[] = ['전체', ...WIDGET_CATEGORY_ORDER];
  return (
    <div className="wg-cats" role="tablist" aria-label="위젯 카테고리">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={value === cat}
          className={`wg-cats__item${value === cat ? ' is-active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
