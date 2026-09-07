import { icon } from '../lib/asset';
import { BellButton } from './BellButton';
import { StatusBar } from './StatusBar';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="header">
      <StatusBar />
      <div className="nav-header">
        <div className="nav-header__brand">
          <img className="nav-header__logo" src={icon('logo-mark.svg')} alt="" />
          <span className="nav-header__name">자두야</span>
        </div>
        <div className="nav-header__actions">
          <BellButton />
          <button type="button" className="icon-btn" aria-label="메뉴" onClick={onMenuClick}>
            <img className="icon-btn__img" src={icon('header-menu.svg')} alt="" />
          </button>
        </div>
      </div>
    </header>
  );
}
