import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { icon } from '../../lib/asset';
import { useElasticDragScroll } from '../../hooks/useElasticDragScroll';
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
type SortSelection = 'all' | SortOption;

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

/* 목록 보기(날짜 그룹) — "전체" 등 필터를 걸지 않으면 그 달 모든 날짜가 한 번에 펼쳐져
 * 목록이 너무 길고 빽빽해 보였다. 최근 3일치만 펼쳐서 먼저 보여주고, 나머지는 "더보기"를
 * 눌러야 나타나며 접힌 채로 시작한다(눌러서 펼 수 있는 건 그대로). */
const LIST_GROUPS_PREVIEW_COUNT = 3;

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 목록 날짜 그룹 헤더 — "오늘/어제" 상대 표현 없이 항상 "N월 N일 (요일)"로 보여준다. */
function dayGroupLabel(year: number, month: number, day: number): string {
  const weekday = WEEKDAY_LABELS[new Date(year, month, day).getDay()];
  return `${month + 1}월 ${day}일 (${weekday})`;
}

/* flow-summary 아이콘 배지 — arrow-down.svg 와 같은 경로를 인라인 SVG 로 그린다. <img> 로
 * 불러오면 stroke="currentColor" 가 그 이미지 자체의 기본색(검정)으로 굳어 배지 배경 위에서
 * 안 보인다 — 인라인 SVG 라야 부모(.flow-summary__icon, color:#fff)의 색을 그대로 받는다. */
function TrendArrowIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      style={direction === 'up' ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path
        d="M10 4V16M10 16L5 11M10 16l5-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  /* 목록 보기 — 날짜 그룹 헤더를 눌러 접었다 펼 수 있다. 미리보기(처음 3개)는 기본
   * 펼침, "더보기"로 나타나는 나머지는 기본 접힘이라 — 이 Set은 "그 그룹의 기본값을
   * 사용자가 뒤집었는지"만 기록한다(실제 펼침 여부는 아래 listGroups 렌더링에서 index
   * 기준 기본값과 XOR 해서 계산한다). */
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(() => new Set());
  /* "더보기"를 눌렀는지 — 필터/월이 바뀌면 다시 미리보기 상태로 되돌린다. */
  const [showAllGroups, setShowAllGroups] = useState(false);
  /* 목록 보기 정렬 — 최신/오래된순은 날짜 그룹을 그대로 두고 순서만 뒤집고,
   * 금액순은 날짜 구분 없이 평평한 목록으로 보여준다(커뮤니티 정렬 드롭다운과 같은 구조).
   * 아무것도 고르지 않은 초기 상태는 'all' — 버튼에 "전체"로 표시되고 동작은 최신순과
   * 같다(listGroups 가 이미 최근 날짜순이라 별도 분기가 필요 없다). 옵션을 고르면 그 값으로
   * 바뀌고 버튼 글자도 월 선택 드롭다운(money-budget__month-btn)처럼 선택한 옵션으로 바뀐다. */
  const [sortOption, setSortOption] = useState<SortSelection>('all');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  /* 카테고리 칩 줄은 overflow-x: auto 만으로는 터치가 없는 웹/태블릿(마우스)에서 스크롤할
   * 방법이 없다 — 클릭+드래그로도 넘길 수 있게 한다(스크롤바는 계속 숨김 유지). */
  const categoryDragScroll = useElasticDragScroll<HTMLDivElement>();

  useEffect(() => {
    if (!sortOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [sortOpen]);

  /* 필터·정렬·월이 바뀌면 완전히 다른 목록이니 "더보기" 이전의 미리보기 상태로 되돌린다. */
  useEffect(() => {
    setShowAllGroups(false);
    setCollapsedDays(new Set());
  }, [typeFilter, categoryFilter, sortOption, calendarDate]);

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
            <div className="flow-summary__col flow-summary__col--income">
              <span className="flow-summary__icon flow-summary__icon--income">
                <TrendArrowIcon direction="up" />
              </span>
              <span className="flow-summary__body">
                <span className="flow-summary__label">이번 달 수입</span>
                <span className="flow-summary__value flow-summary__value--income">
                  +{TOTAL_INCOME.toLocaleString()}원
                </span>
              </span>
            </div>
            <span className="flow-summary__divider" aria-hidden="true" />
            <div className="flow-summary__col flow-summary__col--expense">
              <span className="flow-summary__icon flow-summary__icon--expense">
                <TrendArrowIcon direction="down" />
              </span>
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
            <p className={`flow-insight${CONSUME_DIFF < 0 ? ' flow-insight--up' : ' flow-insight--down'}`}>
              <span className="flow-insight__icon">
                <TrendArrowIcon direction={CONSUME_DIFF < 0 ? 'up' : 'down'} />
              </span>
              <span className="flow-insight__text">
                {`지난달보다 지출이 ${Math.abs(CONSUME_DIFF).toLocaleString()}원(${CONSUME_CHANGE_PERCENT}%) ${
                  CONSUME_DIFF < 0 ? '더 늘었어요' : '줄었어요'
                }.`}
              </span>
              <img className="flow-insight__chevron" src={icon('chevron-right-gray.svg')} alt="" />
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
              <span className="flow-list-toolbar__month-label">
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
          </div>

          <div className="flow-filter-row">
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

            <div className="flow-sort" ref={sortRef}>
              <button
                type="button"
                className="flow-sort__trigger"
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                aria-label="정렬"
                onClick={() => setSortOpen((open) => !open)}
              >
                {sortOption === 'all' ? '전체' : sortOption}
                <img
                  src={icon('chevron-down-thin.svg')}
                  alt=""
                  className={sortOpen ? 'is-open' : ''}
                />
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

          <div className="flow-category-chips" ref={categoryDragScroll.ref} {...categoryDragScroll.dragProps}>
            {categoryChips.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={categoryFilter === c.key}
                className={`flow-category-chip${categoryFilter === c.key ? ' is-active' : ''}`}
                /* 구분 필터(전체/수입/지출/이체)의 활성색은 계속 --brand-primary — 이 칩은
                 * 카테고리 축이라 선택했을 때 그 카테고리 자신의 색(c.color)으로 테두리·글자가
                 * 바뀌게 한다. 두 필터가 같은 빨강으로 겹쳐 보이던 걸 색으로 구분한다. */
                style={{ background: c.bg, '--chip-accent': c.color } as CSSProperties}
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
              <>
                {(showAllGroups ? sortedGroups : sortedGroups.slice(0, LIST_GROUPS_PREVIEW_COUNT)).map(
                  (group, index) => {
                    /* 미리보기(처음 3개)는 기본 펼침, "더보기"로 나온 나머지(index >= 3)는
                     * 기본 접힘 — collapsedDays 는 "이 그룹만 기본값을 뒤집었는지"라 그
                     * 기본값과 XOR 해서 실제 펼침 여부를 정한다. */
                    const isDefaultCollapsed = index >= LIST_GROUPS_PREVIEW_COUNT;
                    const collapsed = collapsedDays.has(group.day) ? !isDefaultCollapsed : isDefaultCollapsed;
                    /* 그 날의 수입 - 지출 순액 — 이체는 수입/지출 어느 쪽에도 더하지 않는 원칙
                     * (moneyTransactions.ts dayFlowTotals) 그대로, 이체만 있는 날은 순액이 0이라
                     * 아무 것도 표시하지 않는다(근거 없는 금액을 만들지 않는다). */
                    const net = group.income - group.expense;
                    return (
                      <div key={group.day} className="flow-day-group">
                        <button
                          type="button"
                          className="flow-day-group__header"
                          aria-expanded={!collapsed}
                          onClick={() => toggleDayCollapsed(group.day)}
                        >
                          <span className="flow-day-group__label">{dayGroupLabel(year, month, group.day)}</span>
                          {net !== 0 && (
                            <span
                              className={`flow-day-group__total${net > 0 ? ' flow-day-group__total--income' : ' flow-day-group__total--expense'}`}
                            >
                              {net > 0 ? '+' : '-'}
                              {Math.abs(net).toLocaleString()}원
                            </span>
                          )}
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
                  },
                )}
                {!showAllGroups && sortedGroups.length > LIST_GROUPS_PREVIEW_COUNT && (
                  <button type="button" className="flow-list__more" onClick={() => setShowAllGroups(true)}>
                    더보기
                    <img src={icon('chevron-down-thin.svg')} alt="" />
                  </button>
                )}
              </>
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
  const color = item.type === 'income' ? 'var(--category-life)' : item.type === 'transfer' ? 'var(--text-tertiary)' : meta?.color;
  /* 카테고리 뱃지 배경은 카테고리 전용 보조 배경 토큰(meta.bg)을 그대로 쓴다 — 수입/이체는
   * 카테고리가 없어 자기 색을 18% 로 옅게 섞은 배경을 그대로 유지한다. */
  const bg = item.type === 'expense' && meta ? meta.bg : color ? `color-mix(in srgb, ${color} 18%, white)` : undefined;
  return (
    <button type="button" className="flow-row money-tappable" onClick={onClick}>
      <span className="flow-row__badge" style={bg ? { background: bg } : undefined}>
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
  const color = item.type === 'income' ? 'var(--category-life)' : item.type === 'transfer' ? 'var(--text-tertiary)' : meta?.color;
  /* 카테고리 뱃지 배경은 카테고리 전용 보조 배경 토큰(meta.bg)을 그대로 쓴다 — 수입/이체는
   * 카테고리가 없어 자기 색을 18% 로 옅게 섞은 배경을 그대로 유지한다. */
  const bg = item.type === 'expense' && meta ? meta.bg : color ? `color-mix(in srgb, ${color} 18%, white)` : undefined;
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
        <span className="flow-detail__badge" style={bg ? { background: bg } : undefined}>
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
