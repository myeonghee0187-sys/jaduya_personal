import { icon } from '../../lib/asset';
import { widgetTitleFor, type WidgetTypeDef } from '../../data/widgets';
import type { WidgetSize } from '../../types';
import { ProgressRing } from './ProgressRing';
import { SegmentedBar } from './SegmentedBar';
import { ServiceChips } from './ServiceChips';
import { StatColumns } from './StatColumns';
import { BulletList, Checklist, ListRows } from './WidgetLists';
import { WidgetIcon } from './WidgetIcon';

const SIZE_CLASS: Record<WidgetSize, string> = {
  small: 'wcard--small',
  medium: 'wcard--medium',
  large: 'wcard--large',
};

interface WidgetProps {
  def: WidgetTypeDef;
  size: WidgetSize;
  /** 'grid' = 위젯 갤러리 목록(탭 가능), 'preview' = Bottom Sheet 안의 실제 미리보기(탭 불가) */
  variant: 'grid' | 'preview';
  /** 이미 내 홈에 추가돼 있는지 — grid에서만 체크 배지로 보여준다 */
  added?: boolean;
  onClick?: () => void;
}

/** 모든 위젯이 공유하는 단 하나의 렌더러 — HEADER(아이콘+제목+공통 Progress Ring/meta) /
 * PRIMARY(값) / 목록·체크리스트·통계·막대 / (있으면) 공통 Service Chip / CAPTION / 링크
 * 순서를 절대 위젯마다 바꾸지 않는다. 기본은 항상 좌측 정렬이다. */
export function Widget({ def, size, variant, added = false, onClick }: WidgetProps) {
  const content = def.content[size];
  const title = widgetTitleFor(def, size);
  const isDense = Boolean(content.rows || content.checklist || content.bullets || content.segments);
  const className = `wcard ${SIZE_CLASS[size]} wcard--${variant}${isDense ? ' wcard--dense' : ''}`;

  const body = (
    <>
      <span className="wcard__header">
        <WidgetIcon name={def.icon} />
        <span className="wcard__title">{title}</span>
        {content.progress !== undefined ? (
          <ProgressRing percent={content.progress} />
        ) : (
          content.meta && <span className="wcard__meta">{content.meta}</span>
        )}
      </span>
      {content.value && <span className="wcard__value">{content.value}</span>}
      {content.highlight && <span className="wcard__highlight">{content.highlight}</span>}
      {content.rows && <ListRows rows={content.rows} />}
      {content.description && <span className="wcard__description">{content.description}</span>}
      {content.bullets && <BulletList bullets={content.bullets} />}
      {content.checklist && <Checklist items={content.checklist} />}
      {content.stats && <StatColumns stats={content.stats} />}
      {content.segments && <SegmentedBar segments={content.segments} />}
      {content.services && <ServiceChips services={content.services} more={content.servicesMore} />}
      {content.caption && <span className="wcard__caption">{content.caption}</span>}
      {content.link && <span className="wcard__link">{content.link}</span>}
      {variant === 'grid' && added && (
        <span className="wcard__badge">
          <img src={icon('widget-check.svg')} alt="추가됨" />
        </span>
      )}
    </>
  );

  if (variant === 'preview') {
    return <div className={className}>{body}</div>;
  }

  return (
    <button type="button" className={className} onClick={onClick} aria-label={title}>
      {body}
    </button>
  );
}
