import type { Persona } from '../auth/mockUsers';
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
 * 숫자 Level 과 5단계 성장 stage 는 서로 다른 값이다. 1:1 로 묶지 않는다.
 * Figma level_bar 예: 씨앗 + Level.12 / 새싹 + Level.24 / 자두꽃 + Level.42 …
 * 그래서 stage 는 level 로 계산하지 않고 persona 데이터가 직접 들고 있는다.
 *
 * Home(내 생활 stat bar) 은 숫자 Level 을, 마이페이지는 stage 아이콘·이름까지 쓴다.
 * 아이콘 경로는 LEVEL_STAGES 한 곳에서만 만들고 화면에서는 직접 쓰지 않는다. */

/** 5단계 성장 stage — 숫자 Level 과 무관한 별도 축 */
export type LevelStage = 'seed' | 'sprout' | 'blossom' | 'green-plum' | 'ripe-plum';

export interface LevelStageDef {
  /** 성장 순서 1~5 (숫자 Level 이 아니다) */
  step: number;
  name: string;
  /** public/assets/img/level_icon/ 아래 실제 파일명 */
  iconFile: string;
}

export const LEVEL_STAGES: Record<LevelStage, LevelStageDef> = {
  seed: { step: 1, name: '씨앗', iconFile: 'level01_seed.webp' },
  sprout: { step: 2, name: '새싹', iconFile: 'level02_sprout.webp' },
  blossom: { step: 3, name: '자두꽃', iconFile: 'level03_plum_blossom.webp' },
  'green-plum': { step: 4, name: '풋자두', iconFile: 'level04_green_plum.webp' },
  'ripe-plum': { step: 5, name: '잘 익은 자두', iconFile: 'level05_ripe_plum.webp' },
};

/** 화면에 저장하는 레벨 원본 값 */
export interface LevelSource {
  /** 하트 보유량 — Home stat bar 왼쪽 */
  hearts: number;
  /** 숫자 Level — stage 와 독립적이다 */
  level: number;
  /** 5단계 성장 stage — level 로 계산하지 않는다 */
  stage: LevelStage;
  /** 현재 stage 에서 쌓은 XP */
  currentXp: number;
  /** 다음 단계까지 남은 XP */
  remainingXp: number;
}

/** 화면이 그대로 쓰는 레벨 값 묶음 */
export interface ResolvedLevel {
  hearts: number;
  /** 숫자 Level */
  level: number;
  stage: LevelStage;
  /** 성장 단계 이름 (예: 씨앗) */
  stageName: string;
  /** 성장 단계 순서 1~5 */
  stageStep: number;
  /** 성장 단계 아이콘 경로 — img() 로 만든 절대 URL */
  levelIcon: string;
  currentXp: number;
  remainingXp: number;
  /** 다음 단계까지 진행도 0~100 */
  progress: number;
  /** Home stat bar 표기 — 폭 100px 고정이라 짧게 유지한다 */
  levelLabel: string;
  /** Home stat bar 표기 — 폭 73px 고정 */
  heartsLabel: string;
}

export function resolveLevel(source: LevelSource): ResolvedLevel {
  /* stage 는 source 가 준 값을 그대로 쓴다 — 숫자 level 에서 유도하지 않는다 */
  const stage = LEVEL_STAGES[source.stage];
  const total = source.currentXp + source.remainingXp;
  return {
    hearts: source.hearts,
    level: source.level,
    stage: source.stage,
    stageName: stage.name,
    stageStep: stage.step,
    levelIcon: img(`level_icon/${stage.iconFile}`),
    currentXp: source.currentXp,
    remainingXp: source.remainingXp,
    progress: total > 0 ? Math.round((source.currentXp / total) * 100) : 0,
    levelLabel: `Level.${source.level}`,
    heartsLabel: source.hearts.toLocaleString('ko-KR'),
  };
}

export interface PersonaProfile {
  /** 이름 아래 한 줄 — 자취 상태 · 주거 형태 */
  status: string;
  /** public/assets/img/ 아래 프로필 사진 파일명 */
  profileImage: string;
  level: LevelSource;
  activity: Record<ActivityTab, ActivityItem[]>;
}

export const PERSONA_PROFILE: Record<Persona, PersonaProfile> = {
  /* 이서준 · 자취 초보 — 아직 입주 전이라 활동 기록이 적다 */
  beginner: {
    status: '자취 준비 중 · 원룸 입주 예정',
    profileImage: 'profile_seojun.webp',
    /* 아직 입주 전이라 하트·레벨 모두 낮다 */
    level: { hearts: 120, level: 1, stage: 'seed', currentXp: 24, remainingXp: 76 },
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
    status: '자취 3년차 · 원룸 거주',
    profileImage: 'profile_harin.webp',
    /* Figma 자취 레벨 화면 값(Lv.2 / 씨앗 / 57% / 45XP)을 그대로 옮긴다.
     * Lv.2 + 씨앗 조합은 정상이다 — 숫자 Level 과 stage 는 별개 축이다.
     * 57% 와 45XP 를 모두 만족하도록 currentXp 60 (60/105 = 57%).
     * hearts 는 Home stat bar 에 그려져 있던 1,200 을 유지한다. */
    level: { hearts: 1200, level: 2, stage: 'seed', currentXp: 60, remainingXp: 45 },
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
    status: '자취 2년차 · 반려묘와 함께',
    profileImage: 'profile_ayoung.webp',
    level: { hearts: 640, level: 2, stage: 'sprout', currentXp: 41, remainingXp: 59 },
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
