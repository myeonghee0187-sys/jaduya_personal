import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { loadLivingProfile } from '../data/livingProfile';
import { getRecommendationTip } from '../data/recommendationTips';
import { useSeoulDays } from '../hooks/useSeoulToday';
import { useElasticDragScroll } from '../hooks/useElasticDragScroll';
import { img } from '../lib/asset';

interface DiscoverySectionProps {
  /* 맞춤 추천 카드의 '설정하기' · 헤더의 '추천 설정' 공통 진입점 —
   * 페이지를 옮기지 않고 홈 시트 안의 맞춤 추천 설정 View 만 연다. */
  onOpenRecommendSetup?: () => void;
}

/** ③ 자두의 발견 — 정적 콘텐츠 + 추천 설정 진입점 */
export function DiscoverySection({ onOpenRecommendSetup }: DiscoverySectionProps = {}) {
  const { user } = useAuth();
  /* 오늘부터 +3일 — 한국 시간 기준 'MM.DD 요일' + 그 날의 꿀팁
   * (자정이 지나면 네 날짜가 함께 하루씩 밀린다) */
  const days = useSeoulDays(4);
  /* 데스크톱에서도 마우스로 끌어 넘길 수 있게 — 커뮤니티 카드 줄과 같은 훅을 쓴다 */
  const daysDrag = useElasticDragScroll<HTMLDivElement>();
  /* 지금 보고 있는 날짜 칸 — 아래 페이지네이션 점과 트랙을 양방향으로 묶는다.
   * (스크롤·스와이프로 넘기면 점이 따라오고, 점을 누르면 트랙이 그 칸으로 간다) */
  const [activeDay, setActiveDay] = useState(0);

  /* 칸 위치는 실제 DOM 에서 잰다 — 342px 를 나눈 칸 너비가 129.67px 처럼 소수로 떨어져서
   * clientWidth(130) 로 곱하고 나누면 뒤 칸으로 갈수록 몇 px 씩 어긋난다. */
  const dayCells = (): HTMLElement[] => {
    const el = daysDrag.ref.current;
    return el ? (Array.from(el.children) as HTMLElement[]) : [];
  };

  /* 스크롤·스와이프·드래그로 넘겼을 때 — 지금 왼쪽 끝에 가장 가까운 칸을 현재 페이지로 본다.
   * 고무줄 드래그로 양끝을 넘겨도 scrollLeft 는 0~max 로 잘려 들어와 0~3 을 벗어나지 않는다. */
  const handleDaysScroll = () => {
    const el = daysDrag.ref.current;
    const cells = dayCells();
    if (!el || cells.length === 0) return;
    const base = cells[0].offsetLeft;
    const distance = (cell: HTMLElement) => Math.abs(cell.offsetLeft - base - el.scrollLeft);
    let nearest = 0;
    cells.forEach((cell, index) => {
      if (distance(cell) < distance(cells[nearest])) nearest = index;
    });
    setActiveDay(nearest);
  };

  /* 점을 누르면 그 날짜 칸으로 옮긴다.
   * scrollTo({ behavior: 'smooth' }) 는 scroll-snap 컨테이너에서 통째로 무시되는 환경이 있어
   * (앱 내장 브라우저에서 실측) scrollLeft 를 직접 옮긴다 — 최종 정렬은 snap 이 맞춰 준다.
   * onScroll 이 곧 같은 값을 넣지만, 여기서도 바로 반영해 점이 즉시 따라오게 한다. */
  const goToDay = (index: number) => {
    const el = daysDrag.ref.current;
    const cells = dayCells();
    if (!el || !cells[index]) return;
    el.scrollLeft = cells[index].offsetLeft - cells[0].offsetLeft;
    setActiveDay(index);
  };

  /* 맞춤 추천 설정 여부는 별도 플래그가 아니라 실제 저장값으로 판단한다 —
   * 관심 분야(category)를 한 번이라도 고르면 설정을 마친 것으로 본다.
   * 어떤 분야를 골랐는지(생활/돈 관리/…)는 여기서 따지지 않는다. */
  const ownerKey = user?.email.trim().toLowerCase() ?? 'guest';
  const livingProfile = loadLivingProfile(ownerKey);
  const hasRecommendSetup = livingProfile.category !== null;
  /* 대표 추천 콘텐츠 — 카드에 보여줄 title/description. 정상 데이터라면 category 가
   * 있는 한 항상 값이 있지만, 혹시 못 찾아도(mismatch) null 이라 아래에서 안전하게 다룬다. */
  const recommendationTip = getRecommendationTip(livingProfile.category, livingProfile.topics);

  return (
    <section className="discovery">
      <div className="discovery__top">
        <h2>자두가 알려드려요</h2>
        {/* 카드 안 '설정하기'와 같은 진입점이다 — 페이지를 옮기지 않고
          * 홈 시트 안의 맞춤 추천 설정 View 를 연다. */}
        <button
          type="button"
          className="discovery__settings"
          onClick={onOpenRecommendSetup}
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
                onScroll={handleDaysScroll}
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
              /* title/description 은 RECOMMENDATION_TIPS 에서 실제 저장된 관심 분야·주제로
               * 고른 콘텐츠다(recommendationTips.ts 의 getRecommendationTip) — 더 이상
               * 날씨 목업이 아니라서 그 전용 일러스트(우산)·기온 표기는 함께 뺐다. */
              <div className="info-card__top">
                <p className="info-card__label">자두의 맞춤 팁</p>
                <div className="info-card__tit">
                  <p className="info-card__headline">{recommendationTip?.title}</p>
                  <p className="info-card__desc">{recommendationTip?.description}</p>
                </div>
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
                <button
                  type="button"
                  className="info-card__setup-cta"
                  onClick={onOpenRecommendSetup}
                >
                  설정하기
                </button>
              </div>
            )}
          </article>
        </div>

        {/* 날짜 칸과 1:1 로 대응하는 점 — 개수도 days 길이를 그대로 따른다 */}
        <div className="carousel-dots" role="tablist" aria-label="날짜 선택">
          {days.map((day, index) => (
            <button
              key={day.date}
              type="button"
              role="tab"
              className={`dot${index === activeDay ? ' dot--active' : ''}`}
              aria-selected={index === activeDay}
              aria-label={day.date}
              onClick={() => goToDay(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
