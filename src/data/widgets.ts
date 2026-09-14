import type { WidgetCategory, WidgetSize } from '../types';
import { MAX_WIDGET, WIDGET_CATALOG, widgetWeight } from './widgetCatalog';
import type { ServiceKind } from '../components/widget/ServiceChips';

export { MAX_WIDGET, widgetWeight };

/* 위젯 갤러리 — 기존 widgetCatalog.ts(Home 고정 슬롯이 참조하는 원본)는 건드리지 않고
 * 완전히 별도의 데이터 모델을 둔다. 하나의 위젯 "개념"(type)이 S/M/L 세 가지 콘텐츠를
 * 모두 갖고 있고, 추가할 때 크기를 고른다 — 기존처럼 크기별로 별도 id를 두지 않는다.
 *
 * 이 파일의 모든 콘텐츠는 Figma "위젯 시스템" 페이지(19개 위젯 컴포넌트)를 그대로 옮긴 것 —
 * 문구 하나, 구조 하나까지 그 쪽이 원본이다. */

/** 라벨 + 값 한 줄 — 냉장고/오늘 할 일/다음 청소/소비 분석/나의 활동/인기글의 목록 행 */
export interface WidgetRow {
  label: string;
  value: string;
  /** 이 줄에서 강조(브랜드 레드) 되는 쪽 — 위젯마다 강조 대상이 다르다 */
  emphasis?: 'label' | 'value';
}

export interface WidgetChecklistItem {
  label: string;
  done: boolean;
}

/** 라벨 위 / 값 아래, 가로로 나열되는 통계 칸 — 이번 달 생활비 Large 전용 */
export interface WidgetStat {
  label: string;
  value: string;
}

export interface WidgetSizeContent {
  /** PRIMARY — 가장 강조되는 값. rows만으로 구성되는 카드(예: 소비 분석 M)는 생략한다 */
  value?: string;
  /** SECONDARY — 보조 설명 (M/L) */
  description?: string;
  /** 가장 작은 메타 텍스트 (L, 가끔 M) */
  caption?: string;
  /** 헤더 우측의 작은 배지 텍스트, 예: "D-2". progress 가 있으면 링이 이 자리를 대신 쓴다 */
  meta?: string;
  /** value 아래 붙는 강조 텍스트(브랜드 레드) — 이번 달 생활비 Small의 "84%" 전용 */
  highlight?: string;
  /** 맨 끝의 브랜드 레드 CTA 한 줄, 예: "더보기 →" */
  link?: string;
  /** 0-100 — 헤더 우측 공통 Progress Ring에 쓴다(모든 위젯 동일한 링 하나로 통일) */
  progress?: number;
  /** 연결된 서비스 배지(공통 Service Chip 슬롯) — 고정지출처럼 구독 목록이 있는 위젯만 */
  services?: ServiceKind[];
  servicesMore?: number;
  /** 라벨+값 목록 행 */
  rows?: WidgetRow[];
  /** 값 없이 한 줄씩만 나열하는 불릿 목록 */
  bullets?: string[];
  /** 체크 표시 목록 — 생활 체크 Large 전용 */
  checklist?: WidgetChecklistItem[];
  /** 가로 통계 칸 — 이번 달 생활비 Large 전용 */
  stats?: WidgetStat[];
  /** 구간별 비율 막대 — 소비 분석 Large 전용 (합이 100이 되는 순서대로) */
  segments?: number[];
}

export interface WidgetTypeDef {
  /** 안정적인 concept id. 기존 카탈로그의 크기별 id(fridge/fridge-s 등)를 통합한 값 */
  type: string;
  category: WidgetCategory;
  icon: string;
  /** 기본 제목(대부분 크기 공통) */
  title: string;
  /** 일부 위젯은 Figma에서 크기별로 제목이 다르다 — 있을 때만 title을 덮어쓴다 */
  titleOverride?: Partial<Record<WidgetSize, string>>;
  content: Record<WidgetSize, WidgetSizeContent>;
}

export const WIDGET_TYPES: WidgetTypeDef[] = [
  /* ---------- 생활 ---------- */
  {
    type: 'fridge',
    category: '생활',
    icon: 'menu-food.svg',
    title: '냉장고',
    content: {
      small: { rows: [{ label: '우유', value: 'D-2', emphasis: 'value' }] },
      medium: {
        rows: [
          { label: '우유', value: 'D-2', emphasis: 'value' },
          { label: '계란', value: 'D-4', emphasis: 'value' },
          { label: '두부', value: 'D-5', emphasis: 'value' },
        ],
      },
      large: {
        rows: [
          { label: '우유', value: 'D-2', emphasis: 'value' },
          { label: '계란', value: 'D-4', emphasis: 'value' },
          { label: '두부', value: 'D-5', emphasis: 'value' },
        ],
        caption: '유통기한 임박 3개',
      },
    },
  },
  {
    type: 'clean',
    category: '생활',
    icon: 'menu-broom.svg',
    title: '다음 청소',
    titleOverride: { large: '이번 주 청소' },
    content: {
      small: { value: '오늘 20:00' },
      medium: { value: '오늘 20:00', description: '분리수거 배출' },
      large: {
        rows: [
          { label: '오늘 20:00', value: '분리수거', emphasis: 'label' },
          { label: '내일', value: '화장실 청소', emphasis: 'label' },
          { label: '목요일', value: '침구 세탁', emphasis: 'label' },
        ],
      },
    },
  },
  {
    type: 'todo',
    category: '생활',
    icon: 'menu-checklist.svg',
    title: '오늘 할 일',
    titleOverride: { large: '이번 주 할 일' },
    content: {
      small: { value: '2개' },
      medium: {
        value: '2개 남음',
        rows: [
          { label: '분리수거 배출', value: '20:00', emphasis: 'label' },
          { label: '장보기', value: '오늘', emphasis: 'label' },
        ],
      },
      large: {
        value: '3개 남았어요',
        rows: [
          { label: '분리수거', value: '오늘 20:00', emphasis: 'label' },
          { label: '장보기', value: '오늘', emphasis: 'label' },
          { label: '화장실 청소', value: '내일', emphasis: 'label' },
        ],
      },
    },
  },
  {
    type: 'life-check',
    category: '생활',
    icon: 'life-check-on.svg',
    title: '생활 체크',
    titleOverride: { medium: '이번 주 생활 체크', large: '이번 주 생활 체크' },
    content: {
      small: { value: '3/5', description: '완료' },
      medium: { value: '3/5 완료', progress: 60 },
      large: {
        value: '3/5 완료',
        progress: 60,
        checklist: [
          { label: '환기', done: true },
          { label: '청소', done: true },
          { label: '빨래', done: true },
          { label: '분리수거', done: false },
          { label: '침구 세탁', done: false },
        ],
      },
    },
  },

  /* ---------- 돈 관리 ---------- */
  {
    type: 'living-cost',
    category: '돈 관리',
    icon: 'menu-wallet.svg',
    title: '이번 달 생활비',
    titleOverride: { small: '생활비' },
    content: {
      small: { value: '84.2만원', highlight: '84%' },
      medium: { value: '84.2만원', description: '예산 100만원 · 15.8만원 남음', progress: 84 },
      large: {
        value: '84.2만원 사용',
        progress: 84,
        stats: [
          { label: '예산', value: '100만원' },
          { label: '사용', value: '84.2만원' },
          { label: '남은 돈', value: '15.8만원' },
        ],
      },
    },
  },
  {
    type: 'budget',
    category: '돈 관리',
    icon: 'money-balance.svg',
    title: '예산',
    titleOverride: { medium: '이번 달 예산', large: '이번 달 예산' },
    content: {
      small: { value: '15.8만원', description: '남았어요' },
      medium: { value: '100만원', description: '15.8만원 남음', progress: 84 },
      large: { value: '100만원', description: '84.2만원 사용 · 15.8만원 남음', progress: 84 },
    },
  },
  {
    type: 'fixed-cost',
    category: '돈 관리',
    icon: 'money-fixed.svg',
    title: '고정지출',
    titleOverride: { large: '이번 달 고정지출' },
    content: {
      small: { value: '89.4만원' },
      medium: {
        value: '89.4만원',
        description: '이번 달 납부 예정',
        services: ['netflix', 'youtube', 'disney'],
        servicesMore: 2,
      },
      large: {
        value: '89.4만원',
        services: ['netflix', 'youtube', 'disney'],
        servicesMore: 2,
      },
    },
  },
  {
    type: 'spend-analysis',
    category: '돈 관리',
    icon: 'money-spend.svg',
    title: '소비 분석',
    content: {
      small: { value: '식비 42%' },
      medium: {
        rows: [
          { label: '식비', value: '42%', emphasis: 'value' },
          { label: '생활', value: '28%', emphasis: 'value' },
          { label: '교통', value: '18%', emphasis: 'value' },
          { label: '기타', value: '12%', emphasis: 'value' },
        ],
      },
      large: {
        value: '식비 42% · 생활 28% · 교통 18% · 기타 12%',
        segments: [42, 28, 18, 12],
        caption: '지난달 대비 +8%',
      },
    },
  },
  {
    type: 'deposit',
    category: '돈 관리',
    icon: 'sheet-check-circle.svg',
    title: '보증금 안전',
    content: {
      small: { value: '안전해요' },
      medium: { value: '안전해요', description: '등기부 변동 없음' },
      large: { value: '안전해요', description: '등기부 변동 없음 · 최근 확인 9월 12일', link: '확인하기 →' },
    },
  },

  /* ---------- 혜택 ---------- */
  {
    type: 'benefit',
    category: '혜택',
    icon: 'menu-gift.svg',
    title: '받을 수 있는 혜택',
    content: {
      small: { value: '4개' },
      medium: { value: '4개', description: '나에게 맞는 혜택' },
      large: { value: '4개', bullets: ['청년 월세 지원', '생활비 지원', '지역 혜택'], link: '더보기 →' },
    },
  },
  {
    type: 'benefit-urgent',
    category: '혜택',
    icon: 'info-warn.svg',
    title: '마감 임박 혜택',
    content: {
      small: { value: '오늘 1개' },
      medium: { value: '오늘까지', description: '청년 지원금 신청' },
      large: { value: '오늘까지 1개 · 3일 이내 2개', description: '청년 지원금 신청 오늘 마감', link: '더보기 →' },
    },
  },
  {
    type: 'benefit-match',
    category: '혜택',
    icon: 'money-benefit-sparkle.svg',
    title: '나에게 맞는 혜택',
    titleOverride: { small: '맞춤 혜택' },
    content: {
      small: { value: '3개' },
      medium: { value: '3개', description: '지금 받을 수 있어요' },
      large: { value: '3개', bullets: ['월세 지원', '교통비 지원', '생활비 지원'] },
    },
  },
  {
    type: 'benefit-pick',
    category: '혜택',
    icon: 'menu-tip.svg',
    title: '자두 추천',
    content: {
      small: { value: '절약 팁' },
      medium: { value: '이번 주 절약 팁', description: '"배달 대신 장보기"' },
      large: {
        value: '이번 주 절약 팁',
        description: '배달 2회 줄이면 약 2만원을 아낄 수 있어요.',
        link: '자세히 보기 →',
      },
    },
  },

  /* ---------- 커뮤니티 ---------- */
  {
    type: 'neighborhood',
    category: '커뮤니티',
    icon: 'community-book.svg',
    title: '동네 소식',
    content: {
      small: { value: '3개' },
      medium: { value: '새 소식 3개', caption: '성수동' },
      large: {
        value: '새 소식 3개',
        bullets: ['"이번 주 플리마켓 열려요"', '"근처 생활용품 할인"'],
        caption: '성수동',
      },
    },
  },
  {
    type: 'popular-post',
    category: '커뮤니티',
    icon: 'community-like.svg',
    title: '오늘의 인기글',
    titleOverride: { small: '인기글' },
    content: {
      small: { value: '오늘 12개' },
      medium: { value: '조회수 높은 글 12개' },
      large: {
        rows: [
          { label: '1  자취방 냄새 어떻게 잡나요?', value: '댓글 24' },
          { label: '2  전기요금 얼마나 나오세요?', value: '댓글 18' },
          { label: '3  혼자 살면서 꼭 필요한 것', value: '댓글 15' },
        ],
      },
    },
  },
  {
    type: 'my-activity',
    category: '커뮤니티',
    icon: 'community-comment.svg',
    title: '나의 활동',
    content: {
      small: { value: '댓글 5개' },
      medium: {
        rows: [
          { label: '게시글', value: '2' },
          { label: '댓글', value: '5' },
          { label: '저장', value: '8' },
        ],
      },
      large: { value: '게시글 2   댓글 5   저장 8', description: '최근 활동 · "이 글에 댓글을 남겼어요."' },
    },
  },

  /* ---------- 마이 ---------- */
  {
    type: 'my-level',
    category: '마이',
    icon: 'money-trend-flat.svg',
    title: '자두 레벨',
    content: {
      small: { value: 'Lv.4' },
      medium: { value: 'Lv.4', description: '다음 레벨까지 120 XP', progress: 76 },
      large: { value: 'Lv.4  380 XP', description: '다음 레벨까지 120 XP', progress: 76 },
    },
  },
  {
    type: 'saved-content',
    category: '마이',
    icon: 'menu-bookmark.svg',
    title: '저장한 콘텐츠',
    content: {
      small: { value: '12개' },
      medium: { value: '12개', description: '자취 꿀팁 모음' },
      large: { value: '12개', bullets: ['자취 꿀팁', '생활비 절약', '집 관리'] },
    },
  },
  {
    type: 'my-profile',
    category: '마이',
    icon: 'menu-board.svg',
    title: '내 프로필',
    content: {
      small: { value: '서준' },
      medium: { value: '서준', description: '자취 생활 1년차' },
      large: { value: '서준', description: '자취 생활 1년차 · 관심사 4개', link: '프로필 보기 →' },
    },
  },
];

export function getWidgetType(type: string): WidgetTypeDef | undefined {
  return WIDGET_TYPES.find((w) => w.type === type);
}

/** def.title 대신 실제로 이 크기에서 써야 하는 제목 — titleOverride가 있으면 그쪽을 쓴다 */
export function widgetTitleFor(def: WidgetTypeDef, size: WidgetSize): string {
  return def.titleOverride?.[size] ?? def.title;
}

export const WIDGET_CATEGORY_ORDER: WidgetCategory[] = ['생활', '돈 관리', '혜택', '커뮤니티', '마이'];

/** 기존 widgetCatalog.ts 의 catalog id → 이 파일의 type id.
 * Home 쪽 id 체계(크기별로 나뉜 id)는 그대로 두고, Gallery에서 "내 홈 위젯"을
 * 같은 Widget 컴포넌트로 보여줄 때만 이 다리를 쓴다. */
const LEGACY_TO_TYPE: Record<string, string> = {
  'fridge-s': 'fridge',
  'todo-s': 'todo',
  'todo-m': 'todo',
  'clean-s': 'clean',
  'clean-m': 'clean',
  'budget-s': 'budget',
};

export function toGalleryType(legacyId: string): string {
  return LEGACY_TO_TYPE[legacyId] ?? legacyId;
}

/** type → 그 type이 Home 캔버스에 실제로 놓일 수 있는 크기별 레거시 catalog id.
 * widgetCatalog.ts 를 한 번 훑어서 자동으로 만든다(직접 손으로 이중 관리하지 않는다) —
 * 예: 'fridge' → { medium: 'fridge', small: 'fridge-s' }, 대부분의 위젯은 크기 하나뿐이다. */
const TYPE_TO_LEGACY_IDS: Record<string, Partial<Record<WidgetSize, string>>> = {};
WIDGET_CATALOG.forEach((def) => {
  const type = toGalleryType(def.id);
  const bucket = TYPE_TO_LEGACY_IDS[type] ?? (TYPE_TO_LEGACY_IDS[type] = {});
  bucket[def.size] = def.id;
});

/** 이 type을 실제로 홈에 추가할 수 있는 크기 목록(카탈로그에 등록된 크기만) */
export function availableHomeSizes(type: string): WidgetSize[] {
  const bucket = TYPE_TO_LEGACY_IDS[type];
  if (!bucket) return [];
  return (['small', 'medium', 'large'] as const).filter((size) => bucket[size]);
}

/** (type, size) → 실제로 myWidgets 배열에 넣을 레거시 catalog id. 지원하지 않는 조합이면 undefined */
export function legacyIdFor(type: string, size: WidgetSize): string | undefined {
  return TYPE_TO_LEGACY_IDS[type]?.[size];
}

/** 이 type이 Home에 이미 어떤 크기로 추가돼 있는지(있으면 그 크기, 없으면 undefined) */
export function homeSizeOf(type: string, widgets: string[]): WidgetSize | undefined {
  const bucket = TYPE_TO_LEGACY_IDS[type];
  if (!bucket) return undefined;
  return (['small', 'medium', 'large'] as const).find((size) => {
    const id = bucket[size];
    return id !== undefined && widgets.includes(id);
  });
}
