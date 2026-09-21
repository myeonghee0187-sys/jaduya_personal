import { useEffect, useState } from 'react';
import { img } from '../lib/asset';
import {
  getHomeTimePeriod,
  getNextHomeTimeBoundary,
  HOME_TIME_BACKGROUNDS,
  type HomeTimeOverride,
  type HomeTimePeriod,
} from '../lib/homeTimeBackground';
import { FallingLeaves } from './FallingLeaves';
import { HeroCharacterVideo } from './HeroCharacterVideo';
import { HeroNightStars, HeroShootingStar } from './HeroNightSky';

interface HeroProps {
  showFallingLeaves?: boolean;
  timeOverride?: HomeTimeOverride;
  onTimePeriodChange?: (period: HomeTimePeriod) => void;
}

export function Hero({ showFallingLeaves = false, timeOverride = 'auto', onTimePeriodChange }: HeroProps) {
  /* 시계가 가리키는 시간대 — 경계 시각마다 갱신된다 */
  const [autoPeriod, setAutoPeriod] = useState(() => getHomeTimePeriod(new Date()));
  /* 지금 화면에 깔려 있는 배경의 시간대 */
  const [timePeriod, setTimePeriod] = useState(autoPeriod);
  /* 전환 중에만 있는 두 번째 배경 레이어 — 기존 배경 위에서 opacity 0 → 1 로 나타난다 */
  const [incomingPeriod, setIncomingPeriod] = useState<HomeTimePeriod | null>(null);

  /* 화면이 가야 할 시간대 — 시계(auto)든 시간대 미리보기(override)든 같은 crossfade 를 탄다 */
  const targetPeriod = timeOverride === 'auto' ? autoPeriod : timeOverride;

  /* 전환이 시작되는 순간(= 새 배경이 마운트되어 crossfade 가 실제로 시작되는 순간) 기준의 시간대.
   * 배경 · 일러스트 밝기 · 나뭇잎이 모두 이 값 하나를 따라, 같은 순간 시작해 같은 duration / easing 으로 끝난다.
   * 시간대 값(autoPeriod / override)이 바뀌었다는 사실만으로는 바뀌지 않는다 — 새 이미지가 준비돼야 바뀐다. */
  const toneTime = incomingPeriod ?? timePeriod;
  const illustrationTone = toneTime === 'night' ? 'night' : 'day';

  /* Home 의 텍스트 가독성 처리(is-night)용 — 배경 · 일러스트와 같은 순간(crossfade 시작)에 바뀐다.
   * 텍스트 · 아이콘 색도 같은 duration / easing 의 transition 으로 함께 움직인다. */
  useEffect(() => {
    onTimePeriodChange?.(toneTime);
  }, [toneTime, onTimePeriodChange]);

  /* 5장 모두 미리 받아 둔다 — 전환할 때 아직 안 받은 이미지 때문에 빈 배경이 보이지 않게 */
  useEffect(() => {
    Object.values(HOME_TIME_BACKGROUNDS).forEach((src) => {
      new Image().src = src;
    });
  }, []);

  /* 다음 시간대 경계에 맞춰 autoPeriod 를 다시 판별한다 */
  useEffect(() => {
    let boundaryTimer: number;

    const scheduleNextBoundary = () => {
      const now = new Date();
      const nextBoundary = getNextHomeTimeBoundary(now);

      boundaryTimer = window.setTimeout(() => {
        setAutoPeriod(getHomeTimePeriod(new Date()));
        scheduleNextBoundary();
      }, nextBoundary.getTime() - now.getTime());
    };

    scheduleNextBoundary();
    return () => window.clearTimeout(boundaryTimer);
  }, []);

  /* 화면이 가야 할 시간대와 지금 배경이 다르면 전환을 시작한다.
   * 이미지가 디코딩까지 끝난 뒤에만 시작하고, 그 순간 incomingPeriod 가 정해지면서 배경 crossfade 와
   * 일러스트 밝기 변화가 한 번에 시작된다. 실패하면 지금 배경을 그대로 두고 다음 변경 때 다시 시도한다.
   * 전환 중에 목표가 또 바뀌면(미리보기를 연달아 누르는 경우) 지금 전환이 끝난 뒤 최신 목표로 이어 간다. */
  useEffect(() => {
    if (incomingPeriod !== null || targetPeriod === timePeriod) return;

    let cancelled = false;
    const nextImage = new Image();
    nextImage.src = HOME_TIME_BACKGROUNDS[targetPeriod];
    nextImage
      .decode()
      .then(() => {
        if (cancelled) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setTimePeriod(targetPeriod);
        } else {
          setIncomingPeriod(targetPeriod);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [targetPeriod, timePeriod, incomingPeriod]);

  /* 페이드가 끝나면 기존 배경을 새 이미지로 바꾸고, 그 다음 프레임에 위 레이어를 걷어 낸다
   * (위 레이어가 끝까지 불투명하게 덮고 있어서 바꾸는 순간에도 빈 화면이 없다).
   * 이때 toneTime 은 그대로(incoming → timePeriod 가 같은 값)라 일러스트 밝기는 다시 움직이지 않는다. */
  const finishTransition = () => {
    if (!incomingPeriod) return;
    setTimePeriod(incomingPeriod);
    requestAnimationFrame(() => setIncomingPeriod(null));
  };

  return (
    <div className="hero" aria-hidden="true">
      <div className="hero__background">
        <img src={HOME_TIME_BACKGROUNDS[timePeriod]} alt="" />
        {incomingPeriod && (
          <img
            className="hero__background-image--incoming"
            src={HOME_TIME_BACKGROUNDS[incomingPeriod]}
            alt=""
            onAnimationEnd={finishTransition}
          />
        )}
      </div>
      {/* night 별 twinkle · 별똥별 — 화면 기준 레이어. z-index 0 이라 나뭇잎(1) · illustration(2) 뒤에 그려진다. */}
      {timePeriod === 'night' && <HeroNightStars leaving={incomingPeriod !== null} />}
      {timePeriod === 'night' && <HeroShootingStar leaving={incomingPeriod !== null} />}
      {showFallingLeaves && <FallingLeaves hidden={illustrationTone === 'night'} />}
      <div className="hero__illustration" data-time-tone={illustrationTone}>
        <img className="hero__tree" src={img('hero-tree.png')} alt="" />
        <img className="hero__ground" src={img('hero-ground.png')} alt="" />
        <HeroCharacterVideo />
        <img className="hero__accent" src={img('hero-accent.png')} alt="" />
        <img className="hero__cup" src={img('hero-cup.png')} alt="" />
      </div>
    </div>
  );
}
