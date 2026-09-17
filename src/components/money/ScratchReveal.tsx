import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { icon } from '../../lib/asset';

/* JADUYA — "비상금" 탭 전용. 지금까지 모은 돈을 바로 숫자로 보여주지 않고
 * 문질러야 드러나는 카드로 가려 둔다. Figma에는 없는, 대화 중 새로 정한
 * 인터랙션이라 참고할 디자인 소스가 없다.
 *
 * 복권 은박지가 아니라 "잠겨 있는 나의 저축"처럼 보이도록 커버를 아주 옅은
 * neutral 톤으로 칠한다 — 금색/은색 그라디언트, 코인, 당첨 문구는 쓰지 않는다.
 *
 * - 실제 값(children)은 항상 DOM에 그려져 있다 — canvas는 그 위를 덮는
 *   레이어일 뿐이라, 긁어서 뚫린 구멍으로 아래 금액이 실제로 비쳐 보인다(진짜
 *   스크래치 카드와 같은 방식). 그래서 스크린리더에는 처음부터 그대로 읽힌다.
 * - 60% 이상 긁으면 나머지를 자동으로 걷어낸다(실제 스크래치 카드의 표준 동작).
 * - 마우스 클릭 한 번으로 바로 열리지는 않는다 — 실제로 드래그해서 긁어야 한다.
 *   다만 드래그가 불가능한 사용자를 위해 "비상금 금액 보기" 버튼과 Enter/Space 로
 *   같은 결과(전부 걷어내기)를 열어준다.
 * - canvas 크기는 wrap 의 offsetWidth/Height(레이아웃 px, transform 영향 없음)로
 *   정하고 CSS는 `inset:0`으로만 배치한다. 폰 프레임 데모처럼 조상 요소에
 *   transform: scale() 이 걸려 있어도(getBoundingClientRect 값이 달라져도)
 *   항상 부모를 정확히 꽉 채운다. 포인터 좌표도 같은 이유로 비율 변환해서 쓴다. */

const BRUSH_RADIUS = 22;
const CLEAR_THRESHOLD = 0.6;
const SAMPLE_STEP = 4;
/* 남은 커버가 부드럽게 사라지는 시간 — EmergencyFundCard 의 count-up 시작과 맞춘다 */
const FADE_MS = 280;

type Phase = 'covered' | 'revealing' | 'revealed';

interface ScratchRevealProps {
  children: ReactNode;
  /** 커버 중앙에 보여줄 안내 문구 (두 줄까지) */
  title?: string;
  /** 안내 문구 아래 작은 보조 문구 */
  cue?: string;
  /** 커버(버튼 역할)의 접근성 라벨 */
  ariaLabel?: string;
  /** 전부 걷어내기(자동완료 또는 접근성 버튼)로 완전히 공개된 순간 한 번 호출된다 */
  onRevealed?: () => void;
}

export function ScratchReveal({
  children,
  title = '긁어서 확인하기',
  cue = '손가락으로 살짝 문질러보세요',
  ariaLabel = '현재 비상금 잔액을 확인하려면 문질러 주세요.',
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

    /* 아주 밝은 neutral 표면 — 복권 은박지가 아니라 "잠겨 있는 저축"처럼 보이도록
     * 낮은 대비의 따뜻한 회백색 그라디언트만 쓴다(금색/은색 금지). */
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f6f3ee');
    gradient.addColorStop(0.5, '#efe9df');
    gradient.addColorStop(1, '#f6f3ee');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    /* 아주 옅은 대각선 결 — 복권 광택이 아니라 종이 표면 정도의 은은한 sheen */
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    for (let i = -height; i < width; i += 13) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    /* 옅은 grain 질감 — 성능을 위해 개수를 적게 둔다(60개 고정) */
    ctx.fillStyle = 'rgba(120, 108, 92, 0.07)';
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
            <span className="fund-scratch__lock-badge" aria-hidden="true">
              <img src={icon('lock.svg')} alt="" className="fund-scratch__lock" />
            </span>
            <p className="fund-scratch__title">{title}</p>
            <span className="fund-scratch__cue">{cue}</span>
            <button
              type="button"
              className="fund-scratch__reveal-btn"
              onClick={startReveal}
            >
              비상금 금액 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScratchReveal;
