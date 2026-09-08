/* 자취 미션 데이터 — Figma saved_info (1565:6712)
 *
 * 화면은 하나이고 이 배열만 갈아끼운다. personaHome / personaProfile 과 같은 방식이다.
 * 진행률은 여기서 퍼센트로 굳히지 않고 completed / total 만 두어 화면에서 계산한다.
 */

export type MissionStatus = 'available' | 'active' | 'done';

/** 미션 카테고리 — IA 의 대분류를 쓴다 */
export type MissionCategory = '돈 관리' | '음식' | '생활';

interface MissionBase {
  id: string;
  category: MissionCategory;
  /** 완료 시 받는 XP */
  xp: number;
  title: string;
  description: string;
}

/** 진행중 / 완료 — 단계 진행도를 가진다 */
interface SteppedMission extends MissionBase {
  status: 'active' | 'done';
  completed: number;
  total: number;
}

/** 시작 가능 — 아직 진행도가 없고 예상 소요 시간을 보여준다 */
interface AvailableMission extends MissionBase {
  status: 'available';
  estimatedTime: string;
}

export type Mission = SteppedMission | AvailableMission;

export const MISSIONS: Mission[] = [
  {
    id: 'utility-bill',
    status: 'active',
    category: '돈 관리',
    xp: 20,
    title: '공과금 관리 습관 만들기',
    description: '전기요금, 수도요금 납부일 확인하고 자동이체 설정하기',
    completed: 3,
    total: 5,
  },
  {
    id: 'fixed-cost',
    status: 'active',
    category: '돈 관리',
    xp: 15,
    title: '이번 달 고정비 확인하기',
    description: '월세, 관리비, OTT 등 매달 나가는 고정 지출 기록하기',
    completed: 2,
    total: 3,
  },
  {
    id: 'mealkit',
    status: 'active',
    category: '음식',
    xp: 15,
    title: '첫 자취 밀키트 요리 도전',
    description: '간단한 1인분 밀키트로 든든한 집밥 한 끼 차려먹기',
    completed: 1,
    total: 2,
  },
  {
    id: 'fridge-check',
    status: 'available',
    category: '음식',
    xp: 10,
    title: '냉장고 식재료 점검하기',
    description: '냉장고 속 식재료를 확인하고 필요한 재료를 정리해보세요',
    estimatedTime: '15분',
  },
];

/** 상태 탭 — '전체' 는 필터를 걸지 않는다 */
export const STATUS_TABS = [
  { label: '전체', status: null },
  { label: '시작 가능', status: 'available' },
  { label: '진행중', status: 'active' },
  { label: '완료', status: 'done' },
] as const satisfies ReadonlyArray<{ label: string; status: MissionStatus | null }>;

/** 카드 좌상단 상태 chip */
export const STATUS_CHIP: Record<MissionStatus, { label: string; background: string; color: string }> = {
  active: { label: '진행중', background: '#fbeceb', color: '#b43936' },
  available: { label: '시작가능', background: '#d9e0a6', color: '#232323' },
  done: { label: '완료', background: '#e8e2d8', color: '#58413f' },
};

/** 카테고리 chip 배경 — 돈 관리 / 음식은 Figma 값 그대로 */
export const CATEGORY_CHIP: Record<MissionCategory, string> = {
  '돈 관리': '#fef5d6',
  음식: '#f6f0e6',
  생활: '#e2e8bc',
};

/** 필터 드롭다운 옵션 — 데이터에 실제로 있는 카테고리만 노출한다 */
export function categoryOptions(missions: Mission[]): Array<MissionCategory | '전체'> {
  const used = missions.map((m) => m.category);
  const unique = (Object.keys(CATEGORY_CHIP) as MissionCategory[]).filter((c) => used.includes(c));
  return ['전체', ...unique];
}

/** 0~100. 화면에서 퍼센트를 직접 쓰지 않게 여기서만 계산한다. */
export function missionProgress(mission: Mission): number {
  if (mission.status === 'available') return 0;
  if (mission.total <= 0) return 0;
  return Math.round((mission.completed / mission.total) * 100);
}
