/* JADUYA — 돈관리 > 소비 "소비 흐름" 막대그래프.
 * 아그리게이트(전체) 화면과 카테고리 상세 화면이 이 컴포넌트 하나를 공유한다 — 어느 쪽이든
 * 막대 높이는 항상 amount 하나에서만 계산해서(막대 개수만큼의 height 를 따로 저장해두지 않는다),
 * 그래프 숫자가 실제 거래 합계와 어긋날 일이 없게 한다(요구사항 13. 소비 흐름 데이터 정합성). */
export interface FlowChartPoint {
  key: string;
  /** 헤더/툴팁에 쓰는 전체 라벨 (예: "9월 20일") */
  label: string;
  /** 막대 아래 축에 쓰는 짧은 라벨 — 주간/월간처럼 막대 수가 적을 때만 쓴다 */
  shortLabel?: string;
  amount: number;
  /** 일간 그래프에서만 쓰는 실제 날짜(1~30) — 그래프 선택과 거래 내역을 연결할 때 쓴다 */
  day?: number;
}

interface FlowBarChartProps {
  points: FlowChartPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** 30일치 일별 그래프처럼 막대가 많을 때만 쓰는 시작/중간/끝 축 라벨 */
  axisStart?: string;
  axisMid?: string;
  axisEnd?: string;
  /** 카테고리 상세에서 헤더·툴팁에 한 줄 더 보여줄 카테고리명 (예: "식비") */
  categoryLabel?: string;
  emptyLabel?: string;
}

const MAX_BAR_PX = 76;
const MIN_BAR_PX = 2;

export function FlowBarChart({
  points,
  selectedIndex,
  onSelect,
  axisStart,
  axisMid,
  axisEnd,
  categoryLabel,
  emptyLabel = '지출 내역 없음',
}: FlowBarChartProps) {
  const selected = points[selectedIndex] ?? points[points.length - 1];
  const maxAmount = Math.max(1, ...points.map((p) => p.amount));
  const showPerBarLabels = points.length <= 6;

  return (
    <div className="money-card money-flow-chart">
      <div className="money-flow-chart__head">
        <span className="money-flow-chart__date">{selected?.label ?? ''}</span>
        <span className="money-flow-chart__value">
          {selected && selected.amount > 0 ? `${selected.amount.toLocaleString()}원 사용` : emptyLabel}
        </span>
      </div>
      {categoryLabel && selected && selected.amount > 0 && (
        <p className="money-flow-chart__category">{categoryLabel}</p>
      )}
      <div className="money-flow-chart__bars">
        {points.map((point, index) => {
          const isSelected = index === selectedIndex;
          const height =
            point.amount > 0 ? Math.max(6, Math.round((point.amount / maxAmount) * MAX_BAR_PX)) : MIN_BAR_PX;
          return (
            <button
              key={point.key}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${point.label} ${point.amount > 0 ? `${point.amount.toLocaleString()}원` : emptyLabel}`}
              className={`money-flow-chart__bar${isSelected ? ' is-selected' : ''}`}
              style={{ height: `${height}px` }}
              onClick={() => onSelect(index)}
            >
              {isSelected && (
                <span className="money-flow-chart__tooltip">
                  <span className="money-flow-chart__tooltip-date">{point.label}</span>
                  <span className="money-flow-chart__tooltip-value">{`${point.amount.toLocaleString()}원`}</span>
                  {categoryLabel && <span className="money-flow-chart__tooltip-category">{categoryLabel}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showPerBarLabels ? (
        <div className="money-flow-chart__axis money-flow-chart__axis--labeled">
          {points.map((point) => (
            <span key={point.key}>{point.shortLabel ?? point.label}</span>
          ))}
        </div>
      ) : (
        <div className="money-flow-chart__axis">
          <span>{axisStart}</span>
          {axisMid && <span>{axisMid}</span>}
          <span>{axisEnd}</span>
        </div>
      )}
    </div>
  );
}

export default FlowBarChart;
