import { useState } from 'react';
import type { MouseEvent } from 'react';
import { icon } from '../lib/asset';
import { AccountSwitchSheet } from './auth/AccountSwitchSheet';

type TabId = 'life' | 'money' | 'home' | 'community' | 'my';
interface BottomNavigationProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [selectedTab, setSelectedTab] = useState<TabId>('home');
  /* 개발·발표용 계정 전환 — 마이 탭 hover 말풍선에서만 연다 */
  const [switchHover, setSwitchHover] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
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
    <>
    <nav className="tab-bar" aria-label="주요 메뉴">
      <div className="tab-bar__nav">
        {tabs.map(([id, label, asset]) => {
          const isActive = currentTab === id;
          const item = (
            <a className={`tab-item${id === 'home' ? ' tab-item--home' : ''}${isActive ? ' is-active' : ''}`} href="#" aria-current={isActive ? 'page' : undefined} onClick={(event) => selectTab(id, event)}>
              <img className={`tab-item__icon${id === 'home' ? ' tab-item__icon--home' : ''}`} src={icon(asset)} alt="" />
              <span className="tab-item__label">{label}</span>
            </a>
          );
          if (id !== 'my') return <div key={id} className="tab-item-wrap">{item}</div>;
          /* 마이 탭: 기존 클릭 동작은 그대로 두고, hover 시 말풍선만 덧띄운다 */
          return (
            <div
              key={id}
              className="tab-item-wrap"
              onMouseEnter={() => setSwitchHover(true)}
              onMouseLeave={() => setSwitchHover(false)}
            >
              {item}
              <div className="account-switch__bubble" hidden={!switchHover}>
                <button type="button" onClick={() => setSwitchOpen(true)}>
                  계정 전환
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <img className="tab-bar__mascot" src={icon(currentTab === 'home' ? 'nav-home-mascot-active.svg' : 'nav-home-mascot.svg')} alt="" />
      <div className="tab-bar__bottom">
        <img className="tab-bar__home-indicator" src={icon('home-indicator.svg')} alt="" />
      </div>
    </nav>

    {/* Bottom Sheet 는 .tab-bar 가 아니라 .app 기준으로 떠야 한다 */}
    <AccountSwitchSheet open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </>
  );
}
