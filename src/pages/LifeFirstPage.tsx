import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useAuth } from '../auth/AuthContext';
import type { Persona } from '../auth/mockUsers';
import { SIGNUP_TEST_PROFILES } from '../auth/signupTestProfiles';
import { BottomNavigation } from '../components/BottomNavigation';
import { CategoryTabs } from '../components/homecare/CategoryTabs';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import Stack from '../components/Stack/Stack';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';

/* 집을 보러 갔을 때 확인할 생활 조건 — 마름모 레이더 위 네 버튼을 누르면 설명이 말풍선으로 뜬다. */
const HOUSE_POINTS = [
  { key: 'light', name: '채광', desc: '햇빛이 충분히 드는지', file: 'life/life_sun.png' },
  { key: 'water', name: '수압', desc: '물줄기가 충분히 센지', file: 'life/life_water.png' },
  { key: 'storage', name: '수납', desc: '수납공간이 충분한지', file: 'life/life_storage.png' },
  { key: 'nearby', name: '생활 편의', desc: '편의시설이 가까운지', file: 'life/life_convenience.png' },
] as const;

/* 레이더 그래프 모양 — persona 마다 다른 집 조건을 보여준다(0~100, 축마다 독립).
 * 이서준(beginner)은 아직 입주 전이라 실제 집이 없어서, 원래 화면이 쓰던 예시 모양을 그대로 둔다. */
interface HouseRadarScore {
  light: number;
  water: number;
  storage: number;
  nearby: number;
}

const HOUSE_RADAR_DEFAULT: HouseRadarScore = { light: 83, water: 64, storage: 86, nearby: 29 };

/* 회원가입 폼 자동입력용 "일반 테스트 계정"(signupTestProfiles.ts 의 generic) — persona 가
 * 항상 'beginner' 로 가입되어 이서준과 겹치므로, 이메일로 구분해 네 축 모두 중간값을 보여준다. */
const HOUSE_RADAR_GENERIC_TEST: HouseRadarScore = { light: 50, water: 50, storage: 50, nearby: 50 };

const HOUSE_RADAR_SCORES: Record<Persona, HouseRadarScore> = {
  /* 이서준 · 아직 입주 전 — 원래 화면의 예시 모양 */
  beginner: HOUSE_RADAR_DEFAULT,
  /* 김하린 · 원룸 3년차 — 채광·수압은 괜찮지만 원룸이라 수납이 아쉽고, 대신 생활 편의는 매우 좋다 */
  worker: { light: 75, water: 80, storage: 45, nearby: 90 },
  /* 조아영 · 빌라·투룸 2년차 — 창이 많아 채광이 좋고 투룸이라 수납도 넉넉하지만, 주택가라 생활 편의는 아쉽다 */
  pet: { light: 85, water: 60, storage: 80, nearby: 55 },
};

/* 점수(0~100)를 96px 다이아몬드 기준 CSS 퍼센트 좌표로 바꾼다.
 * 중심(50%)이 0점, 각 축의 바깥 꼭짓점(0%/100%)이 100점이다. */
function radarAxisPercent(score: number, direction: 'inward' | 'outward') {
  const clamped = Math.min(100, Math.max(0, score));
  const distance = (clamped / 100) * 50;
  return `${direction === 'inward' ? 50 - distance : 50 + distance}%`;
}

/* 체크리스트를 보는 시점 */
const CONTRACT_STAGES = ['계약 전', '계약 시', '입주 전', '입주 후'] as const;
type ContractStage = (typeof CONTRACT_STAGES)[number];

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
}

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
    { id: 'owner', title: '집주인 확인', description: '등기부등본, 실소유자 여부' },
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

/* 체크 상태는 단계마다 따로 쌓인다 — 입주 전에서 체크한 게 입주 후로 넘어가지 않는다 */
const INITIAL_CHECKED: Record<ContractStage, string[]> = {
  '계약 전': [],
  '계약 시': [],
  '입주 전': ['owner', 'fee'],
  '입주 후': [],
};

/* 자취 선배들의 후회 — Stack 에 겹쳐 쌓이는 메모 카드.
 * 후회로 끝내지 않고 바로 해볼 수 있는 방법까지 한 장에 담는다. */
const REGRETS = [
  {
    key: 'environment',
    category: '주변 환경',
    tone: 'green',
    /* 카드 주제를 한눈에 알려주는 작은 3D 아이콘 — public/assets/img/life 아래 */
    icon: 'life/regret-night.png',
    regret: '낮에만 집을 보고 계약했는데 밤에는 주변 소음이 생각보다 커서 후회했어요.',
    solution: '낮뿐 아니라 저녁에도 방문해 소음·조명·귀갓길 환경을 확인해보세요.',
  },
  {
    key: 'living',
    category: '생활 준비',
    tone: 'pink',
    icon: 'life/regret-moving.png',
    regret:
      '인터넷과 필요한 생활용품을 미리 준비하지 않아서 입주하고 며칠 동안 생각보다 많이 불편했어요.',
    solution: '입주 1~2주 전 인터넷 설치를 예약하고, 첫날 필요한 생필품을 미리 준비해두세요.',
  },
  {
    key: 'contract',
    category: '계약 확인',
    tone: 'cream',
    icon: 'life/regret-contract.png',
    regret:
      '계약할 때 관리비에 어떤 항목이 포함되는지 자세히 확인하지 않아 생각보다 생활비가 많이 들었어요.',
    solution: '계약 전에 관리비 포함 항목과 별도 납부 항목을 구분해 확인하세요.',
  },
] as const;

interface RegretCardProps {
  category: string;
  regret: string;
  solution: string;
  tone: string;
  icon: string;
}

function RegretCard({ category, regret, solution, tone, icon }: RegretCardProps) {
  return (
    <div className={`regret-card regret-card--${tone}`}>
      {/* 주제 아이콘은 글을 가리지 않게 오른쪽 위 구석에만 둔다 */}
      <img className="regret-card__icon" src={img(icon)} alt="" />
      <span className="regret-card__category">{category}</span>
      <p className="regret-card__text">
        {/* 아이콘이 걸리는 윗부분만 비워 주는 자리 — 아래 줄은 전체 폭을 그대로 쓴다 */}
        <span className="regret-card__text-gap" aria-hidden="true" />
        {regret}
      </p>
      {/* 후회 다음에 바로 해볼 방법 — 별도 박스 없이 divider 와 타이포로만 나눈다 */}
      <div className="regret-card__solution">
        <span className="regret-card__solution-label">💡 이렇게 해보세요</span>
        <p>{solution}</p>
      </div>
    </div>
  );
}

/* 생활 > 첫 자취 — 방을 고를 때 볼 것, 계약 때 챙길 것, 선배들의 후회 순서로 보여준다.
 * 첫 섹션은 정보, 두 번째는 체크, 세 번째는 넘겨보는 콘텐츠로 역할을 나눈다. */
export function LifeFirstPage() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const radarScore =
    user?.email === SIGNUP_TEST_PROFILES.generic.email
      ? HOUSE_RADAR_GENERIC_TEST
      : HOUSE_RADAR_SCORES[user?.persona ?? 'beginner'];
  const radarPosition = {
    top: radarAxisPercent(radarScore.light, 'inward'),
    right: radarAxisPercent(radarScore.water, 'outward'),
    bottom: radarAxisPercent(radarScore.storage, 'outward'),
    left: radarAxisPercent(radarScore.nearby, 'inward'),
  };
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const [checkedByStage, setCheckedByStage] =
    useState<Record<ContractStage, string[]>>(INITIAL_CHECKED);
  const [regretTop, setRegretTop] = useState(0);
  const [stage, setStage] = useState<ContractStage>('입주 전');
  const [stageOpen, setStageOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [openPoint, setOpenPoint] = useState<string | null>(null);
  const radarRef = useRef<HTMLDivElement>(null);

  /* 바깥을 누르면 닫는다 (터치·마우스 공통) — 저장한 정보 화면과 같은 방식 */
  useEffect(() => {
    if (!stageOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!stageRef.current?.contains(event.target as Node)) setStageOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [stageOpen]);

  /* 채광·수압·수납·생활 편의 버튼 설명 말풍선 — 화면 아무 곳이나 누르면 닫힌다.
   * 다른 버튼을 누르면 그 버튼의 onClick 이 openPoint 를 바로 새 값으로 바꿔서 전환된다. */
  useEffect(() => {
    if (!openPoint) return;
    const onOutside = (event: PointerEvent) => {
      if (!radarRef.current?.contains(event.target as Node)) setOpenPoint(null);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [openPoint]);

  /* 지금 고른 단계의 항목과 체크 상태만 화면에 쓴다 */
  const items = CHECKLIST_BY_STAGE[stage];
  const checked = checkedByStage[stage];
  const done = checked.length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;

  const toggleCheck = (id: string) =>
    setCheckedByStage((prev) => {
      const current = prev[stage];
      return {
        ...prev,
        [stage]: current.includes(id) ? current.filter((key) => key !== id) : [...current, id],
      };
    });

  /* Stack 은 배열의 마지막 카드를 맨 앞에 놓으므로 뒤집어 넘겨 1번이 먼저 보이게 한다.
   * cards 가 바뀌면 순서가 초기화되므로 한 번만 만든다. */
  const regretCards = useMemo(
    () =>
      [...REGRETS].reverse().map((regret) => (
        <RegretCard
          key={regret.key}
          category={regret.category}
          regret={regret.regret}
          solution={regret.solution}
          tone={regret.tone}
          icon={regret.icon}
        />
      )),
    [],
  );
  /* 뒤집어 넣었으니 pagination 번호도 원래 순서로 되돌린다 */
  const onTopChange = useCallback((index: number) => setRegretTop(REGRETS.length - 1 - index), []);

  return (
    <div className="life-first app">
      <SubPageHeader
        title="생활"
        backLabel="생활로"
        onBack={() => navigation?.navigate('life')}
        onMenu={() => setGnbOpen(true)}
      />

      <CategoryTabs active="first" />

      <main className="life-first__scroll">
        {/* ============ ① 좋은 집인지 살펴봐요 — 정보만 전달한다 ============ */}
        <section className="house-check">
          <div className="house-check__head">
            <h2>좋은 집인지 살펴봐요</h2>
            <p>집을 보러 갔을 때 꼭 확인해볼 생활 조건이에요.</p>
          </div>

          {/* 리스트 대신 마름모 레이더 위에 네 버튼 — 누르면 설명이 말풍선으로 뜬다 */}
          <div className="house-check__panel">
            <div className="house-check__radar" ref={radarRef}>
              <div className="house-check__radar-diamond" aria-hidden="true">
                <span className="house-check__radar-outline house-check__radar-outline--outer" />
                <span className="house-check__radar-outline house-check__radar-outline--inner" />
                <span className="house-check__radar-cross house-check__radar-cross--h" />
                <span className="house-check__radar-cross house-check__radar-cross--v" />
                {/* 계정(persona)마다 다른 집 조건 데이터 — clip-path·dot 위치를 점수로 계산해
                  * 인라인 스타일로 넘긴다. 이 그룹만 house-check__radar-data 로 감싸서 화면에
                  * 들어올 때 중심에서 바깥으로 펴지는 모션을 준다. */}
                <span className="house-check__radar-data">
                  <span
                    className="house-check__radar-fill"
                    style={{
                      clipPath: `polygon(50% ${radarPosition.top}, ${radarPosition.right} 50%, 50% ${radarPosition.bottom}, ${radarPosition.left} 50%)`,
                    }}
                  />
                  <span
                    className="house-check__radar-dot house-check__radar-dot--top"
                    style={{ top: radarPosition.top }}
                  />
                  <span
                    className="house-check__radar-dot house-check__radar-dot--right"
                    style={{ left: radarPosition.right }}
                  />
                  <span
                    className="house-check__radar-dot house-check__radar-dot--bottom"
                    style={{ top: radarPosition.bottom }}
                  />
                  <span
                    className="house-check__radar-dot house-check__radar-dot--left"
                    style={{ left: radarPosition.left }}
                  />
                </span>
                <span className="house-check__radar-dot house-check__radar-dot--center" />
              </div>
              {HOUSE_POINTS.map((point) => (
                <div key={point.key} className={`house-check__pill-wrap house-check__pill-wrap--${point.key}`}>
                  <button
                    type="button"
                    className={`house-check__pill${openPoint === point.key ? ' is-active' : ''}`}
                    aria-pressed={openPoint === point.key}
                    onClick={() => setOpenPoint((prev) => (prev === point.key ? null : point.key))}
                  >
                    <img src={img(point.file)} alt="" />
                    <span>{point.name}</span>
                  </button>
                  {openPoint === point.key && (
                    <span className="house-check__tooltip" role="tooltip">
                      {point.desc}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ ② 계약부터 입주까지 — 직접 체크하는 영역 ============ */}
        <section className="contract-check">
          <div className="contract-check__head">
            <h2>계약부터 입주까지 챙겨봐요</h2>
          </div>

          {/* 완료 상태와 단계 선택을 한 줄에 두어 제목과 위계를 나눈다.
            * 항목이 없는 단계에서도 다시 단계를 바꿀 수 있어야 해서 이 줄은 항상 그린다. */}
          <div className="contract-check__progress">
            <div className="contract-check__meta">
              {items.length > 0 && (
                <span className="contract-check__count">
                  {done}/{items.length} 완료
                </span>
              )}
              <div className="stage-select" ref={stageRef}>
              <button
                type="button"
                className="stage-select__button"
                aria-expanded={stageOpen}
                aria-haspopup="listbox"
                onClick={() => setStageOpen((open) => !open)}
              >
                {stage}
                <img src={icon(stageOpen ? 'chevron-up.svg' : 'chevron-down.svg')} alt="" />
              </button>
              <ul className="stage-select__list" role="listbox" hidden={!stageOpen}>
                {CONTRACT_STAGES.map((option) => (
                  <li key={option} role="option" aria-selected={option === stage}>
                    <button
                      type="button"
                      className={option === stage ? 'is-selected' : undefined}
                      onClick={() => {
                        setStage(option);
                        setStageOpen(false);
                      }}
                    >
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
              </div>
            </div>

            {items.length > 0 && (
              <span
                className="contract-check__bar"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="계약 체크 진행률"
              >
                <span className="contract-check__bar-fill" style={{ width: `${progress}%` }} />
              </span>
            )}
          </div>

          {/* 항목이 없는 단계는 목록 대신 안내만 보여준다 */}
          {items.length === 0 ? (
            <p className="contract-check__empty">체크리스트 준비 중이에요.</p>
          ) : (
          <ul className="contract-check__list">
            {items.map((item) => {
              const isDone = checked.includes(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`contract-item${isDone ? ' is-done' : ''}`}
                    aria-pressed={isDone}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <img src={icon(isDone ? 'life-check-on.svg' : 'life-check-off.svg')} alt="" />
                    <span className="contract-item__text">
                      <strong>{item.title}</strong>
                      <em>{item.description}</em>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          )}
        </section>

        {/* ============ ③ 자취 선배들의 후회 — 넘겨보는 콘텐츠 ============ */}
        <section className="regret">
          <div className="regret__head">
            <h2>자취 선배들은 이걸 후회했어요</h2>
            <p>먼저 살아본 사람들의 이야기를 모았어요.</p>
          </div>
          <div className="regret__stack">
            <Stack
              /* 매번 달라지는 랜덤 회전 대신 index 기반 고정 각도를 쓴다 */
              randomRotation={false}
              sensitivity={180}
              sendToBackOnClick
              mobileClickOnly
              autoplay={false}
              cards={regretCards}
              onTopChange={onTopChange}
            />
          </div>
          <div className="regret__pager">
            {REGRETS.map((regret, index) => (
              <span
                key={regret.key}
                className={`regret__dot${index === regretTop ? ' is-active' : ''}`}
              />
            ))}
            <span className="regret__status" aria-live="polite">
              후회 {regretTop + 1} / 전체 {REGRETS.length}
            </span>
          </div>
        </section>
      </main>

      <BottomNavigation activeTab="life" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />
    </div>
  );
}

export default LifeFirstPage;
