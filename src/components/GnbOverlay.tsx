import { useState } from 'react';
import { icon } from '../lib/asset';
import { findMenu } from '../data/menuCatalog';
import { GNB_CATEGORIES, GNB_DEFAULT_OPEN } from '../data/gnbMenu';
import { BellButton } from './BellButton';
import { GnbMenuItem } from './GnbMenuItem';
import { ShortcutCard } from './ShortcutCard';
import { StatusBar } from './StatusBar';
import { useAppNavigation } from '../navigation/AppNavigation';

interface GnbOverlayProps {
  open: boolean;
  /** 저장된 '내 메뉴' id 목록 */
  myMenu: string[];
  onClose: () => void;
  onEditMenu: () => void;
}

/** ① GNB 전체메뉴 — Figma gnb_open (1432:4646) */
export function GnbOverlay({ open, myMenu, onClose, onEditMenu }: GnbOverlayProps) {
  const navigation = useAppNavigation();
  /* Figma 기준 '생활'만 펼쳐진 상태로 시작한다.
   * 한 번에 한 카테고리만 열린다 — 다른 카테고리를 열면 이전 것은 닫힌다. */
  const [openCategory, setOpenCategory] = useState<string | null>(GNB_DEFAULT_OPEN);

  /* 아직 화면이 없는 메뉴는 route 가 null 이라 이동하지 않는다.
   * route 가 생기면 gnbMenu.ts 의 값만 채우면 된다. */
  const goTo = (route: string | null) => {
    if (!route) return;
    onClose();
    if (route === 'my') navigation?.navigate('my');
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
          <div className="nav-header__actions">
            <BellButton />
            <button
              type="button"
              className="gnb__close"
              aria-label="전체메뉴 닫기"
              onClick={onClose}
            >
              <span className="burger burger--morph" aria-hidden="true">
                <span className="burger__bar" />
                <span className="burger__bar" />
                <span className="burger__bar" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="gnb__scroll">
        <div className="gnb__content">
          <div className="gnb-menu">
            {GNB_CATEGORIES.map((category) => {
              const hasItems = category.items.length > 0;
              if (!hasItems) {
                /* 하위 메뉴 없음 — 화살표 없이 바로 이동 */
                return (
                  <GnbMenuItem
                    key={category.id}
                    iconFile={category.iconFile}
                    name={category.name}
                    onSelect={() => goTo(category.route)}
                  />
                );
              }
              return (
                <GnbMenuItem
                  key={category.id}
                  iconFile={category.iconFile}
                  name={category.name}
                  open={openCategory === category.id}
                  onToggle={() =>
                    setOpenCategory((current) => (current === category.id ? null : category.id))
                  }
                  subId={`gnb-sub-${category.id}`}
                >
                  {category.items.map((item) => (
                    <a
                      key={item.id}
                      className="gnb-menu__sub-link"
                      href="#"
                      data-menu-id={item.id}
                      onClick={(event) => {
                        event.preventDefault();
                        goTo(item.route);
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                </GnbMenuItem>
              );
            })}
          </div>

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

          <div className="gnb__divider" />

          <nav className="gnb-personal" aria-label="개인 메뉴">
            <a className="gnb-personal__link" href="#" onClick={(event) => {
              event.preventDefault();
              onClose();
              navigation?.navigate('my');
            }}>
              마이페이지
              <img className="gnb-personal__chevron" src={icon('chevron-right-sm.svg')} alt="" />
            </a>
            <a className="gnb-personal__link" href="#">
              설정
              <img className="gnb-personal__chevron" src={icon('chevron-right-sm.svg')} alt="" />
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
}
