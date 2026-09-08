import type { HomeHeroContent } from '../types';

/* Hero 위 인사 영역 — 레이아웃은 그대로 두고 문구만 persona 데이터에서 받는다. */
interface GreetingProps {
  /** 인사에 쓰는 이름 (성 제외) */
  name: string;
  hero: HomeHeroContent;
}

export function Greeting({ name, hero }: GreetingProps) {
  return (
    <div className="greeting">
      <p className="greeting__situation">{hero.situation}</p>
      <div className="greeting__body">
        <h1 className="greeting__title">
          {name}님,
          <br />
          {hero.headline}
        </h1>
        <p className="greeting__sub">{hero.sub}</p>
      </div>
    </div>
  );
}
