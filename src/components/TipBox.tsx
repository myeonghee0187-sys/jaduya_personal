import { useState } from 'react';
import { icon, img } from '../lib/asset';

/* js/home.js 의 Tip box 닫기: opacity 0 → 200ms 후 hidden.
 * 트랜지션은 css/home.css 의 .tip-box 규칙이 그대로 처리한다. */
export function TipBox() {
  const [closing, setClosing] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleClose = () => {
    setClosing(true);
    window.setTimeout(() => setHidden(true), 200);
  };

  return (
    <div className="tip-box" hidden={hidden} style={closing ? { opacity: 0 } : undefined}>
      <div className="tip-box__inner">
        <img className="tip-box__icon" src={img('tip-box-icon.png')} alt="" />
        <p className="tip-box__text">첫날 박스는 따로 챙겨두세요</p>
        <button
          type="button"
          className="tip-box__info"
          aria-label="첫날 박스 팁 자세히 보기"
          aria-expanded={detailsOpen}
          aria-controls="tip-box-details"
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <img src={icon('info.svg')} alt="" />
        </button>
        <button type="button" className="tip-box__close" aria-label="안내 닫기" onClick={handleClose}>
          <img src={icon('close-sm.svg')} alt="" />
        </button>
      </div>
      {detailsOpen && (
        <div className="tip-box__details" id="tip-box-details" role="tooltip">
          휴지·수건·충전기처럼 바로 쓸 물건을 한곳에 모아두면 편해요.
        </div>
      )}
    </div>
  );
}
