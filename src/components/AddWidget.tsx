import { useMemo, useState } from 'react';
import { icon } from '../lib/asset';
import { MAX_WIDGET, WIDGET_CATALOG } from '../data/widgetCatalog';
import { layoutCatalogEntries } from '../data/personaWidgets';
import type { PersonaWidgetLayout } from '../data/personaWidgets';
import { useDraftSelection } from '../hooks/useDraftSelection';
import type { WidgetCategory, WidgetSize } from '../types';
import { BottomSheet } from './BottomSheet';
import { WidgetCard } from './WidgetCard';

/** 추천 위젯 그룹 — Figma add_widget 의 소제목 구성 그대로 */
const RECOMMEND_GROUPS: { title: string; ids: string[] }[] = [
  { title: '지출 분석', ids: ['spend-analysis'] },
  { title: '혜택', ids: ['benefit'] },
  { title: '오늘 할 일', ids: ['todo-s', 'todo-m'] },
  { title: '청소', ids: ['clean-s', 'clean-m'] },
];

/** IA 순서대로 카테고리별 위젯을 묶는다 — 위젯 추가 시트의 카테고리 아코디언 */
const CATEGORY_ORDER: WidgetCategory[] = ['생활', '돈 관리', '혜택', '커뮤니티', '마이'];
const CATEGORY_GROUPS = CATEGORY_ORDER.map((name) => ({
  name,
  ids: WIDGET_CATALOG.filter((w) => w.category === name).map((w) => w.id),
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

  /* 현재 Home 캔버스 기본 슬롯(medium/small)에 배정된 크기 — 카탈로그 기본 크기 대신 이 크기로 보여준다 */
  const baseSizeById = useMemo(() => {
    const map = new Map<string, WidgetSize>();
    layoutCatalogEntries(layout).forEach(({ id, size }) => map.set(id, size));
    return map;
  }, [layout]);

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
      onToggle={draft.toggle}
      size={sizeOverride}
    />
  );

  /* '현재 사용 중인' 카드만 Home 캔버스에 실제 배정된 크기(medium/small)로 보여준다 */
  const renderInUseCard = (id: string) => renderCard(id, baseSizeById.get(id));

  return (
    <BottomSheet
      open={open}
      className="add-widget"
      labelledBy="addWidgetTitle"
      onDimClick={onClose}
    >
      <div className="add-widget__grip">
        <span />
      </div>

      <div className="add-widget__head">
        <div>
          <h2 className="add-widget__title" id="addWidgetTitle">
            위젯 추가
          </h2>
          <p className="add-widget__sub">내 생활에 필요한 정보를 골라서 추가해보세요.</p>
        </div>
        <button
          type="button"
          className="add-widget__close"
          aria-label="위젯 추가 닫기"
          onClick={onClose}
        >
          <img src={icon('widget-close.svg')} alt="" />
        </button>
      </div>

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
              {draft.count}/{MAX_WIDGET}
            </span>
          </div>
          <div className="wpick-grid">{draft.draft.map((id) => renderInUseCard(id))}</div>
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
        <div className="add-widget__count">
          <span>선택한 위젯</span>
          <b>
            {draft.count} / {MAX_WIDGET}
          </b>
        </div>
        <button type="button" className="add-widget__done" onClick={onDone}>
          완료하기
        </button>
      </div>
    </BottomSheet>
  );
}
