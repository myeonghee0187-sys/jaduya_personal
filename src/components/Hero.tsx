import { img } from '../lib/asset';

export function Hero() {
  return (
    <div className="hero" aria-hidden="true">
      <div className="hero__background">
        <img src={img('screen-background.png')} alt="" />
      </div>
      <div className="hero__illustration">
        <img className="hero__tree" src={img('hero-tree.png')} alt="" />
        <img className="hero__ground" src={img('hero-ground.png')} alt="" />
        <img className="hero__character" src={img('hero-character.png')} alt="" />
        <img className="hero__accent" src={img('hero-accent.png')} alt="" />
        <img className="hero__cup" src={img('hero-cup.png')} alt="" />
      </div>
    </div>
  );
}
