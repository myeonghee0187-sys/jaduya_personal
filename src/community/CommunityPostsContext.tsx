import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CommunityPost } from '../data/communityPosts';

/* 내가 쓴 게시글 — 커뮤니티 화면 전체(전체/질문/자취 꿀팁)가 같은 값을 본다.
 * 댓글(CommunityPostDetailPanel 의 ownCommentsByPost)과 같은 방식으로 이번 세션 메모리에만
 * 둔다 — 새로고침하면 사라진다. localStorage 에 남는 건 임시저장(초안)뿐이다. */

interface CommunityPostsValue {
  ownPosts: CommunityPost[];
  addPost: (post: CommunityPost) => void;
}

const CommunityPostsContext = createContext<CommunityPostsValue | null>(null);

export function CommunityPostsProvider({ children }: { children: ReactNode }) {
  const [ownPosts, setOwnPosts] = useState<CommunityPost[]>([]);

  /* 최신 글이 맨 앞에 오도록 붙인다 — 정적 목록과 합칠 때(mergeOwnPosts) 이 순서를 그대로 쓴다 */
  const addPost = useCallback((post: CommunityPost) => {
    setOwnPosts((prev) => [post, ...prev]);
  }, []);

  const value = useMemo<CommunityPostsValue>(() => ({ ownPosts, addPost }), [ownPosts, addPost]);

  return <CommunityPostsContext.Provider value={value}>{children}</CommunityPostsContext.Provider>;
}

/** Provider 밖에서는 빈 목록으로 동작한다 (기존 독립 화면 보호) */
export function useCommunityPosts(): CommunityPostsValue {
  return useContext(CommunityPostsContext) ?? { ownPosts: [], addPost: () => {} };
}
