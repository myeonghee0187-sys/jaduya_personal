import { img } from '../lib/asset';

/** Safari(macOS)와 iOS의 모든 브라우저(WebKit 강제)는 알파 채널이 있는 VP9 webm을
 * 지원하지 않아 히어로 캐릭터 영상이 검은 배경으로 보인다 — 이 환경만 알파를 지원하는
 * 애니메이션 webp로 대체한다. */
function needsWebpFallback(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS || isSafari;
}

/** 투명 배경 캐릭터 영상을 기존 히어로 캐릭터 자리에 반복 재생한다. */
export function HeroCharacterVideo() {
  if (needsWebpFallback()) {
    return <img className="hero__character" src={img('093152-ios.webp')} alt="" />;
  }
  return (
    <video
      className="hero__character"
      src={img('093152.webm')}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
    />
  );
}
