import { useEffect, useState } from 'react';
import { img } from '../lib/asset';

/* 앱 실행 스플래시 — 기존 자두 마스코트 영상을 유지하고 매 페이지 진입마다 잠깐 표시한다. */
const SPLASH_TOTAL_MS = 2000;
/* splash-screen.css의 opacity transition과 같은 값이다. */
const FADE_MS = 250;
const VISIBLE_MS = SPLASH_TOTAL_MS - FADE_MS;

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'done'>('visible');

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
    <div
      className={`splash-screen${phase === 'leaving' ? ' is-leaving' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <video
        className="splash-screen__media"
        src={img('intro_vid.mp4')}
        autoPlay
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}

export default SplashScreen;
