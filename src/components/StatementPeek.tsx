import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import '../styles/statement-peek.css';
import { BottomSheet } from './BottomSheet';
import { SpendingHistory } from './money/SpendingHistory';
import { NEXT_CARD_PAYMENT } from '../data/moneyFixed';
import { img } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';

interface StatementPeekProps {
  /** 이번 달 화면에서만 보인다 */
  visible: boolean;
  /** "고정비 보기"를 눌렀을 때 — 같은 화면 안 탭으로 바꿀 때 넘긴다(없으면 돈관리 화면으로 이동) */
  onViewFixed?: () => void;
}

/* 시트가 올라오는 높이 — 홈의 바텀시트가 펼쳐졌을 때 놓이는 위치(--sheet-top-expanded, app-shell.css)와 같다.
 * 홈 시트와 똑같은 높이까지만 올라온다. 손잡이를 아래로 80px 넘게 끌면 닫힌다. */
const SHEET_HEIGHT = 'calc(100% - var(--sheet-top-expanded, 113px))';
const CLOSE_DRAG = 80;

interface DragState {
  startY: number;
  dy: number;
  sheetH: number;
}

/* 화면 아래쪽에 살짝 보이는 "결제 예정" 카드 — 누르면 바텀시트가 올라온다(카드사 앱처럼: 위쪽은 카드 모양의 결제
 * 요약, 아래는 월 이동 · 소비 분류 · 접었다 펼치는 지출 달력 · 이용 내역).
 * 달력은 처음에 한 줄(선택한 날이 있는 주)만 보이고, 아래 화살표로 펼치며, 펼친 상태에서 내역을 아래로 스크롤하면
 * 다시 한 줄로 접힌다. 닫기: 딤 탭 / × / 뒤로가기 / 손잡이를 아래로 끌기.
 * 날짜·금액은 고정비·거래 원본에서 계산한 값이라 돈관리 화면과 항상 같다. */
export function StatementPeek({ visible, onViewFixed }: StatementPeekProps) {
  const navigation = useAppNavigation();
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const closeSheet = () => setOpen(false);

  /* 손잡이 끌기 — 아래로만 움직인다. 시작할 때 시트 높이를 재 둔다. */
  const onGripDown = (event: ReactPointerEvent<HTMLElement>) => {
    const sheetH = cardRef.current?.closest('.bsheet')?.getBoundingClientRect().height ?? 0;
    if (sheetH === 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ startY: event.clientY, dy: 0, sheetH });
  };
  const onGripMove = (event: ReactPointerEvent<HTMLElement>) => {
    setDrag((prev) => (prev ? { ...prev, dy: Math.max(0, event.clientY - prev.startY) } : prev));
  };
  const onGripUp = () => {
    if (!drag) return;
    if (drag.dy > CLOSE_DRAG) closeSheet();
    setDrag(null);
  };

  /* 열 때마다 새로 마운트해 월·선택한 날·보기를 처음 상태로 되돌린다 */
  const [openCount, setOpenCount] = useState(0);
  const openSheet = () => {
    setOpenCount((count) => count + 1);
    setOpen(true);
  };

  /* 뒤의 돈 관리 화면 딤 — 열려 있는 동안은 전체 딤. 닫으려고 끌어 내리는 동안에는 시트 높이의 절반까지 내려가는
   * 사이에 옅어져서 0까지 사라진다. */
  const dimAlpha = drag ? Math.max(0, 1 - drag.dy / (drag.sheetH / 2)) : 1;
  const sheetStyle: CSSProperties = drag
    ? { height: SHEET_HEIGHT, transform: `translateY(${drag.dy}px)`, transition: 'none' }
    : { height: SHEET_HEIGHT };

  if (!NEXT_CARD_PAYMENT) return null;
  const { day: payDay, amount } = NEXT_CARD_PAYMENT;
  const title = `9월 ${payDay}일 카드값`;

  /* 시트 안 버튼(고정비 보기 / 예산 설정 / 내 계좌)으로 화면을 옮길 때는 시트를 먼저 닫지 않고 바로 이동한다.
   * 시트를 먼저 닫으면 시트가 쌓아 둔 뒤로가기 기록을 정리하는 "뒤로 한 칸"이 방금 한 이동을 되돌려서, 눌러도 화면이
   * 안 넘어가 보인다. 이동하면 이 화면(시트 포함)이 사라지면서 기록이 알아서 정리되고, 돌아오면 시트는 닫힌 채다. */
  const goTo = (action: () => void) => {
    action();
  };

  return (
    <>
      {visible && (
        <button
          type="button"
          className="statement-peek"
          aria-haspopup="dialog"
          aria-label={`${title} ${amount.toLocaleString()}원, 자세히 보기`}
          onClick={openSheet}
        >
          <span className="statement-peek__handle" aria-hidden="true" />
          <img className="statement-peek__art" src={img('02money-insight-badge.png')} alt="" />
          <span className="statement-peek__info">
            <span className="statement-peek__head">
              <span className="statement-peek__badge">예정</span>
              <span className="statement-peek__title">{title}</span>
            </span>
            <span className="statement-peek__amount">{amount.toLocaleString()}원</span>
          </span>
        </button>
      )}

      <BottomSheet
        open={open}
        className="statement-sheet"
        labelledBy="statement-sheet-title"
        layerClassName={`statement-layer${drag ? ' is-dragging' : ''}`}
        layerStyle={{ '--stmt-dim': dimAlpha } as CSSProperties}
        sheetStyle={sheetStyle}
        onDimClick={closeSheet}
      >
        <div className="statement-sheet__card" ref={cardRef}>
          <div
            className="statement-sheet__grip"
            onPointerDown={onGripDown}
            onPointerMove={onGripMove}
            onPointerUp={onGripUp}
            onPointerCancel={onGripUp}
          >
            <span aria-hidden="true" />
          </div>
          <div className="statement-sheet__top">
            <img className="statement-sheet__art" src={img('02money-insight-badge.png')} alt="" />
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
                  ? `카드 ${NEXT_CARD_PAYMENT.cards.length}장 · 이번 달 쓴 돈과 같아요`
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

        <SpendingHistory key={openCount} onOpenExpensePage={() => goTo(() => navigation?.navigate('money-expense'))} />
      </BottomSheet>
    </>
  );
}
