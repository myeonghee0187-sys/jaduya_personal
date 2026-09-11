import { useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { CategoryTabs } from '../components/homecare/CategoryTabs';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { FRIDGE_ITEMS, KEEP_TIP, RECIPES } from '../data/lifeEat';
import { icon, img } from '../lib/asset';

/* 생활 > 먹거리 — 냉장고에서 곧 상할 재료를 먼저 보여주고, 그 재료로 만들 수 있는 간단한
 * 레시피와 오래 보관하는 방법까지 이어서 안내한다. Figma daily_eat (3084:23495).
 * 목적: "이 재료 상하기 전에 뭘 해먹지?" 를 빠르게 해결해준다. */
export function LifeEatPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);

  return (
    <div className="life-eat app">
      <SubPageHeader
        title="생활"
        backLabel="생활로"
        onBack={() => navigation?.navigate('life')}
        onMenu={() => setGnbOpen(true)}
      />

      <CategoryTabs active="food" />

      <main className="life-eat__scroll">
        {/* ============ 인트로 ============ */}
        <div className="le-intro">
          <h2>
            냉장고 속 재료,
            <br />
            버리지 않고 다 먹어요
          </h2>
          <p>먼저 먹을 재료부터 확인하고 남은 재료로 한 끼를 챙겨요.</p>
        </div>

        {/* ============ ① 곧 먹어야 해요 ============ */}
        <section className="le-section le-section--eat">
          <div className="le-section__head">
            <h2>곧 먹어야 해요</h2>
            <span className="le-add">
              보관 중인 재료 추가
              <img src={icon('life-eat-plus.svg')} alt="" />
            </span>
          </div>

          <ul className="le-items">
            {FRIDGE_ITEMS.map((item) => (
              <li key={item.id} className="le-item">
                <div className="le-item__top">
                  <span className="le-item__name">{item.name}</span>
                  <span className="le-item__dday">{item.ddayLabel}</span>
                </div>
                <p className="le-item__detail">
                  {item.amountIsNumeric ? (
                    <>
                      <span className="le-item__detail--numeric">{item.amount} · </span>
                      {item.storage}
                    </>
                  ) : (
                    `${item.amount} · ${item.storage}`
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ============ ② 남은 재료부터 비워봐요 ============ */}
        <section className="le-section">
          <h2>남은 재료부터 비워봐요</h2>

          <div className="le-recipes">
            {RECIPES.map((recipe) => (
              <article key={recipe.id} className="le-recipe">
                <img src={img(`life/${recipe.image}`)} alt="" className="le-recipe__photo" />
                <p className="le-recipe__title">{recipe.title}</p>
                <p className="le-recipe__tags">
                  # {recipe.tags[0]} # {recipe.tags[1]}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ ③ 이렇게 보관해봐요! ============ */}
        <section className="le-section">
          <h2>이렇게 보관해봐요!</h2>

          <div className="le-keep">
            <p className="le-keep__meta">{KEEP_TIP.meta}</p>
            <p className="le-keep__quote">
              {KEEP_TIP.quoteLines[0]}
              <br />
              {KEEP_TIP.quoteLines[1]}
            </p>
            <p className="le-keep__body">
              {KEEP_TIP.bodyLines[0]}
              <br />
              {KEEP_TIP.bodyLines[1]}
            </p>
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

export default LifeEatPage;
