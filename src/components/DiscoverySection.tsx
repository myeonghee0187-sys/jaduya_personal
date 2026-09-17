import { Fragment, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAuth } from '../auth/AuthContext';
import { INTEREST_TOPICS, loadLivingProfile } from '../data/livingProfile';
import type { InterestCategory } from '../data/livingProfile';
import { RECOMMENDATION_TIPS } from '../data/recommendationTips';
import type { RecommendationTip } from '../data/recommendationTips';
import { getRecommendationImagePath } from '../data/recommendationImages';
import { useSeoulDays } from '../hooks/useSeoulToday';
import type { SeoulDay } from '../hooks/useSeoulToday';
import { useCardCarousel } from '../hooks/useCardCarousel';
import { icon, img } from '../lib/asset';

/* 페이지(3카드 세트) 단위 wrapper 사이 간격 — CSS(.discovery-page__track 의
 * --discovery-page-gap)와 아래 translateX 계산이 이 값 하나만 같이 쓴다(중복 하드코딩
 * 금지). 카드 내부 레이아웃이나 카드 사이 간격과는 무관하다. */
const DISCOVERY_PAGE_GAP_PX = 4;

/* 페이지네이션 클릭(탭/화살표)으로 넘어갈 때만 붙는 진입 애니메이션 지속 시간 —
 * home.css 의 discovery-slide-enter-* 키프레임(300ms)과 반드시 같이 맞춘다. 살짝
 * 여유(20ms)를 둬서 클래스가 애니메이션보다 먼저 떨어져 나가 중간에 끊기지 않게 한다. */
const CLICK_NAV_ANIMATION_MS = 320;

interface DiscoverySectionProps {
  /* 맞춤 추천 카드의 '설정하기' · 헤더의 '추천 설정' 공통 진입점 —
   * 페이지를 옮기지 않고 홈 시트 안의 맞춤 추천 설정 View 만 연다. */
  onOpenRecommendSetup?: () => void;
}

interface DiscoveryPageProps {
  /** 이 페이지가 대표하는 하루 — 왼쪽 위 카드는 페이지마다 이 날짜로 바뀐다 */
  day: SeoulDay;
  /** 이 페이지의 맞춤 팁 — 아직 추천 설정 전이면 null(설정 CTA 를 대신 보여준다) */
  tip: RecommendationTip | null;
  onOpenRecommendSetup?: () => void;
}

/** "자두가 알려드려요"의 3카드 세트(오늘부터 3일 중 하루 / 오늘의 장보기 / 자두의 맞춤 팁)
 * 한 장. 페이지 캐러셀의 슬라이드 하나가 곧 이 컴포넌트 하나다 — 왼쪽 아래(오늘의 장보기)는
 * 페이지마다 내용이 똑같지만, 왼쪽 위 날짜 카드는 페이지의 날짜를 그대로 따라간다. 페이지
 * 자체가 통째로 넘어가는 슬라이드 단위라 각 페이지마다 새로 그린다(카드만 따로 바뀌고
 * 나머지가 고정된 것처럼 보이면 안 된다).
 *
 * 날짜 카드 자체는 더 이상 자기 안에서 좌우로 끌리지 않는다 — 이 영역 위에서 잡고 움직여도
 * discovery-page__viewport(부모, 3카드 전체 페이지 전환)가 그 제스처를 받아야 하기
 * 때문이다. `.today-card__track`은 페이지당 날짜 하나만 담아 그 자체로 넘길 내용이
 * 없고(overflow: hidden), 페이지가 넘어갈 때 부모가 다음 날짜의 카드로 통째로 바꿔친다. */
function DiscoveryPage({ day, tip, onOpenRecommendSetup }: DiscoveryPageProps) {
  /* 36개 관심 주제 모두 이미지가 있어 정상 데이터라면 항상 값이 있지만, 혹시 못
   * 찾아도(mismatch) null 이라 아래에서 이미지 없이 텍스트만 안전하게 보여준다. */
  const imagePath = tip ? getRecommendationImagePath(tip.imageKey) : null;

  return (
    <div className="discovery__row">
      <div className="discovery__col">
        {/* 읽기만 하는 정보다 — 화살표·hover·클릭·자체 스와이프를 두지 않는다.
          * 가로 이동은 이 카드가 아니라 3카드 페이지 전체(부모)가 담당한다. */}
        <article className="today-card">
          <div className="today-card__track" role="group" aria-label={day.date}>
            <div className="today-card__day">
              <p className="today-card__date">{day.date}</p>
              <p className="today-card__note">
                <img className="today-card__note-icon" src={icon('lightbulb-tip.svg')} alt="" />
                <span>{day.tip}</span>
              </p>
            </div>
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
        {tip ? (
          /* title/description 은 RECOMMENDATION_TIPS 에서 실제 저장된 관심 분야·주제로
           * 고른 콘텐츠다 — 더 이상 날씨 목업이 아니라서 그 전용 일러스트(우산)·기온
           * 표기는 함께 뺐다. */
          <div className="info-card__top">
            <p className="info-card__label">자두의 맞춤 팁</p>
            <div className="info-card__tit">
              <p className="info-card__headline">{tip.title}</p>
              <p className="info-card__desc">{tip.description}</p>
            </div>
            {imagePath && (
              <div className="info-card__thumb">
                <img src={imagePath} alt="" />
              </div>
            )}
          </div>
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
            <button type="button" className="info-card__setup-cta" onClick={onOpenRecommendSetup}>
              설정하기
            </button>
          </div>
        )}
      </article>
    </div>
  );
}

/** ③ 자두의 발견 — 정적 콘텐츠 + 추천 설정 진입점 */
export function DiscoverySection({ onOpenRecommendSetup }: DiscoverySectionProps = {}) {
  const { user } = useAuth();
  /* 오늘부터 +3일 — 한국 시간 기준 'MM.DD 요일' + 그 날의 꿀팁
   * (자정이 지나면 네 날짜가 함께 하루씩 밀린다). "자두가 알려드려요"의 페이지 수는
   * 항상 이 날짜 개수(4)를 그대로 따른다 — 관심 주제를 몇 개 골랐는지와 무관하다. */
  const days = useSeoulDays(4);

  /* 맞춤 추천 설정 여부는 별도 플래그가 아니라 실제 저장값으로 판단한다 —
   * 관심 분야(category)를 한 번이라도 고르면 설정을 마친 것으로 본다.
   * 어떤 분야를 골랐는지(생활/돈 관리/…)는 여기서 따지지 않는다. */
  /* trim/lowercase 는 이제 livingProfile.ts 안에서 항상 해준다 — 호출부는 원본
   * 이메일을 그대로 넘기면 된다(Home/MyPage 와 같은 방식으로 통일). */
  const ownerKey = user?.email ?? 'guest';
  const livingProfile = loadLivingProfile(ownerKey);
  /* 분야를 2개 골랐으면 두 분야의 관심 주제를 모두 후보 풀에 합친다 — 문자열만으로는
   * 어느 분야 주제인지 알 수 없어(같은 이름의 주제가 없더라도) 분야를 같이 들고 있는다.
   * 각 분야 안에서는 INTEREST_TOPICS 순서를 그대로 쓰고(저장된 배열 순서가 아니라 항상
   * 같은 순서), 분야는 고른 순서(categories[0]이 먼저) 그대로 이어붙인다. 분야 하나에서
   * 하나도 안 골랐으면 그 분야의 첫 주제만 fallback 으로 넣는다(마이페이지 '주제 0개도
   * 저장 가능' 규칙과 맞춘다). */
  const candidateTopics: { category: InterestCategory; topic: string }[] = livingProfile.categories.flatMap(
    (category) => {
      const orderedTopics = INTEREST_TOPICS[category];
      const chosenTopics = livingProfile.topics[category] ?? [];
      /* 저장된 순서는 온보딩 단계별 우선순위 또는 사용자가 고른 순서다. */
      const matchedTopics = chosenTopics.filter((topic) => orderedTopics.includes(topic));
      const topicsForCategory = matchedTopics.length > 0 ? matchedTopics : orderedTopics.slice(0, 1);
      return topicsForCategory.map((topic) => ({ category, topic }));
    },
  );

  /* 페이지(=3카드 세트) 목록 — 날짜 4개에 1:1로 대응해 항상 4장이다. 각 페이지의 맞춤
   * 팁은 후보 풀을 페이지 인덱스로 순환시켜 고른다(candidateTopics[index % length]) —
   * 예를 들어 두 분야 합쳐 3개를 골랐다면 09.15→첫 후보, 09.16→둘째, 09.17→셋째,
   * 09.18→다시 첫 후보 순으로 돌아간다. 아직 추천 설정 전이면(분야 0개) 모든
   * 페이지가 설정 CTA(tip: null)를 보여준다. 정상 데이터라면 항상 찾지만, 혹시 못 찾는
   * topic 이 있어도(mismatch) null 로 걸러내 화면이 깨지지 않게 한다. */
  const pages = days.map((day, index) => {
    const candidate = candidateTopics.length > 0 ? candidateTopics[index % candidateTopics.length] : null;
    const tip = candidate ? (RECOMMENDATION_TIPS[candidate.category][candidate.topic] ?? null) : null;
    return { key: day.date, day, tip };
  });

  /* 페이지 넘기기 — 3카드 세트 전체가 하나의 슬라이드로 통째로 좌우 이동한다(카드 하나씩
   * 따로 움직이지 않는다). count 는 pages.length(=날짜 개수) 그대로다. */
  const pageCarousel = useCardCarousel({ count: pages.length });
  const canPage = pages.length > 1;
  /* 이전(‹)은 01에서 막힌다(그 앞 페이지가 없다는 뜻이라 비활성 처리) — goTo(index-1)로만
   * 옮긴다. 다음(›)은 반대로 04에서도 계속 활성 상태로 두고 goNext()(무한 순환, 이미
   * swipe 가 쓰는 것과 같은 함수)를 그대로 써서 04 → 01 로 끊김 없이 돈다. */
  const isFirstPage = pageCarousel.index === 0;

  /* 페이지네이션(탭/화살표) 클릭으로 넘어갈 때만 켜는 진입 애니메이션 방향 — 스와이프는
   * 이미 트랙이 손가락을 따라 자연스럽게 넘어가므로 건드리지 않는다(이 값이 null 이면
   * 트랙도 원래 320ms 슬라이드 transition 을 그대로 쓰고, 슬라이드에도 진입 클래스를
   * 붙이지 않는다 — 즉 스와이프 결과는 지금과 완전히 동일하게 보인다).
   * setClickNavDirection 과 pageCarousel.goTo/goNext 호출을 한 이벤트 핸들러(triggerClickNav)
   * 안에서 같이 하므로 React 가 같은 커밋으로 묶어, index 가 바뀌는 바로 그 렌더에서부터
   * 정확한 방향이 반영된다(effect 로 한 박자 늦게 따라잡을 필요가 없다). */
  const [clickNavDirection, setClickNavDirection] = useState<'next' | 'prev' | null>(null);
  const clickNavTimeoutRef = useRef<number>();

  useEffect(() => () => window.clearTimeout(clickNavTimeoutRef.current), []);

  const triggerClickNav = (direction: 'next' | 'prev', navigate: () => void) => {
    navigate();
    setClickNavDirection(direction);
    window.clearTimeout(clickNavTimeoutRef.current);
    clickNavTimeoutRef.current = window.setTimeout(() => setClickNavDirection(null), CLICK_NAV_ANIMATION_MS);
  };

  const handlePrevClick = () => triggerClickNav('prev', () => pageCarousel.goTo(pageCarousel.index - 1));
  const handleNextClick = () => triggerClickNav('next', pageCarousel.goNext);
  const handleTabClick = (index: number) => {
    if (index === pageCarousel.index) return;
    triggerClickNav(index > pageCarousel.index ? 'next' : 'prev', () => pageCarousel.goTo(index));
  };

  return (
    <section className="discovery">
      <div className="discovery__top">
        <h2>자두가 알려드려요</h2>
        {/* 카드 안 '설정하기'와 같은 진입점이다 — 페이지를 옮기지 않고
          * 홈 시트 안의 맞춤 추천 설정 View 를 연다. */}
        <button type="button" className="discovery__settings" onClick={onOpenRecommendSetup}>
          추천 설정
        </button>
      </div>

      {/* 얇은 숫자형 페이지네이션 — 새 page state 를 따로 만들지 않고 3카드 슬라이드와
        * 이미 같은 값을 공유하는 pageCarousel.index/goTo 를 그대로 쓴다 — swipe·화살표(현재는
        * 제거)와 완전히 같은 하나의 상태라 서로 어긋날 일이 없다. */}
      <div className="discovery__pagination" role="tablist" aria-label="날짜 페이지 선택">
        <button
          type="button"
          className="discovery__page-chevron"
          aria-label="이전 페이지"
          disabled={isFirstPage}
          onClick={handlePrevClick}
        >
          <span aria-hidden="true">‹</span>
        </button>
        {pages.map(({ key, day }, index) => {
          const isActive = index === pageCarousel.index;
          return (
            <Fragment key={key}>
              <button
                type="button"
                role="tab"
                className={`discovery__page-item${isActive ? ' is-active' : ''}`}
                aria-selected={isActive}
                aria-label={day.date}
                onClick={() => handleTabClick(index)}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
              <span
                className={`discovery__page-line${isActive ? ' is-active' : ''}`}
                aria-hidden="true"
              />
            </Fragment>
          );
        })}
        <button
          type="button"
          className="discovery__page-chevron"
          aria-label="다음 페이지"
          onClick={handleNextClick}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="discovery__body">
        {/* 실제로 슬라이드를 자르는 overflow:hidden 은 안쪽 viewport 만 갖는다 —
          * 페이지 전환(3카드 전체 슬라이드)과 카드 폭·gap·padding 은 이전과 완전히 같다. */}
        <div className="discovery-page__carousel">
          <div className="discovery-page__viewport" {...(canPage ? pageCarousel.viewportHandlers : {})}>
            <div
              className={`discovery-page__track${pageCarousel.isDragging ? ' is-dragging' : ''}${
                clickNavDirection ? ' is-instant' : ''
              }`}
              style={
                {
                  '--discovery-page-gap': `${DISCOVERY_PAGE_GAP_PX}px`,
                  transform: `translateX(calc(${-pageCarousel.index * 100}% - ${pageCarousel.index * DISCOVERY_PAGE_GAP_PX}px + ${pageCarousel.dragOffset}px))`,
                } as CSSProperties
              }
            >
              {pages.map(({ key, day, tip }, index) => {
                const isActive = index === pageCarousel.index;
                return (
                  <div
                    className={`discovery-page__slide${
                      isActive && clickNavDirection ? ` is-entering-${clickNavDirection}` : ''
                    }`}
                    key={key}
                  >
                    <DiscoveryPage day={day} tip={tip} onOpenRecommendSetup={onOpenRecommendSetup} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
