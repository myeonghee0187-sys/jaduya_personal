import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { COMMUNITY_TABS, COMMUNITY_TIP_TAB, QUESTION_POSTS } from '../data/communityPosts';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

const SORT_FILTERS = ['인기순', '최신순', '댓글순'] as const;

/* 커뮤니티 '질문' — Figma question (2012:7334).
 * community_home 과 헤더·탭바·글쓰기 버튼은 같지만, 레벨 필터와 '실시간 인기 게시물'
 * 타이틀 없이 정렬 필터 하나와 QuestionList 만 보여준다. */
export function CommunityQuestionPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const [sort, setSort] = useState<string>(SORT_FILTERS[0]);
  const [openFilter, setOpenFilter] = useState(false);
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* 바깥을 누르면 필터를 닫는다 (터치·마우스 공통) */
  useEffect(() => {
    if (!openFilter) return;
    const onOutside = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setOpenFilter(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [openFilter]);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  /* '최신순' 은 실제 날짜 대신 상대 시간(예: '2시간 전') 텍스트라 정렬 기준으로 쓸 수 없다 —
   * QUESTION_POSTS 가 이미 최신순으로 작성돼 있어서 그 순서를 그대로 쓴다. */
  const sortedPosts = useMemo(() => {
    if (sort === '인기순') return [...QUESTION_POSTS].sort((a, b) => b.likes - a.likes);
    if (sort === '댓글순') return [...QUESTION_POSTS].sort((a, b) => b.comments - a.comments);
    return QUESTION_POSTS;
  }, [sort]);

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
              aria-label="질문 검색"
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
              className={`community-tabs__tab${name === '질문' ? ' is-active' : ''}`}
              aria-current={name === '질문' ? 'page' : undefined}
              onClick={() => {
                if (name === '전체') navigation?.navigate('community');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigate('community-tip');
                else if (name === '지역 후기') navigation?.navigate('community-region');
                else if (name === '소비 비교') navigation?.navigate('community-spend-compare');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        {/* ============ 필터 — 정렬만 있다 ============ */}
        <div className="community-filters" ref={filterRef}>
          <div className="community-filter">
            <button
              type="button"
              className="community-filter__button"
              aria-expanded={openFilter}
              aria-haspopup="listbox"
              onClick={() => setOpenFilter((open) => !open)}
            >
              {sort}
              <img src={icon('community-filter-arrow.svg')} alt="" />
            </button>
            <ul className="community-filter__list" role="listbox" hidden={!openFilter}>
              {SORT_FILTERS.map((option) => (
                <li key={option} role="option" aria-selected={option === sort}>
                  <button
                    type="button"
                    className={option === sort ? 'is-selected' : undefined}
                    onClick={() => {
                      setSort(option);
                      setOpenFilter(false);
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
      <div className="community-fab">
        <button
          type="button"
          className="community-fab__button"
          onClick={() => setNotice('글쓰기 화면은 준비 중이에요.')}
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
      <AIChatbot initialLift={84} />
    </div>
  );
}

export default CommunityQuestionPage;
