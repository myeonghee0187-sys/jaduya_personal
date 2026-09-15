import type { WidgetRankItem, WidgetRow, WidgetStatusRow } from '../../data/widgetRegistry';

/** 라벨 + 값 목록 행 — 강조(브랜드 레드)는 위젯마다 라벨 쪽일 수도, 값 쪽일 수도 있다 */
export function ListRows({ rows }: { rows: WidgetRow[] }) {
  return (
    <span className="wcard__rows">
      {rows.map((row, i) => (
        <span className="wcard__row" key={i}>
          <span className={`wcard__row-label${row.emphasis === 'label' ? ' is-emphasis' : ''}`}>{row.label}</span>
          <span className={`wcard__row-value${row.emphasis === 'value' ? ' is-emphasis' : ''}`}>{row.value}</span>
        </span>
      ))}
    </span>
  );
}

/** 체크 상태 목록 — 완료(✓, 그린 라벨) / 아직(○, 회색 라벨) */
export function StatusRows({ rows }: { rows: WidgetStatusRow[] }) {
  return (
    <span className="wcard__status-rows">
      {rows.map((row, i) => (
        <span className={`wcard__status-row wcard__status-row--${row.tone}`} key={i}>
          <span className="wcard__status-mark" aria-hidden="true">
            {row.tone === 'done' ? '✓' : '○'}
          </span>
          <span className="wcard__status-label">{row.label}</span>
          {row.status && <span className="wcard__status-value">{row.status}</span>}
        </span>
      ))}
    </span>
  );
}

/** 순위 목록 — 실시간 인기 Large 전용 */
export function RankList({ items }: { items: WidgetRankItem[] }) {
  return (
    <span className="wcard__rank-list">
      {items.map((item) => (
        <span className="wcard__rank-row" key={item.rank}>
          <span className="wcard__rank-num">{item.rank}</span>
          <span className="wcard__rank-text">{item.text}</span>
          <span className="wcard__rank-meta">{item.meta}</span>
        </span>
      ))}
    </span>
  );
}
