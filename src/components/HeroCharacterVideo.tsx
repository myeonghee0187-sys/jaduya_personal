import { img } from '../lib/asset';

/** 투명 배경 캐릭터 영상을 기존 히어로 캐릭터 자리에 반복 재생한다. */
export function HeroCharacterVideo() {
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
