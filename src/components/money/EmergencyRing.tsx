/* JADUYA — 돈 관리 도넛 링 (비상금 탭의 목표 달성률 / 고정비 탭의 지출 비중에서 공유).
 * Figma 는 각각 40%, 47% 값 하나에 고정된 vector 를 export 했지만,
 * ConsumptionRadar.tsx 와 같은 이유로 실제 값은 바뀌어야 하므로 stroke-dasharray 를
 * 직접 계산해서 그린다. size/stroke/색은 props 로 받아 두 화면이 같은 컴포넌트를 쓴다. */

interface EmergencyRingProps {
  percent: number;
  /** 링 전체 지름(px) — 비상금 168, 고정비 통계 카드처럼 작은 자리에선 줄여서 쓴다 */
  size?: number;
  stroke?: number;
  trackColor?: string;
  progressColor?: string;
  valueColor?: string;
  valueSize?: number;
  valueFontFamily?: string;
  /** 배치용 추가 클래스 — 위치/margin 만 여기서 바꾼다 */
  className?: string;
}

export function EmergencyRing({
  percent,
  size = 168,
  stroke = 18,
  trackColor = '#dccdba',
  progressColor = 'var(--brand-green)',
  valueColor = 'var(--brand-green)',
  valueSize = 20,
  valueFontFamily,
  className,
}: EmergencyRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={`money-fund-ring${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}%`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          className="money-fund-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          style={{ stroke: trackColor }}
        />
        <circle
          className="money-fund-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ stroke: progressColor }}
        />
      </svg>
      <span
        className="money-fund-ring__value"
        style={{ color: valueColor, fontSize: valueSize, fontFamily: valueFontFamily }}
      >
        {clamped}%
      </span>
    </div>
  );
}

export default EmergencyRing;
