import { useAppNavigation } from '../../navigation/AppNavigation';
import type { AppPage } from '../../navigation/AppNavigation';

/* 생활 하위 탭 — 화면이 있는 탭만 눌리고, 나머지는 첫 자취 탭과 같은 방식으로
 * 아직 이동하지 않는다(LifeFirstPage.tsx 의 LIFE_TABS 와 동일한 원칙). */
const TABS: Array<{ key: string; label: string; page?: AppPage }> = [
  { key: 'first', label: '첫 자취', page: 'life-first' },
  { key: 'homecare', label: '홈케어', page: 'life-homecare' },
  { key: 'house', label: '살림', page: 'life-house' },
  { key: 'food', label: '먹거리', page: 'life-eat' },
];

interface CategoryTabsProps {
  active: string;
}

export function CategoryTabs({ active }: CategoryTabsProps) {
  const navigation = useAppNavigation();

  return (
    <nav className="dc-tabs" aria-label="생활 카테고리">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const className = `dc-tabs__tab${isActive ? ' is-active' : ''}`;
        if (!tab.page || isActive) {
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
            onClick={() => navigation?.navigate(tab.page!)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default CategoryTabs;
