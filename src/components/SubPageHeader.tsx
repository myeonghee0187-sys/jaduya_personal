import type { ReactNode } from 'react';
import { HeaderIconButton } from './HeaderIconButton';
import { StatusBar } from './StatusBar';
import { icon } from '../lib/asset';

/* 하위 화면 공용 헤더 — 뒤로가기 + 제목 + 알림 + 전체메뉴(또는 닫기).
 * StatusBar / HeaderIconButton 은 기존 공용 컴포넌트를 그대로 쓴다.
 * Home 의 Header(로고형)와는 역할이 달라 별도로 둔다. */
interface SubPageHeaderProps {
  title: string;
  /** 뒤로가기 목적지 설명 — 스크린리더용 (예: 마이페이지로) */
  backLabel: string;
  onBack: () => void;
  /** 기본 동작 — 눌러서 GNB 전체메뉴를 연다. onClose 를 넘기면 이 자리는 대신 X 버튼이 된다. */
  onMenu?: () => void;
  /** 전체메뉴가 필요 없는 화면(글쓰기 패널과 같은 성격) 전용 — 햄버거 대신 X 버튼을 두고
   * 누르면 이 화면을 완전히 닫는다. onMenu 와는 동시에 쓰지 않는다. */
  onClose?: () => void;
  /** X 버튼의 스크린리더용 설명 — 기본값 "닫기" */
  closeLabel?: string;
  /** 제목 오른쪽에 덧붙일 요소가 필요할 때 */
  children?: ReactNode;
}

export function SubPageHeader({
  title,
  backLabel,
  onBack,
  onMenu,
  onClose,
  closeLabel = '닫기',
  children,
}: SubPageHeaderProps) {
  return (
    <header className="page-header">
      <StatusBar />
      <div className="page-header__nav">
        <button type="button" className="page-header__back" aria-label={backLabel} onClick={onBack}>
          <img src={icon('gnb-back.svg')} alt="" />
        </button>
        <h1>{title}</h1>
        {children && <div className="page-header__extra">{children}</div>}
        <div className="header-actions">
          <HeaderIconButton iconName="bell" label="알림" />
          {onClose ? (
            /* 공용 HeaderIconButton 은 bell/menu 전용이라(글쓰기 패널과 같은 이유로)
             * 여기서만 따로 그린다 — 크기·자리는 같은 header-icon-button 클래스를 쓴다. */
            <button type="button" className="header-icon-button" aria-label={closeLabel} onClick={onClose}>
              <img src={icon('gnb-close.svg')} alt="" />
            </button>
          ) : (
            <HeaderIconButton iconName="menu" label="전체 메뉴" onClick={onMenu} />
          )}
        </div>
      </div>
    </header>
  );
}

export default SubPageHeader;
