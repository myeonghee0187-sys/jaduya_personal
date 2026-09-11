import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { StatusBar } from '../components/StatusBar';
import { icon, img } from '../lib/asset';

/* 사용자 조건 칩 — Figma chip_row (2271:33681) */
const USER_CHIPS = ['신림1동', '월세', '원룸'] as const;

/* 추천 질문 — Figma prompt_list (3151:20224) */
const PROMPTS = [
  '“싱크대 밑에서 물이 새는데 어떡해?”',
  '“전입신고 처음인데 순서대로 알려줘.”',
  '“내 조건에 맞는 지원금 뭐 있어?”',
] as const;

/* 자두AI — Figma chatbot_default_first (3151:20185).
 * 이번 단계는 화면과 진입/복귀까지다. 실제 AI 응답·음성·첨부는 연결하지 않는다. */
export function AIChatPage() {
  const navigation = useAppNavigation();
  const [draft, setDraft] = useState('');

  /* 전송 로직은 아직 없다 — 임의의 AI 동작을 만들지 않는다 */
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="ai-chat-page app">
      <StatusBar />

      <button
        type="button"
        className="ai-chat-page__back"
        onClick={() => navigation?.navigate('home')}
      >
        <img src={icon('ai-back-arrow.svg')} alt="" />
        홈으로 돌아가기
      </button>

      <div className="ai-chat-page__brand">
        <span className="ai-chat-page__profile">
          <img src={icon('ai-avatar.svg')} alt="" />
          자두AI
        </span>
        <span className="ai-chat-page__role">
          문제 해결 도우미
          <img src={icon('ai-help.svg')} alt="" />
        </span>
      </div>

      <div className="ai-chat-page__chips">
        <span className="ai-chat-page__chip-group">
          {USER_CHIPS.map((chip) => (
            <span key={chip} className="ai-chat-page__chip">
              {chip}
            </span>
          ))}
        </span>
        <button type="button" className="ai-chat-page__chip ai-chat-page__chip--edit">
          편집
        </button>
      </div>

      <div className="ai-chat-page__body">
        <div className="ai-chat-page__intro">
          <p className="ai-chat-page__headline">
            무슨 이야기부터 해볼까요?
            <br />
            사소한 궁금증도 좋아요!
          </p>
          <img className="ai-chat-page__mole" src={img('ai/ai-mole.svg')} alt="" />
        </div>

        <div className="ai-chat-page__prompt-block">
          <p className="ai-chat-page__prompt-caption">시작이 어렵다면 선택해보세요!</p>
          <ul className="ai-chat-page__prompts">
            {PROMPTS.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      </div>

      <form className="ai-chat-page__input-area" onSubmit={onSubmit}>
        <div className="ai-chat-page__input-bar">
          <button type="button" className="ai-chat-page__input-icon" aria-label="첨부">
            <img src={icon('ai-plus.svg')} alt="" />
          </button>
          <input
            type="text"
            placeholder="자취 고민을 입력해보세요."
            aria-label="자취 고민 입력"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="button" className="ai-chat-page__input-icon" aria-label="음성 입력">
            <img src={icon('ai-mic.svg')} alt="" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default AIChatPage;
