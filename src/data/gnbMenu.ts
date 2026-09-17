/* GNB 전체메뉴 구조.
 *
 * 화면(GnbOverlay)은 이 데이터만 보고 렌더한다 — 좌측 대메뉴 목록(GNB_CATEGORIES)과
 * 우측에 뿌릴 하위 메뉴(category.items)를 이 한 곳에서만 관리한다.
 * 아직 페이지가 없는 메뉴는 route 를 null 로 두고 클릭 영역만 준비해 둔다.
 * 페이지가 생기면 route 값만 채우면 되고 화면 코드는 바꾸지 않는다.
 */

import type { AppPage } from '../navigation/AppNavigation';

export interface GnbSubMenu {
  id: string;
  name: string;
  /** 연결된 화면. 아직 없으면 null (클릭해도 이동하지 않는다) */
  route: AppPage | null;
  /** 그 카테고리의 대표 화면이면 true — 글자만 한 단계 굵게 그린다 */
  home?: boolean;
}

export interface GnbCategory {
  id: string;
  name: string;
  /** assets/icon/ 아래 파일명 */
  iconFile: string;
  /** 좌측에서 이 대메뉴를 선택했을 때 우측에 뿌릴 하위 메뉴 — 2열 구조라 항상 최소 1개는 있다 */
  items: GnbSubMenu[];
}

export const GNB_CATEGORIES: GnbCategory[] = [
  {
    id: 'living',
    name: '생활',
    iconFile: 'gnb-nav-living.svg',
    items: [
      { id: 'living-home', name: '생활 홈', route: 'life', home: true },
      { id: 'living-start', name: '첫 자취', route: 'life-first' },
      { id: 'living-homecare', name: '홈케어', route: 'life-homecare' },
      { id: 'living-house', name: '살림', route: 'life-house' },
      { id: 'living-food', name: '먹거리', route: 'life-eat' },
    ],
  },
  {
    id: 'money',
    name: '돈 관리',
    iconFile: 'gnb-nav-money.svg',
    items: [
      /* '이번달' 이 MoneyPage 의 기본 탭이라 그대로 연결한다.
       * 고정비 / 소비 / 비상금은 같은 화면의 탭 상태라 별도 화면이 없다 — route 를 비워 둔다. */
      { id: 'money-month', name: '이번달', route: 'money' },
      { id: 'money-fixed', name: '고정비', route: null },
      { id: 'money-spend', name: '소비', route: null },
      { id: 'money-emergency', name: '비상금', route: null },
    ],
  },
  {
    id: 'community',
    name: '커뮤니티',
    iconFile: 'gnb-nav-community.svg',
    items: [
      { id: 'community-qna', name: '게시판', route: 'community-question' },
      { id: 'community-tip', name: '자취꿀팁', route: 'community-tip' },
      { id: 'community-region', name: '지역후기', route: 'community-region' },
    ],
  },
  {
    id: 'benefit',
    name: '혜택',
    iconFile: 'gnb-nav-benefit.svg',
    /* 아직 혜택·복지 안에 별도 하위 화면이 없어 대표 화면 하나만 둔다 —
     * 2열 구조에서는 대메뉴도 항상 우측에 최소 1개의 하위 메뉴로 나타나야 한다. */
    items: [{ id: 'benefit-main', name: '혜택·복지', route: 'benefits' }],
  },
];

/** 현재 페이지가 어느 대메뉴에도 속하지 않을 때(예: 홈) 좌측에서 기본으로 선택해 둘 대메뉴 */
export const GNB_DEFAULT_CATEGORY_ID = 'living';
