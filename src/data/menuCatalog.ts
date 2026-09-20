import type { MenuWidgetType } from './menuWidgets';
import type { MenuSizeKey } from './menuWidgetAssets';

/* 메뉴 관리 화면의 카테고리별 메뉴 목록 (Figma menu_manage_fullpage_v2 4065:5436).
 *
 *   id         — 메뉴 id. menuWidgetAssets.ts 의 에셋이 menuId 로 이 값을 가리킨다.
 *   widgetType — 홈 위젯(data/menuWidgets.ts)과 이어지는 메뉴. 홈에 이 type 의 위젯이 있으면 "선택됨".
 *                아직 홈 위젯이 없는 메뉴는 비워 두고, 항상 미선택으로 보인다.
 *   icon       — public/assets/icon/ 아래 파일명. 홈 위젯·GNB 등 이미 쓰는 아이콘을 그대로 재사용한다. */

export interface MenuCatalogItem {
  id: string;
  label: string;
  icon: string;
  widgetType?: MenuWidgetType;
  /** false면 메뉴 행 전체를 메뉴 관리에서 숨긴다. 기본값은 true. */
  showInMenuManage?: boolean;
  /** false면 메뉴 행은 유지하되 기존 홈 1×1 preview만 숨긴다. 기본값은 true. */
  showBaseWidgetInMenuManage?: boolean;
}

export interface MenuCatalogSection {
  category: string;
  /** 아이콘 색을 정하는 카테고리 톤 — menu-manage.css */
  tone: 'life' | 'money' | 'community' | 'benefit' | 'my';
  items: readonly MenuCatalogItem[];
}

export const MENU_CATALOG: readonly MenuCatalogSection[] = [
  {
    category: '생활',
    tone: 'life',
    items: [
      { id: 'first-home', label: '첫 자취', icon: 'menu-truck.svg', widgetType: 'FirstHome' },
      { id: 'home-care', label: '홈케어', icon: 'menu-broom.svg', widgetType: 'HomeCare' },
      { id: 'housekeeping', label: '살림', icon: 'menu-recycle.svg' },
      { id: 'food', label: '먹거리', icon: 'menu-food.svg' },
    ],
  },
  {
    category: '돈 관리',
    tone: 'money',
    items: [
      { id: 'account', label: '계좌', icon: 'money-balance.svg' },
      /* 대출 전용 아이콘이 프로젝트에 없어 돈 관리 톤의 money-trend-flat 으로 임시 연결 */
      { id: 'loan', label: '대출 현황', icon: 'money-trend-flat.svg' },
      { id: 'card', label: '카드', icon: 'menu-card.svg' },
      { id: 'recent-expense', label: '최근 지출', icon: 'menu-receipt.svg', widgetType: 'RecentExpense' },
      { id: 'income', label: '수입', icon: 'money-income.svg' },
      { id: 'fixed-expense', label: '고정비', icon: 'menu-calendar.svg', widgetType: 'FixedExpense' },
      { id: 'emergency-fund', label: '비상금', icon: 'menu-wallet.svg', widgetType: 'EmergencyFund' },
    ],
  },
  {
    category: '커뮤니티',
    tone: 'community',
    items: [
      { id: 'board', label: '게시판', icon: 'menu-board.svg' },
      { id: 'living-tip', label: '자취꿀팁', icon: 'menu-tip.svg', widgetType: 'LivingTip' },
      { id: 'local-review', label: '지역후기', icon: 'menu-location.svg', widgetType: 'LocalReview' },
      { id: 'write-post', label: '글쓰기', icon: 'community-pencil.svg', widgetType: 'WritePost' },
    ],
  },
  {
    category: '혜택',
    tone: 'benefit',
    items: [
      { id: 'custom-benefit', label: '맞춤 혜택', icon: 'menu-gift.svg', widgetType: 'Benefit' },
    ],
  },
  {
    category: '마이',
    tone: 'my',
    items: [
      { id: 'living-level', label: '자취 레벨', icon: 'menu-plum.svg', widgetType: 'LivingLevel' },
      { id: 'my-activity', label: '나의 활동', icon: 'community-book.svg', widgetType: 'MyActivity' },
      { id: 'saved-info', label: '저장한 정보', icon: 'menu-bookmark.svg' },
      { id: 'notification-settings', label: '알림 설정', icon: 'bell-body.svg' },
    ],
  },
];

/** 홈 '내 메뉴' 그리드 = 4열 × 2줄 */
export const HOME_SPACE_MAX = 8;

/** '1x1' → '1×1' */
export const sizeLabel = (size: string): string => size.replace('x', '×');
export type { MenuSizeKey };
