import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { accountKey } from '../lib/accountStorage';

/* 게시글 저장(북마크) 상태 — 커뮤니티와 마이페이지가 같은 값을 본다.
 * 백엔드가 없는 MVP 라 localStorage 에 id 목록만 남긴다.
 * 저장 단위는 반드시 게시글 고유 id 이고, 제목 문자열은 쓰지 않는다.
 *
 * 로그인 계정별로 분리해서 저장한다(accountKey) — 그러지 않으면 같은 브라우저에서
 * 데모 계정을 바꿔가며 볼 때 서준이 저장한 글이 하린·아영에게도 그대로 보인다.
 * 계정이 바뀌면 App.tsx 의 `<AppNavigationProvider key={user.email}>` 가 이 Provider를
 * 포함해 하위 트리를 통째로 새로 마운트하므로, 아래 useState 초기화 함수가 그 시점의
 * user.email 로 다시 실행되어 새 계정의 데이터를 읽어온다 — 별도의 재동기화 로직 없이도
 * "계정 변경 감지 후 다시 로드"가 이 리마운트만으로 충분하다. */

const STORAGE_KEY = 'jaduya.community.bookmarks';
const BENEFIT_STORAGE_KEY = 'jaduya.benefit.bookmarks';

/** 데모 계정(이서준/김하린/조아영)이 처음 로그인했을 때 이미 뭔가 저장해 둔 것처럼
 * 보이게 하는 기본 북마크 — "이 계정의 저장 storage key 가 아직 한 번도 만들어진 적
 * 없을 때"(read() 가 raw === null 을 볼 때)에만 초기값으로 쓰인다. 한 번이라도 저장을
 * 추가/해제하면 그 키에 실제 배열이 쓰이므로, 다음부터는 이 기본값으로 되돌아가지
 * 않는다 — 새로고침/재로그인마다 사용자가 바꾼 상태를 덮어쓰지 않기 위해서다.
 * 실제 존재하는 커뮤니티 게시글 id만 사용한다(communityPosts.ts 기준).
 *
 * id는 전부 실제 본문(body)이 있는 게시글(desk + demo-*-post-*)로만 골랐다 — 정적
 * 목록(level-*, fee-1 등)은 대부분 본문이 없어 저장한 정보에서 눌러도 미리보기 텍스트만
 * 보이거나 댓글이 항상 0으로 보이는데, 데모 시연에서는 실제 상세·댓글까지 제대로
 * 보이는 콘텐츠를 우선 보여주는 게 낫다고 판단했다(QA 후 조정 — 기존 정적 콘텐츠 자체를
 * 상세 가능하게 바꾸는 대신, 여기 seed 대상만 바꿨다). */
const DEFAULT_COMMUNITY_BOOKMARKS: Record<string, string[]> = {
  'seojun@jaduya.com': [
    'desk',
    'demo-seojun-post-1',
    'demo-seojun-post-2',
    'demo-seojun-post-3',
    'demo-seojun-post-4',
    'demo-harin-post-1',
    'demo-harin-post-2',
    'demo-ayoung-post-1',
  ],
  'harin@jaduya.com': [
    'demo-harin-post-1',
    'demo-harin-post-2',
    'desk',
    'demo-seojun-post-3',
    'demo-ayoung-post-1',
  ],
  'ayoung@jaduya.com': ['demo-harin-post-1', 'desk'],
};

interface BookmarkValue {
  /** 저장한 게시글 id 목록 */
  savedPostIds: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  /** 저장한 혜택 id 목록 — 게시글 id와 별도 저장한다. */
  savedBenefitIds: string[];
  isBenefitSaved: (id: string) => boolean;
  toggleBenefit: (id: string) => void;
  removeBenefit: (id: string) => void;
}

const BookmarkContext = createContext<BookmarkValue | null>(null);

function read(key: string, defaults: string[] = []): string[] {
  try {
    const raw = localStorage.getItem(key);
    /* 키 자체가 없으면(=이 계정에서 한 번도 저장을 건드린 적 없으면) 데모 기본값을 쓴다.
     * 빈 배열(`[]`)로 저장된 적이 있다면 그건 "사용자가 전부 해제한 상태"이므로 그대로 존중한다. */
    if (raw === null) return defaults;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    /* 저장소를 못 읽는 환경(사생활 보호 모드 등)에서는 빈 목록으로 시작한다 */
    return [];
  }
}

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const postsKey = accountKey(STORAGE_KEY, user?.email);
  const benefitsKey = accountKey(BENEFIT_STORAGE_KEY, user?.email);
  const defaultPostIds = DEFAULT_COMMUNITY_BOOKMARKS[user?.email?.trim().toLowerCase() ?? ''] ?? [];

  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => read(postsKey, defaultPostIds));
  const [savedBenefitIds, setSavedBenefitIds] = useState<string[]>(() => read(benefitsKey));

  /* 새로고침해도 유지되도록 바뀔 때마다 저장한다 */
  useEffect(() => {
    try {
      localStorage.setItem(postsKey, JSON.stringify(savedPostIds));
    } catch {
      /* 저장에 실패해도 화면 동작은 그대로 둔다 */
    }
  }, [savedPostIds, postsKey]);

  useEffect(() => {
    try {
      localStorage.setItem(benefitsKey, JSON.stringify(savedBenefitIds));
    } catch {
      /* 저장에 실패해도 화면 동작은 그대로 둔다 */
    }
  }, [savedBenefitIds, benefitsKey]);

  const toggle = useCallback((id: string) => {
    setSavedPostIds((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setSavedPostIds((prev) => prev.filter((key) => key !== id));
  }, []);

  const toggleBenefit = useCallback((id: string) => {
    setSavedBenefitIds((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id],
    );
  }, []);

  const removeBenefit = useCallback((id: string) => {
    setSavedBenefitIds((prev) => prev.filter((key) => key !== id));
  }, []);

  const value = useMemo<BookmarkValue>(
    () => ({
      savedPostIds,
      isSaved: (id: string) => savedPostIds.includes(id),
      toggle,
      remove,
      savedBenefitIds,
      isBenefitSaved: (id: string) => savedBenefitIds.includes(id),
      toggleBenefit,
      removeBenefit,
    }),
    [savedPostIds, savedBenefitIds, toggle, remove, toggleBenefit, removeBenefit],
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
      savedBenefitIds: [],
      isBenefitSaved: () => false,
      toggleBenefit: () => {},
      removeBenefit: () => {},
    }
  );
}
