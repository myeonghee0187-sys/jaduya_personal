/* 커뮤니티 글쓰기 임시저장 — CommunityWritePanel(저장/수정/삭제)과
 * CommunityDraftListPanel(목록 표시) 이 같은 타입·저장소를 보도록 여기 한 곳에 둔다.
 * 등록 글과 달리 미완성이어도 저장할 수 있어 CommunityPost 보다 필드가 느슨하다. */

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

export function readDrafts(): WriteDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDrafts(drafts: WriteDraft[]): void {
  try {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    /* 저장에 실패해도 화면 동작은 그대로 둔다 */
  }
}
