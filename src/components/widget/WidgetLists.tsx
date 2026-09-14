import type { WidgetChecklistItem, WidgetRow } from '../../data/widgets';

/** 라벨 + 값 목록 행 — 냉장고/오늘 할 일/다음 청소/소비 분석/나의 활동/인기글이 공유한다.
 * 강조(브랜드 레드)는 위젯마다 라벨 쪽일 수도, 값 쪽일 수도 있어 emphasis로 고른다. */
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

/** 값 없이 한 줄씩만 나열하는 목록 — 받을 수 있는 혜택/맞춤 혜택/동네 소식/저장한 콘텐츠 */
export function BulletList({ bullets }: { bullets: string[] }) {
  return (
    <span className="wcard__bullets">
      {bullets.map((b, i) => (
        <span className="wcard__bullet" key={i}>
          {b}
        </span>
      ))}
    </span>
  );
}

/** 체크 표시 목록 — 생활 체크 Large 전용 */
export function Checklist({ items }: { items: WidgetChecklistItem[] }) {
  return (
    <span className="wcard__checklist">
      {items.map((item, i) => (
        <span className="wcard__check-row" key={i}>
          <span className="wcard__check-label">{item.label}</span>
          <span className={`wcard__check-mark${item.done ? ' is-done' : ''}`}>{item.done ? '✓' : '○'}</span>
        </span>
      ))}
    </span>
  );
}
