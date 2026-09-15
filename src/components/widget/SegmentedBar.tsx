import type { WidgetLegendSegment } from '../../data/widgetRegistry';

const SEGMENT_COLOR: Record<WidgetLegendSegment['color'], string> = {
  red: 'var(--brand-primary)',
  orange: 'var(--brand-orange)',
  green: 'var(--brand-green)',
  yellow: 'var(--brand-secondary)',
};

/** 구간별 비율 막대 + 범례 — 소비 분석 Large 전용 */
export function SegmentedBar({ segments }: { segments: WidgetLegendSegment[] }) {
  return (
    <span className="wcard__seg-wrap">
      <span className="wcard__segbar">
        {segments.map((seg, i) => (
          <span
            key={i}
            className="wcard__seg"
            style={{ flexGrow: seg.percent, background: SEGMENT_COLOR[seg.color] }}
          />
        ))}
      </span>
      <span className="wcard__seg-legend">
        {segments.map((seg, i) => (
          <span className="wcard__seg-legend-item" key={i}>
            <span className="wcard__seg-dot" style={{ background: SEGMENT_COLOR[seg.color] }} />
            {seg.label}
          </span>
        ))}
      </span>
    </span>
  );
}
