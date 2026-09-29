/**
 * 자두AI 첫 화면 추천 카드 3개의 "실행형" 안내 흐름.
 *
 * 각 선택지(GuidedOption.action)가 다음 목적지를 스스로 들고 있어서 별도의 진행 상태를
 * 두지 않는다 — 대화 기록(messages)만 저장·복원해도 흐름이 이어진다.
 *   guided:<flow>:<step>[:<param>]  다음 안내 단계로 이동
 *   guided-do:<effect>[:<param>]     실제 행동(업체 목록 / 정부24 / 앱 내 이동 / 조건 설정)
 * 질문으로 상황을 좁힌 뒤 "다음 행동이 필요한 시점"에만 recommended 를 1개 둔다 —
 * 목적지(업체 검색 / 정부24 / 혜택 화면)는 상담의 마지막 단계에서만 나온다.
 */
import type { AppPage } from '../navigation/routes';

export type GuidedFlowId = 'repair' | 'moveIn' | 'support';

/** 정부24 전입신고 민원 안내·신청 페이지 (CappBizCD 13100000016 = 전입신고) */
export const GOV24_MOVE_IN_URL = 'https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=A01004&CappBizCD=13100000016';

export type GuidedOption = { label: string; action: string; recommended?: boolean; note?: string };
export type GuidedContext = { location?: string; param?: string };
export type GuidedStep = { message: string; options: GuidedOption[] };

const step = (flow: GuidedFlowId, id: string, param?: string) =>
  `guided:${flow}:${id}${param ? `:${param}` : ''}`;

/** 혜택·복지 화면 목적지 param → AppPage (routes.ts 에 있는 실제 화면만) */
export const GUIDED_BENEFIT_PAGES: Record<string, AppPage> = {
  all: 'benefits',
  housing: 'benefits-housing',
  cost: 'benefits-cost',
};

type StepTable = Record<string, (ctx: GuidedContext) => GuidedStep>;

/* 상담 흐름 — 질문으로 상황을 좁힌 뒤에야 마지막에 목적지(업체 검색 / 정부24 / 혜택 화면)를 추천한다.
 * 추천 강조(recommended)는 "다음 행동이 필요한 시점"의 버튼 하나에만 둔다. */

/** 누수 위치 질문 앞에 붙는 한 줄 — 이전 답변에 따라 달라진다. */
const LOCATION_LEAD: Record<string, string> = {
  drip: '적게 떨어져도 오래 두면 싱크대 안쪽이 상할 수 있어요.\n대야를 받쳐두고, ',
  stopped: '지금은 멈췄어도 다시 샐 수 있어요.\n',
  novalve: '무리해서 잠그지 않아도 괜찮아요.\n',
};

const REPAIR_VERDICT: Record<string, string> = {
  supply: '수도관 연결부는 너트가 헐거워졌거나 패킹이 낡은 경우가 많아요. 살짝 조여서 해결되기도 해요.\n다만 계속 새거나 원인을 찾기 어렵다면 수리업체를 부르는 편이 안전해요.',
  drain: '배수관 연결부가 느슨한 경우라면 직접 조여볼 수도 있어요.\n다만 계속 새거나 원인을 찾기 어렵다면 수리업체를 부르는 편이 안전해요.',
  faucet: '수도꼭지 쪽은 패킹이나 카트리지가 닳아서 새는 경우가 많아요. 부품 교체가 필요할 수 있어요.\n원인을 찾기 어렵다면 수리업체를 부르는 편이 안전해요.',
  unknown: '위치를 알기 어려운 누수는 배관 안쪽 문제일 수 있어요.\n직접 확인하기보다 수리업체를 부르는 편이 안전해요.',
};

/** 집·수리: 누수 상태 → 응급조치 → 누수 위치 → 자가 해결 여부 → 전문가 판단 → 업체 찾기 */
const REPAIR_STEPS: StepTable = {
  start: () => ({
    message: '물이 새는 위치부터 확인해볼게요.\n지금도 계속 물이 흐르고 있나요?',
    options: [
      { label: '계속 새고 있어요', action: step('repair', 'valve') },
      { label: '가끔 한두 방울씩 떨어져요', action: step('repair', 'location', 'drip') },
      { label: '지금은 멈췄어요', action: step('repair', 'location', 'stopped') },
    ],
  }),
  valve: () => ({
    message: '먼저 추가 누수를 막는 게 좋아요.\n싱크대 아래쪽 급수 밸브를 잠글 수 있나요?',
    options: [
      { label: '밸브 위치를 알아요', action: step('repair', 'valve-close') },
      { label: '어디 있는지 모르겠어요', action: step('repair', 'valve-find') },
      { label: '이미 잠갔어요', action: step('repair', 'location') },
    ],
  }),
  'valve-close': () => ({
    message: '싱크대 아래 벽이나 배관 쪽에 냉수·온수 밸브가 하나씩 있어요.\n\n1. 손잡이를 시계 방향으로 끝까지 돌려 잠가주세요.\n2. 물이 멈췄는지 확인해주세요.',
    options: [{ label: '잠갔어요', action: step('repair', 'location') }],
  }),
  'valve-find': () => ({
    message: '싱크대 아래 수납장 안쪽, 벽에서 나온 배관 끝의 작은 손잡이가 급수 밸브예요.\n찾기 어렵다면 집 전체 수도 밸브(계량기 근처)를 잠가도 돼요.',
    options: [
      { label: '잠갔어요', action: step('repair', 'location') },
      { label: '잠그기 어려워요', action: step('repair', 'location', 'novalve') },
    ],
  }),
  location: ({ param }) => ({
    message: `${param ? LOCATION_LEAD[param] : '좋아요. '}이제 어디에서 새는지 확인해볼게요.`,
    options: [
      { label: '수도관 연결부에서 새요', action: step('repair', 'verdict', 'supply') },
      { label: '배수관 아래에서 새요', action: step('repair', 'verdict', 'drain') },
      { label: '수도꼭지 쪽에서 새요', action: step('repair', 'verdict', 'faucet') },
      { label: '어디서 새는지 잘 모르겠어요', action: step('repair', 'verdict', 'unknown') },
    ],
  }),
  /* 자가 해결이 가능한지 안내하고, 여기서 처음으로 "전문가 도움 받기"를 추천한다. */
  verdict: ({ param }) => ({
    message: REPAIR_VERDICT[param ?? 'unknown'] ?? REPAIR_VERDICT.unknown,
    options: [
      { label: '직접 확인하는 방법 보기', action: step('repair', 'diy', param) },
      { label: '전문가 도움 받기', action: step('repair', 'expert', param), recommended: true },
    ],
  }),
  diy: ({ param }) => ({
    message: `${param === 'drain' ? '배수관 연결 너트' : param === 'supply' ? '수도관 연결 너트' : param === 'faucet' ? '수도꼭지 아래 연결부' : '싱크대 아래 배관'}를 이렇게 확인해보세요.\n\n1. 밸브가 잠겨 있는지 먼저 확인해주세요.\n2. 마른 휴지로 닦고 어디서 물이 맺히는지 보세요.\n3. 헐거운 너트는 손으로 살짝만 조여주세요.\n\n세게 조이면 파손될 수 있어요. 그래도 새면 전문가에게 맡겨주세요.`,
    options: [
      { label: '해결됐어요', action: step('repair', 'solved') },
      { label: '전문가 도움 받기', action: step('repair', 'expert', param), recommended: true },
    ],
  }),
  solved: () => ({
    message: '다행이에요! 며칠은 밸브 주변이 마른 상태인지 한 번씩 살펴봐주세요.\n다시 새면 언제든 이어서 도와드릴게요.',
    options: [],
  }),
  /* 이미 설정된 지역(챗봇 상단 조건)을 그대로 쓴다 — 주소를 다시 입력받지 않는다. */
  expert: ({ location, param }) => {
    if (!location) {
      return {
        message: '아직 설정된 지역이 없어요.\n가까운 업체를 찾으려면 먼저 지역을 설정해주세요.',
        options: [{ label: '지역 설정하기', action: 'guided-do:region', recommended: true }],
      };
    }
    return {
      message: `현재 설정된 지역을 기준으로\n가까운 배관 수리 업체를 찾아볼까요?\n\n${location}`,
      options: [
        { label: '내 주변 업체 보기', action: `guided-do:shops:${param ?? 'unknown'}`, recommended: true },
        { label: '다른 지역에서 찾기', action: 'guided-do:region' },
      ],
    };
  },
};

/** 전입신고: 현재 상황 → 온라인/오프라인 선택 → 준비사항 → 신청 순서 → 정부24 이동 */
const MOVE_IN_STEPS: StepTable = {
  start: () => ({
    message: '처음이면 순서부터 같이 확인해볼게요.\n이미 새 집으로 이사를 완료한 상태인가요?',
    options: [
      { label: '네, 이미 이사했어요', action: step('moveIn', 'moved') },
      { label: '곧 이사할 예정이에요', action: step('moveIn', 'soon') },
      { label: '아직 계약만 했어요', action: step('moveIn', 'contract') },
    ],
  }),
  moved: () => ({
    message: '좋아요. 전입신고는 새 주소로 이사한 뒤 진행하면 돼요.\n온라인으로 신청할지 주민센터에서 할지 선택할 수 있어요.',
    options: [
      { label: '온라인 신청 방법 보기', action: step('moveIn', 'online') },
      { label: '주민센터 방문 방법 보기', action: step('moveIn', 'visit') },
    ],
  }),
  soon: () => ({
    message: '전입신고는 실제로 새 집에 들어간 날부터 14일 안에 하면 돼요.\n이사 전에 준비물을 챙겨두면 훨씬 편해요.',
    options: [
      { label: '필요한 준비물 확인하기', action: step('moveIn', 'prep') },
      { label: '이사 후 진행 방법 보기', action: step('moveIn', 'moved') },
    ],
  }),
  contract: () => ({
    message: '계약만 한 상태라면 아직 전입신고를 할 시점은 아니에요.\n입주일이 정해지면 그날부터 14일 안에 신고하면 돼요.',
    options: [
      { label: '필요한 준비물 확인하기', action: step('moveIn', 'prep') },
      { label: '이사 후 진행 방법 보기', action: step('moveIn', 'moved') },
    ],
  }),
  online: () => ({
    message: '온라인 신청은 정부24에서 진행해요.\n본인 인증 수단과 새 주소 정보를 준비하면 됩니다.',
    options: [
      { label: '필요한 준비물 확인하기', action: step('moveIn', 'prep') },
      { label: '신청 순서 보기', action: step('moveIn', 'order'), recommended: true },
    ],
  }),
  visit: () => ({
    message: '이사한 주소의 관할 주민센터를 방문하면 돼요.\n\n1. 신분증과 임대차계약서를 챙겨가세요.\n2. 전입신고서를 작성해 제출하세요.\n3. 접수 후 바로 처리돼요.\n\n시간이 없다면 온라인 신청이 더 편해요.',
    options: [
      { label: '온라인 신청 방법 보기', action: step('moveIn', 'online') },
      { label: '필요한 준비물 확인하기', action: step('moveIn', 'prep') },
    ],
  }),
  prep: () => ({
    message: '신청 전에 이것만 확인하세요.\n\n1. 공동인증서·간편인증 등 본인 인증 수단\n2. 새 집 주소와 입주일\n3. 함께 전입하는 세대원 정보\n4. 임대차계약서 (임차인인 경우)',
    options: [{ label: '신청 순서 보기', action: step('moveIn', 'order'), recommended: true }],
  }),
  /* 준비가 끝난 시점 — 여기서 처음으로 정부24 이동을 추천한다. */
  order: () => ({
    message: '온라인 신청은 이 순서로 진행돼요.\n\n1. 정부24에서 본인 인증하기\n2. 새 주소와 세대 정보 입력하기\n3. 내용을 확인하고 제출하기\n\n준비가 됐다면 이제 실제 신청 화면으로 이동하면 돼요.',
    options: [
      { label: '정부24 전입신고로 이동', action: 'guided-do:gov24', recommended: true, note: '정부24로 이동합니다 ↗' },
    ],
  }),
};

/** 혜택: 관심 분야 → 세부 범위 → 혜택·복지 화면 이동 추천 */
const SUPPORT_STEPS: StepTable = {
  start: () => ({
    message: '어떤 혜택을 찾고 있는지 먼저 알려주세요.',
    options: [
      { label: '월세·주거비', action: step('support', 'housing') },
      { label: '생활비', action: step('support', 'living') },
      { label: '청년 지원', action: step('support', 'youth') },
      { label: '아직 잘 모르겠어요', action: step('support', 'unsure') },
    ],
  }),
  unsure: () => ({
    message: '괜찮아요. 요즘 자취하면서\n가장 부담되는 게 뭔지 골라볼까요?',
    options: [
      { label: '월세·주거비', action: step('support', 'housing') },
      { label: '생활비', action: step('support', 'living') },
      { label: '청년 지원', action: step('support', 'youth') },
    ],
  }),
  housing: () => ({
    message: '주거 관련 혜택은\n월세 지원, 주거비 지원, 청년 주거 정책 등으로 나뉘어요.',
    options: [
      { label: '월세 지원 위주로 보기', action: step('support', 'ready', 'housing') },
      { label: '주거 혜택 전체 보기', action: step('support', 'ready', 'housing') },
    ],
  }),
  living: () => ({
    message: '생활비 관련 혜택은\n식비, 교통비, 통신비 지원 등으로 나뉘어요.',
    options: [
      { label: '식비·교통비 위주로 보기', action: step('support', 'ready', 'cost') },
      { label: '생활비 혜택 전체 보기', action: step('support', 'ready', 'cost') },
    ],
  }),
  youth: () => ({
    message: '청년 지원은 나이, 소득, 거주 지역에 따라\n대상이 달라져요. 어느 쪽이 더 궁금하세요?',
    options: [
      { label: '주거 쪽이 궁금해요', action: step('support', 'housing') },
      { label: '생활비 쪽이 궁금해요', action: step('support', 'living') },
      { label: '청년 혜택 전체 보기', action: step('support', 'ready', 'all') },
    ],
  }),
  ready: ({ param }) => ({
    message: '자두야의 혜택·복지 페이지에서\n조건에 맞는 지원 정보를 한 번에 확인할 수 있어요.',
    options: [
      { label: '혜택·복지에서 확인하기', action: `guided-do:benefits:${param ?? 'all'}`, recommended: true },
    ],
  }),
};

const FLOWS: Record<GuidedFlowId, Record<string, (ctx: GuidedContext) => GuidedStep>> = {
  repair: REPAIR_STEPS,
  moveIn: MOVE_IN_STEPS,
  support: SUPPORT_STEPS,
};

export function guidedStep(flow: GuidedFlowId, stepId: string, ctx: GuidedContext = {}): GuidedStep | null {
  return FLOWS[flow]?.[stepId]?.(ctx) ?? null;
}

/** "guided:repair:area:sink" → { flow, step, param }. 형식이 다르면 null. */
export function parseGuidedAction(action: string): { flow: GuidedFlowId; step: string; param?: string } | null {
  const [prefix, flow, stepId, param] = action.split(':');
  if (prefix !== 'guided' || !(flow in FLOWS) || !stepId) return null;
  return { flow: flow as GuidedFlowId, step: stepId, param };
}
