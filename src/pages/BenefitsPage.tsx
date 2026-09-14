import { useState } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon } from '../lib/asset';
import { useMyMenu } from '../menu/MyMenuContext';
import { useAppNavigation } from '../navigation/AppNavigation';

const BENEFIT_CATEGORIES = ['전체', '주거', '생활비', '반려동물', '의료'] as const;
type BenefitCategory = (typeof BENEFIT_CATEGORIES)[number];

const BENEFITS = [
  {
    id: 'youth-rent',
    rank: 1,
    title: '청년 월세 특별지원',
    region: '전국',
    applicants: '1240명',
    target: '만 19-34세 무주택 청년 1인 가구',
  },
  {
    id: 'youth-leap',
    rank: 2,
    title: '청년도약계좌',
    region: '경기',
    applicants: '980명',
    target: '만 19-34세 근로 · 사업 소득 청년',
  },
  {
    id: 'gyeonggi-points',
    rank: 3,
    title: '경기도 청년 복지포인트',
    region: '경기',
    applicants: '760명',
    target: '경기 거주 만 19-39세 중소기업 재직 청년',
  },
] as const;

export function BenefitsPage() {
  const navigation = useAppNavigation();
  const myMenu = useMyMenu();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [category, setCategory] = useState<BenefitCategory>('전체');
  const [bookmarked, setBookmarked] = useState<string[]>(['youth-rent']);

  const toggleBookmark = (id: string) => {
    setBookmarked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div className="benefits app">
      <SubPageHeader
        title="혜택·복지"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="benefits__scroll">
        <section className="benefits-ai" aria-labelledby="benefits-ai-title">
          <div className="benefits-ai__top">
            <img className="benefits-ai__avatar" src={icon('ai-avatar.svg')} alt="" />
            <div className="benefits-ai__copy">
              <h2 id="benefits-ai-title">내 조건에 맞는 것만 골라볼까요?</h2>
              <p>나이 · 지역 · 직업 · 반려동물까지 한 번에 반영해요</p>
            </div>
          </div>
          <button
            type="button"
            className="benefits-ai__button"
            onClick={() => navigation?.navigate('benefits-recommend')}
          >
            <img
              className="benefits-ai__sparkle"
              src={icon('money-benefit-sparkle.svg')}
              alt=""
            />
            AI 맞춤 혜택 추천 보기
          </button>
        </section>

        <div className="benefits__content">
          <section className="benefits-filters" aria-label="혜택 필터">
            <div className="benefits-tabs" role="tablist" aria-label="혜택 카테고리">
              {BENEFIT_CATEGORIES.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={category === name}
                  className={`benefits-tabs__item${category === name ? ' is-active' : ''}`}
                  onClick={() => setCategory(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="benefits-chips" aria-label="상세 필터">
              <button type="button" className="benefits-chip benefits-chip--region">
                성남시
                <img src={icon('chevron-down.svg')} alt="" />
              </button>
              <button type="button" className="benefits-chip">접수 중</button>
              <button type="button" className="benefits-chip">마감 임박</button>
              <button type="button" className="benefits-chip benefits-chip--saved">
                저장됨
                <img src={icon('community-bookmark.svg')} alt="" />
              </button>
            </div>
          </section>

          <section className="benefits-list" aria-labelledby="benefits-list-title">
            <div className="benefits-list__header">
              <div>
                <h2 id="benefits-list-title">또래가 많이 신청한 지원</h2>
                <p>30–34세 · 경기 성남시 자취 1인 가구 기준</p>
              </div>
              <button type="button" className="benefits-list__sort">
                인기순
                <img src={icon('chevron-down-thin.svg')} alt="" />
              </button>
            </div>

            <div className="benefits-cards">
              {BENEFITS.map((benefit) => {
                const isBookmarked = bookmarked.includes(benefit.id);
                return (
                  <article key={benefit.id} className="benefit-card">
                    <div className="benefit-card__content">
                      <div className="benefit-card__top">
                        <span className={`benefit-card__rank${benefit.rank === 1 ? ' is-first' : ''}`}>
                          또래 {benefit.rank}위
                        </span>
                        <button
                          type="button"
                          className={`benefit-card__bookmark${isBookmarked ? ' is-active' : ''}`}
                          aria-label={`${benefit.title} ${isBookmarked ? '저장 해제' : '저장'}`}
                          aria-pressed={isBookmarked}
                          onClick={() => toggleBookmark(benefit.id)}
                        >
                          <img src={icon('community-bookmark.svg')} alt="" />
                        </button>
                      </div>

                      <div className="benefit-card__details">
                        <div className="benefit-card__title-group">
                          <h3>{benefit.title}</h3>
                          <div className="benefit-card__meta">
                            <span>{benefit.region} · 상시 접수</span>
                            <strong>이번주 신청인원 : {benefit.applicants}</strong>
                          </div>
                        </div>
                        <p className="benefit-card__target">{benefit.target}</p>
                      </div>
                    </div>

                    <div className="benefit-card__bottom">
                      <button type="button" className="benefit-card__detail">
                        자세히 보기
                        <img src={icon('chevron-right-sm.svg')} alt="" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <BottomNavigation activeTab="home" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />
    </div>
  );
}

export default BenefitsPage;
