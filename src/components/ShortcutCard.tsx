import { icon } from '../lib/asset';
import type { MenuItem } from '../types';

/** GNB '내 메뉴' 바로가기 카드 */
export function ShortcutCard({ item }: { item: MenuItem }) {
  return (
    <a className="shortcut" href="#">
      <img className="shortcut__icon" src={icon(item.icon)} alt="" />
      <span className="shortcut__label">{item.name}</span>
    </a>
  );
}
