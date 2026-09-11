import { img } from '../lib/asset';

/** ③ 자두의 발견 — 정적 콘텐츠 */
export function DiscoverySection() {
  return (
    <section className="discovery">
      <div className="discovery__top">
        <h2>자두가 알려드려요</h2>
      </div>

      <div className="discovery__body">
        <div className="discovery__row">
          <div className="discovery__col">
            <article className="today-card">
              <p className="today-card__date">09.04 금요일</p>
              <p className="today-card__note">오늘은 분리수거하는 날!</p>
            </article>

            <article className="info-card info-card--sale">
              <div className="info-card__top">
                <div className="info-card__label-row">
                  <p className="info-card__label">오늘의 장보기</p>
                  <span className="info-card__ad">AD</span>
                </div>
                <div className="info-card__tit">
                  <p className="info-card__headline">이마트 세일</p>
                  <p className="info-card__period">9.3 – 9.5</p>
                </div>
              </div>
              <div className="info-card__foot">
                <p className="info-card__foot-label">신선식품</p>
                <p className="info-card__foot-value">최대 30%</p>
              </div>
            </article>

            {/* 장보기 일러스트는 카드 밖(컬럼 기준)에 배치된다 — Figma 동일.
             * 컬럼 기준으로 앵커링해 컬럼이 좁아져도 옆 날씨 카드 쪽으로 번지지 않는다. */}
            <div className="info-card__art info-card__art--basket" aria-hidden="true">
              <img src={img('discovery-sprite.png')} alt="" />
            </div>
          </div>

          <article className="info-card info-card--weather">
            <div className="info-card__top">
              <p className="info-card__label">오늘의 외출 팁</p>
              <div className="info-card__tit">
                <p className="info-card__headline">우산 챙기세요!</p>
                <p className="info-card__desc">소나기 소식이 있어요</p>
              </div>
            </div>
            <p className="info-card__temp">최고 기온 24°</p>
            <div className="info-card__art info-card__art--umbrella" aria-hidden="true">
              <div className="info-card__art-rotate">
                <img src={img('discovery-sprite.png')} alt="" />
              </div>
            </div>
          </article>
        </div>

        <div className="carousel-dots" aria-hidden="true">
          <span className="dot dot--active" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </section>
  );
}
