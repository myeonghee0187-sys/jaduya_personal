import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type AppPage = 'home' | 'my';

interface AppNavigationValue {
  page: AppPage;
  navigate: (page: AppPage) => void;
}

const AppNavigationContext = createContext<AppNavigationValue | null>(null);

/** 기존 인증 화면과 같은 state 기반 전환. 미구현 화면의 route는 만들지 않는다. */
export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<AppPage>('home');
  const value = useMemo(() => ({ page, navigate: setPage }), [page]);
  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}

/** Provider 밖의 기존 독립 컴포넌트는 자체 선택 상태를 유지한다. */
export function useAppNavigation() {
  return useContext(AppNavigationContext);
}
