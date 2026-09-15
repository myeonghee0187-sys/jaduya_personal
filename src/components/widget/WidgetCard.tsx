import { icon } from '../../lib/asset';
import { widgetTitleFor } from '../../data/widgetRegistry';
import type { WidgetDef } from '../../data/widgetRegistry';
import type { WidgetSize } from '../../types';
import { ProgressBar } from './ProgressBar';
import { SegmentedBar } from './SegmentedBar';
import { WeekBarChart } from './WeekBarChart';
import { WidgetIconBadge } from './WidgetIconBadge';
import { ListRows, RankList, StatusRows } from './WidgetLists';

const SIZE_CLASS: Record<WidgetSize, string> = {
  small: 'wcard--small',
  medium: 'wcard--medium',
  large: 'wcard--large',
};

interface WidgetCardProps {
  def: WidgetDef;
  size: WidgetSize;
  /** 'grid' = 위젯 추가 화면 목록(탭 가능) / 'preview' = 같은 화면의 큰 미리보기(탭 불가) /
   *  'placement' = 위젯 관리 화면의 배치 그리드(탭하면 변경·삭제 시트) / 'home' = Home '내 생활' 캔버스 */
  variant: 'grid' | 'preview' | 'placement' | 'home';
  /** 이미 내 홈에 추가돼 있는지 — grid에서만 체크 배지로 보여준다 */
  added?: boolean;
  onClick?: () => void;
}

/** 모든 위젯이 공유하는 단 하나의 렌더러 — Figma "위젯 시스템" 그대로 TITLE(› 포함) /
 * PRIMARY(값, 앞에 체크가 붙기도 한다) / Progress Bar / 목록·체크상태·순위·막대그래프 /
 * DESCRIPTION / 칩 배지 순서를 위젯마다 바꾸지 않는다. Home 캔버스와 위젯 관리·추가
 * 화면이 이 컴포넌트 하나를 그대로 공유한다. */
export function WidgetCard({ def, size, variant, added = false, onClick }: WidgetCardProps) {
  const content = def.content[size];
  const isDense = Boolean(
    content.rows || content.statusRows || content.rankList || content.segments || content.weekBars,
  );
  const className = `wcard ${SIZE_CLASS[size]} wcard--${variant}${isDense ? ' wcard--dense' : ''}`;

  const body = (
    <>
      <span className="wcard__header">
        <WidgetIconBadge icon={def.icon} category={def.category} />
        <span className="wcard__title">{widgetTitleFor(def, size)}</span>
      </span>
      {content.value && (
        <span className="wcard__value">
          {content.checkIcon && <span className="wcard__check" aria-hidden="true">✓</span>}
          {content.value}
        </span>
      )}
      {content.progress !== undefined && <ProgressBar percent={content.progress} tone={content.progressTone} />}
      {content.rows && <ListRows rows={content.rows} />}
      {content.statusRows && <StatusRows rows={content.statusRows} />}
      {content.rankList && <RankList items={content.rankList} />}
      {content.segments && <SegmentedBar segments={content.segments} />}
      {content.weekBars && <WeekBarChart bars={content.weekBars} />}
      {content.description && <span className="wcard__description">{content.description}</span>}
      {content.more && <span className="wcard__more">{content.more}</span>}
      {content.chip && <span className="wcard__chip">{content.chip}</span>}
      {variant === 'grid' && added && (
        <span className="wcard__badge">
          <img src={icon('widget-check.svg')} alt="추가됨" />
        </span>
      )}
    </>
  );

  if (variant === 'preview' || variant === 'home') {
    return <div className={className}>{body}</div>;
  }

  return (
    <button type="button" className={className} onClick={onClick} aria-label={`${def.name} 위젯`}>
      {body}
    </button>
  );
}
