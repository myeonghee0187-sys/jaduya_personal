import { icon } from '../../lib/asset';
import { WidgetIconBadge } from './WidgetIconBadge';
import type { WidgetDef } from '../../data/widgetRegistry';

interface WidgetListCardProps {
  def: WidgetDef;
  /** "추천 위젯" — 카테고리 태그를 보여준다(전체 위젯 목록은 이미 탭으로 걸러져 있어 생략) */
  showCategory?: boolean;
  onSelect: () => void;
}

/** 위젯 목록 카드 — "추천 위젯"과 "전체 위젯"이 함께 쓴다. 탐색에만 집중하는 카드라
 * S/M/L 같은 조작 요소는 절대 넣지 않는다 — 크기 선택·추가는 카드를 눌러서 여는
 * 위젯 미리보기 모달의 몫이다. */
export function WidgetListCard({ def, showCategory = false, onSelect }: WidgetListCardProps) {
  return (
    <button type="button" className="wpg-list-card" onClick={onSelect}>
      <span className="wpg-list-card__row">
        <WidgetIconBadge icon={def.icon} category={def.category} size="md" />
        <span className="wpg-list-card__text">
          {showCategory && <span className="wpg-list-card__cat">{def.category}</span>}
          <span className="wpg-list-card__name">{def.name}</span>
          <span className="wpg-list-card__desc">{def.description}</span>
        </span>
        <img className="wpg-list-card__chevron" src={icon('widget-chevron-right.svg')} alt="" aria-hidden="true" />
      </span>
    </button>
  );
}
