import { useLayoutEffect, useRef, useState } from 'react';
import { icon } from '../lib/asset';
import { authorBadgeColor } from '../lib/authorBadgeColor';
import { resolveCommunityPostImage } from '../data/communityPosts';
import type { CommunityPost } from '../data/communityPosts';

interface CommunityPostCardProps {
  post: CommunityPost;
  saved: boolean;
  liked: boolean;
  onToggleSave: () => void;
  onToggleLike: () => void;
  /** 자취 꿀팁 화면은 hashtag·category 칩 행이 없다 (Figma tip 2257:13827) */
  showChips?: boolean;
  /** 게시글 상세보기 — 아직 일부 게시글에만 본문 데이터가 있어 선택적으로 넘긴다.
   * 없으면 카드는 지금처럼 제목/미리보기를 눌러도 반응하지 않는다. */
  onOpenDetail?: () => void;
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
  showChips = true,
  onOpenDetail,
}: CommunityPostCardProps) {
  const postImage = resolveCommunityPostImage(post);
  const titleRef = useRef<HTMLHeadingElement>(null);
  /* 제목이 실제로 1줄로 끝났는지(줄바꿈 없이) 재서, 그럴 때만 미리보기 위 여백을 살짝 준다.
   * -webkit-line-clamp 는 최대 줄 수만 제한할 뿐 실제 줄 수는 알려주지 않아서 직접 잰다. */
  const [titleSingleLine, setTitleSingleLine] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const el = titleRef.current;
      if (!el) return;
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      if (!lineHeight) return;
      setTitleSingleLine(Math.round(el.scrollHeight / lineHeight) <= 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [post.title]);

  return (
    <article
      className={`post-card${titleSingleLine ? ' post-card--title-single-line' : ''}${onOpenDetail ? ' post-card--clickable' : ''}`}
      onClick={onOpenDetail}
    >
      <div className="post-card__header">
        <p className="post-card__author">
          <span
            className="post-card__badge"
            style={post.badgeImage ? undefined : { backgroundColor: authorBadgeColor(post.author) }}
            aria-hidden="true"
          >
            {post.badgeImage ? <img src={post.badgeImage} alt="" /> : post.badge}
          </span>
          {post.author} · {post.time}
        </p>

        <div className="post-card__meta">
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

      <div className="post-card__body">
        <div className="post-card__text">
          <h3 className="post-card__title" ref={titleRef}>{post.title}</h3>
          {/* 임시 비활성화 (검토 중) — 되돌리려면 이 주석만 풀면 된다 */}
          {/* <p className="post-card__preview">{post.preview}</p> */}
          {showChips && (
            <div className="post-card__chips">
              <span className="post-card__chip post-card__chip--tag">{post.hashtag}</span>
              <span className="post-card__chip post-card__chip--category">{post.category}</span>
            </div>
          )}
        </div>
        {postImage ? (
          <img className="post-card__thumb" src={postImage} alt="" />
        ) : (
          <span className="post-card__thumb post-card__thumb--placeholder" aria-hidden="true">
            {post.thumbEmoji}
          </span>
        )}
      </div>
    </article>
  );
}

export default CommunityPostCard;
