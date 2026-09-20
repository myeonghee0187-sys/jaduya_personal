import { useRef } from 'react';
import type { RefObject } from 'react';
import { GlyphIcon } from './GlyphIcon';
import { MenuWidgetSlot } from './MenuWidget';
import { useMenuGridEdit } from '../hooks/useMenuGridEdit';
import type { MenuWidgetItem } from '../data/menuWidgets';

/* ② 내 메뉴
 *
 * 사용자가 고른 1×1 위젯을 4열 그리드로 보여준다 (data/menuWidgets.ts).
 * 위젯은 { id, type, size, order } 아이템이고, 여기서는 order 순서대로 그릴 뿐이다.
 * 길게 누르면 같은 화면에서 편집 모드가 되고, 헤더의 메뉴 관리 버튼은 별도 관리 화면으로
 * 이동한다. 삭제(-)와 드래그 재정렬은 items 를 바꿔 다시 내려받는 방식으로만 반영된다. */

interface MyLifeSectionProps {
  /** 홈에 놓인 위젯 — order 순서로 그려진다 */
  widgets: MenuWidgetItem[];
  editing: boolean;
  onOpenWidget: (item: MenuWidgetItem) => void;
  /** 상세 메뉴 관리 화면으로 이동 — 홈의 편집 mode를 직접 켜지 않는다. */
  onManageMenu: () => void;
  onEnterEdit: () => void;
  onExitEdit: () => void;
  onRemoveWidget: (id: string) => void;
  /** 드래그를 놓았을 때 새 순서(위젯 id 배열) */
  onReorderWidgets: (ids: string[]) => void;
  /** 위젯 그리드(.menu-grid) DOM 참조 — 코치마크가 강조 영역을 잴 때도 쓴다 */
  gridRef: RefObject<HTMLUListElement>;
}

export function MyLifeSection({
  widgets,
  editing,
  onOpenWidget,
  onManageMenu,
  onEnterEdit,
  onExitEdit,
  onRemoveWidget,
  onReorderWidgets,
  gridRef,
}: MyLifeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const ordered = [...widgets].sort((a, b) => a.order - b.order);
  const byId = new Map(ordered.map((item) => [item.id, item]));

  const { renderIds, draggingId, gridProps } = useMenuGridEdit({
    gridRef,
    sectionRef,
    ids: ordered.map((item) => item.id),
    editing,
    onEnterEdit,
    onExitEdit,
    onReorder: onReorderWidgets,
  });

  return (
    <section className="my-life" ref={sectionRef}>
      <div className="section-header">
        <div className="section-header__title">
          <h2>내 메뉴</h2>
        </div>
        <button
          type="button"
          className="section-header__edit"
          aria-label="내 메뉴 관리 화면으로 이동"
          onClick={onManageMenu}
        >
          <span className="fill_box">
            <span className="home-action-button__icon">
              <GlyphIcon file="gear.svg" size={15} />
            </span>
            <span>메뉴 관리</span>
          </span>
        </button>
      </div>

      <ul
        className={`menu-grid${editing ? ' is-editing' : ''}`}
        ref={gridRef}
        aria-label="내 메뉴"
        {...gridProps}
      >
        {renderIds.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <MenuWidgetSlot
              key={item.id}
              item={item}
              position={index + 1}
              editing={editing}
              dragging={draggingId === item.id}
              onOpen={onOpenWidget}
              onRemove={onRemoveWidget}
            />
          );
        })}
      </ul>
    </section>
  );
}
