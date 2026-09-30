import { useEffect, useState } from 'react';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { SubPageHeader } from '../components/SubPageHeader';
import { getBenefitById } from '../data/benefits';
import { icon } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';

export function BenefitDetailPage() {
  const navigation = useAppNavigation();
  const { isBenefitSaved, toggleBenefit } = useBookmarks();
  const [notice, setNotice] = useState('');
  const benefit = getBenefitById(navigation?.options.benefitId);
  const returnTo = navigation?.options.returnTo ?? 'benefits-recommend';

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const goBack = () => navigation?.goBack(returnTo);

  if (!benefit) {
    return (
      <div className="benefit-detail app">
        <SubPageHeader
          title="혜택·복지"
          backLabel="이전 화면으로"
          onBack={goBack}
        />
        <main className="benefit-detail__empty">
          <h2>혜택 정보를 찾을 수 없어요.</h2>
          <button type="button" onClick={goBack}>목록으로 돌아가기</button>
        </main>
      </div>
    );
  }

  const saved = isBenefitSaved(benefit.id);
  const meta = benefit.frequency
    ? `${benefit.frequency} / 주관  ${benefit.organizer}`
    : `주관  ${benefit.organizer}`;

  return (
    <div className="benefit-detail app">
      <SubPageHeader
        title="혜택·복지"
        backLabel="혜택 목록으로"
        onBack={goBack}
      />

      <main className="benefit-detail__scroll">
        <section className="benefit-detail__hero">
          <div className="benefit-detail__headline">
            <div className="benefit-detail__context">
              <span>혜택 상세</span>
              <button
                type="button"
                className={`benefit-detail__bookmark${saved ? ' is-saved' : ''}`}
                aria-pressed={saved}
                aria-label={`${benefit.title} 저장`}
                onClick={() => toggleBenefit(benefit.id)}
              />
            </div>

            <div className="benefit-detail__highlight">
              <div className="benefit-detail__meta-row">
                <span className="benefit-detail__status">
                  {benefit.status}  ·  {benefit.deadline}
                </span>
                <small>지원 금액 · {meta}</small>
              </div>
              <h2>{benefit.title}</h2>
              <div className="benefit-detail__amount">
                <span>{benefit.amountLabel}</span>
                <strong>{benefit.amount}</strong>
              </div>
            </div>
          </div>

          <div className="benefit-detail__summary">
            <h3>지원 내용</h3>
            <p>{benefit.description}</p>
          </div>
        </section>

        <section className="benefit-detail__section benefit-detail__eligibility">
          <div className="benefit-detail__card">
            <div className="benefit-detail__card-head">
              <h3>신청 대상</h3>
              <span>조건 {benefit.matchCount}개 일치</span>
            </div>
            <p>{benefit.eligibility}</p>
          </div>
        </section>

        <section className="benefit-detail__section">
          <div className="benefit-detail__card">
            <h3>필요 서류</h3>
            <p>{benefit.documents.join('  ·  ')}</p>
          </div>
        </section>

        <section className="benefit-detail__section benefit-detail__process">
          <div className="benefit-detail__card">
            <h3>신청 절차</h3>
            <ol>
              {benefit.process.map((step, index) => (
                <li key={step}>
                  <strong>{String(index + 1).padStart(2, '0')}</strong>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="benefit-detail__notice-card">
          <div>
            <img src={icon('benefit-notice-bulb.svg')} alt="" />
            <h3>유의사항</h3>
          </div>
          {benefit.notices.map((item) => <p key={item}>{item}</p>)}
        </section>
      </main>

      <footer className="benefit-detail__footer">
        <button
          type="button"
          onClick={() => {
            if (benefit.applyUrl) {
              window.open(benefit.applyUrl, '_blank', 'noopener,noreferrer');
              return;
            }
            setNotice('신청 링크는 준비 중이에요.');
          }}
        >
          신청하러 가기
        </button>
      </footer>

      <p className="benefit-detail__toast" role="status" aria-live="polite" hidden={!notice}>{notice}</p>
    </div>
  );
}

export default BenefitDetailPage;
