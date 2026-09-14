import { useRef, useState } from 'react';
import { aiFabRef } from '../components/ai/aiFabRef';
import { AddWidget } from '../components/AddWidget';
import { BottomNavigation } from '../components/BottomNavigation';
import { Coachmark } from '../components/Coachmark';
import type { CoachmarkStep } from '../components/Coachmark';
import { DiscoverySection } from '../components/DiscoverySection';
import { GnbOverlay } from '../components/GnbOverlay';
import { Greeting } from '../components/Greeting';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { HomeSheet } from '../components/HomeSheet';
import { MyLifeSection } from '../components/MyLifeSection';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { TipBox } from '../components/TipBox';
import { MAX_WIDGET } from '../data/widgetCatalog';
import { DEFAULT_PERSONA, HOME_PERSONA_CONTENT, greetingName } from '../data/personaHome';
import { PERSONA_WIDGETS, layoutCatalogIds } from '../data/personaWidgets';
import { PERSONA_PROFILE, resolveLevel } from '../data/personaProfile';
import { useAuth } from '../auth/AuthContext';
import { isCoachmarkSeen, markCoachmarkSeen } from '../auth/coachmarkProgress';
import { useDraftSelection } from '../hooks/useDraftSelection';
import { useLayerStack } from '../hooks/useLayerStack';
import { useSheetGesture } from '../hooks/useSheetGesture';
import { useMyMenu } from '../menu/MyMenuContext';

/* Home 화면 — 모든 레이어는 라우트가 아니라 상태로 열린다.
 *
 *   Home
 *    ├─ GNB Open
 *    │   └─ My Menu Edit Bottom Sheet (menu/MyMenuContext — 모든 화면이 공유)
 *    └─ Add Widget Bottom Sheet
 */
export function Home() {
  /* 현재 로그인한 사용자의 persona 로 Home 콘텐츠를 고른다 */
  const { user } = useAuth();
  const persona = user?.persona ?? DEFAULT_PERSONA;
  const content = HOME_PERSONA_CONTENT[persona];
  /* 내 생활 위젯 조합 (Figma Home Widget Container 342 × 194) */
  const widgetLayout = PERSONA_WIDGETS[persona];
  /* 하트·레벨은 마이페이지와 같은 원본을 쓴다 (data/personaProfile.ts) */
  const level = resolveLevel(PERSONA_PROFILE[persona].level);

  const layers = useLayerStack();
  const sheet = useSheetGesture();
  /* GNB "내 메뉴" 선택 + 편집 시트 — 다른 화면과 공유하는 전역 상태 */
  const myMenu = useMyMenu();

  /* 저장된 상태 */
  const [myWidgets, setMyWidgets] = useState<string[]>(() => layoutCatalogIds(widgetLayout));
  /* 위젯 구성을 한 번이라도 저장했는지 (Home 캔버스 높이 해제 조건) */
  const [widgetsCustomized, setWidgetsCustomized] = useState(false);

  /* 시트 작업본 */
  const widgetDraft = useDraftSelection(layoutCatalogIds(widgetLayout), MAX_WIDGET);

  const openAddWidget = () => {
    widgetDraft.reset(myWidgets);
    layers.open('addWidget');
  };

  const doneAddWidget = () => {
    setMyWidgets(widgetDraft.draft.slice());
    setWidgetsCustomized(true);
    layers.close();
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
  };

  /* 강조할 실제 DOM — 좌표를 하드코딩하지 않고 Coachmark 가 매 단계 실측한다 */
  const tipBoxRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const addSlotRef = useRef<HTMLDivElement>(null);

  const coachmarkSteps: CoachmarkStep[] = [
    {
      key: 'notice',
      title: '중요한 알림을 한눈에',
      body: '생활비, 주거, 혜택 등\n내게 필요한 알림을 바로 확인할 수 있어요.',
      targetRef: tipBoxRef,
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
      title: '자두는 어디든 이동 가능해요',
      body: '화면 내 원하는 곳으로\n언제든 편하게 옮겨보세요.',
      targetRef: aiFabRef,
      radius: 'circle',
      sheetState: 'expanded',
    },
  ];

  return (
    <div
      className={`app${sheet.isDragging ? ' is-dragging' : ''}`}
      data-sheet-state={sheet.state}
    >
      <Hero />

      <Header onMenuClick={() => layers.open('gnb')} />

      <Greeting name={greetingName(user?.name ?? '')} hero={content.hero} />

      <TipBox tip={content.tips[0]} cardRef={tipBoxRef} />

      <HomeSheet
        state={sheet.state}
        sheetRef={sheet.sheetRef}
        scrollRef={sheet.scrollRef}
        handleRef={sheet.handleRef}
        handleProps={sheet.handleProps}
      >
        <MyLifeSection
          layout={widgetLayout}
          heartsLabel={level.heartsLabel}
          levelLabel={level.levelLabel}
          widgets={myWidgets}
          isCustom={widgetsCustomized}
          onAddWidget={openAddWidget}
          statusRef={statusRef}
          addSlotRef={addSlotRef}
        />
        <DiscoverySection />
      </HomeSheet>

      <BottomNavigation />

      {/* 전역 AI 챗봇 FAB + 패널 */}

      <GnbOverlay
        open={layers.isOpen('gnb')}
        myMenu={myMenu.myMenu}
        onClose={layers.close}
        onEditMenu={myMenu.openEdit}
      />

      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />

      <AddWidget
        open={layers.isOpen('addWidget')}
        draft={widgetDraft}
        layout={widgetLayout}
        onClose={layers.close}
        onDone={doneAddWidget}
      />

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
