import { useEffect, useState } from 'react';
import { img } from '../lib/asset';

/* 첫 진입 인트로 — 목업 화면을 덮고 intro_vid.mp4 를 재생한 뒤 스스로 사라진다.
 *
 * 영상이 끝나면(onEnded) 바로 걷힌다. 자동재생이 막히거나 디코딩이 실패해
 * ended 가 오지 않는 경우를 대비해 INTRO_MS 를 안전장치로 함께 건다.
 * 아무 곳이나 누르거나 '건너뛰기' / ESC 로 바로 넘길 수 있다. */
/** 영상 길이(8.9초)보다 넉넉한 상한 — 더 짧게 끊고 싶으면 이 값만 줄이면 된다 */
const INTRO_MS = 11000;
/* .intro 의 opacity transition 과 같은 값이어야 한다 (intro.css) */
const FADE_MS = 400;

/** 이 브라우저에서 인트로를 이미 봤는지 — 한 번 보면 다시 뜨지 않는다.
 * 다시 보려면 콘솔에서 localStorage.removeItem('jaduya.intro.seen') */
const SEEN_KEY = 'jaduya.intro.seen';

function introSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === 'done';
  } catch {
    /* 저장소를 막아둔 브라우저 — 매번 보여주는 대신 건너뛴다 */
    return true;
  }
}

function markIntroSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, 'done');
  } catch {
    /* 저장 실패는 무시 */
  }
}

/** 모션을 줄이는 설정에서는 인트로를 아예 띄우지 않는다 */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function IntroSplash() {
  const [phase, setPhase] = useState<'playing' | 'leaving' | 'done'>(() =>
    prefersReducedMotion() || introSeen() ? 'done' : 'playing',
  );

  /* 다 보여줬으면 사라지기 시작한다. 한 번 재생했으면 이 브라우저에서는 여기서 끝이다. */
  useEffect(() => {
    if (phase !== 'playing') return;
    markIntroSeen();
    const timer = window.setTimeout(() => setPhase('leaving'), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  /* 페이드가 끝나면 DOM 에서 걷어낸다 — gif 디코딩도 같이 멈춘다 */
  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = window.setTimeout(() => setPhase('done'), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  /* ESC 로도 건너뛴다 */
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPhase('leaving');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`intro${phase === 'leaving' ? ' is-leaving' : ''}`}
      role="presentation"
      onClick={() => setPhase('leaving')}
    >
      {/* muted + playsInline 이어야 모바일에서도 자동재생된다 */}
      <video
        className="intro__media"
        src={img('intro_vid.mp4')}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setPhase('leaving')}
      />
      <button type="button" className="intro__skip" onClick={() => setPhase('leaving')}>
        건너뛰기
      </button>
    </div>
  );
}

export default IntroSplash;
