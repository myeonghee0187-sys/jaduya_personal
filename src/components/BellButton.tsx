import { icon } from '../lib/asset';

/** 알림 벨 — Header 와 GnbOverlay 가 공유한다 */
export function BellButton() {
  return (
    <button type="button" className="icon-btn icon-bell" aria-label="알림">
      <img className="icon-bell__body" src={icon('bell-body.svg')} alt="" />
      <img className="icon-bell__clapper" src={icon('bell-clapper.svg')} alt="" />
      <span className="icon-bell__badge">
        <i />
      </span>
    </button>
  );
}
