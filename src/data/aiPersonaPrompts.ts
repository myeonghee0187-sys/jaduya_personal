import type { ScenarioIntent } from './aiScenarios';

export type AIPersonaPrompt = {
  category: string;
  icon: 'home.svg' | 'procedure.svg' | 'boon.svg';
  label: string;
  scenario: NonNullable<ScenarioIntent>;
};

/**
 * 자두AI 첫 화면 공통 추천 질문.
 * 집 수리, 행정 절차, 혜택 시나리오를 한 번에 시작할 수 있게 노출한다.
 */
export const AI_FIRST_SCREEN_PROMPTS: readonly AIPersonaPrompt[] = [
  {
    category: '집 · 수리',
    icon: 'home.svg',
    label: '싱크대 밑에서 물이 새는데 어떻게 해야 돼?',
    scenario: { scenarioId: 'plumbing-leak', stage: 'sink-check' },
  },
  {
    category: '행정 · 절차',
    icon: 'procedure.svg',
    label: '전입신고 처음인데 뭐부터 어떻게 해야 할지 순서 알려줘.',
    scenario: { scenarioId: 'moveIn', stage: 'move-stage' },
  },
  {
    category: '혜택 · 지원금',
    icon: 'boon.svg',
    label: '내 조건에 맞는 지원금이나 받을 수 있는 혜택은 어떤 게 있어?',
    scenario: { scenarioId: 'support', stage: 'category' },
  },
];
