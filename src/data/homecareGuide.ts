/** 생활 > 홈케어 — 문제 유형별 해결 가이드 데이터.
 * Figma daily_care (2008:9698 / 2289:24032) 문구를 그대로 옮긴다.
 *
 * ⚠️ 3단계 선택(카테고리 → 1차 선택 → 2차 선택/severity)이 전부 모여야 하나의 완성된
 * Guide Scenario 가 된다. STEP 01~04(라벨·제목·설명·서비스)를 다른 단계 데이터끼리
 * 조합해서 만들지 않는다 — 각 leaf(Scenario)는 그 자체로 완성된 안내문이다.
 *
 * 구조:
 *   HOMECARE_CATEGORIES        — 화면에 필요한 메타데이터(칩 라벨, 질문, 옵션 목록, 기본값)
 *   HOMECARE_GUIDE_SCENARIOS   — 실제 해결 가이드. [category][primary][severity] 3차원 조회.
 *                                 4(category) × 4(primary) × 3(severity) = 48개 leaf 전부 존재한다.
 */

export type ProblemKey = 'mold' | 'bug' | 'smell' | 'etc';

export interface ChipOption {
  key: string;
  label: string;
}

export interface HomecareCategory {
  /** 문제 유형 칩 라벨 — 예: "곰팡이" */
  label: string;
  /** 상황 안내 제목 — 예: "곰팡이·습기 상황을 알려주세요" */
  question: string;
  /** 첫 번째 세부 질문 — 예: "어디에 생겼나요?" */
  primaryLabel: string;
  /** 첫 번째 선택 Chip */
  primaryOptions: ChipOption[];
  /** 진입 시 / 카테고리 전환 시 기본 선택값 */
  defaultPrimary: string;
  /** 두 번째 세부 질문 — 예: "상태는 어떤가요?" */
  secondaryLabel: string;
  /** 두 번째 선택 Chip(severity) */
  secondaryOptions: ChipOption[];
  defaultSecondary: string;
}

/** Timeline 의 한 단계 — 소제목(label) · 제목(title) · 설명(body).
 * STEP 01~03은 title/body 를 모두 채운다(빈 body 없음). */
export interface GuideStepData {
  label: string;
  title: string;
  body: string;
}

export interface ServiceLink {
  title: string;
  href: string;
}

/** 하나의 완성된 해결 가이드 — category + primary + severity 조합 하나에 대응하는 leaf.
 * STEP 01~04 가 전부 이 안에서 나온다. 다른 조합과 내용을 공유하지 않는다. */
export interface GuideScenario {
  guideTitle: string;
  step1: GuideStepData;
  step2: GuideStepData;
  step3: GuideStepData;
  /** STEP 04 소제목 — 원문에 별도 지정이 없으면 "다른 도움이 필요하다면"을 쓴다 */
  step4Label: string;
  services: ServiceLink[];
}

export const PROBLEM_TYPES: { key: ProblemKey; label: string }[] = [
  { key: 'mold', label: '곰팡이' },
  { key: 'bug', label: '벌레' },
  { key: 'smell', label: '냄새 · 환기' },
  { key: 'etc', label: '기타' },
];

export const HOMECARE_CATEGORIES: Record<ProblemKey, HomecareCategory> = {
  mold: {
    label: '곰팡이',
    question: '곰팡이·습기 상황을 알려주세요',
    primaryLabel: '어디에 생겼나요?',
    primaryOptions: [
      { key: 'tile', label: '타일' },
      { key: 'silicone', label: '실리콘' },
      { key: 'ceiling', label: '천장' },
      { key: 'wallpaper', label: '벽지' },
    ],
    defaultPrimary: 'tile',
    secondaryLabel: '상태는 어떤가요?',
    secondaryOptions: [
      { key: 'partial', label: '일부만' },
      { key: 'wide', label: '넓게' },
      { key: 'repeat', label: '반복됨' },
    ],
    defaultSecondary: 'wide',
  },
  bug: {
    label: '벌레',
    question: '벌레가 보이는 상황을 알려주세요',
    primaryLabel: '어떤 벌레인가요?',
    primaryOptions: [
      { key: 'cockroach', label: '바퀴벌레' },
      { key: 'gnat', label: '날벌레' },
      { key: 'ant', label: '개미' },
      { key: 'unknown', label: '잘 모르겠어요' },
    ],
    defaultPrimary: 'cockroach',
    secondaryLabel: '얼마나 자주 보이나요?',
    secondaryOptions: [
      { key: 'once', label: '한 번' },
      { key: 'sometimes', label: '가끔' },
      { key: 'often', label: '자주' },
    ],
    defaultSecondary: 'sometimes',
  },
  smell: {
    label: '냄새 · 환기',
    question: '냄새·환기 상황을 알려주세요',
    primaryLabel: '어디에서 냄새가 나나요?',
    primaryOptions: [
      { key: 'drain', label: '하수구' },
      { key: 'bathroom', label: '화장실' },
      { key: 'kitchen', label: '주방' },
      { key: 'room', label: '방 전체' },
    ],
    defaultPrimary: 'drain',
    secondaryLabel: '어떤 상태인가요?',
    secondaryOptions: [
      { key: 'sometimes', label: '가끔' },
      { key: 'persistent', label: '계속 남음' },
      { key: 'recurring', label: '환기해도 반복' },
    ],
    defaultSecondary: 'persistent',
  },
  etc: {
    label: '기타',
    question: '집에서 불편한 상황을 알려주세요',
    primaryLabel: '어떤 문제가 있나요?',
    primaryOptions: [
      { key: 'drainage', label: '배수·수압' },
      { key: 'leak', label: '누수' },
      { key: 'facility', label: '시설 고장' },
      { key: 'misc', label: '기타' },
    ],
    defaultPrimary: 'drainage',
    secondaryLabel: '사용에 얼마나 영향이 있나요?',
    secondaryOptions: [
      { key: 'inconvenient', label: '불편함' },
      { key: 'difficult', label: '사용 어려움' },
      { key: 'urgent', label: '긴급함' },
    ],
    defaultSecondary: 'difficult',
  },
};

/* ------------------------------------------------------------------ */
/* 아래는 데이터 작성을 줄이기 위한 내부 헬퍼일 뿐, 화면에서 직접 쓰지 않는다.
 * STEP 01·02 소제목은 48개 중 대부분(곰팡이·벌레·냄새/환기·기타 일부)이 같은 문구를 쓰고,
 * "기타 → 기타" 3개만 상황에 맞는 고유 소제목을 쓴다 — 그 3개는 아래에서 직접 문자열로 쓴다.
 * STEP 03 소제목은 카테고리 안에서 severity 하나당 하나씩만 존재해 4개 1차 선택이 공유한다
 * (원문에 준 문구를 그대로 재사용한 것이며, 1차 선택마다 다른 소제목이 주어진 적은 없다). */

const STEP1_LABEL = '먼저 해볼 수 있어요';
const STEP2_LABEL = '직접 관리해요';
const DEFAULT_STEP4_LABEL = '다른 도움이 필요하다면';

function step(label: string, title: string, body = ''): GuideStepData {
  return { label, title, body };
}

function service(title: string): ServiceLink {
  return { title, href: '#' };
}

const MOLD_STEP3_LABEL: Record<string, string> = {
  partial: '관리 후 확인해요',
  wide: '원인도 같이 확인해요',
  repeat: '반복되면 점검이 필요해요',
};
const MOLD_STEP4_LABEL: Record<string, string> = {
  partial: '필요한 경우',
  wide: '전문 관리가 필요하다면',
  repeat: '전문 점검이 필요하다면',
};
const BUG_STEP3_LABEL: Record<string, string> = {
  once: '며칠 더 지켜봐요',
  sometimes: '들어오는 길을 찾아봐요',
  often: '전문 방역을 고려해요',
};
const SMELL_STEP3_LABEL: Record<string, string> = {
  sometimes: '발생 조건을 확인해요',
  persistent: '숨은 원인을 찾아봐요',
  recurring: '설비 점검이 필요할 수 있어요',
};
const ETC_STEP3_LABEL: Record<string, string> = {
  inconvenient: '기본 점검부터 해봐요',
  difficult: '빠르게 점검을 요청해요',
  urgent: '사용을 멈추고 도움을 요청해요',
};

/** [category][primary][severity] 3차원 조회 — 48개 leaf 전부 완성된 Scenario 다. */
export const HOMECARE_GUIDE_SCENARIOS: Record<ProblemKey, Record<string, Record<string, GuideScenario>>> = {
  mold: {
    tile: {
      partial: {
        guideTitle: '작은 범위 타일 곰팡이 관리 가이드',
        step1: step(STEP1_LABEL, '물기를 닦고 충분히 말려주세요', '곰팡이가 보이는 작은 범위 주변의 물기를 닦고 문과 환풍기를 열어 타일과 줄눈을 충분히 건조해요.'),
        step2: step(STEP2_LABEL, '보이는 부분부터 가볍게 제거해요', '타일·줄눈용 제품의 사용법을 확인한 뒤 작은 범위부터 관리하고 충분히 헹구고 환기해요. 서로 다른 세정제를 섞지 마세요.'),
        step3: step(MOLD_STEP3_LABEL.partial, '같은 곳에 다시 생기는지 살펴봐요', '2~3일 정도 같은 위치를 확인해요. 다시 생기지 않는다면 물기 제거와 환기를 계속 유지해요.'),
        step4Label: MOLD_STEP4_LABEL.partial,
        services: [service('욕실 줄눈·타일 청소'), service('욕실 환풍기 점검'), service('곰팡이 제거 서비스')],
      },
      wide: {
        guideTitle: '넓게 번진 타일 곰팡이 해결 가이드',
        step1: step(STEP1_LABEL, '욕실 전체의 습기를 먼저 줄여주세요', '곰팡이가 넓다면 보이는 부분만 닦기보다 바닥과 타일에 남은 물기를 먼저 제거해주세요. 욕실 문을 열고 환풍기를 충분히 작동시켜 타일과 줄눈까지 말려요.'),
        step2: step(STEP2_LABEL, '넓은 범위를 나눠서 관리해요', '한 번에 넓은 면적을 처리하기보다 작은 구역으로 나눠 관리하면 더 안전하고 꼼꼼하게 확인할 수 있어요. 제품을 사용할 때는 표시된 사용 시간과 환기 방법을 지켜주세요.'),
        step3: step(MOLD_STEP3_LABEL.wide, '곰팡이가 넓어진 원인도 확인해요', '청소해도 다시 생기지 않게 하려면 습기가 계속 생기는 이유를 같이 찾아야 해요. 환풍기 작동 상태, 실리콘 틈, 결로나 누수 흔적이 없는지 살펴봐요.'),
        step4Label: MOLD_STEP4_LABEL.wide,
        services: [service('전문 곰팡이 제거 서비스'), service('욕실 환풍·방습 점검'), service('누수·결로 점검')],
      },
      repeat: {
        guideTitle: '반복되는 타일 곰팡이 점검 가이드',
        step1: step(STEP1_LABEL, '곰팡이 위치와 발생 주기를 기록해요', '같은 줄눈이나 타일에 반복된다면 발생 위치와 날짜를 사진으로 남겨주세요.'),
        step2: step(STEP2_LABEL, '청소보다 습기 원인을 먼저 찾아봐요', '계속 제거하는 것보다 주변 실리콘, 배수구, 환풍기와 결로 여부를 함께 확인하는 게 중요해요.'),
        step3: step(MOLD_STEP3_LABEL.repeat, '반복된다면 구조적인 원인을 점검해요', '벽 내부 습기나 누수 가능성도 있으므로 임대인 또는 관리실에 기록한 사진과 함께 점검을 요청해요.'),
        step4Label: MOLD_STEP4_LABEL.repeat,
        services: [service('누수·결로 전문 점검'), service('전문 곰팡이 제거 서비스'), service('임대인·관리실 문의')],
      },
    },
    silicone: {
      partial: {
        guideTitle: '부분적인 실리콘 곰팡이 관리 가이드',
        step1: step(STEP1_LABEL, '실리콘 주변의 물기를 닦아주세요', '작은 곰팡이 주변을 완전히 말리고 욕실을 충분히 환기해요.'),
        step2: step(STEP2_LABEL, '실리콘 표면부터 관리해요', '실리콘용 제품을 사용법에 맞게 작은 부위부터 사용해요.'),
        step3: step(MOLD_STEP3_LABEL.partial, '검은 자국이 남는지 확인해요', '표면을 관리한 뒤 실리콘 안쪽까지 변색이 남지 않는지 확인해요.'),
        step4Label: MOLD_STEP4_LABEL.partial,
        services: [service('실리콘 청소'), service('욕실 환풍기 점검'), service('필요 시 실리콘 재시공')],
      },
      wide: {
        guideTitle: '넓게 번진 실리콘 곰팡이 해결 가이드',
        step1: step(STEP1_LABEL, '실리콘 라인의 물기를 모두 제거해요', '욕조나 세면대 주변 실리콘 전체를 말려주세요.'),
        step2: step(STEP2_LABEL, '범위를 나눠 상태를 확인해요', '곰팡이가 표면인지 실리콘 내부까지 침투했는지 확인하면서 관리해요.'),
        step3: step(MOLD_STEP3_LABEL.wide, '내부 변색이 넓다면 교체를 고려해요', '청소 후에도 검게 남거나 실리콘이 들떠 있다면 제거보다 재시공이 적합할 수 있어요.'),
        step4Label: MOLD_STEP4_LABEL.wide,
        services: [service('욕실 실리콘 재시공'), service('전문 곰팡이 제거'), service('욕실 방습 점검')],
      },
      repeat: {
        guideTitle: '반복되는 실리콘 곰팡이 점검 가이드',
        step1: step(STEP1_LABEL, '반복되는 위치를 확인해요', '항상 같은 모서리나 접합부에 생기는지 확인해요.'),
        step2: step(STEP2_LABEL, '환기와 실리콘 손상을 함께 살펴봐요', '실리콘이 갈라졌거나 들뜬 부분에 물이 고이는지 확인해요.'),
        step3: step(MOLD_STEP3_LABEL.repeat, '재발한다면 실리콘 교체도 고려해요', '내부까지 곰팡이가 자리 잡은 실리콘은 표면 관리만으로 반복될 수 있어요.'),
        step4Label: MOLD_STEP4_LABEL.repeat,
        services: [service('실리콘 제거·재시공'), service('전문 곰팡이 제거'), service('누수·방습 점검')],
      },
    },
    ceiling: {
      partial: {
        guideTitle: '부분적인 천장 곰팡이 관리 가이드',
        step1: step(STEP1_LABEL, '천장에 맺힌 습기를 먼저 말려주세요', '환풍기를 가동하고 표면이 완전히 마르도록 해요.'),
        step2: step(STEP2_LABEL, '도장면을 손상시키지 않게 관리해요', '작은 범위를 강하게 문지르지 말고 천장 재질에 맞게 관리해요.'),
        step3: step(MOLD_STEP3_LABEL.partial, '며칠 동안 다시 생기는지 확인해요', '샤워 후 같은 부분에 물방울이나 곰팡이가 다시 생기는지 살펴봐요.'),
        step4Label: MOLD_STEP4_LABEL.partial,
        services: [service('욕실 환풍기 점검'), service('천장 곰팡이 제거'), service('방습 도장 상담')],
      },
      wide: {
        guideTitle: '넓은 천장 곰팡이 점검 가이드',
        step1: step(STEP1_LABEL, '욕실 습도를 먼저 낮춰주세요', '샤워 후에는 욕실 문을 열어 습기를 빼고, 환풍기를 평소보다 오래 가동해 천장 주변 습도부터 낮춰주세요.'),
        step2: step(STEP2_LABEL, '천장 전체 상태를 확인해요', '도장이 들뜨거나 얼룩이 넓게 퍼졌는지 살펴봐요.'),
        step3: step(MOLD_STEP3_LABEL.wide, '결로나 누수 가능성을 확인해요', '넓은 천장 곰팡이는 단순 청소보다 천장 내부 습기 원인 확인이 중요해요.'),
        step4Label: MOLD_STEP4_LABEL.wide,
        services: [service('결로·누수 점검'), service('천장 곰팡이 제거·도장'), service('환풍기 교체·점검')],
      },
      repeat: {
        guideTitle: '반복되는 천장 곰팡이 원인 점검 가이드',
        step1: step(STEP1_LABEL, '발생 위치를 사진으로 기록해요', '천장에 얼룩이나 곰팡이가 보이면 날짜와 위치를 사진으로 남겨 반복되는 자리인지 비교할 수 있게 해요.'),
        step2: step(STEP2_LABEL, '윗집 누수와 결로 징후를 확인해요', '천장 얼룩, 부풀음, 물자국이 함께 있는지 확인해요.'),
        step3: step(MOLD_STEP3_LABEL.repeat, '반복된다면 관리실에 점검을 요청해요', '천장 내부 문제는 직접 확인하기 어려우므로 사진과 발생 주기를 전달해요.'),
        step4Label: MOLD_STEP4_LABEL.repeat,
        services: [service('누수 탐지'), service('결로 점검'), service('임대인·관리실 문의')],
      },
    },
    wallpaper: {
      partial: {
        guideTitle: '부분적인 벽지 곰팡이 관리 가이드',
        step1: step(STEP1_LABEL, '가구를 벽에서 조금 띄워주세요', '옷장이나 침대를 벽에서 조금 띄워 공기가 통하게 하고, 벽면에 물기가 있다면 마른 천으로 가볍게 닦아주세요.'),
        step2: step(STEP2_LABEL, '벽지가 젖지 않게 표면부터 관리해요', '곰팡이가 보이는 부분만 벽지용 제거 제품으로 살짝 닦아내고, 물을 많이 묻히지 않도록 주의해요.'),
        step3: step(MOLD_STEP3_LABEL.partial, '벽지 상태를 며칠 확인해요', '들뜨거나 변색이 커지지 않는지 확인해요.'),
        step4Label: MOLD_STEP4_LABEL.partial,
        services: [service('벽지 곰팡이 청소'), service('환기·제습 상담'), service('필요 시 부분 도배')],
      },
      wide: {
        guideTitle: '넓게 번진 벽지 곰팡이 해결 가이드',
        step1: step(STEP1_LABEL, '가구를 치우고 벽 전체를 말려주세요', '벽 앞의 가구를 조금 띄워 공기가 통하도록 해주세요. 벽에 물기가 느껴진다면 마른 천으로 닦고 창문이나 제습기를 이용해 벽면이 충분히 마르도록 해요.'),
        step2: step(STEP2_LABEL, '벽지를 무리하게 적시지 마세요', '벽지는 물을 많이 흡수하면 들뜨거나 손상될 수 있어요. 물을 직접 뿌리기보다 벽지에 사용할 수 있는 방법으로 보이는 부분부터 조심스럽게 관리해요.'),
        step3: step(MOLD_STEP3_LABEL.wide, '벽 내부 습기를 확인해야 해요', '곰팡이가 넓은 범위로 번졌다면 표면만의 문제가 아닐 수 있어요. 외벽 결로, 누수, 가구 뒤쪽 습기처럼 계속 물기가 생기는 원인이 없는지 함께 확인해봐요.'),
        step4Label: MOLD_STEP4_LABEL.wide,
        services: [service('벽지 곰팡이 제거·복원'), service('결로·누수 점검'), service('도배·벽지 교체')],
      },
      repeat: {
        guideTitle: '반복되는 벽지 곰팡이 원인 점검 가이드',
        step1: step(STEP1_LABEL, '같은 벽면의 발생 위치를 기록해요', '곰팡이가 다시 생긴 위치와 날짜를 사진으로 남겨 같은 자리인지, 범위가 넓어졌는지 비교할 수 있게 해요.'),
        step2: step(STEP2_LABEL, '가구 배치와 외벽 결로 여부를 확인해요', '가구를 벽에서 떼어 통풍 공간을 만들고, 외벽과 맞닿은 벽면에 결로나 물자국이 있는지 함께 살펴봐요.'),
        step3: step(MOLD_STEP3_LABEL.repeat, '반복된다면 벽 내부 원인을 점검해요', '외벽 결로나 누수 문제일 수 있어 임대인 또는 관리실에 확인을 요청해요.'),
        step4Label: MOLD_STEP4_LABEL.repeat,
        services: [service('결로·누수 진단'), service('벽지 철거·재시공'), service('임대인·관리실 문의')],
      },
    },
  },

  bug: {
    cockroach: {
      once: {
        guideTitle: '바퀴벌레 1회 발견 대처 가이드',
        step1: step(STEP1_LABEL, '발견한 주변을 바로 정리해요', '바퀴벌레를 본 자리 주변의 음식 부스러기와 물기를 바로 치워 다시 모여들지 않게 해주세요.'),
        step2: step(STEP2_LABEL, '음식물과 물기를 없애주세요', '음식물은 밀폐 용기에 보관하고 싱크대와 바닥의 물기를 완전히 닦아 마른 상태로 유지해요.'),
        step3: step(BUG_STEP3_LABEL.once, '며칠 동안 다시 나타나는지 확인해요', '한 마리만 보였다면 외부 유입일 수도 있으니 발견 장소를 중심으로 관찰해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('배수구·틈새 점검'), service('방충망 점검'), service('필요 시 해충 상담')],
      },
      sometimes: {
        guideTitle: '간헐적인 바퀴벌레 발생 점검 가이드',
        step1: step(STEP1_LABEL, '보이는 장소와 시간을 기록해요', '바퀴벌레가 나타난 장소와 시간을 적어두면 어디에서 자주 들어오는지 파악하는 데 도움이 돼요.'),
        step2: step(STEP2_LABEL, '싱크대 아래와 틈새를 관리해요', '싱크대 아래와 배관 주변 틈새를 청소하고 바퀴용 트랩을 이동 경로에 놓아 유입을 줄여주세요.'),
        step3: step(BUG_STEP3_LABEL.sometimes, '반복되는 유입 경로를 찾아봐요', '기록한 장소를 비교해 창틀, 배수구, 벽 틈처럼 자주 겹치는 유입 경로가 있는지 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('바퀴 유입 차단'), service('전문 해충 방역'), service('배수구 점검')],
      },
      often: {
        guideTitle: '반복적인 바퀴벌레 발생 대응 가이드',
        step1: step(STEP1_LABEL, '음식과 쓰레기를 완전히 밀폐해요', '음식물과 쓰레기를 밀폐 용기에 보관하고 매일 비워 바퀴벌레가 먹을 것이 남지 않게 해요.'),
        step2: step(STEP2_LABEL, '집 안 여러 장소의 흔적을 확인해요', '주방뿐 아니라 화장실, 신발장처럼 어둡고 습한 곳까지 배설물이나 흔적이 있는지 확인해요.'),
        step3: step(BUG_STEP3_LABEL.often, '자주 보이면 전문 방역을 고려해요', '집 안에서 번식하고 있을 가능성도 있으므로 관리실·임대인에게 알리고 전문 방역을 검토해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('전문 바퀴벌레 방역'), service('발생 원인 진단'), service('배관·틈새 차단')],
      },
    },
    gnat: {
      once: {
        guideTitle: '날벌레 1회 발견 관리 가이드',
        step1: step(STEP1_LABEL, '창문과 음식물 주변을 확인해요', '날벌레가 들어올 수 있는 창문 틈과 음식물 주변을 살펴 방충망이 제대로 닫혀 있는지 확인해요.'),
        step2: step(STEP2_LABEL, '음식물과 고인 물을 정리해요', '익은 과일이나 음식물을 밀폐하고 화분 받침처럼 물이 고인 곳이 있다면 비워주세요.'),
        step3: step(BUG_STEP3_LABEL.once, '다시 나타나는지 관찰해요', '정리한 뒤 며칠 동안 같은 장소에서 다시 나타나는지 지켜보고 발생 여부를 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('방충망 점검'), service('배수구 청소'), service('필요 시 해충 상담')],
      },
      sometimes: {
        guideTitle: '간헐적인 날벌레 발생 해결 가이드',
        step1: step(STEP1_LABEL, '어디에서 자주 보이는지 확인해요', '날벌레가 자주 보이는 위치와 시간대를 기록해 발생 패턴이 있는지 확인해요.'),
        step2: step(STEP2_LABEL, '배수구와 음식물통을 집중 청소해요', '배수구 내부와 음식물 쓰레기통을 솔로 닦고 물로 헹궈 알이 남지 않도록 관리해요.'),
        step3: step(BUG_STEP3_LABEL.sometimes, '발생원이 있는지 찾아봐요', '화분 흙, 배수구, 음식물 쓰레기처럼 습기와 유기물이 많은 곳을 중심으로 발생원을 찾아봐요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('배수관 청소'), service('방충망 교체'), service('전문 방역')],
      },
      often: {
        guideTitle: '지속적인 날벌레 발생 대응 가이드',
        step1: step(STEP1_LABEL, '음식물과 습기 원인을 모두 정리해요', '집 안의 음식물과 물기 있는 곳을 모두 점검해 날벌레가 알을 낳을 만한 환경을 없애주세요.'),
        step2: step(STEP2_LABEL, '배수구 내부와 주방 주변을 점검해요', '배수구 내부를 전용 세정제로 청소하고 주방 바닥과 벽 사이 틈새도 함께 확인해요.'),
        step3: step(BUG_STEP3_LABEL.often, '계속 발생하면 번식 지점을 확인해야 해요', '청소 후에도 계속 나타난다면 화분이나 배수구 안쪽에 번식 지점이 남아 있을 수 있어요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('전문 해충 방역'), service('배수구·배관 청소'), service('방충망·유입구 점검')],
      },
    },
    ant: {
      once: {
        guideTitle: '개미 1회 발견 관리 가이드',
        step1: step(STEP1_LABEL, '발견한 주변의 음식물을 치워요', '개미가 보인 자리 주변의 음식물과 부스러기를 바로 치워 먹이로 이어지지 않게 해요.'),
        step2: step(STEP2_LABEL, '개미가 지나간 곳을 깨끗하게 닦아요', '개미가 남긴 냄새 흔적을 닦아내면 같은 길을 따라 다시 들어오는 것을 줄일 수 있어요.'),
        step3: step(BUG_STEP3_LABEL.once, '다시 이동 경로가 생기는지 확인해요', '며칠간 같은 자리를 지켜보고 새로운 이동 줄이 생기는지 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('틈새 점검'), service('창문 유입 점검'), service('필요 시 해충 상담')],
      },
      sometimes: {
        guideTitle: '간헐적인 개미 발생 해결 가이드',
        step1: step(STEP1_LABEL, '개미 이동 경로를 확인해요', '개미가 줄지어 이동하는 경로를 따라가 어디서부터 들어오는지 확인해요.'),
        step2: step(STEP2_LABEL, '먹이 흔적과 틈새를 관리해요', '이동 경로 주변의 음식물을 치우고 벽이나 바닥의 작은 틈새는 테이프나 실리콘으로 막아요.'),
        step3: step(BUG_STEP3_LABEL.sometimes, '어디에서 들어오는지 찾아봐요', '창틀, 문틈, 배관 주변처럼 개미가 자주 드나드는 통로를 좁혀 원인을 찾아봐요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('벽·창틀 틈새 차단'), service('개미 방역'), service('현관·창문 점검')],
      },
      often: {
        guideTitle: '반복적인 개미 발생 대응 가이드',
        step1: step(STEP1_LABEL, '음식물을 완전히 밀폐해요', '설탕, 과자처럼 개미가 좋아하는 음식은 밀폐 용기에 넣어 냄새가 새지 않게 보관해요.'),
        step2: step(STEP2_LABEL, '여러 이동 경로를 확인해요', '집 안 곳곳을 살펴 여러 갈래의 이동 경로가 있는지 확인하고 눈에 띄는 통로마다 막아요.'),
        step3: step(BUG_STEP3_LABEL.often, '집 안에 군집이 있는지 전문 점검을 고려해요', '여러 경로에서 계속 나타난다면 벽 안쪽에 군집이 있을 수 있어 전문 점검을 고려해봐요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('전문 개미 방역'), service('유입 경로 봉쇄'), service('벽·바닥 틈새 점검')],
      },
    },
    unknown: {
      once: {
        guideTitle: '정체를 모르는 벌레 1회 발견 가이드',
        step1: step(STEP1_LABEL, '벌레의 사진을 먼저 남겨주세요', '가능하면 안전한 거리에서 사진을 찍어두면 나중에 종류를 확인하는 데 도움이 돼요.'),
        step2: step(STEP2_LABEL, '발견 장소 주변을 정리해요', '발견한 장소 주변의 음식물과 물기를 정리해 벌레가 머물 이유를 줄여주세요.'),
        step3: step(BUG_STEP3_LABEL.once, '다시 나타나는지 확인해요', '정리한 뒤 같은 장소를 며칠 지켜보고 다시 나타나는지 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('해충 종류 확인'), service('방충망 점검'), service('필요 시 전문 상담')],
      },
      sometimes: {
        guideTitle: '정체를 모르는 벌레 반복 관찰 가이드',
        step1: step(STEP1_LABEL, '사진과 발견 위치를 기록해요', '볼 때마다 사진과 발견 장소, 시간을 기록해두면 종류와 발생 원인을 파악하기 쉬워져요.'),
        step2: step(STEP2_LABEL, '시간대와 장소의 공통점을 찾아봐요', '기록을 비교해 특정 시간대나 장소에서 반복되는 공통점이 있는지 살펴봐요.'),
        step3: step(BUG_STEP3_LABEL.sometimes, '유입 환경을 확인해요', '창문, 배수구, 화분처럼 벌레가 들어오거나 생길 수 있는 환경이 있는지 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('해충 종류 진단'), service('주거 해충 방역'), service('유입 경로 점검')],
      },
      often: {
        guideTitle: '정체를 모르는 벌레 지속 발생 대응 가이드',
        step1: step(STEP1_LABEL, '맨손으로 처리하지 말고 사진을 남겨요', '정체를 모르는 벌레는 맨손으로 만지지 말고 안전한 거리에서 사진으로 먼저 기록해요.'),
        step2: step(STEP2_LABEL, '여러 장소에 나타나는지 확인해요', '한 곳이 아니라 집 안 여러 장소에서 나타나는지 확인하면 원인 파악에 도움이 돼요.'),
        step3: step(BUG_STEP3_LABEL.often, '종류를 확인하기 전 전문 진단을 받아보세요', '종류를 알 수 없는 채로 반복된다면 사진을 가지고 전문 업체에 진단을 받아보는 것이 안전해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('해충 종류 진단'), service('전문 방역'), service('임대인·관리실 문의')],
      },
    },
  },

  smell: {
    drain: {
      sometimes: {
        guideTitle: '간헐적인 하수구 냄새 확인 가이드',
        step1: step(STEP1_LABEL, '냄새가 날 때의 상황을 확인해요', '냄새가 나는 시점이 비 오는 날인지, 물을 오래 안 썼을 때인지 먼저 확인해봐요.'),
        step2: step(STEP2_LABEL, '배수구 주변을 청소하고 물을 흘려보내요', '배수구 덮개를 열어 이물질을 제거하고 물을 흘려보내 배수구 안쪽까지 헹궈주세요.'),
        step3: step(SMELL_STEP3_LABEL.sometimes, '비 오는 날이나 사용 후에만 나는지 기록해요', '특정 상황에서만 난다면 그때마다 환기하고 물을 흘려보내는 것만으로 줄어들 수 있어요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('배수구 청소'), service('배수 트랩 점검'), service('필요 시 배관 상담')],
      },
      persistent: {
        guideTitle: '지속적인 하수구 냄새 해결 가이드',
        step1: step(STEP1_LABEL, '배수구와 트랩 상태를 확인해요', '배수구 덮개를 열어 트랩에 물이 남아 있는지, 이물질이 쌓였는지 확인해요.'),
        step2: step(STEP2_LABEL, '분리 가능한 부분을 청소해요', '분리되는 덮개와 트랩을 꺼내 솔로 닦고 헹군 뒤 다시 단단히 끼워주세요.'),
        step3: step(SMELL_STEP3_LABEL.persistent, '계속 남으면 배관 문제를 확인해요', '청소 후에도 계속 남는다면 배관 안쪽이나 연결부에 문제가 있을 수 있어요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('배수구·배관 악취 점검'), service('트랩 교체'), service('전문 탈취')],
      },
      recurring: {
        guideTitle: '반복되는 하수구 악취 설비 점검 가이드',
        step1: step(STEP1_LABEL, '냄새가 올라오는 정확한 위치를 찾아요', '배수구, 벽 틈, 바닥 이음새 중 냄새가 가장 강하게 올라오는 위치를 찾아봐요.'),
        step2: step(STEP2_LABEL, '트랩과 배관 연결부를 확인해요', '트랩에 물이 말라 있지 않은지, 배관 연결부가 헐거워지지 않았는지 확인해요.'),
        step3: step(SMELL_STEP3_LABEL.recurring, '환기와 무관하게 반복되면 설비 점검을 요청해요', '환기를 충분히 해도 계속된다면 배관 설비 자체의 문제일 수 있어 점검이 필요해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('배관 전문 점검'), service('배수 트랩 교체'), service('임대인·관리실 문의')],
      },
    },
    bathroom: {
      sometimes: {
        guideTitle: '간헐적인 욕실 냄새 관리 가이드',
        step1: step(STEP1_LABEL, '욕실을 충분히 환기해요', '샤워 후 문을 열고 환풍기를 켜 욕실 안의 습기와 냄새를 함께 빼주세요.'),
        step2: step(STEP2_LABEL, '젖은 수건과 배수구 주변을 정리해요', '젖은 수건이나 발매트는 바로 널어 말리고 배수구 주변 머리카락과 이물질을 제거해요.'),
        step3: step(SMELL_STEP3_LABEL.sometimes, '샤워 후에만 생기는지 확인해요', '샤워 직후에만 냄새가 난다면 습기 문제일 가능성이 높아 환기만으로 나아질 수 있어요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('욕실 청소'), service('환풍기 청소'), service('배수구 점검')],
      },
      persistent: {
        guideTitle: '지속적인 욕실 냄새 해결 가이드',
        step1: step(STEP1_LABEL, '냄새가 나는 위치를 나눠 확인해요', '배수구, 변기, 세면대 등 위치를 나눠 코를 가까이 대고 냄새의 진원지를 찾아봐요.'),
        step2: step(STEP2_LABEL, '배수구·변기·세면대를 순서대로 점검해요', '배수구는 트랩과 덮개를, 변기는 물때를, 세면대는 배수관 연결부를 순서대로 확인해요.'),
        step3: step(SMELL_STEP3_LABEL.persistent, '계속 남는다면 숨은 원인을 확인해요', '청소해도 남는다면 바닥 배수구나 세면대 하부처럼 눈에 잘 안 띄는 곳도 살펴봐요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('욕실 배수 점검'), service('전문 탈취'), service('환풍기 점검')],
      },
      recurring: {
        guideTitle: '반복되는 욕실 냄새 설비 점검 가이드',
        step1: step(STEP1_LABEL, '환풍기 작동 상태를 확인해요', '환풍기를 켰을 때 바람이 제대로 나오는지, 소음이나 진동이 없는지 확인해요.'),
        step2: step(STEP2_LABEL, '변기와 배수구 밀폐 상태를 확인해요', '변기 물이 항상 고여 있는지, 배수구 트랩이 말라 있지 않은지 밀폐 상태를 점검해요.'),
        step3: step(SMELL_STEP3_LABEL.recurring, '환기 후 다시 올라오면 설비 점검이 필요해요', '환기를 충분히 해도 다시 올라온다면 환풍 설비나 배관 자체의 점검이 필요할 수 있어요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('배수·배관 점검'), service('변기·트랩 점검'), service('관리실 문의')],
      },
    },
    kitchen: {
      sometimes: {
        guideTitle: '간헐적인 주방 냄새 확인 가이드',
        step1: step(STEP1_LABEL, '음식물과 젖은 행주를 먼저 정리해요', '음식물 쓰레기를 비우고 젖은 행주와 수세미는 완전히 말려 냄새 원인을 줄여요.'),
        step2: step(STEP2_LABEL, '싱크대 주변을 청소해요', '싱크대 배수구와 주변 바닥의 물기, 음식 찌꺼기를 닦아 깨끗한 상태를 유지해요.'),
        step3: step(SMELL_STEP3_LABEL.sometimes, '요리 후인지 배수 사용 후인지 확인해요', '냄새가 요리 직후인지 설거지 직후인지 확인하면 원인을 좁히는 데 도움이 돼요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('싱크대 청소'), service('음식물통 관리'), service('배수구 점검')],
      },
      persistent: {
        guideTitle: '지속적인 주방 냄새 해결 가이드',
        step1: step(STEP1_LABEL, '냄새의 시작점을 찾아요', '싱크대, 냉장고, 음식물통 중 냄새가 가장 강하게 나는 곳을 먼저 찾아봐요.'),
        step2: step(STEP2_LABEL, '싱크대 배수와 음식물 주변을 집중 점검해요', '싱크대 배수구 내부를 세정제로 닦고 음식물 쓰레기통도 씻어 냄새 원인을 줄여요.'),
        step3: step(SMELL_STEP3_LABEL.persistent, '계속 남는다면 싱크대 하부도 확인해요', '청소 후에도 남는다면 싱크대 하부 배관이나 연결부에 문제가 없는지 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('주방 배수관 청소'), service('싱크대 트랩 점검'), service('전문 탈취')],
      },
      recurring: {
        guideTitle: '반복되는 주방 냄새 설비 점검 가이드',
        step1: step(STEP1_LABEL, '싱크대 아래에서 냄새가 올라오는지 확인해요', '싱크대 문을 열고 아래쪽 배관 주변에서 냄새가 나는지 직접 확인해봐요.'),
        step2: step(STEP2_LABEL, '배관 연결부와 트랩을 확인해요', '배관이 헐거워지지 않았는지, 트랩에 물이 말라 있지 않은지 살펴봐요.'),
        step3: step(SMELL_STEP3_LABEL.recurring, '환기해도 반복되면 배관 점검을 요청해요', '환기와 청소를 반복해도 계속된다면 배관 설비 문제일 수 있어 점검을 요청해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('싱크대 배관 점검'), service('트랩 교체'), service('전문 악취 진단')],
      },
    },
    room: {
      sometimes: {
        guideTitle: '간헐적인 실내 냄새 확인 가이드',
        step1: step(STEP1_LABEL, '창을 열어 공기를 바꿔주세요', '서로 다른 방향의 창을 함께 열어 맞바람이 통하도록 하고 실내 공기를 바꿔줘요.'),
        step2: step(STEP2_LABEL, '침구와 옷장 등 냄새가 머무는 곳을 확인해요', '침구, 옷장, 커튼처럼 냄새가 배기 쉬운 섬유류를 확인하고 필요하면 환기해줘요.'),
        step3: step(SMELL_STEP3_LABEL.sometimes, '언제 냄새가 생기는지 기록해요', '특정 요일이나 날씨에만 생긴다면 그 조건을 기록해 원인을 좁혀봐요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('침구·실내 청소'), service('에어컨 점검'), service('필요 시 탈취 서비스')],
      },
      persistent: {
        guideTitle: '지속적인 실내 냄새 해결 가이드',
        step1: step(STEP1_LABEL, '집 안을 구역별로 나눠 냄새 위치를 찾아요', '거실, 방, 현관처럼 구역을 나눠 냄새가 가장 강한 곳을 먼저 찾아봐요.'),
        step2: step(STEP2_LABEL, '가구 뒤, 옷장, 에어컨 주변을 확인해요', '가구 뒤쪽의 먼지, 옷장 속 습기, 에어컨 필터 상태를 확인하고 정리해요.'),
        step3: step(SMELL_STEP3_LABEL.persistent, '계속 남으면 습기나 숨은 오염원을 확인해요', '환기해도 남는다면 벽 뒤 습기나 카펫, 매트리스 같은 숨은 오염원을 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('실내 전문 청소'), service('에어컨 청소'), service('결로·습기 점검')],
      },
      recurring: {
        guideTitle: '반복되는 실내 냄새 원인 점검 가이드',
        step1: step(STEP1_LABEL, '환기 후 냄새가 돌아오는 시간을 확인해요', '환기를 마친 뒤 얼마 만에 냄새가 다시 돌아오는지 시간을 확인해봐요.'),
        step2: step(STEP2_LABEL, '벽·바닥·에어컨·배관 주변을 점검해요', '벽면 결로, 바닥 이음새, 에어컨 배수호스 주변에 문제가 없는지 점검해요.'),
        step3: step(SMELL_STEP3_LABEL.recurring, '반복된다면 구조적인 원인을 확인해요', '환기로도 해결되지 않는다면 결로나 누수처럼 구조적인 원인이 있는지 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('전문 악취 진단'), service('결로·누수 점검'), service('관리실 문의')],
      },
    },
  },

  etc: {
    drainage: {
      inconvenient: {
        guideTitle: '가벼운 배수·수압 문제 확인 가이드',
        step1: step(STEP1_LABEL, '다른 수도도 같은지 확인해요', '세면대, 싱크대, 샤워기 등 다른 곳도 물이 약하거나 안 내려가는지 함께 확인해요.'),
        step2: step(STEP2_LABEL, '거름망과 수전 끝부분을 확인해요', '배수구 거름망의 머리카락이나 이물질을 제거하고 수전 끝부분도 함께 닦아줘요.'),
        step3: step(ETC_STEP3_LABEL.inconvenient, '사용은 가능하면 증상을 기록해봐요', '사용에 큰 지장이 없다면 증상이 나타나는 시간과 정도를 기록하며 지켜봐요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('수전 점검'), service('배수구 청소'), service('관리실 문의')],
      },
      difficult: {
        guideTitle: '생활에 영향을 주는 배수·수압 문제 해결 가이드',
        step1: step(STEP1_LABEL, '문제가 한 곳인지 집 전체인지 확인해요', '한 곳만 그런지 집 전체 수압이나 배수가 다 약한지 확인하면 원인을 좁힐 수 있어요.'),
        step2: step(STEP2_LABEL, '무리하게 배관을 분해하지 마세요', '직접 배관을 분해하기보다 거름망 청소처럼 안전한 범위에서만 확인해요.'),
        step3: step(ETC_STEP3_LABEL.difficult, '정상적인 사용이 어렵다면 점검을 요청해요', '생활에 지장이 있을 정도라면 증상을 정리해 관리실이나 전문 업체에 점검을 요청해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 설비 점검'), service('배수관 전문 청소'), service('수전·수압 점검')],
      },
      urgent: {
        guideTitle: '긴급 배수·수압 문제 대응 가이드',
        step1: step(STEP1_LABEL, '물이 넘치거나 새면 사용을 멈춰주세요', '물이 역류하거나 넘친다면 해당 수전이나 변기 사용을 즉시 멈춰주세요.'),
        step2: step(STEP2_LABEL, '주변의 전기제품과 물건을 치워주세요', '물이 닿을 수 있는 전기제품과 젖으면 안 되는 물건을 먼저 안전한 곳으로 옮겨요.'),
        step3: step(ETC_STEP3_LABEL.urgent, '직접 배관을 분해하지 말고 바로 도움을 요청해요', '무리하게 직접 고치려 하지 말고 관리실이나 전문 업체에 바로 연락해 도움을 요청해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 긴급 접수'), service('배관 긴급 수리'), service('임대인 문의')],
      },
    },
    leak: {
      inconvenient: {
        guideTitle: '초기 누수 징후 확인 가이드',
        step1: step(STEP1_LABEL, '젖은 위치를 사진으로 남겨요', '젖거나 얼룩진 위치를 사진으로 남겨 나중에 번지는 정도를 비교할 수 있게 해요.'),
        step2: step(STEP2_LABEL, '물이 더 번지는지 확인해요', '하루 이틀 간격으로 같은 자리를 확인해 얼룩이나 물기가 더 커지는지 살펴봐요.'),
        step3: step(ETC_STEP3_LABEL.inconvenient, '작은 흔적이어도 반복되는지 관찰해요', '한 번으로 끝나지 않고 같은 자리에 반복된다면 누수 가능성을 염두에 두고 지켜봐요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 점검'), service('누수 상담'), service('임대인 문의')],
      },
      difficult: {
        guideTitle: '생활에 영향을 주는 누수 대응 가이드',
        step1: step(STEP1_LABEL, '해당 공간의 물 사용을 줄여주세요', '누수가 의심되는 공간과 연결된 수도나 세탁기 사용을 줄여 물이 더 새지 않게 해요.'),
        step2: step(STEP2_LABEL, '가구와 물건을 젖은 곳에서 옮겨요', '젖은 부분 근처의 가구와 전자제품을 미리 옮겨 추가 피해를 막아줘요.'),
        step3: step(ETC_STEP3_LABEL.difficult, '빠르게 관리실이나 임대인에게 점검을 요청해요', '생활에 지장이 있는 정도라면 사진과 함께 관리실이나 임대인에게 빠르게 점검을 요청해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('누수 탐지'), service('배관 수리'), service('임대인·관리실 접수')],
      },
      urgent: {
        guideTitle: '긴급 누수 안전 대응 가이드',
        step1: step(STEP1_LABEL, '누수 주변 사용을 즉시 중단해요', '물이 계속 새는 공간과 그 주변 시설의 사용을 바로 멈춰주세요.'),
        step2: step(STEP2_LABEL, '전기 설비가 젖었다면 가까이 가지 마세요', '콘센트나 전기 설비가 물에 젖었다면 절대 만지지 말고 거리를 두세요.'),
        step3: step(ETC_STEP3_LABEL.urgent, '직접 수리하지 말고 즉시 도움을 요청해요', '직접 해결하려 하지 말고 관리실이나 전문 업체에 즉시 연락해 상황을 알려요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 긴급 접수'), service('긴급 누수 탐지·수리'), service('임대인 긴급 문의')],
      },
    },
    facility: {
      inconvenient: {
        guideTitle: '가벼운 생활 시설 고장 확인 가이드',
        step1: step(STEP1_LABEL, '언제부터 어떤 증상이 생겼는지 기록해요', '고장 증상이 시작된 시점과 구체적인 상태를 메모나 사진으로 남겨두세요.'),
        step2: step(STEP2_LABEL, '배터리나 플러그처럼 쉽게 확인 가능한 부분만 확인해요', '배터리 잔량이나 플러그가 제대로 꽂혀 있는지처럼 안전한 부분만 확인해요.'),
        step3: step(ETC_STEP3_LABEL.inconvenient, '사용 가능하면 상태가 악화되는지 지켜봐요', '사용에 큰 지장이 없다면 며칠 지켜보며 증상이 심해지는지 확인해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('생활 설비 점검'), service('관리실 문의'), service('필요 시 수리 서비스')],
      },
      difficult: {
        guideTitle: '사용이 어려운 시설 고장 해결 가이드',
        step1: step(STEP1_LABEL, '문제 시설의 사용을 잠시 중단해요', '고장 증상이 있는 시설은 상태가 나빠지지 않도록 잠시 사용을 멈춰주세요.'),
        step2: step(STEP2_LABEL, '모델명과 고장 증상을 기록해요', '제품 모델명과 구체적인 고장 증상을 기록해두면 점검이나 수리를 빠르게 요청할 수 있어요.'),
        step3: step(ETC_STEP3_LABEL.difficult, '생활에 영향을 준다면 수리를 요청해요', '생활이 불편할 정도라면 기록한 내용을 바탕으로 관리실에 수리를 요청해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('생활 설비 수리'), service('관리실 점검'), service('임대인 문의')],
      },
      urgent: {
        guideTitle: '위험 가능성이 있는 시설 고장 대응 가이드',
        step1: step(STEP1_LABEL, '해당 시설 사용을 즉시 멈춰주세요', '이상 증상이 있는 시설은 더 사용하지 말고 바로 전원을 끄거나 사용을 멈춰주세요.'),
        step2: step(STEP2_LABEL, '타는 냄새, 스파크, 누전 등이 있으면 가까이 가지 마세요', '타는 냄새나 스파크가 보인다면 가까이 가지 말고 즉시 그 자리에서 벗어나요.'),
        step3: step(ETC_STEP3_LABEL.urgent, '직접 분해하지 말고 즉시 전문 도움을 요청해요', '위험한 상태이므로 직접 손대지 말고 관리실이나 전문 업체에 즉시 연락해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 긴급 접수'), service('전기·설비 긴급 점검'), service('임대인 긴급 문의')],
      },
    },
    misc: {
      inconvenient: {
        guideTitle: '가벼운 생활 문제 확인 가이드',
        step1: step('먼저 확인해봐요', '증상을 사진과 메모로 남겨주세요', '문제가 언제부터 시작됐는지, 어떤 상황에서 더 불편한지 사진과 함께 기록해두세요. 나중에 관리실이나 수리 업체에 설명할 때도 도움이 돼요.'),
        step2: step('직접 확인해요', '쉽게 확인할 수 있는 원인부터 살펴봐요', '전원, 배터리, 설정, 주변 장애물처럼 위험하지 않고 눈으로 확인할 수 있는 부분부터 살펴봐요. 기기 내부나 배관은 무리하게 분해하지 않아요.'),
        step3: step('조금 더 지켜봐요', '사용은 가능하다면 상태 변화를 확인해요', '당장 생활에 큰 영향을 주지 않는다면 며칠 동안 문제가 심해지는지 확인해봐요. 반복되거나 범위가 커지면 기록한 내용을 바탕으로 점검을 요청해요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 일반 문의'), service('생활 수리 상담'), service('필요 시 임대인 문의')],
      },
      difficult: {
        guideTitle: '생활에 영향을 주는 문제 해결 가이드',
        step1: step('먼저 해볼 수 있어요', '문제 상황과 영향을 구체적으로 기록해요', '어떤 기능을 사용할 수 없는지와 문제가 시작된 시점을 사진이나 메모로 남겨주세요. 다른 기능까지 함께 이상한지도 확인하면 원인을 설명하기 쉬워요.'),
        step2: step('무리하게 사용하지 않아요', '문제가 있는 시설의 사용을 줄여주세요', '계속 사용하면 상태가 악화될 것 같다면 잠시 사용을 멈춰주세요. 원인을 모르는 상태에서 임의로 분해하거나 강제로 작동시키지는 않는 것이 좋아요.'),
        step3: step('빠르게 문의해요', '생활이 어렵다면 점검을 요청해요', '일상생활에 지장이 생길 정도라면 직접 해결을 반복하기보다 관리실이나 임대인에게 점검을 요청해요. 사진과 증상을 함께 전달하면 상황을 빠르게 설명할 수 있어요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 설비 점검'), service('전문 생활 수리'), service('임대인 문의')],
      },
      urgent: {
        guideTitle: '긴급 생활 문제 안전 대응 가이드',
        step1: step('먼저 안전을 확보해요', '문제가 있는 곳의 사용을 즉시 멈춰주세요', '물, 전기, 화재, 파손처럼 위험 가능성이 있다면 해당 시설에 가까이 가지 말고 사용을 중단해요.'),
        step2: step('직접 해결하지 않아요', '위험한 시설은 임의로 분해하지 마세요', '전기 설비, 배관, 가스, 무거운 구조물 등은 직접 수리하지 말고 주변 사람의 접근도 막아주세요.'),
        step3: step('바로 도움을 요청해요', '관리실이나 전문 업체에 즉시 알려주세요', '현재 상황과 위치를 전달하고 필요하면 임대인에게도 바로 알려 안전 점검을 받아요.'),
        step4Label: DEFAULT_STEP4_LABEL,
        services: [service('관리실 긴급 접수'), service('전문 설비 긴급 수리'), service('임대인 긴급 문의')],
      },
    },
  },
};

/** 회귀 방지 — 4 × 4 × 3 = 48개 조합에 Scenario 가 빠짐없이 있는지 개발 모드에서 확인한다.
 * 테스트 러너가 없는 프로젝트라 별도 테스트 파일 대신 모듈 로드 시 1회 검증하는 방식을 쓴다. */
export function findMissingHomecareScenarios(): string[] {
  const missing: string[] = [];
  (Object.keys(HOMECARE_CATEGORIES) as ProblemKey[]).forEach((categoryKey) => {
    const category = HOMECARE_CATEGORIES[categoryKey];
    category.primaryOptions.forEach(({ key: primaryKey }) => {
      category.secondaryOptions.forEach(({ key: severityKey }) => {
        const scenario = HOMECARE_GUIDE_SCENARIOS[categoryKey]?.[primaryKey]?.[severityKey];
        const stepsComplete = [scenario?.step1, scenario?.step2, scenario?.step3].every(
          (s) => !!s?.title && !!s?.body,
        );
        const complete = !!scenario?.guideTitle && stepsComplete && !!scenario.services?.length;
        if (!complete) missing.push(`${categoryKey}.${primaryKey}.${severityKey}`);
      });
    });
  });
  return missing;
}

if (import.meta.env.DEV) {
  const missing = findMissingHomecareScenarios();
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[homecareGuide] 누락되었거나 불완전한 시나리오 ${missing.length}건:`, missing);
  }
}
