import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { icon } from '../lib/asset';
import { AccountSwitchSheet } from './auth/AccountSwitchSheet';
import { useAppNavigation } from '../navigation/AppNavigation';

type TabId = 'life' | 'money' | 'home' | 'community' | 'my';
interface BottomNavigationProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const navigation = useAppNavigation();
  const [selectedTab, setSelectedTab] = useState<TabId>('home');
  /* 개발·발표용 계정 전환.
   * hover 는 데스크톱 편의일 뿐이고, 실제 동작은 탭(클릭)으로 고정하는 pinned 상태가 담당한다.
   * 터치 기기에는 hover 가 없으므로 pinned 없이는 열리지 않는다. */
  const [switchHover, setSwitchHover] = useState(false);
  const [switchPinned, setSwitchPinned] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const myTabRef = useRef<HTMLDivElement>(null);

  /* 바깥을 누르면 닫는다 (터치·마우스 공통) */
  useEffect(() => {
    if (!switchPinned) return;
    const onOutside = (event: PointerEvent) => {
      if (!myTabRef.current?.contains(event.target as Node)) setSwitchPinned(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [switchPinned]);
  const currentTab = activeTab ?? navigation?.page ?? selectedTab;
  const tabs: Array<[TabId, string, string]> = [
    ['life', '생활', 'nav-life.svg'], ['money', '돈관리', 'nav-money.svg'],
    ['home', '홈', 'nav-home.svg'], ['community', '커뮤니티', 'nav-community.svg'], ['my', '마이', 'nav-my.svg'],
  ];
  const selectTab = (tab: TabId, event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (activeTab === undefined) setSelectedTab(tab);
    onTabChange?.(tab);
    if (tab === 'home' || tab === 'my') {
      navigation?.navigate(tab);
    }
  };
  return (
    <>
    <nav className="tab-bar" aria-label="주요 메뉴">
      <div className="tab-bar__nav">
        {tabs.map(([id, label, asset]) => {
          const isActive = currentTab === id;
          const item = (
            <a className={`tab-item${id === 'home' ? ' tab-item--home' : ''}${isActive ? ' is-active' : ''}`} href="#" aria-current={isActive ? 'page' : undefined} onClick={(event) => selectTab(id, event)}>
              {/* active 홈은 마스코트를 탭 안에서 라벨 바로 위에 쓴다 */}
              <img
                className={`tab-item__icon${id === 'home' ? ' tab-item__icon--home' : ''}`}
                src={icon(id === 'home' ? (isActive ? 'nav-home-mascot-active.svg' : 'nav-home-mascot.svg') : asset)}
                alt=""
              />
              <span className="tab-item__label">{label}</span>
            </a>
          );
          if (id !== 'my') return <div key={id} className="tab-item-wrap">{item}</div>;
          /* 마이 탭: 기존 클릭 동작은 그대로 두고, hover 시 말풍선만 덧띄운다 */
          return (
            <div
              key={id}
              ref={myTabRef}
              className="tab-item-wrap"
              onMouseEnter={() => setSwitchHover(true)}
              onMouseLeave={() => setSwitchHover(false)}
              /* 탭(클릭/터치)으로 열고 닫는다 — hover 에 의존하지 않는다 */
              onClick={() => setSwitchPinned((pinned) => !pinned)}
            >
              {item}
              <div className="account-switch__bubble" hidden={!(switchHover || switchPinned)}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSwitchPinned(false);
                    setSwitchOpen(true);
                  }}
                >
                  계정 전환
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="tab-bar__bottom">
        <img className="tab-bar__home-indicator" src={icon('home-indicator.svg')} alt="" />
      </div>
    </nav>

    {/* Bottom Sheet 는 .tab-bar 가 아니라 .app 기준으로 떠야 한다 */}
    <AccountSwitchSheet open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </>
  );
}
