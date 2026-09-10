import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { img } from '../../lib/asset';

/* 전역 AI 챗봇 플로팅 버튼 (JADUYA AGENTS/CLAUDE.md: 챗봇은 카드가 아니라 FAB).
 *
 * 인터랙션: 자유 드래그 → 드래그 종료 → 가까운 좌/우 사이드로 스냅 →
 * 그 사이드에서 세로 위치 유지.
 * 세로 범위는 헤더 아래 ~ 바텀네비 위로 제한한다. */

const SIZE = 64; // 버튼 지름
const EDGE = 16; // 좌우 안전 여백
const GAP = 8; // 헤더 / 바텀네비와의 최소 간격
const MOVE_THRESHOLD = 5; // 이 값 이하로 움직이면 클릭으로 본다

type Side = 'left' | 'right';

interface Bounds {
  width: number;
  height: number;
  minTop: number;
  maxTop: number;
}

/** .app 안에서 버튼이 움직일 수 있는 범위 — 헤더/바텀네비 높이는 실제 요소에서 잰다. */
function readBounds(host: HTMLElement | null): Bounds | null {
  const app = host?.offsetParent as HTMLElement | null;
  if (!app) return null;
  const headerH = app.querySelector<HTMLElement>('.header')?.offsetHeight ?? 100;
  const tabBarH = app.querySelector<HTMLElement>('.tab-bar')?.offsetHeight ?? 91;
  const minTop = headerH + GAP;
  const maxTop = Math.max(minTop, app.clientHeight - tabBarH - GAP - SIZE);
  return { width: app.clientWidth, height: app.clientHeight, minTop, maxTop };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface AIChatbotButtonProps {
  /** 드래그가 아닌 '클릭' 으로 판정됐을 때만 호출된다 */
  onClick: () => void;
  hidden?: boolean;
}

export function AIChatbotButton({ onClick, hidden = false }: AIChatbotButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [side, setSide] = useState<Side>('right');
  /* 세로 위치. null 이면 아직 측정 전 — 기본값(바텀네비 바로 위)으로 배치한다. */
  const [top, setTop] = useState<number | null>(null);
  /* 드래그 중에만 쓰는 자유 좌표 */
  const [freePos, setFreePos] = useState<{ left: number; top: number } | null>(null);

  const drag = useRef<{
    id: number;
    dx: number;
    dy: number;
    startX: number;
    startY: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);

  /* 최초 배치 + 화면 크기 변화 시 범위 안으로 다시 넣는다 */
  const settle = useCallback(() => {
    const bounds = readBounds(ref.current);
    if (!bounds) return;
    setTop((current) => clamp(current ?? bounds.maxTop, bounds.minTop, bounds.maxTop));
  }, []);

  useEffect(() => {
    settle();
    window.addEventListener('resize', settle);
    return () => window.removeEventListener('resize', settle);
  }, [settle]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const bounds = readBounds(ref.current);
    if (!bounds || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const app = ref.current.offsetParent as HTMLElement;
    const appRect = app.getBoundingClientRect();
    drag.current = {
      id: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left - appRect.left,
      top: rect.top - appRect.top,
      moved: false,
    };
    ref.current.setPointerCapture(event.pointerId);
    /* 여기서 자유 좌표로 바꾸지 않는다. 누르자마자 left/top 배치로 전환하면
     * 단순 탭에서도 버튼이 한 번 튀었다가 되돌아온다. 실제로 움직인 뒤에 전환한다. */
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const info = drag.current;
    const bounds = readBounds(ref.current);
    if (!info || info.id !== event.pointerId || !bounds || !ref.current) return;
    const appRect = (ref.current.offsetParent as HTMLElement).getBoundingClientRect();
    const left = clamp(event.clientX - appRect.left - info.dx, EDGE, bounds.width - EDGE - SIZE);
    const nextTop = clamp(event.clientY - appRect.top - info.dy, bounds.minTop, bounds.maxTop);
    /* 이동 판정은 포인터가 실제로 움직인 거리로 본다 (클램프된 위치가 아니라) */
    if (
      Math.abs(event.clientX - info.startX) > MOVE_THRESHOLD ||
      Math.abs(event.clientY - info.startY) > MOVE_THRESHOLD
    ) {
      info.moved = true;
    }
    info.left = left;
    info.top = nextTop;
    /* 임계값을 넘어 '드래그' 로 판정된 뒤에만 자유 좌표로 따라간다 */
    if (info.moved) setFreePos({ left, top: nextTop });
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const info = drag.current;
    if (!info || info.id !== event.pointerId) return;
    drag.current = null;
    const bounds = readBounds(ref.current);
    if (bounds && info.moved) {
      /* 가까운 사이드로 스냅하고, 세로 위치는 그대로 유지한다 */
      const center = info.left + SIZE / 2;
      setSide(center < bounds.width / 2 ? 'left' : 'right');
      setTop(clamp(info.top, bounds.minTop, bounds.maxTop));
    }
    setFreePos(null);
    if (!info.moved) onClick();
  };

  const dragging = freePos !== null;
  const style = dragging
    ? { left: `${freePos.left}px`, top: `${freePos.top}px`, right: 'auto' }
    : side === 'left'
      ? { left: `${EDGE}px`, right: 'auto', top: top === null ? undefined : `${top}px` }
      : { right: `${EDGE}px`, left: 'auto', top: top === null ? undefined : `${top}px` };

  return (
    <button
      ref={ref}
      type="button"
      className={`ai-fab${dragging ? ' is-dragging' : ''}`}
      style={style}
      hidden={hidden}
      aria-label="자두 AI 챗봇 열기"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <img src={img('ai_icon.png')} alt="" draggable={false} />
    </button>
  );
}
