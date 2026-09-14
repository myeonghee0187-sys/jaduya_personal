import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { COMMUNITY_POSTS, COMMUNITY_TABS, COMMUNITY_TIP_TAB } from '../data/communityPosts';
import { useMyMenu } from '../menu/MyMenuContext';
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
  const myMenu = useMyMenu();
  /* 다른 화면에서 탭을 지정해 들어올 수 있다 (전용 화면이 있는 '질문'·'자취 꿀팁'은 제외).
   * 넘어온 값이 실제 탭일 때만 쓰고, 아니면 기존처럼 '전체'로 연다. */
  const requestedTab = navigation?.options.tab;
  const [tab, setTab] = useState<string>(() =>
    requestedTab && (COMMUNITY_TABS as readonly string[]).includes(requestedTab)
      ? requestedTab
      : COMMUNITY_TABS[0],
  );
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<string>(LEVEL_FILTERS[0]);
  const [sort, setSort] = useState<string>(SORT_FILTERS[0]);
  const [openFilter, setOpenFilter] = useState<'level' | 'sort' | null>(null);
  /* 저장은 마이페이지와 공유하는 전역 상태, 좋아요는 이 화면 안에서만 쓴다 */
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  /* 아직 화면이 없는 항목은 토스트로만 알린다 — 없는 route 를 만들지 않는다 */
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
      if (!filterRef.current?.contains(event.target as Node)) setOpenFilter(null);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [openFilter]);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  /* '최신순' 은 실제 날짜 대신 상대 시간 텍스트라 정렬 기준으로 쓸 수 없다 —
   * COMMUNITY_POSTS 가 이미 최신순으로 작성돼 있어서 그 순서를 그대로 쓴다. */
  const visiblePosts = useMemo(() => {
    const filtered =
      level === '레벨 전체' ? COMMUNITY_POSTS : COMMUNITY_POSTS.filter((post) => post.level === level);
    if (sort === '인기순') return [...filtered].sort((a, b) => b.likes - a.likes);
    if (sort === '댓글순') return [...filtered].sort((a, b) => b.comments - a.comments);
    return filtered;
  }, [level, sort]);

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="community__scroll community__scroll--enter">
        {/* ============ 검색 ============ */}
        <section className="community-search">
          <div className="community-search__input">
            <input
              ref={searchRef}
              type="search"
              value={keyword}
              placeholder="궁금한 자취 이야기를 검색해보세요"
              aria-label="자취 이야기 검색"
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
              onClick={() => {
                if (name === '질문') navigation?.navigate('community-question');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigate('community-tip');
                else if (name === '지역 후기') navigation?.navigate('community-region');
                else if (name === '소비 비교') navigation?.navigate('community-spend-compare');
                else setTab(name);
              }}
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
          </div>

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
        </section>
      </main>

      {/* 글쓰기 — 항상 보이는 단일 버튼. '내가 쓴 글'과의 Speed Dial 토글은 없앴다.
        * 글쓰기 화면은 아직 없어 route 를 만들지 않고 토스트로 안내한다. */}
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
      {/* 글쓰기 버튼이 기본 자리(바텀네비 바로 위)를 차지해서, 챗봇은 그 위로 올려 시작한다 */}
      <AIChatbot initialLift={68} />
    </div>
  );
}

export default CommunityPage;
