import { createContext, useContext } from 'react';
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
}
const Context = createContext<AppNavigationValue | null>(null);
/** Compatibility names only: URL and React Router own page identity and history. */
export function AppNavigationProvider({ children, currentLocation }: { children: ReactNode; currentLocation?: Location }) {
  const location = useLocation();
  const actual = currentLocation ?? location;
  const routerNavigate = useNavigate();
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
    routerNavigate(url, { state: { options: next, from: actual.pathname + actual.search, appEntry: true,
      ...(page === 'ai-chat' ? { background: actual } : {}) } });
  };
  const goBack = (fallback: AppPage) => {
    if (!active) return;
    if (location.state?.appEntry) routerNavigate(-1);
    else routerNavigate(pageUrl(options.returnTo ?? fallback, options.returnOptions ?? { tab: options.returnTab }), { replace: true });
  };
  return <Context.Provider value={{ page: pageForPath(location.pathname), options, active, navigate,
    navigateTab: page => navigate(page), goBack,
    isAIChatOpen: actual.pathname === '/ai', closeAIChat: () => goBack('home'),
  }}>{children}</Context.Provider>;
}
export const useAppNavigation = () => useContext(Context);
