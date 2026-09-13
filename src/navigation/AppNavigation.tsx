import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** 'living-profile' 은 마이페이지 '자취 프로필' 상세 화면이다 (하단 저장 CTA 를 쓰므로 탭바를 두지 않는다) */
/** 'mission' / 'saved' 는 'my' 아래 하위 화면이다 (탭바는 '마이' active 를 유지한다) */
/** 'life' 는 탭바 '생활' 의 메인 화면이다 */
/** 'life-first' / 'life-homecare' / 'life-house' / 'life-eat' 는 생활 아래 하위 화면이다 (탭바는 '생활' active 를 유지한다) */
/** 'money' 는 탭바 '돈관리' 의 메인 화면이다 */
/** 'money-budget' 는 돈관리 아래 예산 설정 화면이다 (탭바는 '돈관리' active 를 유지한다) */
/** 'community-question' 은 커뮤니티 '질문' 탭 전용 화면이다 (탭바는 '커뮤니티' active 를 유지한다) */
/** 'community-tip' 은 커뮤니티 '자취 꿀팁' 탭 전용 화면이다 (탭바는 '커뮤니티' active 를 유지한다) */
export type AppPage =
  | 'home'
  | 'my'
  | 'mission'
  | 'living-profile'
  | 'saved'
  | 'life'
  | 'life-first'
  | 'life-homecare'
  | 'life-house'
  | 'life-eat'
  | 'community'
  | 'community-question'
  | 'community-tip'
  | 'ai-chat'
  | 'money'
  | 'money-budget';

/** 이동하면서 도착 화면에 넘기는 값. 도착 화면이 초기 상태를 잡는 데만 쓴다. */
export interface NavigateOptions {
  /** 탭이 있는 화면(커뮤니티 등)에서 처음 열 탭 이름 */
  tab?: string;
  /** 도착 화면에서 처음 보여줄 섹션 id (예: 자취 프로필의 'recommend') */
  section?: string;
  /** 뒤로가기로 돌아갈 화면. 없으면 도착 화면의 기본 상위 화면으로 간다.
   * history 스택을 만들지 않고 "어디서 들어왔는지" 한 단계만 기억한다. */
  returnTo?: AppPage;
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
