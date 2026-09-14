import type { WidgetSize } from '../../types';

const SIZE_LABEL: Record<WidgetSize, string> = { small: 'S', medium: 'M', large: 'L' };
const SIZES: WidgetSize[] = ['small', 'medium', 'large'];

interface WidgetSizeSelectorProps {
  value: WidgetSize;
  /** 실제로 홈에 추가할 수 있는 크기 — 카탈로그에 없는 크기는 옅게 표시만 하고, 탭은
   * 항상 먹혀서 미리보기는 어떤 크기든 자유롭게 볼 수 있다(추가 가능 여부는 CTA가 막는다). */
  available: WidgetSize[];
  onChange: (size: WidgetSize) => void;
}

/** S/M/L 선택 — 위젯 Preview Bottom Sheet 전용. benefits-chip 의 필(pill) 형태를 재사용해
 * 선택/비선택 hierarchy 를 분명히 한다. */
export function WidgetSizeSelector({ value, available, onChange }: WidgetSizeSelectorProps) {
  return (
    <div className="wg-size" role="radiogroup" aria-label="위젯 크기">
      {SIZES.map((size) => {
        const unavailable = !available.includes(size);
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={value === size}
            className={`wg-size__btn${value === size ? ' is-active' : ''}${unavailable ? ' is-unavailable' : ''}`}
            onClick={() => onChange(size)}
          >
            {SIZE_LABEL[size]}
          </button>
        );
      })}
    </div>
  );
}
