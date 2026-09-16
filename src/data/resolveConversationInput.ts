import { resolveScenarioIntent } from './aiScenarios';
import type { AIConversationContext, ScenarioIntent } from './aiScenarios';

export type ConversationInput =
  | { type: 'answer' }
  | { type: 'scenario'; intent: NonNullable<ScenarioIntent> }
  | { type: 'cancel' }
  | { type: 'correction' }
  | { type: 'smalltalk'; kind: 'greeting' | 'thanks' | 'complaint' | 'about-ai' | 'help' }
  | { type: 'unknown' };

const compact = (message: string) => message.replace(/\s/g, '').toLowerCase();

/** 현재 flow를 우선 존중하되, 취소·정정은 사용자를 흐름 밖으로 꺼낸다. */
export function resolveConversationInput(message: string, conversation: AIConversationContext): ConversationInput {
  const text = compact(message);
  const hasFlow = Boolean(conversation.flowId && conversation.stage && conversation.stage !== 'result');

  if (/처음부터|취소|그냥됐|됐어|그만|그거아니|그런문제없|필요없/.test(text)) return { type: 'cancel' };
  if (hasFlow && /아니|없어|아닌데|그딴|그런건/.test(text)) return { type: 'correction' };
  if (/^안녕|반가|하이|헬로/.test(text)) return { type: 'smalltalk', kind: 'greeting' };
  if (/고마|감사/.test(text)) return { type: 'smalltalk', kind: 'thanks' };
  if (/바보|멍청|별로|짜증|화나|싫어/.test(text)) return { type: 'smalltalk', kind: 'complaint' };
  if (/너.*뭐|자두ai.*뭐|할수있|누구야/.test(text)) return { type: 'smalltalk', kind: 'about-ai' };
  if (/도와|도움|어떡해|어떻게해/.test(text)) return { type: 'smalltalk', kind: 'help' };

  /* 진행 중인 질문의 답변은 새 intent보다 먼저 기존 시나리오에 넘긴다. */
  if (hasFlow) return { type: 'answer' };

  const intent = resolveScenarioIntent(message);
  if (intent) return { type: 'scenario', intent };
  return { type: 'unknown' };
}
