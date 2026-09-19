import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CommunityPost } from '../data/communityPosts';
import type { LevelValue } from '../data/personaProfile';

/* 사용자가 실제로 남긴 커뮤니티 활동(작성한 글 / 작성한 댓글) — 커뮤니티 화면 전체
 * (게시판/자취 꿀팁 목록, 게시글 상세)가 같은 값을 본다.
 *
 * 게시글·댓글은 "커뮤니티 공개 콘텐츠"라서 작성자와 무관하게 모든 로그인 계정이 같은
 * 값을 봐야 한다 — 그래서 북마크(BookmarkContext)·임시저장(drafts.ts)과 달리 계정별
 * key(accountKey)를 쓰지 않고, 로그인 여부와 상관없는 고정 key 하나에 전부 저장한다.
 * (마이페이지 "나의 활동"에서는 이 전체 목록을 authorId === 현재 로그인 사용자.email
 * 로 다시 필터링해서 보여줄 예정 — userPosts/userComments 가 그 원본이다.)
 *
 * 정적 mock 게시글(COMMUNITY_POSTS 등)·mock 댓글(COMMUNITY_COMMENTS)은 여기서 다루지 않는다 —
 * 화면에서 그대로 합쳐서(mergeOwnPosts, CommunityPostDetailPanel 의 buildAllRows) 보여준다. */

const POSTS_STORAGE_KEY = 'jaduya.community.userPosts';
const COMMENTS_STORAGE_KEY = 'jaduya.community.userComments';

/* 예전에는 계정별 key(jaduya.community.posts.<email> / jaduya.community.comments.<email>)에
 * 나눠 저장했다. 공용 저장소가 비어 있는(한 번도 만들어진 적 없는) 최초 1회에 한해 그 예전
 * 데이터를 모두 모아 옮겨 담는다 — 예전 key는 지우지 않고 그대로 둔다. */
const LEGACY_POSTS_PREFIX = 'jaduya.community.posts.';
const LEGACY_COMMENTS_PREFIX = 'jaduya.community.comments.';

/** 작성한 댓글 — mock 댓글(CommunityComment)과 같은 자리에 나란히 보여주기 위해
 * author·level·body·likes 필드는 그대로 맞추고, 작성자 식별값(authorId)과 영속화·
 * 소속 게시글 구분용 필드(postId·createdAt)를 더했다. avatar 는 mock 댓글처럼
 * 이모지가 아니라 작성 당시 로그인 계정의 실제 프로필 사진 경로(avatarImage)를 쓴다. */
export interface OwnComment {
  id: string;
  /** 이 댓글이 달린 게시글 id */
  postId: string;
  author: string;
  /** 실제 로그인 사용자와 비교하기 위한 식별값 — AuthUser.email */
  authorId?: string;
  avatarImage: string;
  level: LevelValue;
  body: string;
  likes: number;
  /** ISO 시각 — 화면에는 쓰지 않고(항상 "방금 전"으로 표시) 영속화·정렬용으로만 둔다 */
  createdAt: string;
}

interface CommunityPostsValue {
  likedPostIds: string[];
  togglePostLike: (id: string) => void;
  /** 사용자가 작성한 전체 게시글(작성자 무관, 공용) — 기존 화면 코드 호환용 이름 */
  ownPosts: CommunityPost[];
  /** ownPosts 와 같은 배열 — "authorId 로 내 글만 필터링"할 다음 단계(마이페이지)를 위한 이름 */
  userPosts: CommunityPost[];
  addPost: (post: CommunityPost) => void;
  removePost: (id: string) => void;
  /** 게시글 id → 그 글에 달린 전체 사용자 작성 댓글(작성자 무관, 공용) */
  ownCommentsByPost: Record<string, OwnComment[]>;
  /** ownCommentsByPost 를 만드는 원본 평면 배열 — "authorId 로 내 댓글만 필터링"할 때 쓴다 */
  userComments: OwnComment[];
  addComment: (comment: OwnComment) => void;
  removeComment: (postId: string, commentId: string) => void;
}

const CommunityPostsContext = createContext<CommunityPostsValue | null>(null);

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    /* 저장소를 못 읽는 환경(사생활 보호 모드 등)에서는 빈 목록으로 시작한다 */
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* 저장에 실패해도 화면 동작은 세션 메모리로 계속된다 */
  }
}

/** 개편 전에 작성된 후기·잡담 글은 게시판의 질문 분류로 통합한다. */
function normalizePostCategory(post: CommunityPost): CommunityPost {
  return post.category === '후기' || post.category === '잡담'
    ? { ...post, category: '질문' }
    : post;
}

/** 공용 key(newKey)가 아직 한 번도 만들어진 적 없으면(localStorage 에 그 key 자체가 없으면),
 * legacyPrefix 로 시작하는 예전 계정별 key들을 전부 모아 id 기준 중복 제거 후 공용 key에
 * 옮겨 담는다. 이미 공용 key가 있으면(빈 배열이어도) 그 값을 그대로 쓴다 — 매번 다시
 * 스캔하지 않는다. */
function migrateLegacyPerAccountData<T extends { id: string }>(newKey: string, legacyPrefix: string): T[] {
  if (localStorage.getItem(newKey) !== null) return readList<T>(newKey);

  const merged = new Map<string, T>();
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(legacyPrefix)) continue;
    for (const item of readList<T>(key)) {
      merged.set(item.id, item);
    }
  }
  const migrated = Array.from(merged.values());
  writeList(newKey, migrated);
  return migrated;
}

/** 댓글은 화면에 "게시글 id → 목록" 형태로 넘겨야 해서(ownCommentsByPost), 저장은
 * 평평한 배열(OwnComment[])로 하고 여기서 postId 기준으로 그룹만 다시 만든다.
 * 그룹 안 순서는 원본 배열(작성 순서, 오래된 것부터) 순서를 그대로 유지한다. */
function groupByPostId(comments: OwnComment[]): Record<string, OwnComment[]> {
  const grouped: Record<string, OwnComment[]> = {};
  for (const comment of comments) {
    const bucket = grouped[comment.postId] ?? (grouped[comment.postId] = []);
    bucket.push(comment);
  }
  return grouped;
}

export function CommunityPostsProvider({ children }: { children: ReactNode }) {
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const togglePostLike = useCallback((id: string) => {
    setLikedPostIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }, []);
  const [ownPosts, setOwnPosts] = useState<CommunityPost[]>(() =>
    migrateLegacyPerAccountData<CommunityPost>(POSTS_STORAGE_KEY, LEGACY_POSTS_PREFIX).map(normalizePostCategory),
  );
  const [ownComments, setOwnComments] = useState<OwnComment[]>(() =>
    migrateLegacyPerAccountData<OwnComment>(COMMENTS_STORAGE_KEY, LEGACY_COMMENTS_PREFIX),
  );

  /* 새로고침해도 유지되도록, 그리고 다른 계정에서도 같은 값을 보도록 공용 key 하나에 저장한다 */
  useEffect(() => {
    writeList(POSTS_STORAGE_KEY, ownPosts);
  }, [ownPosts]);

  useEffect(() => {
    writeList(COMMENTS_STORAGE_KEY, ownComments);
  }, [ownComments]);

  /* 최신 글이 맨 앞에 오도록 붙인다 — 정적 목록과 합칠 때(mergeOwnPosts) 이 순서를 그대로 쓴다 */
  const addPost = useCallback((post: CommunityPost) => {
    setOwnPosts((prev) => [normalizePostCategory(post), ...prev]);
  }, []);

  const removePost = useCallback((id: string) => {
    setOwnPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  const addComment = useCallback((comment: OwnComment) => {
    setOwnComments((prev) => [...prev, comment]);
  }, []);

  const removeComment = useCallback((postId: string, commentId: string) => {
    setOwnComments((prev) => prev.filter((c) => !(c.postId === postId && c.id === commentId)));
  }, []);

  const ownCommentsByPost = useMemo(() => groupByPostId(ownComments), [ownComments]);

  const value = useMemo<CommunityPostsValue>(
    () => ({
      likedPostIds,
      togglePostLike,
      ownPosts,
      userPosts: ownPosts,
      addPost,
      removePost,
      ownCommentsByPost,
      userComments: ownComments,
      addComment,
      removeComment,
    }),
    [likedPostIds, togglePostLike, ownPosts, ownComments, addPost, removePost, ownCommentsByPost, addComment, removeComment],
  );

  return <CommunityPostsContext.Provider value={value}>{children}</CommunityPostsContext.Provider>;
}

/** Provider 밖에서는 빈 목록으로 동작한다 (기존 독립 화면 보호) */
export function useCommunityPosts(): CommunityPostsValue {
  return (
    useContext(CommunityPostsContext) ?? {
      likedPostIds: [],
      togglePostLike: () => {},
      ownPosts: [],
      userPosts: [],
      addPost: () => {},
      removePost: () => {},
      ownCommentsByPost: {},
      userComments: [],
      addComment: () => {},
      removeComment: () => {},
    }
  );
}
