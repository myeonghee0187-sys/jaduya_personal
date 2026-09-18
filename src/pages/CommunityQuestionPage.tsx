import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import { useCommunityCommentCount } from '../community/communitySelectors';
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
  postMatchesKeyword,
} from '../data/communityPosts';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

const SORT_FILTERS = ['인기순', '최신순', '댓글순'] as const;
/* 게시글종류 필터 — '전체' 없이 넷 중 하나를 항상 고른 상태로 둔다(기본값 '정보').
 * 자취 꿀팁의 TIP_CATEGORIES 와 같은 형태(라벨 + 아이콘)로 둬서 tip-category 와
 * 같은 원형 아이콘 배지 레이아웃을 그대로 쓴다. */
const POST_TYPE_FILTERS = [
  { id: '정보', label: '정보', icon: 'folder.svg' },
  { id: '질문', label: '질문', icon: 'megaphone.svg' },
  { id: '후기', label: '후기', icon: 'tag.svg' },
  { id: '잡담', label: '잡담', icon: 'chat.svg' },
] as const;

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
  const [sort, setSort] = useState<string>(SORT_FILTERS[0]);
  const [postTypeFilter, setPostTypeFilter] = useState<string>('정보');
  const [sortOpen, setSortOpen] = useState(false);
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  /* 내가 쓴 글은 종류 제한 없이 다 합치고, 아래 게시글종류 버튼으로 좁혀본다 */
  const { ownPosts } = useCommunityPosts();
  /* 댓글 수는 실제 댓글 데이터가 있는 게시글이면 그 실제 개수로 바꾼다(전체 탭과 같은 기준) */
  const getCommentCount = useCommunityCommentCount();
  const allBoardPosts = useMemo(
    () =>
      mergeOwnPosts([...QUESTION_POSTS, ...COMMUNITY_POSTS], ownPosts).map((post) => ({
        ...post,
        comments: getCommentCount(post.id, post.comments),
      })),
    [ownPosts, getCommentCount],
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
    if (!sortOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [sortOpen]);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  /* '최신순' 은 실제 날짜 대신 상대 시간(예: '2시간 전') 텍스트라 정렬 기준으로 쓸 수 없다 —
   * 정적 목록이 이미 최신순으로 작성돼 있어서 그 순서를 그대로 쓴다. */
  const sortedPosts = useMemo(() => {
    const filtered = typeFilteredPosts.filter((post) => postMatchesKeyword(post, keyword));
    if (sort === '인기순') return [...filtered].sort((a, b) => b.likes - a.likes);
    if (sort === '댓글순') return [...filtered].sort((a, b) => b.comments - a.comments);
    return filtered;
  }, [typeFilteredPosts, sort, keyword]);

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="커뮤니티 홈으로"
        onBack={() => navigation?.goBack('community')}
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

        {/* ============ 게시글종류 필터 — 자취 꿀팁 tip-categories 와 같은 원형 아이콘 배지 레이아웃.
         * 정렬(인기순)도 같은 줄 오른쪽 끝에 다섯 번째 항목으로 같이 둔다 ============ */}
        <div className="board-type-filter" role="tablist" aria-label="게시글종류" ref={filterRef}>
          {POST_TYPE_FILTERS.map((type) => {
            const active = type.id === postTypeFilter;
            return (
              <button
                key={type.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`board-type-filter__btn${active ? ' is-active' : ''}`}
                onClick={() => setPostTypeFilter(type.id)}
              >
                <span className="board-type-filter__icon-stack">
                  <span
                    className="board-type-filter__badge"
                    style={{
                      maskImage: `url(${icon('jadu_community.svg')})`,
                      WebkitMaskImage: `url(${icon('jadu_community.svg')})`,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="board-type-filter__glyph"
                    style={{ maskImage: `url(${icon(type.icon)})`, WebkitMaskImage: `url(${icon(type.icon)})` }}
                    aria-hidden="true"
                  />
                </span>
                <span className="board-type-filter__label">{type.label}</span>
              </button>
            );
          })}

          <div className="community-filter board-type-filter__sort">
            <button
              type="button"
              className="community-filter__button"
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              onClick={() => setSortOpen((open) => !open)}
            >
              {sort}
              <span className="community-filter__button-arrow" aria-hidden="true" />
            </button>
            <ul className="community-filter__list" role="listbox" hidden={!sortOpen}>
              {SORT_FILTERS.map((option) => (
                <li key={option} role="option" aria-selected={option === sort}>
                  <button
                    type="button"
                    className={option === sort ? 'is-selected' : undefined}
                    onClick={() => {
                      setSort(option);
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
