import { useLayoutEffect, useRef, useState } from 'react';
import { CATEGORY_TONE } from '../../data/widgetRegistry';
import type { WidgetDef } from '../../data/widgetRegistry';
import { WidgetCard } from './WidgetCard';

/* M 사이즈 위젯의 고정 픽셀 크기(tokens.css 의 --widget-medium-w/h와 같은 값) —
 * WidgetPreviewModal과 같은 방식으로, 카드 안 미리보기 영역 크기에 맞춰 축소만 한다
 * (실제 위젯 컴포넌트 자체의 크기는 건드리지 않는다). */
const NATIVE_MEDIUM = { w: 167, h: 114 };

interface WidgetRecommendCardProps {
  def: WidgetDef;
  onSelect: () => void;
}

/** "추천 위젯" Swiper 한 장 — 실제 M 사이즈 위젯을 그대로 미리보기로 보여주고
 * (레퍼런스의 일러스트 자리), 아래에 이름·설명·카테고리 태그를 둔다. */
export function WidgetRecommendCard({ def, onSelect }: WidgetRecommendCardProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const tone = CATEGORY_TONE[def.category];

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const recalc = () => {
      const availW = stage.clientWidth;
      const availH = stage.clientHeight;
      if (!availW || !availH) return;
      setScale(Math.min(1, availW / NATIVE_MEDIUM.w, availH / NATIVE_MEDIUM.h));
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <button type="button" className="wpg-recommend-card" onClick={onSelect}>
      <div className={`wpg-recommend-card__stage wpg-recommend-card__stage--${tone}`}>
        <div className="wpg-recommend-card__viewport" ref={stageRef}>
          <div
            className="wpg-recommend-card__stage-inner"
            style={{ width: NATIVE_MEDIUM.w, height: NATIVE_MEDIUM.h, transform: `scale(${scale})` }}
          >
            <WidgetCard def={def} size="medium" variant="preview" />
          </div>
        </div>
      </div>

      <span className="wpg-recommend-card__name">{def.name}</span>
      <span className="wpg-recommend-card__desc">{def.description}</span>
      <span className="wpg-recommend-card__tag">#{def.category}</span>
    </button>
  );
}
