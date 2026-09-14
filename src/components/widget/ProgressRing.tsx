const SIZE = 32;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  percent: number;
}

/** 위젯 공통 원형 Progress — 막대와 달리 헤더 우측에 붙는 배지형이라, 퍼센트 값을 안에
 * 직접 표시해서 별도 meta 텍스트가 필요 없다. 모든 위젯이 크기와 관계없이 같은 지름(32px)을 쓴다. */
export function ProgressRing({ percent }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  return (
    <svg className="wcard__ring" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--border-warm)"
        strokeWidth={STROKE}
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--brand-primary)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
      <text x="50%" y="51%" dominantBaseline="middle" textAnchor="middle" className="wcard__ring-label">
        {clamped}%
      </text>
    </svg>
  );
}
