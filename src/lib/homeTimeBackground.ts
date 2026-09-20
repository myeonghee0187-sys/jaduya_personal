import { img } from './asset';

export type HomeTimePeriod = 'dawn' | 'day' | 'afternoon' | 'night';

export const HOME_TIME_BACKGROUNDS: Record<HomeTimePeriod, string> = {
  dawn: img('time_backgrounds/dawn.png'),
  day: img('time_backgrounds/day.png'),
  afternoon: img('time_backgrounds/afternoon.png'),
  night: img('time_backgrounds/night.png'),
};

export function getHomeTimePeriod(date: Date): HomeTimePeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 15) return 'day';
  if (hour >= 15 && hour < 19) return 'afternoon';

  return 'night';
}

export function getNextHomeTimeBoundary(date: Date): Date {
  const nextBoundary = new Date(date);
  nextBoundary.setMinutes(0, 0, 0);

  const hour = date.getHours();
  if (hour < 5) nextBoundary.setHours(5);
  else if (hour < 10) nextBoundary.setHours(10);
  else if (hour < 15) nextBoundary.setHours(15);
  else if (hour < 19) nextBoundary.setHours(19);
  else {
    nextBoundary.setDate(nextBoundary.getDate() + 1);
    nextBoundary.setHours(5);
  }

  return nextBoundary;
}
