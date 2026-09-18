import type { Persona } from '../auth/mockUsers';
import type { HomePersonaContent } from '../types';

/* persona 별 Home 콘텐츠 (Hero 인사).
 * HomeBenefitBanner는 문구가 고정이라 여기서 갈아끼우지 않는다.
 *
 * key 는 auth/mockUsers.ts 의 Persona 타입을 그대로 쓴다.
 *   beginner = 이서준 / 자취 초보
 *   worker   = 김하린 / 직장인 자취러
 *   pet      = 조아영 / 반려동물과 함께 사는 자취러
 *
 * Home 화면은 하나이고, 여기의 데이터만 갈아끼운다.
 */
export const HOME_PERSONA_CONTENT: Record<Persona, HomePersonaContent> = {
  beginner: {
    hero: {
      situation: '입주까지 D-12',
      headline: '자취 준비 중이에요.',
      sub: '초기비용 480만원, 체크리스트 4개 남았어요.',
    },
  },

  worker: {
    hero: {
      situation: '이번 달 생활비 62% 사용',
      headline: '이번 달도 순조로워요.',
      sub: '고정비 65만원, 배달비가 3만원 늘었어요.',
    },
  },

  pet: {
    hero: {
      situation: '예방접종까지 D-5',
      headline: '반려생활 체크해요.',
      sub: '이번 달 반려 지출 12만원, 절반이 병원비예요.',
    },
  },
};

/** persona 가 없을 때(예: 일반 테스트 가입자) 쓰는 기본값 */
export const DEFAULT_PERSONA: Persona = 'beginner';

/* 인사말은 기존 디자인대로 이름(성 제외) + "님," 을 쓴다. (예: 이서준 → 서준님) */
export function greetingName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length === 3 ? trimmed.slice(1) : trimmed;
}
