import { img } from './asset';

export type HomeTimePeriod = 'dawn' | 'morning' | 'day' | 'afternoon' | 'night';
export type HomeTimeOverride = 'auto' | HomeTimePeriod;

/* 시간대별 Hero 배경 — 색감은 이미지에 이미 들어 있어서 코드에서는 색을 보정하지 않는다.
 * 경로는 여기 한 곳에서만 관리한다. */
export const HOME_TIME_BACKGROUNDS: Record<HomeTimePeriod, string> = {
  dawn: img('time_backgrounds/01_dawn.png'),
  morning: img('time_backgrounds/02_morning.png'),
  day: img('time_backgrounds/03_day.png'),
  afternoon: img('time_backgrounds/04_afternoon.png'),
  night: img('time_backgrounds/05_night.png'),
};

/* 시간대 구간 — 브라우저 로컬 시간 기준, 자정부터의 분(minute)으로 표현한다.
 *   dawn      05:00 ~ 07:29
 *   morning   07:30 ~ 10:29
 *   day       10:30 ~ 16:29
 *   afternoon 16:30 ~ 19:29
 *   night     19:30 ~ 04:59 (자정을 넘긴다)
 * start 는 각 구간이 시작되는 분이고, 위에서부터 시각 순서로 둔다. */
const HOME_TIME_STARTS: readonly { start: number; period: HomeTimePeriod }[] = [
  { start: 5 * 60, period: 'dawn' },
  { start: 7 * 60 + 30, period: 'morning' },
  { start: 10 * 60 + 30, period: 'day' },
  { start: 16 * 60 + 30, period: 'afternoon' },
  { start: 19 * 60 + 30, period: 'night' },
];

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

export function getHomeTimePeriod(date: Date): HomeTimePeriod {
  const minutes = minutesOfDay(date);

  // 가장 늦게 시작한 구간 중 지금 시각 이하인 것. 05:00 이전이면 전날 밤(night)이 이어진다.
  for (let i = HOME_TIME_STARTS.length - 1; i >= 0; i -= 1) {
    if (minutes >= HOME_TIME_STARTS[i].start) return HOME_TIME_STARTS[i].period;
  }
  return 'night';
}

/** 지금 이후 처음 오는 구간 경계 시각 (Hero 가 이 시각에 배경을 다시 판별한다) */
export function getNextHomeTimeBoundary(date: Date): Date {
  const minutes = minutesOfDay(date);
  const next = HOME_TIME_STARTS.find(({ start }) => start > minutes);

  const nextBoundary = new Date(date);
  if (!next) nextBoundary.setDate(nextBoundary.getDate() + 1); // 마지막 경계(19:30) 이후 → 내일 05:00
  const nextStart = next ? next.start : HOME_TIME_STARTS[0].start;
  nextBoundary.setHours(Math.floor(nextStart / 60), nextStart % 60, 0, 0);

  return nextBoundary;
}
