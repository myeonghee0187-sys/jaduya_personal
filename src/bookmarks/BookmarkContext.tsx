import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/* 게시글 저장(북마크) 상태 — 커뮤니티와 마이페이지가 같은 값을 본다.
 * 백엔드가 없는 MVP 라 localStorage 에 id 목록만 남긴다.
 * 저장 단위는 반드시 게시글 고유 id 이고, 제목 문자열은 쓰지 않는다. */

const STORAGE_KEY = 'jaduya.community.bookmarks';

interface BookmarkValue {
  /** 저장한 게시글 id 목록 */
  savedPostIds: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
}

const BookmarkContext = createContext<BookmarkValue | null>(null);

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    /* 저장소를 못 읽는 환경(사생활 보호 모드 등)에서는 빈 목록으로 시작한다 */
    return [];
  }
}

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [savedPostIds, setSavedPostIds] = useState<string[]>(read);

  /* 새로고침해도 유지되도록 바뀔 때마다 저장한다 */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPostIds));
    } catch {
      /* 저장에 실패해도 화면 동작은 그대로 둔다 */
    }
  }, [savedPostIds]);

  const toggle = useCallback((id: string) => {
    setSavedPostIds((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setSavedPostIds((prev) => prev.filter((key) => key !== id));
  }, []);

  const value = useMemo<BookmarkValue>(
    () => ({
      savedPostIds,
      isSaved: (id: string) => savedPostIds.includes(id),
      toggle,
      remove,
    }),
    [savedPostIds, toggle, remove],
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

/** Provider 밖에서는 빈 목록으로 동작한다 (기존 독립 화면 보호) */
export function useBookmarks(): BookmarkValue {
  return (
    useContext(BookmarkContext) ?? {
      savedPostIds: [],
      isSaved: () => false,
      toggle: () => {},
      remove: () => {},
    }
  );
}
