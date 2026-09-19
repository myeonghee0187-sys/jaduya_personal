import { useId } from 'react';
import { icon } from '../../lib/asset';
import { useDismissOnBack } from '../../navigation/useDismissOnBack';

interface PlacementGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/** 헤더의 "가이드" 버튼을 눌렀을 때 뜨는 위젯 배치 방법 안내 — 화면 중앙에 뜨는 모달.
 * 아래에서 올라오는 다른 관리용 시트(액션/배치 공간 만들기)와 달리, 이건 "지금 뭘 선택해야
 * 하는" 액션이 아니라 그냥 읽고 닫는 정보 안내라 하단 고정 대신 중앙에 띄운다. */
export function PlacementGuideSheet({ open, onClose }: PlacementGuideSheetProps) {
  const titleId = useId();
  useDismissOnBack(open, onClose);

  return (
    <div className="layer wpg-guide-modal-layer" hidden={!open}>
      <button type="button" className="layer-dim" aria-label="닫기" onClick={onClose} />
      <div className="wpg-guide-modal">
        <section
          className="wpg-guide-modal__card"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="wpg-guide-modal__header">
            <h2 className="wpg-guide-modal__title" id={titleId}>
              위젯 배치 방법
            </h2>
            <button type="button" className="wpg-guide-modal__close" aria-label="닫기" onClick={onClose}>
              <img src={icon('sheet-close.svg')} alt="" />
            </button>
          </div>

          <p className="wpg-guide-modal__subtitle">홈 화면에는 위젯을 이렇게 배치할 수 있어요.</p>

          <ul className="wpg-guide-modal__rows">
            <li className="wpg-guide-modal__row">
              <div className="wpg-guide-modal__swatches">
                <span className="wpg-guide-modal__swatch wpg-guide-modal__swatch--l wpg-guide-modal__swatch--wide">
                  L
                </span>
              </div>
              <div className="wpg-guide-modal__text">
                <p className="wpg-guide-modal__row-title">L 위젯</p>
                <p className="wpg-guide-modal__row-desc">가로 전체를 사용하는 큰 위젯이에요.</p>
              </div>
            </li>

            <li className="wpg-guide-modal__row">
              <div className="wpg-guide-modal__swatches">
                <span className="wpg-guide-modal__swatch wpg-guide-modal__swatch--m">M</span>
                <span className="wpg-guide-modal__swatch wpg-guide-modal__swatch--m">M</span>
              </div>
              <div className="wpg-guide-modal__text">
                <p className="wpg-guide-modal__row-title">M 위젯</p>
                <p className="wpg-guide-modal__row-desc">가로로 2개 배치할 수 있어요.</p>
              </div>
            </li>

            <li className="wpg-guide-modal__row">
              <div className="wpg-guide-modal__swatches">
                <span className="wpg-guide-modal__swatch wpg-guide-modal__swatch--s">S</span>
                <span className="wpg-guide-modal__swatch wpg-guide-modal__swatch--s">S</span>
              </div>
              <div className="wpg-guide-modal__text">
                <p className="wpg-guide-modal__row-title">S 위젯</p>
                <p className="wpg-guide-modal__row-desc">아래에 2개까지 배치할 수 있어요.</p>
              </div>
            </li>
          </ul>

          <div className="wpg-guide-modal__tip">
            <img src={icon('info-warn.svg')} alt="" aria-hidden="true" />
            <p>L 위젯을 추가하려면 M 위젯 2개의 공간이 필요해요.</p>
          </div>

          <button type="button" className="wpg-guide-modal__confirm" onClick={onClose}>
            확인했어요
          </button>
        </section>
      </div>
    </div>
  );
}
