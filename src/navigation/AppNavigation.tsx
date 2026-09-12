import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** 'mission' / 'saved' 는 'my' 아래 하위 화면이다 (탭바는 '마이' active 를 유지한다) */
/** 'life' 는 탭바 '생활' 의 메인 화면이다 */
/** 'life-first' / 'life-homecare' / 'life-house' / 'life-eat' 는 생활 아래 하위 화면이다 (탭바는 '생활' active 를 유지한다) */
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
  | 'life-homecare'
  | 'life-house'
  | 'life-eat'
  | 'community'
  | 'community-question'
  | 'ai-chat'
  | 'money'
  | 'money-budget';

/** 이동하면서 도착 화면에 넘기는 값. 도착 화면이 초기 상태를 잡는 데만 쓴다. */
export interface NavigateOptions {
  /** 탭이 있는 화면(커뮤니티 등)에서 처음 열 탭 이름 */
  tab?: string;
}

interface AppNavigationValue {
  page: AppPage;
  options: NavigateOptions;
  navigate: (page: AppPage, options?: NavigateOptions) => void;
}

const AppNavigationContext = createContext<AppNavigationValue | null>(null);

/** 기존 인증 화면과 같은 state 기반 전환. 미구현 화면의 route는 만들지 않는다. */
export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<{ page: AppPage; options: NavigateOptions }>({
    page: 'home',
    options: {},
  });
  /* navigate(page) 형태의 기존 호출은 그대로 동작한다 — options 는 선택값이다 */
  const value = useMemo(
    () => ({
      page: route.page,
      options: route.options,
      navigate: (page: AppPage, options: NavigateOptions = {}) => setRoute({ page, options }),
    }),
    [route],
  );
  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}

/** Provider 밖의 기존 독립 컴포넌트는 자체 선택 상태를 유지한다. */
export function useAppNavigation() {
  return useContext(AppNavigationContext);
}
