export type AIFlowType = 'diagnosis' | 'guide' | 'recommendation';

export type AIConversationContext = {
  flowId: string | null;
  flowType: AIFlowType | null;
  stage: string | null;
  persona: string | null;
  answers: Record<string, string>;
};

export type ScenarioUserContext = {
  name?: string;
  persona?: string;
  location?: string;
  experience?: string | null;
  housing?: string | null;
  contract?: string;
};

export type ScenarioQuickReply = { label: string; value: string };

export type FlowStage = {
  message: string | ((user: ScenarioUserContext) => string);
  quickReplies?: readonly ScenarioQuickReply[];
  inputMode?: 'hybrid' | 'text';
};

export type FlowScenario = {
  id: string;
  type: AIFlowType;
  persona?: 'beginner' | 'pet';
  stages: Record<string, FlowStage>;
};

export const AI_SCENARIOS: Record<string, FlowScenario> = {
  boiler: {
    id: 'boiler', type: 'diagnosis',
    stages: {
      power: { message: '먼저 상태부터 하나씩 확인해볼게요.\n보일러 조절기 화면이 켜져 있나요?', quickReplies: [
        { label: '전원이 안 들어와요', value: 'power_off' }, { label: '전원은 들어와요', value: 'power_on' }, { label: '잘 모르겠어요', value: 'unknown' },
      ] },
      'power-off-check': { message: '전원 공급 쪽부터 확인해볼게요.\n보일러 플러그와 차단기는 정상인가요?', quickReplies: [
        { label: '둘 다 정상이에요', value: 'normal' }, { label: '문제가 있어요', value: 'issue' }, { label: '확인하는 법을 모르겠어요', value: 'unknown' },
      ] },
      'power-restored': { message: '이제 조절기 화면이 켜졌나요?', quickReplies: [
        { label: '켜졌어요', value: 'restored' }, { label: '아직 안 켜져요', value: 'not_restored' },
      ] },
      'power-on-symptom': { message: '전원은 들어오는군요. 난방과 온수 중 어떤 쪽에 문제가 있나요?', quickReplies: [
        { label: '난방만 안 돼요', value: 'heating' }, { label: '온수만 안 나와요', value: 'hot_water' }, { label: '둘 다 안 돼요', value: 'both' },
      ] },
      'error-code': { message: '조절기 화면에 숫자나 영문으로 된 오류 코드가 보이나요?', quickReplies: [
        { label: '에러코드가 보여요', value: 'has_code' }, { label: '에러코드는 없어요', value: 'no_code' }, { label: '잘 모르겠어요', value: 'unknown' },
      ] },
      'error-code-input': { message: '표시된 오류 코드를 입력해주세요. 예: 03, E1', inputMode: 'text' },
    },
  },
  moveIn: {
    id: 'moveIn', type: 'guide', persona: 'beginner',
    stages: {
      'move-stage': { message: (user) => `${user.name ?? '처음 자취를 준비 중인'} 분이 처음 해도 헷갈리지 않도록 순서대로 알려드릴게요.\n지금 이사는 어느 단계까지 진행됐나요?`, quickReplies: [
        { label: '아직 이사 전이에요', value: 'before' }, { label: '오늘 이사했어요', value: 'today' }, { label: '이미 이사했어요', value: 'moved' },
      ] },
      'before-move': { message: '전입신고는 실제 거주를 시작한 뒤 진행하면 돼요. 무엇부터 볼까요?', quickReplies: [
        { label: '준비물 알려줘요', value: 'materials' }, { label: '이사 후 순서 알려줘요', value: 'after_steps' },
      ] },
      method: { message: '그럼 이제 전입신고를 진행하면 돼요. 어떤 방법이 편하세요?', quickReplies: [
        { label: '온라인으로 할래요', value: 'online' }, { label: '주민센터 갈래요', value: 'office' }, { label: '추천해줘요', value: 'recommend' },
      ] },
    },
  },
  support: {
    id: 'support', type: 'recommendation', persona: 'pet',
    stages: {
      category: { message: (user) => {
        const profile = [user.experience, user.housing].filter(Boolean).join(' · ');
        return `${user.name ?? '설정'}${user.name ? '님이 설정해둔' : '한'} 자취 정보를 먼저 반영해서 찾아볼게요.${profile ? `\n현재 등록된 정보는 ${profile}예요.` : ''}\n어떤 지원이 가장 궁금하세요?`;
      }, quickReplies: [
        { label: '주거비 지원', value: 'housing' }, { label: '생활비 지원', value: 'living' }, { label: '전체적으로 보고 싶어요', value: 'all' },
      ] },
      income: { message: '현재 소득이 있나요?', quickReplies: [
        { label: '근로소득이 있어요', value: 'income' }, { label: '현재 소득이 없어요', value: 'none' }, { label: '잘 모르겠어요', value: 'unknown' },
      ] },
      contract: { message: '현재 계약 형태는 어떻게 되나요?', quickReplies: [
        { label: '월세', value: 'monthly' }, { label: '전세', value: 'deposit' }, { label: '기타', value: 'other' },
      ] },
    },
  },
};

export function scenarioStage(scenarioId: string, stage: string): FlowStage | null {
  return AI_SCENARIOS[scenarioId]?.stages[stage] ?? null;
}
