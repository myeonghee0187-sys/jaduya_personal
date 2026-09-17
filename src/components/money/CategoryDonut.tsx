/* JADUYA — "이번 달" 탭 소비 분석의 카테고리 도넛 차트.
 * EmergencyRing.tsx 와 같은 stroke-dasharray 기법을 여러 구간으로 확장한 버전이다 —
 * 각 구간은 전체 원(circumference)에서 자기 몫만 dasharray 로 보여주고, 그 앞까지
 * 누적된 비율만큼 dashoffset 으로 밀어서 이어 붙인다(12시 방향에서 시작, rotate -90). */

export interface DonutSegment {
  key: string;
  color: string;
  /** 0~100. 전체 합이 100이 아니어도(반올림 오차) 마지막 구간이 나머지를 자연스럽게 채운다. */
  percent: number;
}

interface CategoryDonutProps {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  centerLabel: string;
  centerValue: string;
  className?: string;
}

export function CategoryDonut({
  segments,
  size = 116,
  stroke = 26,
  centerLabel,
  centerValue,
  className,
}: CategoryDonutProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div
      className={`category-donut${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`총 지출 ${centerValue}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          className="category-donut__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        {segments.map((seg) => {
          const segLength = (seg.percent / 100) * circumference;
          const offset = -((accumulated / 100) * circumference);
          accumulated += seg.percent;
          return (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={stroke}
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ stroke: seg.color }}
            />
          );
        })}
      </svg>
      <span className="category-donut__center">
        <span className="category-donut__center-label">{centerLabel}</span>
        <span className="category-donut__center-value">{centerValue}</span>
      </span>
    </div>
  );
}

export default CategoryDonut;
