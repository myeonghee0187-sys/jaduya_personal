import type { ReactNode } from 'react';
import { BellButton } from './BellButton';
import { StatusBar } from './StatusBar';
import { icon } from '../lib/asset';

/* 하위 화면 공용 헤더 — 뒤로가기 + 제목 + 알림 + 전체메뉴.
 * StatusBar / BellButton 은 기존 공용 컴포넌트를 그대로 쓴다.
 * Home 의 Header(로고형)와는 역할이 달라 별도로 둔다. */
interface SubPageHeaderProps {
  title: string;
  /** 뒤로가기 목적지 설명 — 스크린리더용 (예: 마이페이지로) */
  backLabel: string;
  onBack: () => void;
  onMenu: () => void;
  /** 제목 오른쪽에 덧붙일 요소가 필요할 때 */
  children?: ReactNode;
}

export function SubPageHeader({ title, backLabel, onBack, onMenu, children }: SubPageHeaderProps) {
  return (
    <header className="page-header">
      <StatusBar />
      <div className="page-header__nav">
        <button type="button" className="page-header__back" aria-label={backLabel} onClick={onBack}>
          <img src={icon('gnb-back.svg')} alt="" />
        </button>
        <h1>{title}</h1>
        <div className="header-actions">
          {children}
          <BellButton />
          {/* 햄버거는 Home Header / GnbOverlay 와 같은 .burger 구조를 쓴다 —
            * 아이콘 파일을 따로 두면 선 굵기·간격·모션이 화면마다 갈린다 */}
          <button type="button" className="page-header__menu" aria-label="전체 메뉴" onClick={onMenu}>
            <span className="burger" aria-hidden="true">
              <span className="burger__bar" />
              <span className="burger__bar" />
              <span className="burger__bar" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default SubPageHeader;
