import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** 'mission' / 'saved' 는 'my' 아래 하위 화면이다 (탭바는 '마이' active 를 유지한다) */
/** 'life' 는 탭바 '생활' 의 메인 화면이다 */
/** 'life-first' 는 생활 아래 하위 화면이다 (탭바는 '생활' active 를 유지한다) */
/** 'money' 는 탭바 '돈관리' 의 메인 화면이다 */
/** 'money-budget' 는 돈관리 아래 예산 설정 화면이다 (탭바는 '돈관리' active 를 유지한다) */
/** 'community-question' 은 커뮤니티 '질문' 탭 전용 화면이다 (탭바는 '커뮤니티' active 를 유지한다) */
export type AppPage =
  | 'home'
  | 'my'
  | 'mission'
  | 'saved'
  | 'life'
  | 'life-first'
  | 'community'
  | 'community-question'
  | 'ai-chat'
  | 'money'
  | 'money-budget';

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
