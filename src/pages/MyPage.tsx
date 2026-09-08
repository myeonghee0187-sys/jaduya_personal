import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { BellButton } from '../components/BellButton';
import { GnbOverlay } from '../components/GnbOverlay';
import { StatusBar } from '../components/StatusBar';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { icon, img } from '../lib/asset';
import '../styles/mypage.css';

export type MyPageDestination = 'profile' | 'level' | 'activity' | 'settings' | 'support';

interface MyPageProps {
  onDetailNavigate?: (destination: MyPageDestination) => void;
}

const activityTabs = ['저장', '완료', '작성', '댓글'] as const;

export function MyPage({ onDetailNavigate }: MyPageProps) {
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [activity, setActivity] = useState<(typeof activityTabs)[number]>('저장');
  const [notice, setNotice] = useState('');
  const name = user?.name || '서준';

  const go = (destination: MyPageDestination, label: string) => {
    if (onDetailNavigate) onDetailNavigate(destination);
    else setNotice(`${label} 상세 화면은 준비 중이에요.`);
  };

  return (
    <div className="mypage app">
      <header className="mypage__header">
        <StatusBar />
        <div className="mypage__nav">
          <button type="button" className="mypage__back" aria-label="홈으로" onClick={() => navigation?.navigate('home')}>
            <img src={icon('gnb-back.svg')} alt="" />
          </button>
          <h1>마이페이지</h1>
          <div className="mypage__actions">
            <BellButton />
            <button type="button" className="mypage__menu" aria-label="전체 메뉴" onClick={() => setGnbOpen(true)}>
              <img src={icon('header-menu.svg')} alt="" />
            </button>
          </div>
        </div>
      </header>

      <main className="mypage__scroll">
        <section className="mypage__profile" aria-labelledby="profile-title">
          <img className="mypage__avatar" src={img('mypage-profile.png')} alt="" />
          <div className="mypage__profile-copy">
            <h2 id="profile-title">{name}님</h2>
            <p>자취 새내기 · 원룸 거주</p>
            <button type="button" className="mypage__profile-button" onClick={() => go('profile', '프로필')}>
              프로필 관리 <img src={icon('chevron-right-sm.svg')} alt="" />
            </button>
          </div>
        </section>

        <button type="button" className="mypage__level" onClick={() => go('level', '레벨')}>
          <div className="mypage__level-head"><h2>나의 자취 레벨</h2><span>전체보기 &gt;</span></div>
          <div className="mypage__level-row">
            <div className="mypage__level-title"><img src={img('mypage-seed.png')} alt="" /><strong>Lv.2</strong><b>씨앗</b></div>
            <strong className="mypage__percent">57<small>%</small></strong>
          </div>
          <div className="mypage__progress" aria-label="레벨 진행도 57퍼센트"><span /></div>
          <p className="mypage__xp">다음 레벨까지 <b>45 XP</b> 남았어요</p>
        </button>

        <section className="mypage__activity" aria-labelledby="activity-title">
          <div className="mypage__section-head"><h2 id="activity-title">나의 활동</h2><button type="button" onClick={() => go('activity', '활동')}>전체보기 &gt;</button></div>
          <div className="mypage__tabs" role="tablist">
            {activityTabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activity === tab} className={activity === tab ? 'is-active' : ''} onClick={() => setActivity(tab)}>{tab}</button>)}
          </div>
          {activity === '저장' ? (
            <div className="mypage__saved-list">
              <button type="button" className="mypage__saved-card" onClick={() => setNotice('분리수거 상세 화면은 준비 중이에요.')}>
                <img src={icon('menu-recycle.svg')} alt="" /><span><b>분리수거 헷갈리는 품목 정리</b><small>플라스틱·비닐·스티로폼 분류 기준 · 2026.02.18</small></span><img src={icon('chevron-right-sm.svg')} alt="" />
              </button>
              <button type="button" className="mypage__saved-card" onClick={() => setNotice('전기요금 상세 화면은 준비 중이에요.')}>
                <img src={icon('menu-wallet.svg')} alt="" /><span><b>전기요금 납부 방법 &amp; 자동이체 신청</b><small>놓치지 않게 미리 준비해요 · 2026.02.14</small></span><img src={icon('chevron-right-sm.svg')} alt="" />
              </button>
            </div>
          ) : <p className="mypage__empty">아직 {activity}한 활동이 없어요.</p>}
        </section>

        <section className="mypage__links" aria-label="개인 메뉴">
          <button type="button" onClick={() => go('profile', '자취 프로필')}><span>자취 프로필</span><img src={icon('chevron-right-sm.svg')} alt="" /></button>
          <button type="button" onClick={() => go('settings', '앱 설정')}><span>앱 설정</span><img src={icon('chevron-right-sm.svg')} alt="" /></button>
          <div className="mypage__support"><div><h2>고객 관리</h2><p>FAQ · 문의하기 · 약관</p></div><button type="button" aria-label="고객 관리 열기" onClick={() => go('support', '고객 관리')}><img src={icon('chevron-right-sm.svg')} alt="" /></button></div>
        </section>
        <p className="mypage__notice" aria-live="polite">{notice}</p>
      </main>
      <BottomNavigation activeTab="my" />
      <GnbOverlay open={gnbOpen} myMenu={DEFAULT_MENU} onClose={() => setGnbOpen(false)} onEditMenu={() => setNotice('내 메뉴 편집은 홈에서 이용할 수 있어요.')} />
    </div>
  );
}

export default MyPage;
