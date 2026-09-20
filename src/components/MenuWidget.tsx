import type { CSSProperties } from 'react';
import { GlyphIcon } from './GlyphIcon';
import { MENU_WIDGET_DEFS, slotColorOf } from '../data/menuWidgets';
import type { MenuWidgetItem } from '../data/menuWidgets';

/** 위젯 아이콘 도형의 긴 변(px) — 모든 위젯 공통. 카드(79.5×86)에서 라벨과 겹치지 않는 크기. */
const MENU_WIDGET_ICON_SIZE = 26;

/* 홈 '내 메뉴'의 1×1 위젯 한 칸 — Figma Widget/1x1 + Slot/NN 셀과 같은 구조.
 *
 *   <li.menu-slot>      자리(Slot). 컬러는 위젯이 아니라 이 자리(화면에 그려진 순서)가 정한다.
 *     <span.menu-slot__wiggle>   편집 모드의 흔들림 전용 레이어 (이동·확대 transform 과 분리)
 *       <button.menu-widget>   위젯. 라벨 + 아이콘만 — 색은 자리에서 물려받는다.
 *     <button.menu-slot__remove>   편집 모드에서만. 위젯 위에 얹혀서 카드 내용을 밀지 않는다.
 *
 * 위젯은 item 하나(id·type·size·order)만 받는 독립 아이템이라, 같은 컴포넌트를
 * 추가·삭제·재정렬해도 다른 위젯에 영향이 없다. */

/** 흔들림 위상 — 위젯 id 로 정해서 순서가 바뀌어도 그 위젯의 흔들림이 끊기지 않는다 */
function wigglePhase(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return sum % 6;
}

interface MenuWidgetSlotProps {
  item: MenuWidgetItem;
  /** 화면에 그려진 자리(1부터). 드래그 중에는 order 가 아니라 이 값으로 색이 정해진다. */
  position: number;
  editing: boolean;
  dragging: boolean;
  onOpen: (item: MenuWidgetItem) => void;
  onRemove: (id: string) => void;
}

export function MenuWidgetSlot({ item, position, editing, dragging, onOpen, onRemove }: MenuWidgetSlotProps) {
  const def = MENU_WIDGET_DEFS[item.type];

  return (
    <li
      className={`menu-slot menu-slot--${slotColorOf(position)}${dragging ? ' is-dragging' : ''}`}
      data-widget-id={item.id}
      data-order={item.order}
      style={{ '--menu-wiggle': wigglePhase(item.id) } as CSSProperties}
    >
      <span className="menu-slot__wiggle">
        <button type="button" className="menu-widget" data-size={item.size} onClick={() => onOpen(item)}>
          <span className="menu-widget__label">{def.label}</span>
          <GlyphIcon file={def.icon} size={MENU_WIDGET_ICON_SIZE} className="menu-widget__icon" />
        </button>
      </span>
      {editing && (
        <button
          type="button"
          className="menu-slot__remove"
          aria-label={`${def.label} 삭제`}
          onClick={() => onRemove(item.id)}
        />
      )}
    </li>
  );
}
