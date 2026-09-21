import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { AdDetailSheet } from '../components/AdDetailSheet';
import { aiFabRef } from '../components/ai/aiFabRef';
import { triggerAiFabDemoMove } from '../components/ai/aiFabDemoMove';
import { BottomNavigation } from '../components/BottomNavigation';
import { Coachmark } from '../components/Coachmark';
import type { CoachmarkStep } from '../components/Coachmark';
import { DiscoverySection } from '../components/DiscoverySection';
import { Greeting } from '../components/Greeting';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { HomeBenefitBanner } from '../components/HomeBenefitBanner';
import { HomeRecommendSettings } from '../components/HomeRecommendSettings';
import type { RecommendDraft } from '../components/HomeRecommendSettings';
import { HomeSheet } from '../components/HomeSheet';
import { HomeTimePreview } from '../components/HomeTimePreview';
import { MyLifeSection } from '../components/MyLifeSection';
import type { AdContent } from '../data/adContents';
import {
  MENU_WIDGET_DEFS,
} from '../data/menuWidgets';
import type { SelectedMenuWidget } from '../data/menuWidgets';
import { MENU_CATALOG } from '../data/menuCatalog';
import { initializeLivingProfileFromOnboarding, loadLivingProfile, saveLivingProfile } from '../data/livingProfile';
import { DEFAULT_PERSONA, HOME_PERSONA_CONTENT, greetingName } from '../data/personaHome';
import { PERSONA_PROFILE } from '../data/personaProfile';
import { useAuth } from '../auth/AuthContext';
import { getDemoAccountId } from '../auth/mockUsers';
import { isCoachmarkSeen, markCoachmarkSeen } from '../auth/coachmarkProgress';
import { useSheetGesture } from '../hooks/useSheetGesture';
import { useDragToClose } from '../hooks/useDragToClose';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useMenuWidgetSelection } from '../widgets/MenuWidgetSelectionContext';
import { getHomeTimePeriod, type HomeTimeOverride, type HomeTimePeriod } from '../lib/homeTimeBackground';

/* Home 화면 — 모든 레이어는 라우트가 아니라 상태로 열린다.
 *
 *   Home
 *    └─ '내 메뉴'는 { id, type, size, order } 위젯 아이템 배열(data/menuWidgets.ts)을 그린다.
 *       위젯 추가·삭제·재정렬은 이 배열만 바꾸면 되도록 화면은 order 순서로 그리기만 한다.
 *
 * 시트 안은 다시 두 개의 View 로 나뉜다 — 새 시트를 겹쳐 띄우지 않고 콘텐츠만 바꾼다.
 *
 *   HomeSheet
 *    ├─ 'home'      : 내 메뉴 + 자두가 알려드려요
 *    └─ 'recommend' : 맞춤 추천 설정
 */

export function Home() {
  const [homeTimePeriod, setHomeTimePeriod] = useState<HomeTimePeriod>(() => getHomeTimePeriod(new Date()));
  const [homeTimeOverride, setHomeTimeOverride] = useState<HomeTimeOverride>('auto');
  /* 현재 로그인한 사용자의 persona 로 Home 콘텐츠를 고른다 */
  const { user } = useAuth();
  const isDemoAccount = !!user?.email && getDemoAccountId(user.email) !== null;
  const persona = user?.persona ?? DEFAULT_PERSONA;
  const content = HOME_PERSONA_CONTENT[persona];
  const personaProfile = PERSONA_PROFILE[persona];
  /* 맞춤 추천 설정의 저장값은 마이페이지 자취 프로필과 같은 계정별 키를 쓴다
   * (data/livingProfile.ts) — 계정을 바꾸면 다른 계정 값과 섞이지 않는다 */
  const ownerKey = user?.email ?? 'guest';
  /* 온보딩 선택은 추천 설정이 비어 있는 최초 1회에만 초기값으로 옮긴다.
   * 사용자가 추천 설정에서 관심 주제를 하나라도 저장한 뒤에는 다시 덮어쓰지 않는다. */
  useState(() => initializeLivingProfileFromOnboarding(ownerKey, personaProfile, user?.preferences ? {
    interests: user.preferences.answers.interests ?? [],
    stage: user.preferences.answers.stage?.[0] ?? '',
  } : null));

  const navigation = useAppNavigation();
  const sheet = useSheetGesture();
  const heroScrollGestureRef = useRef<{ pointerId: number; startY: number } | null>(null);
  const [bottomNavigationVisible, setBottomNavigationVisible] = useState(true);

  /* peek 상태에서 시트 밖 Hero를 스크롤해도 시트가 올라오게 한다. wheel은 아래 방향,
   * touch/pen은 위로 40px 이상 움직였을 때만 반응하며 시트 내부 제스처는 기존 훅에 맡긴다. */
  const handleHeroWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (sheet.state !== 'peek' || event.deltaY <= 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('.sheet')) return;
    sheet.apply('expanded');
  };
  const handleHeroPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (sheet.state !== 'peek' || event.pointerType === 'mouse') return;
    const target = event.target as HTMLElement;
    if (target.closest('.sheet')) return;
    heroScrollGestureRef.current = { pointerId: event.pointerId, startY: event.clientY };
  };
  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = heroScrollGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (event.clientY - gesture.startY > -40) return;
    heroScrollGestureRef.current = null;
    sheet.apply('expanded');
  };
  const clearHeroPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (heroScrollGestureRef.current?.pointerId === event.pointerId) heroScrollGestureRef.current = null;
  };

  /* 시트가 펼쳐지거나 드래그를 시작하면 탭바를 즉시 제거한다.
   * 닫힐 때는 시트 이동(transform) 전환이 끝난 뒤에만 다시 렌더링해, 시트가 내려가는 중간에
   * 탭바가 먼저 튀어나오지 않게 한다. 탭바는 absolute 요소이고 시트 스크롤
   * padding은 그대로 유지하므로 본문 높이와 스크롤 위치는 변하지 않는다. */
  useLayoutEffect(() => {
    if (sheet.state === 'expanded' || sheet.isDragging) {
      setBottomNavigationVisible(false);
      return;
    }

    const sheetElement = sheet.sheetRef.current;
    if (!sheetElement || bottomNavigationVisible) return;

    const revealBottomNavigation = () => setBottomNavigationVisible(true);
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === sheetElement && event.propertyName === 'transform') revealBottomNavigation();
    };

    sheetElement.addEventListener('transitionend', onTransitionEnd);

    /* reduced-motion이거나 브라우저가 transitionend를 발생시키지 않는 경우의 보험. */
    const transition = window.getComputedStyle(sheetElement);
    const duration = Number.parseFloat(transition.transitionDuration) * 1000;
    const delay = Number.parseFloat(transition.transitionDelay) * 1000;
    const fallback = window.setTimeout(revealBottomNavigation, duration + delay + 50);

    return () => {
      sheetElement.removeEventListener('transitionend', onTransitionEnd);
      window.clearTimeout(fallback);
    };
  }, [bottomNavigationVisible, sheet.isDragging, sheet.sheetRef, sheet.state]);
  /* 메뉴 관리와 같은 asset 단위 선택값을 구독한다. 삭제·재정렬도 이 공통 상태만 변경한다. */
  const { selectedWidgets: menuWidgets, removeWidget, reorderWidgets } = useMenuWidgetSelection();
  const [menuEditing, setMenuEditing] = useState(false);
  const openMenuWidget = (item: SelectedMenuWidget) => {
    const menu = MENU_CATALOG.flatMap((section) => section.items).find((entry) => entry.id === item.menuId);
    const def = menu?.widgetType ? MENU_WIDGET_DEFS[menu.widgetType] : null;
    if (!def) return;
    navigation?.navigate(def.page, def.options);
  };

  /* 홈 본문과 별개로 그 위에 올라오는 추천 설정 overlay 상태 */
  const [recommendationSettingsOpen, setRecommendationSettingsOpen] = useState(false);
  const [recommendationSettingsClosing, setRecommendationSettingsClosing] = useState(false);
  /* 맞춤 추천 설정 View 에서 편집 중인 draft — 저장 전까지는 여기서만 바뀐다.
   * 실제 저장값(source of truth)은 마이페이지와 같은 livingProfile 이다(data/livingProfile.ts) —
   * 이 state 는 그 값을 복제해 영구 보관하는 곳이 아니라, 시트가 열려 있는 동안의
   * 편집용 임시값일 뿐이다. */
  const [recommendDraft, setRecommendDraft] = useState<RecommendDraft>(() => {
    const saved = loadLivingProfile(ownerKey, personaProfile);
    return { topics: saved.topics };
  });
  /* 광고 상세 바텀시트 — 홈 화면 전체를 덮어야 해서 스크롤 영역 안(DiscoverySection)이 아니라
   * 여기서 연다. 닫는 동안 내용이 사라지지 않게 열림 여부와 마지막 광고를 따로 든다. */
  const [adDetail, setAdDetail] = useState<{ ad: AdContent | null; open: boolean }>({ ad: null, open: false });
  const openAd = (ad: AdContent) => setAdDetail({ ad, open: true });
  const closeAd = () => setAdDetail((current) => ({ ...current, open: false }));

  /* 홈 시트의 위치와 스크롤은 건드리지 않고 내부 설정 패널만 연다. */
  const openRecommendSetup = () => {
    setRecommendationSettingsClosing(false);
    setRecommendationSettingsOpen(true);
  };

  const closeRecommendSetup = () => setRecommendationSettingsClosing(true);
  const recommendPanelDrag = useDragToClose(closeRecommendSetup);

  useEffect(() => {
    if (!recommendationSettingsClosing) return;
    const timer = window.setTimeout(() => {
      setRecommendationSettingsOpen(false);
      setRecommendationSettingsClosing(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [recommendationSettingsClosing]);

  /* 설정 저장하기 — draft 의 관심 주제만 livingProfile 에 반영한다.
   * 자취 경험·주거 형태 등 이 화면이 다루지 않는 값은 그대로 둔다. */
  const saveRecommendSetup = (draft: RecommendDraft) => {
    const saved = loadLivingProfile(ownerKey, personaProfile);
    saveLivingProfile(ownerKey, { ...saved, topics: draft.topics });
    setRecommendDraft(draft);
    closeRecommendSetup();
  };

  /* 홈 코치마크(첫 진입 4단계 가이드) — 이서준과 이서준으로 새로 가입한 일반 테스트
   * 계정(둘 다 persona: 'beginner')에서만, 계정당 한 번만 뜬다. 계정이 바뀌면 Home 이
   * key={user.email} 로 다시 마운트되므로(App.tsx) lazy state 로 한 번만 계산해도 된다. */
  const [coachmarkOpen, setCoachmarkOpen] = useState(
    () => persona === 'beginner' && !!user?.email && !isCoachmarkSeen(user.email),
  );
  const finishCoachmark = () => {
    if (user?.email) markCoachmarkSeen(user.email);
    setCoachmarkOpen(false);
    /* 투어 때문에 강제로 올렸던 시트를 원래 진입 모습(peek)으로 되돌린다 */
    sheet.apply('peek');
  };
  /* 3·4단계 타겟(위젯 추가 슬롯, AI 챗봇)은 peek 상태에선 시트 아래로 가려 안 보인다 —
   * 해당 단계에 들어서면 시트를 강제로 올리고, 1·2단계로 돌아오면 다시 내린다. */
  const onCoachmarkStepChange = (step: CoachmarkStep) => {
    if (step.sheetState && step.sheetState !== sheet.state) sheet.apply(step.sheetState);
    /* "자두는 원하는 곳으로 이동할 수 있어요" 단계 — 말로 설명하는 대신 버튼이 실제로
     * 반대쪽까지 갔다 돌아오는 모습을 보여준다(AIChatbotButton.tsx 가 재생). */
    if (step.key === 'move') triggerAiFabDemoMove();
  };

  /* 강조할 실제 DOM — 좌표를 하드코딩하지 않고 Coachmark 가 매 단계 실측한다 */
  const benefitBannerRef = useRef<HTMLButtonElement>(null);
  const menuGridRef = useRef<HTMLUListElement>(null);

  /* useMemo 로 고정한다 — 배열 리터럴을 렌더마다 새로 만들면 stepIndex 가 그대로여도
   * steps[stepIndex] 객체 참조가 매번 바뀌어, Coachmark 의 재측정 effect(참조가 dep)가
   * Home 이 재렌더될 때마다 다시 걸린다. sheet.apply() 로 시트가 올라가는 동안(peek→
   * expanded, 320ms)에도 Home 이 여러 번 재렌더되는데, 그때마다 "아직 안 바뀐" 이전
   * 단계 타겟(시트 안에 있어 함께 떠오르는 중)을 다시 재서, 스포트라이트가 다음 단계로
   * 넘어가기도 전에 시트를 따라 위로 슬쩍 튀었다가 새 위치로 다시 튀는 문제가 있었다. */
  const coachmarkSteps: CoachmarkStep[] = useMemo(() => [
    {
      key: 'notice',
      title: '나에게 맞는 혜택 찾기',
      body: '자취 생활에 도움이 되는 지원사업·혜택을\n한 번에 모아 확인할 수 있어요.',
      targetRef: benefitBannerRef,
      radius: 20,
      sheetState: 'peek',
    },
    {
      key: 'menu',
      title: '자주 쓰는 메뉴만 쏙 모아보세요',
      body: '자주 쓰는 기능을 골라\n나만의 메뉴를 만들어보세요.',
      targetRef: menuGridRef,
      radius: 16,
      /* peek 상태에선 내 메뉴 위젯이 시트 아래로 가려 안 보인다 */
      sheetState: 'expanded',
    },
    {
      key: 'chatbot',
      title: '자취생활이 궁금할 땐, 자두야 AI!',
      body: '생활 · 혜택 · 돈 관리까지\n궁금한 건 뭐든 물어보세요.',
      targetRef: aiFabRef,
      radius: 'circle',
      sheetState: 'expanded',
    },
    {
      key: 'move',
      title: '자두를 원하는 곳으로 옮겨보세요',
      body: '길게 눌러 편한 위치에 놓을 수 있어요.',
      targetRef: aiFabRef,
      radius: 'circle',
      sheetState: 'expanded',
      /* 이 단계에서만 버튼이 데모 애니메이션으로 실제 움직인다 — 스포트라이트가
       * 그 이동을 따라가야 해서 계속 재측정이 필요하다(Coachmark.tsx 참고). */
      trackContinuously: true,
    },
  ], [benefitBannerRef, menuGridRef]);

  return (
    <div
      className={`home app${homeTimePeriod === 'night' ? ' is-night' : ''}${sheet.isDragging ? ' is-dragging' : ''}`}
      data-sheet-state={sheet.state}
      onWheelCapture={handleHeroWheel}
      onPointerDownCapture={handleHeroPointerDown}
      onPointerMoveCapture={handleHeroPointerMove}
      onPointerUpCapture={clearHeroPointer}
      onPointerCancelCapture={clearHeroPointer}
    >
      <Hero
        showFallingLeaves={isDemoAccount}
        timeOverride={homeTimeOverride}
        onTimePeriodChange={setHomeTimePeriod}
      />

      <Header
        beforeBell={isDemoAccount ? (
          <HomeTimePreview value={homeTimeOverride} onChange={setHomeTimeOverride} />
        ) : undefined}
      />

      {sheet.state === 'expanded' && !recommendationSettingsOpen && (
        <button
          type="button"
          className="home-sheet-dismiss-area"
          aria-label="홈 대시보드 접기"
          onClick={() => sheet.apply('peek')}
        />
      )}

      <Greeting name={greetingName(user?.name ?? '')} hero={content.hero} />

      <HomeBenefitBanner
        onClick={() => navigation?.navigate('benefits')}
        bannerRef={benefitBannerRef}
      />

      <HomeSheet
        state={sheet.state}
        sheetRef={sheet.sheetRef}
        scrollRef={sheet.scrollRef}
        handleRef={sheet.handleRef}
        handleProps={recommendationSettingsOpen ? recommendPanelDrag.handleProps : sheet.handleProps}
        overlay={recommendationSettingsOpen ? (
          <div
            className={`recommend-panel${recommendationSettingsClosing ? ' is-closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-recommend-title"
            style={recommendationSettingsClosing ? undefined : { transform: `translateY(${recommendPanelDrag.dragY}px)` }}
          >
            <div className="recommend-panel__scroll">
              <HomeRecommendSettings
                value={recommendDraft}
                onClose={closeRecommendSetup}
                onSave={saveRecommendSetup}
                onChange={setRecommendDraft}
              />
            </div>
          </div>
        ) : null}
      >
        <div className="sheet-view sheet-view--home">
          <MyLifeSection
            widgets={menuWidgets}
            editing={menuEditing}
            onOpenWidget={openMenuWidget}
            onManageMenu={() => navigation?.navigate('widget-gallery')}
            onEnterEdit={() => setMenuEditing(true)}
            onExitEdit={() => setMenuEditing(false)}
            onRemoveWidget={removeWidget}
            onReorderWidgets={reorderWidgets}
            gridRef={menuGridRef}
          />
          <DiscoverySection onOpenRecommendSetup={openRecommendSetup} onOpenAd={openAd} />
        </div>
      </HomeSheet>

      {bottomNavigationVisible ? (
        <BottomNavigation />
      ) : sheet.state === 'expanded' && !recommendationSettingsOpen ? (
        <HomeBenefitBanner
          fixed
          onClick={() => navigation?.navigate('benefits')}
        />
      ) : null}

      <AdDetailSheet ad={adDetail.ad} open={adDetail.open} onClose={closeAd} />

      {coachmarkOpen && (
        <Coachmark
          steps={coachmarkSteps}
          onFinish={finishCoachmark}
          onStepChange={onCoachmarkStepChange}
        />
      )}
    </div>
  );
}
