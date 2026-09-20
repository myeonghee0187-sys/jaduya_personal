import { createContext, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { decodeRouteId, pageForPath, pageUrl } from './routes';
import type { AppPage, NavigateOptions } from './routes';
export type { AppPage, NavigateOptions } from './routes';
interface AppNavigationValue {
  page: AppPage; options: NavigateOptions; active: boolean;
  navigate: (page: AppPage, options?: NavigateOptions) => void;
  navigateTab: (page: AppPage) => void;
  goBack: (fallback: AppPage) => void;
  isAIChatOpen: boolean; closeAIChat: () => void;
  /** 이 화면을 떠나는 이동(navigate·goBack)을 가로챌 수 있다 — 저장 안 된 변경이 있는 화면이 확인 Dialog 를 띄울 때 쓴다.
   * guard 가 true 를 돌려주면 이동을 넘겨받은 것이고, proceed 를 나중에 호출하면 원래 이동이 실행된다. */
  setLeaveGuard: (guard: LeaveGuard | null) => void;
}
export type LeaveGuard = (proceed: () => void) => boolean;
const Context = createContext<AppNavigationValue | null>(null);
/** Compatibility names only: URL and React Router own page identity and history. */
export function AppNavigationProvider({ children, currentLocation }: { children: ReactNode; currentLocation?: Location }) {
  const location = useLocation();
  const actual = currentLocation ?? location;
  const routerNavigate = useNavigate();
  const leaveGuard = useRef<LeaveGuard | null>(null);
  const guarded = (go: () => void) => { if (!leaveGuard.current?.(go)) go(); };
  const active = location.pathname === actual.pathname;
  const params = new URLSearchParams(location.search);
  const options: NavigateOptions = {
    ...location.state?.options,
    ...(params.get('tab') ? { tab: params.get('tab')! } : {}),
    ...(params.get('filter') === 'question' ? { tab: '질문' } : {}),
    ...(params.get('section') ? { section: params.get('section')! } : {}),
    ...(location.pathname.startsWith('/community/post/') ? { postId: decodeRouteId(location.pathname.slice('/community/post/'.length)) } : {}),
    ...(pageForPath(location.pathname) === 'benefit-detail' ? { benefitId: decodeRouteId(location.pathname.slice('/money/benefits/'.length)) } : {}),
  };
  const navigate = (page: AppPage, next: NavigateOptions = {}) => {
    if (!active) return;
    const url = pageUrl(page, next);
    if (url === actual.pathname + actual.search) return;
    guarded(() => routerNavigate(url, { state: { options: next, from: actual.pathname + actual.search, appEntry: true,
      ...(page === 'ai-chat' ? { background: actual } : {}) } }));
  };
  const goBack = (fallback: AppPage) => {
    if (!active) return;
    guarded(() => {
      if (location.state?.appEntry) routerNavigate(-1);
      else routerNavigate(pageUrl(options.returnTo ?? fallback, options.returnOptions ?? { tab: options.returnTab }), { replace: true });
    });
  };
  return <Context.Provider value={{ page: pageForPath(location.pathname), options, active, navigate,
    navigateTab: page => navigate(page), goBack,
    isAIChatOpen: actual.pathname === '/ai', closeAIChat: () => goBack('home'),
    setLeaveGuard: (guard) => { leaveGuard.current = guard; },
  }}>{children}</Context.Provider>;
}
export const useAppNavigation = () => useContext(Context);
