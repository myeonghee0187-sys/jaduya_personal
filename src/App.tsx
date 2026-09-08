import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import type { OnboardingSelection } from './pages/Onboarding';
import { Signup } from './pages/Signup';
import { MyPage } from './pages/MyPage';
import { MissionPage } from './pages/MissionPage';
import { AppNavigationProvider, useAppNavigation } from './navigation/AppNavigation';

function MainPages() {
  const navigation = useAppNavigation();
  const page = navigation?.page ?? 'home';
  const isHome = page === 'home';
  return (
    <>
      {/* Home을 유지해 왕복 이동 시 위젯과 시트 상태가 초기화되지 않게 한다. */}
      <div hidden={!isHome} style={isHome ? { display: 'contents' } : undefined}><Home /></div>
      {/* 마이페이지 '나의 자취 레벨 > 전체보기' → 자취 미션 */}
      {page === 'my' && (
        <MyPage
          onDetailNavigate={(to) => {
            if (to !== 'level') return false;
            navigation?.navigate('mission');
            return true;
          }}
        />
      )}
      {page === 'mission' && <MissionPage />}
    </>
  );
}

/* 라우터 라이브러리 없이 인증 상태 + 화면 상태로만 전환한다. */
export default function App() {
  const { user, completeOnboarding } = useAuth();
  const [view, setView] = useState<'login' | 'signup'>('login');
  /* 테스트 계정 시트에서 넘어올 때 회원가입 이메일을 미리 채운다 */
  const [signupEmail, setSignupEmail] = useState('');

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
        <MainPages />
      </AppNavigationProvider>
    ) : <Onboarding onComplete={finishOnboarding} />;
  }
  return view === 'login' ? (
    <Login
      onGoSignup={(prefillEmail) => {
        setSignupEmail(prefillEmail ?? '');
        setView('signup');
      }}
    />
  ) : (
    <Signup onGoLogin={() => setView('login')} initialEmail={signupEmail} />
  );
}
