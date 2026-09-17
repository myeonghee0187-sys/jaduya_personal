import { img } from '../lib/asset';
import { FallingLeaves } from './FallingLeaves';
import { HeroCharacterVideo } from './HeroCharacterVideo';

interface HeroProps {
  showFallingLeaves?: boolean;
}

export function Hero({ showFallingLeaves = false }: HeroProps) {
  return (
    <div className="hero" aria-hidden="true">
      <div className="hero__background">
        {/* WebKit에서 FAB가 겹칠 때 repaint artifact를 만들던 scaleX 합성 레이어를
            피하기 위해, 같은 원본을 빌드 시점에 반전한 정적 에셋을 사용한다. */}
        <img src={img('screen-background-flipped.png')} alt="" />
      </div>
      {showFallingLeaves && <FallingLeaves />}
      <div className="hero__illustration">
        <img className="hero__tree" src={img('hero-tree.png')} alt="" />
        <img className="hero__ground" src={img('hero-ground.png')} alt="" />
        <HeroCharacterVideo />
        <img className="hero__accent" src={img('hero-accent.png')} alt="" />
        <img className="hero__cup" src={img('hero-cup.png')} alt="" />
      </div>
    </div>
  );
}
