import { useMemo, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { CategoryTabs } from '../components/homecare/CategoryTabs';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { DEFAULT_TRASH_QUERY, HOUSE_ROUTINES, HOUSE_TIP, findTrashItem } from '../data/lifeHouse';
import { icon, img } from '../lib/asset';

/* 생활 > 살림 — 버릴 물건을 검색해 분리배출 방법을 바로 확인하고, 놓치기 쉬운 집안 루틴을
 * 챙기고, 지금 볼 만한 살림 팁을 훑어보는 화면이다. Figma daily_living (2289:24128).
 * 목적: "이거 어떻게 버리지?" 같은 사소하지만 매번 헷갈리는 생활 판단을 빠르게 도와준다. */
export function LifeHousePage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [query, setQuery] = useState(DEFAULT_TRASH_QUERY);

  const result = useMemo(() => findTrashItem(query), [query]);

  return (
    <div className="life-house app">
      <SubPageHeader
        title="생활"
        backLabel="생활로"
        onBack={() => navigation?.navigate('life')}
        onMenu={() => setGnbOpen(true)}
      />

      <CategoryTabs active="house" />

      <main className="life-house__scroll">
        {/* ============ 인트로 ============ */}
        <div className="lh-intro">
          <h2>
            혼자 살면 은근히 헷갈리는 것들,
            <br />
            필요한 정보만 빠르게 확인해요
          </h2>
          <p>내 지역과 생활 주기에 맞춰 먼저 보여드릴게요.</p>
        </div>

        {/* ============ ① 버리기 전에 확인해요 ============ */}
        <section className="lh-section">
          <h2>버리기 전에 확인해요</h2>

          <label className="lh-search">
            <img src={icon('life-house-search.svg')} alt="" className="lh-search__icon" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="버릴 물건을 검색해보세요"
              aria-label="버릴 물건 검색"
            />
          </label>

          {result ? (
            <div className="lh-result">
              <p className="lh-result__meta">‘{query}’로 검색했어요</p>
              <div className="lh-result__head">
                <p className="lh-result__name">{result.name}</p>
                <span className="lh-result__tag">
                  {result.category}
                  <button type="button" aria-label="검색 지우기" onClick={() => setQuery('')}>
                    <img src={icon('life-house-close.svg')} alt="" />
                  </button>
                </span>
              </div>
              <p className="lh-result__body">
                {result.lines[0]}
                <br />
                {result.lines[1]}
              </p>
            </div>
          ) : (
            query.trim() && (
              <p className="lh-empty">아직 등록되지 않은 항목이에요. 다른 이름으로 검색해보세요.</p>
            )
          )}
        </section>

        {/* ============ ② 잊기 전에 챙겨요 ============ */}
        <section className="lh-section">
          <div className="lh-section__head">
            <h2>잊기 전에 챙겨요</h2>
            <span className="lh-add">
              <img src={icon('life-house-plus.svg')} alt="" />
              루틴 추가하기
            </span>
          </div>

          <ul className="lh-routines">
            {HOUSE_ROUTINES.map((routine) => (
              <li key={routine.id} className="lh-routine">
                <div className="lh-routine__top">
                  <span className="lh-routine__name">
                    <img src={icon(routine.iconFile)} alt="" />
                    {routine.name}
                  </span>
                  <span className={`lh-routine__dday${routine.urgent ? ' is-urgent' : ''}`}>
                    {routine.ddayLabel}
                  </span>
                </div>
                <p className="lh-routine__meta">
                  마지막 관리 {routine.lastCheckedLabel} · 권장 {routine.intervalLabel}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ============ ③ 지금 챙겨볼 살림 팁 ============ */}
        <section className="lh-section">
          <div className="lh-section__head">
            <h2>지금 챙겨볼 살림 팁</h2>
            <span className="lh-more">
              더보기
              <img src={icon('life-house-arrow.svg')} alt="" />
            </span>
          </div>

          <article className="lh-tip">
            <img src={img(`life/${HOUSE_TIP.image}`)} alt="" className="lh-tip__photo" />
            <div className="lh-tip__box">
              <p className="lh-tip__title">{HOUSE_TIP.title}</p>
              <p className="lh-tip__subtitle">{HOUSE_TIP.subtitle}</p>
            </div>
          </article>
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

export default LifeHousePage;
