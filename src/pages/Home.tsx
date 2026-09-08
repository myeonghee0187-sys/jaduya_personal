import { useState } from 'react';
import { AIChatbot } from '../components/ai/AIChatbot';
import { AddWidget } from '../components/AddWidget';
import { BottomNavigation } from '../components/BottomNavigation';
import { DiscoverySection } from '../components/DiscoverySection';
import { GnbOverlay } from '../components/GnbOverlay';
import { Greeting } from '../components/Greeting';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { HomeSheet } from '../components/HomeSheet';
import { MyLifeSection } from '../components/MyLifeSection';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { TipBox } from '../components/TipBox';
import { DEFAULT_MENU, MAX_MENU } from '../data/menuCatalog';
import { MAX_WIDGET } from '../data/widgetCatalog';
import { DEFAULT_PERSONA, HOME_PERSONA_CONTENT, greetingName } from '../data/personaHome';
import { PERSONA_WIDGETS, layoutCatalogIds } from '../data/personaWidgets';
import { PERSONA_PROFILE, resolveLevel } from '../data/personaProfile';
import { useAuth } from '../auth/AuthContext';
import { useDraftSelection } from '../hooks/useDraftSelection';
import { useLayerStack } from '../hooks/useLayerStack';
import { useSheetGesture } from '../hooks/useSheetGesture';

/* Home 화면 — 모든 레이어는 라우트가 아니라 상태로 열린다.
 *
 *   Home
 *    ├─ GNB Open
 *    │   └─ My Menu Edit Bottom Sheet
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

  /* 저장된 상태 */
  const [myMenu, setMyMenu] = useState<string[]>(DEFAULT_MENU);
  const [myWidgets, setMyWidgets] = useState<string[]>(() => layoutCatalogIds(widgetLayout));
  /* 위젯 구성을 한 번이라도 저장했는지 (Home 캔버스 높이 해제 조건) */
  const [widgetsCustomized, setWidgetsCustomized] = useState(false);

  /* 시트 작업본 */
  const menuDraft = useDraftSelection(DEFAULT_MENU, MAX_MENU);
  const widgetDraft = useDraftSelection(layoutCatalogIds(widgetLayout), MAX_WIDGET);

  const openMenuEdit = () => {
    menuDraft.reset(myMenu);
    layers.open('menuEdit');
  };

  const saveMenu = () => {
    setMyMenu(menuDraft.draft.slice());
    layers.close();
  };

  const openAddWidget = () => {
    widgetDraft.reset(myWidgets);
    layers.open('addWidget');
  };

  const doneAddWidget = () => {
    setMyWidgets(widgetDraft.draft.slice());
    setWidgetsCustomized(true);
    layers.close();
  };

  return (
    <div
      className={`app${sheet.isDragging ? ' is-dragging' : ''}`}
      data-sheet-state={sheet.state}
    >
      <Hero />

      <Header onMenuClick={() => layers.open('gnb')} />

      <Greeting name={greetingName(user?.name ?? '')} hero={content.hero} />

      <TipBox tip={content.tips[0]} />

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
        />
        <DiscoverySection />
      </HomeSheet>

      <BottomNavigation />

      {/* 전역 AI 챗봇 FAB + 패널 */}
      <AIChatbot />

      <GnbOverlay
        open={layers.isOpen('gnb')}
        myMenu={myMenu}
        onClose={layers.close}
        onEditMenu={openMenuEdit}
      />

      <MyMenuEdit
        open={layers.isOpen('menuEdit')}
        draft={menuDraft}
        onClose={layers.close}
        onSave={saveMenu}
      />

      <AddWidget
        open={layers.isOpen('addWidget')}
        draft={widgetDraft}
        onClose={layers.close}
        onDone={doneAddWidget}
      />
    </div>
  );
}
