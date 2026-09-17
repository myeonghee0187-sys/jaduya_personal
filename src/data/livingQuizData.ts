import type { Persona } from '../auth/mockUsers';

/** 생활 퀴즈에서 사용자가 선택할 수 있는 하나의 답변 항목 */
export type LivingQuizOption = {
  id: string;
  label: string;
  isCorrect: boolean;
};

/**
 * 페르소나별 생활 퀴즈 데이터.
 * personaId는 AuthUser.persona와 같은 Persona 타입을 사용해 사용자 모델과 어긋나지 않게 한다.
 */
export type LivingQuizData = {
  id: string;
  personaId: Persona;
  headline: string;
  subheadline: string;
  category: string;
  difficulty: string;
  question: string;
  options: LivingQuizOption[];
  correctFeedback: string;
  incorrectFeedback: string;
  explanation: string;
  visualKey: string;
};

/**
 * 실제 persona 키 기준 퀴즈 매핑.
 * beginner = 이서준, worker = 김하린, pet = 조아영
 */
export const LIVING_QUIZ_BY_PERSONA: Record<Persona, LivingQuizData> = {
  beginner: {
    id: 'seojun-eggshell-disposal',
    personaId: 'beginner',
    headline: '서준님, 자취 전에 이것만은 알아두세요!',
    subheadline: '30초면 끝나요. 오늘 하나만 알아가세요.',
    category: '분리배출',
    difficulty: '초급',
    question: '계란 껍데기, 어디에 버려야 할까요?',
    options: [
      { id: 'general', label: '일반 쓰레기', isCorrect: true },
      { id: 'food', label: '음식물 쓰레기', isCorrect: false },
    ],
    correctFeedback: '정답이에요! 계란 껍데기는 일반 쓰레기로 버려야 해요.',
    incorrectFeedback: '아쉬워요! 계란 껍데기는 음식물 쓰레기가 아니에요.',
    explanation: '계란 껍데기는 단단해서 사료나 퇴비로 재활용하기 어려워 일반 쓰레기로 분류해요.',
    visualKey: 'egg',
  },
  worker: {
    id: 'harin-cooking-oil-disposal',
    personaId: 'worker',
    headline: '하린님, 이건 알고 계셨나요?',
    subheadline: '익숙한 자취생활에도 은근히 헷갈리는 게 있어요.',
    category: '주방관리',
    difficulty: '중급',
    question: '프라이팬에 남은 기름, 어떻게 버리는 게 좋을까요?',
    options: [
      { id: 'wipe', label: '휴지로 닦아 일반 쓰레기', isCorrect: true },
      { id: 'sink', label: '싱크대에 흘려보내기', isCorrect: false },
    ],
    correctFeedback: '정답이에요! 남은 기름은 닦아낸 뒤 일반 쓰레기로 처리하는 게 좋아요.',
    incorrectFeedback: '싱크대에 바로 버리면 배수관에 기름이 쌓일 수 있어요.',
    explanation: '식용유나 기름을 싱크대에 흘려보내면 식으면서 배관에 달라붙어 막힘이나 악취의 원인이 될 수 있어요. 소량은 키친타월 등으로 닦아 일반 쓰레기로 처리해주세요.',
    visualKey: 'cooking-oil',
  },
  pet: {
    id: 'ayoung-rainy-season-humidity',
    personaId: 'pet',
    headline: '아영님, 우리 집 관리 상식 체크해볼까요?',
    subheadline: '집을 오래 쾌적하게 쓰는 작은 습관이에요.',
    category: '집 관리',
    difficulty: '중급',
    question: '장마철 습도가 높을 때, 환기는 어떻게 하는 게 좋을까요?',
    options: [
      { id: 'always-open', label: '창문을 계속 열어둔다', isCorrect: false },
      { id: 'short-ventilation', label: '제습하며 짧게 환기한다', isCorrect: true },
    ],
    correctFeedback: '정답이에요! 습한 날에는 짧게 환기하고 제습을 함께 하는 게 좋아요.',
    incorrectFeedback: '비가 오는 날 창문을 계속 열어두면 오히려 실내 습도가 더 높아질 수 있어요.',
    explanation: '장마철에는 외부 공기 자체의 습도가 높기 때문에 창문을 계속 열어두기보다 짧게 환기한 뒤 제습기나 에어컨의 제습 기능을 함께 사용하는 편이 좋아요.',
    visualKey: 'humidity',
  },
};

/** UI에서는 현재 user.persona를 그대로 전달하면 된다. 값이 없으면 초보용 퀴즈를 사용한다. */
export function getLivingQuizByPersona(persona: Persona | null | undefined): LivingQuizData {
  return persona ? LIVING_QUIZ_BY_PERSONA[persona] : LIVING_QUIZ_BY_PERSONA.beginner;
}
