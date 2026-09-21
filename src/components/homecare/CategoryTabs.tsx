import { useAppNavigation } from '../../navigation/AppNavigation';
import type { AppPage } from '../../navigation/AppNavigation';

/* 최종 생활 카테고리 — 첫 자취와 홈케어만 제공한다. */
const TABS: Array<{ key: string; label: string; page: AppPage }> = [
  { key: 'first', label: '첫 자취', page: 'life-first' },
  { key: 'homecare', label: '홈케어', page: 'life-homecare' },
];

interface CategoryTabsProps {
  active: string;
}

export function CategoryTabs({ active }: CategoryTabsProps) {
  const navigation = useAppNavigation();

  return (
    <nav className="dc-tabs dc-tabs--life" aria-label="생활 카테고리">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const className = `dc-tabs__tab${isActive ? ' is-active' : ''}`;
        if (isActive) {
          return (
            <span key={tab.key} className={className} aria-current={isActive ? 'page' : undefined}>
              {tab.label}
            </span>
          );
        }
        return (
          <button
            key={tab.key}
            type="button"
            className={className}
            onClick={() => navigation?.navigate(tab.page)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default CategoryTabs;
