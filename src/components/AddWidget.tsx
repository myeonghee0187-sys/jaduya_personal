import { useEffect, useMemo, useState } from 'react';
import { icon } from '../lib/asset';
import {
  MAX_ROW_MEDIUM,
  MAX_ROW_SMALL,
  MAX_WIDGET,
  WIDGET_CATALOG,
  widgetWeight,
} from '../data/widgetCatalog';
import { layoutCatalogEntries } from '../data/personaWidgets';
import type { PersonaWidgetLayout } from '../data/personaWidgets';
import { useDraftSelection } from '../hooks/useDraftSelection';
import type { WidgetCategory, WidgetSize } from '../types';
import { StatusBar } from './StatusBar';
import { WidgetCard } from './WidgetCard';

/** 추천 위젯 그룹 — Figma add_widget 의 소제목 구성 그대로 */
const RECOMMEND_GROUPS: { title: string; ids: string[] }[] = [
  { title: '지출 분석', ids: ['spend-analysis'] },
  { title: '혜택', ids: ['benefit'] },
  { title: '오늘 할 일', ids: ['todo-s', 'todo-m'] },
  { title: '청소', ids: ['clean-s', 'clean-m'] },
];

/** 같은 위젯의 크기 형제(오늘 할 일 small/medium 등) — id → 나머지 형제 id 목록.
 * RECOMMEND_GROUPS 자체가 "같은 개념, 다른 크기"를 묶어둔 유일한 곳이라 그대로 재사용한다. */
const SIZE_VARIANT_SIBLINGS = new Map<string, string[]>(
  RECOMMEND_GROUPS.filter((g) => g.ids.length > 1).flatMap((g) =>
    g.ids.map((id) => [id, g.ids.filter((other) => other !== id)] as const),
  ),
);

/** 카드 크기가 뒤섞여 있으면 눈에 잘 안 띄어서, 같은 카테고리 안에서는 Small → Medium →
 * Large 순으로 크기별로 모아 보여준다(동점이면 원래 카탈로그 순서를 그대로 유지). */
const SIZE_ORDER: Record<WidgetSize, number> = { small: 0, medium: 1, large: 2 };

/** IA 순서대로 카테고리별 위젯을 묶는다 — 위젯 추가 시트의 카테고리 아코디언 */
const CATEGORY_ORDER: WidgetCategory[] = ['생활', '돈 관리', '혜택', '커뮤니티', '마이'];
const CATEGORY_GROUPS = CATEGORY_ORDER.map((name) => ({
  name,
  ids: WIDGET_CATALOG.filter((w) => w.category === name)
    .slice()
    .sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size])
    .map((w) => w.id),
})).filter((g) => g.ids.length > 0);

interface AddWidgetProps {
  open: boolean;
  draft: ReturnType<typeof useDraftSelection>;
  /** 로그인한 persona 의 Home 위젯 배치 — '현재 사용 중인 위젯'을 Home과 같은 크기로 보여주는 데 쓴다 */
  layout: PersonaWidgetLayout;
  onClose: () => void;
  onDone: () => void;
}

/** ③ 위젯 추가 Bottom Sheet — Figma add_widget (1693:6166) */
export function AddWidget({ open, draft, layout, onClose, onDone }: AddWidgetProps) {
  const [query, setQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  /* 현재 Home 캔버스 기본 슬롯(medium/small)에 배정된 크기 — 카탈로그 기본 크기 대신 이 크기로 보여준다 */
  const baseSizeById = useMemo(() => {
    const map = new Map<string, WidgetSize>();
    layoutCatalogEntries(layout).forEach(({ id, size }) => map.set(id, size));
    return map;
  }, [layout]);

  const sizeOf = (id: string): WidgetSize =>
    baseSizeById.get(id) ?? WIDGET_CATALOG.find((w) => w.id === id)?.size ?? 'small';

  /* persona 고정 슬롯(medium/small 그리드)은 크기를 바꿀 수 없다 — 형제 위젯(다른 크기)이
   * 고정 슬롯에 이미 들어가 있으면, 이 크기는 선택하지 못하게 막는다. 그렇지 않으면 고른
   * 위젯이 빈 슬롯 대신 캔버스 맨 아래 "추가 행"으로 붙어 레이아웃이 아래로 밀린다. */
  const isSizeLocked = (id: string) =>
    !baseSizeById.has(id) && (SIZE_VARIANT_SIBLINGS.get(id) ?? []).some((sib) => baseSizeById.has(sib));

  /* '4개'가 아니라 '4칸' — Large는 Medium 2개 폭을 쓰므로 2칸으로 센다 (선택 개수 표시용) */
  const totalWeight = useMemo(
    () => draft.draft.reduce((sum, id) => sum + widgetWeight(sizeOf(id)), 0),
    [draft.draft, baseSizeById],
  );

  /* Home 캔버스는 항상 2줄 고정 — 1번째 줄(Medium 최대 2개, 또는 Large 1개 단독) +
   * 2번째 줄(Small 최대 2개). 이 캡을 실제 선택 가능 여부로 쓴다(줄이 3번째로 밀리지 않게). */
  const mediumCount = draft.draft.filter((id) => sizeOf(id) === 'medium').length;
  const smallCount = draft.draft.filter((id) => sizeOf(id) === 'small').length;
  const hasLarge = draft.draft.some((id) => sizeOf(id) === 'large');

  useEffect(() => {
    if (!warning) return;
    const timer = setTimeout(() => setWarning(null), 2200);
    return () => clearTimeout(timer);
  }, [warning]);

  const handleToggle = (id: string) => {
    if (draft.has(id)) {
      draft.toggle(id);
      return;
    }
    if (isSizeLocked(id)) {
      setWarning('이미 다른 크기로 등록된 위젯이에요.');
      return;
    }
    const size = sizeOf(id);

    if (size === 'large') {
      if (hasLarge) {
        setWarning('큰 위젯은 한 번에 하나만 담을 수 있어요.');
        return;
      }
      if (mediumCount > 0) {
        setWarning('큰 위젯을 담으려면 1번째 줄의 위젯을 먼저 빼주세요.');
        return;
      }
    } else if (size === 'medium') {
      if (hasLarge) {
        setWarning('큰 위젯이 있으면 1번째 줄에 다른 위젯을 담을 수 없어요.');
        return;
      }
      if (mediumCount >= MAX_ROW_MEDIUM) {
        setWarning('1번째 줄에는 위젯을 2개까지 담을 수 있어요.');
        return;
      }
    } else if (smallCount >= MAX_ROW_SMALL) {
      setWarning('2번째 줄에는 위젯을 2개까지 담을 수 있어요.');
      return;
    }

    draft.toggle(id);
  };

  /* 검색: 위젯 이름 기준 필터. 원본과 동일하게 소문자 부분일치. */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const set = new Set<string>();
    WIDGET_CATALOG.forEach((w) => {
      if (!q || w.name.toLowerCase().includes(q)) set.add(w.id);
    });
    return set;
  }, [query]);

  const searching = query.trim().length > 0;
  const hits = matches.size;

  /* '현재 사용 중인 위젯' = 지금 draft 에 들어있는 위젯 전체(기본 슬롯 + 추가한 것) */
  const inUseVisible = draft.draft.some((id) => matches.has(id));
  const visibleGroups = RECOMMEND_GROUPS.map((g) => ({
    ...g,
    visible: g.ids.some((id) => matches.has(id)),
  }));
  const recommendVisible = visibleGroups.some((g) => g.visible);

  const renderCard = (id: string, sizeOverride?: WidgetSize) => (
    <WidgetCard
      key={id}
      id={id}
      variant="picker"
      selected={draft.has(id)}
      hiddenBySearch={!matches.has(id)}
      onToggle={handleToggle}
      size={sizeOverride}
      disabled={!draft.has(id) && isSizeLocked(id)}
    />
  );

  /* '현재 사용 중인' 카드만 Home 캔버스에 실제 배정된 크기(medium/small)로 보여준다 */
  const renderInUseCard = (id: string) => renderCard(id, baseSizeById.get(id));

  /* Home 캔버스와 같은 두 줄 규칙으로 묶는다 — 담긴 순서가 섞여도(예: medium 하나를 끄고
   * 다른 medium을 새로 담아도) 항상 Home처럼 1번째 줄(Large 단독 또는 Medium),
   * 2번째 줄(Small)로 보이게 크기별로 나눈다. */
  const inUseLarge = draft.draft.filter((id) => sizeOf(id) === 'large');
  const inUseMedium = draft.draft.filter((id) => sizeOf(id) === 'medium');
  const inUseSmall = draft.draft.filter((id) => sizeOf(id) === 'small');
  const inUseRow1 = inUseLarge.length > 0 ? inUseLarge : inUseMedium;

  return (
    <section className="layer add-widget" hidden={!open} aria-label="위젯 추가">
      <StatusBar />

      {/* 다른 풀페이지(Header/SubPageHeader/GnbOverlay)와 같은 nav-header 행 — 뒤로가기·
       * 타이틀·우측 아이콘이 항상 같은 줄·같은 높이(50px)에 놓이게 클래스를 그대로 재사용한다. */}
      <div className="nav-header">
        <div className="gnb__title-button">
          <button
            type="button"
            className="gnb__back"
            aria-label="위젯 추가 닫기"
            onClick={onClose}
          >
            <img src={icon('gnb-back.svg')} alt="" />
          </button>
          <span className="gnb__title">위젯 추가</span>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="add-widget__close"
            aria-label="위젯 추가 닫기"
            onClick={onClose}
          >
            <img src={icon('widget-close.svg')} alt="" />
          </button>
        </div>
      </div>

      <p className="add-widget__sub">내 생활에 필요한 정보를 골라서 추가해보세요.</p>

      <div className="add-widget__search">
        <img src={icon('widget-search.svg')} alt="" />
        <input
          type="search"
          placeholder="위젯 검색하기"
          aria-label="위젯 검색하기"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={`add-widget__body${hits === 0 ? ' is-empty' : ''}`}>
        {/* 현재 사용 중인 위젯 */}
        <section className="add-widget__section" data-section="inuse" hidden={!inUseVisible}>
          <div className="add-widget__section-head">
            <h3 className="add-widget__section-title">현재 사용 중인 위젯</h3>
            <span className="add-widget__section-count">
              {totalWeight}/{MAX_WIDGET}
            </span>
          </div>
          <div className="wpick-grid wpick-grid--rows">
            {inUseRow1.length > 0 && (
              <div className="module-grid__row">{inUseRow1.map((id) => renderInUseCard(id))}</div>
            )}
            {inUseSmall.length > 0 && (
              <div className="module-grid__row">{inUseSmall.map((id) => renderInUseCard(id))}</div>
            )}
          </div>
        </section>

        {/* 추천 위젯 */}
        <section
          className="add-widget__section"
          data-section="recommend"
          hidden={!recommendVisible}
        >
          <div className="add-widget__section-head">
            <h3 className="add-widget__section-title">추천 위젯</h3>
            <span className="add-widget__section-count">4개</span>
          </div>

          {visibleGroups.map((group) => (
            <div className="add-widget__group" key={group.title} hidden={!group.visible}>
              <h4 className="add-widget__group-title">{group.title}</h4>
              <div className="wpick-grid">{group.ids.map((id) => renderCard(id))}</div>
            </div>
          ))}
        </section>

        <p className="add-widget__empty">검색 결과가 없어요.</p>

        {/* 카테고리 아코디언 — 한 번에 하나만 펼쳐진다 (GNB 메뉴와 같은 패턴) */}
        <div className="add-widget__cats" data-section="cats" hidden={searching}>
          {CATEGORY_GROUPS.map((cat) => {
            const isOpen = openCategory === cat.name;
            return (
              <div className="add-widget__cat-group" key={cat.name}>
                <button
                  type="button"
                  className={`add-widget__cat${isOpen ? ' is-open' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenCategory((current) => (current === cat.name ? null : cat.name))
                  }
                >
                  <span className="add-widget__cat-name">{cat.name}</span>
                  <span className="add-widget__cat-meta">
                    {cat.ids.length}개
                    <img
                      className="add-widget__cat-chevron"
                      src={icon('widget-chevron-right.svg')}
                      alt=""
                    />
                  </span>
                </button>
                <div className="add-widget__cat-panel" hidden={!isOpen}>
                  <div className="wpick-grid">{cat.ids.map((id) => renderCard(id))}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="add-widget__tip" data-section="tip" hidden={searching}>
          <p className="add-widget__tip-title">💡 위젯 추가 팁</p>
          <p className="add-widget__tip-body">
            내 생활 영역에는 최대 4개의 위젯을 추가할 수 있어요. 자주 확인하고 싶은 정보부터
            골라보세요.
          </p>
        </div>
      </div>

      <div className="add-widget__footer">
        <div className={`add-widget__warning${warning ? ' is-visible' : ''}`} role="status">
          {warning}
        </div>
        <div className="add-widget__count">
          <span>선택한 위젯</span>
          <b>
            {totalWeight} / {MAX_WIDGET}
          </b>
        </div>
        <button type="button" className="add-widget__done" onClick={onDone}>
          완료하기
        </button>
      </div>
    </section>
  );
}
