import { BottomNavigation } from '../components/BottomNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { BenefitCard } from '../components/BenefitCard';
import { icon } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BENEFIT_CATEGORIES, BENEFIT_CATEGORY_PAGES, BENEFIT_LIST_ITEMS, RANKED_BENEFIT_IDS } from '../data/benefits';

const RANKED_BENEFITS = RANKED_BENEFIT_IDS.map((id) =>
  BENEFIT_LIST_ITEMS.find((item) => item.id === id),
).filter((item): item is NonNullable<typeof item> => Boolean(item));

export function BenefitsPage() {
  const navigation = useAppNavigation();

  return (
    <div className="benefits app">
      <SubPageHeader
        title="혜택·복지"
        backLabel="홈으로"
        onBack={() => navigation?.goBack('home')}
      />

      <main className="benefits__scroll">
        <nav className="benefits-tabs" role="tablist" aria-label="혜택 카테고리">
          {BENEFIT_CATEGORIES.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={name === '전체'}
              className={`benefits-tabs__item${name === '전체' ? ' is-active' : ''}`}
              onClick={() => name !== '전체' && navigation?.navigateTab(BENEFIT_CATEGORY_PAGES[name])}
            >
              {name}
            </button>
          ))}
        </nav>

        <section className="benefits-hero" aria-labelledby="benefits-ai-title">
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
            onClick={() => navigation?.navigate('benefits-recommend', {
              returnTo: 'benefits',
              returnOptions: navigation.options,
            })}
          >
            <span className="benefits-ai__sparkle" aria-hidden="true" />
            AI 맞춤 혜택 추천 보기
          </button>
        </section>

        <div className="benefits-sheet">
          <section className="benefits-list" aria-labelledby="benefits-list-title">
            <div className="benefits-list__header">
              <div>
                <h2 id="benefits-list-title">또래가 많이 신청한 지원</h2>
                <p>30–34세 · 경기 성남시 자취 1인 가구 기준</p>
              </div>
              <button type="button" className="benefits-list__sort">
                더보기
                <img src={icon('chevron-right-thin.svg')} alt="" />
              </button>
            </div>

            <div className="benefits-cards">
              {RANKED_BENEFITS.map((benefit) => (
                <BenefitCard key={benefit.id} item={benefit} showCategory />
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomNavigation activeTab="home" />
    </div>
  );
}

export default BenefitsPage;
