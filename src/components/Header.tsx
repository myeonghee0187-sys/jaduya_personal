import { icon } from '../lib/asset';
import { HeaderIconButton } from './HeaderIconButton';
import { StatusBar } from './StatusBar';

interface HeaderProps {
  onMenuClick?: () => void;
  /** 인증 전 화면(로그인/회원가입)은 알림·전체메뉴를 노출하지 않는다 */
  showActions?: boolean;
}

export function Header({ onMenuClick, showActions = true }: HeaderProps) {
  return (
    <header className="header">
      <StatusBar />
      <div className="nav-header">
        <div className="nav-header__brand">
          <img className="nav-header__logo" src={icon('logo-mark.svg')} alt="" />
          <span className="nav-header__name">자두야</span>
        </div>
        {showActions && (
          <div className="header-actions">
            <HeaderIconButton iconName="bell" label="알림" />
            <HeaderIconButton iconName="menu" label="메뉴" onClick={onMenuClick} />
          </div>
        )}
      </div>
    </header>
  );
}
