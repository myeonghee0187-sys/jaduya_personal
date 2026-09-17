import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AnimationEvent, ChangeEvent, FormEvent, PointerEvent, ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { StatusBar } from '../components/StatusBar';
import { LeafletRepairMap } from '../components/ai/LeafletRepairMap';
import { aiFabRef } from '../components/ai/aiFabRef';
import { AI_SCENARIOS, MOLD_CARE_RESULTS, repairSearchLocationStep, resolveMoldLocation, resolveScenarioRepairKind, scenarioStage } from '../data/aiScenarios';
import { resolveConversationInput } from '../data/resolveConversationInput';
import type { AIConversationContext, ScenarioCta, ScenarioUserContext } from '../data/aiScenarios';
import { AI_PROMPTS_BY_PERSONA } from '../data/aiPersonaPrompts';
import type { AIPersonaPrompt } from '../data/aiPersonaPrompts';
import { HOUSING_TYPES, loadLivingProfile, saveLivingProfile } from '../data/livingProfile';
import { loadAIChatSettings, saveAIChatSettings } from '../data/aiChatSettings';
import type { AILocation } from '../data/aiChatSettings';
import { reverseGeocodeKoreanLocation, searchKoreanLocations } from '../data/locationSearch';
import { PERSONA_PROFILE } from '../data/personaProfile';
import { icon, img } from '../lib/asset';
import { getDemoRepairShops, getPreferredRepairLocation } from '../services/repairShops';
import type { RepairKind, RepairSearchLocation, RepairShop } from '../services/repairShops';
import { deliverRepairShopVCard } from '../utils/vcard';

/* 사용자 조건 칩 — Figma chip_row (2271:33681) */

/* 매칭되지 않은 자유입력은 생성형 답변 대신 지원하는 시나리오를 다시 고르게 한다. */
const FALLBACK_SCENARIO_PROMPTS = [
  '보일러가 안 켜져요',
  '싱크대에서 물이 새요',
  '변기 물이 차올라요',
  '집 전체 전기가 나갔어요',
] as const;

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  ctas?: ChatCta[];
  attachments?: ChatAttachment[];
  benefitRecommendations?: BenefitRecommendation[];
  benefitCtaText?: string;
  pestDiagnosis?: boolean;
  pestSolution?: PestSolution;
};
type SavedConversation = { id: string; title: string; createdAt: string; updatedAt: string; messages: ChatMessage[]; conversation: AIConversationContext; diagnosis: Diagnosis };
const HISTORY_KEY = 'jaduya-ai-conversations';

function loadConversationHistory(): SavedConversation[] {
  try { const value = localStorage.getItem(HISTORY_KEY); return value ? JSON.parse(value) : []; } catch { return []; }
}

function saveConversationHistory(history: SavedConversation[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* storage is optional */ }
}

function formatConversationDate(value: string): string {
  const date = new Date(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

type ImageAttachment = {
  type: 'image';
  id: string;
  name: string;
  previewUrl: string;
  source: 'camera' | 'photo';
};

type FileAttachment = { type: 'file'; id: string; name: string; size: number };
type ContactAttachment = { type: 'contact'; id: string; name?: string; tel: string };
type ChatAttachment = ImageAttachment | FileAttachment | ContactAttachment;
type ContactPickerEntry = { name?: string[]; tel?: string[] };
type ContactPicker = {
  select: (properties: Array<'name' | 'tel'>, options: { multiple: false }) => Promise<ContactPickerEntry[]>;
};

function getContactPicker(): ContactPicker | null {
  if (typeof window === 'undefined' || !('ContactsManager' in window) || !('contacts' in navigator)) return null;
  const contacts = (navigator as Navigator & { contacts?: ContactPicker }).contacts;
  return contacts && typeof contacts.select === 'function' ? contacts : null;
}

function AttachmentDetails({ attachment }: { attachment: FileAttachment | ContactAttachment }) {
  const isContact = attachment.type === 'contact';

  return (
    <>
      <img
        className="ai-chat-page__attachment-type-icon"
        src={`/assets/icon/chatbot/${isContact ? 'person' : 'file'}.svg`}
        alt=""
        aria-hidden="true"
      />
      <span className="ai-chat-page__attachment-copy">
        <strong>{isContact ? attachment.name ?? '연락처' : attachment.name}</strong>
        <small>{isContact ? attachment.tel : formatFileSize(attachment.size)}</small>
      </span>
    </>
  );
}

type ChatCta = {
  label: string;
  copyText?: string;
  action?: string;
  recommended?: boolean;
};

type PestSolution = {
  causeItems: string[];
  steps: string[];
};

/* 실제 Vision API 응답이 아닌, 이미지 첨부 + 벌레 문구 테스트에만 쓰는 데모 진단값이다. */
const MOCK_PEST_PHOTO_DIAGNOSIS = {
  title: '바퀴벌레로 보여요.',
  confidence: '일치 가능성 94%',
  risk: '위험도 높음',
} as const;

/* 지원 대상 여부를 확정하지 않는 데모용 후보 목록이다. 카드의 다음 행동은 기존
 * 혜택·복지 화면으로 연결해, 챗봇 안에서 끝나는 추천이 되지 않게 한다. */
type BenefitRecommendation = {
  title: string;
  description: string;
  status: '신청 가능' | '조건 확인 필요';
};

const BENEFIT_RECOMMENDATIONS: BenefitRecommendation[] = [
  { status: '신청 가능', title: '청년월세 지원', description: '월세 부담을 줄여주는\n청년 주거 지원' },
  { status: '신청 가능', title: '경기 지역 청년 지원', description: '경기도 거주 청년 대상\n생활 지원' },
  { status: '조건 확인 필요', title: '구직 급여', description: '취업 준비 기간\n생활비 지원' },
];

const REPAIR_MAP_PLAYBACK_RATE = 1.5;
const REPAIR_MAP_RESULT_DELAY = 250;
const REPAIR_MAP_FALLBACK_DELAY = 15000;
const REPAIR_MAP_FALLBACK_BUFFER = 5000;
const REPAIR_MAP_LOADING_TEXT = '주변 수리업체 찾는중...';

const BUILDING_LIFE_INFO = [
  {
    title: '공용 배수구 확인',
    description: '공용 배수구가 막히면 세대 내부 문제가 아니라 건물 공용부 문제일 수 있어요.',
  },
  {
    title: '쓰레기 배출 공간 확인',
    description: '배수구 주변에 쓰레기나 이물질이 쌓여 있는지도 확인해보세요.',
  },
  {
    title: '관리실 문의',
    description: '공용부 문제로 보인다면 관리실이나 건물 관리자에게 먼저 문의하는 것이 좋아요.',
  },
] as const;

const BUILDING_COMMUNITY_POSTS = [
  '배수구 냄새 잡은 방법',
  '공용 배수구 막힘 관리실에 문의한 후기',
  '원룸 건물 배수 문제 해결 후기',
] as const;

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

function repairKindFor(diagnosis: Diagnosis, flowId: string | null, answers: Record<string, string>): RepairKind {
  const selectedKind = answers.repairKind;
  if (selectedKind === 'boiler' || selectedKind === 'plumbing' || selectedKind === 'electric' || selectedKind === 'aircon' || selectedKind === 'general') {
    return selectedKind;
  }
  if (diagnosis?.topic === 'boiler' || flowId === 'boiler') return 'boiler';
  if (flowId === 'plumbing-leak' || flowId === 'toilet-clog') return 'plumbing';
  if (flowId === 'power-outage') return 'electric';
  return 'general';
}

type QuickReply = {
  id: string;
  label: string;
  stage: string;
};

const EMPTY_CONVERSATION: AIConversationContext = {
  flowId: null, flowType: null, stage: null, persona: null, answers: {},
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')}MB`;
}

function getCallablePhoneNumber(tel: string): string | null {
  const normalized = tel.trim().replace(/[^\d+]/g, '');
  const isValid = /^\+?\d{7,15}$/.test(normalized) && (normalized.match(/\+/g)?.length ?? 0) <= 1;
  return isValid ? normalized : null;
}

function getVisibleAppShell(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return Array.from(document.querySelectorAll<HTMLElement>('.app')).find(
    (app) => !app.classList.contains('ai-chat-page') && app.getClientRects().length > 0,
  ) ?? null;
}

type ScenarioReply = { content: string; conversation: AIConversationContext; ctas?: readonly ScenarioCta[] };

/* 결과 문구 끝의 CTA 목록은 말풍선 본문과 분리해 실제 액션 버튼으로 렌더링한다.
 * 시나리오/진단의 응답 문자열과 stage 전환은 그대로 유지한다. */
function splitMessageCtas(content: string): Pick<ChatMessage, 'content' | 'ctas'> {
  const match = content.match(/\n\n((?:• [^\n]+)(?:\n• [^\n]+)*)$/);
  if (!match || match.index === undefined) return { content };

  return {
    content: content.slice(0, match.index),
    ctas: match[1].split('\n').map((line) => ({ label: line.replace(/^•\s*/, '') })),
  };
}

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

function pestSolutionFor(answers: Record<string, string>): PestSolution {
  const foodWaste = answers.foodWaste;
  return {
    causeItems: foodWaste === 'yes'
      ? ['음식물 쓰레기 장시간 방치 가능성', '싱크대 음식물 잔여물', '습한 배수구', '벽이나 문틈을 통한 유입']
      : foodWaste === 'no'
        ? ['습한 배수구', '벽이나 문틈을 통한 유입', '싱크대 주변의 남은 음식물', '공용 배수구 유입 가능성']
        : ['싱크대 음식물 잔여물', '습한 배수구', '벽이나 문틈을 통한 유입'],
    steps: foodWaste === 'no'
      ? ['싱크대와 배수구 주변 닦기', '배수구 주변의 습기 확인하기', '벽·문틈 주변 확인하기']
      : ['쓰레기 비우기', '싱크대 닦기', '배수구 확인하기'],
  };
}

function getScenarioReply(message: string, conversation: AIConversationContext, user: ScenarioUserContext): ScenarioReply {
  const answer = normalizeAnswer(message);
  const scenario = conversation.flowId ? AI_SCENARIOS[conversation.flowId] : null;
  if (!scenario || !conversation.stage) {
    return { content: '어느 쪽에 가까운가요?', conversation };
  }

  /* 보일러도 다른 시나리오와 동일하게 conversation.flowId/stage를 source of truth로 쓴다.
   * 기존에 작성된 진단 문구와 단계 전환을 재사용할 뿐, 자유입력으로 새 문장을 만들지 않는다. */
  if (conversation.flowId === 'boiler') {
    const currentDiagnosis: Diagnosis = {
      topic: 'boiler',
      stage: conversation.stage as BoilerStage,
      ...(conversation.answers.power ? { power: conversation.answers.power as PowerAnswer } : {}),
      ...(conversation.answers.symptom ? { symptom: conversation.answers.symptom as 'heating' | 'hot-water' | 'both' } : {}),
    };
    const reply = getDiagnosticReply(message, currentDiagnosis, user.location);
    const nextDiagnosis = reply.diagnosis;
    return {
      content: reply.content,
      conversation: {
        ...conversation,
        stage: nextDiagnosis?.stage ?? 'result',
        answers: {
          ...conversation.answers,
          ...(nextDiagnosis?.power ? { power: nextDiagnosis.power } : {}),
          ...(nextDiagnosis?.symptom ? { symptom: nextDiagnosis.symptom } : {}),
        },
      },
    };
  }

  if (conversation.flowId === 'pest-photo') {
    if (conversation.stage === 'location') {
      const location = /싱크대|주방|부엌/.test(answer)
        ? 'sink_area'
        : /화장실|욕실/.test(answer)
          ? 'bathroom'
          : /현관|신발장/.test(answer)
            ? 'entrance'
            : /방|침실/.test(answer)
              ? 'room'
              : null;
      if (!location) {
        return { content: '어디에서 발견했는지 가까운 위치를 골라주세요.', conversation };
      }
      if (location === 'sink_area') {
        const next = nextScenarioContext(conversation, 'sink-food', 'pestLocation', location);
        return { content: stageMessage('pest-photo', 'sink-food', user), conversation: next };
      }
      return {
        content: '발견한 주변의 습기와 틈을 먼저 확인해보는 게 좋아요.',
        conversation: nextScenarioContext(conversation, 'result', 'pestLocation', location),
      };
    }

    if (conversation.stage === 'sink-food') {
      const foodAnswer = /응|있었|며칠|놔뒀/.test(answer)
        ? 'yes'
        : /아니|없어|바로버/.test(answer)
          ? 'no'
          : isUnknownAnswer(answer) || /기억안/.test(answer)
            ? 'unknown'
            : null;
      if (!foodAnswer) {
        return { content: '최근 음식물 쓰레기 상태를 골라주세요.', conversation };
      }
      const content = foodAnswer === 'yes'
        ? '그렇다면 음식물 잔여물이나 배수구 주변부터 확인해보는 게 좋아요.'
        : foodAnswer === 'no'
          ? '음식물 때문이 아닐 수도 있어요.\n배수구나 벽·문틈 같은 유입 경로도 확인해볼게요.'
          : '괜찮아요.\n우선 싱크대와 배수구 주변부터 확인해보면 좋아요.';
      return {
        content,
        conversation: nextScenarioContext(conversation, 'result', 'foodWaste', foodAnswer),
      };
    }
  }

  if (conversation.flowId === 'mold-care' && conversation.stage === 'location') {
    const moldLocation = resolveMoldLocation(answer);
    if (!moldLocation) return { content: '벽, 창문 주변, 욕실, 기타 중 가까운 위치를 골라주세요.', conversation };
    const result = MOLD_CARE_RESULTS[moldLocation];
    return {
      content: result.message,
      ctas: result.ctas,
      conversation: nextScenarioContext(conversation, 'result', 'moldLocation', moldLocation),
    };
  }

  if (conversation.flowId === 'repair-search' && conversation.stage === 'category') {
    const repairKind = resolveScenarioRepairKind(answer);
    if (!repairKind) return { content: '보일러, 수도·배관, 전기, 에어컨, 기타 중 가까운 분야를 골라주세요.', conversation };
    const locationStep = repairSearchLocationStep(user.location);
    return {
      content: locationStep.message,
      ctas: locationStep.ctas,
      conversation: nextScenarioContext(conversation, 'location-confirm', 'repairKind', repairKind),
    };
  }

  if (conversation.flowId === 'plumbing-leak') {
    if (conversation.stage === 'location') {
      if (/싱크대|주방|부엌|수전|배수관/.test(answer)) {
        const next = nextScenarioContext(conversation, 'sink-check', 'leakLocation', 'sink');
        return { content: stageMessage('plumbing-leak', 'sink-check', user), conversation: next };
      }
      if (/화장실|욕실/.test(answer)) {
        return {
          content: '화장실 누수는 바닥이나 아래층 피해로 이어질 수 있어요. 물 사용을 줄이고 젖은 곳을 사진으로 남긴 뒤 관리실이나 집주인에게 바로 알려주세요.\n\n책임 주체: 관리실 또는 집주인\n\n• 집주인에게 연락하기\n• 관리실에 문의하기',
          conversation: nextScenarioContext(conversation, 'result', 'leakLocation', 'bathroom'),
        };
      }
      if (/세탁기/.test(answer)) {
        return {
          content: '세탁기 급수 호스와 배수 호스 연결부를 먼저 확인해주세요. 계속 새면 사용을 멈추고 사진을 남겨 집주인이나 수리기사에게 알려주세요.\n\n• 집주인에게 연락하기\n• 근처 수리기사 찾기',
          conversation: nextScenarioContext(conversation, 'result', 'leakLocation', 'washer'),
        };
      }
      return { content: '싱크대, 화장실, 세탁기 중 어디에 가까운지 알려주세요.', conversation };
    }

    if (conversation.stage === 'sink-check') {
      if (/젖|새|샌|뚝뚝|물.*나/.test(answer)) {
        return {
          content: '연결부나 배수관 누수 가능성이 있어요. 싱크대 아래 밸브를 잠글 수 있으면 잠그고, 양동이나 수건으로 물을 받아주세요. 직접 분해하지 말고 젖은 곳을 사진으로 남겨 집주인에게 수리 요청하는 게 좋아요.\n\n책임 주체: 임대 설비라면 집주인 또는 관리실\n\n• 집주인에게 연락하기\n• 근처 수리기사 찾기',
          conversation: nextScenarioContext(conversation, 'result', 'sinkLeak', 'yes'),
        };
      }
      if (/안젖|안새|정상|모르겠/.test(answer)) {
        return {
          content: '눈에 보이는 누수가 없더라도 물을 사용할 때만 새는지 한 번 확인해보세요. 계속 떨어지거나 아래쪽이 젖으면 사용을 줄이고 집주인에게 알려주세요.',
          conversation: nextScenarioContext(conversation, 'result', 'sinkLeak', 'unclear'),
        };
      }
      return { content: '싱크대 아래 연결부나 배수관 주변이 젖어 있는지 알려주세요.', conversation };
    }
  }

  if (conversation.flowId === 'toilet-clog' && conversation.stage === 'water-level') {
    if (/높|차올|넘칠|많/.test(answer)) {
      return {
        content: '물이 넘칠 수 있으니 더 이상 물을 내리지 말아주세요. 변기 뒤 또는 옆의 급수 밸브를 시계 방향으로 잠글 수 있으면 잠그고, 관리실이나 집주인에게 바로 알려주세요.\n\n책임 주체: 관리실 또는 집주인\n\n• 집주인에게 연락하기\n• 관리실에 문의하기',
        conversation: nextScenarioContext(conversation, 'result', 'toiletWaterLevel', 'high'),
      };
    }
    if (/낮|평소|안높|괜찮/.test(answer)) {
      return {
        content: '물이 차오르지 않는다면 한 번만 뚫어뻥을 사용해볼 수 있어요. 해결되지 않거나 반복해서 막히면 이물질·배관 문제일 수 있으니 집주인이나 관리실에 점검을 요청해주세요.\n\n• 해결 방법 보기\n• 집주인에게 연락하기',
        conversation: nextScenarioContext(conversation, 'result', 'toiletWaterLevel', 'normal'),
      };
    }
    return { content: '평소보다 물이 높아졌는지, 차오르는지 알려주세요.', conversation };
  }

  if (conversation.flowId === 'power-outage' && conversation.stage === 'scope') {
    if (/전체|다|전부|집전체/.test(answer)) {
      return {
        content: '집 전체가 꺼졌다면 건물 정전 가능성도 있어요. 창밖이나 공용 복도 조명도 함께 확인하고, 분전함을 반복해서 올리지 말고 관리실에 먼저 문의해주세요.\n\n책임 주체: 관리실\n\n• 관리실에 문의하기\n• 정전 정보 확인하기',
        conversation: nextScenarioContext(conversation, 'result', 'powerScope', 'whole-home'),
      };
    }
    if (/방|콘센트|일부|특정/.test(answer)) {
      return {
        content: '특정 공간만 안 되면 해당 차단기가 내려갔는지 한 번만 확인해주세요. 다시 내려가거나 타는 냄새가 나면 올리지 말고 집주인이나 전문기사에게 알려주세요.\n\n책임 주체: 임대 설비라면 집주인 또는 전문기사\n\n• 집주인에게 연락하기\n• 근처 수리기사 찾기',
        conversation: nextScenarioContext(conversation, 'result', 'powerScope', 'partial'),
      };
    }
    return { content: '집 전체인지, 특정 방이나 콘센트만 안 되는지 알려주세요.', conversation };
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

function smalltalkReply(kind: 'greeting' | 'thanks' | 'complaint' | 'about-ai' | 'help'): string {
  if (kind === 'greeting') return '안녕하세요! 자두AI예요. 자취하면서 생긴 문제를 편하게 말씀해주세요.';
  if (kind === 'thanks') return '도움이 됐다니 다행이에요! 다른 것도 궁금하면 말씀해주세요.';
  if (kind === 'complaint') return '제가 잘못 이해했나 봐요 😅 어떤 부분이 이상했는지 말씀해주시면 다시 도와드릴게요.';
  if (kind === 'about-ai') return '저는 자취 중 생긴 생활 문제를 원인부터 확인하고, 직접 할 수 있는 조치와 집주인·관리실에 요청할 일을 정리해드려요.';
  return '제가 도와드릴 수 있는 문제를 골라주세요.';
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
        '안전이 먼저예요. 가스·전기·화재·누수 위험이 의심되면 기기를 직접 분해하거나 수리하지 말고, 가능하면 전원을 끄고 안전한 곳으로 이동해주세요.\n\n책임 주체: 관리실 또는 전문기사\n\n• 관리실에 문의하기\n• 위험이 계속되면 119에 연락하기',
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
        content: '보일러에 표시된 에러코드를 알려주세요.\n아래에서 선택하거나 직접 입력할 수 있어요.',
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
  const [isComposerMultiline, setIsComposerMultiline] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<SavedConversation[]>(loadConversationHistory);
  const [homeView, setHomeView] = useState<'intro' | 'resume'>(history.length > 0 ? 'resume' : 'intro');
  const [isTyping, setIsTyping] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(null);
  const [conversation, setConversation] = useState<AIConversationContext>(EMPTY_CONVERSATION);
  const [isTerminalResult, setIsTerminalResult] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isImageLocationQuestion, setIsImageLocationQuestion] = useState(false);
  const [attachmentFollowup, setAttachmentFollowup] = useState<'file' | 'contact' | null>(null);
  const [attachmentPanel, setAttachmentPanel] = useState<'camera' | 'file' | 'contact' | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactTel, setContactTel] = useState('');
  const [contactMode, setContactMode] = useState<'choice' | 'manual'>('choice');
  const [contactNotice, setContactNotice] = useState('');
  const [isContactSelecting, setIsContactSelecting] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState('');
  const [showFallbackSuggestions, setShowFallbackSuggestions] = useState(false);
  const [aiView, setAiView] = useState<'home' | 'chat' | 'settings'>('home');
  const storedAISettings = loadAIChatSettings(user?.email ?? 'guest');
  const [contractType, setContractType] = useState(storedAISettings.contractType);
  const [aiLocation, setAiLocation] = useState<AILocation | null>(storedAISettings.location);
  const [contractTypeDraft, setContractTypeDraft] = useState(storedAISettings.contractType);
  const [locationDraft, setLocationDraft] = useState<AILocation | null>(storedAISettings.location);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<AILocation[]>([]);
  const [locationNotice, setLocationNotice] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isRepairLocationModalOpen, setIsRepairLocationModalOpen] = useState(false);
  const [isRepairSearchLoading, setIsRepairSearchLoading] = useState(false);
  const [isRepairMapOpen, setIsRepairMapOpen] = useState(false);
  const [repairMapState, setRepairMapState] = useState<'loading' | 'result' | 'empty' | 'error'>('loading');
  const [repairRequestState, setRepairRequestState] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
  const [repairAnimationDone, setRepairAnimationDone] = useState(false);
  const [repairSearchLocation, setRepairSearchLocation] = useState<RepairSearchLocation | null>(null);
  const [repairShops, setRepairShops] = useState<RepairShop[]>([]);
  const [selectedRepairShopId, setSelectedRepairShopId] = useState<string | null>(null);
  const [repairContactNotice, setRepairContactNotice] = useState('');
  const [repairSearchAttempt, setRepairSearchAttempt] = useState(0);
  const [isRepairConnectionNoticeOpen, setIsRepairConnectionNoticeOpen] = useState(false);
  const [isBuildingInfoOpen, setIsBuildingInfoOpen] = useState(false);
  const [housingDraft, setHousingDraft] = useState('원룸');
  const [closeState, setCloseState] = useState<'open' | 'closing-left' | 'closing-right'>('open');
  const pageRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLTextAreaElement>(null);
  const messageIdRef = useRef(0);
  const conversationIdRef = useRef<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  /* 첨부 미리보기로 대화 영역 높이가 바뀔 때, 사용자가 이미 맨 아래를 보고 있던
   * 경우에만 마지막 메시지를 계속 보이게 한다. */
  const chatPinnedToBottomRef = useRef(true);
  const responseTimerRef = useRef<number | null>(null);
  const repairSearchTimerRef = useRef<number | null>(null);
  const repairMapFallbackTimerRef = useRef<number | null>(null);
  const repairMapResultTimerRef = useRef<number | null>(null);
  const repairMapVideoRef = useRef<HTMLVideoElement>(null);
  const repairSearchAbortRef = useRef<AbortController | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const benefitRailDragRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  } | null>(null);
  const suppressBenefitCardClickRef = useRef(false);
  const [isBenefitRailDragging, setIsBenefitRailDragging] = useState(false);
  const profileLocation = user?.preferences?.answers.location?.[0];
  const personaProfile = PERSONA_PROFILE[user?.persona ?? 'beginner'];
  const livingProfile = loadLivingProfile(user?.email ?? 'guest', personaProfile);
  const housingValue = livingProfile.housing ?? housingDraft;
  const effectiveLocation = aiLocation?.displayName ?? profileLocation;
  const repairMapAreaName = aiLocation?.sigungu || aiLocation?.dong || effectiveLocation || '설정 지역';
  const locationSummaryName = aiLocation ? ([aiLocation.sigungu, aiLocation.dong].filter(Boolean).join(' ') || aiLocation.displayName) : undefined;
  const userChips = [contractType, housingValue, locationSummaryName].filter((chip): chip is string => Boolean(chip));
  const profileContext: ScenarioUserContext = {
    name: user?.name,
    persona: user?.persona,
    location: effectiveLocation,
    experience: livingProfile.experience,
    housing: livingProfile.housing,
    contract: contractType,
  };
  const personaPrompts = AI_PROMPTS_BY_PERSONA[user?.persona ?? 'beginner'];

  const appendAssistantMessage = (
    content: string,
    ctas?: ChatCta[],
    benefitRecommendations?: BenefitRecommendation[],
    benefitCtaText?: string,
    pestDiagnosis?: boolean,
  ) => {
    setMessages((current) => [
      ...current,
      {
        id: ++messageIdRef.current,
        role: 'assistant',
        ...(ctas ? { content, ctas } : splitMessageCtas(content)),
        ...(benefitRecommendations ? { benefitRecommendations } : {}),
        ...(benefitCtaText ? { benefitCtaText } : {}),
        ...(pestDiagnosis ? { pestDiagnosis } : {}),
      },
    ]);
  };

  const makeBoilerTransferMessage = (recipient: '집주인' | '관리실', source: string) => {
    const powerChecked = source.includes('전원 공급은 정상') || source.includes('차단기 상태');
    const recipientLine = recipient === '집주인'
      ? '보일러 또는 조절기 점검이 필요할 것 같아 연락드립니다.'
      : '관리실에서 확인 가능한 사항인지 문의드립니다.';
    return `안녕하세요.\n보일러가 작동하지 않아 확인해봤습니다.${powerChecked
      ? '\n플러그와 차단기는 정상인 상태입니다.'
      : '\n조절기 화면과 전원 상태를 확인했지만 문제가 계속됩니다.'}\n${recipientLine}`;
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement('textarea');
        field.value = text;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      appendAssistantMessage('전달 문구를 복사했어요. 필요한 곳에 붙여넣어 보내주세요.');
    } catch {
      appendAssistantMessage('복사 기능을 사용할 수 없어요. 아래 문구를 직접 선택해 전달해주세요.\n\n' + text);
    }
  };

  const openAISettings = () => {
    setHousingDraft(livingProfile.housing ?? '원룸');
    setContractTypeDraft(contractType);
    setLocationDraft(aiLocation);
    setLocationSearchOpen(false);
    setLocationQuery('');
    setLocationResults([]);
    setLocationNotice('');
    setAiView('settings');
  };

  const startRepairSearch = (location: string, source: 'saved' | 'new') => {
    if (conversation.flowId === 'repair-search') {
      setConversation((current) => ({ ...current, stage: 'search' }));
    }
    appendAssistantMessage(
      source === 'saved'
        ? `설정된 '${location}' 기준으로 찾아볼게요.`
        : `설정해주신 '${location}' 기준으로 찾아볼게요.`,
    );
    setIsRepairSearchLoading(true);
    if (repairSearchTimerRef.current !== null) window.clearTimeout(repairSearchTimerRef.current);
    repairSearchTimerRef.current = window.setTimeout(() => {
      appendAssistantMessage(
        `${location} 주변 수리업체를 찾았어요.\n지도에서 가까운 업체를 확인해보세요.`,
        [{ label: '지도에서 확인하기' }],
      );
      setConversation((current) => current.flowId === 'repair-search'
        ? { ...current, stage: 'result' }
        : current);
      setIsRepairSearchLoading(false);
      repairSearchTimerRef.current = null;
    }, 1200);
  };

  const openRepairLocationModal = () => {
    setLocationDraft(aiLocation);
    setLocationQuery('');
    setLocationResults([]);
    setLocationNotice('');
    setIsRepairLocationModalOpen(true);
  };

  const closeRepairLocationModal = () => {
    setIsRepairLocationModalOpen(false);
    setLocationDraft(aiLocation);
    setLocationQuery('');
    setLocationResults([]);
    setLocationNotice('');
  };

  const saveRepairLocation = () => {
    if (!locationDraft) return;
    saveAIChatSettings(user?.email ?? 'guest', { contractType, location: locationDraft });
    setAiLocation(locationDraft);
    setIsRepairLocationModalOpen(false);
    setLocationQuery('');
    setLocationResults([]);
    setLocationNotice('');
    startRepairSearch(locationDraft.displayName, 'new');
  };

  const openRepairMap = () => {
    if (repairMapFallbackTimerRef.current !== null) window.clearTimeout(repairMapFallbackTimerRef.current);
    if (repairMapResultTimerRef.current !== null) window.clearTimeout(repairMapResultTimerRef.current);
    repairMapFallbackTimerRef.current = null;
    repairMapResultTimerRef.current = null;
    setRepairMapState('loading');
    setRepairRequestState('idle');
    setRepairAnimationDone(false);
    setRepairShops([]);
    setSelectedRepairShopId(null);
    setRepairContactNotice('');
    setIsRepairMapOpen(true);
  };

  const clearRepairMapTimers = () => {
    if (repairMapFallbackTimerRef.current !== null) window.clearTimeout(repairMapFallbackTimerRef.current);
    if (repairMapResultTimerRef.current !== null) window.clearTimeout(repairMapResultTimerRef.current);
    repairMapFallbackTimerRef.current = null;
    repairMapResultTimerRef.current = null;
  };

  const scheduleRepairMapResult = () => {
    if (!isRepairMapOpen || repairMapState !== 'loading' || repairMapResultTimerRef.current !== null) return;
    if (repairMapFallbackTimerRef.current !== null) {
      window.clearTimeout(repairMapFallbackTimerRef.current);
      repairMapFallbackTimerRef.current = null;
    }
    repairMapResultTimerRef.current = window.setTimeout(() => {
      setRepairAnimationDone(true);
      repairMapResultTimerRef.current = null;
    }, REPAIR_MAP_RESULT_DELAY);
  };

  const closeRepairMap = () => {
    clearRepairMapTimers();
    repairSearchAbortRef.current?.abort();
    repairSearchAbortRef.current = null;
    repairMapVideoRef.current?.pause();
    setIsRepairMapOpen(false);
    setRepairMapState('loading');
    setRepairRequestState('idle');
    setSelectedRepairShopId(null);
    setRepairContactNotice('');
  };

  const retryRepairSearch = () => {
    clearRepairMapTimers();
    repairSearchAbortRef.current?.abort();
    setRepairMapState('loading');
    setRepairRequestState('idle');
    setRepairAnimationDone(false);
    setRepairShops([]);
    setSelectedRepairShopId(null);
    setRepairContactNotice('');
    setRepairSearchAttempt((attempt) => attempt + 1);
  };

  const saveRepairShopContact = async (shop: RepairShop) => {
    if (!shop.name.trim() || !shop.phone.trim()) return;
    const result = await deliverRepairShopVCard(shop);
    if (result !== 'cancelled') setRepairContactNotice(shop.name);
  };

  const handleCta = (cta: ChatCta, source: string) => {
    switch (cta.action ?? cta.label) {
      case 'open-move-in-checklist':
        navigation?.closeAIChat();
        navigation?.navigate('life-first');
        return;
      case 'open-life-homecare':
        navigation?.closeAIChat();
        navigation?.navigate('life-homecare');
        return;
      case 'search-repair-current-location':
        if (!effectiveLocation) {
          openRepairLocationModal();
          return;
        }
        startRepairSearch(effectiveLocation, 'saved');
        return;
      case 'change-repair-search-location':
        openRepairLocationModal();
        return;
      case '집주인에게 연락하기': {
        const message = makeBoilerTransferMessage('집주인', source);
        appendAssistantMessage(`집주인에게 이렇게 전달해보세요.\n\n${message}`, [
          { label: '내용 복사하기', copyText: message },
          { label: '다른 방법 보기' },
        ]);
        return;
      }
      case '관리실에 문의하기': {
        const message = makeBoilerTransferMessage('관리실', source);
        appendAssistantMessage(`관리실에 이렇게 문의해보세요.\n\n${message}`, [
          { label: '내용 복사하기', copyText: message },
        ]);
        return;
      }
      case '내용 복사하기':
        void copyText(cta.copyText ?? source);
        return;
      case '다른 방법 보기':
        appendAssistantMessage('집주인과 바로 연결하기 어렵다면 관리실에 먼저 문의하거나, 수리 가능 업체를 찾아볼 수 있어요.', [
          { label: '관리실에 문의하기' },
          { label: '근처 수리기사 찾기' },
        ]);
        return;
      case '근처 수리기사 찾기':
        if (!effectiveLocation) {
          openRepairLocationModal();
          return;
        }
        startRepairSearch(effectiveLocation, 'saved');
        return;
      case '지도에서 확인하기':
        openRepairMap();
        return;
      case '지역 설정하기':
        openRepairLocationModal();
        return;
      case '맞춤 혜택 전체 보기':
        navigation?.closeAIChat();
        navigation?.navigate('benefits-recommend');
        return;
      case '건물 생활 정보 보기':
        setIsBuildingInfoOpen(true);
        return;
      case '해결 방법 보기':
        appendAssistantMessage('직접 확인할 수 있는 범위부터 한 단계씩 볼게요.\n\nSTEP 1\n보일러 플러그가 콘센트에 단단히 꽂혀 있는지 확인해주세요.', [
          { label: '다음 단계 보기' },
        ]);
        return;
      case '다음 단계 보기':
        appendAssistantMessage('STEP 2\n분전함에서 보일러·난방 차단기가 내려가 있지 않은지 확인해주세요.\n\nSTEP 3\n조절기를 1분 뒤 다시 켜고 난방·온수 설정을 확인해주세요.', [
          { label: '확인 결과 정리하기' },
        ]);
        return;
      case '확인 결과 정리하기':
        appendAssistantMessage('확인한 뒤에도 문제가 계속되면 직접 분해하지 말고 점검을 요청해주세요.', [
          { label: '집주인에게 연락하기' },
          { label: '근처 수리기사 찾기' },
        ]);
        return;
      case '위험이 계속되면 119에 연락하기':
        window.location.href = 'tel:119';
        return;
      case '이사 후 순서 보기':
        appendAssistantMessage('이사 후에는 전입신고를 먼저 진행하고, 확정일자를 확인한 뒤 주소 변경이 필요한 서비스를 정리하면 돼요.', [
          { label: '전입신고 방법 보기' },
          { label: '확정일자 확인하기' },
        ]);
        return;
      case '전입신고 방법 보기':
        appendAssistantMessage('전입신고는 정부24 온라인 신청 또는 관할 주민센터 방문으로 진행할 수 있어요. 본인에게 편한 방법을 선택해보세요.', [
          { label: '온라인 신청 순서 보기' },
          { label: '방문 준비물 보기' },
        ]);
        return;
      case '확정일자 확인하기':
        appendAssistantMessage('확정일자는 임대차계약서를 기준으로 주민센터 또는 온라인에서 확인할 수 있어요. 전입신고 후 함께 확인해두세요.', [
          { label: '전입신고 방법 보기' },
        ]);
        return;
      case '온라인 신청 순서 보기':
        appendAssistantMessage('정부24에서 본인 인증 후 전입신고 메뉴를 선택하세요. 새 주소와 세대 정보를 입력하고 제출 전 내용을 한 번 더 확인하면 됩니다.');
        return;
      case '방문 준비물 보기':
        appendAssistantMessage('주민센터 방문 전 신분증과 임대차계약서를 챙기세요. 이사한 주소의 관할 주민센터에서 접수할 수 있어요.');
        return;
      case '신청 조건 자세히 보기':
        appendAssistantMessage('지원 제도마다 나이, 소득, 주거 형태, 모집 기간이 달라요. 현재 저장된 조건을 기준으로 공고의 세부 조건을 확인한 뒤 신청 여부를 판단해주세요.', [
          { label: '신청 방법 보기' },
        ]);
        return;
      case '신청 방법 보기':
        appendAssistantMessage('지원 공고에서 접수 기간과 제출 서류를 확인한 뒤, 안내된 공식 신청 경로로 진행해주세요. 대상 여부는 최종 심사에서 결정됩니다.', [
          { label: '다른 지원도 찾아보기' },
        ]);
        return;
      case '다른 지원도 찾아보기':
        appendAssistantMessage('현재 조건만으로 지원 대상 여부를 확정할 수는 없어요. 다른 공고도 비교하며 신청 조건을 확인해보세요.', [
          { label: '신청 조건 자세히 보기' },
        ]);
        return;
      default:
        appendAssistantMessage('이 안내와 관련해 필요한 정보를 정리했어요. 이전 단계로 돌아가 다른 선택지를 확인해보세요.');
    }
  };

  const openBenefitRecommendations = () => {
    navigation?.closeAIChat();
    navigation?.navigate('benefits-recommend');
  };

  const handleBenefitRailPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // 터치 입력은 브라우저의 네이티브 swipe 스크롤을 그대로 사용한다.
    if (event.pointerType === 'touch') return;

    const rail = event.currentTarget;
    benefitRailDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      moved: false,
    };
    rail.setPointerCapture(event.pointerId);
    setIsBenefitRailDragging(true);
  };

  const handleBenefitRailPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = benefitRailDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 6) drag.moved = true;
    event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
    if (drag.moved) event.preventDefault();
  };

  const finishBenefitRailDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = benefitRailDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      suppressBenefitCardClickRef.current = true;
      window.setTimeout(() => {
        suppressBenefitCardClickRef.current = false;
      }, 0);
    }
    benefitRailDragRef.current = null;
    setIsBenefitRailDragging(false);
  };

  const handleBenefitCardClick = () => {
    if (suppressBenefitCardClickRef.current) {
      suppressBenefitCardClickRef.current = false;
      return;
    }
    openBenefitRecommendations();
  };

  const discardPendingAttachments = () => {
    setAttachments((current) => {
      current.filter((attachment): attachment is ImageAttachment => attachment.type === 'image').forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
        objectUrlsRef.current.delete(previewUrl);
      });
      return [];
    });
  };

  const revokeAllAttachmentUrls = () => {
    objectUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    objectUrlsRef.current.clear();
  };

  const addImageAttachment = (photo: File, source: ImageAttachment['source']) => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      setAttachmentNotice('첨부는 최대 5개까지 가능해요.');
      return;
    }
    const previewUrl = URL.createObjectURL(photo);
    objectUrlsRef.current.add(previewUrl);
    setAttachments((current) => [...current, {
      type: 'image', id: `${photo.name}-${photo.lastModified}-${source}`, name: photo.name, previewUrl, source,
    }]);
  };

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>, source: ImageAttachment['source']) => {
    const photo = Array.from(event.target.files ?? []).find((file) => file.type.startsWith('image/'));
    event.target.value = '';
    if (!photo) return;
    addImageAttachment(photo, source);
    setIsAttachMenuOpen(false);
    setAttachmentPanel(null);
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    const invalidFile = selectedFiles.find((file) => file.size > MAX_FILE_SIZE);
    if (invalidFile) {
      setAttachmentNotice('10MB 이하의 파일만 첨부할 수 있어요.');
      return;
    }
    if (attachments.length + selectedFiles.length > MAX_ATTACHMENTS) {
      setAttachmentNotice('첨부는 최대 5개까지 가능해요.');
      return;
    }
    setAttachments((current) => [...current, ...selectedFiles.map((file) => ({
      type: 'file' as const, id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size,
    }))]);
    setIsAttachMenuOpen(false);
    setAttachmentPanel(null);
  };

  const removePendingAttachment = (attachmentId: string) => {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === attachmentId);
      if (removed?.type === 'image') {
        URL.revokeObjectURL(removed.previewUrl);
        objectUrlsRef.current.delete(removed.previewUrl);
      }
      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const resetContactPanel = () => {
    setContactName('');
    setContactTel('');
    setContactMode('choice');
    setContactNotice('');
    setIsContactSelecting(false);
  };

  const closeAttachmentPanel = () => {
    if (attachmentPanel === 'contact') resetContactPanel();
    setAttachmentPanel(null);
  };

  const addContactAttachment = ({ name, tel }: { name: string; tel: string }) => {
    const normalizedTel = tel.trim();
    if (!normalizedTel) return;
    if (attachments.length >= MAX_ATTACHMENTS) {
      setAttachmentNotice('첨부는 최대 5개까지 가능해요.');
      return;
    }
    setAttachments((current) => [...current, {
      type: 'contact', id: `contact-${Date.now()}`, name: name.trim() || '이름 없는 연락처', tel: normalizedTel,
    }]);
    resetContactPanel();
    setAttachmentPanel(null);
  };

  const openContactPicker = () => {
    setIsAttachMenuOpen(false);
    resetContactPanel();
    setAttachmentPanel('contact');
  };

  const selectDeviceContact = async () => {
    const contactPicker = getContactPicker();
    if (!contactPicker) {
      setContactNotice('현재 환경에서는 연락처 불러오기를 지원하지 않아요.\n직접 입력해서 추가해주세요.');
      setContactMode('manual');
      return;
    }
    setContactNotice('');
    setIsContactSelecting(true);
    try {
      const [contact] = await contactPicker.select(['name', 'tel'], { multiple: false });
      if (!contact) return;
      const name = contact.name?.find((value) => value.trim()) ?? '';
      const tel = contact.tel?.find((value) => value.trim()) ?? '';
      if (!tel) {
        setContactNotice('전화번호가 등록된 연락처를 선택해주세요.');
        return;
      }
      addContactAttachment({ name, tel });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setContactNotice('연락처를 불러오지 못했어요. 직접 입력해서 추가해주세요.');
      setContactMode('manual');
    } finally {
      setIsContactSelecting(false);
    }
  };

  const sendMessage = (
    content: string,
    expectedStage?: string,
    pendingAttachments: ChatAttachment[] = [],
    forcedScenario?: AIPersonaPrompt['scenario'],
  ) => {
    const question = content.trim();
    if ((!question && pendingAttachments.length === 0) || isTyping) return;
    setAiView('chat');
    const activeStage = isImageLocationQuestion ? 'image-location' : (attachmentFollowup ? `attachment-${attachmentFollowup}` : (diagnosis?.stage ?? conversation.stage));
    if (expectedStage && activeStage !== expectedStage) return;
    /* 보일러 진단은 기존 diagnosis state가 단계 문맥을 소유하므로 그대로 넘긴다. */
    const inputResolution = forcedScenario
      ? { type: 'scenario' as const, intent: forcedScenario }
      : diagnosis
        ? { type: 'answer' as const }
        : resolveConversationInput(question, conversation);

    /* 최종 결과 뒤에 직접 새 질문을 입력하면 exit action은 새 응답이 올 때까지 숨긴다. */
    setIsTerminalResult(false);

    setMessages((current) => [
      ...current,
      { id: ++messageIdRef.current, role: 'user', content: question, ...(pendingAttachments.length ? { attachments: pendingAttachments } : {}) },
    ]);
    setDraft('');
    setAttachments([]);
    setIsTyping(true);
    const hasImage = pendingAttachments.some((attachment) => attachment.type === 'image');
    const hasFile = pendingAttachments.some((attachment) => attachment.type === 'file');
    const hasContact = pendingAttachments.some((attachment) => attachment.type === 'contact');
    const startsPestPhoto = hasImage && /벌레|바퀴|해충/.test(question) && !diagnosis && !conversation.flowId;
    const answersImageLocationQuestion = isImageLocationQuestion;
    const naturalIntent = !diagnosis && inputResolution.type === 'scenario' ? inputResolution.intent : null;
    const scenarioReply = inputResolution.type === 'answer' && conversation.flowId && (
      conversation.flowType !== 'diagnosis'
      || ['boiler', 'pest-photo', 'mold-care', 'plumbing-leak', 'toilet-clog', 'power-outage'].includes(conversation.flowId)
    )
      ? getScenarioReply(question, conversation, profileContext)
      : null;
    const startedConversation = naturalIntent
      ? { flowId: naturalIntent.scenarioId, flowType: AI_SCENARIOS[naturalIntent.scenarioId].type, stage: naturalIntent.stage, persona: user?.persona ?? null, answers: {} }
      : null;
    const startsFileQuestion = hasFile && !question && !diagnosis && !conversation.flowId;
    const startsContactQuestion = hasContact && /보일러|집주인/.test(question) && !diagnosis && !conversation.flowId;
    const answersAttachmentFollowup = attachmentFollowup;
    const reply = scenarioReply || startsPestPhoto || answersImageLocationQuestion || naturalIntent || startsFileQuestion || startsContactQuestion || answersAttachmentFollowup || inputResolution.type === 'smalltalk' || inputResolution.type === 'cancel' || inputResolution.type === 'correction' || inputResolution.type === 'unknown'
      ? null
      : getDiagnosticReply(question, diagnosis, effectiveLocation);
    const isSupportResult = scenarioReply?.conversation.flowId === 'support'
      && scenarioReply.conversation.stage === 'result';
    const isPestResult = scenarioReply?.conversation.flowId === 'pest-photo'
      && scenarioReply.conversation.stage === 'result';

    responseTimerRef.current = window.setTimeout(() => {
      const correctionReply = conversation.flowId === 'plumbing-leak' && conversation.stage === 'sink-check'
        ? '알겠어요. 싱크대는 아니군요. 화장실이나 세탁기 중 어디에 가까운지 알려주세요.'
        : '제가 상황을 잘못 짚었나 봐요. 지금 어떤 도움이 필요한지 편하게 말씀해주세요.';
      const unknownReply = '제가 도와드릴 수 있는 문제를 골라주세요.';
      const assistantContent = startsPestPhoto
        ? '사진 속 벌레를 확인하고 있어요'
        : answersImageLocationQuestion
          ? '사진 내용은 직접 분석하지 않지만, 발견 위치를 바탕으로 다음 조치를 함께 확인해볼 수 있어요.'
          : startsFileQuestion
            ? '파일을 첨부해주셨네요.\n어떤 부분이 궁금한가요?'
            : startsContactQuestion
              ? '집주인에게 전달할 문구를 만들어드릴까요?'
              : answersAttachmentFollowup === 'contact'
                ? (question.includes('문구') ? '보일러 문제와 확인한 내용을 알려주시면 집주인에게 전달할 문구를 만들어드릴게요.' : '필요한 상황이 생기면 언제든 전달 문구를 함께 정리해드릴게요.')
                : answersAttachmentFollowup === 'file'
                  ? '파일 내용은 직접 읽지 않아요. 선택한 항목과 관련된 상황을 알려주시면 필요한 확인 순서를 안내해드릴게요.'
          : inputResolution.type === 'cancel'
            ? '알겠어요. 현재 진단은 여기서 마칠게요. 다른 도움이 필요하면 편하게 말씀해주세요.'
            : inputResolution.type === 'correction'
              ? correctionReply
              : inputResolution.type === 'smalltalk'
                ? smalltalkReply(inputResolution.kind)
                : inputResolution.type === 'unknown'
                  ? unknownReply
          : isSupportResult
            ? '내 조건에 맞는 혜택을 확인하고 있어요'
          : scenarioReply?.content
            ?? (startedConversation ? stageMessage(startedConversation.flowId, startedConversation.stage, profileContext) : reply!.content);
      if (!isPestResult) {
        const startingStage = startedConversation
          ? scenarioStage(startedConversation.flowId, startedConversation.stage)
          : null;
        setMessages((current) => [
          ...current,
          {
            id: ++messageIdRef.current,
            role: 'assistant',
            ...(scenarioReply?.ctas
              ? { content: assistantContent, ctas: scenarioReply.ctas.map((cta) => ({ ...cta })) }
              : startingStage?.ctas
                ? { content: assistantContent, ctas: startingStage.ctas.map((cta) => ({ ...cta })) }
              : splitMessageCtas(assistantContent)),
          },
        ]);
      }
      if (startsPestPhoto) {
        setConversation({ flowId: 'pest-photo', flowType: 'diagnosis', stage: 'analyzing', persona: user?.persona ?? null, answers: {} });
        setDiagnosis(null);
      } else if (answersImageLocationQuestion) {
        setIsImageLocationQuestion(false);
      } else if (startsFileQuestion) {
        setAttachmentFollowup('file');
      } else if (startsContactQuestion) {
        setAttachmentFollowup('contact');
      } else if (answersAttachmentFollowup) {
        setAttachmentFollowup(null);
      } else if (inputResolution.type === 'cancel') {
        setConversation(EMPTY_CONVERSATION);
        setDiagnosis(null);
      } else if (inputResolution.type === 'correction') {
        if (conversation.flowId === 'plumbing-leak' && conversation.stage === 'sink-check') {
          setConversation({ ...conversation, stage: 'location' });
        } else {
          setConversation(EMPTY_CONVERSATION);
        }
        setDiagnosis(null);
      } else if (inputResolution.type === 'unknown') {
        setShowFallbackSuggestions(true);
      } else if (scenarioReply) setConversation(
        isSupportResult
          ? { ...scenarioReply.conversation, stage: 'analyzing' }
          : scenarioReply.conversation,
      );
      else if (startedConversation) {
        setConversation(startedConversation);
        setDiagnosis(null);
        setShowFallbackSuggestions(false);
      }
      else setDiagnosis(reply!.diagnosis);
      if (isSupportResult) {
        /* 한 번의 response timer를 순차 재사용해 분석 문구와 결과가 중복되지 않게 한다. */
        responseTimerRef.current = window.setTimeout(() => {
          appendAssistantMessage(
            '현재 조건에 맞는 혜택을 찾았어요.\n신청 가능성이 높은 순서대로 보여드릴게요.',
            [{ label: '맞춤 혜택 전체 보기' }],
            BENEFIT_RECOMMENDATIONS,
            '더 자세한 조건과 신청 방법도 확인할 수 있어요.',
          );
          setConversation(scenarioReply.conversation);
          setIsTerminalResult(true);
          setIsTyping(false);
          responseTimerRef.current = null;
        }, 800);
        return;
      }
      if (startsPestPhoto) {
        responseTimerRef.current = window.setTimeout(() => {
          appendAssistantMessage('사진을 확인해봤어요.', undefined, undefined, undefined, true);
          setConversation({ flowId: 'pest-photo', flowType: 'diagnosis', stage: 'location', persona: user?.persona ?? null, answers: {} });
          setIsTyping(false);
          responseTimerRef.current = null;
        }, 800);
        return;
      }
      if (isPestResult && scenarioReply) {
        const solution = pestSolutionFor(scenarioReply.conversation.answers);
        setMessages((current) => [
          ...current,
          {
            id: ++messageIdRef.current,
            role: 'assistant',
            content: assistantContent,
            pestSolution: solution,
            ctas: [{ label: '건물 생활 정보 보기' }],
          },
        ]);
      }
      setIsTerminalResult(
        scenarioReply?.conversation.stage === 'result'
        || startedConversation?.stage === 'result'
        || reply?.diagnosis?.stage === 'result'
        || answersImageLocationQuestion
        || Boolean(answersAttachmentFollowup)
        || (!scenarioReply && !startedConversation && isSafetyRisk(question)),
      );
      setIsTyping(false);
      responseTimerRef.current = null;
    }, 700);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft, undefined, attachments);
  };

  const persistConversationSnapshot = (
    snapshotMessages: ChatMessage[],
    snapshotConversation: AIConversationContext,
    snapshotDiagnosis: Diagnosis,
  ): boolean => {
    const firstUserMessage = snapshotMessages.find((message) => message.role === 'user');
    if (!firstUserMessage) return false;

    const attachmentTitle = firstUserMessage.attachments?.[0]?.name;
    const title = firstUserMessage.content.trim() || attachmentTitle || '첨부한 대화';
    const now = new Date().toISOString();
    const id = conversationIdRef.current ?? `conversation-${Date.now()}`;
    conversationIdRef.current = id;
    setHistory((current) => {
      const createdAt = current.find((item) => item.id === id)?.createdAt ?? now;
      const next = [{
        id,
        title,
        createdAt,
        updatedAt: now,
        messages: snapshotMessages,
        conversation: snapshotConversation,
        diagnosis: snapshotDiagnosis,
      }, ...current.filter((item) => item.id !== id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      saveConversationHistory(next);
      return next;
    });
    return true;
  };

  const resetConversation = () => {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    if (repairSearchTimerRef.current !== null) {
      window.clearTimeout(repairSearchTimerRef.current);
      repairSearchTimerRef.current = null;
    }
    clearRepairMapTimers();
    repairMapVideoRef.current?.pause();
    setMessages([]);
    setDraft('');
    setIsTyping(false);
    setDiagnosis(null);
    setConversation(EMPTY_CONVERSATION);
    setShowFallbackSuggestions(false);
    setIsTerminalResult(false);
    setIsImageLocationQuestion(false);
    setAttachmentFollowup(null);
    setIsAttachMenuOpen(false);
    setAttachmentPanel(null);
    setContactName('');
    setContactTel('');
    setAttachmentNotice('');
    setIsRepairLocationModalOpen(false);
    setIsRepairSearchLoading(false);
    setIsRepairMapOpen(false);
    setRepairMapState('loading');
    setIsRepairConnectionNoticeOpen(false);
    setLocationQuery('');
    setLocationResults([]);
    setLocationNotice('');
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    discardPendingAttachments();
    messageIdRef.current = 0;
    conversationIdRef.current = null;
  };

  const openSavedConversation = (saved: SavedConversation) => {
    conversationIdRef.current = saved.id;
    messageIdRef.current = Math.max(0, ...saved.messages.map((message) => message.id));
    setMessages(saved.messages);
    setConversation(saved.conversation);
    setDiagnosis(saved.diagnosis);
    setIsTyping(false);
    setAiView('chat');
  };

  const startNewConversation = () => {
    const preservedCurrentConversation = persistConversationSnapshot(messages, conversation, diagnosis);
    resetConversation();
    setHomeView(preservedCurrentConversation || history.length > 0 ? 'resume' : 'intro');
    setAiView('home');
  };

  const returnToIntro = () => {
    persistConversationSnapshot(messages, conversation, diagnosis);
    resetConversation();
    setHomeView('intro');
    setAiView('home');
  };

  const returnToResume = () => {
    setHomeView('resume');
    setAiView('home');
  };

  const updateChatPinnedState = () => {
    const chat = chatRef.current;
    if (!chat) return;
    chatPinnedToBottomRef.current = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 4;
  };

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    chatPinnedToBottomRef.current = true;
  }, [messages, isTyping, diagnosis]);

  useEffect(() => {
    if (messages.length === 0 || isTyping) return;
    persistConversationSnapshot(messages, conversation, diagnosis);
  }, [messages, conversation, diagnosis, isTyping]);

  /* preview는 composer의 일반 flex 자식이다. 높이가 추가/제거되면 conversation의
   * flex 공간만 줄어든다. 이 레이아웃 직후에만 하단 고정 사용자를 보정한다. */
  useLayoutEffect(() => {
    const chat = chatRef.current;
    if (!chat || !chatPinnedToBottomRef.current) return;
    chat.scrollTop = chat.scrollHeight;
  }, [attachments]);

  useLayoutEffect(() => {
    const input = draftInputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 84)}px`;
    setIsComposerMultiline(input.scrollHeight > 28);
  }, [draft]);

  useEffect(
    () => () => {
      if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
      if (repairSearchTimerRef.current !== null) window.clearTimeout(repairSearchTimerRef.current);
      if (repairMapFallbackTimerRef.current !== null) window.clearTimeout(repairMapFallbackTimerRef.current);
      if (repairMapResultTimerRef.current !== null) window.clearTimeout(repairMapResultTimerRef.current);
      repairSearchAbortRef.current?.abort();
      repairMapVideoRef.current?.pause();
      revokeAllAttachmentUrls();
    },
    [],
  );

  useEffect(() => {
    if (!isRepairMapOpen || repairMapState !== 'loading') return undefined;

    const video = repairMapVideoRef.current;
    if (video) {
      video.currentTime = 0;
      video.playbackRate = REPAIR_MAP_PLAYBACK_RATE;
      void video.play().catch(() => {
        /* muted autoplay가 제한된 환경에서는 fallback으로 결과를 보여준다. */
      });
    }

    repairMapFallbackTimerRef.current = window.setTimeout(
      scheduleRepairMapResult,
      REPAIR_MAP_FALLBACK_DELAY,
    );

    return () => {
      clearRepairMapTimers();
      video?.pause();
    };
  }, [isRepairMapOpen, repairMapState]);

  useEffect(() => {
    if (!isRepairMapOpen) return undefined;
    const controller = new AbortController();
    repairSearchAbortRef.current?.abort();
    repairSearchAbortRef.current = controller;
    setRepairRequestState('loading');

    void getPreferredRepairLocation(aiLocation ? {
      label: aiLocation.displayName,
      latitude: aiLocation.latitude,
      longitude: aiLocation.longitude,
    } : null).then(async (location) => {
      if (controller.signal.aborted) return;
      setRepairSearchLocation(location);
      const shops = await getDemoRepairShops(location, repairKindFor(diagnosis, conversation.flowId, conversation.answers), controller.signal);
      if (controller.signal.aborted) return;
      setRepairShops(shops);
      setRepairRequestState(shops.length > 0 ? 'success' : 'empty');
    }).catch(() => {
      if (!controller.signal.aborted) setRepairRequestState('error');
    });

    return () => controller.abort();
  }, [isRepairMapOpen, repairSearchAttempt]);

  useEffect(() => {
    if (!isRepairMapOpen || !repairAnimationDone) return;
    if (repairRequestState === 'success') setRepairMapState('result');
    else if (repairRequestState === 'empty') setRepairMapState('empty');
    else if (repairRequestState === 'error') setRepairMapState('error');
  }, [isRepairMapOpen, repairAnimationDone, repairRequestState]);

  useEffect(() => {
    if (!isRepairMapOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRepairConnectionNoticeOpen) closeRepairMap();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isRepairMapOpen, isRepairConnectionNoticeOpen]);

  useEffect(() => {
    if (!isBuildingInfoOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsBuildingInfoOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isBuildingInfoOpen]);

  const conversationStarted = messages.length > 0 && aiView === 'chat';
  const hasConversationHistory = history.length > 0;
  const isResumeView = aiView === 'home' && homeView === 'resume' && hasConversationHistory;
  const canOpenResumeView = aiView === 'home' && homeView === 'intro' && hasConversationHistory;
  const imageQuickReplies: QuickReply[] = isImageLocationQuestion
    ? ['주방', '화장실', '방', '현관'].map((label) => ({ id: `image-location-${label}`, label, stage: 'image-location' }))
    : [];
  const attachmentQuickReplies: QuickReply[] = attachmentFollowup === 'file'
    ? ['계약 기간', '보증금·월세', '특약', '수리 책임'].map((label) => ({ id: `file-${label}`, label, stage: 'attachment-file' }))
    : attachmentFollowup === 'contact'
      ? ['문구 만들어줘', '괜찮아요'].map((label) => ({ id: `contact-${label}`, label, stage: 'attachment-contact' }))
      : [];
  const fallbackQuickReplies: QuickReply[] = FALLBACK_SCENARIO_PROMPTS.map((label) => ({
    id: `fallback-${label}`,
    label,
    stage: 'fallback',
  }));
  const scenarioReplies = scenarioQuickReplies(conversation);
  const quickReplies = !isTyping
    ? (isImageLocationQuestion ? imageQuickReplies : attachmentFollowup ? attachmentQuickReplies : diagnosis ? quickRepliesForDiagnosis(diagnosis) : scenarioReplies.length > 0 ? scenarioReplies : showFallbackSuggestions ? fallbackQuickReplies : [])
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

  const setFromCurrentLocation = () => {
    setLocationNotice('');
    setLocationSearchOpen(false);
    setLocationResults([]);
    if (!navigator.geolocation) {
      setLocationNotice('현재 위치를 확인할 수 없어요. 지역을 직접 검색해주세요.');
      return;
    }
    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void reverseGeocodeKoreanLocation(coords.latitude, coords.longitude)
          .then((nextLocation) => {
            setLocationDraft(nextLocation);
            setLocationNotice(`${nextLocation.displayName}(으)로 설정했어요. 저장하기를 눌러 적용해주세요.`);
          })
          .catch(() => setLocationNotice('현재 지역을 확인하지 못했어요. 지역을 직접 검색해주세요.'))
          .finally(() => setIsLocationLoading(false));
      },
      () => {
        setIsLocationLoading(false);
        setLocationNotice('위치 권한을 허용하거나 지역을 직접 검색해주세요.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const submitLocationSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!locationQuery.trim() || isLocationLoading) return;
    setIsLocationLoading(true);
    setLocationNotice('');
    setLocationResults([]);
    void searchKoreanLocations(locationQuery)
      .then((results) => {
        setLocationResults(results);
        if (results.length === 0) setLocationNotice('검색 결과가 없어요. 동, 구 또는 주소를 다시 입력해주세요.');
      })
      .catch(() => setLocationNotice('지역을 검색하지 못했어요. 잠시 후 다시 시도해주세요.'))
      .finally(() => setIsLocationLoading(false));
  };

  /* AI는 별도 drawer가 아니라, 현재 보이는 앱 shell 안에 렌더링하는 전체 화면이다. */
  const renderInAppShell = (content: ReactNode) => {
    const appShell = getVisibleAppShell();
    return appShell ? createPortal(content, appShell) : content;
  };

  if (aiView === 'settings') {
    const saveSettings = () => {
      saveLivingProfile(user?.email ?? 'guest', { ...livingProfile, housing: housingDraft as typeof HOUSING_TYPES[number] });
      saveAIChatSettings(user?.email ?? 'guest', { contractType: contractTypeDraft, location: locationDraft });
      setContractType(contractTypeDraft); setAiLocation(locationDraft);
      setAiView('home');
    };
    const referenceChips = [housingValue, contractType, locationSummaryName].filter((value): value is string => Boolean(value));
    return renderInAppShell(<div ref={pageRef} className={`ai-chat-page app ai-chat-page--settings${closeState === 'open' ? '' : ` is-${closeState}`}`} onAnimationEnd={finishClose}><StatusBar />
      <header className="ai-chat-page__settings-header"><button type="button" className="ai-chat-page__settings-back" aria-label="자두AI 홈으로 돌아가기" onClick={() => setAiView('home')}><img src={icon('gnb-back.svg')} alt="" aria-hidden="true" /></button><div className="ai-chat-page__profile"><img src={icon('ai-avatar.svg')} alt="" /><span className="ai-chat-page__profile-copy"><strong>자두AI</strong><span>맞춤 설정을 편집해요</span></span></div><button type="button" className="ai-chat-page__close" aria-label="자두AI 닫기" onClick={closeChat} disabled={closeState !== 'open'}><img src={icon('gnb-close.svg')} alt="" /></button></header>
      <section className="ai-chat-page__settings-summary" aria-labelledby="ai-reference-title"><h2 id="ai-reference-title">자두AI가 참고하는 정보</h2><p>답변할 때 아래 정보를 활용해요.</p><div>{referenceChips.map((value) => <span key={value}>{value}</span>)}</div></section>
      <main className="ai-chat-page__settings-body">
        <section className="ai-chat-page__settings-section" aria-labelledby="ai-housing-title">
          <header className="ai-chat-page__settings-section-head"><h2 id="ai-housing-title"><span>1</span>내 주거 정보</h2><p>자두AI가 상황에 맞는 답변을 드릴 때 참고해요.</p></header>
          <div className="ai-chat-page__settings-field"><h3>주거 형태</h3><p>현재 거주 중인 주거 형태를 선택해주세요.</p><div className="ai-chat-page__settings-grid">{HOUSING_TYPES.map((value) => <button key={value} type="button" className="ai-chat-page__settings-choice" aria-pressed={housingDraft === value} onClick={() => setHousingDraft(value)}>{value}</button>)}</div></div>
          <div className="ai-chat-page__settings-field"><h3>계약 형태</h3><p>현재 계약 형태를 선택해주세요.</p><div className="ai-chat-page__settings-grid">{(['월세', '전세', '자가', '기타'] as const).map((value) => <button key={value} type="button" className="ai-chat-page__settings-choice" aria-pressed={contractTypeDraft === value} onClick={() => setContractTypeDraft(value)}>{value}</button>)}</div></div>
        </section>
        <section className="ai-chat-page__settings-section" aria-labelledby="ai-location-title">
          <header className="ai-chat-page__settings-section-head"><h2 id="ai-location-title"><span>2</span>내 위치</h2><p>자두AI가 주변 시설, 수리 서비스, 지역 정보를 찾을 때 참고해요.</p></header>
          <div className="ai-chat-page__location-current">{locationDraft ? <><h3>현재 설정된 지역</h3><strong>{locationDraft.displayName}</strong></> : <p>아직 설정된 지역이 없어요.</p>}</div>
          <div className="ai-chat-page__location-actions"><button type="button" onClick={setFromCurrentLocation} disabled={isLocationLoading}>{isLocationLoading && !locationSearchOpen ? '위치 확인 중...' : locationDraft ? '현재 위치로 변경' : '현재 위치로 설정'}</button><button type="button" onClick={() => { setLocationSearchOpen(true); setLocationNotice(''); }} disabled={isLocationLoading}>{locationDraft ? '지역 변경' : '지역 검색'}</button></div>
          {locationNotice && <p className="ai-chat-page__location-notice" role="status">{locationNotice}</p>}
        </section>
      </main><button className="ai-chat-page__settings-save" onClick={saveSettings}>저장하기</button>
      {locationSearchOpen && <div className="ai-chat-page__location-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLocationSearchOpen(false); }}><section className="ai-chat-page__location-sheet" role="dialog" aria-modal="true" aria-labelledby="location-search-title"><div className="ai-chat-page__location-sheet-handle" /><header><h2 id="location-search-title">지역 검색</h2><button type="button" aria-label="지역 검색 닫기" onClick={() => setLocationSearchOpen(false)}><img src={icon('sheet-close.svg')} alt="" /></button></header><form onSubmit={submitLocationSearch}><input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="동, 구, 주소를 검색해보세요" aria-label="지역 검색어" autoFocus /><button type="submit" aria-label="지역 검색 실행" disabled={!locationQuery.trim() || isLocationLoading}><img src={icon('community-search.svg')} alt="" /></button></form>{locationResults.length > 0 && <ul>{locationResults.map((result) => <li key={`${result.latitude}-${result.longitude}`}><button type="button" onClick={() => { setLocationDraft(result); setLocationSearchOpen(false); setLocationResults([]); setLocationNotice(`${result.displayName}(으)로 선택했어요. 저장하기를 눌러 적용해주세요.`); }}>{result.displayName}</button></li>)}</ul>}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></section></div>}
    </div>);
  }

  return renderInAppShell(
    <div
      ref={pageRef}
      className={`ai-chat-page app${closeState === 'open' ? '' : ` is-${closeState}`}`}
      onAnimationEnd={finishClose}
    >
      <StatusBar />
      <header className="ai-chat-page__header">
        <div className="ai-chat-page__header-left">
          {/* 화면 navigation 전용 — 자두AI를 나가 원래 앱 화면으로 돌아간다(닫기와 같은
            * 동작이지만, 좌상단 '이전 화면' 자리는 항상 노출해 화면 진입 상태와 무관하게
            * 표준 뒤로가기 위치를 지킨다). 대화 화면 안에서 자두AI '홈'으로만 돌아가는
            * 것은 아래 conversation 제어 영역의 '처음으로'가 맡는다 — 서로 다른 동작이다. */}
          <button
            type="button"
            className="ai-chat-page__header-back"
            aria-label="이전 화면으로 이동"
            onClick={closeChat}
            disabled={closeState !== 'open'}
          >
            <img src={icon('gnb-back.svg')} alt="" />
          </button>
          <div className="ai-chat-page__profile">
            <img src={icon('ai-avatar.svg')} alt="" />
            <span className="ai-chat-page__profile-copy">
              <strong>자두AI</strong>
              <span className="ai-chat-page__status-row">
                <span className="ai-chat-page__status-dot" aria-hidden="true" />
                <span>24시간 운영해요</span>
              </span>
            </span>
          </div>
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
        <button type="button" className="ai-chat-page__chip ai-chat-page__chip--edit" onClick={openAISettings}>
          편집
        </button>
      </div>

      {/* '처음으로'는 이어서 물어보기 화면에서만 최초 화면으로 이동할 수 있게 노출한다. */}
      {isResumeView && (
        <div className="ai-chat-page__conversation-controls">
          <button type="button" className="ai-chat-page__go-home" onClick={returnToIntro}>
            <img src="/assets/icon/chatbot/reset.svg" alt="" aria-hidden="true" />
            <span>처음으로</span>
          </button>
        </div>
      )}

      {canOpenResumeView && (
        <div className="ai-chat-page__conversation-controls">
          <button type="button" className="ai-chat-page__go-home" onClick={returnToResume}>
            <img src="/assets/icon/chatbot/reset.svg" alt="" aria-hidden="true" />
            <span>이어서 물어보기</span>
          </button>
        </div>
      )}

      {conversationStarted && (
        <div className="ai-chat-page__conversation-controls">
          <button type="button" className="ai-chat-page__new-conversation" onClick={startNewConversation}>
            <img src={icon('ai-plus.svg')} alt="" aria-hidden="true" />
            <span>새 대화</span>
          </button>
        </div>
      )}

      {conversationStarted ? (
        <div className="ai-chat-page__conversation-wrap">
          <div ref={chatRef} className="ai-chat-page__conversation" role="log" aria-live="polite" onScroll={updateChatPinnedState}>
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
                {message.attachments && (
                  <div className="ai-chat-page__message-attachments">
                    {message.attachments.map((attachment) => attachment.type === 'image' ? (
                      <img key={attachment.id} className="ai-chat-page__message-image" src={attachment.previewUrl} alt="첨부한 이미지" />
                    ) : attachment.type === 'file' ? (
                      <div key={attachment.id} className="ai-chat-page__attachment-card ai-chat-page__attachment-card--file">
                        <AttachmentDetails attachment={attachment} />
                      </div>
                    ) : (() => {
                      const phoneNumber = getCallablePhoneNumber(attachment.tel);
                      return (
                        <div key={attachment.id} className="ai-chat-page__attachment-card ai-chat-page__attachment-card--contact">
                          <AttachmentDetails attachment={attachment} />
                          {phoneNumber && <span className="ai-chat-page__contact-actions"><a href={`tel:${phoneNumber}`} aria-label={`${attachment.name ?? '연락처'} 전화하기`}>전화하기</a><a href={`sms:${phoneNumber}`} aria-label={`${attachment.name ?? '연락처'} 문자 보내기`}>문자 보내기</a></span>}
                        </div>
                      );
                    })())}
                  </div>
                )}
                {message.content && <p className="ai-chat-page__bubble">{message.content}</p>}
                {message.role === 'assistant' && message.pestDiagnosis && (
                  <section className="ai-chat-page__pest-diagnosis" aria-label="사진 기반 벌레 진단">
                    <p>{MOCK_PEST_PHOTO_DIAGNOSIS.title}</p>
                    <div className="ai-chat-page__pest-diagnosis-score">
                      <strong>{MOCK_PEST_PHOTO_DIAGNOSIS.confidence}</strong>
                      <span>{MOCK_PEST_PHOTO_DIAGNOSIS.risk}</span>
                    </div>
                    <h3>어디에서 발견했나요?</h3>
                  </section>
                )}
                {message.role === 'assistant' && message.pestSolution && (
                  <>
                    <section className="ai-chat-page__pest-solution" aria-label="벌레 문제 원인과 해결 방법">
                      <div>
                        <h3>왜 생겼을까요?</h3>
                        <ul>{message.pestSolution.causeItems.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                      <div>
                        <h3>지금 이렇게 해보세요</h3>
                        <ol>{message.pestSolution.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                      </div>
                    </section>
                    <section className="ai-chat-page__building-info" aria-label="건물 생활 정보">
                      <h3>건물 공용부도 확인해보세요</h3>
                      <p>공용 배수구, 복도, 쓰레기 배출 공간처럼 건물 공용부도 함께 확인해보세요.</p>
                    </section>
                  </>
                )}
                {message.role === 'assistant' && message.benefitRecommendations && (
                  <div className="ai-chat-page__benefit-result" aria-label="추천 혜택">
                    <div
                      className={`ai-chat-page__benefit-cards${isBenefitRailDragging ? ' is-dragging' : ''}`}
                      onPointerDown={handleBenefitRailPointerDown}
                      onPointerMove={handleBenefitRailPointerMove}
                      onPointerUp={finishBenefitRailDrag}
                      onPointerCancel={finishBenefitRailDrag}
                    >
                      {message.benefitRecommendations.map((benefit) => (
                        <button
                          key={benefit.title}
                          type="button"
                          className="ai-chat-page__benefit-card"
                          onClick={handleBenefitCardClick}
                          aria-label={`${benefit.title} 혜택 목록에서 자세히 보기`}
                        >
                          <span className={`ai-chat-page__benefit-status${benefit.status === '조건 확인 필요' ? ' is-pending' : ''}`}>
                            {benefit.status}
                          </span>
                          <strong>{benefit.title}</strong>
                          <span className="ai-chat-page__benefit-description">{benefit.description}</span>
                          <span className="ai-chat-page__benefit-symbol" aria-hidden="true">₩</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {message.role === 'assistant' && message.ctas && (
                  <div className={`ai-chat-page__ctas${message.benefitCtaText ? ' ai-chat-page__ctas--benefit' : ''}`} aria-label="다음 행동">
                    {message.benefitCtaText && <p className="ai-chat-page__benefit-cta-copy">{message.benefitCtaText}</p>}
                    {message.ctas.map((cta, index) => (
                      <div
                        key={`${cta.label}-${index}`}
                        className={`ai-chat-page__cta-item${cta.recommended ? ' is-recommended' : ''}`}
                      >
                        {cta.recommended && <span className="ai-chat-page__cta-recommend-label">자두 추천</span>}
                        <button
                          type="button"
                          className={`ai-chat-page__cta${cta.recommended ? ' ai-chat-page__cta--recommended' : ''}`}
                          onClick={() => handleCta(cta, message.content)}
                        >
                          <span>{cta.label}</span>
                          <span className="ai-chat-page__cta-arrow" aria-hidden="true">→</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    onClick={() => sendMessage(reply.label, reply.stage === 'fallback' ? undefined : reply.stage)}
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
            {isRepairSearchLoading && (
              <div className="ai-chat-page__message ai-chat-page__message--assistant">
                <img className="ai-chat-page__message-avatar" src={icon('ai-avatar.svg')} alt="" />
                <div className="ai-chat-page__message-content">
                  <span className="ai-chat-page__message-sender">자두AI</span>
                  <div className="ai-chat-page__repair-search-status" role="status" aria-live="polite">
                    <strong>{effectiveLocation} 주변을 찾고 있어요</strong>
                    <span>가까운 수리업체를 확인하고 있어요.</span>
                    <span className="ai-chat-page__repair-search-dots" aria-hidden="true"><i /><i /><i /></span>
                  </div>
                </div>
              </div>
            )}
            {isTerminalResult && !isTyping && (
              <div className="ai-chat-page__exit-action">
                <button type="button" className="ai-chat-page__exit-button" onClick={resetConversation}>
                  다른 문제 물어보기
                </button>
              </div>
            )}
          </div>
        </div>
      ) : isResumeView ? (
        <div className="ai-chat-page__returning">
          <div className="ai-chat-page__returning-intro"><img className="ai-chat-page__mole" src={img('ai/ai-mole.svg')} alt="" /><p>다시 만나서 반가워요!<br />오늘은 뭐가 궁금하세요?</p></div>
          <section className="ai-chat-page__recent" aria-labelledby="recent-conversations-title"><h2 id="recent-conversations-title">이어서 물어보기</h2><div className="ai-chat-page__recent-list">{history.map((saved) => <button key={saved.id} type="button" onClick={() => openSavedConversation(saved)}><span>{saved.title}</span><time dateTime={saved.updatedAt}>{formatConversationDate(saved.updatedAt)}</time></button>)}</div></section>
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
              {personaPrompts.map((prompt) => (
                <li key={prompt.label}>
                  <button
                    type="button"
                    className="ai-chat-page__prompt"
                    onClick={() => sendMessage(prompt.label, undefined, [], prompt.scenario)}
                  >
                    {`“${prompt.label}”`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form className="ai-chat-page__input-area" onSubmit={onSubmit}>
        <input
          ref={photoInputRef}
          className="ai-chat-page__photo-input"
          type="file"
          accept="image/*"
          onChange={(event) => handleImageSelection(event, 'photo')}
        />
        <input ref={cameraInputRef} className="ai-chat-page__photo-input" type="file" accept="image/*" capture="environment" onChange={(event) => handleImageSelection(event, 'camera')} />
        <input ref={fileInputRef} className="ai-chat-page__photo-input" type="file" multiple onChange={handleFileSelection} />
        {attachmentNotice && <p className="ai-chat-page__attachment-notice" role="status">{attachmentNotice}</p>}
        {attachments.length > 0 && (
          <div className="ai-chat-page__attachment-preview" aria-label="첨부 미리보기">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`ai-chat-page__attachment-preview-item${
                  attachment.type === 'image'
                    ? ' ai-chat-page__attachment-preview-item--image'
                    : attachment.type === 'contact'
                      ? ' ai-chat-page__attachment-preview-item--contact'
                      : ' ai-chat-page__attachment-preview-item--file'
                }`}
              >
                {attachment.type === 'image' ? (
                  <img src={attachment.previewUrl} alt={`${attachment.name} 미리보기`} />
                ) : attachment.type === 'contact' ? (
                  <div className="ai-chat-page__attachment-preview-card ai-chat-page__attachment-preview-card--contact">
                    <AttachmentDetails attachment={attachment} />
                  </div>
                ) : (
                  <div className="ai-chat-page__attachment-preview-card ai-chat-page__attachment-preview-card--file">
                    <AttachmentDetails attachment={attachment} />
                  </div>
                )}
                <button type="button" aria-label="첨부 삭제" onClick={() => removePendingAttachment(attachment.id)}>×</button>
              </div>
            ))}
          </div>
        )}
        <div className={`ai-chat-page__input-bar${isComposerMultiline ? ' is-multiline' : ''}`}>
          <button
            type="button"
            className="ai-chat-page__input-icon"
            aria-label="첨부하기"
            aria-expanded={isAttachMenuOpen}
            onClick={() => setIsAttachMenuOpen((isOpen) => !isOpen)}
          >
            <img src={icon('ai-plus.svg')} alt="" />
          </button>
          <textarea
            ref={draftInputRef}
            rows={1}
            placeholder="자취 고민을 입력해보세요."
            aria-label="자취 고민 입력"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="ai-chat-page__input-actions">
            <button type="button" className="ai-chat-page__input-icon" aria-label="음성 입력">
              <img src="/assets/icon/chatbot/mic.svg" alt="" />
            </button>
            <button
              type="submit"
              className="ai-chat-page__send"
              aria-label="메시지 전송"
              disabled={isTyping || (!draft.trim() && attachments.length === 0)}
            >
              <img src="/assets/icon/chatbot/send.svg" alt="" />
            </button>
          </div>
        </div>
      </form>

      {isRepairLocationModalOpen && (
        <div
          className="ai-chat-page__repair-location-backdrop"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeRepairLocationModal(); }}
        >
          <section
            className="ai-chat-page__repair-location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="repair-location-title"
            aria-describedby="repair-location-description"
          >
            <header>
              <h2 id="repair-location-title">지역을 설정해주세요</h2>
              <p id="repair-location-description">주변 수리업체를 찾으려면 지역 정보가 필요해요.</p>
            </header>
            <form className="ai-chat-page__repair-location-search" onSubmit={submitLocationSearch}>
              <input
                value={locationQuery}
                onChange={(event) => { setLocationQuery(event.target.value); setLocationDraft(null); }}
                placeholder="동, 구, 주소를 검색해보세요"
                aria-label="지역 검색어"
                autoFocus
              />
              <button type="submit" disabled={!locationQuery.trim() || isLocationLoading}>
                {isLocationLoading ? '검색 중' : '검색'}
              </button>
            </form>
            {locationNotice && <p className="ai-chat-page__repair-location-notice" role="status">{locationNotice}</p>}
            {locationResults.length > 0 && (
              <ul className="ai-chat-page__repair-location-results">
                {locationResults.map((result) => (
                  <li key={`${result.latitude}-${result.longitude}`}>
                    <button
                      type="button"
                      aria-pressed={locationDraft?.displayName === result.displayName}
                      onClick={() => {
                        setLocationDraft(result);
                        setLocationQuery(result.displayName);
                        setLocationNotice(`${result.displayName}(으)로 선택했어요.`);
                      }}
                    >
                      {result.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="ai-chat-page__repair-location-actions">
              <button type="button" onClick={closeRepairLocationModal}>취소</button>
              <button type="button" className="is-primary" disabled={!locationDraft} onClick={saveRepairLocation}>설정하기</button>
            </div>
          </section>
        </div>
      )}

      {isRepairMapOpen && (
        <div
          className="ai-chat-page__repair-map-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isRepairConnectionNoticeOpen) closeRepairMap();
          }}
        >
          <section
            className={`ai-chat-page__repair-map-modal is-${repairMapState}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="repair-map-title"
            aria-describedby="repair-map-description"
          >
            <header>
              <div>
                <h2 id="repair-map-title">
                  {repairMapState === 'loading'
                    ? '주변 수리 업체를 찾고있어요'
                    : repairMapState === 'error'
                      ? '업체 정보를 불러오지 못했어요'
                      : repairMapState === 'empty'
                        ? '가까운 업체를 찾지 못했어요'
                        : `${repairSearchLocation?.label ?? repairMapAreaName} 주변 수리업체`}
                </h2>
                <p id="repair-map-description">
                  {repairMapState === 'loading'
                    ? '설정한 지역을 기준으로 가까운 업체를 확인하고 있어요.'
                    : repairMapState === 'result'
                      ? `${repairSearchLocation?.isCurrentLocation ? '현재 위치' : '설정한 지역'}를 기준으로 찾았어요.`
                      : '잠시 후 다시 찾아보거나 검색 지역을 변경해보세요.'}
                </p>
              </div>
              <button type="button" aria-label="수리업체 지도 닫기" onClick={closeRepairMap}>
                <img src={icon('sheet-close.svg')} alt="" />
              </button>
            </header>
            {repairMapState === 'loading' ? (
              <div className="ai-chat-page__repair-map-loading">
                <div className="ai-chat-page__repair-map-loading-visual">
                  <video
                    ref={repairMapVideoRef}
                    src="/assets/video/chatbot/walk_jadu.mp4"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(event) => {
                      const video = event.currentTarget;
                      video.playbackRate = REPAIR_MAP_PLAYBACK_RATE;
                      if (repairMapFallbackTimerRef.current !== null) window.clearTimeout(repairMapFallbackTimerRef.current);
                      const playbackDuration = Number.isFinite(video.duration)
                        ? (video.duration / REPAIR_MAP_PLAYBACK_RATE) * 1000
                        : 0;
                      repairMapFallbackTimerRef.current = window.setTimeout(
                        scheduleRepairMapResult,
                        Math.max(REPAIR_MAP_FALLBACK_DELAY, playbackDuration + REPAIR_MAP_FALLBACK_BUFFER),
                      );
                    }}
                    onEnded={scheduleRepairMapResult}
                    aria-label="자두가 걸으며 주변 수리업체를 찾는 중"
                  />
                </div>
                <p className="ai-chat-page__repair-map-loading-status" role="status" aria-label="주변 수리업체 찾는 중">
                  {Array.from(REPAIR_MAP_LOADING_TEXT).map((character, index) => (
                    <span
                      key={`${character}-${index}`}
                      aria-hidden="true"
                      style={{ animationDelay: `${index * 70}ms, ${1400 + index * 70}ms` }}
                    >
                      {character}
                    </span>
                  ))}
                </p>
              </div>
            ) : repairMapState === 'result' && repairSearchLocation ? (
              <div className="ai-chat-page__repair-map-content">
                <div className="ai-chat-page__repair-map-result">
                  <LeafletRepairMap
                    location={repairSearchLocation}
                    shops={repairShops}
                    selectedShopId={selectedRepairShopId}
                    onSelectShop={setSelectedRepairShopId}
                  />
                  <div className="ai-chat-page__repair-shop-list" aria-label="주변 수리업체 목록">
                    {repairShops.map((shop) => (
                      <article key={shop.id} className={selectedRepairShopId === shop.id ? 'is-selected' : ''}>
                        <div className="ai-chat-page__repair-shop-info">
                          <strong>{shop.name}</strong>
                          <span>{shop.roadAddress || shop.address}</span>
                          <small>{shop.category}</small>
                          <small>{shop.phone}</small>
                        </div>
                        <div className="ai-chat-page__repair-shop-actions">
                          <button type="button" onClick={() => setSelectedRepairShopId(shop.id)}>지도에서 보기</button>
                          <button
                            type="button"
                            className="is-primary"
                            disabled={!shop.name.trim() || !shop.phone.trim()}
                            onClick={() => { void saveRepairShopContact(shop); }}
                          >
                            연락처 저장
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                  {repairContactNotice && (
                    <div className="ai-chat-page__repair-contact-notice" role="status">
                      <strong>연락처 파일을 준비했어요.</strong>
                      <span>{repairContactNotice} 연락처를 기기의 연락처 앱에서 저장해주세요.</span>
                    </div>
                  )}
                  <p className="ai-chat-page__repair-map-disclaimer">업체 정보는 프로토타입용 예시예요.</p>
                </div>
                <footer className="ai-chat-page__repair-map-footer">
                  <button
                    type="button"
                    className="ai-chat-page__repair-connect-button"
                    onClick={() => setIsRepairConnectionNoticeOpen(true)}
                  >
                    수리기사 연결하기
                  </button>
                </footer>
              </div>
            ) : (
              <div className="ai-chat-page__repair-map-empty" role="status">
                <strong>{repairMapState === 'empty' ? '이 지역에서는 바로 확인되는 업체가 없어요.' : '주변 업체 정보를 불러오지 못했어요.'}</strong>
                <p>{repairMapState === 'empty' ? '검색 범위를 조금 넓혀 다시 찾아볼까요?' : '잠시 후 다시 찾아주세요.'}</p>
                <button type="button" onClick={retryRepairSearch}>다시 찾기</button>
              </div>
            )}
          </section>
        </div>
      )}

      {isRepairConnectionNoticeOpen && (
        <div className="ai-chat-page__repair-notice-backdrop">
          <section
            className="ai-chat-page__repair-notice-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="repair-notice-title"
            aria-describedby="repair-notice-description"
          >
            <h2 id="repair-notice-title">수리기사 연결 서비스는 준비 중이에요</h2>
            <p id="repair-notice-description">더 빠르고 간편하게 수리기사를 연결할 수 있도록 준비하고 있어요.</p>
            <button
              type="button"
              onClick={() => {
                setIsRepairConnectionNoticeOpen(false);
                closeRepairMap();
              }}
            >
              확인
            </button>
          </section>
        </div>
      )}

      {isBuildingInfoOpen && (
        <div
          className="ai-chat-page__building-info-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsBuildingInfoOpen(false);
          }}
        >
          <section
            className="ai-chat-page__building-info-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="building-info-title"
            aria-describedby="building-info-description"
          >
            <div className="ai-chat-page__building-info-handle" aria-hidden="true" />
            <header>
              <div>
                <h2 id="building-info-title">건물 생활 정보</h2>
                <p id="building-info-description">비슷한 상황에서 함께 확인하면 좋은 정보예요.</p>
              </div>
              <button type="button" aria-label="건물 생활 정보 닫기" onClick={() => setIsBuildingInfoOpen(false)}>
                <img src={icon('sheet-close.svg')} alt="" />
              </button>
            </header>

            <div className="ai-chat-page__building-info-list">
              {BUILDING_LIFE_INFO.map((item, index) => (
                <article key={item.title}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <section className="ai-chat-page__building-community" aria-labelledby="building-community-title">
              <h3 id="building-community-title">이웃들이 공유한 생활 정보</h3>
              <ul>
                {BUILDING_COMMUNITY_POSTS.map((post) => <li key={post}>{post}</li>)}
              </ul>
            </section>

            <button
              type="button"
              className="ai-chat-page__building-community-cta"
              onClick={() => {
                setIsBuildingInfoOpen(false);
                navigation?.closeAIChat();
                navigation?.navigate('community-region');
              }}
            >
              <span>커뮤니티에서 더 보기</span>
              <span aria-hidden="true">→</span>
            </button>
          </section>
        </div>
      )}

      {(isAttachMenuOpen || attachmentPanel) && (
        <div className="ai-chat-page__attachment-layer">
          <button type="button" className="ai-chat-page__attach-backdrop" aria-label="첨부 화면 닫기" onClick={() => { setIsAttachMenuOpen(false); closeAttachmentPanel(); }} />
          {isAttachMenuOpen && (
            <div className="ai-chat-page__attach-menu" role="menu" aria-label="첨부 메뉴">
              <button type="button" className="ai-chat-page__attach-menu-item" role="menuitem" onClick={() => { setIsAttachMenuOpen(false); setAttachmentPanel('camera'); }}><img src="/assets/icon/chatbot/camera.svg" alt="" />카메라</button>
              <button type="button" className="ai-chat-page__attach-menu-item" role="menuitem" onClick={() => { setIsAttachMenuOpen(false); if (photoInputRef.current) { photoInputRef.current.value = ''; photoInputRef.current.click(); } }}><img src="/assets/icon/chatbot/img.svg" alt="" />사진</button>
              <button type="button" className="ai-chat-page__attach-menu-item" role="menuitem" onClick={() => { setIsAttachMenuOpen(false); setAttachmentPanel('file'); }}><img src="/assets/icon/chatbot/clip.svg" alt="" />파일</button>
              <button type="button" className="ai-chat-page__attach-menu-item" role="menuitem" onClick={openContactPicker}><img src="/assets/icon/chatbot/person.svg" alt="" />연락처</button>
            </div>
          )}
          {attachmentPanel && (
            <section className="ai-chat-page__attachment-sheet" role="dialog" aria-modal="true" aria-label={`${attachmentPanel} 첨부`}>
              <header><strong>{attachmentPanel === 'file' ? '파일 선택' : attachmentPanel === 'camera' ? '카메라' : '연락처 추가'}</strong><button type="button" aria-label="첨부 화면 닫기" onClick={closeAttachmentPanel}>×</button></header>
              {attachmentPanel === 'camera' && <><p>촬영한 사진은 입력창 위 미리보기로 추가돼요.</p><button type="button" className="ai-chat-page__sheet-action" onClick={() => cameraInputRef.current?.click()}>사진 촬영하기</button></>}
              {attachmentPanel === 'file' && <><ul className="ai-chat-page__file-list"><li><img className="ai-chat-page__attachment-type-icon" src="/assets/icon/chatbot/file.svg" alt="" aria-hidden="true" /><span><strong>문서 파일</strong><small>PDF, TXT, DOC, DOCX 등 · 최대 10MB</small></span></li></ul><button type="button" className="ai-chat-page__sheet-action" onClick={() => fileInputRef.current?.click()}>기기에서 파일 선택</button></>}
              {attachmentPanel === 'contact' && (
                <div className="ai-chat-page__contact-panel">
                  {contactMode === 'choice' ? (
                    <>
                      <p className="ai-chat-page__contact-description">연락처에서 한 명을 선택해 자두AI에 추가할 수 있어요.<br />선택한 연락처 정보만 사용합니다.</p>
                      {contactNotice && <p className="ai-chat-page__contact-notice" role="status">{contactNotice}</p>}
                      <div className="ai-chat-page__contact-actions">
                        <button type="button" className="ai-chat-page__sheet-action is-primary" disabled={isContactSelecting} onClick={() => { void selectDeviceContact(); }}>
                          {isContactSelecting ? '연락처 여는 중...' : '연락처에서 선택하기'}
                        </button>
                        <button type="button" className="ai-chat-page__sheet-action" onClick={() => { setContactNotice(''); setContactMode('manual'); }}>직접 입력하기</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {contactNotice && <p className="ai-chat-page__contact-notice" role="status">{contactNotice}</p>}
                      <button type="button" className="ai-chat-page__contact-picker-link" disabled={isContactSelecting} onClick={() => { void selectDeviceContact(); }}>
                        {isContactSelecting ? '연락처 여는 중...' : '연락처에서 선택하기'}
                      </button>
                      <label className="ai-chat-page__contact-field">이름 (선택)<input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="이름을 입력해주세요" /></label>
                      <label className="ai-chat-page__contact-field">전화번호<input value={contactTel} onChange={(event) => setContactTel(event.target.value)} placeholder="전화번호를 입력해주세요" inputMode="tel" /></label>
                      <button type="button" className="ai-chat-page__sheet-action is-primary" disabled={!contactTel.trim()} onClick={() => addContactAttachment({ name: contactName, tel: contactTel })}>연락처 추가</button>
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}

    </div>
  );
}

export default AIChatPage;
