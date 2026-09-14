import { useEffect, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { COMMUNITY_TABS, COMMUNITY_TIP_TAB } from '../data/communityPosts';
import { MY_SPENDING_REPORT, PEER_COMPARISONS, SPEND_INSIGHT_APP_LINK } from '../data/spendCompare';
import { useElasticDragScroll } from '../hooks/useElasticDragScroll';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

/* 커뮤니티 '소비 비교' — Figma compare_spending (2257:17167).
 * 헤더·탭바·바텀네비만 다른 커뮤니티 화면과 같은 구조를 쓴다. 이 화면은 글쓰기 대상이 되는
 * 게시글이 없어 검색창·글쓰기 버튼을 두지 않고, AI 챗봇만 글쓰기 버튼 자리(기본 위치)에 둔다. */
export function CommunitySpendComparePage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const [notice, setNotice] = useState('');
  const peersDrag = useElasticDragScroll<HTMLDivElement>();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="커뮤니티 홈으로"
        onBack={() => navigation?.navigate('community')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="community__scroll community__scroll--enter">
        {/* ============ 탭 — '전체' / '질문' / '자취 꿀팁' / '지역 후기' 는 각자의 화면으로 돌아간다 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === '소비 비교' ? ' is-active' : ''}`}
              aria-current={name === '소비 비교' ? 'page' : undefined}
              onClick={() => {
                if (name === '전체') navigation?.navigate('community');
                else if (name === '질문') navigation?.navigate('community-question');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigate('community-tip');
                else if (name === '지역 후기') navigation?.navigate('community-region');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        {/* ============ 이번달 지출 리포트 ============ */}
        <section className="spend-compare-report">
          <div className="spend-compare-report__head">
            <p className="spend-compare-report__label">{MY_SPENDING_REPORT.title}</p>
            <span className="spend-compare-report__badge">{MY_SPENDING_REPORT.deltaLabel}</span>
          </div>
          <p className="spend-compare-report__amount">
            {MY_SPENDING_REPORT.amount.toLocaleString()}원
          </p>
          <button
            type="button"
            className="spend-compare-report__more"
            onClick={() => navigation?.navigate('money', { tab: '소비' })}
          >
            전체보기 &gt;
          </button>
        </section>

        {/* ============ 비슷한 자취생과 비교 ============ */}
        <section className="spend-compare-peers">
          <h2 className="spend-compare-peers__title">비슷한 자취생과 비교</h2>
          <p className="spend-compare-peers__sub">나와 비슷한 조건의 자취생 3명과 비교했어요</p>

          <div className="spend-compare-peers__row" ref={peersDrag.ref} {...peersDrag.dragProps}>
            {PEER_COMPARISONS.map((peer) => (
              <article key={peer.id} className="peer-card">
                <div className="peer-card__top">
                  <span
                    className="peer-card__avatar"
                    style={{ backgroundColor: peer.avatarColor }}
                    aria-hidden="true"
                  >
                    {peer.avatarInitial}
                  </span>
                  <span className="peer-card__names">
                    <span className="peer-card__name">{peer.name}</span>
                    <span className="peer-card__condition">{peer.condition}</span>
                  </span>
                </div>
                <p className="peer-card__amount">총 {peer.amount.toLocaleString()}원</p>
                <span className={`peer-card__badge peer-card__badge--${peer.deltaTone}`}>
                  {peer.deltaLabel}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* ============ 소비 인사이트 공유 ============ */}
        <section className="spend-compare-insight">
          <h2 className="spend-compare-insight__title">소비 인사이트 공유</h2>

          <button
            type="button"
            className="spend-app-link"
            onClick={() => setNotice('가계부 앱 연동은 준비 중이에요.')}
          >
            <span className="spend-app-link__left">
              <span className="spend-app-cluster">
                <span className="spend-app-icon">
                  <span className="spend-app-icon__clip">
                    <img src={icon('spend-app-icon-1.png')} alt="" />
                  </span>
                </span>
                <span className="spend-app-icon spend-app-icon--yellow">
                  <img src={icon('spend-app-icon-2.svg')} alt="" />
                </span>
                <span className="spend-app-icon">
                  <img src={icon('spend-app-icon-3.png')} alt="" />
                </span>
                <img className="spend-app-cluster__marker" src={icon('spend-app-marker.svg')} alt="" />
              </span>
              <span className="spend-app-link__text">
                <span className="spend-app-link__title">{SPEND_INSIGHT_APP_LINK.title}</span>
                <span className="spend-app-link__sub">{SPEND_INSIGHT_APP_LINK.sub}</span>
              </span>
            </span>
            <img className="spend-app-link__arrow" src={icon('spend-east-arrow.svg')} alt="" />
          </button>
        </section>
      </main>

      <p className="community-notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="community" />
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
      {/* 이 화면엔 글쓰기 버튼이 없어 챗봇이 기본 위치(글쓰기 버튼 자리)에 온다 */}
      <AIChatbot />
    </div>
  );
}

export default CommunitySpendComparePage;
