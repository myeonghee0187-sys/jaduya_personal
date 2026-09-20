import type { Ref } from 'react';
import { icon } from '../lib/asset';

interface HomeBenefitBannerProps {
  onClick: () => void;
  /** 실제 보이는 혜택 배너 DOM 참조 — 코치마크 강조 영역 측정에 사용한다. */
  bannerRef?: Ref<HTMLButtonElement>;
  /** true 면 Hero 위 배너가 아니라 시트를 펼쳤을 때 BottomNavigation 자리를 대신하는 하단 Dock 이다. */
  fixed?: boolean;
}

/** 혜택 아이콘 원형 배경 — 배너와 Dock 이 같이 쓴다 */
function BenefitIcon() {
  return (
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
  );
}

/** Home에서 혜택·복지 페이지로 이동하는 CTA. 기본은 Hero 위 배너, fixed 는 하단 Dock. */
export function HomeBenefitBanner({ onClick, bannerRef, fixed = false }: HomeBenefitBannerProps) {
  if (fixed) {
    /* Dock — [아이콘] [제목 + 설명] [확인하기]. 누를 수 있는 것은 CTA 버튼이 맡고(버튼 안에 버튼을
     * 두지 않는다), Dock 전체를 눌러도 같은 곳으로 가도록 클릭은 바깥에서 한 번만 받는다. */
    return (
      <div className="home-benefit-banner home-benefit-banner--fixed">
        <div className="home-benefit-dock" onClick={onClick}>
          <BenefitIcon />
          <div className="home-benefit-dock__text">
            <p className="home-benefit-dock__title">나에게 맞는 자취 혜택</p>
            <p className="home-benefit-dock__desc">받을 수 있는 혜택을 확인해보세요</p>
          </div>
          <button
            type="button"
            className="home-benefit-dock__cta"
            aria-label="나에게 맞는 자취 혜택 확인하기"
          >
            확인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-benefit-banner">
      <button
        ref={bannerRef}
        className="home-benefit-banner__button"
        type="button"
        aria-label="나에게 맞는 자취 혜택 확인하기"
        onClick={onClick}
      >
        <BenefitIcon />
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
