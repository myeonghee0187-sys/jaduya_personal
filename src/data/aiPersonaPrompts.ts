import type { Persona } from '../auth/mockUsers';
import type { ScenarioIntent } from './aiScenarios';

export type AIPersonaPrompt = {
  label: string;
  scenario: NonNullable<ScenarioIntent>;
};

export const AI_PROMPTS_BY_PERSONA: Record<Persona, readonly AIPersonaPrompt[]> = {
  beginner: [
    {
      label: '입주 전에 꼭 확인해야 할 것 알려줘',
      scenario: { scenarioId: 'pre-move-check', stage: 'result' },
    },
  ],
  worker: [
    {
      label: '원룸에 곰팡이가 생겼는데 어떻게 관리해?',
      scenario: { scenarioId: 'mold-care', stage: 'location' },
    },
  ],
  pet: [
    {
      label: '근처에 믿을 만한 수리업체 찾아줘',
      scenario: { scenarioId: 'repair-search', stage: 'category' },
    },
  ],
};
