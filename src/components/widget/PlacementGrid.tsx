import { icon } from '../../lib/asset';
import type { PlacementState, SlotRef } from '../../utils/placement';
import type { WidgetSize } from '../../types';
import { WidgetSlot } from './WidgetSlot';

interface PlacementGridProps {
  state: PlacementState;
  editing: boolean;
  onTapPlaced: (ref: SlotRef) => void;
  onTapEmpty: (size: WidgetSize) => void;
  onRemove: (ref: SlotRef) => void;
  onAddCta: () => void;
}

/** 내 위젯 배치 미리보기 — 1번째 줄 M×2(또는 L 단독) + 2번째 줄 S×2 + "+" 추가 슬롯.
 * Home '내 생활' 캔버스와 같은 모양(2번째 줄 끝의 좁은 add slot)으로 통일한다. */
export function PlacementGrid({ state, editing, onTapPlaced, onTapEmpty, onRemove, onAddCta }: PlacementGridProps) {
  return (
    <div className={`wpg-grid${editing ? ' is-editing' : ''}`}>
      <div className="wpg-grid__row">
        {state.large ? (
          <WidgetSlot
            placed={state.large}
            size="large"
            editing={editing}
            onTapPlaced={() => onTapPlaced({ row: 'large' })}
            onTapEmpty={() => onTapEmpty('large')}
            onRemove={() => onRemove({ row: 'large' })}
          />
        ) : (
          state.medium.map((placed, i) => (
            <WidgetSlot
              key={i}
              placed={placed}
              size="medium"
              editing={editing}
              onTapPlaced={() => onTapPlaced({ row: 'medium', index: i as 0 | 1 })}
              onTapEmpty={() => onTapEmpty('medium')}
              onRemove={() => onRemove({ row: 'medium', index: i as 0 | 1 })}
            />
          ))
        )}
      </div>

      <div className="wpg-grid__row wpg-grid__row--small">
        {state.small.map((placed, i) => (
          <WidgetSlot
            key={i}
            placed={placed}
            size="small"
            editing={editing}
            onTapPlaced={() => onTapPlaced({ row: 'small', index: i as 0 | 1 })}
            onTapEmpty={() => onTapEmpty('small')}
            onRemove={() => onRemove({ row: 'small', index: i as 0 | 1 })}
          />
        ))}

        {!editing && (
          <button type="button" className="wpg-add-slot" onClick={onAddCta} aria-label="위젯 추가">
            <img src={icon('plus-add.svg')} alt="" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
