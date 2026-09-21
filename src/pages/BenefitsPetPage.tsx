import { useEffect, useMemo, useRef, useState } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { BenefitCard } from '../components/BenefitCard';
import { useAppNavigation } from '../navigation/AppNavigation';
import {
  BENEFIT_CATEGORIES,
  BENEFIT_CATEGORY_PAGES,
  BENEFIT_SORTS,
  benefitListItemsByCategory,
  sortBenefitListItems,
} from '../data/benefits';
import type { BenefitSort } from '../data/benefits';
import { icon } from '../lib/asset';

const PET_BENEFITS = benefitListItemsByCategory('반려동물');

/* 혜택·복지 '반려동물' 탭 — 전체 탭과 같은 레이아웃을 재사용한다.
 * AI맞춤 혜택 추천에서 이미 쓰던 성남시 반려동물 진료비 지원을 그대로 가져온다.
 * 성남시 칩은 전체 탭에만 있어 이 화면에는 두지 않는다.
 * 정렬(추천순/인기순)은 커뮤니티 댓글 정렬과 같은 community-filter 드롭다운 디자인을 쓴다. */
export function BenefitsPetPage() {
  const navigation = useAppNavigation();
  const [sort, setSort] = useState<BenefitSort>(BENEFIT_SORTS[0]);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const sortedBenefits = useMemo(() => sortBenefitListItems(PET_BENEFITS, sort), [sort]);

  useEffect(() => {
    if (!sortOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [sortOpen]);

  return (
    <div className="benefits app">
      <SubPageHeader
        title="혜택·복지"
        backLabel="홈으로"
        onBack={() => navigation?.goBack('home')}
      />

      <main className="benefits__scroll">
        <nav className="benefits-tabs" role="tablist" aria-label="혜택 카테고리">
          {BENEFIT_CATEGORIES.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={name === '반려동물'}
              className={`benefits-tabs__item${name === '반려동물' ? ' is-active' : ''}`}
              onClick={() => name !== '반려동물' && navigation?.navigateTab(BENEFIT_CATEGORY_PAGES[name])}
            >
              {name}
            </button>
          ))}
        </nav>

        <section className="benefits-hero" aria-labelledby="benefits-ai-title">
          <div className="benefits-ai__top">
            <img className="benefits-ai__avatar" src={icon('ai-avatar.svg')} alt="" />
            <div className="benefits-ai__copy">
              <h2 id="benefits-ai-title">내 조건에 맞는 것만 골라볼까요?</h2>
              <p>나이 · 지역 · 직업 · 반려동물까지 한 번에 반영해요</p>
            </div>
          </div>
          <button
            type="button"
            className="benefits-ai__button"
            onClick={() => navigation?.navigate('benefits-recommend', {
              returnTo: 'benefits-pet',
              returnOptions: navigation.options,
            })}
          >
            <span className="benefits-ai__sparkle" aria-hidden="true" />
            AI 맞춤 혜택 추천 보기
          </button>
        </section>

        <div className="benefits-sheet">
          <section className="benefits-list" aria-labelledby="benefits-list-title">
            <div className="benefits-list__header">
              <div>
                <h2 id="benefits-list-title">반려동물 지원 혜택</h2>
              </div>
              <div className="community-filter" ref={sortRef}>
                <button
                  type="button"
                  className="community-filter__button"
                  aria-expanded={sortOpen}
                  aria-haspopup="listbox"
                  onClick={() => setSortOpen((open) => !open)}
                >
                  {sort}
                  <span className="community-filter__button-arrow" aria-hidden="true" />
                </button>
                <ul className="community-filter__list" role="listbox" hidden={!sortOpen}>
                  {BENEFIT_SORTS.map((option) => (
                    <li key={option} role="option" aria-selected={option === sort}>
                      <button
                        type="button"
                        className={option === sort ? 'is-selected' : undefined}
                        onClick={() => {
                          setSort(option);
                          setSortOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {sortedBenefits.length === 0 ? (
              <p className="benefits-list__empty">아직 등록된 반려동물 지원 혜택이 없어요</p>
            ) : (
              <div className="benefits-cards">
                {sortedBenefits.map((benefit) => (
                  <BenefitCard key={benefit.id} item={benefit} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNavigation activeTab="home" />
    </div>
  );
}

export default BenefitsPetPage;
