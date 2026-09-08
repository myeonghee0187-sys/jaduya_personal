import { useState } from 'react';
import type { FormEvent } from 'react';
import { BottomSheet } from '../BottomSheet';
import { icon } from '../../lib/asset';

/* AI 챗봇 패널 — 지금은 UI 껍데기다.
 * 실제 응답 연결은 handleSubmit 안의 TODO 자리에 붙이면 된다.
 * 셸은 기존 Bottom Sheet(.layer / .bsheet)를 그대로 재사용한다. */
interface AIChatbotPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AIChatbotPanel({ open, onClose }: AIChatbotPanelProps) {
  const [draft, setDraft] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    /* TODO: 실제 AI 호출을 여기에 연결한다. 지금은 입력만 비운다. */
    setDraft('');
  };

  return (
    <BottomSheet open={open} className="ai-chat" labelledBy="ai-chat-title" onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>

      <div className="ai-chat__header">
        <h2 id="ai-chat-title" className="ai-chat__title">
          자두메이트
        </h2>
        <button type="button" className="ai-chat__close" aria-label="챗봇 닫기" onClick={onClose}>
          <img src={icon('sheet-close.svg')} alt="" />
        </button>
      </div>

      <div className="ai-chat__messages" role="log" aria-live="polite">
        <p className="ai-chat__empty">
          무엇이든 물어보세요.
          <br />
          생활·돈 관리 질문을 도와드릴게요.
        </p>
      </div>

      <form className="ai-chat__input-row" onSubmit={handleSubmit}>
        <input
          className="ai-chat__input"
          type="text"
          placeholder="메시지를 입력해주세요"
          aria-label="메시지 입력"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="ai-chat__send" disabled={!draft.trim()}>
          전송
        </button>
      </form>
    </BottomSheet>
  );
}
