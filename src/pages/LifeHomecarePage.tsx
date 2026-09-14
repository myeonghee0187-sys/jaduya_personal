import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { CategoryTabs } from '../components/homecare/CategoryTabs';
import { ChipGroup } from '../components/homecare/ChipGroup';
import { GuideTimeline } from '../components/homecare/GuideTimeline';
import { StepCard } from '../components/homecare/StepCard';
import { ServiceCard } from '../components/homecare/ServiceCard';
import { usePrefersReducedMotion } from '../components/homecare/usePrefersReducedMotion';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { PROBLEM_TYPES, HOMECARE_CATEGORIES, HOMECARE_GUIDE_SCENARIOS } from '../data/homecareGuide';
import type { ProblemKey } from '../data/homecareGuide';

const GUIDE_TITLE_EASE = [0.22, 1, 0.36, 1] as const;

/* STEP04 서비스 카드 — 이 컨테이너는 자기만의 트리거(useInView 등)를 두지 않는다.
 * GuideTimeline.tsx 의 STEP04 content wrapper(.dc-timeline__content 의 두 번째
 * motion.div)가 revealed[3] 에 따라 "hidden"/"visible" 을 결정하면, variants 만 가진
 * 이 자식은 그 상태를 그대로 물려받는다(Motion 의 variant propagation) — 그래서
 * "04 다른 도움이 필요하다면" 라벨이 뜨는 것과 같은 순간에 서비스 카드들이 이어서
 * 약하게 stagger 되며 등장한다. revealed 는 한 번 true 가 되면 되돌리지 않으므로
 * 위로 스크롤해도 다시 사라지지 않는다. */
const servicesContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const serviceItemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: GUIDE_TITLE_EASE } },
};

/* 생활 > 홈케어 — 문제 유형(카테고리) → 1차 선택 → 2차 선택 세 단계로 상황을 좁히면
 * 상황 안내 제목·질문·Chip·"현재 선택" 문구·해결 가이드가 전부 데이터에서 조회되어 바뀐다.
 * Figma daily_care (2008:9698 / 2289:24032).
 * 목적: 집에 생긴 문제를 유형별로 짚어보고 지금 할 수 있는 해결 방법을 순서대로 안내한다.
 *
 * 카테고리마다 JSX 를 따로 두지 않는다 — HomecareCategory 데이터 하나를 조회해
 * 같은 UI(문제 유형 Chip → 1차·2차 Chip → GuideTimeline)를 그대로 재사용한다.
 * 상황이 새로 추가되면 homecareGuide.ts 에 데이터만 더하면 된다. */
export function LifeHomecarePage() {
  const navigation = useAppNavigation();
  const reduceMotion = usePrefersReducedMotion();
  const [gnbOpen, setGnbOpen] = useState(false);
  /* Timeline Active Progress 가 기준으로 삼는 실제 스크롤 컨테이너 — 이 페이지는
   * window 가 아니라 .daily-care__scroll 안에서 스크롤된다. */
  const scrollContainerRef = useRef<HTMLElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<ProblemKey>('mold');
  const category = HOMECARE_CATEGORIES[selectedCategory];
  const [selectedPrimary, setSelectedPrimary] = useState(category.defaultPrimary);
  const [selectedSeverity, setSelectedSeverity] = useState(category.defaultSecondary);

  /* 카테고리를 바꾸면 그 카테고리의 기본 1차·2차 선택으로 되돌린다 —
   * 이전 카테고리에서 고른 값(예: 벌레의 "자주")이 곰팡이에 그대로 남아있으면 안 된다. */
  const selectCategory = (key: ProblemKey) => {
    const next = HOMECARE_CATEGORIES[key];
    setSelectedCategory(key);
    setSelectedPrimary(next.defaultPrimary);
    setSelectedSeverity(next.defaultSecondary);
  };

  const primaryLabel = category.primaryOptions.find((option) => option.key === selectedPrimary)?.label;
  const severityLabel = category.secondaryOptions.find((option) => option.key === selectedSeverity)?.label;
  const currentSelectionText = [primaryLabel, severityLabel].filter(Boolean).join(' · ');

  /* 해결 가이드는 반드시 category + primary + severity 세 값을 모두 써서 하나의 완성된
   * Scenario 를 조회한다 — 이 3차원 조회 자체가 매 렌더마다 다시 계산되므로 세 값 중
   * 무엇이 바뀌어도(1차 선택만 바뀌어도, 2차 선택만 바뀌어도) STEP01~04가 즉시 갱신된다.
   * 잘못된 key 조합으로 화면이 깨지지 않도록, 없으면 그 카테고리의 기본 조합으로 fallback한다
   * (정상 카테고리는 48개 전부 존재해서 이 fallback 이 실제로 쓰일 일은 없다 — findMissingHomecareScenarios 로 확인됨). */
  const scenario =
    HOMECARE_GUIDE_SCENARIOS[selectedCategory]?.[selectedPrimary]?.[selectedSeverity] ??
    HOMECARE_GUIDE_SCENARIOS[selectedCategory][category.defaultPrimary][category.defaultSecondary];

  /* Guide 가 바뀔 때(카테고리·1차·2차 중 무엇이든) 가이드 제목과 GuideTimeline을 이 key 로
   * 다시 마운트한다. 가이드 제목은 이 remount 로 짧게 다시 fade-in 하고, GuideTimeline은
   * 이 remount 덕분에 새 Guide의 실제 DOM(마커 위치 등)을 처음부터 다시 측정한다 —
   * Timeline의 Active Progress 자체는 더 이상 mount 시 자동 재생되지 않고 항상
   * .daily-care__scroll 의 실제 스크롤 위치만 따른다(스크롤에 실시간 연동, 되돌릴 수 있음).
   * 빠르게 연속으로 Chip을 눌러도 React 가 이전 마운트를 즉시 정리해줘서 이전 Guide DOM이
   * 남거나 측정값이 꼬이는 문제가 없다. */
  const guideAnimationKey = `${selectedCategory}-${selectedPrimary}-${selectedSeverity}`;

  const timelineItems = [
    { title: scenario.step1.label, children: <StepCard heading={scenario.step1.title} body={scenario.step1.body} /> },
    { title: scenario.step2.label, children: <StepCard heading={scenario.step2.title} body={scenario.step2.body} /> },
    { title: scenario.step3.label, children: <StepCard heading={scenario.step3.title} body={scenario.step3.body} /> },
    {
      title: scenario.step4Label,
      children: (
        <motion.div className="dc-services" variants={servicesContainerVariants}>
          {scenario.services.map((service) => (
            <motion.div key={service.title} variants={serviceItemVariants}>
              <ServiceCard title={service.title} href={service.href} />
            </motion.div>
          ))}
        </motion.div>
      ),
    },
  ];

  return (
    <div className="daily-care app">
      <SubPageHeader
        title="생활"
        backLabel="생활로"
        onBack={() => navigation?.navigate('life')}
        onMenu={() => setGnbOpen(true)}
      />

      <CategoryTabs active="homecare" />

      <main className="daily-care__scroll" ref={scrollContainerRef}>
        {/* ============ ① 문제 유형 ============ */}
        <section className="dc-section">
          <div className="dc-section__head">
            <h2>
              집에 문제가 생겼나요?
              <br />
              상황부터 확인하고 해결해봐요.
            </h2>
            <p>문제 유형을 고르면 지금 할 수 있는 방법부터 알려드려요.</p>
          </div>
          <ChipGroup
            ariaLabel="문제 유형"
            variant="type"
            options={PROBLEM_TYPES}
            value={selectedCategory}
            onChange={(key) => selectCategory(key as ProblemKey)}
          />
        </section>
        <hr className="dc-divider" />

        {/* ============ ② 상황 선택 ============ */}
        <section className="dc-section dc-section--situation">
          <h2 className="dc-question">{category.question}</h2>
          <div className="dc-fields">
            <div className="dc-field">
              <p className="dc-field__label">{category.primaryLabel}</p>
              <ChipGroup
                ariaLabel={category.primaryLabel}
                variant="pill"
                options={category.primaryOptions}
                value={selectedPrimary}
                onChange={setSelectedPrimary}
              />
            </div>
            <div className="dc-field">
              <p className="dc-field__label">{category.secondaryLabel}</p>
              <ChipGroup
                ariaLabel={category.secondaryLabel}
                variant="pill"
                options={category.secondaryOptions}
                value={selectedSeverity}
                onChange={setSelectedSeverity}
              />
            </div>
          </div>
        </section>
        <hr className="dc-divider" />

        {/* ============ ③ 해결 가이드 ============ */}
        {/* key 를 motion 엘리먼트에 직접 주면 옛 인스턴스가 정리되지 않고 새 인스턴스와
         * 함께 남는 문제가 있어(Motion + key 리마운트 상호작용), 평범한 div 하나에 key 를
         * 주고 그 안에서 motion.div 를 쓴다 — 평범한 엘리먼트의 key 교체는 GuideTimeline 도
         * 이미 같은 방식으로 문제없이 동작한다. gap 은 기존 .dc-section 의 flex gap(24px)과
         * 동일하게 인라인으로 맞춰 spacing 이 바뀌지 않게 한다. */}
        <section className="dc-section dc-section--guide">
          <div key={guideAnimationKey} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div
              className="dc-guide-head"
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: GUIDE_TITLE_EASE }}
            >
              {currentSelectionText && <p className="dc-guide-meta">{currentSelectionText}</p>}
              <h2>{scenario.guideTitle}</h2>
            </motion.div>
            <GuideTimeline items={timelineItems} scrollContainerRef={scrollContainerRef} />
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
    </div>
  );
}

export default LifeHomecarePage;
