import type { CSSProperties } from 'react';
import type { CardLayer, CardVisual, MenuWidgetAsset } from '../data/menuWidgetAssets';
import { icon } from '../lib/asset';
import '../styles/widget-asset.css';

/* 2×2 위젯 카드 — Figma 위젯 섹션(4056:20332)의 card 구조를 그대로 옮긴 것.
 *   .widget-asset__top     그림(왼쪽) + 카테고리 pill·액션 pill(오른쪽)
 *   .widget-asset__bottom  caption + 큰 value
 * 그림은 전부 Figma 에서 내려받은 원본 에셋(public/assets/icon/wc-*)이다. */

/* 체크리스트 도트 4줄의 막대 길이 — checklist 자신의 폭(54px) 대비 %로 표현해,
 * 카드가 줄어들며 .widget-asset__checklist 자체가 작아져도 같은 비율을 유지한다. */
const CHECKLIST_WIDTH = 54;
const CHECKLIST_ROWS = [
  { dot: 'wc-checklist-dot-1.svg', width: 30, alpha: 0.55 },
  { dot: 'wc-checklist-dot-2.svg', width: 27, alpha: 0.55 },
  { dot: 'wc-checklist-dot-3.svg', width: 24, alpha: 0.2 },
  { dot: 'wc-checklist-dot-4.svg', width: 14, alpha: 0.1 },
] as const;

function Layer({ layer, artSize }: { layer: CardLayer; artSize: number }) {
  if (layer.box) {
    const [x, y, size] = layer.box;
    /* art 박스(.widget-asset__art) 자신의 크기 대비 %로 두면, art 자체의 크기가
     * 바뀔 때 이 레이어도 같은 비율로 따라간다. */
    const pct = (value: number) => `${(value / artSize) * 100}%`;
    return (
      <span className="widget-asset__layer widget-asset__layer--box" style={{ left: pct(x), top: pct(y), width: pct(size), height: pct(size) }}>
        <img src={icon(layer.file)} alt="" className={layer.crop ? 'is-crop' : undefined} />
      </span>
    );
  }
  return <img className="widget-asset__layer" src={icon(layer.file)} alt="" style={{ inset: layer.inset }} />;
}

function Visual({ visual }: { visual: CardVisual }) {
  if (visual.kind === 'checklist') {
    return (
      <span className="widget-asset__checklist" aria-hidden="true">
        {CHECKLIST_ROWS.map((row) => (
          <span className="widget-asset__check-row" key={row.dot}>
            <img src={icon(row.dot)} alt="" />
            <i style={{ width: `${(row.width / CHECKLIST_WIDTH) * 100}%`, background: `rgba(180, 57, 54, ${row.alpha})` }} />
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="widget-asset__art" style={{ '--wa-art': visual.size } as CSSProperties} aria-hidden="true">
      {visual.layers.map((layer) => <Layer key={layer.file} layer={layer} artSize={visual.size} />)}
    </span>
  );
}

interface WidgetAssetProps {
  asset: MenuWidgetAsset;
  /** 'preview' = 메뉴 관리 위젯 픽커의 작은 미리보기(기본) / 'home' = 홈 '내 메뉴'의 실제 2×2 위젯 */
  context?: 'preview' | 'home';
  className?: string;
}

export function WidgetAsset({ asset, context = 'preview', className }: WidgetAssetProps) {
  const { visual, category, action, caption, captionExtra, lead, value, suffix, valueSize } = asset.content;
  const classes = [
    'widget-asset',
    context === 'home' ? 'widget-asset--home' : '',
    valueSize === 18 ? 'widget-asset--title' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <article
      className={classes}
      data-widget-asset={asset.id}
      data-figma-node={asset.figmaNodeId}
      style={{ '--asset-value': valueSize } as CSSProperties}
    >
      <div className="widget-asset__top">
        <Visual visual={visual} />
        <div className="widget-asset__tags">
          <span className="widget-asset__pill">{category}</span>
          {action && (
            <span className="widget-asset__action">
              {action}
              <img src={icon('wc-arrow.svg')} alt="" />
            </span>
          )}
        </div>
      </div>

      <div className="widget-asset__bottom">
        {captionExtra ? (
          <div className="widget-asset__caption-row">
            <span className="widget-asset__caption widget-asset__caption--sm">{caption}</span>
            <span className="widget-asset__caption">{captionExtra}</span>
          </div>
        ) : (
          <span className="widget-asset__caption">{caption}</span>
        )}
        <div className="widget-asset__value-row">
          {lead && <span className="widget-asset__lead">{lead}</span>}
          <strong className="widget-asset__value">{value}</strong>
          {suffix && <span className="widget-asset__suffix">{suffix}</span>}
        </div>
      </div>
    </article>
  );
}

export default WidgetAsset;
