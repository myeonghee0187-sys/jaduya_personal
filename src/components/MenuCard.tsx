import { icon } from '../lib/asset';
import type { MenuItem } from '../types';

interface MenuCardProps {
  item: MenuItem;
  /** true = 선택된 메뉴(해제 가능), false = 추가 가능한 메뉴 */
  selected: boolean;
  disabled?: boolean;
  onClick: (id: string) => void;
}

/** 내 메뉴 편집 시트의 카드 — Figma gnb_my_menu_edit */
export function MenuCard({ item, selected, disabled = false, onClick }: MenuCardProps) {
  return (
    <button
      type="button"
      className={`menu-card ${selected ? 'menu-card--on' : 'menu-card--off'}`}
      data-menu-id={item.id}
      disabled={disabled}
      onClick={() => onClick(item.id)}
    >
      <span className="menu-card__main">
        <img className="menu-card__icon" src={icon(item.icon)} alt="" />
        <span className="menu-card__label">{item.name}</span>
      </span>
      <img
        className="menu-card__mark"
        src={icon(selected ? 'sheet-check-circle.svg' : 'sheet-plus.svg')}
        alt=""
      />
    </button>
  );
}
