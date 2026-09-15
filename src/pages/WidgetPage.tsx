import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { SubPageHeader } from '../components/SubPageHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { PlacementGrid } from '../components/widget/PlacementGrid';
import { WidgetActionSheet } from '../components/widget/WidgetActionSheet';
import { WidgetCategoryFilter } from '../components/widget/WidgetCategoryFilter';
import type { CategoryFilter } from '../components/widget/WidgetCategoryFilter';
import { WidgetGuidePanel } from '../components/widget/WidgetGuidePanel';
import { PlacementGuideSheet } from '../components/widget/PlacementGuideSheet';
import { WidgetListCard } from '../components/widget/WidgetListCard';
import { WidgetRecommendSwiper } from '../components/widget/WidgetRecommendSwiper';
import { WidgetPreviewModal } from '../components/widget/WidgetPreviewModal';
import { WidgetToast } from '../components/widget/WidgetToast';
import { getWidgetDef, WIDGET_REGISTRY } from '../data/widgetRegistry';
import { DEFAULT_PERSONA } from '../data/personaHome';
import { useAuth } from '../auth/AuthContext';
import {
  isWidgetGuideDismissed,
  isWidgetGuideSheetSeen,
  markWidgetGuideDismissed,
  markWidgetGuideSheetSeen,
} from '../widgets/widgetGuideProgress';
import { useWidgetPlacement } from '../widgets/WidgetPlacementContext';
import { listPlaced } from '../utils/placement';
import type { SlotRef } from '../utils/placement';
import { useAppNavigation } from '../navigation/AppNavigation';
import type { WidgetSize } from '../types';

/* 위젯 관리 화면 — "내 위젯" 배치 + "추천 위젯" + "전체 위젯"이 한 페이지 안에서
 * 아래로 스크롤하면 이어진다(레퍼런스 그대로 — 별도의 "위젯 추가하기" 페이지로 넘어가지
 * 않는다). 위젯 카드를 누르면 중앙 모달에서 S/M/L을 실제 크기로 비교하고 그 자리에서
 * 추가한다. 공간이 부족하면 화면 이동 없이 그 모달 안에서 바로 "공간 만들기"로 전환된다
 * (WidgetPreviewModal 이 자체 단계를 갖는다 — 별도의 Bottom Sheet 로 빠지지 않는다). */

/* Swiper 한 화면에 2장씩 꽉 차 보이므로(WidgetRecommendSwiper) 4개(2페이지)로 맞춘다 */
const RECOMMEND_LIMIT = 4;
const CAPACITY_MAX = 4; // 1번째 줄(M×2 또는 L) + 2번째 줄(S×2) = 4칸
/* "전체 위젯" 기본 노출 개수 — 카테고리 하나에 위젯이 많아도 목록이 한없이 길어지지
 * 않게, 처음엔 6개까지만 보여주고 "더보기"를 눌러야 나머지가 펼쳐진다. */
const ALL_WIDGETS_PREVIEW_LIMIT = 6;
const SIZE_LABEL: Record<WidgetSize, string> = { small: 'S', medium: 'M', large: 'L' };

export function WidgetPage() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const persona = user?.persona ?? DEFAULT_PERSONA;
  const placement = useWidgetPlacement();
  const allWidgetsRef = useRef<HTMLElement>(null);
  const myWidgetsRef = useRef<HTMLElement>(null);

  const [editing, setEditing] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(
    () => !!user?.email && !isWidgetGuideDismissed(user.email),
  );
  const [category, setCategory] = useState<CategoryFilter>('전체');
  const [allExpanded, setAllExpanded] = useState(false);
  /* 이서준(과 이서준으로 새로 가입한 테스트 계정, persona: beginner)은 "가이드" 버튼을
   * 누르지 않아도 위젯 페이지에 처음 들어왔을 때 이 모달이 자동으로 한 번 뜬다 —
   * Home 의 Coachmark 와 같은 대상·같은 "계정당 한 번" 규칙(coachmarkProgress.ts 패턴). */
  const [guideSheetOpen, setGuideSheetOpen] = useState(
    () => persona === 'beginner' && !!user?.email && !isWidgetGuideSheetSeen(user.email),
  );
  const [actionTarget, setActionTarget] = useState<SlotRef | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  /* 공간 만들기 확인 직후에는 모달이 곧바로 닫히지 않고 자체 "추가 완료" 화면을
   * 먼저 보여준다 — 그 상태에서 토스트를 바로 띄우면 반투명 모달 배경(dim) 너머로
   * 살짝 비쳐 보인다. 그래서 배치 자체는 즉시 반영하되, 토스트는 모달이 실제로
   * 닫힐 때(handlePreviewClose)까지 여기 담아뒀다가 그때 띄운다. */
  const pendingToastRef = useRef<{ message: string; undo: boolean } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
      setShowUndo(false);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const placedList = useMemo(() => listPlaced(placement.state), [placement.state]);
  const placedIds = useMemo(() => new Set(placedList.map((p) => p.widgetId)), [placedList]);
  /* L 위젯은 1번째 줄 두 칸을 통째로 쓰므로 2칸으로 센다 */
  const usedCapacity = useMemo(
    () => placedList.reduce((sum, p) => sum + (p.size === 'large' ? 2 : 1), 0),
    [placedList],
  );

  const recommended = useMemo(
    () => WIDGET_REGISTRY.filter((w) => !placedIds.has(w.id)).slice(0, RECOMMEND_LIMIT),
    [placedIds],
  );

  const filtered = useMemo(
    () => (category === '전체' ? WIDGET_REGISTRY : WIDGET_REGISTRY.filter((w) => w.category === category)),
    [category],
  );
  const visibleFiltered = allExpanded ? filtered : filtered.slice(0, ALL_WIDGETS_PREVIEW_LIMIT);
  const hasMoreFiltered = !allExpanded && filtered.length > ALL_WIDGETS_PREVIEW_LIMIT;

  const handleCategoryChange = (next: CategoryFilter) => {
    setCategory(next);
    /* 카테고리를 바꾸면 새 목록은 다시 6개부터 시작한다 — 이전 카테고리에서 펼쳐놨던
     * 상태가 그대로 남아 있으면 위젯 수가 적은 카테고리로 옮겨도 항상 펼쳐진 것처럼
     * 보여서 "더보기"의 의미가 없어진다. */
    setAllExpanded(false);
  };

  /* target.scrollIntoView() 는 조상 체인을 타고 올라가며 "스크롤 가능한 박스"를 전부
   * 맞추는데, .app 도 overflow:hidden 이라 그 대상에 포함돼 헤더 높이(50px)만큼 .app
   * 자체가 스크롤되어 헤더가 화면 밖으로 밀려나는 버그가 있었다(요구사항 아님, 발견된
   * 버그 수정). .wpg-scroll 한 곳의 scrollTop만 직접 계산해서 옮긴다. */
  const scrollToSection = (ref: RefObject<HTMLElement>) => {
    const target = ref.current;
    const container = target?.closest<HTMLElement>('.wpg-scroll');
    if (!target || !container) return;
    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' });
  };

  const scrollToAll = () => scrollToSection(allWidgetsRef);

  const toggleGuide = () => {
    setGuideExpanded((prev) => {
      const next = !prev;
      if (!next && user?.email) markWidgetGuideDismissed(user.email);
      return next;
    });
  };

  const handleRemove = (ref: SlotRef) => {
    placement.removeAt(ref);
    setToast('위젯을 삭제했어요.');
    setShowUndo(true);
  };

  /* wasExisting — 새로 추가한 게 아니라 이미 있던 위젯의 크기를 바꾼 것이면 토스트
   * 문구를 "추가했어요" 대신 "크기를 변경했어요"로 바꾼다(요구사항: 크기 변경과 추가는
   * 다른 동작이니 알림도 구분한다). */
  const handleAdd = (widgetId: string, size: WidgetSize, wasExisting: boolean) => {
    placement.addWidget(widgetId, size);
    setToast(wasExisting ? '위젯 크기를 변경했어요.' : '위젯을 추가했어요.');
    setShowUndo(true);
  };

  /* 미리보기 모달의 "공간 만들기" 화면에서 호출된다 — 고른 자리를 비우고 바로 새
   * 위젯을 놓거나(또는 기존 위젯 크기를 바꾸거나) 한다. 배치는 즉시 반영하지만, 모달은
   * 여기서 닫지 않고 자체 "완료" 화면을 먼저 보여준다 — 토스트는 pendingToastRef 에
   * 담아뒀다가 모달이 실제로 닫힐 때 띄운다(handlePreviewClose). */
  const handleResolveConflict = (widgetId: string, size: WidgetSize, refs: SlotRef[], wasExisting: boolean) => {
    placement.resolveConflictAndAdd(widgetId, size, refs);
    pendingToastRef.current = {
      message: wasExisting ? '위젯 크기를 변경했어요.' : `${SIZE_LABEL[size]} 위젯을 추가했어요.`,
      undo: true,
    };
  };

  const handlePreviewClose = () => {
    setPreviewId(null);
    if (pendingToastRef.current) {
      /* pendingToastRef 는 "공간 만들기 → 완료 화면 → 확인"을 거쳐 실제로 배치가 바뀐
       * 경우에만 채워진다(그냥 미리보기만 하다 X로 닫으면 비어 있다) — 그 조건에서만
       * 방금 바뀐 결과를 바로 보여주려고 "내 위젯"으로 스크롤한다. */
      scrollToSection(myWidgetsRef);
      setToast(pendingToastRef.current.message);
      setShowUndo(pendingToastRef.current.undo);
      pendingToastRef.current = null;
    }
  };

  const actionDef = actionTarget ? placement.getPlacedAt(actionTarget) : null;
  const actionWidgetDef = actionDef ? getWidgetDef(actionDef.widgetId) : undefined;
  const previewDef = previewId ? (getWidgetDef(previewId) ?? null) : null;

  return (
    <div className="app widget-page">
      <SubPageHeader
        title="위젯"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onClose={() => navigation?.navigate('home')}
        closeLabel="홈으로"
      />

      <main className="wpg-scroll">
        <section className="wpg-my" ref={myWidgetsRef}>
          <div className="wpg-my__head">
            <h2>내 위젯</h2>
            <span className="wpg-my__count">
              <i aria-hidden="true" />
              {usedCapacity}/{CAPACITY_MAX}
            </span>
            <button type="button" className="wpg-guide-btn" onClick={() => setGuideSheetOpen(true)}>
              가이드
            </button>
            <button type="button" className="wpg-edit-btn" onClick={() => setEditing((v) => !v)}>
              {editing ? '완료' : '편집'}
            </button>
          </div>

          <div className="wpg-canvas-card">
            <PlacementGrid
              state={placement.state}
              editing={editing}
              onTapPlaced={(ref) => setActionTarget(ref)}
              onTapEmpty={() => scrollToAll()}
              onRemove={handleRemove}
              onAddCta={() => scrollToAll()}
            />
          </div>

          <WidgetGuidePanel expanded={guideExpanded} onToggle={toggleGuide} />
        </section>

        <section className="wpg-recommend">
          <div className="wpg-recommend__head">
            <h2>추천 위젯</h2>
            <p>자두야가 엄선한 위젯을 추천해요.</p>
          </div>

          {recommended.length > 0 ? (
            <WidgetRecommendSwiper widgets={recommended} onSelect={(id) => setPreviewId(id)} />
          ) : (
            <p className="wg-empty">추천할 위젯이 없어요.</p>
          )}
        </section>

        <section className="wpg-all" ref={allWidgetsRef}>
          <div className="wpg-all__head">
            <h2>전체 위젯</h2>
            <p>자두야의 모든 위젯을 둘러보세요.</p>
          </div>

          <WidgetCategoryFilter value={category} onChange={handleCategoryChange} />

          {filtered.length > 0 ? (
            <>
              {visibleFiltered.map((def) => (
                <WidgetListCard key={def.id} def={def} onSelect={() => setPreviewId(def.id)} />
              ))}
              {hasMoreFiltered && (
                <button type="button" className="wpg-all__more" onClick={() => setAllExpanded(true)}>
                  더보기
                  <span aria-hidden="true">▾</span>
                </button>
              )}
            </>
          ) : (
            <p className="wg-empty">해당 카테고리에 위젯이 없어요.</p>
          )}
        </section>
      </main>

      <BottomNavigation activeTab="home" />

      <WidgetActionSheet
        target={actionWidgetDef && actionDef ? { def: actionWidgetDef, size: actionDef.size } : null}
        onClose={() => setActionTarget(null)}
        onChange={() => {
          if (actionTarget) placement.removeAt(actionTarget);
          setActionTarget(null);
          scrollToAll();
        }}
        onDelete={() => {
          if (actionTarget) handleRemove(actionTarget);
          setActionTarget(null);
        }}
      />

      <WidgetPreviewModal
        def={previewDef}
        placementState={placement.state}
        checkPlacement={placement.checkPlacement}
        onAdd={handleAdd}
        onResolveConflict={handleResolveConflict}
        onClose={handlePreviewClose}
      />

      <WidgetToast
        message={toast}
        actionLabel={showUndo ? '실행 취소' : undefined}
        onAction={() => {
          placement.undoLastChange();
          setToast(null);
          setShowUndo(false);
        }}
      />

      <PlacementGuideSheet
        open={guideSheetOpen}
        onClose={() => {
          setGuideSheetOpen(false);
          if (user?.email) markWidgetGuideSheetSeen(user.email);
        }}
      />
    </div>
  );
}

export default WidgetPage;
