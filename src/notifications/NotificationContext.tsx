import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { NOTIFICATIONS_BY_PERSONA } from '../data/notifications';
import type { NotificationItem } from '../data/notifications';

/* 알림 상태 — 헤더 종과 알림 화면이 같은 값을 본다.
 *
 * 목록 자체는 페르소나별 mock 이고(data/notifications), 여기서는 '무엇을 읽었는지'만 관리한다.
 * 읽음 상태는 계정마다 독립이어야 해서 localStorage 키에 이메일을 붙인다
 * (하린에서 읽은 알림이 아영·서준에 영향을 주면 안 된다).
 * 저장 형식은 BookmarkContext 와 같은 '읽은 id 목록' 이다.
 */

const STORAGE_PREFIX = 'jaduya.notifications.';

const storageKey = (email: string) => `${STORAGE_PREFIX}${email}`;

function readIds(email: string | null): string[] {
  if (!email) return [];
  try {
    const raw = localStorage.getItem(storageKey(email));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    /* 저장소를 못 읽는 환경에서는 모두 안 읽은 것으로 시작한다 */
    return [];
  }
}

/** 목록 항목에 이 계정의 읽음 여부를 얹은 형태 */
export interface NotificationEntry extends NotificationItem {
  read: boolean;
}

interface NotificationValue {
  items: NotificationEntry[];
  unreadCount: number;
  /** 사용자가 실제로 카드를 눌렀을 때만 호출한다 — 화면 진입으로는 읽지 않는다 */
  markRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const email = user?.email ?? null;
  const persona = user?.persona ?? null;

  const [readIdList, setReadIdList] = useState<string[]>(() => readIds(email));

  /* 계정이 바뀌면 그 계정의 읽음 상태를 다시 읽어 온다 */
  useEffect(() => {
    setReadIdList(readIds(email));
  }, [email]);

  const markRead = useCallback(
    (id: string) => {
      if (!email) return;
      setReadIdList((current) => {
        if (current.includes(id)) return current;
        const next = [...current, id];
        try {
          localStorage.setItem(storageKey(email), JSON.stringify(next));
        } catch {
          /* 저장에 실패해도 이번 세션의 화면 동작은 그대로 둔다 */
        }
        return next;
      });
    },
    [email],
  );

  const value = useMemo<NotificationValue>(() => {
    const list = persona ? NOTIFICATIONS_BY_PERSONA[persona] : [];
    const items = list.map((item) => ({ ...item, read: readIdList.includes(item.id) }));
    return {
      items,
      unreadCount: items.filter((item) => !item.read).length,
      markRead,
    };
  }, [persona, readIdList, markRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/** Provider 밖(로그인 전 화면 등)에서는 빈 목록으로 동작한다 */
export function useNotifications(): NotificationValue {
  return (
    useContext(NotificationContext) ?? { items: [], unreadCount: 0, markRead: () => {} }
  );
}
