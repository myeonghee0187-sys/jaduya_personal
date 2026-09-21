import { useEffect, useState } from 'react';
import { MOCK_USERS } from '../auth/mockUsers';
import { BottomNavigation } from '../components/BottomNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BENEFITS, RECOMMENDED_BENEFIT_IDS } from '../data/benefits';

const RECOMMENDED_BENEFITS = RECOMMENDED_BENEFIT_IDS.map((id) =>
  BENEFITS.find((benefit) => benefit.id === id),
).filter((benefit): benefit is NonNullable<typeof benefit> => Boolean(benefit));

const AYOUNG = MOCK_USERS['ayoung@jaduya.com'];
const AYOUNG_GIVEN_NAME = AYOUNG.name.slice(1);

export function BenefitsRecommendPage() {
  const navigation = useAppNavigation();
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="benefits-recommend app">
      <SubPageHeader
        title="혜택·복지"
        backLabel="혜택·복지 메인으로"
        onBack={() => navigation?.goBack('benefits')}
      />

      <main className="benefits-recommend__scroll">
        <section className="recommend-banner" aria-labelledby="recommend-banner-title">
          <div className="recommend-banner__intro">
            <div className="recommend-banner__label">
              <img src={icon('ai-avatar.svg')} alt="" />
              <span>AI 맞춤 추천</span>
            </div>
            <h2 id="recommend-banner-title">
              {AYOUNG_GIVEN_NAME}님 조건으로
              <br />
              자두가 받을 수 있는 혜택을 모았어요.
            </h2>
          </div>

          <div className="recommend-banner__conditions">
            <p>31세 · 경기 성남시 · 자취 5년차 · 직장인</p>
          </div>
        </section>

        <section className="recommend-list" aria-labelledby="recommend-list-title">
          <div className="recommend-list__header">
            <div>
              <h2 id="recommend-list-title">신청 가능한 혜택 2개</h2>
              <p>지역·나이가 맞지 않는 4개는 제외했어요</p>
            </div>
          </div>

          <div className="recommend-list__cards">
            {RECOMMENDED_BENEFITS.map((benefit) => (
              <article key={benefit.id} className="recommend-card">
                <div className="recommend-card__tags">
                  <span className="recommend-card__tag recommend-card__tag--deadline">
                    {benefit.deadline}
                  </span>
                  <span className="recommend-card__tag recommend-card__tag--method">온라인신청</span>
                </div>

                <div className="recommend-card__info">
                  <h3>{benefit.title}</h3>
                  <p className="recommend-card__target">{benefit.eligibility}</p>
                </div>

                <button
                  type="button"
                  className="recommend-card__apply"
                  onClick={() =>
                    navigation?.navigate('benefit-detail', {
                      benefitId: benefit.id,
                      returnTo: 'benefits-recommend',
                      returnOptions: navigation.options,
                    })
                  }
                >
                  자세히 보기
                </button>
              </article>
            ))}
          </div>
        </section>
        <div className="benefits-recommend__bottom-space" aria-hidden="true" />
      </main>

      <p className="benefits-recommend__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="home" />
    </div>
  );
}

export default BenefitsRecommendPage;
