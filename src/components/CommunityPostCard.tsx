import { icon, img } from '../lib/asset';
import type { CommunityPost } from '../data/communityPosts';

interface CommunityPostCardProps {
  post: CommunityPost;
  saved: boolean;
  liked: boolean;
  onToggleSave: () => void;
  onToggleLike: () => void;
}

/* 커뮤니티 게시글 카드.
 * 구조: 상단 = 작성자(왼쪽) / 좋아요·댓글·북마크(오른쪽) 한 줄
 *       하단 = 제목·미리보기·chip(왼쪽) / 정사각 썸네일(오른쪽) */
export function CommunityPostCard({
  post,
  saved,
  liked,
  onToggleSave,
  onToggleLike,
}: CommunityPostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card__header">
        <p className="post-card__author">
          <span className="post-card__badge" aria-hidden="true">
            {post.badge}
          </span>
          {post.author} · {post.time}
        </p>

        <div className="post-card__meta">
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
          <span className="post-card__stat">
            <img src={icon('community-comment.svg')} alt="댓글" />
            {post.comments}
          </span>
          <button
            type="button"
            className={`post-card__bookmark${saved ? ' is-saved' : ''}`}
            aria-pressed={saved}
            aria-label={`${post.title} 저장`}
            onClick={onToggleSave}
          />
        </div>
      </div>

      <div className="post-card__body">
        <div className="post-card__text">
          <h3 className="post-card__title">{post.title}</h3>
          <p className="post-card__preview">{post.preview}</p>
          <div className="post-card__chips">
            <span className="post-card__chip post-card__chip--tag">{post.hashtag}</span>
            <span className="post-card__chip post-card__chip--category">{post.category}</span>
          </div>
        </div>
        <img className="post-card__thumb" src={img(`community/${post.thumb}`)} alt="" />
      </div>
    </article>
  );
}

export default CommunityPostCard;
