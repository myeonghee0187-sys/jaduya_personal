import { useState } from 'react';
import type { MouseEvent } from 'react';
import { icon } from '../lib/asset';

type TabId = 'life' | 'money' | 'home' | 'community' | 'my';
interface BottomNavigationProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [selectedTab, setSelectedTab] = useState<TabId>('home');
  const currentTab = activeTab ?? selectedTab;
  const tabs: Array<[TabId, string, string]> = [
    ['life', '생활', 'nav-life.svg'], ['money', '돈관리', 'nav-money.svg'],
    ['home', '홈', 'nav-home.svg'], ['community', '커뮤니티', 'nav-community.svg'], ['my', '마이', 'nav-my.svg'],
  ];
  const selectTab = (tab: TabId, event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (activeTab === undefined) setSelectedTab(tab);
    onTabChange?.(tab);
  };
  return (
    <nav className="tab-bar" aria-label="주요 메뉴">
      <div className="tab-bar__nav">
        {tabs.map(([id, label, asset]) => {
          const isActive = currentTab === id;
          return <a key={id} className={`tab-item${id === 'home' ? ' tab-item--home' : ''}${isActive ? ' is-active' : ''}`} href="#" aria-current={isActive ? 'page' : undefined} onClick={(event) => selectTab(id, event)}>
            <img className={`tab-item__icon${id === 'home' ? ' tab-item__icon--home' : ''}`} src={icon(asset)} alt="" />
            <span className="tab-item__label">{label}</span>
          </a>;
        })}
      </div>
      <img className="tab-bar__mascot" src={icon(currentTab === 'home' ? 'nav-home-mascot-active.svg' : 'nav-home-mascot.svg')} alt="" />
      <div className="tab-bar__bottom">
        <img className="tab-bar__home-indicator" src={icon('home-indicator.svg')} alt="" />
      </div>
    </nav>
  );
}
