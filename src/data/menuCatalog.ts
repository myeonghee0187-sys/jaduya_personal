import type { MenuItem } from '../types';

/** GNB '내 메뉴' 카탈로그 — Figma gnb_my_menu_edit (1432:4729) 기준 */
export const MENU_CATALOG: MenuItem[] = [
  { id: 'checklist', name: '체크리스트', icon: 'menu-checklist.svg' },
  { id: 'living-cost', name: '생활비', icon: 'menu-wallet.svg' },
  { id: 'schedule', name: '일정', icon: 'menu-calendar.svg' },
  { id: 'saved', name: '저장한 정보', icon: 'menu-bookmark.svg' },
  { id: 'clean-routine', name: '청소 루틴', icon: 'menu-broom.svg' },
  { id: 'recycle', name: '분리배출', icon: 'menu-recycle.svg' },
  { id: 'expense', name: '지출 내역', icon: 'menu-receipt.svg' },
  { id: 'fixed-cost', name: '고정지출', icon: 'menu-card.svg' },
  { id: 'benefit-event', name: '혜택 이벤트', icon: 'menu-gift.svg' },
  { id: 'board', name: '자유게시판', icon: 'menu-board.svg' },
  { id: 'tip', name: '1인가구 꿀팁', icon: 'menu-tip.svg' },
  { id: 'diet', name: '식단 관리', icon: 'menu-food.svg' },
];

export const DEFAULT_MENU = ['checklist', 'living-cost', 'schedule', 'saved'];

export const MAX_MENU = 4;

export function findMenu(id: string): MenuItem | undefined {
  return MENU_CATALOG.find((item) => item.id === id);
}
