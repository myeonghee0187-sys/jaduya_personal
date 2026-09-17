import { useEffect, useMemo, useRef, useState } from 'react';
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
 * 목록 보기 — 캘린더 보기와 같은 월을 공유하며, 전체/수입/지출/이체 + 카테고리 필터로
 * 걸러 그 달의 거래를 날짜별로(최근 날짜부터) 훑어본다. 날짜 그룹 헤더는 눌러서
 * 접고 펼 수 있다.
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

const SORT_OPTIONS = ['최신순', '오래된순', '금액 많은순', '금액 적은순'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

/* 목록 보기의 카테고리 칩 노출 순서 — 가로 스와이프 한 줄(money-cat-swiper와 같은
 * 패턴)로 전부 보여주니 숨김 없이 전체 카테고리를 이 순서대로 나열한다. */
const CATEGORY_CHIP_ORDER: CategoryKey[] = ['food', 'life', 'transport', 'shopping', 'culture', 'etc'];

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 목록 날짜 그룹 헤더 — "오늘/어제" 상대 표현 없이 항상 "N월 N일 (요일)"로 보여준다. */
function dayGroupLabel(year: number, month: number, day: number): string {
  const weekday = WEEKDAY_LABELS[new Date(year, month, day).getDay()];
  return `${month + 1}월 ${day}일 (${weekday})`;
}

interface IncomeExpenseSectionProps {
  onNotice: (message: string) => void;
  /** "이번 달" 탭의 "소비 분석 전체 보기"처럼, 이 탭에 들어오자마자 목록 보기로 열고
   * 싶을 때만 넘긴다 — 기본은 캘린더 보기(레퍼런스 기본값)를 그대로 쓴다. */
  initialView?: ViewMode;
}

export function IncomeExpenseSection({ onNotice, initialView = 'calendar' }: IncomeExpenseSectionProps) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 8, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(TODAY_DAY);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | 'all'>('all');
  /* 목록 보기 — 날짜 그룹 헤더를 눌러 접었다 펼 수 있다(기본은 전부 펼침) */
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(() => new Set());
  /* 목록 보기 정렬 — 최신/오래된순은 날짜 그룹을 그대로 두고 순서만 뒤집고,
   * 금액순은 날짜 구분 없이 평평한 목록으로 보여준다(커뮤니티 정렬 드롭다운과 같은 구조). */
  const [sortOption, setSortOption] = useState<SortOption>('최신순');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [sortOpen]);

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

  const toggleDayCollapsed = (day: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const categoryChips = CATEGORY_CHIP_ORDER.map((key) => CATEGORY_META.find((c) => c.key === key)).filter(
    (c): c is (typeof CATEGORY_META)[number] => c !== undefined,
  );

  /* 캘린더에서 날짜를 고르면 그날 내역을 영수증처럼 아래 펼쳐 보여준다 — 고정비 탭의
   * 날짜 선택 → 상세 목록 패턴(money-fixed-detail)과 같은 구조. */
  const selectedDayItems = useMemo(() => {
    if (!isMockMonth || selectedDay === null) return [];
    return flowItemsGroupedByDay((t) => t.day === selectedDay)[0]?.items ?? [];
  }, [isMockMonth, selectedDay]);

  /* 목록 보기 — 현재 달(캘린더 보기와 같은 월)의 필터된 항목을 날짜별로 묶는다.
   * 실데이터가 있는 달(9월)이 아니면 정직하게 빈 목록을 보여준다. */
  const listGroups = useMemo(
    () =>
      isMockMonth
        ? flowItemsGroupedByDay((t) => {
            if (typeFilter !== 'all' && t.type !== typeFilter) return false;
            if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
            return true;
          })
        : [],
    [isMockMonth, typeFilter, categoryFilter],
  );
  const isAmountSort = sortOption === '금액 많은순' || sortOption === '금액 적은순';

  /* 최신/오래된순 — listGroups 는 이미 최근 날짜순이니 오래된순만 뒤집는다. */
  const sortedGroups = useMemo(
    () => (sortOption === '오래된순' ? [...listGroups].reverse() : listGroups),
    [listGroups, sortOption],
  );

  /* 금액순 — 날짜 구분을 없애고 모든 항목을 금액 기준으로 한 줄로 편다. */
  const sortedFlatItems = useMemo(() => {
    if (!isAmountSort) return [];
    const items = listGroups.flatMap((group) => group.items);
    return [...items].sort((a, b) => (sortOption === '금액 많은순' ? b.amount - a.amount : a.amount - b.amount));
  }, [listGroups, sortOption, isAmountSort]);

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
              <img src={icon('chevron-right-gray.svg')} alt="" className="is-prev" />
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
              <img src={icon('chevron-right-gray.svg')} alt="" />
            </button>
          </div>

          <div className="flow-summary">
            <div className="flow-summary__col">
              <span className="flow-summary__body">
                <span className="flow-summary__label">이번 달 수입</span>
                <span className="flow-summary__value flow-summary__value--income">
                  +{TOTAL_INCOME.toLocaleString()}원
                </span>
              </span>
            </div>
            <span className="flow-summary__divider" aria-hidden="true" />
            <div className="flow-summary__col">
              <span className="flow-summary__body">
                <span className="flow-summary__label">이번 달 지출</span>
                <span className="flow-summary__value flow-summary__value--expense">
                  -{TOTAL_EXPENSE.toLocaleString()}원
                </span>
              </span>
            </div>
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
                  {(['income', 'expense', 'transfer'] as FlowType[]).map((type) => {
                    const items = selectedDayItems.filter((item) => item.type === type);
                    if (items.length === 0) return null;
                    const groupTotal = items.reduce((sum, item) => sum + item.amount, 0);
                    return (
                      <div key={type} className={`flow-receipt__group flow-receipt__group--${type}`}>
                        <div className="flow-receipt__group-head">
                          <span className="flow-receipt__group-label">
                            {typeGroupLabel(type)} {items.length}건
                          </span>
                          <span className="flow-receipt__group-total">
                            {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
                            {groupTotal.toLocaleString()}원
                          </span>
                        </div>
                        {items.map((item, index) => (
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
                    );
                  })}
                </div>
              )}
            </section>
          )}

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
          <div className="flow-list-toolbar">
            <div className="flow-list-toolbar__month">
              <button
                type="button"
                className="flow-month-nav__arrow"
                aria-label="이전 달"
                onClick={() => goCalendarMonth(-1)}
              >
                <img src={icon('chevron-right-gray.svg')} alt="" className="is-prev" />
              </button>
              <button
                type="button"
                className="flow-list-toolbar__month-btn"
                onClick={() => onNotice('월 선택 기능은 준비 중이에요.')}
              >
                {year}년 {month + 1}월
                <img src={icon('chevron-down-thin.svg')} alt="" />
              </button>
              <button
                type="button"
                className="flow-month-nav__arrow"
                aria-label="다음 달"
                onClick={() => goCalendarMonth(1)}
              >
                <img src={icon('chevron-right-gray.svg')} alt="" />
              </button>
            </div>
            <div className="flow-list-toolbar__actions">
              <button
                type="button"
                className="flow-list-toolbar__icon-btn"
                aria-label="검색"
                onClick={() => onNotice('검색 기능은 준비 중이에요.')}
              >
                <img src={icon('community-search.svg')} alt="" />
              </button>
              <div className="flow-sort" ref={sortRef}>
                <button
                  type="button"
                  className="flow-list-toolbar__icon-btn"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  aria-label="정렬"
                  onClick={() => setSortOpen((open) => !open)}
                >
                  <img src={icon('community-filter.svg')} alt="" />
                </button>
                <ul className="flow-sort__list" role="listbox" hidden={!sortOpen}>
                  {SORT_OPTIONS.map((option) => (
                    <li key={option} role="option" aria-selected={option === sortOption}>
                      <button
                        type="button"
                        className={option === sortOption ? 'is-selected' : undefined}
                        onClick={() => {
                          setSortOption(option);
                          setSortOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

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

          <div className="flow-category-chips">
            {categoryChips.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={categoryFilter === c.key}
                className={`flow-category-chip${categoryFilter === c.key ? ' is-active' : ''}`}
                style={{ background: `color-mix(in srgb, ${c.color} 14%, white)` }}
                onClick={() => setCategoryFilter((prev) => (prev === c.key ? 'all' : c.key))}
              >
                <img src={icon(c.icon)} alt="" />
                {c.label}
              </button>
            ))}
          </div>

          <div className="flow-list">
            {listGroups.length === 0 ? (
              <p className="flow-list__empty">조건에 맞는 내역이 없어요.</p>
            ) : isAmountSort ? (
              sortedFlatItems.map((t) => (
                <FlowRow
                  key={t.id}
                  item={t}
                  dateLabel={dayGroupLabel(year, month, t.day)}
                  onClick={() => setSelectedItemId(t.id)}
                />
              ))
            ) : (
              sortedGroups.map((group) => {
                const collapsed = collapsedDays.has(group.day);
                return (
                  <div key={group.day} className="flow-day-group">
                    <button
                      type="button"
                      className="flow-day-group__header"
                      aria-expanded={!collapsed}
                      onClick={() => toggleDayCollapsed(group.day)}
                    >
                      <span className="flow-day-group__label">{dayGroupLabel(year, month, group.day)}</span>
                      <img
                        className={`flow-day-group__chevron${collapsed ? '' : ' is-open'}`}
                        src={icon('chevron-down-thin.svg')}
                        alt=""
                      />
                    </button>
                    {!collapsed &&
                      group.items.map((t) => (
                        <FlowRow key={t.id} item={t} onClick={() => setSelectedItemId(t.id)} />
                      ))}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <button
        type="button"
        className="flow-list__add"
        onClick={() => onNotice('수입·지출 직접 추가 기능은 준비 중이에요.')}
      >
        + 수입·지출 직접 추가하기
      </button>

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

/** 선택한 날짜 상세의 그룹 헤더 라벨 — "수입 N건"/"지출 N건"/"이체 N건". */
function typeGroupLabel(type: FlowType): string {
  if (type === 'income') return '수입';
  if (type === 'expense') return '지출';
  return '이체';
}

interface FlowRowProps {
  item: MoneyFlowItem;
  onClick: () => void;
  /** 금액순 정렬처럼 날짜 그룹 헤더 없이 평평하게 보여줄 때만 날짜를 같이 표시한다 */
  dateLabel?: string;
}

function FlowRow({ item, onClick, dateLabel }: FlowRowProps) {
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
        <span className="flow-row__category">
          {typeLabel(item)}
          {dateLabel ? ` · ${dateLabel}` : ''}
        </span>
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
