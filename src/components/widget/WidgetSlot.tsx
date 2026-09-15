import { icon } from '../../lib/asset';
import { getWidgetDef } from '../../data/widgetRegistry';
import type { PlacedWidget } from '../../utils/placement';
import type { WidgetSize } from '../../types';
import { WidgetCard } from './WidgetCard';

const SIZE_CLASS: Record<WidgetSize, string> = {
  small: 'wpg-slot--small',
  medium: 'wpg-slot--medium',
  large: 'wpg-slot--large',
};

interface WidgetSlotProps {
  placed: PlacedWidget | null;
  /** 비어 있을 때 보여줄 자리 크기 */
  size: WidgetSize;
  editing: boolean;
  onTapPlaced: () => void;
  onTapEmpty: () => void;
  onRemove: () => void;
}

/** 배치 그리드 한 자리 — 채워져 있으면 위젯 카드(+ 편집 모드의 − 버튼), 비어 있으면
 * "+ 위젯 추가" placeholder. 빈 자리를 회색 박스로만 두지 않는다(요구사항 6, 33). */
export function WidgetSlot({ placed, size, editing, onTapPlaced, onTapEmpty, onRemove }: WidgetSlotProps) {
  if (!placed) {
    return (
      <button
        type="button"
        className={`wpg-slot wpg-slot--empty ${SIZE_CLASS[size]}`}
        onClick={onTapEmpty}
        aria-label="위젯 추가"
      >
        <img className="wpg-slot__plus" src={icon('plus-add.svg')} alt="" aria-hidden="true" />
        <span>위젯 추가</span>
      </button>
    );
  }

  const def = getWidgetDef(placed.widgetId);
  if (!def) return null;

  return (
    <div className={`wpg-slot wpg-slot--filled ${SIZE_CLASS[size]}${editing ? ' is-editing' : ''}`}>
      <WidgetCard def={def} size={placed.size} variant="placement" onClick={onTapPlaced} />
      {editing && (
        <button
          type="button"
          className="wpg-slot__remove"
          aria-label={`${def.name} 위젯 삭제`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <span aria-hidden="true">−</span>
        </button>
      )}
    </div>
  );
}
