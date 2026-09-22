import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { CommunityWriteFab } from '../components/CommunityWriteFab';
import { SubPageHeader } from '../components/SubPageHeader';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityWritePanel } from '../components/CommunityWritePanel';
import { CommunitySearchDropdown, CommunitySearchToggleButton } from '../components/CommunitySearchDropdown';
import {
  COMMUNITY_BOARD_TAB,
  COMMUNITY_TABS,
  COMMUNITY_TIP_TAB,
  TIP_CATEGORIES,
  TIP_POSTS,
  mergeOwnPosts,
  postMatchesKeyword,
  resolveCommunityPostImage,
} from '../data/communityPosts';
import { icon } from '../lib/asset';

const tipImageCache = new Map<string, HTMLImageElement>();

/* 게시판 검색과 같은 방식 — 최근 검색어는 이 탭 전용 키로 따로 저장한다 */
const TIP_RECENT_SEARCHES_KEY = 'jaduya:community:tip-recent-searches';
const POPULAR_TIP_SEARCHES = ['관리비', '인테리어', '청소'] as const;

function loadRecentSearches(storageKey: string): string[] {
  try {
    const saved = window.sessionStorage.getItem(storageKey);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((term): term is string => typeof term === 'string' && term.trim().length > 0).slice(0, 3);
  } catch {
    return [];
  }
}

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
 * 그대로 쓴다 (카드는 CommunityPostCard, 해시태그 칩만 쓰고 카테고리 칩은 뺀다).
 * 정렬 필터 대신 이 탭 전용 서브탭(TipTiles, Figma tip 2257:13827)을 둔다. */
export function CommunityTipPage() {
  const navigation = useAppNavigation();
  const [writeOpen, setWriteOpen] = useState(false);
  const [category, setCategory] = useState<string>(TIP_CATEGORIES[0].id);
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches(TIP_RECENT_SEARCHES_KEY));
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
    for (const post of TIP_POSTS) {
      const src = resolveCommunityPostImage(post);
      if (!src || tipImageCache.has(src)) continue;
      const image = new Image();
      image.src = src;
      tipImageCache.set(src, image);
      void image.decode().catch(() => {});
    }
  }, []);

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

  const submitSearch = (term: string, saveToRecent: boolean) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setKeyword(trimmed);
    if (!saveToRecent) return;

    setRecentSearches((current) => {
      const next = [trimmed, ...current.filter((savedTerm) => savedTerm !== trimmed)].slice(0, 3);
      try {
        window.sessionStorage.setItem(TIP_RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // 저장 공간을 사용할 수 없는 환경에서도 검색 기능은 그대로 동작한다.
      }
      return next;
    });
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches((current) => {
      const next = current.filter((savedTerm) => savedTerm !== term);
      try {
        if (next.length > 0) {
          window.sessionStorage.setItem(TIP_RECENT_SEARCHES_KEY, JSON.stringify(next));
        } else {
          window.sessionStorage.removeItem(TIP_RECENT_SEARCHES_KEY);
        }
      } catch {
        // 저장 공간을 사용할 수 없는 환경에서도 삭제 결과는 현재 화면에 반영한다.
      }
      return next;
    });
  };

  /* 내가 쓴 정보 글을 해당 카테고리 앞에 붙이고 검색어로 좁힌다.
   * 카테고리별 카드를 계속 마운트해 탭 전환 때 img 요소를 재생성하지 않는다. */
  const postsByCategory = useMemo(
    () =>
      TIP_CATEGORIES.map((item) => ({
        id: item.id,
        posts: mergeOwnPosts(
          TIP_POSTS.filter((post) => post.tipCategory === item.id),
          ownPosts,
          (post) => post.tipCategory === item.id && post.category === '정보',
        ).filter((post) => postMatchesKeyword(post, keyword)),
      })),
    [ownPosts, keyword],
  );

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
            controls="community-tip-search"
            onToggle={() => setSearchOpen((open) => !open)}
          />
        )}
      />

      <main className="community__scroll">
        <div className="community-search-anchor">
        {/* ============ 탭 — '게시판' / '지역 후기'는 각자의 화면으로 이동한다 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === COMMUNITY_TIP_TAB ? ' is-active' : ''}`}
              aria-current={name === COMMUNITY_TIP_TAB ? 'page' : undefined}
              onClick={() => {
                /* 형제 화면도 Router history에 push한다. */
                if (name === COMMUNITY_BOARD_TAB) navigation?.navigateTab('community');
                else if (name === '지역 후기') navigation?.navigateTab('community-region');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        <CommunitySearchDropdown
          id="community-tip-search"
          open={searchOpen}
          value={keyword}
          placeholder="다른 자취러들의 꿀팁을 찾아보세요"
          label="자취 꿀팁 검색"
          onChange={setKeyword}
          onClose={() => setSearchOpen(false)}
          recentSearches={recentSearches}
          popularSearches={POPULAR_TIP_SEARCHES}
          onSearch={submitSearch}
          onRemoveRecentSearch={removeRecentSearch}
        />
        </div>

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

        {/* ============ 게시글 목록 — 숨긴 탭도 유지해 이미지 재생성을 막는다 ============ */}
        {postsByCategory.map(({ id, posts }) => (
          <section key={id} className="community-feed" hidden={id !== category}>
            <div className="community-feed__list">
              {posts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  saved={bookmarks.isSaved(post.id)}
                  liked={liked.includes(post.id)}
                  onToggleSave={() => bookmarks.toggle(post.id)}
                  onToggleLike={() => toggleLike(post.id)}
                  showCategoryChip={false}
                />
              ))}
            </div>
          </section>
        ))}
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
