import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { icon } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';
import { pageUrl } from '../navigation/routes';

type TabId = 'life' | 'money' | 'home' | 'community' | 'my';
interface BottomNavigationProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const navigation = useAppNavigation();
  const [selectedTab, setSelectedTab] = useState<TabId>('home');
  const currentTab = activeTab ?? navigation?.page ?? selectedTab;

  /* 다른 탭에서 홈으로 "실제로" 바뀌는 순간에만 마스코트를 한 번 올린다 —
   * 리렌더나 이미 홈인 상태에서는 다시 재생하지 않는다. */
  const [homePop, setHomePop] = useState(false);
  const previousTab = useRef(currentTab);
  useEffect(() => {
    if (previousTab.current !== 'home' && currentTab === 'home') setHomePop(true);
    previousTab.current = currentTab;
  }, [currentTab]);
  const tabs: Array<[TabId, string, string]> = [
    ['life', '생활', 'nav-life.svg'], ['money', '돈관리', 'nav-money.svg'],
    ['home', '홈', 'nav-home.svg'], ['community', '커뮤니티', 'nav-community.svg'], ['my', '마이', 'nav-my.svg'],
  ];
  const selectTab = (tab: TabId, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (activeTab === undefined) setSelectedTab(tab);
    onTabChange?.(tab);
    if (tab === 'home' || tab === 'my' || tab === 'life' || tab === 'community' || tab === 'money') {
      navigation?.navigateTab(tab);
    }
  };
  return (
    <nav className="tab-bar" aria-label="주요 메뉴">
      <div className="tab-bar__nav">
        {tabs.map(([id, label, asset]) => {
          const isActive = currentTab === id;
          const item = (
            <a className={`tab-item${id === 'home' ? ' tab-item--home' : ''}${isActive ? ' is-active' : ''}`} href={pageUrl(id)} aria-current={isActive ? 'page' : undefined} onClick={(event) => selectTab(id, event)}>
              {/* active 홈은 마스코트를 탭 안에서 라벨 바로 위에 쓴다 */}
              <img
                className={`tab-item__icon${id === 'home' ? ' tab-item__icon--home' : ''}${
                  id === 'home' && isActive && homePop ? ' is-popping' : ''
                }`}
                onAnimationEnd={() => setHomePop(false)}
                /* 홈은 마스코트, 나머지는 같은 이름의 -active(Primary) 파일로 바꿔 끼운다 */
                src={icon(
                  id === 'home'
                    ? isActive
                      ? 'nav-home-mascot-active.svg'
                      : 'nav-home-mascot.svg'
                    : isActive
                      ? asset.replace('.svg', '-active.svg')
                      : asset,
                )}
                alt=""
              />
              <span className="tab-item__label">{label}</span>
            </a>
          );
          return <div key={id} className="tab-item-wrap">{item}</div>;
        })}
      </div>
      <div className="tab-bar__bottom">
        <img className="tab-bar__home-indicator" src={icon('home-indicator.svg')} alt="" />
      </div>
    </nav>
  );
}
