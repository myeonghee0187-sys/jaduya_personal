import { useEffect, useState } from 'react';
import { icon } from '../lib/asset';
import { willPlayIntroVideo } from './IntroSplash';

/* PWA 런처 아이콘 실행 직후, React 앱이 렌더링되는 순간 아주 짧게 보여주는
 * 자두야 전용 브랜드 스플래시 — 매번 실행마다 뜨고, 로그인/온보딩/Home 등 기존
 * 진입 분기에는 전혀 관여하지 않는다(LoginShowcase.tsx 의 모바일 진입 분기에서
 * App 보다 먼저 얹힌다).
 *
 * IntroSplash(최초 1회, 인트로 영상)와는 둘 다 "처음 보여주는 화면"이라는 역할이
 * 겹칠 수 있는 지점이 딱 하나 있다 — 이 브라우저에서 처음 실행하는 순간. 그 순간엔
 * willPlayIntroVideo() 가 true 를 반환하고, 이 컴포넌트는 아예 렌더하지 않는다
 * (return null) — 인트로 영상이 곧바로 첫인상을 담당하므로, 그 앞에 짧은 브랜드
 * 스플래시까지 끼워 넣으면 "시작 화면"이 두 번 연달아 뜨는 것처럼 보인다.
 * 이미 인트로를 본 이후(대부분의 재실행)나 reduced-motion 환경(인트로 자체를
 * 건너뛰는 경우)에는 이 스플래시만 혼자 뜬다. */
const VISIBLE_MS = 500;
/* .splash-screen 의 opacity transition 과 같은 값이어야 한다 (splash-screen.css) */
const FADE_MS = 200;

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'done'>(() =>
    willPlayIntroVideo() ? 'done' : 'visible',
  );

  useEffect(() => {
    if (phase !== 'visible') return;
    const timer = window.setTimeout(() => setPhase('leaving'), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = window.setTimeout(() => setPhase('done'), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={`splash-screen${phase === 'leaving' ? ' is-leaving' : ''}`} role="presentation" aria-hidden="true">
      <img className="splash-screen__symbol" src={icon('logo-mark.svg')} alt="" />
      <p className="splash-screen__title">자두야</p>
      <p className="splash-screen__subcopy">자취 생활의 모든 고민을 해결하는 AI 생활 플랫폼</p>
    </div>
  );
}

export default SplashScreen;
