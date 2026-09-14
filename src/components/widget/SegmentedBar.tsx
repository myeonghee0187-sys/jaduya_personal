/** 구간별 비율 막대 — 소비 분석 Large 전용. 색은 항상 이 4가지 순서로 고정한다(위젯마다
 * 색을 고르지 않는다) — 브랜드 레드 / 오렌지 / 그린 / 연한 보더 톤. */
const SEGMENT_COLORS = ['var(--brand-primary)', 'var(--brand-orange)', 'var(--brand-green)', 'var(--border-warm)'];

export function SegmentedBar({ segments }: { segments: number[] }) {
  return (
    <span className="wcard__segbar">
      {segments.map((percent, i) => (
        <span
          key={i}
          className="wcard__seg"
          style={{ flexGrow: percent, background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
        />
      ))}
    </span>
  );
}
