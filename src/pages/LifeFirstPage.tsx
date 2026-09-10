import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import Stack from '../components/Stack/Stack';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { icon } from '../lib/asset';

/* 생활 하위 탭 — 첫 자취만 화면이 있어서 나머지는 아직 이동하지 않는다 */
const LIFE_TABS = ['첫 자취', '홈케어', '살림', '먹거리'] as const;

/* 집을 보러 갔을 때 확인할 생활 조건 — 정보만 알려주는 영역이라 클릭 동작이 없다 */
const HOUSE_POINTS = [
  { key: 'light', name: '채광', desc: '햇빛이 충분히 드는지', file: 'life-first-light.svg' },
  { key: 'water', name: '수압', desc: '물을 틀어 세기를 확인', file: 'life-first-water.svg' },
  { key: 'storage', name: '수납', desc: '수납공간이 충분한지', file: 'life-first-storage.svg' },
  { key: 'nearby', name: '생활 편의', desc: '주변 편의시설이 가까운지', file: 'life-first-nearby.svg' },
] as const;

/* 체크리스트를 보는 시점 — 지금은 단계별 데이터가 따로 없어 표시 상태만 바뀐다 */
const CONTRACT_STAGES = ['계약 전', '계약 시', '입주 전', '입주 후'] as const;
type ContractStage = (typeof CONTRACT_STAGES)[number];

/* 계약부터 입주까지 직접 확인하고 체크하는 항목 */
const CONTRACT_CHECKS = [
  { key: 'owner', name: '집주인 확인', desc: '등기부등본, 실소유자 여부', done: true },
  { key: 'fee', name: '관리비 항목', desc: '포함 항목과 금액을 확인해요', done: true },
  { key: 'terms', name: '특약사항', desc: '계약서에 꼭 확인해요', done: false },
  { key: 'account', name: '송금 계좌', desc: '정확한 계좌를 다시 확인해요', done: false },
] as const;

/* 자취 선배들의 후회 — Stack 에 겹쳐 쌓이는 메모 카드 */
const REGRETS = [
  {
    key: 'living',
    category: '생활 준비',
    tone: 'pink',
    text: '인터넷과 필요한 생활용품을 미리 준비하지 않아서 입주하고 며칠 동안 생각보다 많이 불편했어요.',
  },
  {
    key: 'contract',
    category: '계약 확인',
    tone: 'cream',
    text: '계약할 때 관리비에 어떤 항목이 포함되는지 자세히 확인하지 않아서 생각보다 생활비가 많이 들었어요.',
  },
  {
    key: 'environment',
    category: '주변 환경',
    tone: 'green',
    text: '낮에만 집을 보고 계약했는데 밤에는 주변 소음이 생각보다 커서 미리 확인할 걸 후회했어요.',
  },
] as const;

interface RegretCardProps {
  category: string;
  text: string;
  tone: string;
}

function RegretCard({ category, text, tone }: RegretCardProps) {
  return (
    <div className={`regret-card regret-card--${tone}`}>
      <span className="regret-card__category">{category}</span>
      <p className="regret-card__text">{text}</p>
    </div>
  );
}

/* 생활 > 첫 자취 — 방을 고를 때 볼 것, 계약 때 챙길 것, 선배들의 후회 순서로 보여준다.
 * 첫 섹션은 정보, 두 번째는 체크, 세 번째는 넘겨보는 콘텐츠로 역할을 나눈다. */
export function LifeFirstPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>(
    CONTRACT_CHECKS.filter((item) => item.done).map((item) => item.key),
  );
  const [regretTop, setRegretTop] = useState(0);
  const [stage, setStage] = useState<ContractStage>('입주 전');
  const [stageOpen, setStageOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  /* 바깥을 누르면 닫는다 (터치·마우스 공통) — 저장한 정보 화면과 같은 방식 */
  useEffect(() => {
    if (!stageOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!stageRef.current?.contains(event.target as Node)) setStageOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [stageOpen]);

  const done = checked.length;
  const progress = Math.round((done / CONTRACT_CHECKS.length) * 100);

  const toggleCheck = (key: string) =>
    setChecked((prev) => (prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]));

  /* Stack 은 배열의 마지막 카드를 맨 앞에 놓으므로 뒤집어 넘겨 1번이 먼저 보이게 한다.
   * cards 가 바뀌면 순서가 초기화되므로 한 번만 만든다. */
  const regretCards = useMemo(
    () =>
      [...REGRETS].reverse().map((regret) => (
        <RegretCard
          key={regret.key}
          category={regret.category}
          text={regret.text}
          tone={regret.tone}
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

      {/* 하위 탭 — 첫 자취만 화면이 있어 나머지는 아직 연결하지 않는다 */}
      <nav className="life-first__tabs" aria-label="생활 카테고리">
        {LIFE_TABS.map((tab) => (
          <span
            key={tab}
            className={`life-first__tab${tab === '첫 자취' ? ' is-active' : ''}`}
            aria-current={tab === '첫 자취' ? 'page' : undefined}
          >
            {tab}
          </span>
        ))}
      </nav>

      <main className="life-first__scroll">
        {/* ============ ① 좋은 집인지 살펴봐요 — 정보만 전달한다 ============ */}
        <section className="house-check">
          <div className="house-check__head">
            <h2>좋은 집인지 살펴봐요</h2>
            <p>집을 보러 갔을 때 꼭 확인해볼 생활 조건이에요.</p>
          </div>

          {/* 카드 4장이 아니라, 정보 4개가 하나의 패널에 정리된 형태다 */}
          <ul className="house-check__panel">
            {HOUSE_POINTS.map((point) => (
              <li key={point.key} className="house-point">
                <span className={`house-point__badge house-point__badge--${point.key}`}>
                  <img src={icon(point.file)} alt="" />
                </span>
                <span className="house-point__text">
                  <strong>{point.name}</strong>
                  <em>{point.desc}</em>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ============ ② 계약부터 입주까지 — 직접 체크하는 영역 ============ */}
        <section className="contract-check">
          <div className="contract-check__head">
            <h2>계약부터 입주까지 챙겨봐요</h2>

            {/* 상태 텍스트가 아니라 고를 수 있는 단계라는 게 보이도록 pill + chevron 으로 둔다 */}
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

          <div className="contract-check__progress">
            <span className="contract-check__count">
              {done}/{CONTRACT_CHECKS.length} 완료
            </span>
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
          </div>

          <ul className="contract-check__list">
            {CONTRACT_CHECKS.map((item) => {
              const isDone = checked.includes(item.key);
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`contract-item${isDone ? ' is-done' : ''}`}
                    aria-pressed={isDone}
                    onClick={() => toggleCheck(item.key)}
                  >
                    <img src={icon(isDone ? 'life-check-on.svg' : 'life-check-off.svg')} alt="" />
                    <span className="contract-item__text">
                      <strong>{item.name}</strong>
                      <em>{item.desc}</em>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ============ ③ 자취 선배들의 후회 — 넘겨보는 콘텐츠 ============ */}
        <section className="regret">
          <h2>자취 선배들은 이걸 후회했어요</h2>
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
        myMenu={DEFAULT_MENU}
        onClose={() => setGnbOpen(false)}
        onEditMenu={() => setGnbOpen(false)}
      />
      <AIChatbot />
    </div>
  );
}

export default LifeFirstPage;
