import type { WidgetTypeDef } from '../../data/widgets';
import type { WidgetSize } from '../../types';
import { Widget } from './Widget';

interface WidgetGridProps {
  items: WidgetTypeDef[];
  /** type별 표시 크기 — 없으면 카탈로그에 등록된 첫 크기(대개 medium)를 쓴다 */
  sizeOf: (type: string) => WidgetSize;
  isAdded: (type: string) => boolean;
  onSelect: (type: string) => void;
}

/** 위젯 목록 레이아웃 — S/M/L이 서로 다른 고정 폭(128.5/167/342)이라 균등 그리드 대신
 * flex-wrap을 쓴다(기존 .wpick-grid와 같은 방식 — Medium 2개(167×2+8=342)가 한 줄에 맞는다). */
export function WidgetGrid({ items, sizeOf, isAdded, onSelect }: WidgetGridProps) {
  return (
    <div className="wg-grid">
      {items.map((def) => (
        <Widget
          key={def.type}
          def={def}
          size={sizeOf(def.type)}
          variant="grid"
          added={isAdded(def.type)}
          onClick={() => onSelect(def.type)}
        />
      ))}
    </div>
  );
}
