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

/** 자유 입력을 기존 시나리오의 첫 단계로 연결하기 위한 해석 결과다. */
export type ScenarioIntent =
  | { scenarioId: 'boiler'; stage: 'power' }
  | { scenarioId: 'plumbing-leak'; stage: 'location' }
  | { scenarioId: 'plumbing-leak'; stage: 'sink-check' }
  | { scenarioId: 'toilet-clog'; stage: 'water-level' }
  | { scenarioId: 'power-outage'; stage: 'scope' }
  | { scenarioId: 'moveIn'; stage: 'move-stage' }
  | { scenarioId: 'support'; stage: 'category' }
  | null;

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
      'error-code-input': {
        message: '보일러에 표시된 에러코드를 알려주세요.\n아래에서 선택하거나 직접 입력할 수 있어요.',
        inputMode: 'text',
        quickReplies: [
          { label: '03', value: '03' },
          { label: 'E1', value: 'E1' },
          { label: 'E2', value: 'E2' },
          { label: 'E3', value: 'E3' },
          { label: 'E5', value: 'E5' },
        ],
      },
    },
  },
  'pest-photo': {
    id: 'pest-photo', type: 'diagnosis',
    stages: {
      location: { message: '어디에서 발견했나요?', quickReplies: [
        { label: '싱크대 주변', value: 'sink_area' }, { label: '화장실', value: 'bathroom' },
        { label: '방', value: 'room' }, { label: '현관', value: 'entrance' },
      ] },
      'sink-food': { message: '최근 음식물 쓰레기를 오래 둔 적 있었나요?', quickReplies: [
        { label: '응 있었어', value: 'yes' }, { label: '아니 없어', value: 'no' }, { label: '잘 모르겠어', value: 'unknown' },
      ] },
    },
  },
  moveIn: {
    id: 'moveIn', type: 'guide', persona: 'beginner',
    stages: {
      'move-stage': { message: (user) => user.name
        ? `${user.name}님이 처음 해도 헷갈리지 않도록 순서대로 알려드릴게요.\n지금 이사는 어느 단계까지 진행됐나요?`
        : '처음 자취를 준비 중인 분이 처음 해도 헷갈리지 않도록 순서대로 알려드릴게요.\n지금 이사는 어느 단계까지 진행됐나요?', quickReplies: [
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
  'plumbing-leak': {
    id: 'plumbing-leak', type: 'diagnosis',
    stages: {
      location: { message: '어디에서 물이 새고 있나요?\n싱크대, 화장실, 세탁기 중 어디에 가까운지 알려주세요.', inputMode: 'hybrid' },
      'sink-check': { message: '싱크대 누수로 보이네요. 물을 잠그고, 수전 아래 연결부나 배수관 주변이 젖어 있는지 확인할 수 있나요?', inputMode: 'hybrid' },
    },
  },
  'toilet-clog': {
    id: 'toilet-clog', type: 'diagnosis',
    stages: {
      'water-level': { message: '변기 물이 차오르거나 넘칠 것 같다면 먼저 물을 내리지 말아주세요. 물 높이가 평소보다 높나요?', inputMode: 'hybrid' },
    },
  },
  'power-outage': {
    id: 'power-outage', type: 'diagnosis',
    stages: {
      scope: { message: '집 전체 전기가 나간 건가요, 아니면 특정 방이나 콘센트만 안 되나요?', inputMode: 'hybrid' },
    },
  },
};

export function scenarioStage(scenarioId: string, stage: string): FlowStage | null {
  return AI_SCENARIOS[scenarioId]?.stages[stage] ?? null;
}

/** 문장 전체 일치가 아닌 증상·장소 키워드를 함께 보며 문제 시나리오를 고른다. */
export function resolveScenarioIntent(message: string): ScenarioIntent {
  const text = message.replace(/\s/g, '').toLowerCase();
  const hasBoilerSubject = /보일러|난방/.test(text);
  const hasBoilerFailure = /안켜|작동.*안|안돼|안되|전원.*안들어|추워/.test(text);
  const hasLeak = /누수|물이.*(새|샌|떨어|뚝뚝)|새는.*물|물.*계속/.test(text);
  const hasSink = /싱크대|주방|부엌|수전|배수관/.test(text);
  const hasToilet = /변기|물이.*안.*내려|물.*차올|배변/.test(text);
  const hasPower = /정전|전기.*(나가|나갔)|불.*(꺼|나가|나갔)|집.*어두|차단기/.test(text);

  if (hasBoilerSubject && hasBoilerFailure) return { scenarioId: 'boiler', stage: 'power' };
  if (hasToilet) return { scenarioId: 'toilet-clog', stage: 'water-level' };
  if (hasPower) return { scenarioId: 'power-outage', stage: 'scope' };
  if (hasLeak && hasSink) return { scenarioId: 'plumbing-leak', stage: 'sink-check' };
  if (hasLeak) return { scenarioId: 'plumbing-leak', stage: 'location' };
  if (/전입.?신고/.test(text)) return { scenarioId: 'moveIn', stage: 'move-stage' };
  if (/지원금|지원.?사업|혜택/.test(text)) return { scenarioId: 'support', stage: 'category' };
  return null;
}
