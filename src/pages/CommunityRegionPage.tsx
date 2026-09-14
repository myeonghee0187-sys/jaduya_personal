import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityWritePanel } from '../components/CommunityWritePanel';
import { RegionFilterPanel } from '../components/RegionFilterPanel';
import { COMMUNITY_TABS, COMMUNITY_TIP_TAB, REGION_POSTS } from '../data/communityPosts';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

/* 커뮤니티 '지역 후기' — Figma local_reviews_v4 (3092:20677).
 * 헤더·탭바·글쓰기 버튼·게시글 카드는 question 화면과 같은 레이아웃을 그대로 쓴다.
 * '필터' 버튼은 다른 정렬·레벨 버튼처럼 누르면 패널이 펼쳐진다 (Figma SearchFilterCard 3107:25279).
 * 주거별·주변 칩은 실제로 목록을 걸러내고, 범위 설정은 위치 데이터가 없어 시각 동작만 한다. */
export function CommunityRegionPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const myMenu = useMyMenu();
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [dwelling, setDwelling] = useState<string[]>([]);
  const [nearby, setNearby] = useState<string[]>([]);
  const [outsideNeighborhood, setOutsideNeighborhood] = useState(false);
  const [rangeStep, setRangeStep] = useState(0);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* 바깥을 누르면 필터 패널을 닫는다 (다른 커뮤니티 필터와 동일한 동작) */
  useEffect(() => {
    if (!filterOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [filterOpen]);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  const toggleInList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  /* 주거별·주변 칩만 실제 필터링에 쓴다. 선택이 없으면 그 기준은 걸지 않는다 */
  const visiblePosts = REGION_POSTS.filter((post) => {
    const dwellingTag = post.hashtag.replace('#', '');
    const matchesDwelling = dwelling.length === 0 || dwelling.includes(dwellingTag);
    const matchesNearby = nearby.length === 0 || nearby.includes(post.category);
    return matchesDwelling && matchesNearby;
  });

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="커뮤니티 홈으로"
        onBack={() => navigation?.navigate('community')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="community__scroll">
        {/* ============ 검색 — 커뮤니티 홈과 같은 입력창, 타이틀 문구는 없음 ============ */}
        <section className="community-search">
          <div className="community-search__input">
            <input
              ref={searchRef}
              type="search"
              value={keyword}
              placeholder="우리 동네 후기를 검색해보세요"
              aria-label="지역 후기 검색"
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button
                type="button"
                className="community-search__icon"
                aria-label="검색어 지우기"
                onClick={() => {
                  setKeyword('');
                  searchRef.current?.focus();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6 18 18M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            <button type="button" className="community-search__icon" aria-label="검색">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M16.5 16.5 21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </section>

        {/* ============ 탭 — '전체' / '질문' / '자취 꿀팁' 은 각자의 화면으로 돌아간다 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === '지역 후기' ? ' is-active' : ''}`}
              aria-current={name === '지역 후기' ? 'page' : undefined}
              onClick={() => {
                if (name === '전체') navigation?.navigate('community');
                else if (name === '질문') navigation?.navigate('community-question');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigate('community-tip');
                else if (name === '소비 비교') navigation?.navigate('community-spend-compare');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        {/* ============ 필터 — 인기순 등 다른 필터처럼 누르면 패널이 펼쳐진다 ============ */}
        <div className="community-filters" ref={filterRef}>
          <button
            type="button"
            className="community-filter__button"
            aria-expanded={filterOpen}
            aria-haspopup="dialog"
            onClick={() => setFilterOpen((open) => !open)}
          >
            필터
            <span className="community-filter__button-icon--lg" aria-hidden="true" />
          </button>
          {filterOpen && (
            <RegionFilterPanel
              dwelling={dwelling}
              onToggleDwelling={(value) => setDwelling((prev) => toggleInList(prev, value))}
              nearby={nearby}
              onToggleNearby={(value) => setNearby((prev) => toggleInList(prev, value))}
              outsideNeighborhood={outsideNeighborhood}
              onToggleOutside={() => setOutsideNeighborhood((prev) => !prev)}
              rangeStep={rangeStep}
              onChangeRange={setRangeStep}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>

        {/* ============ 게시글 목록 ============ */}
        <section className="community-feed">
          <div className="community-feed__head">
            <h2>이런 지역후기는 어때요?</h2>
          </div>

          {visiblePosts.length === 0 ? (
            <div className="community-feed__empty">이 조건에 맞는 지역후기가 없어요</div>
          ) : (
            <div className="community-feed__list">
              {visiblePosts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  saved={bookmarks.isSaved(post.id)}
                  liked={liked.includes(post.id)}
                  onToggleSave={() => bookmarks.toggle(post.id)}
                  onToggleLike={() => toggleLike(post.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 글쓰기 — 다른 커뮤니티 화면과 같은 위치·동작 */}
      <div className="community-fab">
        <button
          type="button"
          className="community-fab__button"
          onClick={() => setWriteOpen(true)}
        >
          <img src={icon('community-pencil.svg')} alt="" />
          글쓰기
        </button>
      </div>

      <p className="community-notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="community" />
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
      <CommunityWritePanel open={writeOpen} onClose={() => setWriteOpen(false)} />
    </div>
  );
}

export default CommunityRegionPage;
