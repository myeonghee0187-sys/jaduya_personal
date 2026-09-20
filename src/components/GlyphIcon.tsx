import type { CSSProperties } from 'react';
import { icon } from '../lib/asset';

/* 아이콘의 "실제 도형" 크기를 기준으로 그리는 단색 아이콘.
 *
 * public/assets/icon 의 SVG 는 파일마다 캔버스(18/24px)와 안쪽 여백이 달라서, 같은
 * width/height 로 그려도 도형은 크기가 제각각이고 우측 하단 정렬도 어긋난다. 그래서
 * 파일마다 도형의 bounding box 를 재 두고(GLYPH_BOUNDS), 도형의 긴 변이 size 가 되도록
 * 키운 뒤 여백은 잘라낸다 — 어떤 아이콘이든 눈에 보이는 크기와 우측·하단 끝선이 같다.
 * 색은 CSS 의 --glyph-color 로 받는다(mask). */

/** [x0, y0, x1, y1] — 아이콘 캔버스(정사각형에 contain)를 0~1 로 봤을 때 도형이 차지하는 영역.
 * 파일을 바꾸면 다시 잰다(렌더한 알파 채널의 bounding box). */
const GLYPH_BOUNDS: Record<string, [number, number, number, number]> = {
  'menu-truck.svg': [0.0625, 0.2188, 1, 0.875],
  'menu-broom.svg': [0.0938, 0.0313, 0.9375, 0.9063],
  'menu-receipt.svg': [0.125, 0.0917, 0.875, 0.9083],
  'menu-calendar.svg': [0.125, 0.0833, 0.875, 0.9167],
  'menu-wallet.svg': [0.125, 0.0417, 0.8958, 0.875],
  'menu-tip.svg': [0.1875, 0.0833, 0.8125, 0.9167],
  'menu-location.svg': [0.1979, 0.1146, 0.8021, 0.8875],
  'community-pencil.svg': [0.125, 0.125, 0.8854, 0.8812],
  'menu-edit.svg': [0.1167, 0.1, 0.9, 0.8604],
  'gear.svg': [0.0917, 0.0917, 0.9083, 0.9083],
  'menu-gift.svg': [0.0938, 0.0625, 0.9063, 0.8438],
  'menu-plum.svg': [0.0375, 0, 0.9625, 1],
  'community-book.svg': [0.0833, 0.0833, 0.8771, 0.9167],
  /* 메뉴 관리 사용법 3단계 — stroke(≈1.3~1.6px) 아웃라인 아이콘들의 도형 크기를 맞춰 잰 값 */
  'widget-search.svg': [0.0833, 0.0833, 0.9167, 0.9167],
  'money-fund-check.svg': [0.125, 0.2083, 0.875, 0.75],
  'money-fixed.svg': [0.16, 0.16, 0.84, 0.89],
};

interface GlyphIconProps {
  /** public/assets/icon/ 아래 파일명 */
  file: string;
  /** 도형의 긴 변(px) */
  size: number;
  className?: string;
}

export function GlyphIcon({ file, size, className }: GlyphIconProps) {
  const [x0, y0, x1, y1] = GLYPH_BOUNDS[file] ?? [0, 0, 1, 1];
  const box = size / Math.max(x1 - x0, y1 - y0);

  return (
    <span
      className={className ? `glyph-icon ${className}` : 'glyph-icon'}
      style={{ width: (x1 - x0) * box, height: (y1 - y0) * box }}
      aria-hidden="true"
    >
      <span
        className="glyph-icon__mask"
        style={{
          width: box,
          height: box,
          left: -x0 * box,
          top: -y0 * box,
          '--glyph-src': `url(${icon(file)})`,
        } as CSSProperties}
      />
    </span>
  );
}
