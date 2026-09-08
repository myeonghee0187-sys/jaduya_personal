import type { Persona } from '../auth/mockUsers';
import type { HomePersonaContent } from '../types';

/* persona 별 Home 콘텐츠 (Hero 인사 + TipBox).
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
    tips: [
      {
        title: '첫날 박스는 따로 챙겨두세요',
        detail: '휴지·수건·충전기처럼 바로 쓸 물건을 한곳에 모아두면 편해요.',
      },
      {
        title: '입주한 날, 집 상태를 사진으로 남겨두세요',
        detail: '벽·바닥·옵션 가전의 기존 흠집을 기록해두면 나중에 확인하기 쉬워요.',
      },
      {
        title: '생활용품은 한꺼번에 사지 않아도 돼요',
        detail: '일주일 살아본 뒤 필요한 물건부터 채우면 불필요한 지출을 줄일 수 있어요.',
      },
      {
        title: '첫 달 생활비는 조금 넉넉하게 잡아두세요',
        detail: '생필품과 설치비처럼 예상하지 못한 비용이 생길 수 있어요.',
      },
    ],
  },

  worker: {
    hero: {
      situation: '이번 달 생활비 62% 사용',
      headline: '이번 달도 순조로워요.',
      sub: '고정비 65만원, 배달비가 3만원 늘었어요.',
    },
    tips: [
      {
        title: '먼저 먹을 재료는 앞줄에 두세요',
        detail: '냉장고 앞칸만 확인해도 유통기한 놓치는 일이 줄어들어요.',
      },
      {
        title: '음식물 쓰레기는 얼려서 버리세요',
        detail: '봉투에 모아두는 동안 생기는 냄새와 초파리를 막을 수 있어요.',
      },
      {
        title: '배달 시킨 날은 표시해두세요',
        detail: '한 달에 몇 번인지 눈에 보이면 식비 조절이 훨씬 쉬워져요.',
      },
    ],
  },

  pet: {
    hero: {
      situation: '예방접종까지 D-5',
      headline: '반려생활 체크해요.',
      sub: '이번 달 반려 지출 12만원, 절반이 병원비예요.',
    },
    tips: [
      {
        title: '병원비는 미리 따로 모아두세요',
        detail: '예방접종과 갑작스러운 진료는 나눠서 준비해두면 부담이 덜해요.',
      },
      {
        title: '지원 조건은 지역부터 확인하세요',
        detail: '같은 이름의 사업도 시·군마다 대상과 금액이 달라질 수 있어요.',
      },
      {
        title: '야간 진료 병원을 저장해두세요',
        detail: '급하게 검색하면 늦어요. 가까운 곳 한 곳만 알아둬도 든든해요.',
      },
    ],
  },
};

/** persona 가 없을 때(예: 일반 테스트 가입자) 쓰는 기본값 */
export const DEFAULT_PERSONA: Persona = 'beginner';

/* 인사말은 기존 디자인대로 이름(성 제외) + "님," 을 쓴다. (예: 이서준 → 서준님) */
export function greetingName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length === 3 ? trimmed.slice(1) : trimmed;
}
