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
export type ScenarioCta = { label: string; action?: string; recommended?: boolean };

export type FlowStage = {
  message: string | ((user: ScenarioUserContext) => string);
  quickReplies?: readonly ScenarioQuickReply[];
  ctas?: readonly ScenarioCta[];
  inputMode?: 'hybrid' | 'text';
};

export type FlowScenario = {
  id: string;
  type: AIFlowType;
  persona?: 'beginner' | 'worker' | 'pet';
  stages: Record<string, FlowStage>;
};

export type MoldLocation = 'wall' | 'window' | 'bathroom' | 'other';
export type ScenarioRepairKind = 'boiler' | 'plumbing' | 'electric' | 'aircon' | 'general';

export type MoldCareResult = {
  message: string;
  ctas: readonly ScenarioCta[];
};

const MOLD_CARE_CTA: readonly ScenarioCta[] = [
  { label: '생활 관리 팁 더 보기', action: 'open-life-homecare', recommended: true },
];

/** 홈케어의 곰팡이·결로·습기 가이드와 같은 판단 기준을 채팅용으로 짧게 요약한다. */
export const MOLD_CARE_RESULTS: Record<MoldLocation, MoldCareResult> = {
  wall: {
    message: '벽 곰팡이는 외벽 결로나 가구 뒤 통풍 부족으로 습기가 쌓여 생길 수 있어요.\n\n1. 곰팡이가 생긴 부분을 먼저 충분히 말려주세요.\n2. 가구를 벽에서 조금 띄워 통풍 공간을 만들어주세요.\n3. 같은 자리가 반복해서 젖는다면 결로나 누수 흔적을 확인해주세요.\n4. 넓게 번지거나 벽지가 계속 젖으면 집주인이나 관리 주체에 알려주세요.',
    ctas: MOLD_CARE_CTA,
  },
  window: {
    message: '창문 주변이라면 결로 때문에 생겼을 가능성이 있어요.\n\n1. 창문과 창틀의 물기를 자주 닦아주세요.\n2. 짧게라도 주기적으로 환기해주세요.\n3. 커튼이 창문을 완전히 막지 않게 해주세요.\n4. 제습기나 제습제를 함께 활용해보세요.\n5. 실리콘 안쪽까지 검게 번졌다면 표면 청소만으로 해결되지 않을 수 있어요.',
    ctas: MOLD_CARE_CTA,
  },
  bathroom: {
    message: '욕실은 습도가 높아 타일 줄눈, 실리콘, 천장에 곰팡이가 생기기 쉬워요.\n\n1. 샤워 후 환풍기를 충분히 가동해주세요.\n2. 벽과 바닥에 남은 물기를 제거해주세요.\n3. 작은 범위의 실리콘이나 줄눈은 전용 제거제로 관리해주세요.\n4. 천장이나 넓은 범위에 반복되면 환풍기와 환기 상태를 확인해주세요.',
    ctas: MOLD_CARE_CTA,
  },
  other: {
    message: '정확한 위치를 특정하기 어렵다면 습기가 생기는 조건부터 살펴보세요.\n\n1. 주변이 계속 축축한지 확인해주세요.\n2. 물이 새거나 번진 흔적이 있는지 살펴보세요.\n3. 특정 계절이나 비 오는 날에만 생기는지 기록해주세요.\n4. 곰팡이 범위가 계속 넓어지는지 확인해주세요.\n\n이런 증상이 있다면 단순 습기보다 누수나 구조적인 문제일 수 있어요.',
    ctas: MOLD_CARE_CTA,
  },
};

export function resolveMoldLocation(message: string): MoldLocation | null {
  const text = message.replace(/\s/g, '').toLowerCase();
  if (/창문|창틀/.test(text)) return 'window';
  if (/욕실|화장실/.test(text)) return 'bathroom';
  if (/벽|벽지/.test(text)) return 'wall';
  if (/기타|다른곳|잘모르|모르겠/.test(text)) return 'other';
  return null;
}

export function resolveScenarioRepairKind(message: string): ScenarioRepairKind | null {
  const text = message.replace(/\s/g, '').toLowerCase();
  if (/보일러|난방/.test(text)) return 'boiler';
  if (/수도|배관|누수/.test(text)) return 'plumbing';
  if (/전기|정전|차단기/.test(text)) return 'electric';
  if (/에어컨|냉방/.test(text)) return 'aircon';
  if (/기타|일반|집수리/.test(text)) return 'general';
  return null;
}

export function repairSearchLocationStep(location?: string): { message: string; ctas: readonly ScenarioCta[] } {
  if (!location) {
    return {
      message: '현재 설정된 지역이 없어요.\n먼저 검색할 지역을 설정해주세요.',
      ctas: [{ label: '지역 설정하기', action: 'change-repair-search-location' }],
    };
  }
  return {
    message: `현재 설정된 지역을 기준으로 찾아볼까요?\n\n현재 지역: ${location}`,
    ctas: [
      { label: '이 지역에서 찾기', action: 'search-repair-current-location', recommended: true },
      { label: '지역 변경', action: 'change-repair-search-location' },
    ],
  };
}

/** 자유 입력을 기존 시나리오의 첫 단계로 연결하기 위한 해석 결과다. */
export type ScenarioIntent =
  | { scenarioId: 'boiler'; stage: 'power' }
  | { scenarioId: 'plumbing-leak'; stage: 'location' }
  | { scenarioId: 'plumbing-leak'; stage: 'sink-check' }
  | { scenarioId: 'toilet-clog'; stage: 'water-level' }
  | { scenarioId: 'power-outage'; stage: 'scope' }
  | { scenarioId: 'mold-care'; stage: 'location' }
  | { scenarioId: 'repair-search'; stage: 'category' }
  | { scenarioId: 'pre-move-check'; stage: 'result' }
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
  'pre-move-check': {
    id: 'pre-move-check', type: 'guide', persona: 'beginner',
    stages: {
      result: {
        message: (user) => {
          const trimmedName = user.name?.trim() ?? '';
          const displayName = trimmedName.length === 3 ? trimmedName.slice(1) : trimmedName;
          const greeting = displayName ? `${displayName}님은` : '지금은';
          const contract = user.contract ? `${user.contract}로 ` : '';
          return `${greeting} ${contract}곧 첫 입주를 앞두고 있네요!\n입주 전에 놓치기 쉬운 것부터 같이 확인해볼게요.\n\n1. 계약서와 특약 다시 확인\n2. 집 내부 하자 사진 남기기\n3. 수도 · 전기 · 가스 상태 확인\n4. 관리비 항목 확인\n5. 필요한 생활용품 준비`;
        },
        ctas: [
          { label: '입주 체크리스트 보기', action: 'open-move-in-checklist', recommended: true },
        ],
      },
    },
  },
  'mold-care': {
    id: 'mold-care', type: 'diagnosis', persona: 'worker',
    stages: {
      location: {
        message: (user) => {
          const trimmedName = user.name?.trim() ?? '';
          const displayName = trimmedName.length === 3 ? trimmedName.slice(1) : trimmedName;
          const greeting = displayName ? `${displayName}님, ` : '';
          return `${greeting}원룸 곰팡이는 생긴 위치에 따라 관리 방법이 조금 달라져요.\n우선 지금 바로 할 수 있는 것부터 알려드릴게요.\n\n1. 환기해서 실내 습도 낮추기\n2. 결로나 물기가 있다면 먼저 완전히 닦고 말리기\n3. 작은 범위라면 곰팡이 제거제를 사용해 관리하기\n\n곰팡이가 어디에 생겼나요?`;
        },
        quickReplies: [
          { label: '벽', value: 'wall' },
          { label: '창문 주변', value: 'window' },
          { label: '욕실', value: 'bathroom' },
          { label: '기타', value: 'other' },
        ],
      },
    },
  },
  'repair-search': {
    id: 'repair-search', type: 'guide', persona: 'pet',
    stages: {
      category: {
        message: '좋아요! 어떤 문제가 생겼는지 먼저 알려주세요.',
        quickReplies: [
          { label: '보일러', value: 'boiler' },
          { label: '수도 · 배관', value: 'plumbing' },
          { label: '전기', value: 'electric' },
          { label: '에어컨', value: 'aircon' },
          { label: '기타', value: 'general' },
        ],
      },
      'location-confirm': { message: '현재 설정된 지역을 기준으로 찾아볼까요?' },
      search: { message: '주변 수리업체를 찾고 있어요.' },
      result: { message: '주변 수리업체를 찾았어요.' },
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
  if (/곰팡이|곰팡/.test(text)) return { scenarioId: 'mold-care', stage: 'location' };
  if (/(수리업체|수리기사)/.test(text) && /(찾|알려|근처|있어|추천)/.test(text)) {
    return { scenarioId: 'repair-search', stage: 'category' };
  }
  if (/전입.?신고/.test(text)) return { scenarioId: 'moveIn', stage: 'move-stage' };
  if (/지원금|지원.?사업|혜택/.test(text)) return { scenarioId: 'support', stage: 'category' };
  return null;
}
