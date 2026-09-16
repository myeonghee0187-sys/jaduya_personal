import { useMemo, useState } from 'react';
import { icon } from '../../lib/asset';
import { IncomeExpenseCalendar } from './IncomeExpenseCalendar';
import {
  CATEGORY_META,
  CONSUME_CHANGE_PERCENT,
  CONSUME_DIFF,
  TODAY_DAY,
  TOTAL_EXPENSE,
  TOTAL_INCOME,
  dayFlowTotals,
  findFlowItem,
  flowItemsGroupedByDay,
  formatFullDate,
  transactionApprovalNumber,
  transactionPaymentMethod,
  transactionTime,
} from '../../data/moneyTransactions';
import type { CategoryKey, FlowType, MoneyFlowItem } from '../../data/moneyTransactions';

/* JADUYA — 돈관리 > 수입·지출 탭. 레퍼런스(캘린더/목록 두 화면)를 그대로 옮긴다.
 *
 * 캘린더 보기 — 날짜별 수입/지출 금액을 한눈에, 날짜를 고르면 그날 내역을 영수증
 * 카드로 펼쳐 보여준다(고정비 탭의 날짜 선택 → 상세 목록과 같은 구조).
 * 목록 보기 — 날짜 단위로 이동하며, 전체/수입/지출/이체 + 카테고리 필터로 걸러
 * 최근 날짜부터 거래를 훑어본다.
 *
 * 실데이터가 있는 달은 2026년 9월(TOTAL_EXPENSE 등과 같은 원본, moneyTransactions.ts)
 * 하나뿐이다 — 고정비 탭과 같은 원칙으로, 다른 달로 이동하면 정직하게 빈 상태를 보여준다. */

type ViewMode = 'calendar' | 'list';
type TypeFilter = 'all' | FlowType;

const TYPE_FILTER_LABEL: Record<TypeFilter, string> = {
  all: '전체',
  income: '수입',
  expense: '지출',
  transfer: '이체',
};

interface IncomeExpenseSectionProps {
  onNotice: (message: string) => void;
}

export function IncomeExpenseSection({ onNotice }: IncomeExpenseSectionProps) {
  const [view, setView] = useState<ViewMode>('calendar');
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 8, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(TODAY_DAY);
  /* 목록 보기의 날짜 이동 기준 — 이 날짜의 요약 칩을 보여주고, 목록은 이 날짜부터
   * 과거 순으로 이어진다(레퍼런스: 9/20 선택 → 9/20, 9/19 순으로 계속 이어짐). */
  const [listDay, setListDay] = useState(TODAY_DAY);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | 'all'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const isMockMonth = year === 2026 && month === 8;

  const dayTotals = useMemo(() => {
    const map = new Map<number, { income: number; expense: number }>();
    if (!isMockMonth) return map;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const totals = dayFlowTotals(day);
      if (totals.income > 0 || totals.expense > 0) map.set(day, totals);
    }
    return map;
  }, [isMockMonth, year, month]);

  const goCalendarMonth = (delta: number) => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  /* 캘린더에서 날짜를 고르면 그날 내역을 영수증처럼 아래 펼쳐 보여준다 — 고정비 탭의
   * 날짜 선택 → 상세 목록 패턴(money-fixed-detail)과 같은 구조. */
  const selectedDayItems = useMemo(() => {
    if (!isMockMonth || selectedDay === null) return [];
    return flowItemsGroupedByDay((t) => t.day === selectedDay)[0]?.items ?? [];
  }, [isMockMonth, selectedDay]);

  /* 목록 보기 — 필터가 적용된 항목을 listDay 이전(과거 방향)만 남기고 날짜별로 묶는다. */
  const listGroups = useMemo(
    () =>
      flowItemsGroupedByDay((t) => {
        if (t.day > listDay) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        return true;
      }),
    [listDay, typeFilter, categoryFilter],
  );
  const listDayTotals = dayFlowTotals(listDay);
  const selectedItem = selectedItemId ? findFlowItem(selectedItemId) : undefined;

  return (
    <>
      <div className="flow-toggle" role="tablist" aria-label="보기 방식">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'calendar'}
          className={`flow-toggle__btn${view === 'calendar' ? ' is-active' : ''}`}
          onClick={() => setView('calendar')}
        >
          캘린더
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'list'}
          className={`flow-toggle__btn${view === 'list' ? ' is-active' : ''}`}
          onClick={() => setView('list')}
        >
          목록
        </button>
      </div>

      {view === 'calendar' ? (
        <>
          <div className="flow-month-nav">
            <button
              type="button"
              className="flow-month-nav__arrow"
              aria-label="이전 달"
              onClick={() => goCalendarMonth(-1)}
            >
              <img src={icon('chevron-right-sm.svg')} alt="" className="is-prev" />
            </button>
            <span className="flow-month-nav__label">
              {year}년 {month + 1}월
            </span>
            <button
              type="button"
              className="flow-month-nav__arrow"
              aria-label="다음 달"
              onClick={() => goCalendarMonth(1)}
            >
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </button>
          </div>

          <IncomeExpenseCalendar
            year={year}
            month={month}
            dayTotals={dayTotals}
            selectedDay={selectedDay}
            todayDay={isMockMonth ? TODAY_DAY : null}
            onSelectDay={(day) => setSelectedDay(day)}
          />

          {selectedDay !== null && (
            <section className="flow-receipt">
              <h2 className="flow-receipt__heading">
                {month + 1}월 {selectedDay}일
              </h2>
              {selectedDayItems.length === 0 ? (
                <p className="flow-receipt__empty">내역이 없어요.</p>
              ) : (
                <div className="flow-receipt__paper">
                  {selectedDayItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flow-receipt__item money-tappable"
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      {index > 0 && <span className="flow-receipt__divider" aria-hidden="true" />}
                      <span className="flow-receipt__icon">
                        <img src={icon(item.icon)} alt="" />
                      </span>
                      <span className="flow-receipt__info">
                        <span className="flow-receipt__name">{item.name}</span>
                        <span className="flow-receipt__meta">
                          {typeLabel(item)} · {transactionTime(item.id)}
                        </span>
                      </span>
                      <span className={`flow-receipt__amount flow-receipt__amount--${item.type}`}>
                        {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}
                        {item.amount.toLocaleString()}원
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="flow-summary-cards">
            <div className="flow-summary-card flow-summary-card--income">
              <span className="flow-summary-card__icon">
                <img src={icon('money-income.svg')} alt="" />
              </span>
              <span className="flow-summary-card__label">이번 달 수입</span>
              <span className="flow-summary-card__value">+{TOTAL_INCOME.toLocaleString()}원</span>
            </div>
            <div className="flow-summary-card flow-summary-card--expense">
              <span className="flow-summary-card__icon">
                <img src={icon('money-spend.svg')} alt="" />
              </span>
              <span className="flow-summary-card__label">이번 달 지출</span>
              <span className="flow-summary-card__value">-{TOTAL_EXPENSE.toLocaleString()}원</span>
            </div>
          </div>

          {CONSUME_DIFF !== 0 && (
            <p className="flow-insight">
              <img
                src={icon('arrow-down.svg')}
                alt=""
                className={CONSUME_DIFF < 0 ? 'is-flipped' : ''}
              />
              {`지난달보다 지출이 ${Math.abs(CONSUME_DIFF).toLocaleString()}원(${CONSUME_CHANGE_PERCENT}%) ${
                CONSUME_DIFF < 0 ? '더 늘었어요' : '줄었어요'
              }.`}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flow-date-nav">
            <button
              type="button"
              className="flow-date-nav__arrow"
              aria-label="이전 날짜"
              onClick={() => setListDay((d) => Math.max(1, d - 1))}
            >
              <img src={icon('chevron-right-sm.svg')} alt="" className="is-prev" />
            </button>
            <span className="flow-date-nav__label">
              {year}년 {month + 1}월 {listDay}일
            </span>
            <button
              type="button"
              className="flow-date-nav__arrow"
              aria-label="다음 날짜"
              onClick={() => setListDay((d) => Math.min(new Date(year, month + 1, 0).getDate(), d + 1))}
            >
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </button>
          </div>

          <div className="flow-filter">
            <div className="flow-filter__pills" role="tablist" aria-label="구분 필터">
              {(Object.keys(TYPE_FILTER_LABEL) as TypeFilter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === key}
                  className={`flow-filter__pill${typeFilter === key ? ' is-active' : ''}`}
                  onClick={() => setTypeFilter(key)}
                >
                  {TYPE_FILTER_LABEL[key]}
                </button>
              ))}
            </div>
            <label className="flow-filter__category">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryKey | 'all')}
                aria-label="카테고리 필터"
              >
                <option value="all">카테고리</option>
                {CATEGORY_META.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <img src={icon('chevron-down-thin.svg')} alt="" aria-hidden="true" />
            </label>
          </div>

          <div className="flow-day-summary">
            <span className="flow-day-summary__chip flow-day-summary__chip--income">
              <img src={icon('money-income.svg')} alt="" />
              수입
              <strong>{listDayTotals.income.toLocaleString()}원</strong>
            </span>
            <span className="flow-day-summary__chip flow-day-summary__chip--expense">
              <img src={icon('money-spend.svg')} alt="" />
              지출
              <strong>{listDayTotals.expense.toLocaleString()}원</strong>
            </span>
          </div>

          <div className="flow-list">
            {listGroups.length === 0 ? (
              <p className="flow-list__empty">조건에 맞는 내역이 없어요.</p>
            ) : (
              listGroups.map((group) => (
                <div key={group.day} className="flow-day-group">
                  {group.day !== listDay && (
                    <p className="flow-day-group__label">
                      {group.label} · 총 {group.items.length}건
                      {group.expense > 0 && ` -${group.expense.toLocaleString()}원`}
                      {group.income > 0 && ` +${group.income.toLocaleString()}원`}
                    </p>
                  )}
                  {group.items.map((t) => (
                    <FlowRow key={t.id} item={t} onClick={() => setSelectedItemId(t.id)} />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {selectedItem && (
        <FlowItemDetail item={selectedItem} onClose={() => setSelectedItemId(null)} onNotice={onNotice} />
      )}
    </>
  );
}

function categoryLabel(category: CategoryKey | null): string {
  if (!category) return '';
  return CATEGORY_META.find((c) => c.key === category)?.label ?? '기타';
}

function typeLabel(item: MoneyFlowItem): string {
  if (item.type === 'expense') return categoryLabel(item.category);
  if (item.type === 'income') return '수입';
  return '이체';
}

function FlowRow({ item, onClick }: { item: MoneyFlowItem; onClick: () => void }) {
  const meta = item.category ? CATEGORY_META.find((c) => c.key === item.category) : undefined;
  const color = item.type === 'income' ? '#2f6fd6' : item.type === 'transfer' ? 'var(--text-tertiary)' : meta?.color;
  return (
    <button type="button" className="flow-row money-tappable" onClick={onClick}>
      <span
        className="flow-row__badge"
        style={color ? { background: `color-mix(in srgb, ${color} 18%, white)` } : undefined}
      >
        <img src={icon(item.icon)} alt="" />
      </span>
      <span className="flow-row__text">
        <span className="flow-row__name">{item.name}</span>
        <span className="flow-row__category">{typeLabel(item)}</span>
      </span>
      <span className={`flow-row__amount flow-row__amount--${item.type}`}>
        {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}
        {item.amount.toLocaleString()}원
      </span>
      <span className="flow-row__time">{transactionTime(item.id)}</span>
    </button>
  );
}

interface FlowItemDetailProps {
  item: MoneyFlowItem;
  onClose: () => void;
  onNotice: (message: string) => void;
}

/* 거래 상세 — 소비 탭 영수증의 TransactionDetail 과 같은 결로, 종류(수입/지출/이체)에
 * 맞춰 카테고리 행만 있고 없고를 가른다. */
function FlowItemDetail({ item, onClose, onNotice }: FlowItemDetailProps) {
  const meta = item.category ? CATEGORY_META.find((c) => c.key === item.category) : undefined;
  const color = item.type === 'income' ? '#2f6fd6' : item.type === 'transfer' ? 'var(--text-tertiary)' : meta?.color;
  return (
    <div className="flow-detail" role="dialog" aria-modal="true" aria-label={`${item.name} 상세`}>
      <div className="flow-detail__dim" onClick={onClose} aria-hidden="true" />
      <div className="flow-detail__sheet">
        <div className="flow-detail__grip">
          <span />
        </div>
        <button type="button" className="flow-detail__close" aria-label="닫기" onClick={onClose}>
          <img src={icon('sheet-close.svg')} alt="" />
        </button>
        <span className="flow-detail__badge" style={color ? { background: `color-mix(in srgb, ${color} 18%, white)` } : undefined}>
          <img src={icon(item.icon)} alt="" />
        </span>
        <p className="flow-detail__name">{item.name}</p>
        <p className={`flow-detail__amount flow-detail__amount--${item.type}`}>
          {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}
          {item.amount.toLocaleString()}원
        </p>
        <p className="flow-detail__datetime">{`${formatFullDate(item.day)} · ${transactionTime(item.id)}`}</p>

        <div className="flow-detail__divider" role="presentation" />

        <dl className="flow-detail__list">
          <div className="flow-detail__row">
            <dt>구분</dt>
            <dd>{typeLabel(item)}</dd>
          </div>
          {item.type !== 'transfer' && (
            <div className="flow-detail__row">
              <dt>결제수단</dt>
              <dd>{transactionPaymentMethod(item.id)}</dd>
            </div>
          )}
          <div className="flow-detail__row">
            <dt>승인번호</dt>
            <dd>{transactionApprovalNumber(item.id)}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="flow-detail__edit auth-button"
          onClick={() => onNotice('내역 수정 기능은 준비 중이에요.')}
        >
          수정하기
        </button>
      </div>
    </div>
  );
}

export default IncomeExpenseSection;
