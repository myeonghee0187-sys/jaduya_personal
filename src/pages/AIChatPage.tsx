import { useEffect, useRef, useState } from 'react';
import type { AnimationEvent, FormEvent } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { StatusBar } from '../components/StatusBar';
import { aiFabRef } from '../components/ai/aiFabRef';
import { icon, img } from '../lib/asset';

/* 사용자 조건 칩 — Figma chip_row (2271:33681) */
const USER_CHIPS = ['신림1동', '월세', '원룸'] as const;

/* 추천 질문 — Figma prompt_list (3151:20224) */
/* 따옴표는 말풍선 표기라 본문에서 붙인다 — 입력창에는 문장만 들어간다 */
const PROMPTS = [
  '보일러가 안 켜지는데 어떻게 해야해?',
  '전입신고 처음인데 순서대로 알려줘.',
  '내 조건에 맞는 지원금 뭐 있어?',
] as const;

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const MOCK_RESPONSES: Record<string, string> = {
  '보일러가 안 켜지는데 어떻게 해야해?':
    '보일러 문제, 먼저 하나씩 확인해봐요.\n\n1. 전원과 콘센트를 확인해주세요.\n2. 조절기에 오류 코드가 뜨는지 확인해주세요.\n3. 가스 밸브가 열려 있는지 확인해주세요.\n\n그래도 켜지지 않으면 오류 코드를 메모한 뒤 집주인이나 관리실에 먼저 연락해보세요.',
  '전입신고 처음인데 순서대로 알려줘.':
    '전입한 날부터 14일 이내에 신고하면 돼요!\n\n신분증과 임대차계약서를 준비하고, 가까운 주민센터를 방문하거나 정부24에서 온라인으로 신청할 수 있어요. 온라인 신청은 본인 인증이 필요해요.',
  '내 조건에 맞는 지원금 뭐 있어?':
    '신림1동에서 월세로 거주 중인 조건을 기준으로 확인해볼게요.\n\n청년월세 지원처럼 나이, 소득, 보증금 조건이 함께 적용되는 제도가 있어요. 정확한 안내를 위해 나이와 소득 구간을 먼저 알려주세요.',
};

const DEFAULT_MOCK_RESPONSE =
  '말해준 내용을 확인했어요. 지금 상황을 조금 더 구체적으로 알려주면 자두가 필요한 순서대로 정리해드릴게요.';

/* 자두AI — Figma chatbot_default_first (3151:20185).
 * 이번 단계는 화면과 진입/복귀까지다. 실제 AI 응답·음성·첨부는 연결하지 않는다. */
export function AIChatPage() {
  const navigation = useAppNavigation();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [closeState, setCloseState] = useState<'open' | 'closing-left' | 'closing-right'>('open');
  const pageRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const responseTimerRef = useRef<number | null>(null);

  const sendMessage = (content: string) => {
    const question = content.trim();
    if (!question || isTyping) return;

    setMessages((current) => [
      ...current,
      { id: ++messageIdRef.current, role: 'user', content: question },
    ]);
    setDraft('');
    setIsTyping(true);

    responseTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: ++messageIdRef.current,
          role: 'assistant',
          content: MOCK_RESPONSES[question] ?? DEFAULT_MOCK_RESPONSE,
        },
      ]);
      setIsTyping(false);
      responseTimerRef.current = null;
    }, 700);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const resetConversation = () => {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    setMessages([]);
    setDraft('');
    setIsTyping(false);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(
    () => () => {
      if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
    },
    [],
  );

  const conversationStarted = messages.length > 0;

  const closeChat = () => {
    if (closeState !== 'open') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigation?.closeAIChat();
      return;
    }

    const fabRect = aiFabRef.current?.getBoundingClientRect();
    const pageRect = pageRef.current?.getBoundingClientRect();
    const fabCenterX = fabRect ? fabRect.left + fabRect.width / 2 : window.innerWidth / 2;
    const pageCenterX = pageRect ? pageRect.left + pageRect.width / 2 : window.innerWidth / 2;
    setCloseState(fabCenterX < pageCenterX ? 'closing-left' : 'closing-right');
  };

  const finishClose = (event: AnimationEvent<HTMLDivElement>) => {
    if (closeState !== 'open' && event.target === event.currentTarget) {
      navigation?.closeAIChat();
    }
  };

  return (
    <div
      ref={pageRef}
      className={`ai-chat-page app${closeState === 'open' ? '' : ` is-${closeState}`}`}
      onAnimationEnd={finishClose}
    >
      <StatusBar />
      <header className="ai-chat-page__header">
        <div className="ai-chat-page__profile">
          <img src={icon('ai-avatar.svg')} alt="" />
          <span className="ai-chat-page__profile-copy">
            <strong>자두AI</strong>
            <span>24시간 운영해요</span>
          </span>
        </div>
        <button
          type="button"
          className="ai-chat-page__close"
          aria-label="자두AI 닫기"
          onClick={closeChat}
          disabled={closeState !== 'open'}
        >
          <img src={icon('gnb-close.svg')} alt="" />
        </button>
      </header>

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

      {conversationStarted ? (
        <div className="ai-chat-page__conversation-wrap">
          <div className="ai-chat-page__conversation-actions">
            <button type="button" className="ai-chat-page__reset" onClick={resetConversation}>
              처음으로
            </button>
          </div>
          <div ref={chatRef} className="ai-chat-page__conversation" role="log" aria-live="polite">
            {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-chat-page__message ai-chat-page__message--${message.role}`}
            >
              {message.role === 'assistant' && (
                <img className="ai-chat-page__message-avatar" src={icon('ai-avatar.svg')} alt="" />
              )}
              <div className="ai-chat-page__message-content">
                {message.role === 'assistant' && (
                  <span className="ai-chat-page__message-sender">자두AI</span>
                )}
                <p className="ai-chat-page__bubble">{message.content}</p>
              </div>
            </div>
            ))}
            {isTyping && (
              <div className="ai-chat-page__message ai-chat-page__message--assistant">
                <img className="ai-chat-page__message-avatar" src={icon('ai-avatar.svg')} alt="" />
                <div className="ai-chat-page__message-content">
                  <span className="ai-chat-page__message-sender">자두AI</span>
                  <div className="ai-chat-page__typing" aria-label="자두가 답변을 생각하고 있어요">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
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
                <li key={prompt}>
                  <button
                    type="button"
                    className="ai-chat-page__prompt"
                    onClick={() => sendMessage(prompt)}
                  >
                    {`“${prompt}”`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
