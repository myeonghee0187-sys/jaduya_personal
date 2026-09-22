import { icon } from '../lib/asset';
import { resolveCommunityPostImage } from '../data/communityPosts';
import type { CommunityPost } from '../data/communityPosts';

interface CommunityPostCardProps {
  post: CommunityPost;
  saved: boolean;
  liked: boolean;
  onToggleSave: () => void;
  onToggleLike: () => void;
  /** 상단 해시태그 칩 행 자체를 보여줄지 */
  showChips?: boolean;
  /** 칩 행 안에서 카테고리 칩까지 같이 보여줄지 — 자취 꿀팁은 해시태그만 쓴다 */
  showCategoryChip?: boolean;
  /** 게시글 상세보기 — 아직 일부 게시글에만 본문 데이터가 있어 선택적으로 넘긴다.
   * 없으면 카드는 지금처럼 제목/미리보기를 눌러도 반응하지 않는다. */
  onOpenDetail?: () => void;
}

/* 커뮤니티 게시글 카드 (Figma post-card 3907:24875).
 * 구조: 상단 = 태그·제목(왼쪽) / 정사각 썸네일(오른쪽, 북마크가 우측 상단에 겹쳐 얹힘)
 *       하단 = 좋아요·댓글(오른쪽 정렬) */
export function CommunityPostCard({
  post,
  saved,
  liked,
  onToggleSave,
  onToggleLike,
  showChips = true,
  showCategoryChip = true,
  onOpenDetail,
}: CommunityPostCardProps) {
  const postImage = resolveCommunityPostImage(post);

  return (
    <article
      className={`post-card${showChips ? '' : ' post-card--without-chips'}${onOpenDetail ? ' post-card--clickable' : ''}`}
      onClick={onOpenDetail}
    >
      <div className="post-card__body">
        <div className="post-card__content">
          {showChips && (
            <div className="post-card__chips">
              <span className="post-card__chip post-card__chip--tag">{post.hashtag}</span>
              {showCategoryChip && (
                <span className="post-card__chip post-card__chip--category">{post.category}</span>
              )}
            </div>
          )}
          <div className="post-card__text">
            <h3 className="post-card__title">{post.title}</h3>
          </div>
        </div>
        <div className="post-card__thumb-wrap">
          {postImage ? (
            <img className="post-card__thumb" src={postImage} alt="" />
          ) : (
            <span className="post-card__thumb post-card__thumb--placeholder" aria-hidden="true">
              {post.thumbEmoji}
            </span>
          )}
          <button
            type="button"
            className={`post-card__bookmark${saved ? ' is-saved' : ''}`}
            aria-pressed={saved}
            aria-label={`${post.title} 저장`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave();
            }}
          />
        </div>
      </div>

      <div className="post-card__meta">
        <span className="post-card__time">{post.time}</span>
        <div className="post-card__actions">
          <button
            type="button"
            className={`post-card__stat post-card__like${liked ? ' is-liked' : ''}`}
            aria-pressed={liked}
            aria-label={`${post.title} 좋아요`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleLike();
            }}
          >
            <img
              className="post-card__like-icon"
              src={icon(liked ? 'community-like.svg' : 'community-like-off.svg')}
              alt=""
            />
            <span className="post-card__like-count">{post.likes + (liked ? 1 : 0)}</span>
          </button>
          <span className="post-card__stat">
            <img src={icon('community-comment.svg')} alt="댓글" />
            {post.comments}
          </span>
        </div>
      </div>
    </article>
  );
}

export default CommunityPostCard;
