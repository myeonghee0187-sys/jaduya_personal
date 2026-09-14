import { useEffect, useState } from 'react';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { getBenefitById } from '../data/benefits';
import { icon } from '../lib/asset';
import { useMyMenu } from '../menu/MyMenuContext';
import { useAppNavigation } from '../navigation/AppNavigation';

export function BenefitDetailPage() {
  const navigation = useAppNavigation();
  const myMenu = useMyMenu();
  const bookmarks = useBookmarks();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const benefit = getBenefitById(navigation?.options.benefitId);
  const returnTo = navigation?.options.returnTo ?? 'benefits-recommend';

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const goBack = () => navigation?.navigate(returnTo);

  if (!benefit) {
    return (
      <div className="benefit-detail app">
        <SubPageHeader
          title="혜택·복지"
          backLabel="이전 화면으로"
          onBack={goBack}
          onMenu={() => setGnbOpen(true)}
        />
        <main className="benefit-detail__empty">
          <h2>혜택 정보를 찾을 수 없어요.</h2>
          <button type="button" onClick={goBack}>목록으로 돌아가기</button>
        </main>
        <GnbOverlay open={gnbOpen} myMenu={myMenu.myMenu} onClose={() => setGnbOpen(false)} onEditMenu={myMenu.openEdit} />
        <MyMenuEdit open={myMenu.editOpen} draft={myMenu.draft} onClose={myMenu.closeEdit} onSave={myMenu.saveEdit} />
      </div>
    );
  }

  const isSaved = bookmarks.isBenefitSaved(benefit.id);
  const meta = benefit.frequency
    ? `${benefit.frequency} / 주관  ${benefit.organizer}`
    : `주관  ${benefit.organizer}`;

  return (
    <div className="benefit-detail app">
      <SubPageHeader
        title="혜택·복지"
        backLabel="혜택 목록으로"
        onBack={goBack}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="benefit-detail__scroll">
        <section className="benefit-detail__hero">
          <div className="benefit-detail__context">
            <span>혜택 상세</span>
            <button
              type="button"
              className={`benefit-detail__bookmark${isSaved ? ' is-active' : ''}`}
              aria-label={`${benefit.title} ${isSaved ? '저장 해제' : '저장'}`}
              aria-pressed={isSaved}
              onClick={() => bookmarks.toggleBenefit(benefit.id)}
            >
              <img src={icon('community-bookmark.svg')} alt="" />
            </button>
          </div>

          <div className="benefit-detail__headline">
            <div className="benefit-detail__meta-row">
              <span>{benefit.status} · {benefit.deadline}</span>
              <small>지원 금액 · {meta}</small>
            </div>
            <h2>{benefit.title}</h2>
            <div className="benefit-detail__amount">
              <span>{benefit.amountLabel}</span>
              <strong>{benefit.amount}</strong>
            </div>
          </div>

          <div className="benefit-detail__description">
            <h3>지원 내용</h3>
            <p>{benefit.description}</p>
          </div>
        </section>

        <section className="benefit-detail__section benefit-detail__eligibility">
          <div className="benefit-detail__section-heading">
            <h3>신청 대상</h3>
            <span>조건 {benefit.matchCount}개 일치</span>
          </div>
          <p>{benefit.eligibility}</p>
        </section>

        <section className="benefit-detail__section">
          <h3>필요 서류</h3>
          <p>{benefit.documents.join('  ·  ')}</p>
        </section>

        <section className="benefit-detail__section benefit-detail__process">
          <h3>신청 절차</h3>
          <ol>
            {benefit.process.map((step, index) => (
              <li key={step}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="benefit-detail__notice-card">
          <div>
            <img src={icon('info-warn.svg')} alt="" />
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
      <GnbOverlay open={gnbOpen} myMenu={myMenu.myMenu} onClose={() => setGnbOpen(false)} onEditMenu={myMenu.openEdit} />
      <MyMenuEdit open={myMenu.editOpen} draft={myMenu.draft} onClose={myMenu.closeEdit} onSave={myMenu.saveEdit} />
    </div>
  );
}

export default BenefitDetailPage;
