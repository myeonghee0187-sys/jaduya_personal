import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { icon, img } from '../lib/asset';
import { authorBadgeColor } from '../lib/authorBadgeColor';
import { BellButton } from './BellButton';
import { StatusBar } from './StatusBar';
import { useAuth } from '../auth/AuthContext';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import type { OwnComment } from '../community/CommunityPostsContext';
import type { CommunityPost } from '../data/communityPosts';
import { COMMUNITY_COMMENTS } from '../data/communityComments';
import type { CommunityComment } from '../data/communityComments';
import { LEVEL_STAGES, PERSONA_PROFILE } from '../data/personaProfile';
import type { LevelValue } from '../data/personaProfile';
import { useDismissOnBack } from '../navigation/useDismissOnBack';

interface CommunityPostDetailPanelProps {
  post: CommunityPost | null;
  open: boolean;
  onClose: () => void;
  /** 이 게시글 자체의 좋아요·저장 — 카드 목록과 같은 상태를 공유한다 */
  liked: boolean;
  onToggleLike: () => void;
  saved: boolean;
  onToggleSave: () => void;
}

/** 목록에 보여줄 댓글 하나 — mock 댓글과 내가 쓴 댓글을 같은 모양으로 그리기 위한 공통 형태.
 * 아바타는 이모지(avatarEmoji) 또는 프로필 사진(avatarImage) 중 하나만 채워진다. */
interface CommentRow {
  id: string;
  author: string;
  avatarEmoji?: string;
  avatarImage?: string;
  level: LevelValue;
  body: string;
  time: string;
  likes: number;
  isNew: boolean;
}

/** 한 페이지에 보여주는 댓글 수 — 이보다 많으면 페이지 번호로 나눠 넘겨본다 */
const COMMENTS_PER_PAGE = 10;

type CommentSort = '최신' | '인기';

function levelIconFor(level: LevelValue): string {
  return img(`level_icon/${LEVEL_STAGES[level].iconFile}`);
}

/* mock 댓글 배열은 이미 최신순으로 작성돼 있다(실제 타임스탬프가 없어 배열 순서를 그대로 쓴다).
 * 내가 쓴 댓글은 좋아요 0개로 시작한다 — 정렬 방식에 따라 위치가 달라진다:
 * 최신 탭: 방금 쓴 거라 맨 앞(여러 개면 가장 최근에 쓴 게 더 앞)
 * 인기 탭: mock 댓글과 합쳐서 좋아요 수로 다시 정렬 — 자연히 뒤로 밀려도 된다.
 * handleSubmit 에서 "방금 쓴 댓글이 몇 번째 페이지에 놓이는지" 미리 계산할 때도 그대로 재사용한다. */
function buildAllRows(
  sortMode: CommentSort,
  mockComments: CommunityComment[],
  ownComments: OwnComment[],
): CommentRow[] {
  return sortMode === '인기'
    ? [
        ...mockComments.map((c) => ({ ...c, avatarEmoji: c.avatar, isNew: false })),
        ...ownComments.map((c) => ({ ...c, time: '방금 전', isNew: true })),
      ].sort((a, b) => b.likes - a.likes)
    : [
        ...[...ownComments].reverse().map((c) => ({ ...c, time: '방금 전', isNew: true })),
        ...mockComments.map((c) => ({ ...c, avatarEmoji: c.avatar, isNew: false })),
      ];
}

/* 게시글 상세보기 — 커뮤니티 글쓰기 패널(CommunityWritePanel)과 같은 방식으로
 * 오른쪽에서 슬라이드인하는 오버레이다. 실제 라우트 이동이 아니라 지금 탭 위에 뜬다.
 * 아직 일부 게시글(post.body 있는 것)에만 적용 — post 가 null 이면 그냥 안 그린다.
 * 레이아웃은 참고 이미지의 구조(카테고리 태그 → 제목 → 작성자 → 구분선 → 본문 → 이미지)만
 * 그대로 가져오고, 실제 콘텐츠는 이 앱의 커뮤니티 데이터를 그대로 쓴다. */
export function CommunityPostDetailPanel({
  post,
  open,
  onClose,
  liked,
  onToggleLike,
  saved,
  onToggleSave,
}: CommunityPostDetailPanelProps) {
  const { user } = useAuth();
  /* 열려 있는 동안 뒤로가기 한 단계를 가져간다 — 시스템 뒤로가기가 오면 이 상세부터 닫는다.
   * onClose(=closeDetail)는 딥링크로 들어왔을 때의 returnTo 복귀 로직도 그대로 갖고 있다. */
  useDismissOnBack(open, onClose);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('');
  /** 항상 인기 탭으로 시작한다 */
  const [sort, setSort] = useState<CommentSort>('인기');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  /** 게시글 id → 내가 등록한 댓글 — CommunityPostsContext 가 로그인 계정별로 영속화해서
   * 관리한다(이 컴포넌트가 닫히거나 언마운트돼도, 새로고침해도 사라지지 않는다). */
  const { ownCommentsByPost, addComment } = useCommunityPosts();
  /** 이번 세션에 좋아요를 누른 댓글 id — mock·내 댓글 공통, id가 서로 겹치지 않아 하나로 관리한다 */
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  /** 방금 등록한 댓글 id — 렌더 후 그 댓글로 스크롤하고 나면 비운다 */
  const [scrollToCommentId, setScrollToCommentId] = useState<string | null>(null);
  /** 페이지 번호 줄(post-detail__comment-pages) — 번호·화살표를 눌렀을 때 이 줄의 화면상
   * 위치를 그대로 유지하기 위한 기준점으로 쓴다. */
  const commentPagesRef = useRef<HTMLDivElement>(null);
  /** 번호·화살표 클릭 직전, 페이지 번호 줄의 화면상 y좌표 — 페이지가 바뀌어 댓글 목록
   * 높이가 달라져도 이 줄만은 같은 자리에 있는 것처럼 보이도록 다음 layout effect에서
   * 스크롤을 보정하는 데 쓴다. null 이면(등록 후 이동 등 다른 경로) 보정하지 않는다. */
  const pageScrollAnchorRef = useRef<number | null>(null);

  const goToPage = (updater: number | ((current: number) => number)) => {
    pageScrollAnchorRef.current = commentPagesRef.current?.getBoundingClientRect().top ?? null;
    setPage(updater);
  };

  /* 페이지 번호 줄의 화면상 위치를 고정된 것처럼 보이게 하는 보정 — 브라우저가 그리기
   * 전에(useLayoutEffect) 새 위치와 클릭 직전 위치의 차이만큼 스크롤을 옮겨서, 번호 줄은
   * 제자리에 있고 그 위 댓글 목록만 바뀐 것처럼 보이게 한다. position:sticky 처럼 항상
   * 고정된 게 아니라 페이지 전환 순간에만 동작 — 평소 스크롤은 그대로 자연스럽게 움직인다. */
  useLayoutEffect(() => {
    const anchorTop = pageScrollAnchorRef.current;
    pageScrollAnchorRef.current = null;
    if (anchorTop === null) return;
    const pagesEl = commentPagesRef.current;
    const scrollEl = pagesEl?.closest('.post-detail__scroll');
    if (!pagesEl || !scrollEl) return;
    const delta = pagesEl.getBoundingClientRect().top - anchorTop;
    if (delta !== 0) scrollEl.scrollTop += delta;
  }, [page]);

  /* 다른 글을 열면 입력창·페이지·정렬 상태는 그 글의 새 상태로 시작한다 (내가 쓴 댓글은 글별로 남는다) */
  useEffect(() => {
    setPage(1);
    setDraft('');
    setSort('인기');
    setSortOpen(false);
  }, [post?.id]);

  /* 방금 등록한 댓글 페이지로 넘어간 뒤, 그 댓글 엘리먼트가 그려지면 화면에 보이도록 스크롤한다.
   * 그 댓글이 목록의 맨 마지막 줄(인기 탭에서 좋아요 0개로 밀린 경우)이면, 댓글만 하단에 맞추면
   * 그 아래 페이지 번호(1 2 3 4) 버튼이 화면 밖으로 밀려나 답답해 보인다 — 페이지 번호 영역까지
   * 포함해서 하단에 맞춘다. 맨 마지막 줄이 아니면(최신 탭처럼 맨 위에 오는 경우) 댓글 자체로 맞춘다.
   * 번호·화살표로 직접 페이지를 옮기는 건 이 조건(scrollToCommentId)에 안 걸려서 스크롤을
   * 건드리지 않는다 — 누를 때마다 화면이 움직이면 오히려 거슬린다. */
  useEffect(() => {
    if (!scrollToCommentId) return;
    const el = document.querySelector(`[data-comment-id="${scrollToCommentId}"]`);
    if (el) {
      const isLastInList = el.parentElement?.lastElementChild === el;
      const pagesEl = document.querySelector('.post-detail__comment-pages');
      const scrollTarget = isLastInList && pagesEl ? pagesEl : el;
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    setScrollToCommentId(null);
  }, [scrollToCommentId, page]);

  /* 정렬 드롭다운 바깥을 누르면 닫는다 (다른 커뮤니티 필터와 동일한 동작) */
  useEffect(() => {
    if (!sortOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [sortOpen]);

  const toggleCommentLike = (id: string) =>
    setLikedCommentIds((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  const mockComments: CommunityComment[] = (post && COMMUNITY_COMMENTS[post.id]) || [];
  const ownComments = (post && ownCommentsByPost[post.id]) || [];
  const totalCommentCount = mockComments.length + ownComments.length;

  const allRows = buildAllRows(sort, mockComments, ownComments);
  const pageCount = Math.max(1, Math.ceil(allRows.length / COMMENTS_PER_PAGE));
  const rows = allRows.slice((page - 1) * COMMENTS_PER_PAGE, page * COMMENTS_PER_PAGE);

  /* 이미지를 본문 첫 문단 바로 아래에 넣기 위해 문단 단위(빈 줄 기준)로 쪼갠다 */
  const bodyParagraphs = (post?.body ?? post?.preview ?? '').split('\n\n');
  const [firstParagraph, ...restParagraphs] = bodyParagraphs;

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text || !post) return;
    const persona = PERSONA_PROFILE[user?.persona ?? 'beginner'];
    const comment: OwnComment = {
      id: `own-${post.id}-${Date.now()}`,
      postId: post.id,
      author: user?.name ?? '자두메이트',
      authorId: user?.email,
      avatarImage: img(persona.profileImage),
      level: persona.level.level,
      body: text,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const nextOwnComments = [...ownComments, comment];
    addComment(comment);
    setDraft('');

    /* 방금 쓴 댓글이 지금 정렬 방식에서 몇 번째 줄에 놓이는지 미리 계산해서,
     * 그 댓글이 있는 페이지로 바로 넘어가고 스크롤도 그 댓글로 이동시킨다 */
    const nextRows = buildAllRows(sort, mockComments, nextOwnComments);
    const index = nextRows.findIndex((row) => row.id === comment.id);
    const targetPage = index === -1 ? 1 : Math.floor(index / COMMENTS_PER_PAGE) + 1;
    setPage(targetPage);
    setScrollToCommentId(comment.id);
  };

  return (
    <section className="layer post-detail" hidden={!open} aria-label="게시글 상세보기">
      <div className="post-detail__header">
        <StatusBar />
        <div className="nav-header">
          <div className="post-detail__title-button">
            <button type="button" className="post-detail__back" aria-label="뒤로" onClick={onClose}>
              <img src={icon('gnb-back.svg')} alt="" />
            </button>
            <span className="post-detail__title">게시글</span>
          </div>
          <div className="header-actions">
            <BellButton />
            {/* 커뮤니티 게시글 상세 전용 닫기 — SubPageHeader 의 X 버튼과 같은 규격 */}
            <button type="button" className="header-icon-button" aria-label="게시글 닫기" onClick={onClose}>
              <img src={icon('gnb-close.svg')} alt="" />
            </button>
          </div>
        </div>
      </div>

      {post && (
        <div className="post-detail__scroll">
          <div className="post-detail__content">
            <div className="post-detail__tags">
              <span className="post-detail__tag post-detail__tag--hashtag">{post.hashtag}</span>
              <span className="post-detail__tag post-detail__tag--category">{post.category}</span>
            </div>

            <h1 className="post-detail__heading">{post.title}</h1>

            <div className="post-detail__author-row">
              <span
                className="post-detail__avatar"
                style={post.badgeImage ? undefined : { backgroundColor: authorBadgeColor(post.author) }}
                aria-hidden="true"
              >
                {post.badgeImage ? <img src={post.badgeImage} alt="" /> : post.badge}
              </span>
              <span className="post-detail__author-text">
                <span className="post-detail__author-name">{post.author}</span>
                <span className="post-detail__author-meta">
                  {post.time} · 좋아요 {post.likes + (liked ? 1 : 0)} · 댓글 {totalCommentCount}
                </span>
              </span>
              <div className="post-detail__comment-form-toolbar">
                <button
                  type="button"
                  className={`post-card__stat post-card__like${liked ? ' is-liked' : ''}`}
                  aria-pressed={liked}
                  aria-label={`${post.title} 좋아요`}
                  onClick={onToggleLike}
                >
                  <img
                    className="post-card__like-icon"
                    src={icon(liked ? 'community-like.svg' : 'community-like-off.svg')}
                    alt=""
                  />
                  <span className="post-card__like-count">{post.likes + (liked ? 1 : 0)}</span>
                </button>
                <button
                  type="button"
                  className={`post-card__bookmark${saved ? ' is-saved' : ''}`}
                  aria-pressed={saved}
                  aria-label={`${post.title} 저장`}
                  onClick={onToggleSave}
                />
              </div>
            </div>

            <div className="post-detail__divider" />

            <p className="post-detail__body">{firstParagraph}</p>

            {(post.thumbDataUrl || post.thumb) && (
              <img
                className="post-detail__image"
                src={post.thumbDataUrl ?? img(`community/${post.thumb}`)}
                alt=""
              />
            )}

            {restParagraphs.length > 0 && (
              <p className="post-detail__body post-detail__body--rest">{restParagraphs.join('\n\n')}</p>
            )}

            <div className="post-detail__comments">
              <div className="post-detail__comment-form">
                <div className="post-detail__comment-form-row">
                  <input
                    type="text"
                    className="post-detail__comment-input"
                    placeholder="댓글을 남겨보세요"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSubmit();
                    }}
                  />
                  <button
                    type="button"
                    className="post-detail__comment-submit"
                    disabled={draft.trim() === ''}
                    onClick={handleSubmit}
                  >
                    등록
                  </button>
                </div>
              </div>

              <div className="post-detail__comments-head">
                <h2 className="post-detail__comments-heading">댓글 {totalCommentCount}</h2>
                <div className="community-filter" ref={sortRef}>
                  <button
                    type="button"
                    className="community-filter__button"
                    aria-expanded={sortOpen}
                    aria-haspopup="listbox"
                    onClick={() => setSortOpen((next) => !next)}
                  >
                    {sort}
                    <span className="community-filter__button-arrow" aria-hidden="true" />
                  </button>
                  <ul className="community-filter__list" role="listbox" hidden={!sortOpen}>
                    {(['최신', '인기'] as const).map((option) => (
                      <li key={option} role="option" aria-selected={option === sort}>
                        <button
                          type="button"
                          className={option === sort ? 'is-selected' : undefined}
                          onClick={() => {
                            setSort(option);
                            setPage(1);
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

              <ul className="post-detail__comment-list">
                {rows.map((row) => {
                  const commentLiked = likedCommentIds.includes(row.id);
                  return (
                    <li key={row.id} className="post-detail__comment" data-comment-id={row.id}>
                      <span
                        className="post-detail__avatar post-detail__avatar--comment"
                        style={row.avatarImage ? undefined : { backgroundColor: authorBadgeColor(row.author) }}
                        aria-hidden="true"
                      >
                        {row.avatarImage ? <img src={row.avatarImage} alt="" /> : row.avatarEmoji}
                      </span>
                      <div className="post-detail__comment-body">
                        <div className="post-detail__comment-head">
                          <span className="post-detail__comment-author">{row.author}</span>
                          <img
                            className="post-detail__comment-level-icon"
                            src={levelIconFor(row.level)}
                            alt={`Level ${row.level} · ${LEVEL_STAGES[row.level].name}`}
                          />
                          {row.isNew && <span className="post-detail__comment-new">NEW</span>}
                          <span className="post-detail__comment-time">{row.time}</span>
                        </div>
                        <p className="post-detail__comment-text">{row.body}</p>
                        <button
                          type="button"
                          className={`post-detail__comment-like${commentLiked ? ' is-liked' : ''}`}
                          aria-pressed={commentLiked}
                          aria-label={`${row.author} 댓글 좋아요`}
                          onClick={() => toggleCommentLike(row.id)}
                        >
                          <img
                            src={icon(commentLiked ? 'community-like.svg' : 'community-like-off.svg')}
                            alt=""
                          />
                          <span>{row.likes + (commentLiked ? 1 : 0)}</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {pageCount > 1 && (
                <div className="post-detail__comment-pages" role="navigation" aria-label="댓글 페이지" ref={commentPagesRef}>
                  <button
                    type="button"
                    className="post-detail__comment-page-arrow"
                    aria-label="이전 댓글 페이지"
                    disabled={page === 1}
                    onClick={() => goToPage((current) => Math.max(1, current - 1))}
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
                    aria-label="다음 댓글 페이지"
                    disabled={page === pageCount}
                    onClick={() => goToPage((current) => Math.min(pageCount, current + 1))}
                  >
                    <img src={icon('chevron-right-thin.svg')} alt="" className="post-detail__comment-page-arrow-icon" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CommunityPostDetailPanel;
