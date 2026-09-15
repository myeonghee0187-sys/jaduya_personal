import { useEffect, useState } from 'react';
import { icon, img } from '../lib/asset';
import { BellButton } from './BellButton';
import { HeaderIconButton } from './HeaderIconButton';
import { StatusBar } from './StatusBar';
import { useAuth } from '../auth/AuthContext';
import type { CommunityPost } from '../data/communityPosts';
import { COMMUNITY_COMMENTS } from '../data/communityComments';
import type { CommunityComment } from '../data/communityComments';
import { LEVEL_STAGES, PERSONA_PROFILE } from '../data/personaProfile';
import type { LevelValue } from '../data/personaProfile';

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

/** 내가 이번 세션에 새로 등록한 댓글 — 10개 제한과 무관하게 항상 보이고 NEW 표시가 붙는다.
 * 아바타는 mock 댓글처럼 이모지가 아니라 로그인 계정의 실제 프로필 사진을 쓴다. */
interface OwnComment {
  id: string;
  author: string;
  avatarImage: string;
  level: LevelValue;
  body: string;
  likes: number;
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

/** 기본으로 펼쳐 보여주는 댓글 수 — 이보다 많으면 '댓글 전체보기'로 접어둔다 */
const COLLAPSED_COMMENT_COUNT = 10;

type CommentSort = '최신' | '인기';

function levelIconFor(level: LevelValue): string {
  return img(`level_icon/${LEVEL_STAGES[level].iconFile}`);
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
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [sort, setSort] = useState<CommentSort>('최신');
  /** 게시글 id → 내가 이번 세션에 등록한 댓글. 다른 글로 넘어가도 서로 안 섞이게 id로 나눠 들고 있는다 */
  const [ownCommentsByPost, setOwnCommentsByPost] = useState<Record<string, OwnComment[]>>({});
  /** 이번 세션에 좋아요를 누른 댓글 id — mock·내 댓글 공통, id가 서로 겹치지 않아 하나로 관리한다 */
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);

  /* 다른 글을 열면 입력창·펼침·정렬 상태는 그 글의 새 상태로 시작한다 (내가 쓴 댓글은 글별로 남는다) */
  useEffect(() => {
    setExpanded(false);
    setDraft('');
    setSort('최신');
  }, [post?.id]);

  const toggleCommentLike = (id: string) =>
    setLikedCommentIds((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  const mockComments: CommunityComment[] = (post && COMMUNITY_COMMENTS[post.id]) || [];
  const sortedMockComments = sort === '인기' ? [...mockComments].sort((a, b) => b.likes - a.likes) : mockComments;
  const ownComments = (post && ownCommentsByPost[post.id]) || [];
  const visibleMockComments = expanded ? sortedMockComments : sortedMockComments.slice(0, COLLAPSED_COMMENT_COUNT);
  const hiddenCount = sortedMockComments.length - visibleMockComments.length;
  const totalCommentCount = mockComments.length + ownComments.length;

  const rows: CommentRow[] = [
    ...visibleMockComments.map((c) => ({ ...c, avatarEmoji: c.avatar, isNew: false })),
    ...ownComments.map((c) => ({ ...c, time: '방금 전', isNew: true })),
  ];

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text || !post) return;
    const persona = PERSONA_PROFILE[user?.persona ?? 'beginner'];
    const comment: OwnComment = {
      id: `own-${post.id}-${Date.now()}`,
      author: user?.name ?? '자두메이트',
      avatarImage: img(persona.profileImage),
      level: persona.level.level,
      body: text,
      likes: 0,
    };
    setOwnCommentsByPost((prev) => ({
      ...prev,
      [post.id]: [...(prev[post.id] ?? []), comment],
    }));
    setDraft('');
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
            <HeaderIconButton iconName="menu" label="게시글 닫기" open onClick={onClose} />
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
              <span className="post-detail__avatar" aria-hidden="true">
                {post.badge}
              </span>
              <span className="post-detail__author-text">
                <span className="post-detail__author-name">{post.author}</span>
                <span className="post-detail__author-meta">
                  {post.time} · 좋아요 {post.likes + (liked ? 1 : 0)} · 댓글 {totalCommentCount}
                </span>
              </span>
            </div>

            <div className="post-detail__divider" />

            <p className="post-detail__body">{post.body ?? post.preview}</p>

            {post.thumb && (
              <img className="post-detail__image" src={img(`community/${post.thumb}`)} alt="" />
            )}

            <div className="post-detail__comments">
              <div className="post-detail__comment-form">
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
                <div className="post-detail__comment-sort" role="group" aria-label="댓글 정렬">
                  {(['최신', '인기'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`post-detail__comment-sort-btn${sort === option ? ' is-active' : ''}`}
                      aria-pressed={sort === option}
                      onClick={() => setSort(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="post-detail__comment-list">
                {rows.map((row) => {
                  const commentLiked = likedCommentIds.includes(row.id);
                  return (
                    <li key={row.id} className="post-detail__comment">
                      <span className="post-detail__avatar post-detail__avatar--comment" aria-hidden="true">
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

              {!expanded && hiddenCount > 0 && (
                <button
                  type="button"
                  className="post-detail__comments-more"
                  onClick={() => setExpanded(true)}
                >
                  댓글 전체보기 ({hiddenCount}개 더보기)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CommunityPostDetailPanel;
