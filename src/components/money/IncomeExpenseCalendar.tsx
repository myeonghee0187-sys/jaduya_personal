const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/* 돈관리 > 수입·지출 탭의 월간 캘린더 — 날짜 그리드 계산은 고정비 탭의
 * FixedExpenseCalendar.tsx 를 그대로 옮겨왔다(요청: "고정비 캘린더 참고해서 코드 그대로
 * 사용해도 상관없다"). 다른 점은 칸마다 "있다/없다" 점 하나 대신, 그날의 수입(파랑)·
 * 지출(빨강) 합계 금액을 실제로 찍어 보여준다는 것 — 레퍼런스가 요구하는 정보량이다. */
export interface IncomeExpenseCalendarProps {
  year: number;
  /** 0-indexed (Date 규칙과 동일) */
  month: number;
  dayTotals: Map<number, { income: number; expense: number }>;
  selectedDay: number | null;
  /** 오늘이 이 달일 때만 값, 아니면 null */
  todayDay: number | null;
  onSelectDay: (day: number) => void;
}

/* 원 단위 그대로 찍으면 "+2,500,000"처럼 칸 폭(1/7)보다 훨씬 긴 값이 나와 옆 칸 숫자와
 * 겹쳐 보였다("일월화수목금토 랑 날짜가 라인이 안맞아" 다음으로 나온 문제) — 이 앱이
 * 이미 위젯 등에서 쓰는 "84.2만원" 식 만원 단위 축약(소수 1자리, .0 은 생략)으로 모든
 * 칸의 글자 수를 짧게 맞춰 구조적으로 겹칠 일을 없앤다. 정확한 원 단위 금액은 날짜를
 * 눌렀을 때 아래 영수증(flow-receipt)에서 그대로 보여준다. */
function formatCellAmount(amount: number): string {
  const manwon = Math.round((amount / 10_000) * 10) / 10;
  return `${Number.isInteger(manwon) ? manwon : manwon.toFixed(1)}만`;
}

export function IncomeExpenseCalendar({
  year,
  month,
  dayTotals,
  selectedDay,
  todayDay,
  onSelectDay,
}: IncomeExpenseCalendarProps) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flow-calendar">
      <div className="flow-calendar__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="flow-calendar__grid" role="grid" aria-label={`${year}년 ${month + 1}월 수입·지출 달력`}>
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} className="flow-calendar__cell is-empty" />;
          const totals = dayTotals.get(day);
          const isSelected = selectedDay === day;
          const isToday = todayDay === day;
          const a11yAmount =
            totals && (totals.income > 0 || totals.expense > 0)
              ? `, 수입 ${totals.income.toLocaleString()}원 지출 ${totals.expense.toLocaleString()}원`
              : '';
          return (
            <button
              key={day}
              type="button"
              className={`flow-calendar__cell${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${month + 1}월 ${day}일${a11yAmount}`}
              onClick={() => onSelectDay(day)}
            >
              <span className="flow-calendar__day">{day}</span>
              {totals && totals.income > 0 && (
                <span className="flow-calendar__amount flow-calendar__amount--income">
                  +{formatCellAmount(totals.income)}
                </span>
              )}
              {totals && totals.expense > 0 && (
                <span className="flow-calendar__amount flow-calendar__amount--expense">
                  -{formatCellAmount(totals.expense)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default IncomeExpenseCalendar;
