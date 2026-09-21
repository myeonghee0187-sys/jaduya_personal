import { BottomNavigation } from '../components/BottomNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { BenefitCard } from '../components/BenefitCard';
import { icon } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BENEFIT_CATEGORIES, BENEFIT_CATEGORY_PAGES, benefitListItemsByCategory } from '../data/benefits';

const MEDICAL_BENEFITS = benefitListItemsByCategory('의료');

/* 혜택·복지 '의료' 탭 — 전체 탭과 같은 레이아웃을 재사용한다.
 * 실제 확정된 의료 지원 데이터가 아직 없어 빈 상태로 둔다 (임의로 항목을 만들지 않는다).
 * 성남시 칩은 전체 탭에만 있어 이 화면에는 두지 않는다. */
export function BenefitsMedicalPage() {
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
              aria-selected={name === '의료'}
              className={`benefits-tabs__item${name === '의료' ? ' is-active' : ''}`}
              onClick={() => name !== '의료' && navigation?.navigateTab(BENEFIT_CATEGORY_PAGES[name])}
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
              returnTo: 'benefits-medical',
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
                <h2 id="benefits-list-title">의료 지원 혜택</h2>
              </div>
              <button type="button" className="benefits-list__sort">
                더보기
                <img src={icon('chevron-right-thin.svg')} alt="" />
              </button>
            </div>

            {MEDICAL_BENEFITS.length === 0 ? (
              <p className="benefits-list__empty">아직 등록된 의료 지원 혜택이 없어요</p>
            ) : (
              <div className="benefits-cards">
                {MEDICAL_BENEFITS.map((benefit) => (
                  <BenefitCard key={benefit.id} item={benefit} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNavigation activeTab="home" />
    </div>
  );
}

export default BenefitsMedicalPage;
