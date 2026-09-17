import { useLayoutEffect, useRef, useState } from 'react';
import type { TransitionEvent } from 'react';

/** 필터를 바꾸면 목록 항목 수가 달라져 아래 콘텐츠까지 순간적으로 튀는 "끊김"을 없애는
 * FLIP(First-Last-Invert-Play) 높이 애니메이션 — 고정비 탭 카테고리 필터에서 처음 만든
 * 패턴을 다른 필터형 목록(위젯 전체 목록 등)에도 그대로 재사용한다.
 *
 * 사용법: freeze() 를 호출해 현재 높이를 얼린 다음, 목록을 바꾸는 상태를 갱신한다(deps
 * 에 그 상태를 넣는다). 다음 프레임에 새 목록의 실제 높이로 풀리며 트랜지션이 재생된다.
 * 이 훅을 쓰는 컨테이너는 CSS 로 `overflow: hidden; transition: height 260ms
 * cubic-bezier(0.22, 1, 0.36, 1);` 을 걸어줘야 한다(prefers-reduced-motion 대응 포함). */
export function useFlipHeight(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  const freeze = () => {
    const node = ref.current;
    if (node) setHeight(node.getBoundingClientRect().height);
  };

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const target = node.scrollHeight;
    const raf = requestAnimationFrame(() => setHeight(target));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName === 'height') setHeight('auto');
  };

  return {
    ref,
    style: height === 'auto' ? undefined : { height },
    onTransitionEnd,
    freeze,
  };
}

export default useFlipHeight;
