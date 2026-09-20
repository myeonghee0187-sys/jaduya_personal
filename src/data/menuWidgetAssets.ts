/* 메뉴 관리에 보여줄 2×2 위젯 에셋 — Figma 위젯 섹션(4056:20332)의 카드 배리언트 기준.
 *
 * 섹션에는 2×2 카드 15장이 있고, 그중 실제 위젯 에셋으로 쓰는 것은 10개다.
 * 제외한 5장 (Figma node id):
 *   3994:17818 첫 자취 "step.02"  — 사용하지 않는 첫 자취 배리언트
 *   4018:19023 입주 전 체크      — 사용하지 않는 카드
 *   4056:20177 계좌 "연결하기"   — 계좌 미연결 상태용 (상태 배리언트)
 *   4056:20248 첫 자취 "완료"    — 완료 상태용 (상태 배리언트)
 *   4056:19991 대출현황 (빈 아이콘) — 4056:20030 과 같은 자리에 겹쳐 있는 초안 (중복)
 *
 * 1×1 은 여기 없다 — 홈 '내 메뉴'의 기존 1×1 위젯(.menu-widget)을 그대로 쓴다.
 * 그래서 메뉴 하나가 고를 수 있는 preview = 1×1 하나 + 그 메뉴의 2×2 에셋들이다. */

export type MenuSizeKey = '1x1' | '2x2';

/** 카드 상단 왼쪽 그림의 한 겹 — public/assets/icon/ 아래 Figma 원본 에셋 */
export interface CardLayer {
  file: string;
  /** CSS inset (Figma 가 링 stroke 여백으로 잡은 값) */
  inset?: string;
  /** 그림 영역 안 절대 위치 [x, y, size] */
  box?: readonly [number, number, number];
  /** box 안에서 이미지를 138.71% 로 키워 잘라낸다 (새싹 png) */
  crop?: boolean;
}

export type CardVisual =
  | { kind: 'art'; size: 48 | 54; layers: readonly CardLayer[] }
  /** 체크리스트 도트 4줄 */
  | { kind: 'checklist' };

export interface CardContent {
  visual: CardVisual;
  category: string;
  action?: string;
  caption: string;
  /** caption 옆에 붙는 보조 수치 (계좌 "+ 32만원") */
  captionExtra?: string;
  /** value 앞에 붙는 작은 글자 (레벨 "LV.2") */
  lead?: string;
  value: string;
  /** value 뒤에 붙는 작은 글자 ("50" + "%") */
  suffix?: string;
  valueSize: 18 | 32 | 36;
}

export interface MenuWidgetAsset {
  id: string;
  /** menuCatalog.ts 메뉴 id */
  menuId: string;
  figmaNodeId: string;
  /** 같은 메뉴에 2×2 가 여러 개일 때 구분하는 이름 */
  variant?: string;
  /** 이 에셋이 제공하는 크기 — Figma 카드는 전부 2×2 */
  sizes: readonly MenuSizeKey[];
  /** false면 구현과 Figma 자료는 유지하되 메뉴 관리 후보에서만 제외한다. 기본값은 true. */
  showInMenuManage?: boolean;
  content: CardContent;
}

const TWO = ['2x2'] as const;
const RING = '-4.63%';

const ring = (file: string): CardLayer => ({ file, inset: RING });
const ringArc = (file: string): CardLayer => ({ file, inset: `${RING} ${RING} ${RING} 45.37%` });

export const MENU_WIDGET_ASSETS: readonly MenuWidgetAsset[] = [
  {
    id: 'first-home-checklist', menuId: 'first-home', figmaNodeId: '4040:19238', sizes: TWO,
    content: {
      visual: { kind: 'checklist' },
      category: '첫 자취', action: '다음 할 일', caption: '2 / 4 단계', value: '전입신고', valueSize: 32,
    },
  },
  {
    id: 'home-care', menuId: 'home-care', figmaNodeId: '4056:20112', sizes: TWO,
    content: {
      visual: { kind: 'art', size: 54, layers: [ring('wc-homecare-ring.svg')] },
      category: '홈케어', action: '상세 보기', caption: '2 / 4', value: '5분 환기', valueSize: 32,
    },
  },
  {
    id: 'account', menuId: 'account', figmaNodeId: '4056:19909', sizes: TWO,
    content: {
      visual: { kind: 'art', size: 48, layers: [{ file: 'wc-account-wallet.svg', inset: '8.33% 4.17% 6.25% 8.33%' }] },
      category: '계좌', action: '잔액 보기', caption: '이번달', captionExtra: '+ 32만원', value: '184만원', valueSize: 32,
    },
  },
  {
    id: 'loan', menuId: 'loan', figmaNodeId: '4056:20030', sizes: TWO,
    content: {
      visual: { kind: 'art', size: 48, layers: [{ file: 'wc-loan-bag.svg', inset: '6.25% 7.29% 7.29% 9.38%' }] },
      category: '대출현황', action: '상세 보기', caption: 'D - 12', value: '20.2만원', valueSize: 32,
    },
  },
  {
    id: 'recent-expense', menuId: 'recent-expense', figmaNodeId: '4040:19169', sizes: TWO,
    content: {
      visual: { kind: 'art', size: 54, layers: [ring('wc-spend-ring.svg')] },
      category: '돈관리', action: '예산 설정', caption: '이번 달 소비', value: '50', suffix: '%', valueSize: 36,
    },
  },
  {
    id: 'fixed-expense', menuId: 'fixed-expense', figmaNodeId: '4056:20069', sizes: TWO,
    content: {
      visual: {
        kind: 'art', size: 54,
        layers: [ring('wc-ring-track.svg'), ringArc('wc-ring-arc.svg'), { file: 'wc-fixed-roll.svg', box: [16, 16, 22] }],
      },
      category: '고정비', action: '상세 보기', caption: 'D - 3', value: '24만원', valueSize: 32,
    },
  },
  {
    id: 'emergency-fund', menuId: 'emergency-fund', figmaNodeId: '4056:19951', sizes: TWO,
    content: {
      visual: { kind: 'art', size: 54, layers: [ring('wc-emergency-ring.svg')] },
      category: '비상금', action: '저금하기', caption: '목표 100만원', value: '72만원', valueSize: 32,
    },
  },
  {
    id: 'community-popular', menuId: 'board', figmaNodeId: '4056:19882', sizes: TWO,
    content: {
      visual: { kind: 'art', size: 48, layers: [{ file: 'wc-community-fire.svg', inset: '10.64% 16.67% 8.33% 12.5%' }] },
      category: '커뮤니티', action: '인기글', caption: '지금 인기', value: '자취 첫날\n꼭 해야 할 것', valueSize: 18,
    },
  },
  {
    id: 'custom-benefit', menuId: 'custom-benefit', figmaNodeId: '4056:19857', sizes: TWO,
    content: {
      visual: { kind: 'art', size: 48, layers: [{ file: 'wc-benefit-gift.svg', inset: '8.33%' }] },
      category: '혜택', action: '상세 보기', caption: '청년 월세 지원', value: 'D-5', valueSize: 32,
    },
  },
  {
    id: 'living-level', menuId: 'living-level', figmaNodeId: '4040:19201', sizes: TWO,
    content: {
      visual: {
        kind: 'art', size: 54,
        layers: [ring('wc-ring-track.svg'), ringArc('wc-ring-arc.svg'), { file: 'wc-level-sprout.png', box: [17, 17, 21], crop: true }],
      },
      category: '자취 레벨', action: '미션하기', caption: '레벨업 : 45xp 남음', lead: 'LV.2', value: '새싹', valueSize: 32,
    },
  },
];

/** 메뉴의 2×2 에셋들 (없으면 빈 배열 → 그 메뉴는 1×1 뿐) */
export function getMenuAssets(menuId: string): MenuWidgetAsset[] {
  return MENU_WIDGET_ASSETS.filter((asset) => asset.menuId === menuId);
}

/** 메뉴 관리에 노출할 2×2 에셋만 조회한다. 저장소 전체 조회(getMenuAssets)와 의도적으로 분리한다. */
export function getMenuManageAssets(menuId: string): MenuWidgetAsset[] {
  return getMenuAssets(menuId).filter((asset) => asset.showInMenuManage !== false);
}

/** 1×1 presentation과 의미상 직접 대응하는 2×2 asset.
 * 배열 순서에 의미를 부여하지 않도록 대응이 확정된 조합만 명시한다. */
const AUTO_EXPAND_ASSET_BY_COMPACT_ID: Readonly<Record<string, string>> = {
  'first-home-1x1': 'first-home-checklist',
  'home-care-1x1': 'home-care',
  'account-1x1': 'account',
  'loan-1x1': 'loan',
  'recent-expense-1x1': 'recent-expense',
  'fixed-expense-1x1': 'fixed-expense',
  'emergency-fund-1x1': 'emergency-fund',
  'board-1x1': 'community-popular',
  'custom-benefit-1x1': 'custom-benefit',
  'living-level-1x1': 'living-level',
};

/** 자동 확장에 사용할 2×2를 결정한다.
 * 명시 대응 → 이전 선택 → 유일 후보 외에는 임의 선택하지 않는다. */
export function resolveAutoExpandAsset(
  compactAssetId: string,
  menuId: string,
  previousAssetId?: string,
): MenuWidgetAsset | undefined {
  const candidates = getMenuManageAssets(menuId);
  const explicitId = AUTO_EXPAND_ASSET_BY_COMPACT_ID[compactAssetId];
  const explicit = explicitId ? candidates.find((asset) => asset.id === explicitId) : undefined;
  if (explicit) return explicit;
  const previous = previousAssetId ? candidates.find((asset) => asset.id === previousAssetId) : undefined;
  if (previous) return previous;
  return candidates.length === 1 ? candidates[0] : undefined;
}
