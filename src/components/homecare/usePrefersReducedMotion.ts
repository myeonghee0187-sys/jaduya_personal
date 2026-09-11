import { useEffect, useState } from 'react';

/** prefers-reduced-motion 미디어 쿼리 구독 — 이 프로젝트가 이미 쓰는
 * `window.matchMedia?.('(prefers-reduced-motion: reduce)').matches` 패턴(LifePage.tsx 등)을
 * 홈케어 모션 컴포넌트들이 공통으로 쓸 수 있게 훅으로만 감쌌다. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export default usePrefersReducedMotion;
