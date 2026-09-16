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

/** 취소·정정을 제외하면 현재 flow → 명확한 시나리오 intent → fallback 순서로 해석한다. */
export function resolveConversationInput(message: string, conversation: AIConversationContext): ConversationInput {
  const text = compact(message);
  const hasFlow = Boolean(conversation.flowId && conversation.stage && conversation.stage !== 'result');

  if (/처음부터|취소|그냥됐|됐어|그만|그거아니|그런문제없|필요없/.test(text)) return { type: 'cancel' };
  if (hasFlow && /아니|없어|아닌데|그딴|그런건/.test(text)) return { type: 'correction' };
  /* 진행 중인 질문의 답변은 새 intent나 자유대화보다 먼저 기존 시나리오에 넘긴다. */
  if (hasFlow) return { type: 'answer' };

  const intent = resolveScenarioIntent(message);
  if (intent) return { type: 'scenario', intent };

  /* 시나리오 밖 자유대화는 답변을 생성하지 않고 지원 범위 선택으로 돌린다. */
  return { type: 'unknown' };

}
