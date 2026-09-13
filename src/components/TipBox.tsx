import { useState } from 'react';
import type { KeyboardEvent, MouseEvent, Ref } from 'react';
import { icon, img } from '../lib/asset';
import type { HomeTip } from '../types';

/* js/home.js 의 Tip box 닫기: opacity 0 → 200ms 후 hidden.
 * 트랜지션은 css/home.css 의 .tip-box 규칙이 그대로 처리한다. */
interface TipBoxProps {
  /** persona 별 오늘의 팁 — 제목과 상세가 함께 바뀐다 */
  tip: HomeTip;
  /** 실제 보이는 글래스 카드(.tip-box__inner) DOM 참조 — 코치마크가 강조 영역을
   * 잴 때만 쓴다. 평소 렌더링에는 영향 없다. */
  cardRef?: Ref<HTMLDivElement>;
}

export function TipBox({ tip, cardRef }: TipBoxProps) {
  const [closing, setClosing] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const toggleDetails = () => setDetailsOpen((open) => !open);

  /* X 는 닫기만 한다 — 박스 전체 클릭(상세 열기)으로 이벤트가 올라가지 않게 막는다 */
  const handleClose = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setClosing(true);
    window.setTimeout(() => setHidden(true), 200);
  };

  return (
    <div className="tip-box" hidden={hidden} style={closing ? { opacity: 0 } : undefined}>
      {/* 박스 어디를 눌러도 상세가 열린다 (기존 detailsOpen 재사용) */}
      <div
        ref={cardRef}
        className="tip-box__inner"
        role="button"
        tabIndex={0}
        aria-label="팁 자세히 보기"
        aria-expanded={detailsOpen}
        aria-controls="tip-box-details"
        onClick={toggleDetails}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleDetails();
          }
        }}
      >
        <img className="tip-box__icon" src={img('tip-box-icon.png')} alt="" />
        <div className="tip-box__label">
          <p className="tip-box__text">{tip.title}</p>
          <img className="tip-box__info" src={icon('info.svg')} alt="" />
        </div>
        <button type="button" className="tip-box__close" aria-label="안내 닫기" onClick={handleClose}>
          <img src={icon('close-sm.svg')} alt="" />
        </button>
      </div>
      {detailsOpen && (
        <div className="tip-box__details" id="tip-box-details" role="tooltip">
          {tip.detail}
        </div>
      )}
    </div>
  );
}
