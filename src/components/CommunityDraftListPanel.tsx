import { icon } from '../lib/asset';
import type { WriteDraft } from '../community/drafts';
import { BellButton } from './BellButton';
import { StatusBar } from './StatusBar';
import { useDismissOnBack } from '../navigation/useDismissOnBack';

interface CommunityDraftListPanelProps {
  open: boolean;
  drafts: WriteDraft[];
  onClose: () => void;
  onEdit: (draft: WriteDraft) => void;
  onDelete: (id: string) => void;
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}.${date.getDate()} ${hh}:${mm}`;
}

/* 커뮤니티 '임시저장 목록' — CommunityWritePanel 의 "임시목록" 버튼으로 연다.
 * 글쓰기 패널과 같은 방식(GNB 식 오른쪽 슬라이드인)으로 그 위에 한 겹 더 뜬다.
 * "수정하기" 는 목록만 닫고, 실제로 글쓰기 폼에 값을 채우는 건 CommunityWritePanel 이 한다. */
export function CommunityDraftListPanel({ open, drafts, onClose, onEdit, onDelete }: CommunityDraftListPanelProps) {
  useDismissOnBack(open, onClose);
  return (
    <section className="layer draft-list-panel" hidden={!open} aria-label="임시저장 목록">
      <div className="draft-list-panel__header">
        <StatusBar />
        <div className="nav-header">
          <div className="draft-list-panel__title-button">
            <button type="button" className="draft-list-panel__back" aria-label="뒤로" onClick={onClose}>
              <img src={icon('gnb-back.svg')} alt="" />
            </button>
            <span className="draft-list-panel__title">임시저장 목록</span>
          </div>
          <div className="header-actions">
            <BellButton />
            <button
              type="button"
              className="header-icon-button"
              aria-label="임시저장 목록 닫기"
              onClick={onClose}
            >
              <img src={icon('gnb-close.svg')} alt="" />
            </button>
          </div>
        </div>
      </div>

      <div className="draft-list-panel__scroll">
        <div className="draft-list-panel__content">
          {drafts.length === 0 ? (
            <p className="draft-list-panel__empty">임시저장한 글이 없어요.</p>
          ) : (
            <ul className="draft-list-panel__list">
              {drafts.map((draft) => (
                <li key={draft.id} className="draft-list-panel__item">
                  <div className="draft-list-panel__item-text">
                    <p className="draft-list-panel__item-title">{draft.title.trim() || '제목 없음'}</p>
                    {draft.body.trim() && (
                      <p className="draft-list-panel__item-preview">{draft.body.trim()}</p>
                    )}
                    {(draft.postType || draft.hashtags.length > 0) && (
                      <div className="draft-list-panel__item-tags">
                        {draft.postType && (
                          <span className="draft-list-panel__item-tag draft-list-panel__item-tag--category">
                            {draft.postType}
                          </span>
                        )}
                        {draft.hashtags.map((tag) => (
                          <span key={tag} className="draft-list-panel__item-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="draft-list-panel__item-time">{formatSavedAt(draft.savedAt)} 저장</span>
                  </div>
                  <div className="draft-list-panel__item-actions">
                    <button type="button" className="draft-list-panel__edit" onClick={() => onEdit(draft)}>
                      수정하기
                    </button>
                    <button
                      type="button"
                      className="draft-list-panel__delete"
                      aria-label="임시글 삭제"
                      onClick={() => onDelete(draft.id)}
                    >
                      <img src={icon('gnb-close.svg')} alt="" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default CommunityDraftListPanel;
