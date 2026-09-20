import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import { useCommunityCommentCount } from '../community/communitySelectors';
import { BottomNavigation } from '../components/BottomNavigation';
import { CommunityWriteFab } from '../components/CommunityWriteFab';
import { SubPageHeader } from '../components/SubPageHeader';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityWritePanel } from '../components/CommunityWritePanel';
import { CommunitySearchDropdown, CommunitySearchToggleButton } from '../components/CommunitySearchDropdown';
import {
  COMMUNITY_BOARD_TAB,
  COMMUNITY_POSTS,
  COMMUNITY_TABS,
  COMMUNITY_TIP_TAB,
  QUESTION_POSTS,
  mergeOwnPosts,
  postMatchesKeyword,
} from '../data/communityPosts';
import { icon } from '../lib/asset';

export type CommunityBoardView = '전체' | '인기' | '최신' | '정보' | '질문';

interface CommunityPageProps {
  /** 예전 community-question 진입점은 질문 필터를 선택한 게시판으로 연결한다. */
  initialBoardView?: CommunityBoardView;
  /** 하위 진입점에서 뒤로가면 커뮤니티 기본 화면으로 돌아간다. */
  returnToCommunity?: boolean;
}

const BOARD_VIEWS: ReadonlyArray<{ id: CommunityBoardView; icon: string }> = [
  /* 기존 잡담 아이콘을 전체 아이콘으로 재사용한다. */
  { id: '전체', icon: 'chat.svg' },
  { id: '인기', icon: 'community-fire.svg' },
  { id: '최신', icon: 'community-new.svg' },
  { id: '정보', icon: 'folder.svg' },
  { id: '질문', icon: 'megaphone.svg' },
];

const POSTS_PER_PAGE = 10;
const COMMUNITY_RECENT_SEARCHES_KEY = 'jaduya:community:recent-searches';
const POPULAR_COMMUNITY_SEARCHES = ['관리비', '인테리어', '식비'] as const;

function loadRecentSearches(): string[] {
  try {
    const saved = window.sessionStorage.getItem(COMMUNITY_RECENT_SEARCHES_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((term): term is string => typeof term === 'string' && term.trim().length > 0).slice(0, 3);
  } catch {
    return [];
  }
}

function isBoardView(value: string | undefined): value is CommunityBoardView {
  return BOARD_VIEWS.some((view) => view.id === value);
}

/** 상대 시간은 분 단위로 바꾸고, 날짜형 데이터는 상대 시간 뒤에서 최신 날짜순으로 정렬한다. */
function postAgeRank(time: string): number {
  if (time === '방금 전') return 0;
  const minutes = time.match(/^(\d+)분 전$/);
  if (minutes) return Number(minutes[1]);
  const hours = time.match(/^(\d+)시간 전$/);
  if (hours) return Number(hours[1]) * 60;
  if (time === '어제') return 24 * 60;
  const days = time.match(/^(\d+)일 전$/);
  if (days) return Number(days[1]) * 24 * 60;

  const dated = Date.parse(time.replace(/\./g, '-'));
  return Number.isNaN(dated) ? Number.MAX_SAFE_INTEGER : 10_000_000 - Math.floor(dated / 86_400_000);
}

/* 커뮤니티 기본 화면은 게시판이다. 상단의 전체 탭을 게시판 안으로 옮기고,
 * 게시판 / 자취 꿀팁 / 지역 후기 세 영역만 메인 탭으로 유지한다. */
export function CommunityPage({
  initialBoardView,
  returnToCommunity = false,
}: CommunityPageProps = {}) {
  const navigation = useAppNavigation();
  const requestedView = navigation?.options.tab;
  const boardView = isBoardView(requestedView) ? requestedView : initialBoardView ?? '전체';
  const [page, setPage] = useState(1);
  const [writeOpen, setWriteOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const feedRef = useRef<HTMLElement>(null);
  const bookmarks = useBookmarks();
  const { ownPosts, likedPostIds: liked, togglePostLike: toggleLike } = useCommunityPosts();
  const getCommentCount = useCommunityCommentCount();

  const allBoardPosts = useMemo(
    () =>
      mergeOwnPosts([...QUESTION_POSTS, ...COMMUNITY_POSTS], ownPosts).map((post) => ({
        ...post,
        comments: getCommentCount(post.id, post.comments),
      })),
    [ownPosts, getCommentCount],
  );

  const filteredPosts = useMemo(() => {
    let posts = allBoardPosts.filter((post) => postMatchesKeyword(post, keyword));

    if (boardView === '정보' || boardView === '질문') {
      posts = posts.filter((post) => post.category === boardView);
    }
    if (boardView === '인기') {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }
    if (boardView === '최신') {
      return [...posts].sort((a, b) => postAgeRank(a.time) - postAgeRank(b.time));
    }
    return posts;
  }, [allBoardPosts, boardView, keyword]);

  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const visiblePosts = useMemo(
    () => filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE),
    [filteredPosts, page],
  );

  useEffect(() => {
    setPage(1);
  }, [boardView, keyword]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const submitSearch = (term: string, saveToRecent: boolean) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setKeyword(trimmed);
    if (!saveToRecent) return;

    setRecentSearches((current) => {
      const next = [trimmed, ...current.filter((savedTerm) => savedTerm !== trimmed)].slice(0, 3);
      try {
        window.sessionStorage.setItem(COMMUNITY_RECENT_SEARCHES_KEY, JSON.stringify(next));
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
          window.sessionStorage.setItem(COMMUNITY_RECENT_SEARCHES_KEY, JSON.stringify(next));
        } else {
          window.sessionStorage.removeItem(COMMUNITY_RECENT_SEARCHES_KEY);
        }
      } catch {
        // 저장 공간을 사용할 수 없는 환경에서도 삭제 결과는 현재 화면에 반영한다.
      }
      return next;
    });
  };

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        preserveBellPlacement
        actions={(
          <CommunitySearchToggleButton
            open={searchOpen}
            controls="community-board-search"
            onToggle={() => setSearchOpen((open) => !open)}
          />
        )}
      />

      <main className="community__scroll">
        <div className="community-search-anchor">
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === COMMUNITY_BOARD_TAB ? ' is-active' : ''}`}
              aria-current={name === COMMUNITY_BOARD_TAB ? 'page' : undefined}
              onClick={() => {
                /* 형제 화면 이동도 URL history에 push한다. */
                if (name === COMMUNITY_BOARD_TAB && returnToCommunity) navigation?.navigateTab('community');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigateTab('community-tip');
                else if (name === '지역 후기') navigation?.navigateTab('community-region');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        <CommunitySearchDropdown
          id="community-board-search"
          open={searchOpen}
          value={keyword}
          placeholder="궁금한 자취 이야기를 검색해보세요"
          label="게시판 검색"
          onChange={setKeyword}
          onClose={() => setSearchOpen(false)}
          recentSearches={recentSearches}
          popularSearches={POPULAR_COMMUNITY_SEARCHES}
          onSearch={submitSearch}
          onRemoveRecentSearch={removeRecentSearch}
        />
        </div>

        <div className="board-type-filter" role="tablist" aria-label="게시판 분류">
          {BOARD_VIEWS.map((view) => {
            const active = view.id === boardView;
            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`board-type-filter__btn${active ? ' is-active' : ''}`}
                onClick={() => navigation?.navigate(view.id === '질문' ? 'community-question' : 'community',
                  view.id === '전체' || view.id === '질문' ? {} : { tab: view.id })}
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
                    style={{ maskImage: `url(${icon(view.icon)})`, WebkitMaskImage: `url(${icon(view.icon)})` }}
                    aria-hidden="true"
                  />
                </span>
                <span className="board-type-filter__label">{view.id}</span>
              </button>
            );
          })}
        </div>

        <section className="community-feed" ref={feedRef}>
          {visiblePosts.length === 0 ? (
            <div className="community-feed__empty">검색 결과가 없어요.</div>
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
                  onOpenDetail={post.body ? () => navigation?.navigate('community', { postId: post.id }) : undefined}
                />
              ))}
            </div>
          )}

          {filteredPosts.length > POSTS_PER_PAGE && (
            <div className="post-detail__comment-pages" role="navigation" aria-label="게시글 페이지">
              <button
                type="button"
                className="post-detail__comment-page-arrow"
                aria-label="이전 게시글 페이지"
                disabled={page === 1}
                onClick={() => goToPage(Math.max(1, page - 1))}
              >
                <img
                  src={icon('chevron-right-thin.svg')}
                  alt=""
                  className="post-detail__comment-page-arrow-icon post-detail__comment-page-arrow-icon--prev"
                />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  className={`post-detail__comment-page${number === page ? ' is-active' : ''}`}
                  aria-current={number === page ? 'page' : undefined}
                  onClick={() => goToPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                className="post-detail__comment-page-arrow"
                aria-label="다음 게시글 페이지"
                disabled={page === pageCount}
                onClick={() => goToPage(Math.min(pageCount, page + 1))}
              >
                <img src={icon('chevron-right-thin.svg')} alt="" className="post-detail__comment-page-arrow-icon" />
              </button>
            </div>
          )}
        </section>
      </main>

      <CommunityWriteFab onClick={() => setWriteOpen(true)} />
      <BottomNavigation activeTab="community" />
      <CommunityWritePanel open={writeOpen} onClose={() => setWriteOpen(false)} />

    </div>
  );
}

export default CommunityPage;
