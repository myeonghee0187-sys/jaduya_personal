import { useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { HomeRecommendSettings, emptyRecommendDraft } from '../components/HomeRecommendSettings';
import type { RecommendDraft } from '../components/HomeRecommendSettings';
import { HomeSheet } from '../components/HomeSheet';
import { LevelInfoPopover, levelInfoAnchor } from '../components/LevelInfoPopover';
import { MyLifeSection } from '../components/MyLifeSection';
import { initializeLivingProfileFromOnboarding, loadLivingProfile, saveLivingProfile } from '../data/livingProfile';
import { DEFAULT_PERSONA, HOME_PERSONA_CONTENT, greetingName } from '../data/personaHome';
import { LEVEL_STAGE_LIST, PERSONA_PROFILE, resolveLevel } from '../data/personaProfile';
import { useAuth } from '../auth/AuthContext';
import { getDemoAccountId } from '../auth/mockUsers';
import { isCoachmarkSeen, markCoachmarkSeen } from '../auth/coachmarkProgress';
import { useSheetGesture } from '../hooks/useSheetGesture';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useWidgetPlacement } from '../widgets/WidgetPlacementContext';

/* Home 화면 — 모든 레이어는 라우트가 아니라 상태로 열린다.
 *
 *   Home
 *    └─ 위젯 추가(+)는 이제 오버레이가 아니라 별도 페이지(위젯 갤러리)로 이동한다.
 *       내 홈 위젯 상태 자체는 widgets/WidgetPlacementContext 가 화면 전환과 무관하게 들고 있다.
 *
 * 시트 안은 다시 두 개의 View 로 나뉜다 — 새 시트를 겹쳐 띄우지 않고 콘텐츠만 바꾼다.
 *
 *   HomeSheet
 *    ├─ 'home'      : 내 생활 + 자두가 알려드려요
 *    └─ 'recommend' : 맞춤 추천 설정
 */

/** 홈 시트 안에서 보여줄 콘텐츠 */
type HomeSheetView = 'home' | 'recommend';

export function Home() {
  /* 현재 로그인한 사용자의 persona 로 Home 콘텐츠를 고른다 */
  const { user } = useAuth();
  const isDemoAccount = !!user?.email && getDemoAccountId(user.email) !== null;
  const persona = user?.persona ?? DEFAULT_PERSONA;
  const content = HOME_PERSONA_CONTENT[persona];
  const personaProfile = PERSONA_PROFILE[persona];
  /* 하트·레벨은 마이페이지와 같은 원본을 쓴다 (data/personaProfile.ts) */
  const level = resolveLevel(personaProfile.level);
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
  const [bottomNavigationVisible, setBottomNavigationVisible] = useState(true);

  /* 시트가 펼쳐지거나 드래그를 시작하면 탭바를 즉시 제거한다.
   * 닫힐 때는 top 전환이 끝난 뒤에만 다시 렌더링해, 시트가 내려가는 중간에
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
      if (event.target === sheetElement && event.propertyName === 'top') revealBottomNavigation();
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
  /* 내 생활 위젯 배치 — 위젯 관리 화면(WidgetPage)과 공유하는 전역 상태 */
  const placement = useWidgetPlacement();

  /* 시트 안에서 지금 보여줄 View. 페이지 이동이 아니라 이 state 하나로만 갈린다. */
  const [sheetView, setSheetView] = useState<HomeSheetView>('home');
  const [levelInfo, setLevelInfo] = useState<{ top: number; left: number } | null>(null);
  /* 맞춤 추천 설정 View 에서 편집 중인 draft — 저장 전까지는 여기서만 바뀐다.
   * 실제 저장값(source of truth)은 마이페이지와 같은 livingProfile 이다(data/livingProfile.ts) —
   * 이 state 는 그 값을 복제해 영구 보관하는 곳이 아니라, 시트가 열려 있는 동안의
   * 편집용 임시값일 뿐이다. */
  const [recommendDraft, setRecommendDraft] = useState<RecommendDraft>(emptyRecommendDraft);
  /* 한 번이라도 설정 View 를 다녀왔는지 — 돌아올 때만 전환 효과를 준다.
   * (첫 진입에서 시트 콘텐츠가 괜히 움직여 보이지 않게) */
  const cameBackRef = useRef(false);

  const openLevelInfo = (anchorElement: HTMLElement) => {
    const anchor = levelInfoAnchor(anchorElement);
    if (anchor) setLevelInfo(anchor);
  };

  const viewMissions = () => {
    setLevelInfo(null);
    navigation?.navigate('mission');
  };

  /* View 를 바꾸면 시트 스크롤은 항상 맨 위에서 시작한다 — 시트 자체(peek/expanded)와
   * 스크롤 구조는 그대로 두고 scrollTop 만 되돌린다. */
  const showSheetView = (view: HomeSheetView) => {
    setSheetView(view);
    if (sheet.scrollRef.current) sheet.scrollRef.current.scrollTop = 0;
  };

  /* 설정 View 를 열 때마다 livingProfile 에 저장되어 있는 현재 값으로 draft 를 다시 채운다 —
   * 이전에 이 화면에서 저장하지 않고 나간 값이 남아있지 않도록 한다. */
  const openRecommendSetup = () => {
    const saved = loadLivingProfile(ownerKey, personaProfile);
    setRecommendDraft({ topics: saved.topics });
    showSheetView('recommend');
  };

  const closeRecommendSetup = () => {
    cameBackRef.current = true;
    showSheetView('home');
  };

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
  const statusRef = useRef<HTMLDivElement>(null);
  const addSlotRef = useRef<HTMLDivElement>(null);

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
      key: 'level',
      title: '활동할수록 레벨 UP!',
      body: '자두야에서 활동할수록 레벨이 올라가요.\n하트를 모아 다양한 보상을 받아보세요.',
      targetRef: statusRef,
      radius: 20,
      sheetState: 'peek',
    },
    {
      key: 'menu',
      title: '자주 쓰는 메뉴만 쏙 모아보세요',
      body: '자주 쓰는 기능을 골라\n나만의 메뉴를 만들어보세요.',
      targetRef: addSlotRef,
      radius: 16,
      /* peek 상태에선 위젯 추가(+) 슬롯이 시트 아래로 가려 안 보인다 */
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
  ], [benefitBannerRef, statusRef, addSlotRef]);

  return (
    <div
      className={`home app${sheet.isDragging ? ' is-dragging' : ''}`}
      data-sheet-state={sheet.state}
    >
      <Hero showFallingLeaves={isDemoAccount} />

      <Header />

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
        handleProps={sheet.handleProps}
      >
        {sheetView === 'home' ? (
          <div
            className={`sheet-view sheet-view--home${cameBackRef.current ? ' sheet-view--back' : ''}`}
          >
            <MyLifeSection
              placement={placement.state}
              heartsLabel={level.heartsLabel}
              levelLabel={level.levelLabel}
              levelIcon={level.levelIcon}
              levelStageName={level.stageName}
              onOpenLevelInfo={openLevelInfo}
              onAddWidget={() => navigation?.navigate('widget-gallery')}
              statusRef={statusRef}
              addSlotRef={addSlotRef}
            />
            <DiscoverySection onOpenRecommendSetup={openRecommendSetup} />
          </div>
        ) : (
          <HomeRecommendSettings
            value={recommendDraft}
            onBack={closeRecommendSetup}
            onSave={saveRecommendSetup}
          />
        )}
      </HomeSheet>

      {bottomNavigationVisible && <BottomNavigation />}

      {levelInfo && (
        <LevelInfoPopover
          stages={LEVEL_STAGE_LIST}
          stage={level.stage}
          remainingXp={level.remainingXp}
          anchorTop={levelInfo.top}
          anchorLeft={levelInfo.left}
          onViewMissions={viewMissions}
          onClose={() => setLevelInfo(null)}
        />
      )}

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
