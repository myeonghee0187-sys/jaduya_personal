import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import '../styles/statement-peek.css';
import { SpendingHistory } from './money/SpendingHistory';
import { NEXT_CARD_PAYMENT } from '../data/moneyFixed';
import { img } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useDismissOnBack } from '../navigation/useDismissOnBack';

interface StatementPeekProps {
  /** 이번 달 화면에서만 보인다 */
  visible: boolean;
  /** "고정비 보기"를 눌렀을 때 — 같은 화면 안 탭으로 바꿀 때 넘긴다(없으면 돈관리 화면으로 이동) */
  onViewFixed?: () => void;
}

/* 손가락 속도(px/ms)가 이 값을 넘으면 놓은 위치와 상관없이 그 방향으로 끝까지 간다(flick) */
const FLICK_VELOCITY = 0.35;
/* 이만큼(px) 움직이기 전에는 탭으로 본다 */
const DRAG_START = 5;

interface Drag {
  pid: number;
  startY: number;
  p0: number;
  /** p 가 0→1 이 되는 동안 카드 윗변이 움직이는 거리(화면 px) */
  travel: number;
  lastY: number;
  lastT: number;
  /** 손가락 속도(px/ms, 아래가 +) */
  v: number;
  p: number;
  moved: boolean;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* 화면 아래에 살짝 보이는 "결제 예정" 카드이자, 위로 끌면 올라오는 바텀시트 — 홈의 시트처럼 하나의 요소가
 * peek(접힘) ↔ expanded(펼침) 두 단계를 손가락을 따라 연속해서 오간다.
 *
 * 진행도 --stmt-p(0=접힘, 1=펼침) 하나로 시트 높이·아래 여백·딤 진하기가 전부 정해진다. 끌고 있을 때는 그 값을
 * 직접 쓰고(transition 없음), 놓으면 속도·위치로 가까운 단계를 골라 CSS transition 이 이어서 움직인다.
 *   · 카드(빨간 영역) 어디든 위/아래로 끌 수 있고, 탭하면 펼쳐진다.
 *   · 펼친 상태에서 내역이 맨 위일 때 아래로 끌면 시트가 접힌다(터치) / 휠을 위로 굴려도 같다.
 *   · 닫기: 딤 탭 · Esc · 뒤로가기 · 아래로 끌기.
 * 달력은 처음에 한 줄만 보이고 아래 화살표로 펼치며, 날짜·금액은 고정비·거래 원본에서 계산해 돈관리 화면과 같다. */
export function StatementPeek({ visible, onViewFixed }: StatementPeekProps) {
  const navigation = useAppNavigation();
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  /* 펼치거나 끄는 동안(그리고 다 접힌 직후 잠깐)만 탭 바 위로 올라오게 z-index 를 올려 둔다 */
  const [active, setActive] = useState(false);
  /* 열 때마다 내역을 새로 마운트해 월·선택한 날·보기를 처음 상태로 되돌린다 */
  const [openCount, setOpenCount] = useState(0);

  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const bodyWrapRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const dragRef = useRef<Drag | null>(null);
  const suppressClickRef = useRef(false);

  const setOpenState = useCallback((next: boolean) => {
    if (next === expandedRef.current) return;
    expandedRef.current = next;
    if (next) setOpenCount((count) => count + 1);
    setExpanded(next);
  }, []);
  const collapse = useCallback(() => setOpenState(false), [setOpenState]);

  /* 뒤로가기는 화면을 벗어나기 전에 펼친 시트부터 접는다 */
  useDismissOnBack(expanded && visible, collapse);

  useEffect(() => {
    if (!visible) {
      expandedRef.current = false;
      setExpanded(false);
      setDragging(false);
      dragRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    if (expanded || dragging) {
      setActive(true);
      return;
    }
    const timer = window.setTimeout(() => setActive(false), 520);
    return () => window.clearTimeout(timer);
  }, [expanded, dragging]);

  /* 접힌 동안엔 내역에 포커스가 가지 않게 한다 */
  useEffect(() => {
    bodyWrapRef.current?.toggleAttribute('inert', !expanded);
  }, [expanded, visible]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') collapse();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, collapse]);

  /* ---- 끌기 ---- */
  const beginDrag = (clientY: number, pid: number) => {
    const overlay = overlayRef.current;
    const anchor = anchorRef.current;
    const probe = probeRef.current;
    if (!overlay || !anchor || !probe) return false;
    const current = parseFloat(getComputedStyle(overlay).getPropertyValue('--stmt-p'));
    const p0 = Number.isFinite(current) ? current : expandedRef.current ? 1 : 0;
    /* anchor = 접힌 카드의 윗변, probe = 펼친 카드의 윗변(둘 다 CSS 값 그대로 잰다) */
    const travelCss = Math.max(1, anchor.offsetTop - probe.offsetTop);
    /* 데스크톱 iPhone 목업처럼 zoom 으로 줄여 보이는 화면에서는 포인터 px 과 CSS px 비율이 1 이 아니다 */
    const scale = overlay.offsetHeight > 0 ? overlay.getBoundingClientRect().height / overlay.offsetHeight : 1;
    dragRef.current = {
      pid,
      startY: clientY,
      p0,
      travel: travelCss * scale,
      lastY: clientY,
      lastT: performance.now(),
      v: 0,
      p: p0,
      moved: false,
    };
    return true;
  };

  const moveDrag = (clientY: number) => {
    const drag = dragRef.current;
    const overlay = overlayRef.current;
    if (!drag || !overlay) return;
    const now = performance.now();
    const dt = now - drag.lastT;
    if (dt > 0) drag.v = 0.6 * drag.v + 0.4 * ((clientY - drag.lastY) / dt);
    drag.lastY = clientY;
    drag.lastT = now;
    drag.p = clamp01(drag.p0 - (clientY - drag.startY) / drag.travel);
    overlay.style.setProperty('--stmt-p', drag.p.toFixed(4));
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !drag.moved) return;
    overlayRef.current?.style.removeProperty('--stmt-p');
    setDragging(false);
    const target = drag.v < -FLICK_VELOCITY ? true : drag.v > FLICK_VELOCITY ? false : drag.p > 0.5;
    setOpenState(target);
  };

  const onCardPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    suppressClickRef.current = false;
    beginDrag(event.clientY, event.pointerId);
  };
  const onCardPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pid) return;
    if (!drag.moved) {
      if (Math.abs(event.clientY - drag.startY) < DRAG_START) return;
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    moveDrag(event.clientY);
  };
  const onCardPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pid) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
    endDrag();
  };
  /* 끌고 난 뒤 손을 떼면서 생기는 click 은 "탭"이 아니라 무시한다 */
  const onCardClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!expandedRef.current) setOpenState(true);
  };
  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (expandedRef.current || event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpenState(true);
    }
  };

  /* 펼친 상태에서 내역이 맨 위일 때 아래로 끌면 시트가 따라 내려온다(터치), 휠도 같다.
   * 스크롤과 겹치는 제스처라 React 의 passive 리스너로는 preventDefault 가 안 돼 직접 등록한다. */
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const scroller = () => sheet.querySelector<HTMLElement>('.statement-sheet__body');
    let touch: { startY: number; active: boolean } | null = null;

    const onTouchStart = (event: TouchEvent) => {
      touch = null;
      if (!expandedRef.current || !(event.target as HTMLElement).closest('.statement-sheet__body')) return;
      touch = { startY: event.touches[0].clientY, active: false };
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!touch) return;
      const y = event.touches[0].clientY;
      if (!touch.active) {
        const el = scroller();
        if (!el || el.scrollTop > 0) {
          touch.startY = y;
          return;
        }
        if (y - touch.startY < 8) return;
        if (!beginDrag(y, -1)) return;
        dragRef.current!.moved = true;
        touch.active = true;
        setDragging(true);
      }
      if (event.cancelable) event.preventDefault();
      moveDrag(y);
    };
    const onTouchEnd = () => {
      if (touch?.active) endDrag();
      touch = null;
    };
    const onWheel = (event: WheelEvent) => {
      if (!expandedRef.current && event.deltaY > 0) {
        event.preventDefault();
        setOpenState(true);
      } else if (expandedRef.current && event.deltaY < 0 && (scroller()?.scrollTop ?? 1) === 0) {
        event.preventDefault();
        setOpenState(false);
      }
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', onTouchEnd);
    sheet.addEventListener('touchcancel', onTouchEnd);
    sheet.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
      sheet.removeEventListener('touchcancel', onTouchEnd);
      sheet.removeEventListener('wheel', onWheel);
    };
    // beginDrag/moveDrag/endDrag 는 ref 만 읽어서 다시 만들 필요가 없다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !NEXT_CARD_PAYMENT) return null;
  const { day: payDay, amount } = NEXT_CARD_PAYMENT;
  const title = `9월 ${payDay}일 카드값`;

  /* 시트 안 버튼(고정비 보기 / 예산 설정 / 내 계좌)으로 화면을 옮길 때는 시트를 먼저 접지 않고 바로 이동한다.
   * 시트를 먼저 닫으면 시트가 쌓아 둔 뒤로가기 기록을 정리하는 "뒤로 한 칸"이 방금 한 이동을 되돌려서, 눌러도 화면이
   * 안 넘어가 보인다. 이동하면 이 화면(시트 포함)이 사라지면서 기록이 알아서 정리되고, 돌아오면 시트는 접힌 채다. */
  const goTo = (action: () => void) => {
    action();
  };

  return (
    <>
      {/* 접힌 카드가 놓이는 자리 표시 — AI 챗봇 버튼이 이 요소의 윗변을 읽어 시트 위로 비켜 앉는다 */}
      <div className="statement-peek" ref={anchorRef} aria-hidden="true" />

      <div
        ref={overlayRef}
        className={`stmt-overlay${expanded ? ' is-expanded' : ''}${dragging ? ' is-dragging' : ''}${active ? ' is-active' : ''}`}
      >
        <div className="stmt-probe" ref={probeRef} aria-hidden="true" />
        <button
          type="button"
          className="stmt-dim"
          aria-label="닫기"
          aria-hidden={!expanded}
          tabIndex={expanded ? 0 : -1}
          onClick={collapse}
        />

        <section
          ref={sheetRef}
          className="statement-sheet"
          aria-labelledby="statement-sheet-title"
          role={expanded ? 'dialog' : undefined}
          aria-modal={expanded || undefined}
        >
          <div
            className="statement-sheet__card"
            role={expanded ? undefined : 'button'}
            tabIndex={expanded ? undefined : 0}
            aria-haspopup={expanded ? undefined : 'dialog'}
            aria-expanded={expanded ? undefined : false}
            onPointerDown={onCardPointerDown}
            onPointerMove={onCardPointerMove}
            onPointerUp={onCardPointerUp}
            onPointerCancel={onCardPointerUp}
            onClick={onCardClick}
            onKeyDown={onCardKeyDown}
          >
            <div className="statement-sheet__grip" aria-hidden="true">
              <span />
            </div>
            <div className="statement-sheet__top">
              <img
                className="statement-sheet__art"
                src={img('jaduya_custom_recommendation_36/money_management/5b7cbe22-649f-4893-94ce-a1aa616d64a2 2.png')}
                alt=""
                draggable={false}
              />
              <div className="statement-sheet__info">
                <p className="statement-sheet__head">
                  <span className="statement-peek__badge">예정</span>
                  <span id="statement-sheet-title" className="statement-sheet__title">
                    {title}
                  </span>
                </p>
                <p className="statement-sheet__amount">{amount.toLocaleString()}원</p>
                <p className="statement-sheet__cards">
                  {NEXT_CARD_PAYMENT.cards.length > 2
                    ? `카드 ${NEXT_CARD_PAYMENT.cards.length}장 · 이번 달 카드 사용액과 같아요`
                    : NEXT_CARD_PAYMENT.cards.map((card) => `${card.issuer} ${card.amount.toLocaleString()}원`).join(' + ')}
                </p>
              </div>
            </div>
            <div className="statement-sheet__actions">
              <button type="button" onClick={() => goTo(onViewFixed ?? (() => navigation?.navigate('money-fixed')))}>
                고정비 보기
              </button>
              <button type="button" onClick={() => goTo(() => navigation?.navigate('money-budget'))}>
                예산 설정
              </button>
              <button type="button" onClick={() => goTo(() => navigation?.navigate('money-accounts'))}>
                내 계좌
              </button>
            </div>
          </div>

          <div className="statement-sheet__content" ref={bodyWrapRef}>
            <SpendingHistory key={openCount} onOpenExpensePage={() => goTo(() => navigation?.navigate('money-expense'))} />
          </div>
        </section>
      </div>
    </>
  );
}
