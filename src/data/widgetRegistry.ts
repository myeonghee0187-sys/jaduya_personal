import type { WidgetCategory, WidgetSize } from '../types';

/* 위젯 레지스트리 — Figma "위젯 시스템" 페이지의 "메인위젯" 섹션(node 3554:22277)에 있는
 * 위젯 17개를 그대로 옮긴 것. 문구·구조 전부 Figma가 원본이다 — 임의로 만든 데모
 * 콘텐츠가 아니다. 각 위젯은 S/M/L 세 크기를 모두 지원하고 크기마다 실제 문구/구조가
 * 다르다(예: L은 진행률 막대 대신 체크 목록을 보여주는 식) — 위젯 개념 하나가 아니라
 * "이 위젯의 이 크기"를 정확히 재현하는 것이 목표다.
 *
 * PlacementSlot 은 widgetId 만 들고 있고, 실제로 무엇을 어떻게 그릴지는 여기서
 * size 별 콘텐츠로 정의한다 — 배치 로직(placement)은 이 파일과 무관하다. */

/** 라벨 + 값 한 줄 — 목록형 위젯의 한 행. emphasis 는 브랜드 레드로 강조할 쪽. */
export interface WidgetRow {
  label: string;
  value: string;
  emphasis?: 'label' | 'value';
}

/** 체크 상태 한 줄 — "완료"/"진행 중"/"확인 필요" 같은 상태 라벨을 오른쪽에 붙인다 */
export interface WidgetStatusRow {
  label: string;
  status: string;
  /** done=완료(브랜드 레드 체크 + 그린 라벨), neutral=아직(빈 동그라미 + 회색 라벨) */
  tone: 'done' | 'neutral';
}

/** 순위 목록 한 줄 — 실시간 인기 Large 전용 */
export interface WidgetRankItem {
  rank: number;
  text: string;
  meta: string;
}

/** 범례가 있는 구간별 비율 막대 한 조각 — 소비 분석 Large 전용 */
export interface WidgetLegendSegment {
  percent: number;
  label: string;
  color: 'red' | 'orange' | 'green' | 'yellow';
}

/** 요일별 막대그래프 한 칸 — 나의 활동 Large 전용. height 는 0-100(그래프 안에서의 상대 높이) */
export interface WidgetWeekBar {
  day: string;
  height: number;
}

export interface WidgetSizeContent {
  /** PRIMARY — 가장 강조되는 값 */
  value?: string;
  /** SECONDARY — 보조 설명 한 줄 */
  description?: string;
  /** value 앞에 붙는 초록 체크 — 보증금 안전 전용 */
  checkIcon?: boolean;
  /** 우측 상단 필(pill) 배지 — 혜택 위젯 Large 전용 */
  chip?: string;
  /** 0-100, 있으면 제목 아래 가로 막대로 그린다(공통 Progress Bar) */
  progress?: number;
  /** 막대 채움 색 — 기본은 브랜드 레드, 예산처럼 초록을 쓰는 경우만 지정 */
  progressTone?: 'red' | 'green';
  rows?: WidgetRow[];
  statusRows?: WidgetStatusRow[];
  rankList?: WidgetRankItem[];
  segments?: WidgetLegendSegment[];
  weekBars?: WidgetWeekBar[];
  /** 맨 끝에 붙는 옅은 한 줄, 예: "+1개 더보기" */
  more?: string;
}

export interface WidgetDef {
  /** 안정적인 concept id — PlacementSlot 이 들고 있는 값 */
  id: string;
  category: WidgetCategory;
  name: string;
  /** 크기별로 제목이 다른 경우만 지정(대부분 공통) — 없으면 name 을 그대로 쓴다 */
  nameOverride?: Partial<Record<WidgetSize, string>>;
  /** 위젯 목록 카드의 아이콘 — assets/icon/ 아래 파일명. 배경 색은 카테고리로 정해진다 */
  icon: string;
  /** 위젯 추가 화면 목록에서 보여줄 한 줄 소개 — Figma 위젯 자체가 아니라 이 화면 전용 문구 */
  description: string;
  availableSizes: WidgetSize[];
  content: Record<WidgetSize, WidgetSizeContent>;
}

/** 카테고리별 아이콘 배경 톤 — WidgetIconBadge 가 쓰는 CSS 클래스 접미사 */
export const CATEGORY_TONE: Record<WidgetCategory, string> = {
  생활: 'green',
  '돈 관리': 'orange',
  혜택: 'red',
  커뮤니티: 'rose',
  마이: 'yellow',
};

/** def.name 대신 실제로 이 크기에서 써야 하는 제목 */
export function widgetTitleFor(def: WidgetDef, size: WidgetSize): string {
  return def.nameOverride?.[size] ?? def.name;
}

export const WIDGET_REGISTRY: WidgetDef[] = [
  /* ---------- 생활 ---------- */
  {
    id: 'life-check',
    icon: 'life-check-on.svg',
    category: '생활',
    name: '자취 체크',
    description: '이번 주 생활 체크리스트를 확인해보세요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '2개 남았어요' },
      medium: { value: '2개 남았어요', description: '계약부터 입주까지' },
      large: {
        statusRows: [
          { label: '계약 전 확인', status: '완료', tone: 'done' },
          { label: '집 상태 확인', status: '완료', tone: 'done' },
          { label: '입주 준비 2개 남음', status: '이번 주', tone: 'neutral' },
        ],
      },
    },
  },
  {
    id: 'house-check',
    icon: 'life-house-search.svg',
    category: '생활',
    name: '집 살펴보기',
    description: '좋은 집인지 체크리스트로 확인해보세요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '체크 4개 남음' },
      medium: { value: '체크 4개 남음', description: '좋은 집인지 확인해보세요' },
      large: {
        statusRows: [
          { label: '채광 확인', status: '완료', tone: 'done' },
          { label: '수압 확인', status: '완료', tone: 'done' },
          { label: '소음 2개 확인', status: '확인 필요', tone: 'neutral' },
        ],
      },
    },
  },
  {
    id: 'next-cleaning',
    icon: 'menu-broom.svg',
    category: '생활',
    name: '다음 청소',
    nameOverride: { large: '이번 주 청소' },
    description: '다음 청소 일정을 놓치지 마세요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '오늘 20:00' },
      medium: { value: '오늘 20:00', description: '분리수거 배출' },
      large: {
        rows: [
          { label: '오늘', value: '분리수거 배출', emphasis: 'label' },
          { label: '내일', value: '화장실 청소' },
          { label: '목', value: '침구 세탁' },
        ],
      },
    },
  },
  {
    id: 'fridge',
    icon: 'menu-food.svg',
    category: '생활',
    name: '냉장고',
    nameOverride: { large: '유통기한 임박 3개' },
    description: '유통기한 임박한 식재료를 확인해보세요.',
    availableSizes: ['small', 'medium', 'large'],
    /* chip은 "혜택" Large 전용 우측 상단 배지 스타일이라(widget-gallery.css 참고)
     * S 카드에 쓰면 제목 줄 위로 겹쳐 보인다 — 우유 옆에 나란히 보이게 value 한
     * 줄로 합친다(M/L의 "우유 D-2" 행과 같은 표현). */
    content: {
      small: { value: '우유 · D-2' },
      medium: {
        rows: [
          { label: '우유', value: 'D-2', emphasis: 'value' },
          { label: '계란', value: 'D-4', emphasis: 'value' },
        ],
      },
      large: {
        rows: [
          { label: '우유', value: 'D-2', emphasis: 'value' },
          { label: '계란', value: 'D-4', emphasis: 'value' },
          { label: '두부', value: 'D-5', emphasis: 'value' },
        ],
      },
    },
  },
  {
    id: 'todo-today',
    icon: 'menu-checklist.svg',
    category: '생활',
    name: '오늘 할 일',
    nameOverride: { large: '이번 주 할 일 3개' },
    description: '오늘 해야 할 일을 확인해보세요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '2개' },
      medium: { value: '2개 남음', rows: [{ label: '분리수거 배출', value: '오늘 20:00' }] },
      large: {
        rows: [
          { label: '분리수거 배출', value: '오늘 20:00' },
          { label: '장보기', value: '오늘' },
        ],
        more: '+1개 더보기',
      },
    },
  },
  {
    id: 'home-checklist',
    icon: 'life-check-on.svg',
    category: '생활',
    name: '생활 체크',
    nameOverride: { large: '이번 주 생활 체크' },
    description: '이번 주 생활 루틴을 체크해보세요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '3/5' },
      medium: { value: '3/5 완료', progress: 60 },
      /* L 카드는 342×114 고정이라 header(22px)+padding(--card-padding-l 20px×2)을 빼면
       * 상태 목록에 쓸 수 있는 세로 공간이 52px 정도뿐이다 — value+progress+5줄을 전부
       * 넣으면 항상 넘친다(header만 빼도 5줄이 이미 78px). 자취 체크/집 살펴보기와 같은
       * 모양(값·진행바 없이 목록 3줄만)으로 맞춰서 실제로 카드 안에 들어오게 한다. */
      large: {
        statusRows: [
          { label: '환기', status: '완료', tone: 'done' },
          { label: '청소', status: '완료', tone: 'done' },
          { label: '분리수거', status: '', tone: 'neutral' },
        ],
      },
    },
  },
  {
    id: 'deposit-safety',
    icon: 'sheet-check-circle.svg',
    category: '생활',
    name: '보증금 안전',
    description: '등기부 변동을 확인해서 보증금을 지켜요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '안전해요', checkIcon: true },
      medium: { value: '안전해요', checkIcon: true, description: '등기부 변동 없음' },
      large: {
        value: '안전해요',
        checkIcon: true,
        description: '등기부 변동 없음 · 최근 확인 9월 12일',
      },
    },
  },

  /* ---------- 돈 관리 ---------- */
  {
    id: 'living-cost',
    icon: 'menu-wallet.svg',
    category: '돈 관리',
    name: '생활비',
    nameOverride: { medium: '이번 달 생활비', large: '이번 달 생활비' },
    description: '이번 달 쓸 수 있는 돈을 한눈에 확인해요.',
    availableSizes: ['small', 'medium', 'large'],
    /* M/L 모두 값+진행바+설명 세 줄을 다 넣으면 114px 카드 예산을 넘긴다(M 9px, L 15px
     * 실측) — 진행바가 이미 "얼마나 썼는지"를 보여주므로 설명 줄은 뺀다. */
    content: {
      small: { value: '84.2만원' },
      medium: { value: '84.2만원', progress: 84 },
      large: { value: '84.2만원 사용', progress: 84 },
    },
  },
  {
    id: 'budget',
    icon: 'money-balance.svg',
    category: '돈 관리',
    name: '예산',
    nameOverride: { medium: '이번 달 예산', large: '이번 달 예산' },
    description: '이번 달 예산과 남은 돈을 확인해요.',
    availableSizes: ['small', 'medium', 'large'],
    /* living-cost 와 같은 이유로 M/L 모두 설명 줄을 뺀다 — 진행바 + 값만으로 충분하다 */
    content: {
      small: { value: '15.8만원' },
      medium: { value: '100만원', progress: 84, progressTone: 'green' },
      large: { value: '100만원', progress: 84 },
    },
  },
  {
    id: 'spend-analysis',
    icon: 'money-spend.svg',
    category: '돈 관리',
    name: '소비 분석',
    nameOverride: { large: '이번 달 지출 비율' },
    description: '카테고리별 소비 비율을 확인해요.',
    availableSizes: ['small', 'medium', 'large'],
    /* M도 값+진행바+설명 세 줄이면 9px 넘친다(living-cost와 동일한 이유) — 설명은 뺀다 */
    content: {
      small: { value: '식비 42%' },
      medium: { value: '152.6만원', progress: 42 },
      large: {
        segments: [
          { percent: 42, label: '식비 42%', color: 'red' },
          { percent: 28, label: '생활 28%', color: 'orange' },
          { percent: 18, label: '교통 18%', color: 'green' },
          { percent: 12, label: '기타 12%', color: 'yellow' },
        ],
      },
    },
  },
  {
    id: 'fixed-expense',
    icon: 'money-fixed.svg',
    category: '돈 관리',
    name: '고정지출',
    nameOverride: { large: '이번 달 고정지출' },
    description: '매달 나가는 고정 지출을 확인해요.',
    availableSizes: ['small', 'medium', 'large'],
    /* L은 값(89.4만원) + 항목 2줄을 다 넣으면 7px 넘친다 — 항목 자체가 합계를 구성하는
     * 내역이라 값 줄은 중복이다(항목만 보여준다) */
    content: {
      small: { value: '89.4만원' },
      medium: { value: '89.4만원', description: '이번 달 납부 예정' },
      large: {
        rows: [
          { label: '월세', value: '50.0만원' },
          { label: '관리비 · 통신비', value: '24.8만원' },
        ],
      },
    },
  },

  /* ---------- 혜택 ---------- */
  {
    id: 'today-benefit',
    icon: 'menu-gift.svg',
    category: '혜택',
    name: '오늘의 혜택',
    description: '오늘 받을 수 있는 혜택을 확인해요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '최대 30% 할인' },
      medium: { value: '배달 30% 할인', description: '오늘까지' },
      large: { value: '배달 30% 할인', description: '오늘까지', chip: '인기 혜택' },
    },
  },
  {
    id: 'deadline-benefit',
    icon: 'info-warn.svg',
    category: '혜택',
    name: '마감 혜택',
    description: '마감 임박한 혜택을 놓치지 마세요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '오늘 1개' },
      medium: { value: '오늘 종료 1개', description: '지금 확인해보세요' },
      large: { value: '오늘 종료 1개', description: '놓치면 다시 못 받아요', chip: '확인하기' },
    },
  },

  /* ---------- 커뮤니티 ---------- */
  {
    id: 'realtime-popular',
    icon: 'community-like.svg',
    category: '커뮤니티',
    name: '실시간 인기',
    description: '지금 인기 있는 글을 확인해보세요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '다이소 꿀팁' },
      medium: { value: '다이소 방꾸미기로 책상 정리 끝냈어요', description: '댓글 36 · 좋아요 211' },
      large: {
        rankList: [
          { rank: 1, text: '다이소 방꾸미기로 책상 정리 끝냈어요', meta: '댓글 36' },
          { rank: 2, text: '자취방 좁아도 예쁘게 꾸미는 법', meta: '댓글 24' },
          { rank: 3, text: '이사 짐쌀 때 꼭 챙길 것들', meta: '댓글 19' },
        ],
      },
    },
  },
  {
    id: 'new-news',
    icon: 'community-book.svg',
    category: '커뮤니티',
    name: '새 소식',
    description: '내 글과 저장한 글의 새 소식을 확인해요.',
    availableSizes: ['small', 'medium', 'large'],
    content: {
      small: { value: '댓글 3개' },
      medium: { value: '내 글에 댓글이 달렸어요', description: '댓글 3개' },
      large: {
        rows: [
          { label: '내 글에 댓글이 달렸어요', value: '댓글 3개' },
          { label: '저장한 글에 새 댓글이 달렸어요', value: '댓글 2개' },
        ],
      },
    },
  },

  /* ---------- 마이 ---------- */
  {
    id: 'my-mission',
    icon: 'menu-checklist.svg',
    category: '마이',
    name: '자취 미션',
    description: '진행 중인 자취 미션을 확인해보세요.',
    availableSizes: ['small', 'medium', 'large'],
    /* M도 값+진행바+설명이면 9px 넘친다(living-cost와 동일) — 설명은 뺀다 */
    content: {
      small: { value: '2개 진행 중' },
      medium: { value: '2개 진행 중', progress: 60 },
      large: {
        progress: 60,
        statusRows: [
          { label: '공과금 관리', status: '완료', tone: 'done' },
          { label: '냉장고 정리', status: '진행 중', tone: 'neutral' },
        ],
      },
    },
  },
  {
    id: 'my-activity',
    icon: 'community-comment.svg',
    category: '마이',
    name: '나의 활동',
    description: '이번 달 저장·작성·댓글 활동을 확인해요.',
    availableSizes: ['small', 'medium', 'large'],
    /* L은 항목 3줄(rows) + 요일별 막대그래프(weekBars)를 같이 넣으면 61px나 넘친다.
     * 값 한 줄(M과 같은 요약)을 같이 넣어도 header+value만으로 이미 57px라 그래프에
     * 남는 공간이 없다 — L은 그래프에 집중하고 값 줄은 뺀다(막대 높이도 조정, 아래
     * .wcard__weekchart-bars 참고). */
    content: {
      small: { value: '저장 6 · 작성 2' },
      medium: { value: '저장 6 · 작성 2 · 댓글 3' },
      large: {
        weekBars: [
          { day: '월', height: 33 },
          { day: '화', height: 44 },
          { day: '수', height: 67 },
          { day: '목', height: 56 },
          { day: '금', height: 89 },
          { day: '토', height: 78 },
          { day: '일', height: 100 },
        ],
      },
    },
  },
];

export const WIDGET_CATEGORY_ORDER: WidgetCategory[] = ['돈 관리', '생활', '혜택', '커뮤니티', '마이'];

export function getWidgetDef(widgetId: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === widgetId);
}
