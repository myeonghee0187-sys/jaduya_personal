import { useId } from 'react';
import { BottomSheet } from '../BottomSheet';
import { icon } from '../../lib/asset';
import type { WidgetDef } from '../../data/widgetRegistry';
import type { WidgetSize } from '../../types';

interface WidgetActionSheetProps {
  target: { def: WidgetDef; size: WidgetSize } | null;
  onClose: () => void;
  onChange: () => void;
  onDelete: () => void;
}

/** 배치 그리드에서 이미 놓인 위젯을 탭했을 때 — "위젯 변경" / "위젯 삭제"
 * (요구사항 18). 간단한 관리 액션이라 Bottom Sheet 로 처리한다. */
export function WidgetActionSheet({ target, onClose, onChange, onDelete }: WidgetActionSheetProps) {
  const titleId = useId();
  if (!target) return null;
  const content = target.def.content[target.size];

  return (
    <BottomSheet open={target !== null} className="wpg-action-sheet" labelledBy={titleId} onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>

      <div className="wpg-action-sheet__preview">
        <p className="wpg-action-sheet__title" id={titleId}>
          {target.def.name}
        </p>
        {content.value && <p className="wpg-action-sheet__value">{content.value}</p>}
        {content.description && <p className="wpg-action-sheet__desc">{content.description}</p>}
      </div>

      <button type="button" className="wpg-action-sheet__row" onClick={onChange}>
        <img src={icon('widget-chevron-right.svg')} alt="" aria-hidden="true" />
        위젯 변경
      </button>
      <button type="button" className="wpg-action-sheet__row wpg-action-sheet__row--danger" onClick={onDelete}>
        <img src={icon('widget-chevron-right.svg')} alt="" aria-hidden="true" />
        위젯 삭제
      </button>

      <button type="button" className="wpg-action-sheet__cancel" onClick={onClose}>
        취소
      </button>
    </BottomSheet>
  );
}
