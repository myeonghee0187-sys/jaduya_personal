import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

/* JADUYA — "비상금" 탭 전용. 지금까지 모은 돈(도넛 링+금액)을 복권 은박지처럼
 * 실제로 긁어야 보이게 하는 오버레이. Figma에는 없는, 대화 중 새로 정한
 * 인터랙션이라 참고할 디자인 소스가 없다.
 *
 * - 실제 값(children)은 항상 DOM에 존재한다. canvas는 그 위를 시각적으로만 덮는
 *   "은박지" 레이어라 스크린리더에는 원래도 그대로 읽힌다.
 * - 절반 이상 긁으면 나머지를 자동으로 걷어낸다(실제 스크래치 카드의 표준 동작).
 * - 마우스 클릭 한 번으로 바로 열리지는 않는다(요청사항) — 실제로 드래그해서
 *   긁어야 한다. 다만 드래그가 불가능한 키보드 사용자를 위해 Enter/Space 는
 *   그대로 열어준다.
 * - canvas 크기는 wrap 의 offsetWidth/Height(레이아웃 px, transform 영향 없음)로
 *   정하고 CSS는 `inset:0`으로만 배치한다. 폰 프레임 데모처럼 조상 요소에
 *   transform: scale() 이 걸려 있어도(getBoundingClientRect 값이 달라져도)
 *   항상 부모를 정확히 꽉 채운다. 포인터 좌표도 같은 이유로 비율 변환해서 쓴다. */

const BRUSH_RADIUS = 26;
const CLEAR_THRESHOLD = 0.55;
const SAMPLE_STEP = 4;

type Phase = 'covered' | 'revealing' | 'revealed';

interface ScratchRevealProps {
  children: ReactNode;
  /** 커버에 보일 안내 문구 */
  label?: string;
  /** 커버(버튼 역할)의 접근성 라벨 */
  ariaLabel?: string;
}

export function ScratchReveal({
  children,
  label = '긁어서 확인하기',
  ariaLabel = '비상금 금액 긁어서 확인하기',
}: ScratchRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('covered');
  const [showHint, setShowHint] = useState(false);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    /* offsetWidth/Height — transform(scale) 의 영향을 받지 않는 실제 레이아웃 크기.
     * 폰 프레임 데모처럼 화면이 축소돼 있어도 캔버스가 항상 부모를 정확히 채운다. */
    const width = wrap.offsetWidth;
    const height = wrap.offsetHeight;
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    /* 은박지 느낌 — 대각선 브러시드 메탈 그라디언트 + 옅은 하이라이트 줄무늬 */
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#c7cad0');
    gradient.addColorStop(0.22, '#eef0f2');
    gradient.addColorStop(0.45, '#aeb2b9');
    gradient.addColorStop(0.6, '#e4e6e9');
    gradient.addColorStop(0.78, '#b6b9c0');
    gradient.addColorStop(1, '#dfe1e4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    for (let i = -height; i < width; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (phase !== 'covered') return;
    paintCover();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => paintCover());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [phase, paintCover]);

  useEffect(() => {
    if (phase !== 'covered') return;
    const timer = window.setTimeout(() => setShowHint(true), 2600);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const startReveal = useCallback(() => {
    setShowHint(false);
    setPhase('revealing');
    window.setTimeout(() => setPhase('revealed'), 280);
  }, []);

  const scratchAt = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearedRatio = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return 0;
    const { width, height } = canvas;
    const { data } = ctx.getImageData(0, 0, width, height);
    let cleared = 0;
    let sampled = 0;
    const step = SAMPLE_STEP * 4;
    for (let i = 3; i < data.length; i += step) {
      sampled += 1;
      if (data[i] === 0) cleared += 1;
    }
    return sampled === 0 ? 0 : cleared / sampled;
  };

  /* 포인터 좌표(화면에 실제로 보이는, transform 반영된 좌표)를 캔버스 내부
   * 레이아웃 좌표(=ctx 좌표계)로 비율 변환한다. 조상에 scale() 이 걸려 있어도
   * 정확한 지점이 긁힌다. */
  const toLocalPoint = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.offsetWidth / rect.width;
    const scaleY = canvas.offsetHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'covered') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    setShowHint(false);
    const p = toLocalPoint(e);
    scratchAt(p.x, p.y);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const p = toLocalPoint(e);
    scratchAt(p.x, p.y);
    if (clearedRatio() >= CLEAR_THRESHOLD) startReveal();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (clearedRatio() >= CLEAR_THRESHOLD) startReveal();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    /* 드래그가 어려운 키보드 사용자를 위한 접근성 경로 — 마우스 클릭으로는
     * 열리지 않고 실제 포인터 드래그가 필요하다(요청사항). */
    if (phase !== 'covered') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startReveal();
    }
  };

  if (phase === 'revealed') return <>{children}</>;

  return (
    <div className="money-fund-scratch" ref={wrapRef}>
      <div className="money-fund-scratch__content" aria-hidden="true">
        {children}
      </div>
      <div
        className={`money-fund-scratch__cover${phase === 'revealing' ? ' is-revealing' : ''}${showHint ? ' is-hinting' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        <canvas
          className="money-fund-scratch__canvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        <div className="money-fund-scratch__label">
          <span className="money-fund-scratch__coin">₩</span>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

export default ScratchReveal;
