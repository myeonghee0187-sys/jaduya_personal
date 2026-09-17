import type { KeyboardEvent as ReactKeyboardEvent, Ref } from 'react';
import { icon, img } from '../lib/asset';
import { getWidgetDef } from '../data/widgetRegistry';
import { WidgetCard } from './widget/WidgetCard';
import type { PlacementState } from '../utils/placement';

/* ② 내 생활 (Personal Widget Canvas)
 *
 * Figma Home Widget Container 342 × 194 규격 그대로:
 *   Medium 167 × 114 × 2  +  Small 128.5 × 72 × 2  (또는 Large 342 × 114 단독)
 * 실제로 무엇이 놓이는지는 widgets/WidgetPlacementContext 가 들고 있는 배치 상태를
 * 그대로 따른다 — 위젯 관리 화면(WidgetPage)에서 바꾸면 여기도 즉시 반영된다.
 * 카드 렌더링은 components/widget/WidgetCard 를 그대로 재사용해서, "위젯"이
 * 어디서 보이든(Home/위젯 관리/위젯 추가) 항상 같은 모양이다. */

interface MyLifeSectionProps {
  /** 지금 Home 캔버스에 실제로 놓여 있는 위젯 배치 */
  placement: PlacementState;
  /** 하트 표기 — data/personaProfile.ts 의 resolveLevel() 결과 (예: 1,200) */
  heartsLabel: string;
  /** 레벨 표기 — 같은 원본에서 계산한다. 마이페이지와 값이 어긋나면 안 된다 (예: Lv.1) */
  levelLabel: string;
  /** 현재 페르소나의 성장 단계 아이콘과 이름 — personaProfile.resolveLevel() 결과 */
  levelIcon: string;
  levelStageName: string;
  /** 레벨 안내 그룹 전체를 눌렀을 때 현재 버튼을 기준으로 공용 안내 팝오버를 연다 */
  onOpenLevelInfo?: (anchor: HTMLElement) => void;
  /** '+' 위젯 추가 슬롯을 눌렀을 때 — 위젯 관리 화면으로 이동한다 */
  onAddWidget?: () => void;
  /** 아래 두 ref 는 코치마크가 강조 영역을 잴 때만 쓴다. 평소 렌더링에는 영향 없다. */
  /** ❤️ 하트 + 🍃 Level 배지 영역(.section-header__status) DOM 참조 */
  statusRef?: Ref<HTMLDivElement>;
  /** 위젯 추가(+) 슬롯(.module-card--add) DOM 참조 */
  addSlotRef?: Ref<HTMLDivElement>;
}

export function MyLifeSection({
  placement,
  heartsLabel,
  levelLabel,
  levelIcon,
  levelStageName,
  onOpenLevelInfo,
  onAddWidget,
  statusRef,
  addSlotRef,
}: MyLifeSectionProps) {
  const handleSlotKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAddWidget?.();
    }
  };

  return (
    <section className="my-life">
      <div className="section-header">
        <div className="section-header__title">
          <h2>내 생활</h2>
          <img className="section-header__plus" src={icon('plus-small.svg')} alt="" aria-hidden="true" />
        </div>
        <div className="section-header__status" ref={statusRef}>
          <div className="stat-bar stat-bar--love">
            <span className="stat-bar__bar">{heartsLabel}</span>
            <img className="stat-bar__badge" src={img('badge-love.png')} alt="" />
          </div>
          <button
            type="button"
            className="stat-bar stat-bar--level"
            aria-label={`${levelStageName} ${levelLabel}, 자취 레벨 안내 보기`}
            aria-haspopup="dialog"
            onClick={(event) => onOpenLevelInfo?.(event.currentTarget)}
          >
            <img className="stat-bar__badge" src={levelIcon} alt={`${levelStageName} 레벨`} />
            <span className="stat-bar__bar">{levelLabel}</span>
          </button>
        </div>
      </div>

      <div className="module-grid">
        <div className="module-grid__row" data-home-large-row={placement.large ? 'true' : undefined}>
          {placement.large ? (
            (() => {
              const def = getWidgetDef(placement.large.widgetId);
              return def ? <WidgetCard def={def} size="large" variant="home" /> : null;
            })()
          ) : (
            placement.medium.map((slot, i) => {
              if (!slot) return null;
              const def = getWidgetDef(slot.widgetId);
              return def ? <WidgetCard key={i} def={def} size="medium" variant="home" /> : null;
            })
          )}
        </div>

        <div className="module-grid__row module-grid__row--small">
          {placement.small.map((slot, i) => {
            if (!slot) return null;
            const def = getWidgetDef(slot.widgetId);
            return def ? <WidgetCard key={i} def={def} size="small" variant="home" /> : null;
          })}

          <div
            ref={addSlotRef}
            className="module-card module-card--add"
            role="button"
            tabIndex={0}
            aria-label="위젯 추가"
            onClick={onAddWidget}
            onKeyDown={handleSlotKeyDown}
          >
            <img src={icon('plus-add.svg')} alt="위젯 추가" />
          </div>
        </div>
      </div>
    </section>
  );
}
