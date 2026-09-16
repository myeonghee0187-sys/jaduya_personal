import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { CommunityWriteFab } from '../components/CommunityWriteFab';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityWritePanel } from '../components/CommunityWritePanel';
import {
  COMMUNITY_BOARD_TAB,
  COMMUNITY_POSTS,
  COMMUNITY_TABS,
  COMMUNITY_TIP_TAB,
  QUESTION_POSTS,
  mergeOwnPosts,
} from '../data/communityPosts';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

/* '전체' 탭과 같은 레벨 필터 — 라벨·순서 그대로 재사용한다 */
const LEVEL_FILTERS = ['레벨 전체', '초보', '중수', '고수'] as const;
const SORT_FILTERS = ['인기순', '최신순', '댓글순'] as const;
/* 게시글종류 필터 — '전체' 없이 넷 중 하나를 항상 고른 상태로 둔다(기본값 '정보') */
const POST_TYPE_FILTERS = ['정보', '질문', '후기', '잡담'] as const;

/* 커뮤니티 '게시판'(예전 '질문' 전용 화면, route 는 그대로 community-question) — Figma question (2012:7334).
 * community_home 과 헤더·탭바·글쓰기 버튼은 같지만, 게시글종류 버튼(정보/질문/후기/잡담)이 위에 있고
 * 그 아래 레벨 필터 + 정렬 필터가 '전체' 탭과 같은 방식(한 줄, openFilter 로 하나만 열림)으로 있다.
 * QUESTION_POSTS(질문 전용 정적 글) + COMMUNITY_POSTS(전체 정적 글)를 합쳐 기본 풀로 쓴다 —
 * 예전에 이 화면에만 있던 질문 글도 그대로 보이게 유지한다. */
export function CommunityQuestionPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const myMenu = useMyMenu();
  const [level, setLevel] = useState<string>(LEVEL_FILTERS[0]);
  const [sort, setSort] = useState<string>(SORT_FILTERS[0]);
  const [postTypeFilter, setPostTypeFilter] = useState<string>('정보');
  const [openFilter, setOpenFilter] = useState<'level' | 'sort' | null>(null);
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  /* 내가 쓴 글은 종류 제한 없이 다 합치고, 아래 게시글종류 버튼으로 좁혀본다 */
  const { ownPosts } = useCommunityPosts();
  const allBoardPosts = useMemo(
    () => mergeOwnPosts([...QUESTION_POSTS, ...COMMUNITY_POSTS], ownPosts),
    [ownPosts],
  );
  const typeFilteredPosts = useMemo(
    () => allBoardPosts.filter((post) => post.category === postTypeFilter),
    [allBoardPosts, postTypeFilter],
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

  /* '최신순' 은 실제 날짜 대신 상대 시간(예: '2시간 전') 텍스트라 정렬 기준으로 쓸 수 없다 —
   * 정적 목록이 이미 최신순으로 작성돼 있어서 그 순서를 그대로 쓴다. */
  const sortedPosts = useMemo(() => {
    const filtered =
      level === '레벨 전체' ? typeFilteredPosts : typeFilteredPosts.filter((post) => post.level === level);
    if (sort === '인기순') return [...filtered].sort((a, b) => b.likes - a.likes);
    if (sort === '댓글순') return [...filtered].sort((a, b) => b.comments - a.comments);
    return filtered;
  }, [typeFilteredPosts, level, sort]);

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
              placeholder="자취 고민을 검색해보세요"
              aria-label="게시판 검색"
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

        {/* ============ 탭 — '전체' 는 커뮤니티 홈으로 돌아간다 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === COMMUNITY_BOARD_TAB ? ' is-active' : ''}`}
              aria-current={name === COMMUNITY_BOARD_TAB ? 'page' : undefined}
              onClick={() => {
                if (name === '전체') navigation?.navigate('community');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigate('community-tip');
                else if (name === '지역 후기') navigation?.navigate('community-region');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        {/* ============ 게시글종류 필터 — 정렬 드롭다운과 다르게 알약형 버튼을 늘어놓는다 ============ */}
        <div className="board-type-filter" role="tablist" aria-label="게시글종류">
          {POST_TYPE_FILTERS.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={type === postTypeFilter}
              className={`board-type-filter__btn${type === postTypeFilter ? ' is-active' : ''}`}
              onClick={() => setPostTypeFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ============ 필터 — '전체' 탭과 같은 레벨 + 정렬 드롭다운 ============ */}
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
          <div className="community-feed__list">
            {sortedPosts.map((post) => (
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

      {/* 글쓰기 — 커뮤니티 홈과 같은 위치·동작 */}
      <CommunityWriteFab onClick={() => setWriteOpen(true)} />

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

export default CommunityQuestionPage;
