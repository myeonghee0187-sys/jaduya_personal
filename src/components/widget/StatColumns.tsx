import type { WidgetStat } from '../../data/widgets';

/** 라벨 위 / 값 아래, 가로로 나열되는 통계 칸 — 이번 달 생활비 Large 전용 */
export function StatColumns({ stats }: { stats: WidgetStat[] }) {
  return (
    <span className="wcard__stats">
      {stats.map((stat, i) => (
        <span className="wcard__stat" key={i}>
          <span className="wcard__stat-label">{stat.label}</span>
          <span className="wcard__stat-value">{stat.value}</span>
        </span>
      ))}
    </span>
  );
}
