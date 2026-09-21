export type AppPage =
  | 'home'
  | 'my'
  | 'settings'
  | 'account'
  | 'support'
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
  | 'community-region'
  | 'benefits'
  | 'benefits-housing'
  | 'benefits-cost'
  | 'benefits-pet'
  | 'benefits-medical'
  | 'benefits-recommend'
  | 'benefit-detail'
  | 'ai-chat'
  | 'money'
  | 'money-budget'
  | 'money-accounts'
  | 'money-fixed'
  | 'money-expense'
  | 'money-fund'
  | 'widget-gallery'
  | 'notifications';

/** 이동하면서 도착 화면에 넘기는 값. 도착 화면이 초기 상태를 잡는 데만 쓴다. */
export interface NavigateOptions {
  /** 탭이 있는 화면(커뮤니티 등)에서 처음 열 탭 이름 */
  tab?: string;
  /** 도착 화면에서 처음 보여줄 섹션 id (예: 자취 프로필의 'recommend') */
  section?: string;
  /** 혜택 상세 화면에서 조회할 혜택의 고유 id */
  benefitId?: string;
  /** 커뮤니티 홈으로 들어가면서 바로 열 게시글 id — 마이페이지 "나의 활동"에서
   * 저장한 글/작성한 글/댓글을 눌러 기존 게시글 상세(CommunityPostDetailPanel)로 갈 때 쓴다. */
  postId?: string;
  /** 뒤로가기로 돌아갈 화면. 없으면 도착 화면의 기본 상위 화면으로 간다.
   * 일반 복귀는 browser history를 사용하고, 이 값은 직접 진입 fallback에만 쓴다. */
  returnTo?: AppPage;
  /** 돌아갈 화면에서 복원할 탭. 재사용 상세 화면의 진입 문맥을 한 단계만 전달한다. */
  returnTab?: string;
  /** 중간 상세를 한 번 더 거쳐도 원래 화면의 옵션을 잃지 않게 넘기는 값. */
  returnOptions?: NavigateOptions;
  /** 자두AI에서 외부 화면으로 이동한 뒤 돌아올 때 기존 대화를 다시 연다. */
  reopenAIChat?: boolean;
}


export const PAGE_PATHS: Record<AppPage, string> = {
  home: '/', my: '/my', settings: '/my/settings', account: '/my/account', support: '/my/support',
  mission: '/my/missions', 'living-profile': '/my/profile', saved: '/my/activity',
  life: '/living', 'life-first': '/living/first', 'life-homecare': '/living/home-care',
  'life-house': '/living/housekeeping', 'life-eat': '/living/food',
  community: '/community', 'community-question': '/community?filter=question',
  'community-tip': '/community/tips', 'community-region': '/community/reviews',
  benefits: '/money/benefits',
  'benefits-housing': '/money/benefits/housing', 'benefits-cost': '/money/benefits/cost',
  'benefits-pet': '/money/benefits/pet', 'benefits-medical': '/money/benefits/medical',
  'benefits-recommend': '/money/benefits/recommended',
  'benefit-detail': '/money/benefits/:id', 'ai-chat': '/ai', money: '/money',
  'money-budget': '/money/budget', 'money-accounts': '/money/accounts',
  'money-fixed': '/money/fixed', 'money-expense': '/money/expense', 'money-fund': '/money/fund',
  'widget-gallery': '/widgets', notifications: '/notifications',
};
export function pageUrl(page: AppPage, options: NavigateOptions = {}): string {
  let path = PAGE_PATHS[page];
  if (page === 'community' && options.postId) path = '/community/post/' + encodeURIComponent(options.postId);
  if (page === 'benefit-detail') path = '/money/benefits/' + encodeURIComponent(options.benefitId ?? 'unknown');
  const url = new URL(path, 'https://jaduya.invalid');
  if (page === 'community' && options.tab === '질문') url.searchParams.set('filter', 'question');
  else if (options.tab) url.searchParams.set('tab', options.tab);
  if (options.section) url.searchParams.set('section', options.section);
  return url.pathname + url.search;
}
export function pageForPath(pathname: string): AppPage {
  if (pathname.startsWith('/community/post/')) return 'community';
  const exact = Object.entries(PAGE_PATHS).find(([, path]) => path === pathname);
  if (exact) return exact[0] as AppPage;
  if (pathname.startsWith('/money/benefits/')) return 'benefit-detail';
  return 'home';
}

/** Malformed external URLs must reach the missing-content UI, not crash the app. */
export function decodeRouteId(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}
