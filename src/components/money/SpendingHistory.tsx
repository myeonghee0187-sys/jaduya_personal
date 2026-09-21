import { useRef, useState } from 'react';
import '../../styles/statement-peek.css';
import { NEXT_CARD_PAYMENT } from '../../data/moneyFixed';
import {
  CATEGORY_META,
  CATEGORY_PERCENTAGES,
  CATEGORY_TOTALS,
  CONSUME_DIFF,
  TODAY_DAY,
  TOP_CATEGORY,
  categoryPercentages,
  monthCategoryTotals,
  monthExpenseTransactions,
  monthIncomeTransactions,
  transactionPaymentMethod,
  transactionTime,
} from '../../data/moneyTransactions';
import type { CategoryKey, ExpenseTransaction, IncomeTransaction } from '../../data/moneyTransactions';
import { icon } from '../../lib/asset';

/* 달력 — 2026년. 일별 거래 데이터가 있는 달은 7·8·9월이고, 그 이전 달(1~6월)은 빈 달력으로 오가며 볼 수 있다. 다음 달은 없다. */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CURRENT_MONTH = 8; // 0부터 시작 — 9월
const ROW_HEIGHT = 70; // 달력 한 줄 높이(px) — 숫자 + 수입/지출 두 줄

/* 하루치 합계 — 달력 칸 아래에 찍는 값(지출은 "-금액", 수입은 파란색 "+금액"). 그 달 거래 원본에서 그대로 계산한다(동일 데이터 정합). */
function sumByDay(list: readonly { day: number; amount: number }[]): Record<number, number> {
  const totals: Record<number, number> = {};
  for (const tx of list) totals[tx.day] = (totals[tx.day] ?? 0) + tx.amount;
  return totals;
}

/* 그 달에서 거래가 있는 가장 마지막 날 — 달을 넘기면 기본으로 선택하는 날짜(이번 달은 오늘까지만) */
function lastDataDay(month: number): number {
  const days = [...monthExpenseTransactions(month), ...monthIncomeTransactions(month)]
    .map((tx) => tx.day)
    .filter((day) => month !== CURRENT_MONTH || day <= TODAY_DAY);
  return days.length ? Math.max(...days) : 1;
}
const LAST_SPEND_DAY = lastDataDay(CURRENT_MONTH);

/* 카테고리 목록 — 소비가 큰 순서 */
const SORTED_CATEGORIES = [...CATEGORY_META].sort((a, b) => CATEGORY_TOTALS[b.key] - CATEGORY_TOTALS[a.key]);

/** "26. 9. 16(수)" — 거래 목록의 날짜 그룹 라벨 */
function dayGroupLabel(month: number, day: number): string {
  return `26. ${month + 1}. ${day}(${WEEKDAYS[new Date(2026, month, day).getDay()]})`;
}

/** "오늘 • 20일(일)" / "19일(토)" — 이용 내역 날짜 그룹 제목(레퍼런스 표기) */
function dayHeading(month: number, day: number): string {
  const weekday = WEEKDAYS[new Date(2026, month, day).getDay()];
  return `${month === CURRENT_MONTH && day === TODAY_DAY ? '오늘 • ' : ''}${day}일(${weekday})`;
}

type View = 'history' | 'category' | 'detail';
type FlowFilter = 'all' | 'income' | 'expense';
const FLOW_TABS: { key: FlowFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'income', label: '수입' },
  { key: 'expense', label: '지출' },
];

/* 수입·지출 내역 — 월 이동 · 금액 · 소비 분류 · 접었다 펼치는 지출 달력 · 이용 내역(월별 소비 분류 · 카테고리별 이용 내역까지).
 * 결제 예정 시트(StatementPeek)의 카드 아래 내용과 수입·지출 화면(/money/expense)이 이 컴포넌트를 그대로 같이 쓴다.
 * 루트가 스크롤 영역이라, 부모가 높이를 정해 줘야 한다(시트 본문 / 수입·지출 화면). 숫자는 거래·고정비 원본에서 계산한다. */
/* variant — 'simple'(기본): 결제 예정 시트 안의 간단한 화면(제목 + 한 줄 달력 + 선택한 날 내역).
 *            'full': 수입·지출 화면(/money/expense)의 예전 디자인 — 월 이동 화살표, 수입·지출 합계, 소비 분류 링크,
 *            스크롤하면 접히는 금액 요약, 날짜별 전체 이용 내역. */
export function SpendingHistory({
  className,
  variant = 'simple',
  onOpenExpensePage,
}: {
  className?: string;
  variant?: 'simple' | 'full' | 'classic';
  /** simple: "N월 수입·지출" 제목을 누르면 수입·지출 페이지로 이동한다(없으면 제목은 글자만) */
  onOpenExpensePage?: () => void;
}) {
  const full = variant === 'full';
  /* classic — 처음 디자인: 월 · 총 지출 · 캡션 아래에 한 달 전체 달력이 늘 펼쳐져 있고, 그 아래 선택한 날의 내역이 나온다. */
  const classic = variant === 'classic';
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [selectedDay, setSelectedDay] = useState(LAST_SPEND_DAY);
  /* full: 처음에는 한 달 전체 달력이 펼쳐져 있고(레퍼런스), 내역을 스크롤하면 한 줄로 접힌다 */
  const [expanded, setExpanded] = useState(full);
  /* full: 내역을 아래로 스크롤해 금액 요약이 접힌 상태 */
  const [scrolled, setScrolled] = useState(false);
  /* full: 수입·지출 탭 — 달력 금액과 이용 내역을 종류별로 걸러 보여준다 */
  const [flow, setFlow] = useState<FlowFilter>('all');
  const [view, setView] = useState<View>('history');
  const [detailKey, setDetailKey] = useState<CategoryKey | null>(null);
  const calendarOpen = classic || expanded;
  const bodyRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  /* full: 날짜 클릭으로 시작한 스크롤 애니메이션 동안 스크롤 → 날짜 동기화를 잠시 멈추는 기준 시각 */
  const ignoreScrollSyncUntil = useRef(0);
  const payDay = NEXT_CARD_PAYMENT?.day ?? null;

  /* ----- 달력 계산 ----- */
  const isCurrent = month === CURRENT_MONTH;
  const daysInMonth = new Date(2026, month + 1, 0).getDate();
  const firstWeekday = new Date(2026, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rowCount = cells.length / 7;
  const weekIndex = Math.floor((firstWeekday + selectedDay - 1) / 7);
  /* 이 달의 거래 원본 — 합계·달력·목록·소비 분류가 전부 여기서 나온다 */
  const expenseTxs = monthExpenseTransactions(month);
  const incomeTxs = monthIncomeTransactions(month);
  const hasData = expenseTxs.length + incomeTxs.length > 0;
  const total = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const income = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const dayTotals = sumByDay(expenseTxs);
  const dayIncome = sumByDay(incomeTxs);
  /* 월별 소비 분류 — 그 달 카테고리 합계·비율, 지난달 대비(지난달 거래가 있을 때만) */
  const catTotals = monthCategoryTotals(month);
  const catPercentages = categoryPercentages(catTotals);
  const sortedCategories = [...CATEGORY_META].sort((a, b) => catTotals[b.key] - catTotals[a.key]);
  const prevCatTotals = monthExpenseTransactions(month - 1).length > 0 ? monthCategoryTotals(month - 1) : null;
  const monthDiff = prevCatTotals ? Object.values(prevCatTotals).reduce((sum, v) => sum + v, 0) - total : null;

  /* 이 달의 거래를 날짜 최신순으로 묶는다 */
  type FlowItem = { kind: 'expense'; tx: ExpenseTransaction } | { kind: 'income'; tx: IncomeTransaction };
  const groups: { day: number; items: FlowItem[] }[] = [];
  const showIncome = !full || flow !== 'expense';
  const showExpense = !full || flow !== 'income';
  if (hasData) {
    const byDay = new Map<number, FlowItem[]>();
    for (const tx of showIncome ? incomeTxs : []) {
      if (isCurrent && tx.day > TODAY_DAY) continue;
      byDay.set(tx.day, [...(byDay.get(tx.day) ?? []), { kind: 'income', tx }]);
    }
    for (const tx of showExpense ? expenseTxs : []) {
      if (isCurrent && tx.day > TODAY_DAY) continue;
      byDay.set(tx.day, [...(byDay.get(tx.day) ?? []), { kind: 'expense', tx }]);
    }
    for (const dayKey of [...byDay.keys()].sort((a, b) => b - a)) {
      groups.push({ day: dayKey, items: byDay.get(dayKey) ?? [] });
    }
  }

  const selectedGroup = groups.find((group) => group.day === selectedDay);

  const changeMonth = (delta: number) => {
    const next = month + delta;
    if (next < 0 || next > CURRENT_MONTH) return;
    setMonth(next);
    setSelectedDay(lastDataDay(next));
    setExpanded(full);
    setScrolled(false);
    bodyRef.current?.scrollTo({ top: 0 });
  };

  /* full: 펼친 상태에서 내역을 아래로 스크롤하면 달력을 한 줄로 다시 접고 금액 요약도 접는다 */
  const onBodyScroll = () => {
    const top = bodyRef.current?.scrollTop ?? 0;
    /* 접힐 때 레이아웃이 줄어 스크롤 위치가 흔들려도 깜빡이지 않게, 접는 기준(24px)과 다시 펼치는 기준(4px)을 다르게 둔다 */
    if (top > 24) setScrolled(true);
    else if (top <= 4) setScrolled(false);
    if (expanded && top > 12) setExpanded(false);
    /* 날짜를 눌러 목록이 부드럽게 스크롤되는 동안에는 눌러 둔 날짜를 유지한다 */
    if (Date.now() < ignoreScrollSyncUntil.current) return;
    /* 스크롤하면 고정 영역(달력) 바로 아래에 걸쳐 있는 날짜 그룹을 따라 달력이 그 날짜의 주로 이동한다 */
    const body = bodyRef.current;
    const stickyBottom = stickyRef.current?.getBoundingClientRect().bottom;
    if (!body || stickyBottom === undefined) return;
    const groupEls = Array.from(body.querySelectorAll<HTMLElement>('[data-day]'));
    if (groupEls.length === 0) return;
    let visibleDay = Number(groupEls[0].dataset.day);
    for (const el of groupEls) {
      if (el.getBoundingClientRect().top > stickyBottom + 1) break;
      visibleDay = Number(el.dataset.day);
    }
    if (visibleDay !== selectedDay) setSelectedDay(visibleDay);
  };

  /* 날짜를 누르면 그 날짜를 선택하고, 아래에 그날의 내역만 보여준다(달력은 다시 한 줄로 접는다) */
  const selectDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setExpanded(false);
    if (!full) return;
    /* full: 그 날짜의 내역 그룹으로 목록을 스크롤한다 */
    const body = bodyRef.current;
    const target = body?.querySelector<HTMLElement>(`[data-day="${dayNumber}"]`);
    if (body && target) {
      /* 접히고 나면 달력 높이가 (줄 수 - 1)줄만큼 줄어드니 그만큼 빼서 위치를 잡는다 */
      const stickyHeight =
        (stickyRef.current?.offsetHeight ?? 0) -
        (expanded ? (rowCount - 1) * ROW_HEIGHT : 0) -
        (scrolled ? 0 : (summaryRef.current?.offsetHeight ?? 0));
      ignoreScrollSyncUntil.current = Date.now() + 800;
      body.scrollTo({ top: Math.max(0, target.offsetTop - stickyHeight), behavior: 'smooth' });
    }
  };

  const monthNav = (centered: boolean) => (
    <div className={`stmt-month${centered ? ' stmt-month--center' : ''}`}>
      <button type="button" aria-label="이전 달" disabled={month === 0} onClick={() => changeMonth(-1)}>
        <img src={icon('chevron-right-thin.svg')} alt="" className="is-flip" />
      </button>
      <span className="stmt-month__label">{month + 1}월</span>
      <button type="button" aria-label="다음 달" disabled={month === CURRENT_MONTH} onClick={() => changeMonth(1)}>
        <img src={icon('chevron-right-thin.svg')} alt="" />
      </button>
    </div>
  );

  const renderTransaction = (tx: ExpenseTransaction) => {
    const meta = CATEGORY_META.find((c) => c.key === tx.category);
    return (
      <li key={tx.id} className="stmt-tx">
        <span className="stmt-tx__icon" style={{ background: meta?.bg }}>
          {meta && <img src={icon(meta.icon)} alt="" />}
        </span>
        <span className="stmt-tx__text">
          <span className="stmt-tx__name">{tx.merchant}</span>
          <span className="stmt-tx__sub">
            {transactionTime(tx.id)} · {transactionPaymentMethod(tx.id)}
          </span>
        </span>
        <span className="stmt-tx__amount is-out">-{tx.amount.toLocaleString()}원</span>
      </li>
    );
  };

  const renderIncome = (tx: IncomeTransaction) => (
    <li key={tx.id} className="stmt-tx">
      <span className="stmt-tx__icon stmt-tx__icon--income">
        <img src={icon('money-income.svg')} alt="" />
      </span>
      <span className="stmt-tx__text">
        <span className="stmt-tx__name">{tx.source}</span>
        <span className="stmt-tx__sub">입금</span>
      </span>
      <span className="stmt-tx__amount is-in">+{tx.amount.toLocaleString()}원</span>
    </li>
  );

  const subHead = (label: string, onBack: () => void) => (
    <div className="stmt-subhead">
      <button type="button" aria-label="뒤로" onClick={onBack}>
        <img src={icon('chevron-right-thin.svg')} alt="" className="is-flip" />
      </button>
      <h3>{label}</h3>
    </div>
  );

  const verb = isCurrent ? '쓰는 중' : '썼어요';
  const diffText =
    monthDiff === null ? null : monthDiff >= 0 ? (
      <>
        지난달보다 <strong>{monthDiff.toLocaleString()}원 덜</strong> {verb}
      </>
    ) : (
      <>
        지난달보다 <strong className="is-more">{(-monthDiff).toLocaleString()}원 더</strong> {verb}
      </>
    );

  return (
    <div className={`statement-sheet__body${className ? ` ${className}` : ''}`} ref={bodyRef} onScroll={full ? onBodyScroll : undefined}>
      {view === 'history' && (
        <>
          <div className="stmt-sticky" ref={stickyRef}>
            {classic ? (
              <div className="stmt-classic__head">
                <span className="stmt-classic__month">{month + 1}월</span>
                <p className="stmt-classic__total">{total.toLocaleString()}원</p>
                <p className="stmt-classic__caption">
                  {isCurrent ? (
                    <>
                      이번 달 <strong>{TOP_CATEGORY.label}</strong>에서 가장 많이 썼어요
                    </>
                  ) : total > 0 ? (
                    `${month + 1}월 지출 총액이에요`
                  ) : (
                    '이 달은 기록된 지출이 없어요'
                  )}
                </p>
              </div>
            ) : full ? (
              <>
                <div className="stmt-head stmt-head--full">
                  <div className="stmt-head__title">
                    <button type="button" aria-label="이전 달" disabled={month === 0} onClick={() => changeMonth(-1)}>
                      <img src={icon('chevron-right-thin.svg')} alt="" className="is-flip" />
                    </button>
                    <span>{month + 1}월</span>
                    <button type="button" aria-label="다음 달" disabled={month === CURRENT_MONTH} onClick={() => changeMonth(1)}>
                      <img src={icon('chevron-right-thin.svg')} alt="" />
                    </button>
                  </div>
                </div>
                <div className={`stmt-summary-wrap${scrolled ? ' is-hidden' : ''}`}>
                  <div className="stmt-summary" ref={summaryRef}>
                    <div className="stmt-summary__row">
                      <div className="stmt-summary__amounts">
                        <p className="stmt-summary__income">수입 {income.toLocaleString()}원</p>
                        <p className="stmt-summary__expense">지출 {total.toLocaleString()}원</p>
                      </div>
                      <button type="button" className="stmt-classify" onClick={() => setView('category')}>
                        <span className="stmt-classify__bars" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                        </span>
                        소비 분류
                      </button>
                    </div>
                  </div>
                </div>
                <div className="stmt-flow-tabs" role="tablist" aria-label="수입·지출 구분">
                  {FLOW_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={flow === tab.key}
                      className={`stmt-flow-tabs__tab${flow === tab.key ? ' is-active' : ''}`}
                      onClick={() => setFlow(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="stmt-head">
                <h3 className="stmt-head__title">
                  {onOpenExpensePage ? (
                    <button type="button" className="stmt-head__title-link" onClick={onOpenExpensePage}>
                      {month + 1}월 수입·지출
                    </button>
                  ) : (
                    <>{month + 1}월 수입·지출</>
                  )}
                </h3>
                <button
                  type="button"
                  className="stmt-head__more"
                  aria-label={onOpenExpensePage ? '수입·지출 보기' : '월별 소비 분류'}
                  onClick={onOpenExpensePage ?? (() => setView('category'))}
                >
                  <img src={icon('chevron-right-thin.svg')} alt="" />
                </button>
              </div>
            )}
            <div className="stmt-cal" role="grid" aria-label={`${month + 1}월 지출 달력`}>
              <div className="stmt-cal__weekdays" role="row">
                {WEEKDAYS.map((label) => (
                  <span key={label} role="columnheader" className={label === '일' ? 'is-sun' : undefined}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="stmt-cal__window" style={{ height: `${(calendarOpen ? rowCount : 1) * ROW_HEIGHT}px` }}>
                <div
                  className="stmt-cal__grid"
                  style={{ transform: `translateY(${calendarOpen ? 0 : -weekIndex * ROW_HEIGHT}px)` }}
                >
                  {cells.map((cell, i) => {
                    if (cell === null) return <span key={`blank-${i}`} className="stmt-cal__cell" />;
                    const daySum = showExpense ? dayTotals[cell] : undefined;
                    const dayIn = showIncome ? dayIncome[cell] : undefined;
                    const isSelected = cell === selectedDay;
                    const isFuture = isCurrent && cell > TODAY_DAY;
                    const isPayDay = isCurrent && cell === payDay;
                    return (
                      <button
                        key={cell}
                        type="button"
                        role="gridcell"
                        aria-selected={isSelected}
                        className={`stmt-cal__cell stmt-cal__day${isSelected ? ' is-selected' : ''}${
                          isFuture ? ' is-future' : ''
                        }${isCurrent && cell === TODAY_DAY ? ' is-today' : ''}${daySum || dayIn ? ' has-spend' : ''}${i % 7 === 0 ? ' is-sun' : ''}`}
                        onClick={() => selectDay(cell)}
                      >
                        <span className="stmt-cal__num">{cell}</span>
                        <span className="stmt-cal__lines">
                          {dayIn ? <span className="stmt-cal__in">+{dayIn.toLocaleString()}</span> : null}
                          {daySum ? <span className="stmt-cal__out">-{daySum.toLocaleString()}</span> : null}
                          {isPayDay && !daySum ? <span className="stmt-cal__pay">결제일</span> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {full && (
  <button
                  type="button"
                  className="stmt-cal__toggle"
                  aria-expanded={expanded}
                  aria-label={expanded ? '달력 접기' : '달력 펼치기'}
                  onClick={() => setExpanded((value) => !value)}
                >
                  <img src={icon('chevron-down-thin.svg')} alt="" className={expanded ? 'is-open' : ''} />
                </button>
              )}
            </div>
          </div>

          {classic ? (
            <section className="stmt-list stmt-classic__list" aria-label="선택한 날 내역">
              <h3 className="stmt-list__date">
                {month + 1}. {selectedDay}({WEEKDAYS[new Date(2026, month, selectedDay).getDay()]})
              </h3>
              {selectedGroup ? (
                <ul>
                  {selectedGroup.items.map((item) => (item.kind === 'income' ? renderIncome(item.tx) : renderTransaction(item.tx)))}
                </ul>
              ) : (
                <p className="stmt-empty">이 날은 지출 내역이 없어요</p>
              )}
            </section>
          ) : full ? (
            <section className="stmt-list" aria-label="이용 내역">
              {groups.length === 0 ? (
                <p className="stmt-empty">
                  {hasData
                    ? flow === 'income' ? '수입 내역이 없어요' : flow === 'expense' ? '지출 내역이 없어요' : '이용 내역이 없어요'
                    : '이 달은 일별 이용 내역이 없어요'}
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.day} className="stmt-list__group" data-day={group.day}>
                    <h3 className="stmt-list__date">{dayHeading(month, group.day)}</h3>
                    <ul>
                      {group.items.map((item) => (item.kind === 'income' ? renderIncome(item.tx) : renderTransaction(item.tx)))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          ) : (
            <>
              <section className="stmt-check" aria-label="9월 지출 중간 점검">
                <h3 className="stmt-check__title">9월 지출 중간 점검!</h3>
                <p className="stmt-check__sub">
                  {CONSUME_DIFF >= 0 ? '알뜰 모드!' : '폭풍 지출!'} 지난달보다 {Math.abs(CONSUME_DIFF).toLocaleString()}원{' '}
                  {CONSUME_DIFF >= 0 ? '덜' : '더'} 썼어요
                </p>
                <ul className="stmt-check__rings">
                  {SORTED_CATEGORIES.slice(0, 3).map((meta, i) => {
                    const pct = CATEGORY_PERCENTAGES[meta.key];
                    const circumference = 2 * Math.PI * 36;
                    return (
                      <li key={meta.key}>
                        <span className="stmt-check__ring">
                          <svg viewBox="0 0 88 88" aria-hidden="true">
                            <circle className="stmt-check__track" cx="44" cy="44" r="36" />
                            <circle
                              className={`stmt-check__arc${i === 0 ? ' is-top' : ''}`}
                              cx="44"
                              cy="44"
                              r="36"
                              strokeDasharray={`${(circumference * pct) / 100} ${circumference}`}
                              transform="rotate(-90 44 44)"
                            />
                          </svg>
                          <span className="stmt-check__pct">{pct}%</span>
                        </span>
                        <span className={`stmt-check__label${i === 0 ? ' is-top' : ''}`}>{meta.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <button type="button" className="stmt-promo money-tappable" onClick={() => setView('category')}>
                <span className="stmt-promo__text">
                  <span>지난달보다</span>
                  <span>
                    {Math.abs(CONSUME_DIFF).toLocaleString()}원 {CONSUME_DIFF >= 0 ? '덜' : '더'} 썼어요
                  </span>
                </span>
                <svg className="stmt-promo__art" viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="6" y="4" width="36" height="52" rx="7" style={{ fill: 'var(--brand-orange)' }} />
                  <rect x="14" y="13" width="9" height="9" rx="2.5" style={{ fill: 'var(--color-gray-0)' }} />
                  <path d="M36 30h16l3 8H33l3-8Z" style={{ fill: 'var(--color-gray-10)' }} />
                  <ellipse cx="44" cy="46" rx="17" ry="15" style={{ fill: 'var(--color-gray-10)' }} />
                  <text x="44" y="52" textAnchor="middle" fontSize="16" fontWeight="700" style={{ fill: 'var(--color-gray-0)' }}>
                    ₩
                  </text>
                </svg>
              </button>
            </>
          )}
        </>
      )}

      {view === 'category' && (
        <section className="stmt-category" aria-label="월별 소비 분류">
          {subHead('월별 소비 분류', () => setView('history'))}
          {monthNav(true)}
          <p className="stmt-category__total">{total.toLocaleString()}원</p>
          <p className="stmt-category__caption">
            {total === 0 ? '이 달은 기록된 지출이 없어요' : (diffText ?? `${month + 1}월 지출 총액이에요`)}
          </p>
          {total > 0 ? (
            <ul className="stmt-category__list">
              {sortedCategories.map((meta) => {
                const sum = catTotals[meta.key];
                const delta = prevCatTotals ? sum - prevCatTotals[meta.key] : null;
                return (
                  <li key={meta.key}>
                    <button
                      type="button"
                      className="stmt-category__row"
                      onClick={() => {
                        setDetailKey(meta.key);
                        setView('detail');
                        bodyRef.current?.scrollTo({ top: 0 });
                      }}
                    >
                      <span className="stmt-category__head">
                        <span className="stmt-tx__icon" style={{ background: meta.bg }}>
                          <img src={icon(meta.icon)} alt="" />
                        </span>
                        <span className="stmt-category__name">{meta.label}</span>
                        <span className="stmt-category__sum">{sum.toLocaleString()}원</span>
                        <img src={icon('chevron-right-thin.svg')} alt="" className="stmt-category__chev" />
                      </span>
                      <span className="stmt-category__bar" aria-hidden="true">
                        <span style={{ width: `${catPercentages[meta.key]}%`, background: meta.accent }} />
                      </span>
                      <span className="stmt-category__foot">
                        <span>{catPercentages[meta.key]}%</span>
                        {delta === null ? null : delta === 0 ? (
                          <span>지난달과 동일</span>
                        ) : (
                          <span className={delta > 0 ? 'is-up' : 'is-down'}>
                            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString()}원
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="stmt-empty">이 달은 카테고리별 내역이 없어요</p>
          )}
        </section>
      )}

      {view === 'detail' && detailKey && (
        <section className="stmt-category" aria-label="카테고리별 이용 내역">
          {subHead('카테고리별 이용 내역', () => setView('category'))}
          <p className="stmt-detail__label">{CATEGORY_META.find((c) => c.key === detailKey)?.label}</p>
          <p className="stmt-category__total">{catTotals[detailKey].toLocaleString()}원</p>
          <div className="stmt-detail__list">
            {expenseTxs
              .filter((tx) => tx.category === detailKey && (!isCurrent || tx.day <= TODAY_DAY))
              .sort((a, b) => b.day - a.day)
              .map((tx) => (
                <div key={tx.id} className="stmt-list__group">
                  <h3 className="stmt-list__date">{dayGroupLabel(month, tx.day)}</h3>
                  <ul>{renderTransaction(tx)}</ul>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
