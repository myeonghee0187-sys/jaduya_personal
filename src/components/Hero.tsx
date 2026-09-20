import { useEffect, useState } from 'react';
import { img } from '../lib/asset';
import {
  getHomeTimePeriod,
  getNextHomeTimeBoundary,
  HOME_TIME_BACKGROUNDS,
  type HomeTimePeriod,
} from '../lib/homeTimeBackground';
import { FallingLeaves } from './FallingLeaves';
import { HeroCharacterVideo } from './HeroCharacterVideo';

interface HeroProps {
  showFallingLeaves?: boolean;
  onTimePeriodChange?: (period: HomeTimePeriod) => void;
}

export function Hero({ showFallingLeaves = false, onTimePeriodChange }: HeroProps) {
  const [timePeriod, setTimePeriod] = useState(() => getHomeTimePeriod(new Date()));
  const [incomingPeriod, setIncomingPeriod] = useState<HomeTimePeriod | null>(null);

  useEffect(() => {
    onTimePeriodChange?.(timePeriod);
  }, [onTimePeriodChange, timePeriod]);

  useEffect(() => {
    let boundaryTimer: number;
    let transitionTimer: number | undefined;
    let preloadImage: HTMLImageElement | undefined;
    let cancelled = false;

    const transitionTo = (nextPeriod: HomeTimePeriod) => {
      if (nextPeriod === timePeriod) return;

      preloadImage = new Image();
      let transitionStarted = false;

      const startTransition = () => {
        if (cancelled || transitionStarted) return;
        transitionStarted = true;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setTimePeriod(nextPeriod);
          setIncomingPeriod(null);
          return;
        }

        setIncomingPeriod(nextPeriod);
        transitionTimer = window.setTimeout(() => {
          setTimePeriod(nextPeriod);
          setIncomingPeriod(null);
        }, 900);
      };

      preloadImage.onload = startTransition;
      preloadImage.onerror = () => {
        preloadImage = undefined;
      };
      preloadImage.src = HOME_TIME_BACKGROUNDS[nextPeriod];

      if (preloadImage.complete && preloadImage.naturalWidth > 0) {
        startTransition();
      }
    };

    const scheduleNextBackground = () => {
      const now = new Date();
      const nextBoundary = getNextHomeTimeBoundary(now);

      boundaryTimer = window.setTimeout(() => {
        transitionTo(getHomeTimePeriod(new Date()));
        scheduleNextBackground();
      }, nextBoundary.getTime() - now.getTime());
    };

    scheduleNextBackground();
    return () => {
      cancelled = true;
      window.clearTimeout(boundaryTimer);
      if (transitionTimer !== undefined) window.clearTimeout(transitionTimer);
      if (preloadImage) {
        preloadImage.onload = null;
        preloadImage.onerror = null;
      }
    };
  }, [timePeriod]);

  return (
    <div className="hero" aria-hidden="true">
      <div className="hero__background">
        <img
          className={`hero__background-image${incomingPeriod ? ' hero__background-image--outgoing' : ''}`}
          src={HOME_TIME_BACKGROUNDS[timePeriod]}
          alt=""
        />
        {incomingPeriod && (
          <img
            className="hero__background-image hero__background-image--incoming"
            src={HOME_TIME_BACKGROUNDS[incomingPeriod]}
            alt=""
          />
        )}
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
