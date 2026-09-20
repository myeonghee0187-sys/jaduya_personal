import { Fragment, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAuth } from '../auth/AuthContext';
import { INTEREST_CATEGORIES, INTEREST_TOPICS, loadLivingProfile } from '../data/livingProfile';
import type { InterestCategory } from '../data/livingProfile';
import { RECOMMENDATION_TIPS } from '../data/recommendationTips';
import type { RecommendationTip } from '../data/recommendationTips';
import { getRecommendationImagePath } from '../data/recommendationImages';
import { useSeoulDays } from '../hooks/useSeoulToday';
import type { SeoulDay } from '../hooks/useSeoulToday';
import { useCardCarousel } from '../hooks/useCardCarousel';
import { selectDiscoveryAds } from '../data/adContents';
import type { AdContent } from '../data/adContents';
import { icon } from '../lib/asset';
import { AdIcon } from './AdIcon';

/* 페이지(3카드 세트) 단위 wrapper 사이 간격 — CSS(.discovery-page__track 의
 * --discovery-page-gap)와 아래 translateX 계산이 이 값 하나만 같이 쓴다(중복 하드코딩
 * 금지). 카드 내부 레이아웃이나 카드 사이 간격과는 무관하다. */
const DISCOVERY_PAGE_GAP_PX = 4;

/* 페이지네이션 이전/다음 화살표 — 기존 chevron 아이콘 파일을 mask 로 그려 색을 CSS(color)에 맡긴다.
 * 이전(‹)은 같은 아이콘을 좌우 반전한다. */
const CHEVRON_STYLE = { '--chevron-src': `url(${icon('chevron-right-thin.svg')})` } as CSSProperties;

interface DiscoverySectionProps {
  /* 맞춤 추천 카드의 '설정하기' · 헤더의 '추천 설정' 공통 진입점 —
   * 페이지를 옮기지 않고 홈 시트 안의 맞춤 추천 설정 View 만 연다. */
  onOpenRecommendSetup?: () => void;
  /* 광고 카드 탭 — 상세 바텀시트는 홈 화면 전체를 덮어야 해서(스크롤 영역 안에 갇히면
   * 안 된다) 여기서 열지 않고 Home 이 연다. */
  onOpenAd?: (ad: AdContent) => void;
}

interface DiscoveryPageProps {
  /** 이 페이지가 대표하는 하루 — 왼쪽 위 카드는 페이지마다 이 날짜로 바뀐다 */
  day: SeoulDay;
  /** 이 페이지의 맞춤 팁 — 아직 추천 설정 전이면 null(설정 CTA 를 대신 보여준다) */
  tip: RecommendationTip | null;
  /** 이 페이지의 광고 — 팁과는 따로 고른다(data/adContents.ts) */
  ad: AdContent;
  onOpenRecommendSetup?: () => void;
  onOpenAd?: (ad: AdContent) => void;
}

/** "자두가 알려드려요"의 3카드 세트(오늘부터 3일 중 하루 / 자두 PICK 광고 / 자두의 맞춤 팁)
 * 한 장. 페이지 캐러셀의 슬라이드 하나가 곧 이 컴포넌트 하나다 — 왼쪽 아래 광고 카드는
 * 사용자의 관심 주제에 따라 페이지마다 다르고, 왼쪽 위 날짜 카드는 페이지의 날짜를 그대로
 * 따라간다. 페이지 자체가 통째로 넘어가는 슬라이드 단위라 각 페이지마다 새로 그린다(카드만
 * 따로 바뀌고 나머지가 고정된 것처럼 보이면 안 된다).
 *
 * 날짜 카드 자체는 더 이상 자기 안에서 좌우로 끌리지 않는다 — 이 영역 위에서 잡고 움직여도
 * discovery-page__viewport(부모, 3카드 전체 페이지 전환)가 그 제스처를 받아야 하기
 * 때문이다. `.today-card__track`은 페이지당 날짜 하나만 담아 그 자체로 넘길 내용이
 * 없고(overflow: hidden), 페이지가 넘어갈 때 부모가 다음 날짜의 카드로 통째로 바꿔친다. */
function DiscoveryPage({ day, tip, ad, onOpenRecommendSetup, onOpenAd }: DiscoveryPageProps) {
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

        {/* 요약만 보여주는 광고 카드 — 카드 전체가 버튼이라 누르면 상세 바텀시트가 열린다.
         * 기간·광고주·CTA 는 카드에 두지 않는다(상세에서만 쓴다). 버튼 안이라 p/div 대신 span 이다. */}
        <button
          type="button"
          className="info-card info-card--sale info-card--ad"
          aria-label={`광고 ${ad.headline}, ${ad.sub}, ${ad.benefitLabel} ${ad.benefitValue}. 자세히 보기`}
          onClick={() => onOpenAd?.(ad)}
        >
          <span className="info-card__top">
            <span className="info-card__label-row">
              <span className="info-card__label">자두 PICK</span>
              <span className="info-card__ad">AD</span>
            </span>
            <span className="info-card__tit">
              <span className="info-card__headline">{ad.headline}</span>
              <span className="info-card__period">{ad.sub}</span>
            </span>
          </span>
          <span className="info-card__foot">
            <span className="info-card__foot-label">{ad.benefitLabel}</span>
            <span className="info-card__foot-value">{ad.benefitValue}</span>
          </span>
        </button>

        {/* 광고 이미지는 카드 밖(컬럼 기준)에 배치된다 — 컬럼 기준으로 앵커링해 컬럼이 좁아져도
         * 옆 맞춤 팁 카드 쪽으로 번지지 않는다. 클릭은 pointer-events:none 으로 아래 카드에 전달된다. */}
        <AdIcon
          className="info-card__art info-card__art--ad"
          sheet={ad.imageSheet}
          position={ad.imagePosition}
          label={ad.adCategory}
        />
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
export function DiscoverySection({ onOpenRecommendSetup, onOpenAd }: DiscoverySectionProps = {}) {
  const { user } = useAuth();
  /* 오늘부터 +3일 — 한국 시간 기준 'MM.DD 요일' + 그 날의 꿀팁
   * (자정이 지나면 네 날짜가 함께 하루씩 밀린다). "자두가 알려드려요"의 페이지 수는
   * 항상 이 날짜 개수(4)를 그대로 따른다 — 관심 주제를 몇 개 골랐는지와 무관하다. */
  const days = useSeoulDays(4);

  /* 맞춤 추천 설정 여부는 별도 플래그가 아니라 실제 저장값으로 판단한다 —
   * 관심 주제를 한 번이라도 고르면 설정을 마친 것으로 본다. 관심 분야는 더 이상 저장되는
   * 선택값이 아니라(관심 주제를 탐색하는 탭일 뿐) 여기서도 따지지 않는다. */
  /* trim/lowercase 는 이제 livingProfile.ts 안에서 항상 해준다 — 호출부는 원본
   * 이메일을 그대로 넘기면 된다(Home/MyPage 와 같은 방식으로 통일). */
  const ownerKey = user?.email ?? 'guest';
  const livingProfile = loadLivingProfile(ownerKey);
  /* 모든 분야에서 실제로 고른 관심 주제를 후보 풀로 합친다 — 문자열만으로는 어느 분야
   * 주제인지 알 수 없어(같은 이름의 주제가 없더라도) 분야를 같이 들고 있는다. 분야는
   * INTEREST_CATEGORIES 순서, 그 안에서는 INTEREST_TOPICS 순서(저장된 배열 순서가 아니라
   * 항상 같은 순서)로 이어붙인다. 아무 분야에서도 하나도 안 골랐으면 빈 배열이라 아래
   * pages 가 전부 설정 CTA(tip: null)를 보여준다. */
  const candidateTopics: { category: InterestCategory; topic: string }[] = INTEREST_CATEGORIES.flatMap(
    (category) => {
      const orderedTopics = INTEREST_TOPICS[category];
      const chosenTopics = livingProfile.topics[category] ?? [];
      const matchedTopics = chosenTopics.filter((topic) => orderedTopics.includes(topic));
      return matchedTopics.map((topic) => ({ category, topic }));
    },
  );

  /* 페이지(=3카드 세트) 목록 — 날짜 4개에 1:1로 대응해 항상 4장이다. 각 페이지의 맞춤
   * 팁은 후보 풀을 페이지 인덱스로 순환시켜 고른다(candidateTopics[index % length]) —
   * 예를 들어 두 분야 합쳐 3개를 골랐다면 09.15→첫 후보, 09.16→둘째, 09.17→셋째,
   * 09.18→다시 첫 후보 순으로 돌아간다. 아직 추천 설정 전이면(분야 0개) 모든
   * 페이지가 설정 CTA(tip: null)를 보여준다. 정상 데이터라면 항상 찾지만, 혹시 못 찾는
   * topic 이 있어도(mismatch) null 로 걸러내 화면이 깨지지 않게 한다. */
  /* 광고 4개는 팁과 별개로 같은 저장값(관심 주제)에서 따로 고른다 — 팁과 같은 주제가 우연히
   * 맞을 수는 있어도 일부러 맞추지 않는다. 항상 페이지 수(4)만큼 나온다(data/adContents.ts). */
  const ads = selectDiscoveryAds(livingProfile.topics);

  const pages = days.map((day, index) => {
    const candidate = candidateTopics.length > 0 ? candidateTopics[index % candidateTopics.length] : null;
    const tip = candidate ? (RECOMMENDATION_TIPS[candidate.category][candidate.topic] ?? null) : null;
    return { key: day.date, day, tip, ad: ads[index % ads.length] };
  });

  /* 페이지 넘기기 — 3카드 세트 전체가 하나의 슬라이드로 통째로 좌우 이동한다(카드 하나씩
   * 따로 움직이지 않는다). count 는 pages.length(=날짜 개수) 그대로다. */
  const pageCarousel = useCardCarousel({ count: pages.length });
  const canPage = pages.length > 1;
  /* 이전(‹)은 01에서 막힌다(그 앞 페이지가 없다는 뜻이라 비활성 처리) — goTo(index-1)로만
   * 옮긴다. 다음(›)은 반대로 04에서도 계속 활성 상태로 두고 goNext()(무한 순환, 이미
   * swipe 가 쓰는 것과 같은 함수)를 그대로 써서 04 → 01 로 끊김 없이 돈다. */
  const isFirstPage = pageCarousel.index === 0;

  /* 첫 노출 때만 실제 페이지를 바꾸지 않는 짧은 swipe affordance를 보여준다. 섹션이
   * viewport에 들어온 뒤 1초를 기다리며, reduced-motion 환경과 사용자가 먼저 조작한
   * 경우에는 실행하지 않는다. */
  const sectionRef = useRef<HTMLElement>(null);
  const hintTimerRef = useRef<number>();
  const hintHandledRef = useRef(false);
  const [isSwipeHinting, setIsSwipeHinting] = useState(false);

  const cancelSwipeHint = () => {
    hintHandledRef.current = true;
    window.clearTimeout(hintTimerRef.current);
    setIsSwipeHinting(false);
  };

  useEffect(() => {
    if (!canPage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || hintHandledRef.current) return;
      hintHandledRef.current = true;
      observer.disconnect();
      hintTimerRef.current = window.setTimeout(() => setIsSwipeHinting(true), 1000);
    }, { threshold: 0.35 });

    observer.observe(section);
    return () => {
      observer.disconnect();
      window.clearTimeout(hintTimerRef.current);
    };
  }, [canPage]);

  const handlePrevClick = () => {
    cancelSwipeHint();
    pageCarousel.goTo(pageCarousel.index - 1);
  };
  const handleNextClick = () => {
    cancelSwipeHint();
    pageCarousel.goNext();
  };
  const handleTabClick = (index: number) => {
    if (index === pageCarousel.index) return;
    cancelSwipeHint();
    pageCarousel.goTo(index);
  };

  return (
    <section className="discovery" ref={sectionRef} onPointerDownCapture={cancelSwipeHint}>
      <div className="discovery__top">
        <h2>자두가 알려드려요</h2>
        {/* 카드 안 '설정하기'와 같은 진입점이다 — 페이지를 옮기지 않고
          * 홈 시트 안의 맞춤 추천 설정 View 를 연다. */}
        <button type="button" className="discovery__settings" onClick={onOpenRecommendSetup}>
          <span className="home-action-button__icon">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M2 4.5h7M12.5 4.5H14M2 11.5h1.5M7 11.5h7" />
              <circle cx="10.75" cy="4.5" r="1.75" />
              <circle cx="5.25" cy="11.5" r="1.75" />
            </svg>
          </span>
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
          <span className="discovery__page-chevron-icon discovery__page-chevron-icon--prev" style={CHEVRON_STYLE} aria-hidden="true" />
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
          <span className="discovery__page-chevron-icon" style={CHEVRON_STYLE} aria-hidden="true" />
        </button>
      </div>

      <div className="discovery__body">
        {/* 실제로 슬라이드를 자르는 overflow:hidden 은 안쪽 viewport 만 갖는다 —
          * 페이지 전환(3카드 전체 슬라이드)과 카드 폭·gap·padding 은 이전과 완전히 같다. */}
        <div className="discovery-page__carousel">
          <div className="discovery-page__viewport" {...(canPage ? pageCarousel.viewportHandlers : {})}>
            <div
              className={`discovery-page__track${pageCarousel.isDragging ? ' is-dragging' : ''}${
                isSwipeHinting ? ' is-hinting' : ''
              }`}
              onAnimationEnd={() => setIsSwipeHinting(false)}
              style={
                {
                  '--discovery-page-gap': `${DISCOVERY_PAGE_GAP_PX}px`,
                  transform: `translateX(calc(${-pageCarousel.index * 100}% - ${pageCarousel.index * DISCOVERY_PAGE_GAP_PX}px + ${pageCarousel.dragOffset}px))`,
                } as CSSProperties
              }
            >
              {pages.map(({ key, day, tip, ad }) => {
                return (
                  <div className="discovery-page__slide" key={key}>
                    <DiscoveryPage
                      day={day}
                      tip={tip}
                      ad={ad}
                      onOpenRecommendSetup={onOpenRecommendSetup}
                      onOpenAd={onOpenAd}
                    />
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
