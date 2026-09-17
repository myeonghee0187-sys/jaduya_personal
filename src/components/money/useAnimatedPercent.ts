import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';

const FILL_MS = 600;

/** 0 → percent 로 차오르는 진행률 값 — 비상금 탭 count-up(EmergencyFundCard)과 같은
 * ease-out cubic 곡선·시간(600ms)을 돈관리의 다른 진행률 바(예산, 소비 분석, 고정비)에도
 * 그대로 재사용한다. 이 값을 쓰는 컴포넌트가 마운트될 때마다(탭을 나갔다 돌아오면) 다시
 * 재생된다 — 비상금 탭이 이미 그렇게 동작하는 것과 같은 관례. */
export function useAnimatedPercent(percent: number): number {
  const reduceMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? percent : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(percent);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FILL_MS);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(percent * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return display;
}

export default useAnimatedPercent;
