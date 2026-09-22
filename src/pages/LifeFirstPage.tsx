import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { CategoryTabs } from '../components/homecare/CategoryTabs';
import { GlyphIcon } from '../components/GlyphIcon';
import { SubPageHeader } from '../components/SubPageHeader';
import { useCardCarousel } from '../hooks/useCardCarousel';
import { useRegretCarousel } from '../hooks/useRegretCarousel';
import type { CardCarousel } from '../hooks/useCardCarousel';
import { icon } from '../lib/asset';

/* 집을 볼 때 확인할 항목 — 집 내부와 생활 조건 두 탭이 똑같은 구조로 쓴다.
 * 탭이 바뀌어도 화면이 그리는 요소(아이콘 · 진행 게이지 · 설명 · 확인 버튼)는 같고
 * 이 데이터만 갈아끼운다. detail 은 항상 두 줄이라 탭을 바꿔도 높이가 튀지 않는다. */
interface HousePoint {
  readonly key: string;
  readonly name: string;
  /** public/assets/icon 아래 파일 이름 */
  readonly icon: string;
  readonly detail: readonly [string, string];
}

/* 집 안에서 직접 눈으로 확인하는 것 */
const INTERIOR_POINTS: readonly HousePoint[] = [
  {
    key: 'mold', name: '곰팡이', icon: 'tip-category-clean.svg',
    detail: ['창틀과 욕실, 벽 모서리에', '곰팡이나 물 얼룩이 없는지 확인해보세요.'],
  },
  {
    key: 'defect', name: '하자', icon: 'tip-category-repair.svg',
    detail: ['벽과 바닥, 문에 깨진 곳이나', '수리한 흔적이 없는지 확인해보세요.'],
  },
  {
    key: 'light-plug', name: '조명', icon: 'lightbulb-tip.svg',
    detail: ['방마다 조명이 잘 켜지는지,', '콘센트 위치와 개수를 확인해보세요.'],
  },
  {
    key: 'lock', name: '잠금', icon: 'lock.svg',
    detail: ['현관문과 창문 잠금장치가', '제대로 잠기는지 확인해보세요.'],
  },
] as const;

/* 살기 좋은 집인지 판단할 때 참고하는 생활 조건 */
const CONDITION_POINTS: readonly HousePoint[] = [
  {
    key: 'light', name: '채광', icon: 'life-first-sun.svg',
    detail: ['낮에도 불을 켜야 하는지,', '창문 방향과 앞 건물 간격을 함께 확인해보세요.'],
  },
  {
    key: 'water', name: '수압', icon: 'life-first-drop.svg',
    detail: ['수도와 샤워기를 직접 틀어보고,', '물줄기와 온수가 잘 나오는지 확인해보세요.'],
  },
  {
    key: 'storage', name: '수납', icon: 'life-first-sofa.svg',
    detail: ['가지고 올 짐을 떠올리며,', '옷장과 주방 수납공간이 충분한지 확인해보세요.'],
  },
  {
    key: 'nearby', name: '생활 편의', icon: 'life-first-store.svg',
    detail: ['자주 이용할 길을 직접 걸어보고,', '교통과 가까운 편의시설을 함께 확인해보세요.'],
  },
] as const;

type HouseView = 'interior' | 'conditions';

const HOUSE_VIEW_ORDER: readonly HouseView[] = ['interior', 'conditions'];

const HOUSE_VIEWS: Record<HouseView, { label: string; points: readonly HousePoint[] }> = {
  interior: { label: '집 내부', points: INTERIOR_POINTS },
  conditions: { label: '생활 조건', points: CONDITION_POINTS },
};

/* 체크리스트를 보는 시점 */
const CONTRACT_STAGES = ['계약 전', '계약 시', '입주 전', '입주 후'] as const;
type ContractStage = (typeof CONTRACT_STAGES)[number];

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
}

/* 한 단계(STEP)는 두 줄로 보이고, 두 줄은 각각 따로 체크한다 —
 * 제목 줄을 눌러도 아래 줄의 체크는 그대로 남는다. */
interface ChecklistRow {
  id: string;
  label: string;
}

const checklistRows = (item: ChecklistItem): readonly ChecklistRow[] => [
  { id: item.id + ':1', label: item.title },
  { id: item.id + ':2', label: item.description },
];

/* 단계별 체크 항목 — 화면은 이 데이터만 보고 그린다 */
const CHECKLIST_BY_STAGE: Record<ContractStage, ChecklistItem[]> = {
  '계약 전': [
    { id: 'budget', title: '예산 확인', description: '보증금·월세·관리비까지 계산해요' },
    { id: 'registry', title: '등기부등본 확인', description: '소유자와 권리관계를 확인해요' },
    { id: 'condition', title: '집 상태 점검', description: '채광·수압·하자·소음을 살펴봐요' },
    { id: 'neighborhood', title: '주변 환경 확인', description: '교통과 편의시설을 확인해요' },
  ],
  '계약 시': [
    { id: 'landlord', title: '계약자 확인', description: '임대인과 실제 소유자가 같은지 확인해요' },
    { id: 'terms-detail', title: '계약 조건 확인', description: '보증금·월세·관리비·기간을 확인해요' },
    { id: 'special-terms', title: '특약사항 작성', description: '합의한 내용을 계약서에 남겨요' },
    { id: 'transfer', title: '송금 계좌 확인', description: '임대인 명의 계좌인지 확인해요' },
  ],
  '입주 전': [
    { id: 'owner', title: '집주인 확인', description: '임대인 정보 · 소유자 정보' },
    { id: 'fee', title: '관리비 항목', description: '포함 항목과 금액을 확인해요' },
    { id: 'terms', title: '특약사항', description: '계약서에 꼭 확인해요' },
    { id: 'account', title: '송금 계좌', description: '정확한 계좌를 다시 확인해요' },
  ],
  '입주 후': [
    { id: 'move-in-report', title: '전입신고', description: '새 주소로 전입신고를 완료해요' },
    { id: 'home-condition', title: '집 상태 기록', description: '하자와 계량기를 사진으로 남겨요' },
    { id: 'utilities', title: '공과금 정리', description: '전기·가스·수도 납부를 확인해요' },
    { id: 'living-service', title: '생활 서비스', description: '인터넷과 배송지를 새 주소로 변경해요' },
  ],
};

/* 체크 상태는 단계마다, 그리고 줄마다 따로 쌓인다 —
 * 입주 전에서 체크한 게 입주 후로 넘어가지 않고, 한 줄을 꺼도 옆줄은 그대로다. */
const INITIAL_CHECKED: Record<ContractStage, string[]> = {
  '계약 전': [],
  '계약 시': [],
  '입주 전': ['owner:1', 'owner:2', 'fee:1', 'fee:2'],
  '입주 후': [],
};

/* 자취 선배들의 후회 — 겹쳐 쌓인 메모 카드를 좌우로 넘겨 본다.
 * 후회로 끝내지 않고 바로 해볼 수 있는 방법까지 한 장에 담는다. */
interface RegretCardData {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly tip: string;
  readonly icon: string;
  readonly tone: 'green' | 'pink' | 'cream';
}

/* 내용·톤·아이콘은 카드 ID에 귀속된다. 순환 위치가 바뀌어도 이 객체는 바꾸지 않는다. */
const REGRETS: readonly RegretCardData[] = [
  {
    id: 'move-in-record',
    category: '입주기록',
    title: '입주 첫날 사진을 남겨둘 걸 그랬어요',
    description: '입주 첫 날 집 상태를 사진으로 안 남겼는데, 퇴실할 때 원래 있던 흠집까지 증명하기 어려웠어요.',
    tip: '짐을 풀기 전에 집 상태를 사진이나 영상으로 남겨두세요.',
    icon: 'life-first-tip.svg',
    tone: 'green',
  },
  {
    id: 'environment',
    category: '주변 환경',
    title: '저녁에도 집 주변을 살펴볼 걸 그랬어요',
    description: '낮에만 집을 보고 계약했는데 밤에는 주변 소음이 생각보다 커서 후회했어요.',
    tip: '낮뿐 아니라 저녁에도 방문해 소음·조명·귀갓길 환경을 확인해보세요.',
    icon: 'life-first-tip.svg',
    tone: 'pink',
  },
  {
    id: 'living',
    category: '생활 준비',
    title: '입주 첫날 필요한 걸 미리 준비할 걸 그랬어요',
    description: '인터넷과 필요한 생활용품을 미리 준비하지 않아서 입주하고 며칠 동안 생각보다 많이 불편했어요.',
    tip: '입주 1~2주 전 인터넷 설치를 예약하고, 첫날 필요한 생필품을 미리 준비해두세요.',
    icon: 'life-first-tip.svg',
    tone: 'cream',
  },
];

/* 겹쳐 쌓인 모습만 담당하는 값들. 앞 1 / 가운데 0.97 / 뒤 0.94 로 줄고 한 칸씩 올라간다.
 * 톤·내용은 카드 데이터가 정하고, 이 값들은 자리(front/middle/back)만 정한다. */
const DECK_LIFT = 12;
const DECK_SHRINK = 0.03;
/* 빠져나가는 카드의 기울기와, 끌고 있는 동안 따라 붙는 기울기 */
const EXIT_ROTATE = 6;
const DRAG_TILT = 0.05;
const DRAG_TILT_MAX = 8;
/* 많이 끌수록 살짝 옅어진다. 끝까지 지우지는 않는다 */
const DRAG_FADE_DISTANCE = 320;
const DRAG_FADE_MAX = 0.35;

/* 체크 원 — 완료 여부와 상관없이 항상 같은 자리에 같은 크기로 그린다.
 * 해제 상태에서도 원을 지우지 않고 초록 선만 남기고 체크 표시만 감춘다(CSS 에서 처리).
 * 그래서 체크를 켜고 꺼도 주변 글자 위치가 움직이지 않는다. */
function CheckCircle({ done, className }: { done: boolean; className?: string }) {
  return (
    <svg
      className={'check-circle' + (done ? ' is-done' : '') + (className ? ' ' + className : '')}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="check-circle__ring" cx="9" cy="9" r="8.25" />
      <path className="check-circle__mark" d="M5.21 9L8.05 11.84L12.79 6.16" />
    </svg>
  );
}

/* 카드를 스와이프하고 손을 뗀 순간, 카드 안의 버튼이 눌린 것으로 처리되지 않게 막는다.
 * 스와이프를 받는 요소에 그대로 펼쳐서 쓴다. */
function useSwipeClickGuard() {
  const draggedRef = useRef(false);
  const startXRef = useRef(0);

  return {
    onPointerDownCapture: (event: ReactPointerEvent<HTMLElement>) => {
      draggedRef.current = false;
      startXRef.current = event.clientX;
    },
    onPointerMoveCapture: (event: ReactPointerEvent<HTMLElement>) => {
      if (Math.abs(event.clientX - startXRef.current) > 8) draggedRef.current = true;
    },
    onClickCapture: (event: ReactMouseEvent<HTMLElement>) => {
      if (!draggedRef.current) return;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}

/* 스와이프로 넘기는 영역은 키보드에서도 좌우 방향키로 넘길 수 있어야 한다 */
function carouselKeyHandler(carousel: CardCarousel) {
  return (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      carousel.goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      carousel.goPrev();
    }
  };
}

const pad2 = (value: number) => String(value).padStart(2, '0');

interface RegretCardProps {
  card: RegretCardData;
  interactive: boolean;
  onOpenTips: () => void;
}

function RegretCard({ card, interactive, onOpenTips }: RegretCardProps) {
  return (
    <article className={"regret-card regret-card--" + card.tone}>
      <div className="regret-card__top">
        <div className="regret-card__meta">
          <span className="regret-card__category">{card.category}</span>
          <button
            type="button"
            className="regret-card__arrow"
            aria-label="커뮤니티 자취 꿀팁 보기"
            tabIndex={interactive ? 0 : -1}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onOpenTips();
            }}
          >
            <img src={icon('life-first-next.svg')} alt="" draggable={false} />
          </button>
        </div>
        <div className="regret-card__copy">
          <h3 className="regret-card__quote">“{card.title}”</h3>
          <p className="regret-card__text">{card.description}</p>
        </div>
      </div>
      <div className="regret-card__solution">
        <span className="regret-card__tip-icon" aria-hidden="true">
          <img src={icon(card.icon)} alt="" draggable={false} />
        </span>
        <div className="regret-card__solution-copy">
          <span className="regret-card__solution-label">TIP</span>
          <p>{card.tip}</p>
        </div>
      </div>
    </article>
  );
}

/* 생활 > 첫 자취 — 생활 조건, 단계별 체크, 선배의 경험을 기존 기능과 연결한다. */
export function LifeFirstPage() {
  const navigation = useAppNavigation();

  const [houseView, setHouseView] = useState<HouseView>('conditions');
  /* "지금 보고 있는 항목"과 "한 번이라도 눌러서 확인한 항목"은 서로 다른 상태다.
   * 진행률은 순서(index)가 아니라 visited 집합의 크기로만 계산하고, 두 탭이 따로 쌓인다 —
   * 생활 조건에서 두 개를 봤다고 집 내부가 2/4 가 되지 않는다. */
  /* 처음에는 어떤 항목도 고르지 않은 상태로 둔다 — 0번(채광)을 미리 선택하지 않는다. */
  const [activeByView, setActiveByView] = useState<Record<HouseView, number | null>>({
    interior: null,
    conditions: null,
  });
  const [visitedByView, setVisitedByView] = useState<Record<HouseView, Set<string>>>({
    interior: new Set<string>(),
    conditions: new Set<string>(),
  });

  const [checkedByStage, setCheckedByStage] =
    useState<Record<ContractStage, string[]>>(INITIAL_CHECKED);
  const [stage, setStage] = useState<ContractStage>('입주 전');
  const [stageOpen, setStageOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const view = HOUSE_VIEWS[houseView];
  const points = view.points;
  const activeIndex = activeByView[houseView];
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const visitedPoints = visitedByView[houseView];
  const visitedCount = visitedPoints.size;
  const visitedRatio = points.length ? (visitedCount / points.length) * 100 : 0;

  const items = CHECKLIST_BY_STAGE[stage];
  const checked = checkedByStage[stage];
  const checklist = useCardCarousel({ count: items.length, loop: false });
  const checklistGuard = useSwipeClickGuard();
  const itemIndex = Math.min(checklist.index, Math.max(items.length - 1, 0));
  const currentItem = items[itemIndex];

  const regret = useRegretCarousel(REGRETS.length);
  const orderedRegrets = [
    ...REGRETS.slice(regret.activeIndex),
    ...REGRETS.slice(0, regret.activeIndex),
  ];

  useEffect(() => {
    if (!stageOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!stageRef.current?.contains(event.target as Node)) setStageOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [stageOpen]);

  /* 항목을 누르면 그 항목을 보여주고, 같은 순간 "확인한 항목"으로 쌓는다.
   * 이미 본 항목을 다시 눌러도 Set 이라 개수는 그대로다. */
  const selectPoint = (index: number) => {
    setActiveByView((prev) => ({ ...prev, [houseView]: index }));
    setVisitedByView((prev) => {
      const current = prev[houseView];
      const key = points[index].key;
      if (current.has(key)) return prev;
      const next = new Set(current);
      next.add(key);
      return { ...prev, [houseView]: next };
    });
  };

  const toggleCheck = (id: string) =>
    setCheckedByStage((prev) => {
      const current = prev[stage];
      return {
        ...prev,
        [stage]: current.includes(id) ? current.filter((key) => key !== id) : [...current, id],
      };
    });

  const openTips = useCallback(() => navigation?.navigateTab('community-tip'), [navigation]);

  return (
    <div className="life-first app">
      <SubPageHeader title="생활" backLabel="이전 화면으로" onBack={() => navigation?.goBack('home')} />
      <CategoryTabs active="first" />

      <main className="life-first__scroll">
        <section className="house-check">
          <div className="house-check__head">
            <h2>좋은 집인지 살펴봐요</h2>
            <p>살기 좋은 집인지 판단할 때 참고할 생활 조건이에요.</p>
          </div>

          <div className="house-check__panel">
            <div className="house-check__segments" role="group" aria-label="집 조건 보기">
              {HOUSE_VIEW_ORDER.map((view) => (
                <button
                  key={view}
                  type="button"
                  className={"house-check__segment" + (houseView === view ? ' is-active' : '')}
                  aria-pressed={houseView === view}
                  onClick={() => setHouseView(view)}
                >
                  {HOUSE_VIEWS[view].label}
                </button>
              ))}
            </div>

            <div
              className="house-check__categories"
              role="group"
              aria-label={HOUSE_VIEWS[houseView].label + ' 선택'}
            >
              {points.map((point, index) => (
                <button
                  key={point.key}
                  type="button"
                  className={"house-check__category" + (index === activeIndex ? ' is-active' : '')}
                  aria-pressed={index === activeIndex}
                  onClick={() => selectPoint(index)}
                >
                  <span className="house-check__category-icon">
                    <GlyphIcon file={point.icon} size={28} />
                  </span>
                  <span>{point.name}</span>
                </button>
              ))}
            </div>

            <div className="house-check__analysis" aria-live="polite" aria-atomic="true">
              <div className="house-check__analysis-meta">
                <span>{(activePoint ? activePoint.name : view.label)} 체크</span>
                <span>CHECK {pad2(visitedCount)} / {pad2(points.length)}</span>
              </div>
              <div
                className="house-check__track"
                role="progressbar"
                aria-label="확인한 항목"
                aria-valuemin={0}
                aria-valuemax={points.length}
                aria-valuenow={visitedCount}
                aria-valuetext={points.length + '개 중 ' + visitedCount + '개 확인'}
              >
                <span style={{ width: visitedRatio + '%' }} />
              </div>
              <p className="house-check__analysis-desc">
                {activePoint
                  ? <>{activePoint.detail[0]}<br />{activePoint.detail[1]}</>
                  : '확인할 항목을 눌러보세요.'}
              </p>
            </div>
          </div>
        </section>

        <section className="contract-check">
          <div className="contract-check__head">
            <h2>계약부터 입주까지 챙겨봐요</h2>
            <p>계약 전부터 입주까지 놓치기 쉬운 항목을 순서대로 확인해요.</p>
          </div>
          <div className="contract-check__ticket">
            <div
              className="stage-select"
              ref={stageRef}
              onKeyDown={(event) => {
                if (event.key !== 'Escape' || !stageOpen) return;
                setStageOpen(false);
                stageRef.current?.querySelector<HTMLButtonElement>('.stage-select__button')?.focus();
              }}
            >
              <button
                type="button"
                className="stage-select__button"
                aria-expanded={stageOpen}
                aria-haspopup="listbox"
                onClick={() => setStageOpen((open) => !open)}
              >
                {stage} 체크
                <img src={icon(stageOpen ? 'chevron-up.svg' : 'chevron-down.svg')} alt="" />
              </button>
              <ul className="stage-select__list" role="listbox" aria-label="체크 시점" hidden={!stageOpen}>
                {CONTRACT_STAGES.map((option) => (
                  <li key={option} role="option" aria-selected={option === stage}>
                    <button
                      type="button"
                      className={option === stage ? 'is-selected' : undefined}
                      onClick={() => {
                        setStage(option);
                        checklist.goTo(0);
                        setStageOpen(false);
                        stageRef.current?.querySelector<HTMLButtonElement>('.stage-select__button')?.focus();
                      }}
                    >
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {currentItem ? (
              <>
                {/* 항목 이동은 카드 스와이프로만 한다 — 아래 점은 위치 표시 전용이다 */}
                <div
                  className="contract-check__viewport"
                  role="group"
                  aria-roledescription="카드 넘기기"
                  aria-label="체크 항목"
                  tabIndex={0}
                  onKeyDown={carouselKeyHandler(checklist)}
                  {...checklist.viewportHandlers}
                  {...checklistGuard}
                >
                  <div
                    className={"contract-check__track" + (checklist.isDragging ? ' is-dragging' : '')}
                    style={{
                      transform: `translateX(calc(${-itemIndex * 100}% + ${checklist.dragOffset}px))`,
                    }}
                  >
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="contract-check__slide"
                        aria-hidden={index !== itemIndex}
                      >
                        <div className="contract-check__ticket-main">
                          <div className="contract-check__step" aria-hidden="true">
                            <span>STEP</span>
                            <strong>{pad2(index + 1)}</strong>
                          </div>
                          <div className="contract-item">
                            {checklistRows(item).map((row) => {
                              const done = checked.includes(row.id);
                              return (
                                <button
                                  key={row.id}
                                  type="button"
                                  className={"contract-item__row" + (done ? ' is-done' : '')}
                                  aria-pressed={done}
                                  tabIndex={index === itemIndex ? 0 : -1}
                                  onClick={() => toggleCheck(row.id)}
                                >
                                  <CheckCircle done={done} />
                                  <span>{row.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="contract-check__dots" aria-hidden="true">
                  {items.map((item, index) => (
                    <span
                      key={item.id}
                      className={"contract-check__dot" + (itemIndex === index ? ' is-active' : '')}
                    />
                  ))}
                </div>
                <span className="sr-only" aria-live="polite">
                  체크 항목 {itemIndex + 1} / {items.length}
                </span>
              </>
            ) : <p className="contract-check__empty">체크리스트 준비 중이에요.</p>}
          </div>
        </section>

        <section className="regret">
          <div className="regret__head">
            <h2>자취 선배들은 이걸 후회했어요</h2>
            <p>먼저 자취한 사람들의 경험에서 놓치기 쉬운 준비를 확인해요.</p>
          </div>
          {/* 세 DOM을 유지하고 앞·중간·뒤 위치만 회전한다. */}
          <div className="regret__carousel">
            <div
              className="regret__stack regret__deck"
              role="group"
              aria-roledescription="카드 넘기기"
              aria-label="자취 선배들의 후회"
              tabIndex={0}
              {...regret.viewportHandlers}
              data-animating={regret.isAnimating}
              data-dragging={regret.isDragging}
            >
            {orderedRegrets.map((card, depth) => {
              const isFront = depth === 0;
              /* 앞 카드가 옆으로 빠져나가는 중 — 순서는 아직 그대로다. */
              const isExiting = isFront && regret.exitSign !== 0;
              /* 순서를 막 돌린 한 프레임 — 자리가 바뀐 카드의 이동 애니메이션을 끈다. */
              const isSettling = regret.isSettling && depth === regret.settlingDepth;
              const drag = isFront && !isExiting ? regret.dragOffset : 0;
              const tilt = regret.reduceMotion
                ? 0
                : Math.max(-DRAG_TILT_MAX, Math.min(DRAG_TILT_MAX, drag * DRAG_TILT));
              const transform = isExiting
                ? `translate3d(${regret.exitSign * 120}%, 0, 0) rotate(${regret.exitSign * EXIT_ROTATE}deg)`
                : `translate3d(${drag}px, ${-depth * DECK_LIFT}px, 0) rotate(${tilt}deg) scale(${1 - depth * DECK_SHRINK})`;
              return (
                <div
                  key={card.id}
                  className={
                    'regret__deck-card'
                    + (isFront && regret.isDragging ? ' is-dragging' : '')
                    + (isExiting ? ' is-exiting' : '')
                    + (isSettling ? ' is-settling' : '')
                  }
                  aria-hidden={!isFront}
                  data-card-id={card.id}
                  data-tone={card.tone}
                  data-depth={depth}
                  style={{
                    transform,
                    opacity: isExiting || isSettling
                      ? 0
                      : 1 - Math.min(Math.abs(drag) / DRAG_FADE_DISTANCE, DRAG_FADE_MAX),
                    zIndex: REGRETS.length - depth,
                    pointerEvents: isFront && !isExiting ? 'auto' : 'none',
                  }}
                >
                  <RegretCard card={card} interactive={isFront && !isExiting} onOpenTips={openTips} />
                </div>
              );
            })}
            </div>
            <button
              type="button"
              className="regret__nav regret__nav--previous"
              aria-label="이전 후회 카드"
              disabled={regret.isAnimating || regret.isDragging}
              onClick={() => regret.move(-1)}
            >
              <img src={icon('chevron-right-secondary.svg')} alt="" draggable={false} />
            </button>
            <button
              type="button"
              className="regret__nav regret__nav--next"
              aria-label="다음 후회 카드"
              disabled={regret.isAnimating || regret.isDragging}
              onClick={() => regret.move(1)}
            >
              <img src={icon('chevron-right-secondary.svg')} alt="" draggable={false} />
            </button>
          </div>
          <span className="sr-only" aria-live="polite">
            후회 {regret.activeIndex + 1} / 전체 {REGRETS.length}
          </span>
        </section>
      </main>
      <BottomNavigation activeTab="life" />
    </div>
  );
}

export default LifeFirstPage;
