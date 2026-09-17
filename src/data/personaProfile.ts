import type { Persona } from '../auth/mockUsers';
import type { HousingType, LivingExperience } from './livingProfile';
import { img } from '../lib/asset';

/* persona 별 마이페이지 콘텐츠.
 *
 * personaHome.ts 와 같은 방식이다 — 화면은 하나이고 여기의 데이터만 갈아끼운다.
 * key 는 auth/mockUsers.ts 의 Persona 를 그대로 쓴다.
 *   beginner = 이서준 / 자취 초보
 *   worker   = 김하린 / 직장인 자취러
 *   pet      = 조아영 / 반려동물과 함께 사는 자취러
 */

/** 나의 활동 탭 — 4개 고정 */
export type ActivityTab = '저장' | '완료' | '작성' | '댓글';

export const ACTIVITY_TABS: ActivityTab[] = ['저장', '완료', '작성', '댓글'];

/** 탭 버튼 아이콘 — public/assets/icon/ 아래 파일명 (currentColor 마스크로 칠한다) */
export const ACTIVITY_TAB_ICONS: Record<ActivityTab, string> = {
  저장: 'tab-bookmark.svg',
  완료: 'tab-check.svg',
  작성: 'tab-pencil.svg',
  댓글: 'tab-comment.svg',
};

/** 카드 좌상단 카테고리 칩 — IA 의 대분류를 그대로 쓴다 */
export type ActivityCategory = '생활' | '돈 관리' | '커뮤니티' | '집·주거';

/** 칩 배경색 — 생활/돈 관리는 Figma btn_inactive_chip 값 그대로 */
export const CATEGORY_CHIP_COLOR: Record<ActivityCategory, string> = {
  생활: '#e2e8bc',
  '돈 관리': '#fef5d6',
  커뮤니티: '#f0d7d7',
  '집·주거': '#dbe7f0',
};

export interface ActivityItem {
  id: string;
  category: ActivityCategory;
  /** public/assets/icon/ 아래 파일명 — thumbnail 이 없을 때 대체로 쓴다 */
  icon: string;
  /** public/assets/img/thumb/ 아래 파일명. 없으면 icon 으로 대체한다 */
  thumbnail?: string;
  title: string;
  /** 한 줄 설명 */
  desc: string;
  /** YYYY.MM.DD */
  date: string;
}

/* ================= 자취 레벨 =================
 *
 * 숫자 Level 과 성장 stage 는 1:1 로 대응한다 — Lv.N 의 stage 는 LEVEL_STAGES[N] 하나뿐이다.
 * (Lv.1 새싹 / Lv.2 씨앗 같은 어긋난 조합이 생기지 않도록 stage 를 따로 저장하지 않는다.)
 *
 * 레벨은 자취 연차만이 아니라 서비스 안의 활동·미션 수행까지 반영한 "자취 성장도" 다.
 * 실제 XP 획득 로직은 아직 없고, persona 별 현재 값만 이 파일이 들고 있는다.
 *
 * Home(내 생활 stat bar) 은 숫자 Level 을, 마이페이지·미션은 stage 아이콘·이름까지 쓴다.
 * 아이콘 경로는 LEVEL_STAGES 한 곳에서만 만들고 화면에서는 직접 쓰지 않는다. */

/** 5단계 성장 stage — id 는 level_icon 파일명과 같은 표기를 쓴다 */
export type LevelStage = 'seed' | 'sprout' | 'plum_blossom' | 'green_plum' | 'ripe_plum';

/** 숫자 Level — 1~5 외의 값은 쓰지 않는다 */
export type LevelValue = 1 | 2 | 3 | 4 | 5;

/** 최고 레벨. 여기 도달하면 다음 레벨이 없다(progress 100 / 남은 XP 없음) */
export const MAX_LEVEL = 5;

/** 한 레벨 구간의 XP — 데모에서는 100XP 로 단순화한다(남은 XP = 100 - progress) */
export const LEVEL_XP_SPAN = 100;

export interface LevelStageDef {
  stage: LevelStage;
  name: string;
  /** public/assets/img/level_icon/ 아래 실제 파일명 */
  iconFile: string;
}

/** Lv.1~5 ↔ stage 매핑. 이 표가 레벨 이름·아이콘의 유일한 원본이다. */
export const LEVEL_STAGES: Record<LevelValue, LevelStageDef> = {
  1: { stage: 'seed', name: '씨앗', iconFile: 'level01_seed.webp' },
  2: { stage: 'sprout', name: '새싹', iconFile: 'level02_sprout.webp' },
  3: { stage: 'plum_blossom', name: '자두꽃', iconFile: 'level03_plum_blossom.webp' },
  4: { stage: 'green_plum', name: '덜 익은 자두', iconFile: 'level04_green_plum.webp' },
  5: { stage: 'ripe_plum', name: '잘 익은 자두', iconFile: 'level05_ripe_plum.webp' },
};

export const LEVEL_VALUES: LevelValue[] = [1, 2, 3, 4, 5];

export interface ResolvedStage extends LevelStageDef {
  /** 성장 순서 1~5 — 숫자 Level 과 같은 값이다 */
  step: LevelValue;
  /** img() 로 만든 절대 URL */
  icon: string;
}

/** 성장 순서대로 정렬한 5단계 + 아이콘 경로.
 * 로드맵처럼 전 단계를 함께 보여주는 화면이 쓴다 — 화면에서 파일명을 조합하지 않게 한다. */
export const LEVEL_STAGE_LIST: ResolvedStage[] = LEVEL_VALUES.map((value) => ({
  step: value,
  ...LEVEL_STAGES[value],
  icon: img(`level_icon/${LEVEL_STAGES[value].iconFile}`),
}));

/** persona 가 저장하는 레벨 원본 값 — stage/남은 XP 는 여기서 유도하므로 적지 않는다 */
export interface LevelSource {
  /** 하트 보유량 — Home stat bar 왼쪽 (레벨과는 별개 지표) */
  hearts: number;
  /** 숫자 Level 1~5 */
  level: LevelValue;
  /** 현재 레벨 안에서의 진행률 0~100. 최고 레벨은 100 */
  progress: number;
}

/** 화면이 그대로 쓰는 레벨 값 묶음 */
export interface ResolvedLevel {
  hearts: number;
  level: LevelValue;
  stage: LevelStage;
  /** 성장 단계 이름 (예: 씨앗) */
  stageName: string;
  /** 성장 단계 순서 1~5 — level 과 같은 값이다 */
  stageStep: LevelValue;
  /** 성장 단계 아이콘 경로 — img() 로 만든 절대 URL */
  levelIcon: string;
  /** 현재 레벨 안에서의 진행도 0~100 */
  progress: number;
  /** 다음 레벨까지 남은 XP. 최고 레벨이면 null */
  remainingXp: number | null;
  /** 최고 레벨 도달 여부 — true 면 남은 XP 문구를 띄우지 않는다 */
  isMaxLevel: boolean;
  /** 카드 우측 표기 — 최고 레벨은 'MAX', 그 외는 진행률 숫자 */
  progressLabel: string;
  /** Home stat bar 표기 — 폭 100px 고정이라 짧게 유지한다 */
  levelLabel: string;
  /** Home stat bar 표기 — 폭 73px 고정 */
  heartsLabel: string;
}

export function resolveLevel(source: LevelSource): ResolvedLevel {
  /* stage 는 숫자 level 에서 곧바로 나온다 — 둘이 어긋날 수가 없다 */
  const stage = LEVEL_STAGES[source.level];
  const isMaxLevel = source.level >= MAX_LEVEL;
  const progress = isMaxLevel ? 100 : source.progress;
  return {
    hearts: source.hearts,
    level: source.level,
    stage: stage.stage,
    stageName: stage.name,
    stageStep: source.level,
    levelIcon: img(`level_icon/${stage.iconFile}`),
    progress,
    /* 한 구간 100XP 기준이라 남은 XP 는 진행률의 나머지다 */
    remainingXp: isMaxLevel ? null : LEVEL_XP_SPAN - progress,
    isMaxLevel,
    progressLabel: isMaxLevel ? 'MAX' : String(progress),
    levelLabel: `Lv.${source.level}`,
    heartsLabel: source.hearts.toLocaleString('ko-KR'),
  };
}

export interface PersonaProfile {
  /* ---- 자취 프로필 (마이페이지 요약 + 자취 프로필 설정 화면의 공통 원본) ----
   * 두 화면이 이 값을 함께 읽는다. 화면별로 따로 적어두지 않는다. */
  /** 자취 경험 — 자취 프로필 설정 화면의 선택지와 같은 값이다 */
  experience: LivingExperience;
  /** 주거 형태 — 자취 프로필 설정 화면의 선택지와 같은 값이다 */
  housing: HousingType;
  /** 요약에 쓰는 자취 경험 표현. 선택지('1년 이상')보다 구체적인 연차를 보여준다 */
  experienceLabel: string;
  /** public/assets/img/ 아래 프로필 사진 파일명 */
  profileImage: string;
  level: LevelSource;
  activity: Record<ActivityTab, ActivityItem[]>;
}

/** 마이페이지 이름 아래 한 줄 — 자취 경험 · 주거 형태.
 * 아직 입주 전(자취 준비중)이면 '거주' 를 붙이지 않는다. */
export function profileSummary(profile: PersonaProfile): string {
  const suffix = profile.experience === '자취 준비중' ? '' : ' 거주';
  return `${profile.experienceLabel} · ${profile.housing}${suffix}`;
}

export const PERSONA_PROFILE: Record<Persona, PersonaProfile> = {
  /* 이서준 · 자취 초보 — 아직 입주 전이라 활동 기록이 적다 */
  beginner: {
    experience: '자취 준비중',
    housing: '기타 주거',
    experienceLabel: '자취 준비중',
    profileImage: 'profile_seojun.webp',
    /* 아직 입주 전이고 서비스 활동도 거의 없어 세 계정 중 가장 초기 단계다 */
    level: { hearts: 120, level: 1, progress: 5 },
    activity: {
      저장: [
        {
          id: 'checklist',
          category: '생활',
          icon: 'menu-checklist.svg',
          title: '자취 첫 달 준비물 체크리스트',
          desc: '입주 전에 챙길 것 28개',
          date: '2026.09.02',
        },
        {
          id: 'move-in',
          category: '집·주거',
          icon: 'menu-board.svg',
          title: '전입신고와 확정일자 받는 순서',
          desc: '보증금을 지키는 첫 절차',
          date: '2026.08.29',
        },
      ],
      완료: [
        {
          id: 'room-photo',
          category: '생활',
          icon: 'menu-calendar.svg',
          title: '입주 전 집 상태 사진 남기기',
          desc: '벽·바닥·옵션 가전 기록 완료',
          date: '2026.09.05',
        },
      ],
      작성: [],
      댓글: [],
    },
  },

  /* 김하린 · 직장인 자취러 — 생활비와 고정비 관리가 중심 */
  worker: {
    experience: '3년 이상',
    housing: '원룸',
    experienceLabel: '자취 3년차',
    profileImage: 'profile_harin.webp',
    /* 자취 3년차 + 서비스 활용도가 가장 높아 데모의 최고 단계(Lv.5 잘 익은 자두)다.
     * 최고 레벨이라 progress 100 / 남은 XP 없음(MAX) 으로 표시된다.
     * hearts 는 Home stat bar 에 그려져 있던 1,200 을 유지한다. */
    level: { hearts: 1200, level: 5, progress: 100 },
    activity: {
      /* Figma my_page 의 최근 항목 2건이 이 조합이다 */
      저장: [
        {
          id: 'recycle',
          category: '생활',
          icon: 'menu-recycle.svg',
          thumbnail: 'thumb-recycle.webp',
          title: '분리수거 헷갈리는 품목 정리',
          desc: '플라스틱·비닐·스티로폼 분류 기준',
          date: '2026.08.18',
        },
        {
          id: 'electricity',
          category: '돈 관리',
          icon: 'menu-wallet.svg',
          thumbnail: 'thumb-electricity.webp',
          title: '전기요금 납부 방법 & 자동이체 신청',
          desc: '놓치지 않게 미리 준비해요',
          date: '2026.08.14',
        },
      ],
      완료: [
        {
          id: 'rent',
          category: '돈 관리',
          icon: 'menu-receipt.svg',
          title: '9월 월세·관리비 납부',
          desc: '55만원 자동이체 완료',
          date: '2026.09.05',
        },
        {
          id: 'fridge',
          category: '생활',
          icon: 'menu-food.svg',
          title: '냉장고 유통기한 정리',
          desc: '임박 재료 3개 처리',
          date: '2026.09.01',
        },
      ],
      작성: [
        {
          id: 'delivery',
          category: '커뮤니티',
          icon: 'menu-tip.svg',
          title: '배달비 3만원 줄인 3주 기록',
          desc: '자취 꿀팁 · 댓글 12',
          date: '2026.08.24',
        },
      ],
      댓글: [
        {
          id: 'mold',
          category: '커뮤니티',
          icon: 'menu-broom.svg',
          title: '원룸 결로 막는 법 글에 남긴 댓글',
          desc: '창틀 습기부터 잡아보세요',
          date: '2026.08.21',
        },
      ],
    },
  },

  /* 조아영 · 반려동물과 함께 사는 자취러 */
  pet: {
    /* 요약 한 줄은 자취 경험·주거 형태만 보여준다 — 반려묘 콘텐츠는
     * personaWidgets / activity 쪽에 그대로 남아 있다 */
    experience: '1년 이상',
    housing: '빌라·투룸',
    experienceLabel: '자취 2년차',
    profileImage: 'profile_ayoung.webp',
    /* 자취 2년차 — 초보는 아니지만 최고 단계도 아닌 중간 성장 단계 */
    level: { hearts: 640, level: 3, progress: 41 },
    activity: {
      저장: [
        {
          id: 'vet',
          category: '생활',
          icon: 'menu-board.svg',
          title: '집 근처 24시 동물병원 정리',
          desc: '야간 진료 가능한 3곳',
          date: '2026.08.27',
        },
        {
          id: 'supply',
          category: '돈 관리',
          icon: 'menu-card.svg',
          title: '사료 정기배송 가격 비교',
          desc: '월 4.2만원까지 줄일 수 있어요',
          date: '2026.08.20',
        },
      ],
      완료: [
        {
          id: 'vaccine',
          category: '생활',
          icon: 'menu-calendar.svg',
          title: '예방접종 일정 등록',
          desc: '다음 접종 11월',
          date: '2026.09.03',
        },
      ],
      작성: [
        {
          id: 'cat-room',
          category: '커뮤니티',
          icon: 'menu-tip.svg',
          title: '원룸에서 고양이와 사는 법',
          desc: '자취 꿀팁 · 댓글 8',
          date: '2026.08.16',
        },
      ],
      댓글: [],
    },
  },
};

/** 탭별 빈 상태 문구 — 탭마다 의미가 달라서 문구도 다르게 쓴다 */
export const ACTIVITY_EMPTY: Record<ActivityTab, string> = {
  저장: '아직 저장한 콘텐츠가 없어요.',
  완료: '아직 완료한 활동이 없어요.',
  작성: '아직 작성한 글이 없어요.',
  댓글: '아직 남긴 댓글이 없어요.',
};
