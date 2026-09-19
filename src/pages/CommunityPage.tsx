import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import { useCommunityCommentCount } from '../community/communitySelectors';
import { BottomNavigation } from '../components/BottomNavigation';
import { CommunityWriteFab } from '../components/CommunityWriteFab';
import { SubPageHeader } from '../components/SubPageHeader';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityPostDetailPanel } from '../components/CommunityPostDetailPanel';
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
  const [boardView, setBoardView] = useState<CommunityBoardView>(() =>
    initialBoardView ?? (isBoardView(requestedView) ? requestedView : '전체'),
  );
  const [page, setPage] = useState(1);
  const [writeOpen, setWriteOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState<string | null>(() => navigation?.options.postId ?? null);
  const [keyword, setKeyword] = useState('');
  const [liked, setLiked] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLElement>(null);
  const bookmarks = useBookmarks();
  const { ownPosts } = useCommunityPosts();
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

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  const closeDetail = () => {
    if (navigation?.options.returnTo) {
      navigation.goBack('community');
      return;
    }
    setDetailPostId(null);
  };

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel={returnToCommunity ? '커뮤니티 홈으로' : '홈으로'}
        onBack={() => navigation?.goBack(returnToCommunity ? 'community' : 'home')}
      />

      <main className="community__scroll">
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === COMMUNITY_BOARD_TAB ? ' is-active' : ''}`}
              aria-current={name === COMMUNITY_BOARD_TAB ? 'page' : undefined}
              onClick={() => {
                /* 이 세 탭은 하단 탭바처럼 나란한 형제 화면이다 — navigate() 로 매번 쌓으면
                 * 탭을 오갈수록 시스템 뒤로가기를 그만큼 더 눌러야 커뮤니티를 벗어나게
                 * 되므로, 탭 전환 전용(navigateTab)으로 지금 쌓인 단계를 이 탭으로 대체한다. */
                if (name === COMMUNITY_BOARD_TAB && returnToCommunity) navigation?.navigateTab('community');
                else if (name === COMMUNITY_TIP_TAB) navigation?.navigateTab('community-tip');
                else if (name === '지역 후기') navigation?.navigateTab('community-region');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        <section className="community-search">
          <div className="community-search__input">
            <input
              ref={searchRef}
              type="search"
              value={keyword}
              placeholder="궁금한 자취 이야기를 검색해보세요"
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
                  <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <button type="button" className="community-search__icon" aria-label="검색">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </section>

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
                onClick={() => setBoardView(view.id)}
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
                  onOpenDetail={post.body ? () => setDetailPostId(post.id) : undefined}
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
      <CommunityPostDetailPanel
        post={allBoardPosts.find((item) => item.id === detailPostId) ?? null}
        open={detailPostId !== null}
        onClose={closeDetail}
        liked={detailPostId !== null && liked.includes(detailPostId)}
        onToggleLike={() => detailPostId && toggleLike(detailPostId)}
        saved={detailPostId !== null && bookmarks.isSaved(detailPostId)}
        onToggleSave={() => detailPostId && bookmarks.toggle(detailPostId)}
      />
    </div>
  );
}

export default CommunityPage;
