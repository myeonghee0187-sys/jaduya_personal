/* JADUYA — "소비" 탭 "내 소비 리포트"의 카테고리 레이더 차트.
 * Figma(node 2628:28033)는 특정 데이터값에 고정된 vector path를 export 했지만,
 * 실제 데이터는 바뀌어야 하므로 각도/좌표를 직접 계산해서 그린다.
 * 축 5개(식비/쇼핑/교통/생활/여가) 고정, 12시 방향에서 시계방향으로 72°씩 배치. */

const SIZE = 220;
const CENTER = SIZE / 2;
const MAX_RADIUS = 92;
const LABEL_RADIUS = MAX_RADIUS + 20;
const GRID_RINGS = [1, 0.75, 0.5, 0.25];

export interface RadarCategory {
  key: string;
  label: string;
  /** 0~100 스케일. 카테고리 간 상대 비중을 나타낸다 */
  value: number;
}

interface Point {
  x: number;
  y: number;
}

function angleAt(index: number, total: number): number {
  return (-90 + (360 / total) * index) * (Math.PI / 180);
}

function pointAt(index: number, total: number, radius: number): Point {
  const angle = angleAt(index, total);
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

function polygonPath(values: number[], radius: number): string {
  return values
    .map((value, index) => {
      const { x, y } = pointAt(index, values.length, (value / 100) * radius);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/** 라벨 위치에 따라 정렬을 바꿔 텍스트가 차트 밖으로 겹치지 않게 한다 */
function labelAnchor(index: number, total: number): { textAnchor: 'start' | 'middle' | 'end'; dy: number } {
  const angle = angleAt(index, total);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const textAnchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
  const dy = sin > 0.3 ? 10 : sin < -0.3 ? -4 : 4;
  return { textAnchor, dy };
}

export function ConsumptionRadar({
  categories,
  compareValues,
  highlightKey,
}: {
  categories: RadarCategory[];
  /** 지난달 평균 등 비교선 (점선). 생략 가능 */
  compareValues?: number[];
  /** 카테고리 리스트에서 선택한 항목과 연동 — 해당 축 점/라벨을 강조한다 */
  highlightKey?: string | null;
}) {
  const values = categories.map((c) => c.value);

  return (
    <svg
      className="consumption-radar"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`카테고리별 소비 비중: ${categories.map((c) => `${c.label} ${c.value}`).join(', ')}`}
    >
      {GRID_RINGS.map((ratio) => (
        <polygon
          key={ratio}
          className="consumption-radar__grid"
          points={polygonPath(
            categories.map(() => 100),
            MAX_RADIUS * ratio,
          )}
        />
      ))}

      {categories.map((c, index) => {
        const outer = pointAt(index, categories.length, MAX_RADIUS);
        return <line key={c.key} className="consumption-radar__axis" x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} />;
      })}

      {compareValues && (
        <polygon className="consumption-radar__compare" points={polygonPath(compareValues, MAX_RADIUS)} />
      )}

      <polygon className="consumption-radar__area" points={polygonPath(values, MAX_RADIUS)} />

      {categories.map((c, index) => {
        const point = pointAt(index, categories.length, (c.value / 100) * MAX_RADIUS);
        const isHighlight = c.key === highlightKey;
        return (
          <circle
            key={c.key}
            className={`consumption-radar__point${isHighlight ? ' is-highlight' : ''}`}
            cx={point.x}
            cy={point.y}
            r={isHighlight ? 5 : 3}
          />
        );
      })}

      {categories.map((c, index) => {
        const pos = pointAt(index, categories.length, LABEL_RADIUS);
        const { textAnchor, dy } = labelAnchor(index, categories.length);
        const isHighlight = c.key === highlightKey;
        return (
          <text
            key={c.key}
            className={`consumption-radar__label${isHighlight ? ' is-highlight' : ''}`}
            x={pos.x}
            y={pos.y}
            dy={dy}
            textAnchor={textAnchor}
          >
            {c.label}
          </text>
        );
      })}
    </svg>
  );
}

export default ConsumptionRadar;
