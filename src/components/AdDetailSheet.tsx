import { useEffect, useState } from 'react';
import '../styles/ad-detail-sheet.css';
import { BottomSheet } from './BottomSheet';
import { AdIcon } from './AdIcon';
import type { AdContent } from '../data/adContents';
import { icon } from '../lib/asset';

interface AdDetailSheetProps {
  /** 닫히는 동안에도 내용이 사라지지 않게, 마지막으로 연 광고를 그대로 넘긴다 */
  ad: AdContent | null;
  open: boolean;
  onClose: () => void;
}

/* 홈 "자두 PICK" 광고 카드를 눌렀을 때 뜨는 상세 바텀시트.
 * 외부 사이트로 나가지 않는 포트폴리오용 mock 이라, CTA 는 안내 문구만 보여준다.
 * 시트 셸(딤·손잡이·뒤로가기 처리)은 공용 BottomSheet 를 그대로 쓴다. */
export function AdDetailSheet({ ad, open, onClose }: AdDetailSheetProps) {
  const [ctaPressed, setCtaPressed] = useState(false);

  /* 광고를 새로 열 때마다 이전 CTA 안내는 지운다 */
  useEffect(() => {
    if (open) setCtaPressed(false);
  }, [open, ad]);

  return (
    <BottomSheet open={open} className="ad-sheet" labelledBy="ad-sheet-title" onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>
      {ad && (
        <>
          <div className="ad-sheet__head">
            <span className="ad-sheet__label">자두 PICK</span>
            <span className="ad-sheet__badge">AD</span>
            <button type="button" className="ad-sheet__close" aria-label="닫기" onClick={onClose}>
              <img src={icon('sheet-close.svg')} alt="" />
            </button>
          </div>

          <div className="ad-sheet__art">
            <AdIcon
              className="ad-sheet__icon"
              sheet={ad.imageSheet}
              position={ad.imagePosition}
              label={ad.adCategory}
            />
          </div>

          <h2 id="ad-sheet-title" className="ad-sheet__title">
            {ad.headline}
          </h2>
          <p className="ad-sheet__detail">{ad.detail}</p>

          <dl className="ad-sheet__facts">
            <div className="ad-sheet__fact">
              <dt>혜택</dt>
              <dd className="ad-sheet__benefit">
                {ad.benefitLabel} {ad.benefitValue}
              </dd>
            </div>
            <div className="ad-sheet__fact">
              <dt>광고주</dt>
              <dd>{ad.advertiser}</dd>
            </div>
          </dl>

          <button type="button" className="ad-sheet__cta" onClick={() => setCtaPressed(true)}>
            {ad.cta}
          </button>
          <p className="ad-sheet__note" role="status">
            {ctaPressed ? '데모 화면이라 실제 페이지로 이동하지 않아요.' : '포트폴리오용 가상 광고예요.'}
          </p>
        </>
      )}
    </BottomSheet>
  );
}
