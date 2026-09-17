import type { ScenarioIntent } from './aiScenarios';

export type AIPersonaPrompt = {
  label: string;
  scenario: NonNullable<ScenarioIntent>;
};

/**
 * 자두AI 첫 화면 공통 추천 질문.
 * 데모 페르소나와 관계없이 서준 → 하린 → 아영 시나리오 순서로 모두 노출한다.
 */
export const AI_FIRST_SCREEN_PROMPTS: readonly AIPersonaPrompt[] = [
  {
    label: '입주 전에 꼭 확인해야 할 것 알려줘',
    scenario: { scenarioId: 'pre-move-check', stage: 'overview' },
  },
  {
    label: '원룸에 곰팡이가 생겼는데 어떻게 관리해?',
    scenario: { scenarioId: 'mold-care', stage: 'location' },
  },
  {
    label: '근처에 믿을 만한 수리업체 찾아줘',
    scenario: { scenarioId: 'repair-search', stage: 'category' },
  },
];
