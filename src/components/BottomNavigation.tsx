import { icon } from '../lib/asset';

export function BottomNavigation() {
  return (
    <nav className="tab-bar" aria-label="주요 메뉴">
      <div className="tab-bar__nav">
        <a className="tab-item" href="#">
          <img className="tab-item__icon" src={icon('nav-life.svg')} alt="" />
          <span className="tab-item__label">생활</span>
        </a>
        <a className="tab-item" href="#">
          <img className="tab-item__icon" src={icon('nav-money.svg')} alt="" />
          <span className="tab-item__label">돈관리</span>
        </a>
        <a className="tab-item tab-item--home is-active" href="#" aria-current="page">
          <img
            className="tab-item__icon tab-item__icon--home"
            src={icon('nav-home.svg')}
            alt=""
          />
          <span className="tab-item__label">홈</span>
        </a>
        <a className="tab-item" href="#">
          <img className="tab-item__icon" src={icon('nav-community.svg')} alt="" />
          <span className="tab-item__label">커뮤니티</span>
        </a>
        <a className="tab-item" href="#">
          <img className="tab-item__icon" src={icon('nav-my.svg')} alt="" />
          <span className="tab-item__label">마이</span>
        </a>
      </div>
      <img className="tab-bar__mascot" src={icon('nav-home-mascot-active.svg')} alt="" />
      <div className="tab-bar__bottom">
        <img className="tab-bar__home-indicator" src={icon('home-indicator.svg')} alt="" />
      </div>
    </nav>
  );
}
