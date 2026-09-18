import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { CommunityWriteFab } from '../components/CommunityWriteFab';
import { SubPageHeader } from '../components/SubPageHeader';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityWritePanel } from '../components/CommunityWritePanel';
import {
  COMMUNITY_BOARD_TAB,
  COMMUNITY_TABS,
  COMMUNITY_TIP_TAB,
  TIP_CATEGORIES,
  TIP_POSTS,
  mergeOwnPosts,
  postMatchesKeyword,
} from '../data/communityPosts';
import { icon } from '../lib/asset';

/* 서브탭 라벨을 좁은 화면에서 정확히 지정된 지점으로 두 줄로 나눈다
 * ("고정·관리" → "고정" / "관리", "청소·정리" → "청소" / "정리",
 * "인테리어" → "인테" / "리어", "생활문제" → "생활" / "문제").
 * '·' 가 있으면 그 자리에서, 공백이 있으면 마지막 공백에서, 둘 다 없으면(인테리어·
 * 생활문제처럼 구분자 없이 붙은 라벨) 글자 수 절반에서 나눈다. 넓은 화면에서는
 * CSS 로 구분자(·)만 보이고 줄바꿈은 숨긴다 — TIP_CATEGORIES 라벨 순서를 그대로
 * 유지한다. */
function renderTipLabel(label: string) {
  const dotIndex = label.indexOf('·');
  if (dotIndex !== -1) {
    return (
      <>
        {label.slice(0, dotIndex)}
        <span className="tip-category__label-dot" aria-hidden="true">
          ·
        </span>
        <br className="tip-category__label-break" />
        {label.slice(dotIndex + 1)}
      </>
    );
  }
  const spaceIndex = label.lastIndexOf(' ');
  if (spaceIndex !== -1) {
    return (
      <>
        {label.slice(0, spaceIndex)}{' '}
        <br className="tip-category__label-break" />
        {label.slice(spaceIndex + 1)}
      </>
    );
  }
  const midIndex = Math.ceil(label.length / 2);
  return (
    <>
      {label.slice(0, midIndex)}
      <br className="tip-category__label-break" />
      {label.slice(midIndex)}
    </>
  );
}

/* 커뮤니티 '자취 꿀팁' — 헤더·탭바·글쓰기 버튼·게시글 카드는 question 화면과 같은 레이아웃을
 * 그대로 쓴다 (카드는 CommunityPostCard, chips 행만 없음). 정렬 필터 대신 이 탭 전용
 * 서브탭(TipTiles, Figma tip 2257:13827)을 둔다. */
export function CommunityTipPage() {
  const navigation = useAppNavigation();
  const [writeOpen, setWriteOpen] = useState(false);
  const [category, setCategory] = useState<string>(TIP_CATEGORIES[0].id);
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const { ownPosts } = useCommunityPosts();
  /* 검색어가 서브탭 카테고리 이름(예: "인테리어")과 정확히 일치하면 그 서브탭으로
   * 자동 전환한다 — 이때 원래 보고 있던 카테고리를 기억해뒀다가, 검색어를 지우면
   * 그 탭으로 되돌아간다. 검색으로 전환된 상태가 아니면(수동으로 탭을 눌렀으면) null. */
  const previousCategoryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      if (previousCategoryRef.current !== null) {
        setCategory(previousCategoryRef.current);
        previousCategoryRef.current = null;
      }
      return;
    }
    /* '·'·공백을 지우고 비교해서, "고정"만 쳐도 "고정·관리"처럼 앞부분만 일치하면 전환된다 */
    const normalize = (value: string) => value.replace(/[·\s]/g, '').toLowerCase();
    const normalizedKeyword = normalize(trimmed);
    const matched = TIP_CATEGORIES.find((item) => normalize(item.label).startsWith(normalizedKeyword));
    if (matched && matched.id !== category) {
      if (previousCategoryRef.current === null) previousCategoryRef.current = category;
      setCategory(matched.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  /* 내가 쓴 글 중 같은 서브탭 카테고리 + 게시글종류가 "정보"인 것만 정적 목록 맨 앞에 붙인다.
   * "질문"·"후기"·"잡담"으로 쓴 글은 자취 꿀팁 취지(가르쳐주는 글)에 안 맞아 전체/질문 탭에만
   * 보이게 두고 여기서는 제외한다. 검색어는 이 서브탭 안에서 제목·미리보기·해시태그로
   * 한 번 더 좁힌다(카테고리 이름 자체를 검색하면 위 useEffect 가 이미 그 탭으로 옮겨준다). */
  const visiblePosts = useMemo(
    () =>
      mergeOwnPosts(
        TIP_POSTS.filter((post) => post.tipCategory === category),
        ownPosts,
        (post) => post.tipCategory === category && post.category === '정보',
      ).filter((post) => postMatchesKeyword(post, keyword)),
    [category, ownPosts, keyword],
  );

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="커뮤니티 홈으로"
        onBack={() => navigation?.goBack('community')}
      />

      <main className="community__scroll">
        {/* ============ 검색 — 커뮤니티 홈과 같은 입력창, 타이틀 문구는 없음 ============ */}
        <section className="community-search">
          <div className="community-search__input">
            <input
              ref={searchRef}
              type="search"
              value={keyword}
              placeholder="다른 자취러들의 꿀팁을 찾아보세요"
              aria-label="자취 꿀팁 검색"
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

        {/* ============ 탭 — '전체' / '게시판' 은 각자의 화면으로 돌아간다 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === COMMUNITY_TIP_TAB ? ' is-active' : ''}`}
              aria-current={name === COMMUNITY_TIP_TAB ? 'page' : undefined}
              onClick={() => {
                if (name === '전체') navigation?.navigate('community');
                else if (name === COMMUNITY_BOARD_TAB) navigation?.navigate('community-question');
                else if (name === '지역 후기') navigation?.navigate('community-region');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        {/* ============ 자취 꿀팁 전용 서브탭 ============ */}
        <div className="tip-categories" role="tablist" aria-label="자취 꿀팁 카테고리">
          {TIP_CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`tip-category${active ? ' is-active' : ''}`}
                onClick={() => {
                  /* 검색으로 자동 전환된 상태에서 직접 탭을 고르면, 검색어를 지웠을 때
                   * 예전 탭으로 되돌아가지 않고 지금 고른 탭을 그대로 유지한다 */
                  previousCategoryRef.current = null;
                  setCategory(item.id);
                }}
              >
                <span className="tip-category__circle">
                  <span
                    className="tip-category__badge"
                    style={{
                      maskImage: `url(${icon('jadu_community.svg')})`,
                      WebkitMaskImage: `url(${icon('jadu_community.svg')})`,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="tip-category__glyph"
                    style={{ maskImage: `url(${icon(item.icon)})`, WebkitMaskImage: `url(${icon(item.icon)})` }}
                    aria-hidden="true"
                  />
                </span>
                <span className="tip-category__label">{renderTipLabel(item.label)}</span>
              </button>
            );
          })}
        </div>

        {/* ============ 게시글 목록 — question 과 같은 카드, chips 행만 뺀다 ============ */}
        <section className="community-feed">
          <div className="community-feed__list">
            {visiblePosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                saved={bookmarks.isSaved(post.id)}
                liked={liked.includes(post.id)}
                onToggleSave={() => bookmarks.toggle(post.id)}
                onToggleLike={() => toggleLike(post.id)}
                showChips={false}
              />
            ))}
          </div>
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

export default CommunityTipPage;
