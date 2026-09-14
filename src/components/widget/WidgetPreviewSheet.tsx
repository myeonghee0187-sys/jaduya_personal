import { useEffect, useState } from 'react';
import { BottomSheet } from '../BottomSheet';
import { useDragToClose } from '../../hooks/useDragToClose';
import { availableHomeSizes, widgetTitleFor } from '../../data/widgets';
import type { WidgetTypeDef } from '../../data/widgets';
import type { WidgetSize } from '../../types';
import { Widget } from './Widget';
import { WidgetSizeSelector } from './WidgetSizeSelector';

interface WidgetPreviewSheetProps {
  def: WidgetTypeDef | null;
  /** 이미 홈에 추가돼 있으면 그 크기, 아니면 undefined */
  addedSize?: WidgetSize;
  onClose: () => void;
  onAdd: (type: string, size: WidgetSize) => { ok: boolean; reason?: string };
  onRemove: (type: string) => void;
}

const DEFAULT_SIZE_ORDER: WidgetSize[] = ['medium', 'small', 'large'];

export function WidgetPreviewSheet({ def, addedSize, onClose, onAdd, onRemove }: WidgetPreviewSheetProps) {
  const [size, setSize] = useState<WidgetSize>('medium');
  const [warning, setWarning] = useState<string | null>(null);
  const { dragY, handleProps } = useDragToClose(onClose);

  /* 시트가 새로 열릴 때(위젯이 바뀔 때)마다 크기 선택을 다시 잡는다 —
   * 이미 추가된 위젯이면 그 크기부터, 아니면 이 위젯이 실제로 놓일 수 있는 기본 크기부터. */
  useEffect(() => {
    if (!def) return;
    setWarning(null);
    if (addedSize) {
      setSize(addedSize);
      return;
    }
    const available = availableHomeSizes(def.type);
    setSize(DEFAULT_SIZE_ORDER.find((s) => available.includes(s)) ?? available[0] ?? 'medium');
  }, [def, addedSize]);

  useEffect(() => {
    if (!warning) return;
    const timer = window.setTimeout(() => setWarning(null), 2200);
    return () => window.clearTimeout(timer);
  }, [warning]);

  if (!def) return null;

  const available = availableHomeSizes(def.type);
  const isAdded = addedSize !== undefined;
  const isCurrentSize = addedSize === size;

  const handleCta = () => {
    if (isAdded && isCurrentSize) {
      onRemove(def.type);
      return;
    }
    const result = onAdd(def.type, size);
    if (!result.ok) setWarning(result.reason ?? '지금은 추가할 수 없어요.');
  };

  const ctaLabel = isAdded && isCurrentSize ? '홈에서 제거' : '홈에 추가';
  const ctaDisabled = !isAdded && !available.includes(size);

  return (
    <BottomSheet
      open
      className="widget-preview"
      labelledBy="widget-preview-title"
      onDimClick={onClose}
    >
      <div
        className="widget-preview__handle"
        role="button"
        tabIndex={0}
        aria-label="시트 닫기"
        style={{ transform: dragY ? `translateY(${dragY}px)` : undefined }}
        {...handleProps}
      >
        <span className="widget-preview__grip" />
      </div>

      <h2 id="widget-preview-title" className="widget-preview__title">
        {widgetTitleFor(def, size)}
      </h2>

      <div className="widget-preview__stage">
        <Widget def={def} size={size} variant="preview" />
      </div>

      <WidgetSizeSelector value={size} available={available} onChange={setSize} />

      <p className="widget-preview__desc">
        {def.content[size].description ?? def.content[size].value ?? def.content[size].caption ?? ''}
      </p>

      <p className={`widget-preview__warning${warning ? ' is-visible' : ''}`} role="status">
        {warning}
      </p>

      <button
        type="button"
        className="auth-button widget-preview__cta"
        disabled={ctaDisabled}
        onClick={handleCta}
      >
        {ctaLabel}
      </button>
    </BottomSheet>
  );
}
