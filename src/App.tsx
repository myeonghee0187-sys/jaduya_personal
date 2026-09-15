import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import type { OnboardingSelection } from './pages/Onboarding';
import { Signup } from './pages/Signup';
import type { SignupTestProfile } from './auth/signupTestProfiles';
import { MyPage } from './pages/MyPage';
import { MissionPage } from './pages/MissionPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { SavedPage } from './pages/SavedPage';
import { LifePage } from './pages/LifePage';
import { MoneyPage } from './pages/MoneyPage';
import { MoneyBudgetPage } from './pages/MoneyBudgetPage';
import { LifeFirstPage } from './pages/LifeFirstPage';
import { LifeHomecarePage } from './pages/LifeHomecarePage';
import { LifeHousePage } from './pages/LifeHousePage';
import { LifeEatPage } from './pages/LifeEatPage';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityQuestionPage } from './pages/CommunityQuestionPage';
import { CommunityTipPage } from './pages/CommunityTipPage';
import { CommunityRegionPage } from './pages/CommunityRegionPage';
import { AIChatPage } from './pages/AIChatPage';
import { BenefitsPage } from './pages/BenefitsPage';
import { BenefitsRecommendPage } from './pages/BenefitsRecommendPage';
import { BenefitDetailPage } from './pages/BenefitDetailPage';
import { WidgetPage } from './pages/WidgetPage';
import { NotificationPage } from './pages/NotificationPage';
import { AppSettingsPage } from './pages/AppSettingsPage';
import { CustomerCenterPage } from './pages/CustomerCenterPage';
import { AIChatbot } from './components/ai/AIChatbot';
import { AppNavigationProvider, useAppNavigation } from './navigation/AppNavigation';
import { BookmarkProvider } from './bookmarks/BookmarkContext';
import { MyMenuProvider } from './menu/MyMenuContext';
import { WidgetPlacementProvider } from './widgets/WidgetPlacementContext';
import { NotificationProvider } from './notifications/NotificationContext';

function MainPages() {
  const navigation = useAppNavigation();
  const page = navigation?.page ?? 'home';
  const isAIChatOpen = navigation?.isAIChatOpen ?? false;
  const isHome = page === 'home';
  return (
    <>
      {/* Home을 유지해 왕복 이동 시 위젯과 시트 상태가 초기화되지 않게 한다. */}
      <div hidden={!isHome} style={isHome ? { display: 'contents' } : undefined}><Home /></div>
      {/* 마이페이지 '나의 자취 레벨 > 전체보기' → 자취 미션,
        * '나의 활동 > 전체보기' → 저장한 정보 */}
      {page === 'my' && (
        <MyPage
          onDetailNavigate={(to) => {
            if (to === 'level') {
              navigation?.navigate('mission');
              return true;
            }
            if (to === 'living-profile') {
              navigation?.navigate('living-profile');
              return true;
            }
            if (to === 'activity') {
              navigation?.navigate('saved');
              return true;
            }
            if (to === 'settings') {
              navigation?.navigate('settings');
              return true;
            }
            if (to === 'support') {
              navigation?.navigate('support');
              return true;
            }
            return false;
          }}
        />
      )}
      {page === 'mission' && <MissionPage />}
      {page === 'living-profile' && <ProfileSettingsPage />}
      {page === 'saved' && <SavedPage />}
      {page === 'life' && <LifePage />}
      {page === 'money' && <MoneyPage />}
      {page === 'money-budget' && <MoneyBudgetPage />}
      {page === 'widget-gallery' && <WidgetPage />}
      {page === 'life-first' && <LifeFirstPage />}
      {page === 'life-homecare' && <LifeHomecarePage />}
      {page === 'life-house' && <LifeHousePage />}
      {page === 'life-eat' && <LifeEatPage />}
      {page === 'community' && <CommunityPage />}
      {page === 'community-question' && <CommunityQuestionPage />}
      {page === 'community-tip' && <CommunityTipPage />}
      {page === 'community-region' && <CommunityRegionPage />}
      {page === 'benefits' && <BenefitsPage />}
      {page === 'benefits-recommend' && <BenefitsRecommendPage />}
      {page === 'benefit-detail' && <BenefitDetailPage />}
      {page === 'notifications' && <NotificationPage />}
      {page === 'settings' && <AppSettingsPage />}
      {page === 'support' && <CustomerCenterPage />}

      {/* 챗봇은 화면 전용 기능이 아니라 어디서나 같은 버튼이다 — 여기서 한 번만 그린다.
        * 자두AI 전체 화면에서는 같은 기능이 화면 자체로 열려 있으므로 감춘다
        * (지우지 않고 감추기만 해야 돌아왔을 때 옮겨 둔 자리가 그대로 남는다).
        * 커뮤니티는 글쓰기 버튼이 같은 자리에 있어 처음 놓이는 높이만 올려 준다. */}
      <AIChatbot
        hidden={page === 'settings' || page === 'support'}
        disabled={isAIChatOpen}
        initialLift={page.startsWith('community') ? 68 : 0}
      />
      {/* 기반 화면은 계속 마운트된 채로 두고 자두AI만 최상단 overlay로 올린다. */}
      {isAIChatOpen && <AIChatPage />}
    </>
  );
}

/* 라우터 라이브러리 없이 인증 상태 + 화면 상태로만 전환한다. */
export default function App() {
  const { user, completeOnboarding } = useAuth();
  const [view, setView] = useState<'login' | 'signup'>('login');
  /* 테스트 계정 시트에서 넘어올 때 회원가입 화면을 미리 채울 프로필 */
  const [signupProfile, setSignupProfile] = useState<SignupTestProfile | undefined>(undefined);

  /* 온보딩 결과를 AuthContext 의 UserPreferences 형태로 옮겨 저장한다.
   * 저장이 끝나면 onboarded 가 true 가 되어 아래 분기가 Home 으로 넘어간다. */
  const finishOnboarding = (selection: OnboardingSelection) => {
    completeOnboarding({
      completedAt: new Date().toISOString(),
      answers: {
        interests: selection.interests,
        stage: selection.stage ? [selection.stage] : [],
      },
    });
  };

  /* 첫 맞춤 설정을 마치지 않은 신규 가입자만 온보딩으로 보낸다.
   * 김하린·조아영과 온보딩을 마친 이서준은 onboarded: true 라 바로 Home. */
  if (user) {
    return user.onboarded ? (
      <AppNavigationProvider key={user.email}>
        {/* 커뮤니티·혜택 북마크와 GNB "내 메뉴", Home 위젯 배치는 여러 화면이 같은 값을
          * 봐야 해서 화면 위에서 한 번만 만든다 */}
        <BookmarkProvider>
          <MyMenuProvider>
            {/* 헤더 종(읽지 않은 표시)과 알림 화면이 같은 값을 봐야 해서 화면 위에서 한 번만 만든다 */}
            <NotificationProvider>
              <WidgetPlacementProvider>
                <MainPages />
              </WidgetPlacementProvider>
            </NotificationProvider>
          </MyMenuProvider>
        </BookmarkProvider>
      </AppNavigationProvider>
    ) : <Onboarding onComplete={finishOnboarding} userName={user.name} />;
  }
  return view === 'login' ? (
    <Login
      onGoSignup={(profile) => {
        setSignupProfile(profile);
        setView('signup');
      }}
    />
  ) : (
    <Signup onGoLogin={() => setView('login')} initialProfile={signupProfile} />
  );
}
