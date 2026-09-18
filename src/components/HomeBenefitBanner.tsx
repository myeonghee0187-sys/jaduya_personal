import type { Ref } from 'react';
import { icon } from '../lib/asset';

interface HomeBenefitBannerProps {
  onClick: () => void;
  /** 실제 보이는 혜택 배너 DOM 참조 — 코치마크 강조 영역 측정에 사용한다. */
  bannerRef?: Ref<HTMLButtonElement>;
}

/** Home에서 혜택·복지 페이지로 이동하는 CTA 배너. */
export function HomeBenefitBanner({ onClick, bannerRef }: HomeBenefitBannerProps) {
  return (
    <div className="home-benefit-banner">
      <button
        ref={bannerRef}
        className="home-benefit-banner__button"
        type="button"
        aria-label="나에게 맞는 자취 혜택 확인하기"
        onClick={onClick}
      >
        <span className="home-benefit-banner__icon-badge">
          <span
            className="home-benefit-banner__icon"
            style={{
              maskImage: `url(${icon('menu-gift.svg')})`,
              WebkitMaskImage: `url(${icon('menu-gift.svg')})`,
            }}
            aria-hidden="true"
          />
        </span>
        <span className="home-benefit-banner__text">나에게 맞는 자취 혜택 확인하기</span>
        <img
          className="home-benefit-banner__arrow"
          src={icon('chevron-right-gray.svg')}
          alt="혜택·복지 페이지로 이동"
        />
      </button>
    </div>
  );
}
