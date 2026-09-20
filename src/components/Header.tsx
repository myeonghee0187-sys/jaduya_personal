import { useNavigate } from 'react-router-dom';
import { icon } from '../lib/asset';
import { HeaderIconButton } from './HeaderIconButton';
import { StatusBar } from './StatusBar';

interface HeaderProps {
  /** 인증 전 화면(로그인/회원가입)은 알림을 노출하지 않는다 */
  showActions?: boolean;
}

export function Header({ showActions = true }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="header">
      <StatusBar />
      <div className="nav-header">
        <button type="button" className="nav-header__brand" aria-label="자두야 홈으로" onClick={() => navigate('/')}>
          <img className="nav-header__logo" src={icon('logo-mark.svg')} alt="" />
          <span className="nav-header__name">자두야</span>
        </button>
        {showActions && (
          <div className="header-actions header-actions--bell-last">
            <HeaderIconButton iconName="bell" label="알림" />
          </div>
        )}
      </div>
    </header>
  );
}
