import { useAppNavigation } from '../navigation/AppNavigation';
import { useAuth } from '../auth/AuthContext';
import { loadLivingProfile } from '../data/livingProfile';
import { useSeoulDays } from '../hooks/useSeoulToday';
import { useElasticDragScroll } from '../hooks/useElasticDragScroll';
import { img } from '../lib/asset';

/** ③ 자두의 발견 — 정적 콘텐츠 + 추천 설정 진입점 */
export function DiscoverySection() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  /* 오늘부터 +3일 — 한국 시간 기준 'MM.DD 요일' + 그 날의 꿀팁
   * (자정이 지나면 네 날짜가 함께 하루씩 밀린다) */
  const days = useSeoulDays(4);
  /* 데스크톱에서도 마우스로 끌어 넘길 수 있게 — 커뮤니티 카드 줄과 같은 훅을 쓴다 */
  const daysDrag = useElasticDragScroll<HTMLDivElement>();

  /* 맞춤 추천 설정 여부는 별도 플래그가 아니라 실제 저장값으로 판단한다 —
   * 관심 분야(category)를 한 번이라도 고르면 설정을 마친 것으로 본다.
   * 어떤 분야를 골랐는지(생활/돈 관리/…)는 여기서 따지지 않는다. */
  const ownerKey = user?.email.trim().toLowerCase() ?? 'guest';
  const hasRecommendSetup = loadLivingProfile(ownerKey).category !== null;

  /* 홈에서 들어왔으므로 뒤로가기도 홈으로 돌아간다 */
  const openRecommendSettings = () =>
    navigation?.navigate('living-profile', { section: 'recommend', returnTo: 'home' });

  return (
    <section className="discovery">
      <div className="discovery__top">
        <h2>자두가 알려드려요</h2>
        {/* 여기 노출되는 정보를 고르는 곳으로 바로 보낸다.
          * 홈에서 들어왔으므로 뒤로가기도 홈으로 돌아가야 한다(returnTo). */}
        <button
          type="button"
          className="discovery__settings"
          onClick={openRecommendSettings}
        >
          추천 설정
        </button>
      </div>

      <div className="discovery__body">
        <div className="discovery__row">
          <div className="discovery__col">
            {/* 읽기만 하는 정보다 — 화살표·hover·클릭을 두지 않는다.
              * 카드 크기는 하루치 그대로이고, 오늘~+3일은 좌우로 넘겨서 본다. */}
            <article className="today-card">
              <div
                className="today-card__track"
                ref={daysDrag.ref}
                {...daysDrag.dragProps}
                role="group"
                aria-label="오늘부터 3일 뒤까지 — 좌우로 넘겨보세요"
              >
                {days.map((day) => (
                  <div key={day.date} className="today-card__day">
                    <p className="today-card__date">{day.date}</p>
                    <p className="today-card__note">{day.tip}</p>
                  </div>
                ))}
              </div>
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

          {/* 카드 껍데기(.info-card--weather, 167×235 고정)는 설정 전후가 같다 —
            * 안의 내용만 갈아끼워 홈 레이아웃이 흔들리지 않게 한다. */}
          <article className="info-card info-card--weather">
            {hasRecommendSetup ? (
              <>
                <div className="info-card__top">
                  <p className="info-card__label">자두의 맞춤 팁</p>
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
              </>
            ) : (
              /* 관심 분야를 아직 안 고른 사용자 — 팁 대신 설정을 권한다.
                * 일러스트는 문구·버튼 자리를 위해 띄우지 않는다. */
              <div className="info-card__setup">
                <p className="info-card__label">자두의 맞춤 팁</p>
                <div className="info-card__setup-copy">
                  <p className="info-card__headline">맞춤 추천 전이에요</p>
                  <p className="info-card__desc">
                    관심 분야를 설정하면
                    <br />
                    맞춤 팁을 알려드려요.
                  </p>
                </div>
                <button
                  type="button"
                  className="info-card__setup-cta"
                  onClick={openRecommendSettings}
                >
                  설정하기
                </button>
              </div>
            )}
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
