import { icon } from '../lib/asset';

/** iOS 스타일 상태바 — Header 와 GnbOverlay 가 공유한다 */
export function StatusBar() {
  return (
    <div className="status-bar">
      <p className="status-bar__time">9:41</p>
      <img className="status-bar__icons" src={icon('status-icons.svg')} alt="" />
    </div>
  );
}
