import { useEffect, useRef, useState } from 'react';
import type { AnimationEvent, FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { StatusBar } from '../components/StatusBar';
import { aiFabRef } from '../components/ai/aiFabRef';
import { AI_SCENARIOS, scenarioStage } from '../data/aiScenarios';
import type { AIConversationContext, ScenarioUserContext } from '../data/aiScenarios';
import { loadLivingProfile } from '../data/livingProfile';
import { PERSONA_PROFILE } from '../data/personaProfile';
import { icon, img } from '../lib/asset';

/* 사용자 조건 칩 — Figma chip_row (2271:33681) */
const BASE_USER_CHIPS = ['월세', '원룸'] as const;

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

type PowerAnswer = 'power_off' | 'power_on';
type BoilerStage =
  | 'power'
  | 'power-off-check'
  | 'power-restored'
  | 'power-on-symptom'
  | 'error-code'
  | 'error-code-input'
  | 'result';

type Diagnosis =
  | { topic: 'boiler'; stage: BoilerStage; power?: PowerAnswer; symptom?: 'heating' | 'hot-water' | 'both' }
  | null;

type DiagnosticReply = {
  content: string;
  diagnosis: Diagnosis;
};

type QuickReply = {
  id: string;
  label: string;
  stage: string;
};

const EMPTY_CONVERSATION: AIConversationContext = {
  flowId: null, flowType: null, stage: null, persona: null, answers: {},
};

type ScenarioReply = { content: string; conversation: AIConversationContext };

function stageMessage(scenarioId: string, stage: string, user: ScenarioUserContext): string {
  const message = scenarioStage(scenarioId, stage)?.message;
  return typeof message === 'function' ? message(user) : message ?? '';
}

function scenarioQuickReplies(conversation: AIConversationContext): QuickReply[] {
  if (!conversation.flowId || !conversation.stage) return [];
  return (scenarioStage(conversation.flowId, conversation.stage)?.quickReplies ?? []).map((reply) => ({
    id: `${conversation.flowId}-${conversation.stage}-${reply.value}`,
    label: reply.label,
    stage: conversation.stage as string,
  }));
}

function nextScenarioContext(
  conversation: AIConversationContext,
  stage: string,
  answerKey: string,
  answer: string,
): AIConversationContext {
  return { ...conversation, stage, answers: { ...conversation.answers, [answerKey]: answer } };
}

function recommendationResult(user: ScenarioUserContext, answers: Record<string, string>): string {
  const category = answers.supportCategory === 'housing' ? '주거비' : answers.supportCategory === 'living' ? '생활비' : '주거·생활비';
  const location = user.location ? `${user.location} 기준으로` : '지역을 설정하면 지역 기준으로';
  return `현재 알려주신 조건을 기준으로 ${category} 지원 중 확인해볼 만한 항목을 정리해볼게요.\n\n${location} 청년 주거·생활 지원과 공공 지원 제도의 신청 조건을 확인해보세요. 실제 대상 여부는 소득·계약·모집 기간을 추가로 확인해야 해요.\n\n• 신청 조건 자세히 보기\n• 신청 방법 보기\n• 다른 지원도 찾아보기`;
}

function getScenarioReply(message: string, conversation: AIConversationContext, user: ScenarioUserContext): ScenarioReply {
  const answer = normalizeAnswer(message);
  const scenario = conversation.flowId ? AI_SCENARIOS[conversation.flowId] : null;
  if (!scenario || !conversation.stage) {
    return { content: '어느 쪽에 가까운가요?', conversation };
  }

  if (conversation.flowId === 'moveIn') {
    if (conversation.stage === 'move-stage') {
      if (/아직|이사전/.test(answer)) {
        const next = nextScenarioContext(conversation, 'before-move', 'moveStage', 'before');
        return { content: stageMessage('moveIn', 'before-move', user), conversation: next };
      }
      if (/오늘|이미/.test(answer)) {
        const next = nextScenarioContext(conversation, 'method', 'moveStage', /오늘/.test(answer) ? 'today' : 'moved');
        return { content: stageMessage('moveIn', 'method', user), conversation: next };
      }
    }
    if (conversation.stage === 'before-move') {
      if (/준비물/.test(answer)) return { content: '준비물은 신분증, 임대차계약서, 세대주 확인에 필요한 정보를 먼저 챙기면 돼요. 실제 이사 후 전입신고를 진행해주세요.\n\n• 이사 후 순서 보기', conversation: { ...conversation, stage: 'result' } };
      if (/이사후|순서/.test(answer)) return { content: '이사 후에는 STEP 1 전입신고 → STEP 2 확정일자 확인 → STEP 3 주소 변경이 필요한 서비스를 확인하면 돼요.\n\n• 전입신고 방법 보기\n• 확정일자 확인하기', conversation: { ...conversation, stage: 'result' } };
    }
    if (conversation.stage === 'method') {
      if (/온라인/.test(answer)) return { content: '온라인은 정부24에서 본인 인증 후 전입신고 메뉴를 선택하고, 새 주소와 세대 정보를 입력하면 돼요.\n\n• 온라인 신청 순서 보기', conversation: { ...conversation, stage: 'result' } };
      if (/주민센터/.test(answer)) return { content: '주민센터 방문 시 신분증과 임대차계약서를 챙겨가세요. 이사한 주소의 관할 주민센터에서 접수할 수 있어요.\n\n• 방문 준비물 보기', conversation: { ...conversation, stage: 'result' } };
      if (/추천/.test(answer)) return { content: '처음이라면 준비물을 직접 확인할 수 있는 주민센터 방문이 이해하기 편할 수 있어요. 시간 여유가 없다면 정부24 온라인 신청도 가능해요.\n\n• 방문 준비물 보기\n• 온라인 신청 순서 보기', conversation: { ...conversation, stage: 'result' } };
    }
  }

  if (conversation.flowId === 'support') {
    if (conversation.stage === 'category') {
      const category = /주거/.test(answer) ? 'housing' : /생활/.test(answer) ? 'living' : /전체/.test(answer) ? 'all' : null;
      if (category) {
        const next = nextScenarioContext(conversation, 'income', 'supportCategory', category);
        return { content: stageMessage('support', 'income', user), conversation: next };
      }
    }
    if (conversation.stage === 'income') {
      if (isUnknownAnswer(answer)) return { content: '급여·아르바이트·사업 소득처럼 정기적으로 받는 돈이 있는지 기준으로 선택해주세요.', conversation };
      const income = /없/.test(answer) ? 'none' : /근로|소득|있/.test(answer) ? 'income' : null;
      if (income) {
        const next = nextScenarioContext(conversation, user.contract ? 'result' : 'contract', 'incomeStatus', income);
        return user.contract
          ? { content: recommendationResult(user, next.answers), conversation: next }
          : { content: stageMessage('support', 'contract', user), conversation: next };
      }
    }
    if (conversation.stage === 'contract') {
      const contract = /월세/.test(answer) ? 'monthly' : /전세/.test(answer) ? 'deposit' : /기타/.test(answer) ? 'other' : null;
      if (contract) {
        const next = nextScenarioContext(conversation, 'result', 'contract', contract);
        return { content: recommendationResult(user, next.answers), conversation: next };
      }
    }
  }

  return { content: '어느 쪽에 가까운가요?', conversation };
}

function isSafetyRisk(message: string): boolean {
  return /가스.?냄새|탄.?냄새|연기|불.?꽃|화재|감전|전기.?타는.?냄새|누수/.test(message);
}

function isNewProblem(message: string): boolean {
  return /냉장고|누수|곰팡이|세탁기|에어컨|인터넷|전입.?신고|지원금|전기.?문제|가스.?문제/.test(message);
}

function locationHelp(location: string | undefined): string {
  return location
    ? `주변 도움: 현재 설정 지역인 ${location} 기준으로 보일러 수리 서비스를 찾아볼 수 있어요.`
    : '주변 도움: 지역을 설정하면 주변 도움을 찾아드릴 수 있어요.';
}

function normalizeAnswer(message: string): string {
  return message.replace(/\s/g, '').toLowerCase();
}

function isUnknownAnswer(message: string): boolean {
  return /모르겠|확인못|잘몰라|모름/.test(normalizeAnswer(message));
}

function getPowerAnswer(message: string): PowerAnswer | 'unknown' | null {
  const answer = normalizeAnswer(message);
  if (isUnknownAnswer(answer)) return 'unknown';
  if (/안켜|전원.*안들어|화면꺼|불안들/.test(answer)) return 'power_off';
  if (/켜져|전원.*들어|화면나와|불들어/.test(answer)) return 'power_on';
  return null;
}

function quickRepliesForDiagnosis(diagnosis: Diagnosis): QuickReply[] {
  if (diagnosis?.topic !== 'boiler') return [];
  return (scenarioStage('boiler', diagnosis.stage)?.quickReplies ?? []).map((reply) => ({
    id: `boiler-${diagnosis.stage}-${reply.value}`,
    label: reply.label,
    stage: diagnosis.stage,
  }));
}

function result(content: string): DiagnosticReply {
  return { diagnosis: { topic: 'boiler', stage: 'result' }, content };
}

/** 답을 한 번에 나열하지 않고, 현재 진단 단계에 필요한 질문 하나만 이어 간다. */
function getDiagnosticReply(message: string, diagnosis: Diagnosis, location: string | undefined): DiagnosticReply {
  if (isSafetyRisk(message)) {
    return {
      diagnosis: null,
      content:
        '안전이 먼저예요. 가스·전기·화재·누수 위험이 의심되면 기기를 직접 분해하거나 수리하지 말고, 가능하면 전원을 끄고 안전한 곳으로 이동해주세요.\n\n책임 주체: 관리실 또는 전문기사\n\n• 관리실에 긴급 접수하기\n• 위험이 계속되면 119에 연락하기',
    };
  }

  let activeDiagnosis = diagnosis;
  /* 이전 보일러 흐름 도중 다른 생활 문제를 입력하면 이전 답을 이어 쓰지 않는다. */
  if (activeDiagnosis && (isNewProblem(message) || /보일러.*(안|문제)/.test(message))) {
    activeDiagnosis = null;
  }

  if (!activeDiagnosis && /보일러|난방|온수/.test(message)) {
    return {
      diagnosis: { topic: 'boiler', stage: 'power' },
      content: '보일러 조절기 화면이 켜져 있나요?',
    };
  }

  if (activeDiagnosis?.topic === 'boiler' && activeDiagnosis.stage === 'power') {
    const power = getPowerAnswer(message);
    if (power === 'unknown') {
      return {
        diagnosis: activeDiagnosis,
        content:
          '조절기 화면에 숫자나 불빛이 보이면 전원은 들어온 상태예요. 화면이 완전히 꺼져 있으면 전원이 안 들어온 상태로 선택해주세요.',
      };
    }
    if (!power) {
      return {
        diagnosis: activeDiagnosis,
        content: '조절기 화면이 켜져 있는지만 확인해주세요.',
      };
    }
    if (power === 'power_off') {
      return {
        diagnosis: { topic: 'boiler', stage: 'power-off-check', power },
        content:
          '그럼 전원 공급 쪽부터 확인해볼게요.\n보일러 플러그가 꽂혀 있고 차단기가 내려가 있지 않은지 확인할 수 있나요?',
      };
    }
    return {
      diagnosis: { topic: 'boiler', stage: 'power-on-symptom', power },
      content: '전원은 들어오는군요. 난방과 온수 중 어떤 쪽에 문제가 있나요?',
    };
  }

  if (activeDiagnosis?.topic === 'boiler' && activeDiagnosis.stage === 'power-off-check') {
    const answer = normalizeAnswer(message);
    if (isUnknownAnswer(answer)) {
      return {
        diagnosis: activeDiagnosis,
        content:
          '플러그는 보일러 전원선이 벽 콘센트에 단단히 꽂혀 있는지 보면 돼요. 차단기는 분전함에서 보일러·난방 항목의 스위치가 아래로 내려가 있지 않은지 확인해주세요.',
      };
    }
    if (/둘다정상|정상/.test(answer)) {
      return result(
        `예상 원인: 전원 공급은 정상인데 조절기가 켜지지 않아 보일러 또는 조절기 고장 가능성이 있어요.\n\n내가 할 수 있는 조치: 조절기 화면과 차단기 상태를 사진으로 남기기\n책임 주체: 임대 설비라면 집주인 또는 관리실 확인이 우선이에요.\n${locationHelp(location)}\n\n• 집주인에게 연락하기\n• 관리실에 문의하기`,
      );
    }
    if (/문제|이상|내려|안꽂/.test(answer)) {
      return {
        diagnosis: { ...activeDiagnosis, stage: 'power-restored' },
        content: '플러그를 단단히 꽂고, 내려간 차단기는 한 번만 올린 뒤 확인해주세요. 반복해서 내려가면 다시 올리지 마세요.\n\n이제 조절기 화면이 켜졌나요?',
      };
    }
    return {
      diagnosis: activeDiagnosis,
      content: '플러그와 차단기 중 어떤 쪽이 문제인지 선택해주세요.',
    };
  }

  if (activeDiagnosis?.topic === 'boiler' && activeDiagnosis.stage === 'power-restored') {
    const answer = normalizeAnswer(message);
    if (/켜졌|켜져/.test(answer)) {
      return result('전원 공급 문제는 해결된 것으로 보여요. 난방이나 온수가 정상 작동하는지 확인해주세요.\n\n책임 주체: 사용자 확인 범위예요.\n\n• 해결 방법 보기');
    }
    if (/아직|안켜/.test(answer)) {
      return result(`예상 원인: 전원 공급을 확인한 뒤에도 조절기 화면이 켜지지 않아 보일러 또는 조절기 고장 가능성이 있어요.\n\n직접 분해하지 말고 화면과 차단기 상태를 사진으로 남겨주세요.\n책임 주체: 집주인 또는 전문기사 확인이 필요해요.\n${locationHelp(location)}\n\n• 집주인에게 연락하기\n• 근처 수리기사 찾기`);
    }
    return { diagnosis: activeDiagnosis, content: '조절기 화면이 켜졌는지 선택해주세요.' };
  }

  if (activeDiagnosis?.topic === 'boiler' && activeDiagnosis.stage === 'power-on-symptom') {
    const answer = normalizeAnswer(message);
    const symptom = /둘다/.test(answer)
      ? 'both'
      : /난방/.test(answer)
        ? 'heating'
        : /온수/.test(answer)
          ? 'hot-water'
          : null;
    if (!symptom) {
      return {
        diagnosis: activeDiagnosis,
        content: '난방과 온수 중 문제가 있는 쪽을 하나 선택해주세요.',
      };
    }
    return {
      diagnosis: { topic: 'boiler', stage: 'error-code', power: activeDiagnosis.power, symptom },
      content: '조절기 화면에 숫자나 영문으로 된 오류 코드가 보이나요?',
    };
  }

  if (activeDiagnosis?.topic === 'boiler' && activeDiagnosis.stage === 'error-code') {
    const answer = normalizeAnswer(message);
    if (isUnknownAnswer(answer)) {
      return {
        diagnosis: activeDiagnosis,
        content:
          '조절기 화면에 영문과 숫자가 함께 보이거나 오류 표시가 있으면 에러코드가 있는 상태예요. 그런 표시가 없다면 에러코드는 없어요를 선택해주세요.',
      };
    }
    if (/에러코드|오류코드|보여|[a-z]\d+/.test(answer)) {
      return {
        diagnosis: { ...activeDiagnosis, stage: 'error-code-input' },
        content: '표시된 오류 코드를 입력해주세요. 예: 03, E1',
      };
    }
    if (/없어|안떠|표시안|없습니다/.test(answer)) {
      return result(
        '예상 원인: 오류 코드 없이 난방 또는 온수가 멈춘 경우 설정·수압·점화 상태 확인이 필요할 수 있어요.\n\n내가 할 수 있는 조치: 조절기를 1분 뒤 다시 켜고 난방·온수 설정을 확인해주세요.\n책임 주체: 해결되지 않으면 임대 설비 점검을 집주인에게 요청할 사항이에요.\n\n• 해결 방법 보기\n• 집주인에게 연락하기',
      );
    }
    return { diagnosis: activeDiagnosis, content: '오류 코드 표시 여부를 선택해주세요.' };
  }

  if (activeDiagnosis?.topic === 'boiler' && activeDiagnosis.stage === 'error-code-input') {
    return result(
      `보일러 제조사 또는 모델별 오류 코드 확인이 필요해요. 입력한 코드와 조절기 화면을 사진으로 남겨주세요.\n\n책임 주체: 전문기사 점검이 필요할 수 있고, 임대 설비라면 집주인에게 먼저 수리 요청할 수 있어요.\n${locationHelp(location)}\n\n• 집주인에게 연락하기\n• 근처 수리기사 찾기`,
    );
  }

  if (/전입.?신고/.test(message)) {
    return {
      diagnosis: null,
      content: '전입한 날짜가 언제인지 먼저 알려줄래요? 신고 기한과 가능한 방법을 그 기준으로 안내할게요.',
    };
  }

  if (/지원금|지원.?사업|혜택/.test(message)) {
    return {
      diagnosis: null,
      content: '현재 나이와 대략적인 월 소득 구간 중 하나만 알려줄래요? 조건에 맞는 지원을 좁혀볼게요.',
    };
  }

  return {
    diagnosis: null,
    content: '어디에 어떤 문제가 생겼는지 한 가지만 더 알려줄래요? 원인을 먼저 좁힌 뒤 필요한 조치와 담당 주체를 안내할게요.',
  };
}

/* 자두AI — Figma chatbot_default_first (3151:20185).
 * 이번 단계는 화면과 진입/복귀까지다. 실제 AI 응답·음성·첨부는 연결하지 않는다. */
export function AIChatPage() {
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(null);
  const [conversation, setConversation] = useState<AIConversationContext>(EMPTY_CONVERSATION);
  const [closeState, setCloseState] = useState<'open' | 'closing-left' | 'closing-right'>('open');
  const pageRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const responseTimerRef = useRef<number | null>(null);
  const location = user?.preferences?.answers.location?.[0];
  const userChips = [location, ...BASE_USER_CHIPS].filter((chip): chip is string => Boolean(chip));
  const personaProfile = PERSONA_PROFILE[user?.persona ?? 'beginner'];
  const livingProfile = loadLivingProfile(user?.email ?? 'guest', personaProfile);
  const profileContext: ScenarioUserContext = {
    name: user?.name,
    persona: user?.persona,
    location,
    experience: livingProfile.experience,
    housing: livingProfile.housing,
    contract: user?.preferences?.answers.contract?.[0]
      ?? user?.preferences?.answers.contractType?.[0]
      ?? user?.preferences?.answers.leaseType?.[0],
  };

  const sendMessage = (content: string, expectedStage?: string) => {
    const question = content.trim();
    if (!question || isTyping) return;
    if (expectedStage && (diagnosis?.stage ?? conversation.stage) !== expectedStage) return;

    setMessages((current) => [
      ...current,
      { id: ++messageIdRef.current, role: 'user', content: question },
    ]);
    setDraft('');
    setIsTyping(true);
    const startsGuide = !diagnosis && !conversation.flowId && /전입.?신고/.test(question);
    const startsRecommendation = !diagnosis && !conversation.flowId && /지원금|지원.?사업|혜택/.test(question);
    const scenarioReply = conversation.flowId && conversation.flowType !== 'diagnosis'
      ? getScenarioReply(question, conversation, profileContext)
      : null;
    const startedConversation = startsGuide
      ? { flowId: 'moveIn', flowType: 'guide' as const, stage: 'move-stage', persona: user?.persona ?? null, answers: {} }
      : startsRecommendation
        ? { flowId: 'support', flowType: 'recommendation' as const, stage: 'category', persona: user?.persona ?? null, answers: {} }
        : null;
    const reply = scenarioReply ? null : getDiagnosticReply(question, diagnosis, location);

    responseTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: ++messageIdRef.current,
          role: 'assistant',
          content: scenarioReply?.content
            ?? (startedConversation ? stageMessage(startedConversation.flowId, startedConversation.stage, profileContext) : reply!.content),
        },
      ]);
      if (scenarioReply) setConversation(scenarioReply.conversation);
      else if (startedConversation) setConversation(startedConversation);
      else setDiagnosis(reply!.diagnosis);
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
    setDiagnosis(null);
    setConversation(EMPTY_CONVERSATION);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, diagnosis]);

  useEffect(
    () => () => {
      if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
    },
    [],
  );

  const conversationStarted = messages.length > 0;
  const quickReplies = !isTyping
    ? (diagnosis ? quickRepliesForDiagnosis(diagnosis) : scenarioQuickReplies(conversation))
    : [];

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
          {userChips.map((chip) => (
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
            {quickReplies.length > 0 && (
              <div className="ai-chat-page__quick-replies" aria-label="빠른 답변">
                {quickReplies.map((reply) => (
                  <button
                    key={reply.id}
                    type="button"
                    className="ai-chat-page__quick-reply"
                    onClick={() => sendMessage(reply.label, reply.stage)}
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            )}
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
