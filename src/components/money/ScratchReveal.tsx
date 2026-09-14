import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

/* JADUYA — "비상금" 탭 전용. 지금까지 모은 돈을 복권 은박지처럼 실제로 긁어야
 * 보이게 하는 스크래치 카드. Figma에는 없는, 대화 중 새로 정한 인터랙션이라
 * 참고할 디자인 소스가 없다.
 *
 * - 실제 값(children)은 항상 DOM에 그려져 있다 — canvas는 그 위를 덮는 "은박지"
 *   레이어일 뿐이라, 긁어서 뚫린 구멍으로 아래 금액이 실제로 비쳐 보인다(진짜
 *   스크래치 복권과 같은 방식). 그래서 스크린리더에는 처음부터 그대로 읽힌다.
 * - 절반 이상 긁으면 나머지를 자동으로 걷어낸다(실제 스크래치 카드의 표준 동작).
 * - 마우스 클릭 한 번으로 바로 열리지는 않는다 — 실제로 드래그해서 긁어야 한다.
 *   다만 드래그가 불가능한 사용자를 위해 "비상금 금액 보기" 버튼과 Enter/Space 로
 *   같은 결과(전부 걷어내기)를 열어준다.
 * - canvas 크기는 wrap 의 offsetWidth/Height(레이아웃 px, transform 영향 없음)로
 *   정하고 CSS는 `inset:0`으로만 배치한다. 폰 프레임 데모처럼 조상 요소에
 *   transform: scale() 이 걸려 있어도(getBoundingClientRect 값이 달라져도)
 *   항상 부모를 정확히 꽉 채운다. 포인터 좌표도 같은 이유로 비율 변환해서 쓴다. */

const BRUSH_RADIUS = 28;
const CLEAR_THRESHOLD = 0.58;
const SAMPLE_STEP = 4;
/* 남은 은박지가 부드럽게 사라지는 시간 — EmergencyFundCard 의 축하 연출 타이밍과 맞춘다 */
const FADE_MS = 320;

type Phase = 'covered' | 'revealing' | 'revealed';

interface ScratchRevealProps {
  children: ReactNode;
  /** 커버(버튼 역할)의 접근성 라벨 */
  ariaLabel?: string;
  /** 전부 걷어내기(자동완료 또는 접근성 버튼)로 완전히 공개된 순간 한 번 호출된다 */
  onRevealed?: () => void;
}

export function ScratchReveal({
  children,
  ariaLabel = '비상금 금액 긁어서 확인하기',
  onRevealed,
}: ScratchRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('covered');

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

    /* 따뜻한 베이지/골드 "은박지" — 대각선 브러시드 그라디언트 + 옅은 종이 결 */
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e7cd9c');
    gradient.addColorStop(0.24, '#f3e2bb');
    gradient.addColorStop(0.48, '#dcb877');
    gradient.addColorStop(0.68, '#f0dba6');
    gradient.addColorStop(0.86, '#dcb877');
    gradient.addColorStop(1, '#ecd3a0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 250, 235, 0.4)';
    ctx.lineWidth = 2;
    for (let i = -height; i < width; i += 11) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    /* 옅은 종이 가루 질감 — 성능을 위해 개수를 적게 둔다(60개 고정) */
    ctx.fillStyle = 'rgba(120, 90, 40, 0.08)';
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 60; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
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

  const startReveal = useCallback(() => {
    setPhase('revealing');
    window.setTimeout(() => {
      setPhase('revealed');
      onRevealed?.();
    }, FADE_MS);
  }, [onRevealed]);

  const scratchAt = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    /* destination-out 는 채우는 색의 알파만큼만 지운다 — paintCover() 의 종이 가루
     * 점들이 마지막으로 남긴 fillStyle(알파 0.08)을 그대로 물려받으면 한 번 긁어도
     * 8% 밖에 안 지워져 계속 문질러야만 겨우 지워진다. 완전 불투명(알파 1)으로
     * 명시해야 한 번 지나간 자리가 실제로 바로 투명해진다. */
    ctx.fillStyle = '#000';
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
    if (phase !== 'covered') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startReveal();
    }
  };

  return (
    <div className="fund-scratch" ref={wrapRef}>
      <div className="fund-scratch__content">{children}</div>

      {phase !== 'revealed' && (
        <div
          className={`fund-scratch__cover${phase === 'revealing' ? ' is-revealing' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onKeyDown={handleKeyDown}
        >
          <canvas
            className="fund-scratch__canvas"
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          <div className="fund-scratch__label">
            <span className="fund-coin-stack" aria-hidden="true">
              <span className="fund-coin-stack__back" />
              <span className="fund-coin-stack__front">₩</span>
            </span>
            <p className="fund-scratch__title">
              비상금을
              <br />
              긁어보세요!
            </p>
            <button
              type="button"
              className="fund-scratch__reveal-btn"
              onClick={startReveal}
            >
              비상금 금액 보기
            </button>
            <span className="fund-scratch__cue">살짝 긁어보세요</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScratchReveal;
