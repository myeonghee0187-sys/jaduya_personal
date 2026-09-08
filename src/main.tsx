import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/* 스타일 로드 순서 — 정적 버전과 동일한 캐스케이드를 유지한다.
 *   fonts     : @font-face 선언
 *   tokens    : 디자인 토큰 (변수)
 *   home      : Home 화면
 *   overlays  : GNB / Bottom Sheet
 *   app-shell : #root 레이아웃 보정 (React 전용, 디자인 값 없음)
 */
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/home.css';
import './styles/overlays.css';
import './styles/app-shell.css';
import { SpeedInsights } from "@vercel/speed-insights/react";

const container = document.getElementById('root');
if (!container) throw new Error('#root 를 찾을 수 없습니다.');

createRoot(container).render(
  <StrictMode>
    <App />
    <SpeedInsights />
  </StrictMode>,
);