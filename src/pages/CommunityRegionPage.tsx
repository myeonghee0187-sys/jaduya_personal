import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { GlyphIcon } from '../components/GlyphIcon';
import { CommunityWriteFab } from '../components/CommunityWriteFab';
import { SubPageHeader } from '../components/SubPageHeader';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityWritePanel } from '../components/CommunityWritePanel';
import { RegionFilterPanel } from '../components/RegionFilterPanel';
import { CommunitySearchDropdown, CommunitySearchToggleButton } from '../components/CommunitySearchDropdown';
import {
  COMMUNITY_BOARD_TAB,
  COMMUNITY_TABS,
  COMMUNITY_TIP_TAB,
  REGION_POSTS,
  postMatchesKeyword,
} from '../data/communityPosts';

/* 커뮤니티 '지역 후기' — Figma local_reviews_v4 (3092:20677).
 * 헤더·탭바·글쓰기 버튼·게시글 카드는 question 화면과 같은 레이아웃을 그대로 쓴다.
 * '필터' 버튼은 다른 정렬·레벨 버튼처럼 누르면 패널이 펼쳐진다 (Figma SearchFilterCard 3107:25279).
 * 주거별·주변 칩은 실제로 목록을 걸러내고, 범위 설정은 위치 데이터가 없어 시각 동작만 한다. */
export function CommunityRegionPage() {
  const navigation = useAppNavigation();
  const [writeOpen, setWriteOpen] = useState(false);
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [dwelling, setDwelling] = useState<string[]>([]);
  const [nearby, setNearby] = useState<string[]>([]);
  const [outsideNeighborhood, setOutsideNeighborhood] = useState(true);
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

  /* 주거별·주변 칩만 실제 필터링에 쓴다. 선택이 없으면 그 기준은 걸지 않는다.
   * 검색어는 지역후기 데이터의 핵심 필드(제목·주거형태 해시태그·주변시설 카테고리)에
   * 매칭시킨다 — postMatchesKeyword 가 이미 title·hashtag·category 를 본다. */
  const visiblePosts = REGION_POSTS.filter((post) => {
    const dwellingTag = post.hashtag.replace('#', '');
    const matchesDwelling = dwelling.length === 0 || dwelling.includes(dwellingTag);
    const matchesNearby = nearby.length === 0 || nearby.includes(post.category);
    const matchesKeyword = postMatchesKeyword(post, keyword);
    return matchesDwelling && matchesNearby && matchesKeyword;
  });

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="커뮤니티 홈으로"
        onBack={() => navigation?.goBack('community')}
        preserveBellPlacement
        actions={(
          <CommunitySearchToggleButton
            open={searchOpen}
            controls="community-region-search"
            onToggle={() => {
              setFilterOpen(false);
              setSearchOpen((open) => !open);
            }}
          />
        )}
      />

      <main className="community__scroll">
        <div className="community-search-anchor">
        {/* ============ 탭 — '게시판' / '자취 꿀팁'은 각자의 화면으로 이동한다 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === '지역 후기' ? ' is-active' : ''}`}
              aria-current={name === '지역 후기' ? 'page' : undefined}
              onClick={() => {
                /* 형제 화면도 Router history에 push한다. */
                if (name === COMMUNITY_BOARD_TAB) navigation?.navigateTab('community');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigateTab('community-tip');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        <CommunitySearchDropdown
          id="community-region-search"
          open={searchOpen}
          value={keyword}
          placeholder="우리 동네 후기를 검색해보세요"
          label="지역 후기 검색"
          onChange={setKeyword}
          onClose={() => setSearchOpen(false)}
        />
        </div>

        {/* ============ 필터 — 인기순 등 다른 필터처럼 누르면 패널이 펼쳐진다 ============ */}
        <div className="community-filters community-filters--padded" ref={filterRef}>
          <button
            type="button"
            className="community-filter__button"
            aria-expanded={filterOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setSearchOpen(false);
              setFilterOpen((open) => !open);
            }}
          >
            필터
            <span className="home-action-button__icon community-filter__button-icon--lg">
              <GlyphIcon file="community-filter.svg" size={18} />
            </span>
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
      <CommunityWriteFab onClick={() => setWriteOpen(true)} />

      <p className="community-notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="community" />
      <CommunityWritePanel open={writeOpen} onClose={() => setWriteOpen(false)} />
    </div>
  );
}

export default CommunityRegionPage;
