import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ForwardedRef, PointerEvent as ReactPointerEvent } from 'react';
import { img } from '../../lib/asset';

/* 전역 AI 챗봇 플로팅 버튼 (JADUYA AGENTS/CLAUDE.md: 챗봇은 카드가 아니라 FAB).
 *
 * 인터랙션: 자유 드래그 → 드래그 종료 → 가까운 좌/우 사이드로 스냅 →
 * 그 사이드에서 세로 위치 유지.
 * 세로 범위는 헤더 아래 ~ 바텀네비 위로 제한한다. */

const SIZE = 72; // 버튼 지름
const EDGE = 16; // 좌우 안전 여백
const GAP = 8; // 헤더 / 바텀네비와의 최소 간격
const INITIAL_GNB_GAP_RATIO = 0.05; // 최초 위치: GNB 위 화면 높이의 5%
/* 이 값 이하로 움직이면 클릭으로 본다. 마우스는 누르고 떼는 사이 몇 px 씩 흔들려서
 * 터치 기준(5px)으로는 단순 클릭이 드래그로 오판된다 — 8px 로 둔다. */
const MOVE_THRESHOLD = 8;

type Side = 'left' | 'right';

interface Bounds {
  width: number;
  height: number;
  tabBarH: number;
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
  return { width: app.clientWidth, height: app.clientHeight, tabBarH, minTop, maxTop };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/* 커뮤니티 글쓰기 버튼 둘레로 비워 둘 여백(px) */
const RESERVED_PAD = 14;

/* 같은 .app 안에 글쓰기 버튼이 있으면 그 자리를 레이아웃 px 로 돌려준다.
 * 글쓰기 버튼도 .app 기준 absolute 라 offset* 값이 곧 레이아웃 좌표다 —
 * getBoundingClientRect 와 달리 데스크톱 프리뷰의 zoom 배율을 신경 쓸 필요가 없다.
 * 커뮤니티가 아닌 화면에는 이 요소가 없어 null 이 되고, 아무것도 제한하지 않는다. */
function readReservedZone(host: HTMLElement | null) {
  const app = host?.offsetParent as HTMLElement | null;
  const fab = app?.querySelector<HTMLElement>('.community-fab');
  if (!app || !fab || fab.offsetParent !== app) return null;
  return {
    left: fab.offsetLeft - RESERVED_PAD,
    top: fab.offsetTop - RESERVED_PAD,
    right: fab.offsetLeft + fab.offsetWidth + RESERVED_PAD,
    bottom: fab.offsetTop + fab.offsetHeight + RESERVED_PAD,
  };
}

/* 챗봇(72px 정사각)이 금지 영역과 겹치면 가장 적게 움직이는 안전한 자리로 옮긴다.
 * 중심점이 아니라 버튼 박스 전체로 겹침을 본다. */
function avoidReserved(
  side: Side,
  top: number,
  bounds: Bounds,
  zone: ReturnType<typeof readReservedZone>,
): { side: Side; top: number } {
  if (!zone) return { side, top };
  const leftOf = (value: Side) => (value === 'left' ? EDGE : bounds.width - EDGE - SIZE);
  const hits = (value: Side, y: number) => {
    const x = leftOf(value);
    return x < zone.right && x + SIZE > zone.left && y < zone.bottom && y + SIZE > zone.top;
  };
  if (!hits(side, top)) return { side, top };

  /* ① 같은 쪽에서 위로 — 바텀네비/헤더 범위를 벗어나지 않을 때만 쓴다 */
  const above = zone.top - SIZE;
  const upward =
    above >= bounds.minTop && !hits(side, above) ? { side, top: above, move: top - above } : null;
  /* ② 반대쪽으로 — 세로 위치는 그대로 둔다 */
  const other: Side = side === 'left' ? 'right' : 'left';
  const sideways = !hits(other, top)
    ? { side: other, top, move: Math.abs(leftOf(other) - leftOf(side)) }
    : null;

  const best = [upward, sideways]
    .filter((option): option is NonNullable<typeof option> => option !== null)
    .sort((a, b) => a.move - b.move)[0];
  /* 둘 다 막히면(아주 좁은 화면) 최소한 범위 안에는 남긴다 */
  return best
    ? { side: best.side, top: best.top }
    : { side, top: clamp(above, bounds.minTop, bounds.maxTop) };
}

/* 데스크톱 프리뷰(IPhoneFrame)는 .app 을 zoom: var(--phone-scale) 로 축소한다.
 * getBoundingClientRect() 는 줌이 적용된 "화면" px 를, offsetWidth / style.top 은 줌과
 * 무관한 "레이아웃" px 를 쓴다. 둘을 섞으면 드래그가 끝나는 순간 버튼이 줌 배율만큼
 * 위로 튀어오른다. rect 로 잰 값은 전부 이 배율로 나눠 레이아웃 px 로 되돌린다.
 * (Coachmark.tsx 의 getScale 과 같은 계산 — 실기기는 zoom 이 없어 항상 1 이다) */
function getScale(app: HTMLElement): number {
  const real = app.getBoundingClientRect().width;
  return app.offsetWidth ? real / app.offsetWidth : 1;
}

interface AIChatbotButtonProps {
  /** 드래그가 아닌 '클릭' 으로 판정됐을 때만 호출된다.
   * 진입 모프가 버튼의 현재(드래그된) 위치를 시작점으로 쓰므로 버튼 자체를 넘긴다. */
  onClick: (button: HTMLButtonElement | null) => void;
  hidden?: boolean;
  /** fullscreen AI overlay 아래에 남아 있을 때는 보이지 않지만, 입력만 막는다. */
  disabled?: boolean;
  /** 최초 배치를 기본(바텀네비 바로 위)보다 이만큼(px) 위로 올린다.
   * 커뮤니티 글쓰기 버튼처럼 그 자리에 이미 다른 플로팅 버튼이 있을 때만 쓴다.
   * 최초 배치에만 영향을 주고, 이후 드래그/리사이즈 동작은 그대로다. */
  initialLift?: number;
  /** 코치마크가 강조 영역을 잴 때만 쓰는 DOM 참조. 버튼은 드래그로 위치가 바뀌므로
   * 좌표를 고정값으로 들고 있지 말고 이 ref 로 매번 실측해야 한다. */
  coachmarkRef?: ForwardedRef<HTMLButtonElement>;
  /** 화면이 바뀐 뒤 다시 배치해야 할 때 부모가 부르는 통로.
   * 이 버튼은 화면을 옮겨도 다시 마운트되지 않아서, 새 화면의 금지 영역(글쓰기 버튼)을
   * 다시 재려면 바깥에서 한 번 불러 줘야 한다. */
  settleRef?: { current: (() => void) | null };
}

export function AIChatbotButton({
  onClick,
  hidden = false,
  disabled = false,
  initialLift = 0,
  coachmarkRef,
  settleRef,
}: AIChatbotButtonProps) {
  /* coachmarkRef 병합을 위해 직접 .current 를 대입해야 해서 MutableRefObject 로 잡는다 */
  const ref = useRef<HTMLButtonElement | null>(null);
  const [side, setSide] = useState<Side>('right');
  /* 세로 위치. null 이면 아직 측정 전 — 기본값(바텀네비 바로 위)으로 배치한다. */
  const [top, setTop] = useState<number | null>(null);
  /* 드래그 중에만 쓰는 자유 좌표 */
  const [freePos, setFreePos] = useState<{ left: number; top: number } | null>(null);
  /* 오른쪽 스냅 위치를 left 로 계산하기 위한 .app 폭. null 이면 아직 측정 전이다. */
  const [appWidth, setAppWidth] = useState<number | null>(null);
  /* settle 이 side 와 top 을 한 번에 보정해야 해서 지금 값을 그대로 비춰 둔다(읽기 전용) */
  const sideRef = useRef(side);
  const topRef = useRef(top);
  /* 최초 위치만 CSS/JS 모두 우측 5vw를 사용한다. 실제 사용자가 옮긴 뒤에는
   * 기존 EDGE 스냅 규칙을 그대로 유지한다. */
  const hasUserPosition = useRef(false);
  sideRef.current = side;
  topRef.current = top;

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
    /* CSS의 초기 bottom(--tab-bar-h + 5vh)과 같은 기준을 쓴다. --tab-bar-h 는
     * 모바일 safe-area를 이미 포함하므로 여기서 inset을 중복하지 않는다. */
    const defaultTop =
      bounds.height - bounds.tabBarH - bounds.height * INITIAL_GNB_GAP_RATIO - SIZE - initialLift;
    const safeTop = clamp(topRef.current ?? defaultTop, bounds.minTop, bounds.maxTop);
    /* 저장해 둔 자리가 글쓰기 버튼과 겹치면(커뮤니티 재진입·화면 회전 등) 여기서 바로 비켜 준다 */
    const fixed = avoidReserved(sideRef.current, safeTop, bounds, readReservedZone(ref.current));
    setSide(fixed.side);
    setTop(fixed.top);
    setAppWidth(bounds.width);
  }, [initialLift]);

  /* useLayoutEffect: 첫 페인트 전에 위치를 계산해 확정한다.
   * useEffect(페인트 이후)를 쓰면 기본 위치로 한 프레임 그려졌다가 실제 위치로
   * 튀어 보인다 — 특히 탭마다 전체 화면이 다시 마운트되는 커뮤니티에서 두드러졌다. */
  useLayoutEffect(() => {
    settle();
    window.addEventListener('resize', settle);
    if (settleRef) settleRef.current = settle;
    return () => {
      window.removeEventListener('resize', settle);
      if (settleRef) settleRef.current = null;
    };
  }, [settle, settleRef]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const bounds = readBounds(ref.current);
    if (!bounds || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const app = ref.current.offsetParent as HTMLElement;
    const appRect = app.getBoundingClientRect();
    const scale = getScale(app);
    drag.current = {
      id: event.pointerId,
      dx: (event.clientX - rect.left) / scale,
      dy: (event.clientY - rect.top) / scale,
      startX: event.clientX,
      startY: event.clientY,
      left: (rect.left - appRect.left) / scale,
      top: (rect.top - appRect.top) / scale,
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
    const app = ref.current.offsetParent as HTMLElement;
    const appRect = app.getBoundingClientRect();
    const scale = getScale(app);
    const left = clamp(
      (event.clientX - appRect.left) / scale - info.dx,
      EDGE,
      bounds.width - EDGE - SIZE,
    );
    const nextTop = clamp(
      (event.clientY - appRect.top) / scale - info.dy,
      bounds.minTop,
      bounds.maxTop,
    );
    /* 이동 판정은 포인터가 실제로 움직인 거리로 본다 (클램프된 위치가 아니라).
     * 이 거리도 화면 px 라서 같은 배율로 되돌려 임계값과 단위를 맞춘다. */
    if (
      Math.abs(event.clientX - info.startX) / scale > MOVE_THRESHOLD ||
      Math.abs(event.clientY - info.startY) / scale > MOVE_THRESHOLD
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
      hasUserPosition.current = true;
      /* 가까운 사이드로 스냅하고, 세로 위치는 그대로 유지한다 */
      const center = info.left + SIZE / 2;
      const snapped = center < bounds.width / 2 ? 'left' : 'right';
      /* 놓은 자리가 글쓰기 버튼과 겹치면 가장 가까운 안전한 자리로 보정한다 */
      const fixed = avoidReserved(
        snapped,
        clamp(info.top, bounds.minTop, bounds.maxTop),
        bounds,
        readReservedZone(ref.current),
      );
      setSide(fixed.side);
      setTop(fixed.top);
      setAppWidth(bounds.width);
    }
    setFreePos(null);
    if (!info.moved) onClick(ref.current);
  };

  const dragging = freePos !== null;
  const restTop = top === null ? undefined : `${top}px`;
  /* 양쪽 모두 left 로 배치한다 — 오른쪽만 right 로 두면 스냅할 때 left 가 px→auto 로
   * 바뀌어 transition 이 걸리지 않고 툭 붙는다(왼쪽만 부드럽던 이유).
   * 폭을 아직 못 쟀을 때(첫 렌더)만 right 로 두고, settle() 직후 left 배치로 넘어간다. */
  const style = dragging
    ? { left: `${freePos.left}px`, top: `${freePos.top}px`, right: 'auto' }
    : appWidth === null
      /* layout effect 전에도 CSS 기본 위치를 그대로 써 (0, 0)이나 화면 밖 좌표를
       * 그리지 않는다. viewport 측정 뒤에는 위 defaultTop과 같은 기준으로 확정된다. */
      ? { right: '5vw', bottom: 'calc(var(--tab-bar-h) + 5vh)', left: 'auto', top: restTop }
      : {
          left: `${side === 'left'
            ? EDGE
            : appWidth - (hasUserPosition.current ? EDGE : appWidth * INITIAL_GNB_GAP_RATIO) - SIZE}px`,
          right: 'auto',
          top: restTop,
        };

  return (
    <button
      ref={(node) => {
        ref.current = node;
        if (typeof coachmarkRef === 'function') coachmarkRef(node);
        else if (coachmarkRef) coachmarkRef.current = node;
      }}
      type="button"
      className={`ai-fab${dragging ? ' is-dragging' : ''}${hidden ? ' is-hidden' : ''}${disabled ? ' is-disabled' : ''}`}
      style={style}
      disabled={disabled}
      aria-hidden={hidden}
      tabIndex={hidden || disabled ? -1 : 0}
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
