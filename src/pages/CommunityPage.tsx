import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { COMMUNITY_POSTS, COMMUNITY_TABS } from '../data/communityPosts';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { icon, img } from '../lib/asset';

/* 레벨은 초보 / 중수 / 고수 3단계.
 * 이미 '레벨' 필터라 '자취' 를 반복하지 않고 단계 이름만 보여준다. */
const LEVEL_FILTERS = ['레벨 전체', '초보', '중수', '고수'] as const;
const SORT_FILTERS = ['인기순', '최신순', '댓글순'] as const;

/* 커뮤니티 홈 — Figma community_home (1742:6378).
 * 게시글은 종류를 나누지 않고 CommunityPostCard 하나로만 그린다. */
export function CommunityPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [tab, setTab] = useState<string>(COMMUNITY_TABS[0]);
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<string>(LEVEL_FILTERS[0]);
  const [sort, setSort] = useState<string>(SORT_FILTERS[0]);
  const [openFilter, setOpenFilter] = useState<'level' | 'sort' | null>(null);
  /* 저장은 마이페이지와 공유하는 전역 상태, 좋아요는 이 화면 안에서만 쓴다 */
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  /* 바깥을 누르거나 Escape 를 누르면 Speed Dial 을 닫는다 */
  useEffect(() => {
    if (!fabOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!fabRef.current?.contains(event.target as Node)) setFabOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFabOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [fabOpen]);

  /* 바깥을 누르면 필터를 닫는다 (터치·마우스 공통) */
  useEffect(() => {
    if (!openFilter) return;
    const onOutside = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setOpenFilter(null);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [openFilter]);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="community__scroll">
        {/* ============ 검색 ============ */}
        <section className="community-search">
          <p className="community-search__title">
            자취하는 사람들의
            <br />
            진짜 이야기를 나눠요
          </p>
          <div className="community-search__input">
            <input
              ref={searchRef}
              type="search"
              value={keyword}
              placeholder="동네 이름으로 검색해보세요"
              aria-label="동네 이름으로 검색"
              onChange={(event) => setKeyword(event.target.value)}
            />
            {/* 지우기·검색은 같은 규격(24px box · 20px glyph · stroke 2)의 아이콘을 쓴다 */}
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
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
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

        {/* ============ 탭 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === tab ? ' is-active' : ''}`}
              aria-current={name === tab ? 'page' : undefined}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </nav>

        {/* ============ 필터 ============ */}
        <div className="community-filters" ref={filterRef}>
          <div className="community-filter">
            <button
              type="button"
              className="community-filter__button"
              aria-expanded={openFilter === 'level'}
              aria-haspopup="listbox"
              onClick={() => setOpenFilter((open) => (open === 'level' ? null : 'level'))}
            >
              {level}
              <img src={icon('community-filter-arrow.svg')} alt="" />
            </button>
            <ul className="community-filter__list" role="listbox" hidden={openFilter !== 'level'}>
              {LEVEL_FILTERS.map((option) => (
                <li key={option} role="option" aria-selected={option === level}>
                  <button
                    type="button"
                    className={option === level ? 'is-selected' : undefined}
                    onClick={() => {
                      setLevel(option);
                      setOpenFilter(null);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="community-filter">
            <button
              type="button"
              className="community-filter__button"
              aria-expanded={openFilter === 'sort'}
              aria-haspopup="listbox"
              onClick={() => setOpenFilter((open) => (open === 'sort' ? null : 'sort'))}
            >
              {sort}
              <img src={icon('community-filter-arrow.svg')} alt="" />
            </button>
            <ul className="community-filter__list" role="listbox" hidden={openFilter !== 'sort'}>
              {SORT_FILTERS.map((option) => (
                <li key={option} role="option" aria-selected={option === sort}>
                  <button
                    type="button"
                    className={option === sort ? 'is-selected' : undefined}
                    onClick={() => {
                      setSort(option);
                      setOpenFilter(null);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ============ 게시글 목록 ============ */}
        <section className="community-feed">
          <div className="community-feed__head">
            <h2>
              <img src={img('community/section-badge.png')} alt="" />
              실시간 인기 게시물
            </h2>
            <span className="community-feed__more">전체보기 &gt;</span>
          </div>

          <div className="community-feed__list">
            {COMMUNITY_POSTS.map((post) => (
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
        </section>
      </main>

      {/* Speed Dial — 열면 '내가 쓴 글' · '글쓰기' 가 위로 펼쳐진다.
        * 두 화면은 아직 없어 route 를 만들지 않는다. */}
      <div className={`community-fab${fabOpen ? ' is-open' : ''}`} ref={fabRef}>
        {/* 닫혀 있어도 DOM 에 남겨 둬야 퇴장 애니메이션이 잘리지 않는다.
          * 숨김은 CSS(visibility/pointer-events)가 맡아 클릭·포커스도 함께 막힌다. */}
        <div className="community-fab__actions" aria-hidden={!fabOpen}>
          <button type="button" className="community-fab__action community-fab__action--wide">
            <img src={icon('community-book.svg')} alt="" />
            내가 쓴 글
          </button>
          <button type="button" className="community-fab__action">
            <img src={icon('community-pencil.svg')} alt="" />
            글쓰기
          </button>
        </div>
        <button
          type="button"
          className="community-fab__button"
          aria-expanded={fabOpen}
          aria-label={fabOpen ? '글쓰기 메뉴 닫기' : '글쓰기 메뉴 열기'}
          onClick={() => setFabOpen((open) => !open)}
        >
          {/* 다른 두 아이콘과 같은 흰색이 되도록 currentColor 로 칠한다 */}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M11 13H6C5.71667 13 5.47933 12.904 5.288 12.712C5.09667 12.52 5.00067 12.2827 5 12C4.99933 11.7173 5.09533 11.48 5.288 11.288C5.48067 11.096 5.718 11 6 11H11V6C11 5.71667 11.096 5.47933 11.288 5.288C11.48 5.09667 11.7173 5.00067 12 5C12.2827 4.99933 12.5203 5.09533 12.713 5.288C12.9057 5.48067 13.0013 5.718 13 6V11H18C18.2833 11 18.521 11.096 18.713 11.288C18.905 11.48 19.0007 11.7173 19 12C18.9993 12.2827 18.9033 12.5203 18.712 12.713C18.5207 12.9057 18.2833 13.0013 18 13H13V18C13 18.2833 12.904 18.521 12.712 18.713C12.52 18.905 12.2827 19.0007 12 19C11.7173 18.9993 11.48 18.9033 11.288 18.712C11.096 18.5207 11 18.2833 11 18V13Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <BottomNavigation activeTab="community" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={DEFAULT_MENU}
        onClose={() => setGnbOpen(false)}
        onEditMenu={() => setGnbOpen(false)}
      />
      <AIChatbot />
    </div>
  );
}

export default CommunityPage;
