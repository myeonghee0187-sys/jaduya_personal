import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LoginShowcase } from './pages/LoginShowcase';
import { AuthProvider } from './auth/AuthContext';

/* 스타일 로드 순서 — 정적 버전과 동일한 캐스케이드를 유지한다.
 *   fonts     : @font-face 선언
 *   tokens    : 디자인 토큰 (변수)
 *   home      : Home 화면
 *   overlays  : GNB / Bottom Sheet
 *   app-shell : #root 레이아웃 보정 (React 전용, 디자인 값 없음)
 *   iphone-frame : 실물형 iPhone 목업(IPhoneFrame) 자체 스타일 — --phone-scale 기본값(1)을
 *                  선언하므로, 이를 페이지별 값으로 덮어쓰는 login-showcase.css 보다 먼저 온다
 *   login-showcase : 사이트 기본 화면(쇼케이스 컷) — 3단 반응형 레이아웃/패널/--phone-scale 값
 *   level-bar : 공용 LevelBar 컴포넌트
 *   page-header : 하위 화면 공용 헤더
 *   mypage / mission / saved : 하위 화면 (.mypage.app / .mission.app 이 .app 을 덮어야 해서 마지막)
 *   life      : 생활 메인 (.life.app 이 .app 을 덮어야 해서 마지막)
 *   money     : 돈 관리 메인 (.money.app 이 .app 을 덮어야 해서 마지막)
 *   coachmark : 홈 코치마크 오버레이 — .app 위에 얹히기만 하면 되므로 순서 무관, 맨 뒤
 */
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/home.css';
import './styles/overlays.css';
import './styles/auth.css';
import './styles/app-shell.css';
import './styles/iphone-frame.css';
import './styles/login-showcase.css';
import './styles/level-bar.css';
import './styles/page-header.css';
import './styles/mypage.css';
import './styles/profile-settings.css';
import './styles/mission.css';
import './styles/saved.css';
import './styles/level-info.css';
import './styles/life.css';
import './styles/life-first.css';
import './styles/life-homecare.css';
import './styles/life-house.css';
import './styles/life-eat.css';
import './styles/community.css';
import './styles/ai-chat-page.css';
import './styles/money.css';
import './styles/benefits.css';
import './styles/notifications.css';
import './styles/settings-pages.css';
import './styles/coachmark.css';
import './styles/widget-gallery.css';
import './styles/widget-management.css';
/* 앱 실행 스플래시는 화면 전체를 덮는 최상위 레이어라 가장 마지막에 읽는다 */
import './styles/splash-screen.css';
import { SpeedInsights } from "@vercel/speed-insights/react";

const container = document.getElementById('root');
if (!container) throw new Error('#root 를 찾을 수 없습니다.');

/* 사이트 기본 화면 = 쇼케이스 컷(LoginShowcase). 3단 반응형 모두 IPhoneFrame 목업 안에
 * 실제 Login/Signup 화면을 그대로 보여주고, Demo Account 패널만 모바일에서 숨긴다. */
createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <LoginShowcase />
      <SpeedInsights />
    </AuthProvider>
  </StrictMode>,
);
