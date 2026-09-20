import { useRef } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { CommunityPostPage } from './pages/CommunityPostPage';
import { useAuth } from './auth/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import type { OnboardingSelection } from './pages/Onboarding';
import { Signup } from './pages/Signup';
import type { SignupTestProfile } from './auth/signupTestProfiles';
import { MyPage } from './pages/MyPage';
import { MissionPage } from './pages/MissionPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { SavedPage } from './pages/SavedPage';
import { LifePage } from './pages/LifePage';
import { MoneyPage } from './pages/MoneyPage';
import { MoneyBudgetPage } from './pages/MoneyBudgetPage';
import { MoneyAccountsPage } from './pages/MoneyAccountsPage';
import { LifeFirstPage } from './pages/LifeFirstPage';
import { LifeHomecarePage } from './pages/LifeHomecarePage';
import { LifeHousePage } from './pages/LifeHousePage';
import { LifeEatPage } from './pages/LifeEatPage';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityTipPage } from './pages/CommunityTipPage';
import { CommunityRegionPage } from './pages/CommunityRegionPage';
import { AIChatPage } from './pages/AIChatPage';
import { BenefitsPage } from './pages/BenefitsPage';
import { BenefitsRecommendPage } from './pages/BenefitsRecommendPage';
import { BenefitDetailPage } from './pages/BenefitDetailPage';
import { MenuManagePage } from './pages/MenuManagePage';
import { NotificationPage } from './pages/NotificationPage';
import { AppSettingsPage } from './pages/AppSettingsPage';
import { AccountManagementPage } from './pages/AccountManagementPage';
import { CustomerCenterPage } from './pages/CustomerCenterPage';
import { AIChatbot } from './components/ai/AIChatbot';
import { AppNavigationProvider, useAppNavigation } from './navigation/AppNavigation';
import { BookmarkProvider } from './bookmarks/BookmarkContext';
import { CommunityPostsProvider } from './community/CommunityPostsContext';
import { WidgetPlacementProvider } from './widgets/WidgetPlacementContext';
import { MenuWidgetSelectionProvider } from './widgets/MenuWidgetSelectionContext';
import { NotificationProvider } from './notifications/NotificationContext';
import { initializeLivingProfileFromOnboarding } from './data/livingProfile';
import { PERSONA_PROFILE } from './data/personaProfile';


function MyRoute() {
  const navigation = useAppNavigation();
  return <MyPage onDetailNavigate={(to) => {
    const target = { level: 'mission', 'living-profile': 'living-profile', activity: 'saved', settings: 'settings', account: 'account', support: 'support' } as const;
    if (!(to in target)) return false;
    navigation?.navigate(target[to as keyof typeof target]);
    return true;
  }} />;
}
function MissingPage() {
  const navigate = useNavigate();
  return <div className="app"><button onClick={() => navigate('/')}>홈으로</button><p>페이지를 찾을 수 없어요.</p></div>;
}
function RouteChrome() {
  const navigation = useAppNavigation()!;
  /* 메뉴 관리(widget-gallery)는 하단 저장 Action Bar 를 가리므로 챗봇 FAB 을 렌더링하지 않는다 */
  return <AIChatbot hidden={navigation.page === 'settings' || navigation.page === 'support' || navigation.page === 'widget-gallery'}
    disabled={navigation.isAIChatOpen} showEntryHint={navigation.page === 'home'}
    initialLift={navigation.page.startsWith('community') ? 68 : 0} />;
}
/** Keep mounted views, not a navigation stack. URL/Routes alone select the visible view.
 * Frozen route contexts prevent hidden pages from receiving another page's options.
 * DOM retention preserves inputs, filters and nested scroll positions during POP. */
function MainPages() {
  const location = useLocation();
  const retained = useRef(new Map<string, Location>());
  if (!retained.current.has('/')) retained.current.set('/', { pathname: '/', search: '', hash: '', state: null, key: 'home-shell' });
  retained.current.set(location.pathname, location);
  const background: Location | undefined = location.pathname === '/ai' ? location.state?.background : undefined;
  const backgroundPath = location.pathname === '/ai' ? (background?.pathname ?? '/') : undefined;
  if (background && !retained.current.has(background.pathname)) retained.current.set(background.pathname, background);
  return <>
    {[...retained.current].map(([path, at]) => <div
      key={path}
      className={`route-page${path === location.pathname ? ' is-active' : ''}`}
      hidden={path !== location.pathname && path !== backgroundPath}
      style={{ display: path === location.pathname || path === backgroundPath ? 'contents' : 'none' }}>
      <Routes location={at}>
        <Route element={<AppNavigationProvider currentLocation={location}><Outlet /></AppNavigationProvider>}>
          <Route path="/" element={<Home />} />
          <Route path="/living" element={<LifePage />} />
          <Route path="/living/first" element={<LifeFirstPage />} />
          <Route path="/living/home-care" element={<LifeHomecarePage />} />
          <Route path="/living/housekeeping" element={<LifeHousePage />} />
          <Route path="/living/food" element={<LifeEatPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/money/budget" element={<MoneyBudgetPage />} />
          <Route path="/money/accounts" element={<MoneyAccountsPage />} />
          <Route path="/money/benefits" element={<BenefitsPage />} />
          <Route path="/money/benefits/recommended" element={<BenefitsRecommendPage />} />
          <Route path="/money/benefits/:id" element={<BenefitDetailPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/board" element={path === location.pathname ? <Navigate to="/community" replace /> : null} />
          <Route path="/community/tips" element={<CommunityTipPage />} />
          <Route path="/community/reviews" element={<CommunityRegionPage />} />
          <Route path="/community/post/:id" element={<CommunityPostPage />} />
          <Route path="/my" element={<MyRoute />} />
          <Route path="/my/profile" element={<ProfileSettingsPage />} />
          <Route path="/my/activity" element={<SavedPage />} />
          <Route path="/my/missions" element={<MissionPage />} />
          <Route path="/my/settings" element={<AppSettingsPage />} />
          <Route path="/my/account" element={<AccountManagementPage />} />
          <Route path="/my/support" element={<CustomerCenterPage />} />
          <Route path="/widgets" element={<MenuManagePage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/ai" element={<AIChatPage />} />
          <Route path="*" element={<MissingPage />} />
        </Route>
      </Routes>
    </div>)}
    <AppNavigationProvider><RouteChrome /></AppNavigationProvider>
  </>;
}
function safeReturn(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    && !['/login', '/signup', '/onboarding'].includes(value.split('?')[0]) ? value : '/';
}
export default function App() {
  const { user, completeOnboarding } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = ['/login', '/signup', '/onboarding'].includes(location.pathname);
  const returnTo = safeReturn(location.state?.returnTo);
  const finishOnboarding = (selection: OnboardingSelection) => {
    if (user) initializeLivingProfileFromOnboarding(user.email, PERSONA_PROFILE[user.persona], selection);
    completeOnboarding({ completedAt: new Date().toISOString(), answers: {
      interests: selection.interests, stage: selection.stage ? [selection.stage] : [],
    } });
    navigate(returnTo, { replace: true });
  };
  if (!user) {
    if (!['/login', '/signup'].includes(location.pathname)) return <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />;
    return <Routes>
      <Route path="/login" element={<Login onGoSignup={(profile) => navigate('/signup', { state: { returnTo, signupProfile: profile, appEntry: true } })} />} />
      <Route path="/signup" element={<Signup onGoLogin={() => navigate('/login', { state: { returnTo, appEntry: true } })} initialProfile={location.state?.signupProfile as SignupTestProfile | undefined} />} />
    </Routes>;
  }
  if (!user.onboarded) {
    if (location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace state={{ returnTo: isAuth ? returnTo : location.pathname + location.search }} />;
    return <Routes><Route path="/onboarding" element={<Onboarding onComplete={finishOnboarding} userName={user.name} />} /></Routes>;
  }
  if (isAuth) return <Navigate to={returnTo} replace />;
  return <BookmarkProvider key={user.email}><CommunityPostsProvider><NotificationProvider><WidgetPlacementProvider>
    <MenuWidgetSelectionProvider ownerKey={user.email}>
      <MainPages />
    </MenuWidgetSelectionProvider>
  </WidgetPlacementProvider></NotificationProvider></CommunityPostsProvider></BookmarkProvider>;
}
