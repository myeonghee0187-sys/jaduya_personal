import { useState } from 'react';
import { icon } from '../lib/asset';
import { findMenu } from '../data/menuCatalog';
import { BellButton } from './BellButton';
import { GnbMenuItem } from './GnbMenuItem';
import { ShortcutCard } from './ShortcutCard';
import { StatusBar } from './StatusBar';

interface GnbOverlayProps {
  open: boolean;
  /** 저장된 '내 메뉴' id 목록 */
  myMenu: string[];
  onClose: () => void;
  onEditMenu: () => void;
}

/** ① GNB 전체메뉴 — Figma gnb_open (1432:4646) */
export function GnbOverlay({ open, myMenu, onClose, onEditMenu }: GnbOverlayProps) {
  /* Figma 기준 '생활'만 펼쳐진 상태로 시작한다 */
  const [livingOpen, setLivingOpen] = useState(true);

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
              <img src={icon('gnb-close.svg')} alt="" />
            </button>
          </div>
        </div>
      </div>

      <div className="gnb__scroll">
        <div className="gnb__content">
          <div className="gnb-menu">
            <GnbMenuItem
              iconFile="gnb-nav-living.svg"
              name="생활"
              open={livingOpen}
              onToggle={() => setLivingOpen((v) => !v)}
              subId="gnbLivingSub"
            >
              <a className="gnb-menu__sub-link" href="#">
                청소 · 위생
              </a>
              <a className="gnb-menu__sub-link" href="#">
                인테리어 · 수납
              </a>
              <a className="gnb-menu__sub-link" href="#">
                요리 · 식단
              </a>
              <a className="gnb-menu__sub-link" href="#">
                1인가구 꿀템
              </a>
            </GnbMenuItem>

            <GnbMenuItem iconFile="gnb-nav-money.svg" name="돈 관리" />
            <GnbMenuItem iconFile="gnb-nav-community.svg" name="커뮤니티" />
            <GnbMenuItem iconFile="gnb-nav-benefit.svg" name="혜택" />
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
                return item ? <ShortcutCard key={id} item={item} /> : null;
              })}
            </div>
          </div>

          <div className="gnb__divider" />

          <nav className="gnb-personal" aria-label="개인 메뉴">
            <a className="gnb-personal__link" href="#">
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
