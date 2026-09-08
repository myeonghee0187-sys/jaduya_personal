import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/AuthContext';

/* 스타일 로드 순서 — 정적 버전과 동일한 캐스케이드를 유지한다.
 *   fonts     : @font-face 선언
 *   tokens    : 디자인 토큰 (변수)
 *   home      : Home 화면
 *   overlays  : GNB / Bottom Sheet
 *   app-shell : #root 레이아웃 보정 (React 전용, 디자인 값 없음)
 *   level-bar : 공용 LevelBar 컴포넌트
 *   page-header : 하위 화면 공용 헤더
 *   mypage / mission : 하위 화면 (.mypage.app / .mission.app 이 .app 을 덮어야 해서 마지막)
 */
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/home.css';
import './styles/overlays.css';
import './styles/auth.css';
import './styles/app-shell.css';
import './styles/level-bar.css';
import './styles/page-header.css';
import './styles/mypage.css';
import './styles/mission.css';
import './styles/level-info.css';
import { SpeedInsights } from "@vercel/speed-insights/react";

const container = document.getElementById('root');
if (!container) throw new Error('#root 를 찾을 수 없습니다.');

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <SpeedInsights />
    </AuthProvider>
  </StrictMode>,
);