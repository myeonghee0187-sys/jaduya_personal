import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { icon } from '../../lib/asset';

/* JADUYA — "이번 달" 예산 카드 오른쪽 위 리본. 라벨("예산 설정 >")과 현재 예산 금액을
 * 한 줄에 다 담을 수 없어 처음엔 두 줄로 쌓았는데, 한 줄 높이를 유지하면서 두 정보를
 * 모두 보여주기 위해 좌우로 미는 작은 카드뷰(mini pager)로 바꿨다.
 * 손가락을 따라 실시간으로 움직이다가, 놓는 순간 방향/이동거리로 스냅 or 탭을 가른다 —
 * 탭(이동 없음)이면 예산 설정으로 이동하고, 스와이프(임계값 이상 이동)면 페이지만 넘긴다. */

const SWIPE_THRESHOLD = 16;
const TAP_MOVE_TOLERANCE = 5;

interface BudgetRibbonProps {
  editLabel: string;
  amountText: string;
  onNavigate: () => void;
}

export function BudgetRibbon({ editLabel, amountText, onNavigate }: BudgetRibbonProps) {
  const [page, setPage] = useState<0 | 1>(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const movedRef = useRef(false);

  const clampDrag = (delta: number) => {
    const width = viewportRef.current?.offsetWidth ?? 96;
    if (page === 0) return Math.max(-width, Math.min(0, delta));
    return Math.max(0, Math.min(width, delta));
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startXRef.current = e.clientX;
    movedRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > TAP_MOVE_TOLERANCE) movedRef.current = true;
    setDragX(clampDrag(delta));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (!movedRef.current) {
      onNavigate();
    } else if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      setPage((p) => (p === 0 ? 1 : 0));
    }
    setDragX(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate();
      return;
    }
    if (e.key === 'ArrowLeft') setPage(0);
    if (e.key === 'ArrowRight') setPage(1);
  };

  const width = viewportRef.current?.offsetWidth ?? 96;
  const basePx = page === 0 ? 0 : -width;
  const trackX = basePx + dragX;

  return (
    <div
      className="money-budget__ribbon"
      role="button"
      tabIndex={0}
      aria-label={`${editLabel}, 현재 예산 ${amountText}. 좌우로 밀어 정보를 바꿔볼 수 있어요.`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => dragging && endDrag()}
      onKeyDown={handleKeyDown}
    >
      <div className="money-budget__ribbon-viewport" ref={viewportRef}>
        <div
          className={`money-budget__ribbon-track${dragging ? ' is-dragging' : ''}`}
          style={{ transform: `translateX(${trackX}px)` }}
        >
          <span className="money-budget__ribbon-page">
            {editLabel}
            <img src={icon('chevron-right-white.svg')} alt="" />
          </span>
          <span className="money-budget__ribbon-page money-budget__ribbon-page--amount">{amountText}</span>
        </div>
      </div>
      <span className="money-budget__ribbon-dots" aria-hidden="true">
        <span className={page === 0 ? 'is-active' : ''} />
        <span className={page === 1 ? 'is-active' : ''} />
      </span>
    </div>
  );
}

export default BudgetRibbon;
