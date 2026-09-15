import type { WidgetWeekBar } from '../../data/widgetRegistry';

/** 요일별 막대그래프 — 나의 활동 Large 전용 */
export function WeekBarChart({ bars }: { bars: WidgetWeekBar[] }) {
  return (
    <span className="wcard__weekchart">
      <span className="wcard__weekchart-bars">
        {bars.map((bar, i) => (
          <span key={i} className="wcard__weekchart-bar" style={{ height: `${bar.height}%` }} />
        ))}
      </span>
      <span className="wcard__weekchart-labels">
        {bars.map((bar, i) => (
          <span key={i}>{bar.day}</span>
        ))}
      </span>
    </span>
  );
}
