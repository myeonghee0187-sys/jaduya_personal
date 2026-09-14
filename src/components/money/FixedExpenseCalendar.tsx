const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/* 돈관리 > 고정비 탭의 월간 캘린더 그리드. 라이브러리 없이 순수 Date 계산으로 만든다
 * (MoneyPage.tsx 의 WEEKDAY_INSIGHT 가 이미 같은 new Date(year, month, day).getDay() 방식을 쓴다).
 * 상태(선택된 날짜/월 이동)는 MoneyPage.tsx 가 들고 있고, 이 컴포넌트는 그리기만 한다 —
 * 날짜에는 고정비가 "있다/없다"만 점으로 표시하고 금액·이름은 넣지 않는다. */
export interface FixedExpenseCalendarProps {
  year: number;
  /** 0-indexed (Date 규칙과 동일) */
  month: number;
  itemsByDay: Map<number, unknown[]>;
  selectedDay: number | null;
  /** 오늘이 이 달일 때만 값, 아니면 null */
  todayDay: number | null;
  onSelectDay: (day: number) => void;
}

export function FixedExpenseCalendar({
  year,
  month,
  itemsByDay,
  selectedDay,
  todayDay,
  onSelectDay,
}: FixedExpenseCalendarProps) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="money-fixed-calendar">
      <div className="money-fixed-calendar__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="money-fixed-calendar__grid" role="grid" aria-label={`${year}년 ${month + 1}월 고정비 달력`}>
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} className="money-fixed-calendar__cell is-empty" />;
          const count = itemsByDay.get(day)?.length ?? 0;
          const isSelected = selectedDay === day;
          const isToday = todayDay === day;
          return (
            <button
              key={day}
              type="button"
              className={`money-fixed-calendar__cell${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={count > 0 ? `${month + 1}월 ${day}일 고정비 ${count}건` : `${month + 1}월 ${day}일 고정비 없음`}
              onClick={() => onSelectDay(day)}
            >
              <span className="money-fixed-calendar__day">{day}</span>
              {count > 0 && <span className="money-fixed-calendar__dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FixedExpenseCalendar;
