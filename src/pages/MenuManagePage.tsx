import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { GlyphIcon } from '../components/GlyphIcon';
import { MenuAssetPreview } from '../components/MenuAssetPreview';
import { MenuChangeDialog } from '../components/MenuChangeDialog';
import type { MenuChangeFlow } from '../components/MenuChangeDialog';
import { MenuGuideSheet } from '../components/MenuGuideSheet';
import { MenuLeaveDialog } from '../components/MenuLeaveDialog';
import { StatusBar } from '../components/StatusBar';
import { HOME_SPACE_MAX, MENU_CATALOG, sizeLabel } from '../data/menuCatalog';
import { useMenuGridEdit } from '../hooks/useMenuGridEdit';
import { getMenuManageAssets } from '../data/menuWidgetAssets';
import type { MenuSizeKey } from '../data/menuWidgetAssets';
import { HOME_GRID_COLUMNS, baseMenuWidgetAssetId, placeMenuWidgets, slotColorOf } from '../data/menuWidgets';
import type { SelectedMenuWidget } from '../data/menuWidgets';
import { icon } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useDismissOnBack } from '../navigation/useDismissOnBack';
import {
  countUsedSlots,
  reorderSelection,
  replaceSelection,
  toggleSelection,
  useMenuWidgetSelection,
  withoutWidget,
} from '../widgets/MenuWidgetSelectionContext';

/* 메뉴 행을 누르면 그 아래에 위젯 에셋 preview 가 펼쳐진다(아코디언, 한 번에 하나).
 * 열린 메뉴는 openLabel 하나로만 관리하고, preview 선택은 저장하지 않는 화면 안 상태(picked)다.
 *
 * 메뉴 관리 화면 — Figma menu_manage_fullpage_v2 (4065:5436).
 * 홈 '내 메뉴'의 "메뉴 관리" 버튼이 여는 화면(/widgets)으로, 위 요약(MY 메뉴)과
 * 카테고리별 1열 목록으로 구성한다. 선택 상태는 홈이 저장한 위젯(loadMenuWidgets)에서 읽는다.
 * 홈 저장(추가·제거·크기 반영)과 충돌 안내는 아직 연결하지 않았다 — 행 우측 원은 홈 저장값 그대로다.
 * 순서 변경은 홈 화면에서 한다(여기에 두지 않는다). */

export function MenuManagePage() {
  const navigation = useAppNavigation();
  /* savedWidgets = 실제 저장 상태(홈이 보는 값). 이 화면의 모든 편집은 draft 에만 반영되고, 저장 버튼에서만 savedWidgets 가 된다. */
  const { selectedWidgets: savedWidgets, commitWidgets, getInitialWidgets } = useMenuWidgetSelection();
  const [draft, setDraft] = useState<SelectedMenuWidget[]>(savedWidgets);
  const usedSlots = countUsedSlots(draft);
  const catalogItems = MENU_CATALOG.flatMap((section) => section.items);
  const byId = new Map(catalogItems.map((menu) => [menu.id, menu]));
  const selectedAssetIds = new Set(draft.map((widget) => widget.assetId));
  /* MY 메뉴 = draft (order 순서). 홈의 "내 메뉴"와 같은 데이터 형태·같은 4열 배치 계산(placeMenuWidgets)이고,
   * 저장 버튼을 누르면 이 draft 가 그대로 홈이 보는 저장 상태가 된다. */
  const myWidgets = [...draft].sort((a, b) => a.order - b.order);
  const myPlacementList = placeMenuWidgets(myWidgets);
  const myPlacements = new Map(myPlacementList.map(({ item, row, col, span }) => [item.assetId, { row, col, span }]));
  /* 항상 8칸(Slot01~08)을 보여준다 — 위젯이 실제로 차지한 칸(1×1=1칸, 2×2=4칸)을 빼고 남은 칸만 빈 Slot 이다 */
  const occupiedSlots = new Set<number>();
  myPlacementList.forEach(({ row, col, span }) => {
    for (let r = row; r < row + span; r += 1) {
      for (let c = col; c < col + span; c += 1) occupiedSlots.add(r * HOME_GRID_COLUMNS + c);
    }
  });
  const emptySlots = Array.from({ length: HOME_SPACE_MAX }, (_, slot) => slot).filter((slot) => !occupiedSlots.has(slot));

  /* MY 메뉴 편집 모드 — 길게 누르면 켜지고(홈 내 메뉴와 같은 useMenuGridEdit), 완료·바깥 탭으로 꺼진다.
   * 켜져 있는 동안 카드 좌상단 − 로 삭제, 드래그로 4열 Grid 슬롯 재정렬 — 둘 다 draft 에만 반영한다. */
  const [myEditing, setMyEditing] = useState(false);
  const mySectionRef = useRef<HTMLElement>(null);
  const myGridRef = useRef<HTMLUListElement>(null);
  const { renderIds: myRenderIds, draggingId: myDraggingId, dropPlaceholder: myDropPlaceholder, gridProps: myGridProps } = useMenuGridEdit({
    gridRef: myGridRef,
    sectionRef: mySectionRef,
    items: myWidgets.map((widget) => ({
      id: widget.assetId,
      menuId: widget.menuId,
      size: widget.size,
      slot: widget.slot,
      compactAssetId: byId.get(widget.menuId)?.showBaseWidgetInMenuManage !== false
        ? baseMenuWidgetAssetId(widget.menuId)
        : undefined,
    })),
    editing: myEditing,
    onEnterEdit: () => setMyEditing(true),
    onExitEdit: () => setMyEditing(false),
    onReorder: (placements, replacement) => setDraft((current) => reorderSelection(current, placements, replacement)),
  });
  const goHome = () => navigation?.goBack('home');
  const pageActive = navigation?.active ?? true;

  /* 저장 버튼 상태 — 저장된 상태(savedWidgets)와 draft 를 비교해 그때그때 계산한다. 같으면(변경 후 정확히 되돌린 경우 포함) 비활성. */
  const signature = (items: readonly SelectedMenuWidget[]) => JSON.stringify(items.map((widget) => [widget.assetId, widget.order, widget.slot ?? 0]));
  const dirty = signature(savedWidgets) !== signature(draft);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  /* 저장 안 된 변경이 있을 때의 이탈 처리 — 뒤로가기(시스템·헤더)·하단 탭 이동 모두 확인 Dialog 를 거친다.
   *  - 시스템 뒤로가기: useDismissOnBack 이 history 항목 하나를 쌓아 두었다가 뒤로가기가 오면 requestLeave 를 부른다.
   *  - 헤더 뒤로가기·탭 이동: AppNavigation 의 leave guard 가 가로채서, 위 history 항목을 소비(history.back)하며 같은 경로로 합친다.
   *  - dirty 가 아니면 Dialog 없이 바로 이동한다. */
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const bypassRef = useRef(false);
  const pendingLeaveRef = useRef<(() => void) | null>(null);
  const hasGuardEntry = () => ((window.history.state?.usr?.overlayIds as string[] | undefined)?.length ?? 0) > 0;
  const goHomeNow = () => { bypassRef.current = true; navigation?.goBack('home'); };
  const runPendingLeave = () => {
    const proceed = pendingLeaveRef.current ?? goHomeNow;
    pendingLeaveRef.current = null;
    proceed();
  };
  const requestLeave = () => {
    if (bypassRef.current || !dirtyRef.current) { runPendingLeave(); return; }
    pendingLeaveRef.current ??= goHomeNow;
    setLeaveOpen(true);
  };
  /* 이동이 시작된 뒤(leaving)에는 guard 를 새로 쌓지도(suspended) 풀지도(open 유지) 않는다 — history 가 꼬이지 않게 */
  useDismissOnBack(pageActive && (dirty || leaving), requestLeave, leaveOpen || leaving);
  useEffect(() => {
    navigation?.setLeaveGuard((proceed) => {
      if (bypassRef.current || !dirtyRef.current) return false;
      pendingLeaveRef.current = proceed;
      if (hasGuardEntry()) window.history.back();
      else setLeaveOpen(true);
      return true;
    });
    return () => navigation?.setLeaveGuard(null);
  });

  /* 화면에 들어올 때마다 draft 를 지금 저장된 상태로 새로 시작한다 */
  useEffect(() => {
    if (!pageActive) return;
    setDraft(savedWidgets);
    setLeaveOpen(false);
    setLeaving(false);
    bypassRef.current = false;
    pendingLeaveRef.current = null;
    // savedWidgets 는 일부러 뺀다 — 화면을 보는 동안 저장 상태가 바뀌어도 편집 중인 draft 를 덮어쓰지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageActive]);

  const save = () => {
    commitWidgets(draft);
    setLeaving(true);
    bypassRef.current = true;
    if (hasGuardEntry()) { pendingLeaveRef.current = goHomeNow; window.history.back(); } else goHomeNow();
  };
  const stayEditing = () => { setLeaveOpen(false); pendingLeaveRef.current = null; };
  const leaveWithoutSaving = () => {
    setLeaveOpen(false);
    setLeaving(true);
    bypassRef.current = true;
    setDraft(savedWidgets);
    runPendingLeave();
  };
  /* 사용법 시트 — 열림 여부만 든다. 페이지의 다른 state 는 건드리지 않는다. */
  const [guideOpen, setGuideOpen] = useState(false);
  /* 위젯 교체 흐름 Dialog(안내 → 대상 선택 → 확인) — 선택 데이터는 마지막 '변경하기'에서만 바뀐다 */
  const [changeFlow, setChangeFlow] = useState<MenuChangeFlow>(null);

  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  /* 누른 행이 화면에서 움직이지 않게 한다.
   * - 새로 여는 행보다 위에서 닫히는 패널은 transition 없이 즉시 접는다(instantCloseId) — 그래야 위쪽 높이 변화가
   *   한 번에 끝나서, 아래 layout effect 가 누르기 전 top 과의 차이만큼 scrollTop 을 즉시 보정할 수 있다.
   * - 아래쪽에서 닫히거나 자기 자신이 열리고 닫히는 패널은 행 위치에 영향이 없어 그대로 애니메이션한다. */
  const [instantCloseId, setInstantCloseId] = useState<string | null>(null);
  const anchorRef = useRef<{ row: HTMLElement; top: number } | null>(null);

  /* 검색 — 화면 안에서 목록만 걸러낸다. 선택 상태(selectedAssetKeys)와 아코디언 상태(expandedMenuId)는
   * 건드리지 않아서, 검색어를 지우면 검색 전 그대로 돌아온다. 검색 중에는 걸러진 메뉴가 모두 펼쳐지고
   * (searchClosed 는 그중 사용자가 직접 접은 것), 검색어가 바뀌면 다시 전부 펼친다. */
  const [query, setQuery] = useState('');
  const [searchClosed, setSearchClosed] = useState<Set<string>>(() => new Set());
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');
  const needle = normalize(query);
  const searching = needle !== '';
  const visibleSections = MENU_CATALOG.map((section) => ({
    ...section,
    items: section.items.filter((menu) => {
      if (menu.showInMenuManage === false) return false;
      if (!searching) return true;
      /* 메뉴명 + 그 메뉴 위젯 에셋의 이름(카테고리·배리언트) */
      const names = [menu.label, ...getMenuManageAssets(menu.id).flatMap((asset) => [asset.content.category, asset.variant ?? ''])];
      return names.some((name) => normalize(name).includes(needle));
    }),
  })).filter((section) => section.items.length > 0);

  const toggle = (menuId: string, row: HTMLElement) => {
    if (searching) {
      setSearchClosed((current) => {
        const next = new Set(current);
        if (!next.delete(menuId)) next.add(menuId);
        return next;
      });
      return;
    }
    const openItem = row.closest('.menu-manage__scroll')?.querySelector('.menu-manage__item.is-open') ?? null;
    const closingAbove = !!openItem && !!(openItem.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING);
    anchorRef.current = { row, top: row.getBoundingClientRect().top };
    setInstantCloseId(closingAbove ? expandedMenuId : null);
    setExpandedMenuId((current) => (current === menuId ? null : menuId));
  };

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    anchorRef.current = null;
    const scroller = anchor?.row.closest<HTMLElement>('.menu-manage__scroll');
    if (!anchor || !scroller) return;
    const delta = anchor.row.getBoundingClientRect().top - anchor.top;
    if (!delta) return;
    const before = scroller.scrollTop;
    scroller.scrollTop += delta;
    /* 맨 아래 근처라 scrollTop 이 더 못 내려가면 부족분만큼 하단 여백을 잠깐 늘려서 채운다 */
    const rest = delta - (scroller.scrollTop - before);
    if (rest > 0.5) {
      scroller.style.setProperty('--mm-extra', `${rest}px`);
      scroller.scrollTop += rest;
      window.setTimeout(() => scroller.style.removeProperty('--mm-extra'), 320);
    }
  }, [expandedMenuId]);

  /* 위젯 선택 — 8칸 검사보다 먼저 "신규 추가인지 / 기존 위젯 변경인지"로 나눈다.
   *   ① 지금 선택된 asset 을 다시 누름                → 해제
   *   ② 같은 menuId 의 다른 asset                     → 같은 메뉴 내 변경 (자리가 모자라면 정리할 1×1 선택)
   *   ③ 새 2×2 + 다른 메뉴에 2×2 가 이미 있음          → 2×2 교체 (기존 2×2 자리를 이어받는다)
   *   ④ 새 위젯 + 빈 칸 충분                          → 일반 추가
   *   ⑤ 새 1×1 + 빈 칸 없음                           → 바꿀 1×1 을 골라 교체 (그 1×1 의 자리를 이어받는다)
   *   ⑥ 새 2×2 + 여러 칸 확보 필요                    → 정리할 1×1 을 필요한 개수만큼 선택
   * 공간 부족은 "막힘"이 아니라 교체 제안이다. Dialog 를 여는 동안에는 draft 를 바꾸지 않고, 마지막 '변경하기'에서만 바꾼다. */
  const slotsOfSize = (size: MenuSizeKey) => (size === '2x2' ? 4 : 1);
  const labelOf = (menuId: string, size: MenuSizeKey, assetId: string) => {
    const label = byId.get(menuId)?.label ?? '';
    const variant = getMenuManageAssets(menuId).find((asset) => asset.id === assetId)?.variant;
    return `${label} ${sizeLabel(size)}${variant ? ` · ${variant}` : ''}`;
  };
  const apply = (next: SelectedMenuWidget[] | null) => { if (next) setDraft(next); };

  const selectAsset = (menuId: string, size: MenuSizeKey, assetId: string, variant = 'default') => {
    const widget = { assetId, menuId, size, variant };
    const toLabel = labelOf(menuId, size, assetId);
    const current = draft.find((item) => item.menuId === menuId);
    const other2x2 = draft.find((item) => item.size === '2x2' && item.menuId !== menuId);
    const usedNow = countUsedSlots(draft);

    /* 정리할 1×1 을 count 개 고르게 하는 단계 — 이 메뉴의 1×1 은 새 위젯으로 바뀌므로 후보에서 뺀다 */
    const pickToClear = (count: number, title: string, body: string) => {
      const candidates = draft
        .filter((item) => item.size === '1x1' && item.menuId !== menuId)
        .map((item) => ({ assetId: item.assetId, label: labelOf(item.menuId, item.size, item.assetId) }));
      setChangeFlow({
        step: 'prompt',
        title,
        body,
        confirmLabel: '위젯 선택',
        onNext: () => setChangeFlow({
          step: 'pick',
          title: `정리할 위젯 ${count}개를 선택해 주세요`,
          candidates,
          required: count,
          compareFor: (ids) => ({
            fromCaption: '정리할 위젯',
            fromLabel: ids.map((id) => candidates.find((candidate) => candidate.assetId === id)?.label ?? '').join(', '),
            toLabel,
          }),
          onConfirm: (ids) => apply(replaceSelection(draft, ids, widget)),
        }),
      });
    };

    /* ① */
    if (current?.assetId === assetId) {
      setDraft(withoutWidget(draft, assetId));
      return;
    }

    /* 새 2×2 인데 다른 메뉴에 2×2 가 이미 있음(② ③) — 같은 메뉴 변경이어도 2×2 는 하나뿐이라 기존 2×2 를 교체한다 */
    if (size === '2x2' && other2x2) {
      setChangeFlow({
        step: 'confirm',
        title: '2×2 위젯을 변경할까요?',
        body: 'MY 메뉴에서는 2×2 위젯을 1개만 사용할 수 있어요.\n현재 사용 중인 위젯을 선택한 위젯으로 변경할까요?',
        compare: { fromLabel: labelOf(other2x2.menuId, other2x2.size, other2x2.assetId), toLabel },
        confirmLabel: '위젯 변경',
        onConfirm: () => apply(replaceSelection(draft, [other2x2.assetId], widget, other2x2.assetId)),
      });
      return;
    }

    /* ② 같은 메뉴 안에서 다른 위젯으로 변경 */
    if (current) {
      const need = usedNow - slotsOfSize(current.size) + slotsOfSize(size) - HOME_SPACE_MAX;
      if (need > 0) {
        pickToClear(
          need,
          `${need}칸의 공간이 더 필요해요`,
          `${sizeLabel(size)} 위젯으로 변경하려면\n현재 사용 중인 1×1 위젯 ${need}개를 정리해야 해요.`,
        );
        return;
      }
      setChangeFlow({
        step: 'confirm',
        title: '위젯을 변경할까요?',
        body: '현재 사용 중인 위젯을 선택한 위젯으로 변경합니다.',
        compare: { fromLabel: labelOf(current.menuId, current.size, current.assetId), toLabel },
        confirmLabel: '변경하기',
        onConfirm: () => setDraft((latest) => toggleSelection(latest, widget) ?? latest),
      });
      return;
    }

    /* ④ 신규 추가 — 빈 칸이 충분 */
    const need = usedNow + slotsOfSize(size) - HOME_SPACE_MAX;
    if (need <= 0) {
      apply(toggleSelection(draft, widget));
      return;
    }

    /* ⑥ 새 2×2 — 여러 칸 확보 필요 */
    if (size === '2x2') {
      pickToClear(
        need,
        `${need}칸의 공간이 더 필요해요`,
        `2×2 위젯을 추가하려면\n현재 사용 중인 1×1 위젯 ${need}개를 정리해야 해요.`,
      );
      return;
    }

    /* ⑤ 새 1×1 — 빈 칸 없음: 바꿀 1×1 을 골라 그 자리를 이어받는다 */
    const candidates = draft
      .filter((item) => item.size === '1x1')
      .map((item) => ({ assetId: item.assetId, label: labelOf(item.menuId, item.size, item.assetId) }));
    setChangeFlow({
      step: 'prompt',
      title: '위젯을 변경할까요?',
      body: 'MY 메뉴가 가득 찼어요.\n현재 사용 중인 1×1 위젯 하나를 선택한 위젯으로 변경할 수 있어요.',
      confirmLabel: '위젯 변경',
      onNext: () => setChangeFlow({
        step: 'pick',
        title: '변경할 위젯을 선택해 주세요',
        candidates,
        required: 1,
        compareFor: (ids) => ({
          fromLabel: candidates.find((candidate) => candidate.assetId === ids[0])?.label ?? '',
          toLabel,
        }),
        onConfirm: (ids) => apply(replaceSelection(draft, ids, widget, ids[0])),
      }),
    });
  };

  return (
    <div className="app menu-manage">
      <header className="menu-manage__header">
        <StatusBar />
        <div className="menu-manage__nav">
          <button type="button" className="menu-manage__back" aria-label="홈으로" onClick={goHome}>
            <img src={icon('gnb-back.svg')} alt="" />
          </button>
          <div className="menu-manage__heading">
            <h1>메뉴 관리</h1>
            <p>홈에 표시할 메뉴를 선택해보세요</p>
          </div>
          <button type="button" className="menu-manage__info" aria-label="메뉴 관리 사용법" onClick={() => setGuideOpen(true)}>
            <img src={icon('info.svg')} alt="" />
          </button>
        </div>
      </header>

      <main className="menu-manage__scroll">
        <section className="menu-manage__my" aria-labelledby="menu-manage-my" ref={mySectionRef}>
          <div className="menu-manage__my-head">
            <h2 id="menu-manage-my">MY 메뉴</h2>
            <span className="menu-manage__my-meta">
              {myWidgets.length > 0 ? (
                <button
                  type="button"
                  className="menu-manage__clear"
                  onClick={() => { setDraft([]); setMyEditing(false); }}
                >
                  전체 삭제
                </button>
              ) : (
                <button type="button" className="menu-manage__clear" onClick={() => setDraft(getInitialWidgets())}>
                  추천 구성으로
                </button>
              )}
              {myEditing && (
                <button type="button" className="menu-manage__done" onClick={() => setMyEditing(false)}>완료</button>
              )}
              <span className="menu-manage__space">{usedSlots} / {HOME_SPACE_MAX}</span>
            </span>
          </div>
          <div className="menu-manage__selected-scroll">
            <ul
              className={`menu-manage__selected${myEditing ? ' is-editing' : ''}`}
              ref={myGridRef}
              aria-label="홈에 등록된 메뉴"
              {...myGridProps}
            >
              {myDropPlaceholder && (
                <li
                  className={`menu-grid__drop-placeholder${myDropPlaceholder.invalid ? ' is-invalid' : ''}`}
                  style={myDropPlaceholder.style}
                  aria-hidden="true"
                />
              )}
              {myRenderIds.map((assetId) => {
                const widget = myWidgets.find((item) => item.assetId === assetId);
                const menu = widget ? byId.get(widget.menuId) : undefined;
                const placement = myPlacements.get(assetId);
                if (!widget || !menu || !placement) return null;
                return (
                  <li
                    key={assetId}
                    className={`menu-slot${myDraggingId === assetId ? ' is-dragging' : ''}`}
                    data-widget-id={assetId}
                    style={{
                      gridColumn: `${placement.col + 1} / span ${placement.span}`,
                      gridRow: `${placement.row + 1} / span ${placement.span}`,
                    }}
                  >
                    <span className={`menu-slot__wiggle menu-manage__chip menu-manage__chip--${widget.size}`} data-size={widget.size}>
                      <GlyphIcon file={menu.icon} size={widget.size === '2x2' ? 38 : 22} />
                      <span className="menu-manage__chip-label">{menu.label}</span>
                    </span>
                    {myEditing && (
                      <button
                        type="button"
                        className="menu-slot__remove"
                        aria-label={`${menu.label} 삭제`}
                        onClick={() => setDraft((current) => withoutWidget(current, assetId))}
                      />
                    )}
                  </li>
                );
              })}
              {emptySlots.map((slot) => (
                <li
                  key={`empty-${slot + 1}`}
                  className="menu-grid__empty"
                  aria-hidden="true"
                  style={{
                    gridColumn: `${(slot % HOME_GRID_COLUMNS) + 1} / span 1`,
                    gridRow: `${Math.floor(slot / HOME_GRID_COLUMNS) + 1} / span 1`,
                  }}
                >
                  <span className="menu-grid__empty-button">+</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="menu-manage__search">
          <img className="menu-manage__search-icon" src={icon('widget-search.svg')} alt="" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            placeholder="원하는 위젯을 검색해보세요"
            aria-label="위젯 검색"
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchClosed(new Set());
            }}
          />
          {query && (
            <button type="button" className="menu-manage__search-clear" aria-label="검색어 지우기" onClick={() => { setQuery(''); setSearchClosed(new Set()); }}>
              <img src={icon('close-sm.svg')} alt="" />
            </button>
          )}
        </div>

        {searching && visibleSections.length === 0 && (
          <div className="menu-manage__empty" role="status">
            <strong>검색 결과가 없어요</strong>
            <span>다른 위젯 이름으로 검색해보세요</span>
          </div>
        )}

        <div className="menu-manage__lists">
          {visibleSections.map((section) => (
            <section key={section.category} className={`menu-manage__section menu-manage__section--${section.tone}`}>
              <h2>{section.category}</h2>
              <ul>
                {section.items.map((menu) => {
                  /* 크기 그룹: 1×1(홈 위젯 하나) + 2×2(이 메뉴의 Figma 에셋들, 있을 때만).
                   * 목록의 "N개"는 그룹 수 = 고를 수 있는 위젯 크기 종류라서, 2×2 배리언트가 여럿이어도 2개다. */
                  const assets = getMenuManageAssets(menu.id);
                  const groups: { size: MenuSizeKey; previews: { key: string; asset?: (typeof assets)[number] }[] }[] = [
                    ...(menu.showBaseWidgetInMenuManage !== false
                      ? [{ size: '1x1' as const, previews: [{ key: baseMenuWidgetAssetId(menu.id) }] }]
                      : []),
                    ...(assets.length ? [{ size: '2x2' as const, previews: assets.map((a) => ({ key: a.id, asset: a })) }] : []),
                  ];
                  const home = draft.find((item) => item.menuId === menu.id);
                  const assetCount = groups.reduce((count, group) => count + group.previews.length, 0);
                  const selectedCount = draft.filter((widget) => widget.menuId === menu.id).length;
                  const open = searching ? !searchClosed.has(menu.id) : expandedMenuId === menu.id;
                  const panelId = `menu-manage-panel-${menu.id}`;
                  return (
                    <li key={menu.id} className={`menu-manage__item${open ? ' is-open' : ''}${instantCloseId === menu.id ? ' is-instant' : ''}`}>
                      <button
                        type="button"
                        className="menu-manage__row"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={(event) => toggle(menu.id, event.currentTarget)}
                      >
                        <span className="menu-manage__icon">
                          <GlyphIcon file={menu.icon} size={20} />
                        </span>
                        <span className="menu-manage__summary">
                          <span className="menu-manage__title-row">
                            <span className="menu-manage__name">{menu.label}</span>
                            <span className="menu-manage__count">{assetCount}개</span>
                          </span>
                          {selectedCount > 0 && (
                            <span className="menu-manage__selected-count">
                              <GlyphIcon file="widget-check.svg" size={11} />
                              {selectedCount}개 선택됨
                            </span>
                          )}
                        </span>
                        <span className={`menu-manage__toggle${open ? ' is-open' : ''}`} aria-hidden="true">
                          <img src={icon('chevron-down-thin.svg')} alt="" />
                        </span>
                      </button>
                      <div id={panelId} className="menu-manage__panel">
                        <div className="menu-manage__panel-inner">
                          <p className="menu-manage__panel-title">위젯 선택</p>
                          <div className="menu-manage__group-row">
                            {groups.map((group) => (
                              <div className={`menu-manage__group menu-manage__group--${group.size}`} key={group.size}>
                                <p className="menu-manage__group-title">{sizeLabel(group.size)}</p>
                                <div className="menu-manage__assets">
                                  {group.previews.map((preview) => (
                                    <MenuAssetPreview
                                      key={preview.key}
                                      menu={menu}
                                      size={group.size}
                                      asset={preview.asset}
                                      slot={home ? slotColorOf(home.order) : 1}
                                      selected={selectedAssetIds.has(preview.key)}
                                      onSelect={() => selectAsset(menu.id, group.size, preview.key, preview.asset?.variant)}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <footer className="menu-manage__footer">
          <p>선택한 메뉴의 순서는 홈 화면에서 변경할 수 있어요.</p>
        </footer>
      </main>

      {/* 저장 Action Bar — 스크롤 영역 밖, 하단 탭 바로 위에 붙어 항상 보인다 */}
      <div className="menu-manage__action">
        <button type="button" className="menu-manage__save" disabled={!dirty} onClick={save}>저장</button>
      </div>

      <BottomNavigation activeTab="home" />
      <MenuGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
      <MenuLeaveDialog open={leaveOpen} onStay={stayEditing} onLeave={leaveWithoutSaving} />
      <MenuChangeDialog flow={changeFlow} onClose={() => setChangeFlow(null)} />
    </div>
  );
}

export default MenuManagePage;
