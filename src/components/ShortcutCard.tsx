import { icon } from '../lib/asset';
import type { MenuItem } from '../types';

interface ShortcutCardProps {
  item: MenuItem;
  /** 연결된 화면이 있을 때만 넘긴다 — 없으면 지금처럼 이동하지 않는다 */
  onSelect?: (item: MenuItem) => void;
}

/** GNB '내 메뉴' 바로가기 카드 */
export function ShortcutCard({ item, onSelect }: ShortcutCardProps) {
  return (
    <a
      className="shortcut"
      href="#"
      onClick={(event) => {
        event.preventDefault();
        onSelect?.(item);
      }}
    >
      <img className="shortcut__icon" src={icon(item.icon)} alt="" />
      <span className="shortcut__label">{item.name}</span>
    </a>
  );
}
