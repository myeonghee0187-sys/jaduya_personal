/* GNB 전체메뉴 구조.
 *
 * 화면(GnbOverlay)은 이 데이터만 보고 렌더한다.
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
  /** 하위 메뉴가 없으면 아코디언이 아니라 바로 이동하는 항목이 된다 */
  items: GnbSubMenu[];
  /** 하위 메뉴가 없는 카테고리의 이동 대상 (없으면 null) */
  route: AppPage | null;
}

export const GNB_CATEGORIES: GnbCategory[] = [
  {
    id: 'living',
    name: '생활',
    iconFile: 'gnb-nav-living.svg',
    route: null,
    items: [
      /* 상위 '생활' 은 펼치기/접기만 하므로 생활 메인은 이 항목으로 들어간다 */
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
    route: null,
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
    route: null,
    items: [
      { id: 'community-qna', name: '질문', route: 'community-question' },
      { id: 'community-tip', name: '자취꿀팁', route: 'community-tip' },
      { id: 'community-region', name: '지역후기', route: 'community-region' },
    ],
  },
  {
    id: 'benefit',
    name: '혜택',
    iconFile: 'gnb-nav-benefit.svg',
    /* 하위 메뉴 없음 — 화살표를 표시하지 않고 혜택·복지 메인으로 바로 이동한다. */
    route: 'benefits',
    items: [],
  },
];

/** Figma 기준 처음 펼쳐져 있는 카테고리 */
export const GNB_DEFAULT_OPEN = 'living';
