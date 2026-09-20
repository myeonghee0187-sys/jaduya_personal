import type { CSSProperties } from 'react';
import type { CardLayer, CardVisual, MenuWidgetAsset } from '../data/menuWidgetAssets';
import { icon } from '../lib/asset';
import '../styles/widget-asset.css';

/* 2×2 위젯 카드 — Figma 위젯 섹션(4056:20332)의 card 구조를 그대로 옮긴 것.
 *   .widget-asset__top     그림(왼쪽) + 카테고리 pill·액션 pill(오른쪽)
 *   .widget-asset__bottom  caption + 큰 value
 * 그림은 전부 Figma 에서 내려받은 원본 에셋(public/assets/icon/wc-*)이다. */

const CHECKLIST_ROWS = [
  { dot: 'wc-checklist-dot-1.svg', width: 30, alpha: 0.55 },
  { dot: 'wc-checklist-dot-2.svg', width: 27, alpha: 0.55 },
  { dot: 'wc-checklist-dot-3.svg', width: 24, alpha: 0.2 },
  { dot: 'wc-checklist-dot-4.svg', width: 14, alpha: 0.1 },
] as const;

function Layer({ layer }: { layer: CardLayer }) {
  if (layer.box) {
    const [x, y, size] = layer.box;
    return (
      <span className="widget-asset__layer widget-asset__layer--box" style={{ left: x, top: y, width: size, height: size }}>
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
            <i style={{ width: row.width, background: `rgba(180, 57, 54, ${row.alpha})` }} />
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="widget-asset__art" style={{ width: visual.size, height: visual.size }} aria-hidden="true">
      {visual.layers.map((layer) => <Layer key={layer.file} layer={layer} />)}
    </span>
  );
}

interface WidgetAssetProps {
  asset: MenuWidgetAsset;
  className?: string;
}

export function WidgetAsset({ asset, className }: WidgetAssetProps) {
  const { visual, category, action, caption, captionExtra, lead, value, suffix, valueSize } = asset.content;
  const classes = ['widget-asset', valueSize === 18 ? 'widget-asset--title' : '', className].filter(Boolean).join(' ');

  return (
    <article
      className={classes}
      data-widget-asset={asset.id}
      data-figma-node={asset.figmaNodeId}
      style={{ '--asset-value': `${valueSize}px` } as CSSProperties}
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
