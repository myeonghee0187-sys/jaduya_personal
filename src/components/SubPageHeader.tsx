import type { ReactNode } from 'react';
import { HeaderIconButton } from './HeaderIconButton';
import { StatusBar } from './StatusBar';
import { icon } from '../lib/asset';

/* 하위 화면 공용 헤더 — 뒤로가기 + 제목 + 알림 + 전체메뉴.
 * StatusBar / HeaderIconButton 은 기존 공용 컴포넌트를 그대로 쓴다.
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
          <HeaderIconButton iconName="bell" label="알림" />
          <HeaderIconButton iconName="menu" label="전체 메뉴" onClick={onMenu} />
        </div>
      </div>
    </header>
  );
}

export default SubPageHeader;
