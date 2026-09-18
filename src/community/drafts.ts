/* 커뮤니티 글쓰기 임시저장 — CommunityWritePanel(저장/수정/삭제)과
 * CommunityDraftListPanel(목록 표시) 이 같은 타입·저장소를 보도록 여기 한 곳에 둔다.
 * 등록 글과 달리 미완성이어도 저장할 수 있어 CommunityPost 보다 필드가 느슨하다.
 *
 * 로그인 계정별로 분리해서 저장한다(accountKey) — A 계정이 쓰다 만 임시글이 B 계정에
 * 보이면 안 된다. 호출하는 쪽(CommunityWritePanel)이 useAuth() 로 이미 user 를 들고
 * 있어서, 여기서는 Context 를 새로 만들지 않고 email 을 인자로 받는 순수 함수로 둔다. */

import { accountKey } from '../lib/accountStorage';

export interface WriteDraft {
  id: string;
  level: string | null;
  title: string;
  body: string;
  postType: string | null;
  hashtagCategory: string | null;
  hashtags: string[];
  /** 첨부한 사진 — data URL */
  attachedImage: string | null;
  savedAt: string;
}

const DRAFTS_STORAGE_KEY = 'jaduya.community.writeDrafts';

export function readDrafts(email: string | null | undefined): WriteDraft[] {
  try {
    const raw = localStorage.getItem(accountKey(DRAFTS_STORAGE_KEY, email));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    /* 개편 전에 저장한 후기·잡담 임시글은 질문 분류로 이어서 편집한다. */
    return parsed.map((draft: WriteDraft) => ({
      ...draft,
      postType: draft.postType === '후기' || draft.postType === '잡담' ? '질문' : draft.postType,
    }));
  } catch {
    return [];
  }
}

export function writeDrafts(email: string | null | undefined, drafts: WriteDraft[]): void {
  try {
    localStorage.setItem(accountKey(DRAFTS_STORAGE_KEY, email), JSON.stringify(drafts));
  } catch {
    /* 저장에 실패해도 화면 동작은 그대로 둔다 */
  }
}
