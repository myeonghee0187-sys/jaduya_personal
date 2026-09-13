import { useEffect, useMemo, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { SavedCard } from '../components/SavedCard';
import { SAVED_FILTERS, SAVED_ITEMS, sortByLatest } from '../data/savedItems';
import type { SavedFilter, SavedItem } from '../data/savedItems';
import { useMyMenu } from '../menu/MyMenuContext';

/** 나의 활동 1차 탭 — '저장한 정보' 가 기본값이다 */
const ACTIVITY_TABS = ['저장한 정보', '작성한 글', '댓글'] as const;
type ActivityTab = (typeof ACTIVITY_TABS)[number];

/* 나의 활동 — 마이페이지 '나의 활동' / GNB 내 메뉴 '저장한 정보' 로 들어오는 하위 화면.
 * 1차 탭(저장한 정보 / 작성한 글 / 댓글) 아래에 각 탭의 내용을 둔다.
 * 새 헤더·탭바를 만들지 않고 SubPageHeader / BottomNavigation 을 그대로 쓴다.
 * 탭바는 마이페이지의 하위 화면이므로 '마이' active 를 유지한다. */
export function SavedPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const [tab, setTab] = useState<ActivityTab>('저장한 정보');
  const [filter, setFilter] = useState<SavedFilter>('전체');
  /* 카테고리·정렬 드롭다운은 한 번에 하나만 열린다 */
  const [openMenu, setOpenMenu] = useState<'filter' | 'sort' | null>(null);
  /* 저장 해제한 항목 id — 목록에서 빠지고 토스트에서 되돌릴 수 있다 */
  const [removed, setRemoved] = useState<number[]>([]);
  const [undoId, setUndoId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const kept = SAVED_ITEMS.filter(
      (item) => !removed.includes(item.id) && (filter === '전체' || item.category === filter),
    );
    const latest = sortByLatest(kept);
    return sort === '최신 저장순' ? latest : latest.reverse();
  }, [filter, sort, removed]);

  /* 바깥을 누르면 열린 목록을 닫는다 (터치·마우스 공통) */
  useEffect(() => {
    if (!openMenu) return;
    const onOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [openMenu]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice('');
      setUndoId(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const unsave = (id: number) => {
    setRemoved((current) => [...current, id]);
    setUndoId(id);
    setNotice('저장을 해제했어요.');
  };

  const undo = () => {
    if (undoId === null) return;
    setRemoved((current) => current.filter((id) => id !== undoId));
    setUndoId(null);
    setNotice('');
  };

  /* 상세 화면이 아직 없어 route 를 만들지 않는다 — 안내만 띄운다 */
  const openItem = (item: SavedItem) => {
    setUndoId(null);
    setNotice(item.title + ' 화면은 준비 중이에요.');
  };

  return (
    <div className="saved app">
      <SubPageHeader
        title="나의 활동"
        backLabel="마이페이지로"
        onBack={() => navigation?.navigate('my')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="saved__scroll">
        {/* ① 개수 + 카테고리·정렬 드롭다운 — 카테고리 기본값 '전체' */}
        <div className="saved__summary">
          <p className="saved__count">총 {items.length}개의 저장한 정보</p>
          <div className="saved__controls" ref={menuRef}>
            <div className="saved__sort">
              <button
                type="button"
                className="saved__sort-button"
                aria-expanded={openMenu === 'filter'}
                onClick={() => setOpenMenu((open) => (open === 'filter' ? null : 'filter'))}
              >
                {filter}
                <img src={icon('chevron-down.svg')} alt="" />
              </button>
              <ul className="saved__sort-list" hidden={openMenu !== 'filter'}>
                {SAVED_FILTERS.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className={name === filter ? 'is-active' : undefined}
                      aria-current={name === filter}
                      onClick={() => {
                        setFilter(name);
                        setOpenMenu(null);
                      }}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="saved__sort">
              <button
                type="button"
                className="saved__sort-button"
                aria-expanded={openMenu === 'sort'}
                onClick={() => setOpenMenu((open) => (open === 'sort' ? null : 'sort'))}
              >
                {sort}
                <img src={icon('chevron-down.svg')} alt="" />
              </button>
              <ul className="saved__sort-list" hidden={openMenu !== 'sort'}>
                {SORT_OPTIONS.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      className={option === sort ? 'is-active' : undefined}
                      aria-current={option === sort}
                      onClick={() => {
                        setSort(option);
                        setOpenMenu(null);
                      }}
                    >
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* ① 카테고리 필터 — 2차 필터. '저장한 정보' 탭에서만 보인다. 기본값 '전체' */}
            <div className="saved__filters" role="tablist" aria-label="저장 카테고리">
              {SAVED_FILTERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={filter === name}
                  className={`saved__filter${filter === name ? ' is-active' : ''}`}
                  onClick={() => setFilter(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* ② 개수 — 지금 보이는 목록에서 센다. 저장한 정보가 없으면 띄우지 않는다 */}
            {items.length > 0 && <p className="saved__count">총 {items.length}개의 저장한 정보</p>}

            {/* ③ 목록 — 카드는 데이터로만 만든다.
             * 저장 데이터가 0개면 Empty State, 있으면 카드 목록. */}
            {items.length > 0 ? (
              <>
                <div className="saved__list">
                  {items.map((item) => (
                    <SavedCard
                      key={item.id}
                      item={item}
                      bookmarked
                      onToggleBookmark={unsave}
                      onOpen={openItem}
                    />
                  ))}
                </div>
                <p className="saved__footer">저장된 콘텐츠가 모두 표시되었습니다.</p>
              </>
            ) : (
              /* Figma saved_empty (1565:7114) — 저장 데이터가 0개일 때 기본으로 보여준다 */
              <div className="saved__empty">
                <div className="saved__empty-copy">
                  <b>아직 저장한 정보가 없어요.</b>
                  <p>
                    지금 필요한 정보를 저장하고
                    <br />
                    나중에 다시 확인해보세요.
                  </p>
                </div>
                {/* 콘텐츠를 둘러볼 곳은 생활 메인 — 새 route 를 만들지 않고 기존 화면으로 보낸다 */}
                <button
                  type="button"
                  className="saved__empty-cta"
                  onClick={() => navigation?.navigate('life')}
                >
                  콘텐츠 둘러보기
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <p className="saved__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
        {undoId !== null && (
          <button type="button" onClick={undo}>
            되돌리기
          </button>
        )}
      </p>

      {/* 마이페이지 하위 화면이라 '마이' active 를 유지한다 */}
      <BottomNavigation activeTab="my" />
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

export default SavedPage;
