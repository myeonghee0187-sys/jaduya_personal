import { useState } from 'react';
import { icon } from '../lib/asset';
import { findMenu } from '../data/menuCatalog';
import { GNB_CATEGORIES, GNB_DEFAULT_CATEGORY_ID } from '../data/gnbMenu';
import { HeaderIconButton } from './HeaderIconButton';
import { MenuIcon } from './MenuIcon';
import { ShortcutCard } from './ShortcutCard';
import { StatusBar } from './StatusBar';
import { useAppNavigation } from '../navigation/AppNavigation';
import type { AppPage } from '../navigation/AppNavigation';

interface GnbOverlayProps {
  open: boolean;
  /** 저장된 '내 메뉴' id 목록 */
  myMenu: string[];
  onClose: () => void;
  onEditMenu: () => void;
}

/** 현재 페이지가 속한 대메뉴 id를 찾는다 — 어느 대메뉴에도 속하지 않으면(예: 홈) 기본값을 쓴다 */
function resolveCategoryId(currentPage: AppPage | undefined): string {
  const match = GNB_CATEGORIES.find((category) =>
    category.items.some((item) => item.route !== null && item.route === currentPage),
  );
  return match?.id ?? GNB_DEFAULT_CATEGORY_ID;
}

/** ① GNB 전체메뉴 — 좌측 대메뉴 / 우측 하위 메뉴 2열 구조 (Figma gnb_open 최신 시안) */
export function GnbOverlay({ open, myMenu, onClose, onEditMenu }: GnbOverlayProps) {
  const navigation = useAppNavigation();
  const currentPage = navigation?.page;

  /* 좌측에서 지금 선택된(=우측에 하위 메뉴를 보여주는) 대메뉴. 기본값은 현재 페이지가
   * 속한 대메뉴다. 이후 좌측을 눌러 다른 대메뉴를 미리 볼 수 있지만, 그 자체로는 페이지를
   * 이동하지 않는다 — 실제 이동은 우측 하위 메뉴를 눌러야 일어난다. */
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => resolveCategoryId(currentPage));
  const selectedCategory =
    GNB_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? GNB_CATEGORIES[0];

  /* 아직 화면이 없는 메뉴는 route 가 null 이라 이동하지 않는다.
   * route 가 생기면 gnbMenu.ts 의 값만 채우면 된다. */
  const goTo = (route: AppPage | null) => {
    if (!route) return;
    onClose();
    navigation?.navigate(route);
  };

  /* 내 메뉴 바로가기 — 화면이 있는 항목만 연결한다 */
  const goToShortcut = (id: string) => {
    if (id !== 'saved') return;
    onClose();
    navigation?.navigate('saved');
  };

  return (
    <section className="layer gnb" hidden={!open} aria-label="전체메뉴">
      <div className="gnb__header">
        <StatusBar />
        <div className="nav-header">
          <div className="gnb__title-button">
            <button type="button" className="gnb__back" aria-label="뒤로" onClick={onClose}>
              <img src={icon('gnb-back.svg')} alt="" />
            </button>
            <span className="gnb__title">전체메뉴</span>
          </div>
          <div className="header-actions">
            <HeaderIconButton iconName="bell" label="알림" />
            <HeaderIconButton
              iconName="menu"
              label="전체메뉴 닫기"
              open={open}
              onClick={onClose}
            />
          </div>
        </div>
      </div>

      <div className="gnb__scroll">
        <div className="gnb__content">
          <div className="gnb-mymenu">
            <div className="gnb-mymenu__head">
              <h2 className="gnb-mymenu__title">내 메뉴</h2>
              <button type="button" className="gnb-mymenu__edit" onClick={onEditMenu}>
                편집
              </button>
            </div>
            <div className="shortcut-grid">
              {myMenu.map((id) => {
                const item = findMenu(id);
                return item ? (
                  <ShortcutCard key={id} item={item} onSelect={() => goToShortcut(id)} />
                ) : null;
              })}
            </div>
          </div>

          <div className="gnb-menu2">
            <div className="gnb-menu2__categories">
              <div className="gnb-menu2__category-list" role="tablist" aria-label="대메뉴">
                {GNB_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={category.id === selectedCategoryId}
                    className={`gnb-menu2__category${category.id === selectedCategoryId ? ' is-selected' : ''}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <MenuIcon file={category.iconFile} className="gnb-menu2__category-icon" />
                    <span className="gnb-menu2__category-name">{category.name}</span>
                  </button>
                ))}
              </div>

              <nav className="gnb-menu2__utility" aria-label="개인 메뉴">
                <a className="gnb-menu2__utility-link" href="#" onClick={(event) => {
                  event.preventDefault();
                  onClose();
                  navigation?.navigate('my');
                }}>
                  마이페이지
                </a>
                <a className="gnb-menu2__utility-link" href="#">
                  설정
                </a>
              </nav>
            </div>

            {/* 선택된 대메뉴의 하위 메뉴만 보여준다 — 대메뉴 이름을 다시 반복하지 않는다 */}
            <div className="gnb-menu2__items" role="tabpanel" aria-label={`${selectedCategory.name} 하위 메뉴`}>
              {selectedCategory.items.map((item) => {
                const isSelected = item.route !== null && item.route === currentPage;
                return (
                  <a
                    key={item.id}
                    className={`gnb-menu2__item${item.home ? ' is-home' : ''}${isSelected ? ' is-selected' : ''}`}
                    href="#"
                    data-menu-id={item.id}
                    onClick={(event) => {
                      event.preventDefault();
                      goTo(item.route);
                    }}
                  >
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
