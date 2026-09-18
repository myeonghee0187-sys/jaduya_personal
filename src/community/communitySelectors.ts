import { useMemo } from 'react';
import { useCommunityPosts } from './CommunityPostsContext';
import { COMMUNITY_POSTS, QUESTION_POSTS, TIP_POSTS, REGION_POSTS } from '../data/communityPosts';
import type { CommunityPost } from '../data/communityPosts';
import { COMMUNITY_COMMENTS } from '../data/communityComments';

/* 마이페이지 "나의 활동"·저장한 정보처럼 커뮤니티 화면 밖에서 "전체 게시글/댓글"이
 * 필요한 곳에서 쓰는 통합 조회 helper. 정적 mock 데이터(여러 화면별 배열로 나뉜 게시글,
 * 게시글별로 나뉜 댓글)와 CommunityPostsContext 의 공용 사용자 작성 데이터를 한 번만
 * 합쳐서 내려준다 — 화면마다 각자 합치는 로직을 새로 짜지 않는다. */

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return Array.from(map.values());
}

/** 화면별로 나뉜 정적 게시글 배열(게시판/자취 꿀팁/지역 후기)을 한 번만 합친다.
 * 배열마다 id 접두어가 달라 실제로는 겹치지 않지만, 만약을 대비해 id 기준으로 정리한다. */
const ALL_STATIC_POSTS: CommunityPost[] = dedupeById([
  ...COMMUNITY_POSTS,
  ...QUESTION_POSTS,
  ...TIP_POSTS,
  ...REGION_POSTS,
]);

/** CommunityPage(홈 탭)가 실제로 상세 화면을 열 수 있는 게시글 id — COMMUNITY_POSTS
 * (+ 사용자가 새로 쓴 글)만 해당한다. 게시판/자취 꿀팁/지역 후기 전용 정적 글은 그 화면
 * 자체에 아직 상세 진입 기능이 없어서(기존 앱의 제한이라 이번 작업에서 새로 만들지
 * 않는다), 저장한 정보에서 그런 글을 눌렀을 때는 상세로 보내는 대신 안내만 띄운다. */
const ROUTABLE_STATIC_POST_IDS = new Set(COMMUNITY_POSTS.map((post) => post.id));

/** 마이페이지 댓글 탭 등에서 쓰는 공통 댓글 모양 — 정적 mock 댓글(CommunityComment)과
 * 사용자가 쓴 댓글(OwnComment)은 필드가 조금씩 달라서(avatar/avatarImage, time/createdAt)
 * 화면에서 실제로 쓰는 값만 모아 하나의 형태로 맞춘다. */
export interface CommunityCommentEntry {
  id: string;
  postId: string;
  author: string;
  authorId?: string;
  body: string;
  time: string;
  likes: number;
}

const ALL_STATIC_COMMENTS: CommunityCommentEntry[] = Object.entries(COMMUNITY_COMMENTS).flatMap(
  ([postId, comments]) =>
    comments.map((comment) => ({
      id: comment.id,
      postId,
      author: comment.author,
      authorId: comment.authorId,
      body: comment.body,
      time: comment.time,
      likes: comment.likes,
    })),
);

/** 정적 게시글 + 사용자가 실제로 작성한 게시글(공용, 작성자 무관) 전체.
 * "authorId === 로그인 사용자 email" 로 다시 필터링하면 마이페이지 "작성한 글"이 된다. */
export function useAllCommunityPosts(): CommunityPost[] {
  const { userPosts } = useCommunityPosts();
  return useMemo(() => dedupeById([...userPosts, ...ALL_STATIC_POSTS]), [userPosts]);
}

/** 정적 댓글 + 사용자가 실제로 작성한 댓글(공용, 작성자 무관) 전체.
 * "authorId === 로그인 사용자 email" 로 다시 필터링하면 마이페이지 "댓글"이 된다. */
export function useAllCommunityComments(): CommunityCommentEntry[] {
  const { userComments } = useCommunityPosts();
  return useMemo(() => {
    const mapped = userComments.map<CommunityCommentEntry>((comment) => ({
      id: comment.id,
      postId: comment.postId,
      author: comment.author,
      authorId: comment.authorId,
      body: comment.body,
      time: '방금 전',
      likes: comment.likes,
    }));
    return dedupeById([...mapped, ...ALL_STATIC_COMMENTS]);
  }, [userComments]);
}

/** 이 게시글 id 를 눌렀을 때 기존 커뮤니티 상세 화면(CommunityPage 의
 * CommunityPostDetailPanel)으로 안전하게 이동할 수 있는지 — 사용자가 새로 쓴 글은
 * 항상 가능하고, 정적 글은 COMMUNITY_POSTS(게시판 원본)에 있는 것만 가능하다. */
export function useIsCommunityDetailRoutable(): (postId: string) => boolean {
  const { userPosts } = useCommunityPosts();
  return useMemo(() => {
    const userPostIds = new Set(userPosts.map((post) => post.id));
    return (postId: string) => ROUTABLE_STATIC_POST_IDS.has(postId) || userPostIds.has(postId);
  }, [userPosts]);
}

/** 게시글의 실제 댓글 수 — 커뮤니티 목록 카드의 댓글 숫자, 마이페이지 "작성한 글"의
 * 댓글 수를 게시글 상세(CommunityPostDetailPanel)가 이미 쓰는 것과 같은 기준으로
 * 맞추기 위한 helper. 정적 댓글(COMMUNITY_COMMENTS) + 실시간 사용자 댓글(userComments)
 * 을 합친 실제 개수를 반환한다.
 *
 * 다만 대부분의 정적 게시글(20여 개)은 실제 댓글 배열 없이 post.comments 라는 "장식용
 * 숫자"만 갖고 있다 — 그런 게시글까지 실제 배열 길이(0)로 덮어써버리면 기존에 보이던
 * 숫자가 전부 0으로 바뀌는 눈에 띄는 회귀가 된다. 그래서 "이 게시글에 실제 댓글
 * 데이터가 하나도 없을 때"만 fallbackCount(=post.comments)를 그대로 쓰고, 실제 댓글이
 * 하나라도 있으면(정적이든 사용자 작성이든) 그 실제 개수를 쓴다 — 이후 데모/실 사용자
 * 댓글이 늘어나도 post.comments 숫자를 손으로 맞출 필요가 없다. */
export function useCommunityCommentCount(): (postId: string, fallbackCount: number) => number {
  const { userComments } = useCommunityPosts();
  return useMemo(() => {
    const liveCounts = new Map<string, number>();
    for (const comment of userComments) {
      liveCounts.set(comment.postId, (liveCounts.get(comment.postId) ?? 0) + 1);
    }
    return (postId: string, fallbackCount: number) => {
      const staticCount = COMMUNITY_COMMENTS[postId]?.length;
      const liveCount = liveCounts.get(postId) ?? 0;
      if (staticCount === undefined && liveCount === 0) return fallbackCount;
      return (staticCount ?? 0) + liveCount;
    };
  }, [userComments]);
}
