import { useEffect, useRef, useState } from 'react';
import type { AnimationEvent, CSSProperties } from 'react';

/* night 에서만 그려지는 하늘 장식 — 별 twinkle 2개(HeroNightStars)와 가끔 지나가는 별똥별 1개(HeroShootingStar).
 * 둘 다 Hero 가 night 일 때만 마운트하고 night 를 벗어나면 언마운트하므로, 아래 타이머도 함께 정리된다.
 * 둘 다 배경 이미지 위·전경(나뭇잎 · illustration · 헤더/텍스트, 모두 z-index 가 더 높다)보다 뒤에 그려진다. */

/* ---- 별이 나타날 수 있는 하늘 ----
 * 별 레이어는 별똥별 레이어와 같은 박스(폭 = 화면 폭, 높이 = 시트 위 = 모바일에서 화면 높이 − 299px)다.
 * 별은 고정 좌표가 아니라 "빈 하늘 영역(SPARKLE_ZONES)" 안에서 뽑은 무작위 좌표에 놓이고,
 * 금지 영역(헤더 · 텍스트 블록 · 아래쪽 일러스트)과 겹치는 좌표는 버리고 다시 뽑는다. */

/** 빈 하늘 영역 — 레이어 폭·높이에 대한 %. 영역을 하나 고른 뒤 그 안에서 x / y 를 무작위로 뽑는다.
 *  (402 × 575 기준 px 는 주석에 적었다. 실제로 쓸 수 있는 부분은 아래 금지 영역을 뺀 나머지만이다.) */
interface SparkleZone {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const SPARKLE_ZONES: readonly SparkleZone[] = [
  // A. 헤더 아래 ~ 상단 라벨 위의 얇은 하늘 (x 20~382, y 52~92)
  { minX: 5, maxX: 95, minY: 9, maxY: 16 },
  // B. 메인 타이틀 오른쪽의 빈 하늘 (x 342~386, y 80~178)
  { minX: 85, maxX: 96, minY: 14, maxY: 31 },
  // C. 설명 문구 오른쪽 ~ 나무 위의 빈 하늘 (x 342~386, y 172~253)
  { minX: 85, maxX: 96, minY: 30, maxY: 44 },
  // D. 설명 문구 아래 ~ 구름 · 언덕 위의 빈 하늘 (x 24~225, y 218~299)
  { minX: 6, maxX: 56, minY: 38, maxY: 52 },
];

/** 별 하나가 차지하는 크기의 절반(px) — 가장 큰 sparkle(26px) 기준으로 모든 별에 같은 여백을 둔다 */
const SPARKLE_HALF_SIZE = 13;

/** px 로 나타낸 금지 영역(레이어 안 좌표) */
interface BlockedRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/* 금지 영역. 텍스트 · 헤더는 위에서부터 px 로 놓이고, 나무 · 구름 · 언덕 · 마스코트는 화면 아래에 붙어 있어서
 * 레이어 아래(= h)에서부터 잰다. 그래서 %로 잡은 zone 을 실제 레이어 크기(w × h)로 환산한 뒤 여기서 걸러 낸다.
 * 텍스트는 줄마다 좁게 피하지 않고 하나의 넉넉한 직사각형으로 막는다(계정마다 문구 길이가 다르다).
 *   헤더(로고 · 시간 변경 · 알림)   y  0 ~ 54
 *   텍스트 블록(라벨 · 이름 · 타이틀 · 설명)  y 88 ~ 222, x 0 ~ 80%
 *   나무 · 열매   x 58% 이상, 레이어 아래 기준 319px 위부터
 *   구름 · 언덕 · 마스코트 · 돗자리   전체 폭, 레이어 아래 기준 283px 위부터 */
function getBlockedRects(w: number, h: number): BlockedRect[] {
  return [
    { left: 0, right: w, top: 0, bottom: 54 },
    { left: 0, right: w * 0.8, top: 88, bottom: 222 },
    { left: w * 0.58, right: w, top: h - 319, bottom: h },
    { left: 0, right: w, top: h - 283, bottom: h },
  ];
}

/** 별이 서 있는 자리 — x / y 는 레이어 폭·높이에 대한 %, zone 은 뽑힌 영역 번호 */
interface Placement {
  x: number;
  y: number;
  zone: number;
}

/** 레이어 크기를 아직 못 잰 첫 렌더에서 쓰는 기준 크기 (402 × 874 화면) */
const FALLBACK_LAYER_SIZE = { w: 402, h: 575 };

/** 영역 하나에서 좌표를 뽑아 보는 횟수 */
const SAMPLE_TRIES = 12;
/** 두 별 사이 최소 거리(px) — 같은 영역에 있어도 이만큼은 떨어진다 */
const MIN_STAR_GAP = 96;
/** 한 별이 다음 자리로 옮길 때 최소 이동 거리(px) — 같은 자리에서 계속 반짝이는 것처럼 보이지 않게 */
const MIN_MOVE = 64;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* 새 자리를 뽑는다.
 *   1. 영역을 하나 고른다 — 자기 직전 영역 · 상대 별이 있는 영역이 아닌 곳을 먼저 시도해 한 곳에 몰리지 않게 한다.
 *   2. 그 영역 안에서 x / y 를 무작위로 뽑는다.
 *   3. 금지 영역과 겹치거나, 레이어 밖으로 잘리거나, 상대 별 · 자기 직전 자리와 너무 가까우면 다시 뽑는다.
 * 어느 영역에서도 못 찾으면 null (호출한 쪽이 지금 자리를 그대로 둔다). */
function pickPlacement(w: number, h: number, previous?: Placement, other?: Placement): Placement | null {
  const blocked = getBlockedRects(w, h);
  const distance = (a: { x: number; y: number }, bx: number, by: number) =>
    Math.hypot(((a.x - bx) / 100) * w, ((a.y - by) / 100) * h);

  const zoneOrder = shuffled(SPARKLE_ZONES.map((_, index) => index));
  const fresh = zoneOrder.filter((zone) => zone !== previous?.zone && zone !== other?.zone);
  const rest = zoneOrder.filter((zone) => !fresh.includes(zone));

  for (const zone of [...fresh, ...rest]) {
    const { minX, maxX, minY, maxY } = SPARKLE_ZONES[zone];
    for (let attempt = 0; attempt < SAMPLE_TRIES; attempt += 1) {
      const x = Math.round(randomBetween(minX, maxX) * 100) / 100;
      const y = Math.round(randomBetween(minY, maxY) * 100) / 100;
      const px = (x / 100) * w;
      const py = (y / 100) * h;

      const insideLayer =
        px - SPARKLE_HALF_SIZE >= 0 &&
        px + SPARKLE_HALF_SIZE <= w &&
        py - SPARKLE_HALF_SIZE >= 0 &&
        py + SPARKLE_HALF_SIZE <= h;
      const hitsBlocked = blocked.some(
        (rect) =>
          px + SPARKLE_HALF_SIZE > rect.left &&
          px - SPARKLE_HALF_SIZE < rect.right &&
          py + SPARKLE_HALF_SIZE > rect.top &&
          py - SPARKLE_HALF_SIZE < rect.bottom,
      );
      if (!insideLayer || hitsBlocked) continue;
      if (other && distance(other, x, y) < MIN_STAR_GAP) continue;
      if (previous && distance(previous, x, y) < MIN_MOVE) continue;

      return { x, y, zone };
    }
  }
  return null;
}

/** 어디서도 자리를 못 찾았을 때 쓰는 마지막 수단 — 헤더 아래 하늘 줄의 가운데 */
const FALLBACK_PLACEMENT: Placement = { x: 50, y: 12.4, zone: 0 };

interface TwinkleStar {
  /** 십자 sparkle 한 변의 길이(px) */
  size: number;
  duration: string;
  /** 음수 delay — 처음 마운트했을 때 별이 이미 보이지 않는 구간(주기의 0~26% / 76~100%)에서 시작하도록 잡았다 */
  delay: string;
}

/* 주기를 서로 다르게(약 3.0s / 3.9s) 줘서 두 별이 같은 박자로 반짝이지 않는다. */
const TWINKLE_STARS: readonly TwinkleStar[] = [
  { size: 22, duration: '3s', delay: '-0.4s' },
  { size: 26, duration: '3.9s', delay: '-3.3s' },
];

interface HeroNightLayerProps {
  /** 다음 시간대 배경이 덮으며 들어오는 중이면 true — 장식을 함께 서서히 지운다 */
  leaving?: boolean;
}

/* 각 별은 자기 자리(Placement)를 하나씩 갖는다. 별의 애니메이션은 주기 양 끝(0~26% · 76~100%)에서
 * opacity 0 이라, 주기가 한 번 끝나고 다음 주기가 시작하는 순간(animationiteration)에는 별이 완전히 안 보인다.
 * 자리는 이 순간에만 바꾼다 — 보이지 않는 동안 옮기고, 새 자리에서 다시 나타난다. left / top 에 transition 은 없다.
 * 두 별은 독립적으로 움직이지만 서로 가깝게 오지 않고, 직전에 있던 자리 근처도 바로 다시 뽑지 않는다. */
export function HeroNightStars({ leaving = false }: HeroNightLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<Placement[]>(() => {
    const { w, h } = FALLBACK_LAYER_SIZE;
    const first = pickPlacement(w, h) ?? FALLBACK_PLACEMENT;
    return [first, pickPlacement(w, h, undefined, first) ?? FALLBACK_PLACEMENT];
  });
  const placementsRef = useRef(placements);

  const relocate = (starIndex: number) => {
    const layer = layerRef.current;
    const w = layer?.clientWidth || FALLBACK_LAYER_SIZE.w;
    const h = layer?.clientHeight || FALLBACK_LAYER_SIZE.h;
    const current = placementsRef.current;
    const next = [...current];
    next[starIndex] = pickPlacement(w, h, current[starIndex], current[1 - starIndex]) ?? current[starIndex];
    placementsRef.current = next;
    setPlacements(next);
  };

  const handleIteration = (starIndex: number) => (event: AnimationEvent<HTMLSpanElement>) => {
    // ::before / ::after 축 애니메이션의 이벤트도 이 요소로 올라오므로, 별 본체의 주기만 본다
    if (event.animationName !== 'hero-star-twinkle' || event.target !== event.currentTarget) return;
    relocate(starIndex);
  };

  return (
    <div ref={layerRef} className={`hero__sparkle-layer${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      {TWINKLE_STARS.map((star, index) => (
        <span
          key={index}
          className="hero__star"
          onAnimationIteration={handleIteration(index)}
          style={
            {
              left: `${placements[index].x}%`,
              top: `${placements[index].y}%`,
              '--star-size': `${star.size}px`,
              '--star-duration': star.duration,
              '--star-delay': star.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** 별똥별 등장 간격 — 10초마다 한 번 */
const SHOOTING_STAR_INTERVAL_MS = 10_000;

/** 별똥별 지속 시간(초) — 기존 속도를 유지한 채 이동 거리를 2배로 늘려 1.6 ~ 2.2 */
const SHOOTING_STAR_MIN_S = 1.6;
const SHOOTING_STAR_MAX_S = 2.2;

interface ShootingStar {
  id: number;
  duration: number;
  /** 기본 시작점에서 벗어나는 정도(px) */
  offsetX: number;
  offsetY: number;
}

/* 화면 기준(헤더 아래 오른쪽 빈 하늘) 레이어 — 나뭇잎 레이어와 같은 박스를 쓴다. */
export function HeroShootingStar({ leaving = false }: HeroNightLayerProps) {
  /* 한 번에 1개만 — 새 별똥별이 오면 이전 것을 대체한다 */
  const [shootingStar, setShootingStar] = useState<ShootingStar | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number;
    let count = 0;

    /* 별똥별이 지나갈 때마다 10초 뒤 다음 별똥별을 예약한다. */
    const scheduleNext = () => {
      timer = window.setTimeout(() => {
        count += 1;
        setShootingStar({
          id: count,
          duration: randomBetween(SHOOTING_STAR_MIN_S, SHOOTING_STAR_MAX_S),
          offsetX: Math.round(randomBetween(-12, 12)),
          offsetY: Math.round(randomBetween(-10, 10)),
        });
        scheduleNext();
      }, SHOOTING_STAR_INTERVAL_MS);
    };

    scheduleNext();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`hero__shooting-layer${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      {shootingStar && (
        <span
          key={shootingStar.id}
          className="hero__shooting-star"
          style={
            {
              '--shoot-x': `${shootingStar.offsetX}px`,
              '--shoot-y': `${shootingStar.offsetY}px`,
              '--shoot-duration': `${shootingStar.duration.toFixed(2)}s`,
            } as CSSProperties
          }
          onAnimationEnd={() => setShootingStar(null)}
        />
      )}
    </div>
  );
}
