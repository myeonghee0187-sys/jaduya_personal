import { icon, img } from '../lib/asset';
import type { CommunityPost } from '../data/communityPosts';

interface CommunityPostCardProps {
  post: CommunityPost;
  saved: boolean;
  liked: boolean;
  onToggleSave: () => void;
  onToggleLike: () => void;
}

/* 커뮤니티 게시글 카드 — Figma community_home 의 상단 PostCard (2203:13336) 하나로 통일한다.
 * 구조: chip 행 + 북마크 / 왼쪽 썸네일 + 오른쪽 제목·미리보기·작성자 / 좋아요·댓글 */
export function CommunityPostCard({
  post,
  saved,
  liked,
  onToggleSave,
  onToggleLike,
}: CommunityPostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card__chips">
        <span className="post-card__chip post-card__chip--tag">{post.hashtag}</span>
        <span className="post-card__chip post-card__chip--category">{post.category}</span>
        <button
          type="button"
          className={`post-card__bookmark${saved ? ' is-saved' : ''}`}
          aria-pressed={saved}
          aria-label={`${post.title} 저장`}
          onClick={onToggleSave}
        />
      </div>

      <div className="post-card__body">
        <img className="post-card__thumb" src={img(`community/${post.thumb}`)} alt="" />
        <div className="post-card__text">
          <h3 className="post-card__title">{post.title}</h3>
          <p className="post-card__preview">{post.preview}</p>
          <p className="post-card__author">
            <span className="post-card__badge" aria-hidden="true">
              {post.badge}
            </span>
            {post.author} · {post.time}
          </p>
        </div>
      </div>

      <div className="post-card__stats">
        {/* 좋아요는 누를 수 있는 버튼이다 — 자두 아이콘만 바뀌고 숫자 색은 그대로다 */}
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
      </div>
    </article>
  );
}

export default CommunityPostCard;
