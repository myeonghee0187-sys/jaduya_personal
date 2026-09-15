interface ProgressBarProps {
  percent: number;
  /** 채움 색 — 기본은 브랜드 레드, 예산처럼 초록을 쓰는 경우만 지정 */
  tone?: 'red' | 'green';
}

/** 위젯 공통 가로 진행률 막대 — Figma 위젯 시스템은 원형 링이 아니라 이 막대를 쓴다 */
export function ProgressBar({ percent, tone = 'red' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <span className={`wcard__progress wcard__progress--${tone}`}>
      <span className="wcard__progress-track">
        <span className="wcard__progress-fill" style={{ width: `${clamped}%` }} />
      </span>
    </span>
  );
}
