import { useMemo, useState } from 'react';
import { icon } from '../lib/asset';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { WidgetGrid } from '../components/widget/WidgetGrid';
import { WidgetPreviewSheet } from '../components/widget/WidgetPreviewSheet';
import {
  WIDGET_CATEGORY_ORDER,
  WIDGET_TYPES,
  availableHomeSizes,
  getWidgetType,
  toGalleryType,
} from '../data/widgets';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useMyMenu } from '../menu/MyMenuContext';
import { useHomeWidgets } from '../widgets/HomeWidgetsContext';
import type { WidgetCategory, WidgetSize } from '../types';

/* "지금 필요한 위젯" — 상황 맞춤 추천 큐레이션(고정 3개, Figma add_widget 레퍼런스와
 * 동일한 성격의 정적 추천이다 — 실제 서비스라면 서버가 계산하겠지만 여기선 다른 화면과
 * 같은 방식으로 정적 목업을 쓴다). */
const RECOMMENDED_TYPES = ['living-cost', 'fixed-cost', 'benefit-urgent'];

type CategoryFilter = '전체' | WidgetCategory;

export function WidgetGallery() {
  const navigation = useAppNavigation();
  const myMenu = useMyMenu();
  const home = useHomeWidgets();

  const [gnbOpen, setGnbOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('전체');
  const [previewType, setPreviewType] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const filtered = useMemo(
    () =>
      WIDGET_TYPES.filter((w) => {
        if (searching) return w.title.toLowerCase().includes(q);
        return category === '전체' || w.category === category;
      }),
    [q, searching, category],
  );

  const myWidgetTypes = useMemo(() => {
    const seen = new Set<string>();
    home.widgets.forEach((id) => seen.add(toGalleryType(id)));
    return [...seen].map((type) => getWidgetType(type)).filter((w): w is NonNullable<typeof w> => !!w);
  }, [home.widgets]);

  const recommended = RECOMMENDED_TYPES.map((type) => getWidgetType(type)).filter(
    (w): w is NonNullable<typeof w> => !!w,
  );

  const defaultSizeOf = (type: string): WidgetSize =>
    home.currentSize(type) ?? availableHomeSizes(type)[0] ?? 'medium';

  const previewDef = previewType ? (getWidgetType(previewType) ?? null) : null;

  return (
    <div className="app widget-gallery">
      <SubPageHeader
        title="위젯"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="wg-scroll">
        <p className="wg-sub">내 홈을 원하는 대로 채워보세요.</p>

        <div className="wg-search">
          <img src={icon('widget-search.svg')} alt="" />
          <input
            type="search"
            placeholder="위젯 검색"
            aria-label="위젯 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {!searching && (
          <>
            <section className="wg-section">
              <div className="wg-section__head">
                <h2 className="wg-section__title">내 홈 위젯</h2>
                <span className="wg-section__count">
                  {home.count}/{home.max}
                </span>
              </div>
              {myWidgetTypes.length > 0 ? (
                <WidgetGrid
                  items={myWidgetTypes}
                  sizeOf={defaultSizeOf}
                  isAdded={home.isAdded}
                  onSelect={setPreviewType}
                />
              ) : (
                <p className="wg-empty">아직 추가한 위젯이 없어요.</p>
              )}
            </section>

            <section className="wg-section">
              <h2 className="wg-section__title">지금 필요한 위젯</h2>
              <WidgetGrid
                items={recommended}
                sizeOf={defaultSizeOf}
                isAdded={home.isAdded}
                onSelect={setPreviewType}
              />
            </section>
          </>
        )}

        <section className="wg-section">
          <h2 className="wg-section__title">위젯 둘러보기</h2>

          {!searching && (
            <div className="wg-cats" role="tablist" aria-label="위젯 카테고리">
              {(['전체', ...WIDGET_CATEGORY_ORDER] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={category === cat}
                  className={`wg-cats__item${category === cat ? ' is-active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filtered.length > 0 ? (
            <WidgetGrid
              items={filtered}
              sizeOf={defaultSizeOf}
              isAdded={home.isAdded}
              onSelect={setPreviewType}
            />
          ) : (
            <p className="wg-empty">검색 결과가 없어요.</p>
          )}
        </section>
      </main>

      <BottomNavigation activeTab="home" />

      <WidgetPreviewSheet
        def={previewDef}
        addedSize={previewDef ? home.currentSize(previewDef.type) : undefined}
        onClose={() => setPreviewType(null)}
        onAdd={(type, size) => home.addWidget(type, size)}
        onRemove={(type) => home.removeWidget(type)}
      />

      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />
    </div>
  );
}

export default WidgetGallery;
