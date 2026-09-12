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
  /* 저장 해제한 항목 id — 목록에서 빠지고 토스트에서 되돌릴 수 있다 */
  const [removed, setRemoved] = useState<number[]>([]);
  const [undoId, setUndoId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  /* 정렬은 고를 수 없고 항상 최신 저장순(savedAt 내림차순)으로 고정한다 */
  const items = useMemo(
    () =>
      sortByLatest(
        SAVED_ITEMS.filter(
          (item) => !removed.includes(item.id) && (filter === '전체' || item.category === filter),
        ),
      ),
    [filter, removed],
  );

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

      {/* 1차 탭 — 헤더 바로 아래에 고정한다 (생활 하위 탭과 같은 밑줄 탭 방식) */}
      <nav className="saved__tabs" role="tablist" aria-label="나의 활동">
        {ACTIVITY_TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={`saved__tab${tab === name ? ' is-active' : ''}`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>

      <main className="saved__scroll">
        {tab !== '저장한 정보' ? (
          /* 작성한 글 / 댓글 — 아직 데이터를 연결하지 않아 자리만 잡아둔다 */
          <div className="saved__empty">
            <div className="saved__empty-copy">
              <b>{tab}은 준비 중이에요.</b>
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
