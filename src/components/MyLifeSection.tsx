import type { KeyboardEvent as ReactKeyboardEvent, Ref } from 'react';
import { icon, img } from '../lib/asset';
import { activeLayoutSlots, layoutWidgetIds } from '../data/personaWidgets';
import type { PersonaWidgetLayout } from '../data/personaWidgets';
import { WIDGET_CATALOG } from '../data/widgetCatalog';
import { MediumWidget, SmallWidget } from './HomeWidget';
import { WidgetCard } from './WidgetCard';

/* ② 내 생활 (Personal Widget Canvas)
 *
 * Figma Home Widget Container 342 × 194 규격 그대로:
 *   Medium 167 × 114 × 2  +  Small 128.5 × 72 × 2  +  Add Slot 69 × 72
 * 네 슬롯에 어떤 위젯이 들어갈지는 로그인한 persona 조합
 * (data/personaWidgets.ts)이 정한다. 크기·gap·radius 는 바꾸지 않는다.
 *   - 위젯 추가 시트에서 고른 위젯은 아래 추가 행에 렌더링
 *   - 저장을 한 번이라도 하면 캔버스 높이가 auto 로 풀린다(.is-custom)
 */

interface MyLifeSectionProps {
  /** persona 별 위젯 조합 (Figma Home Widget Container 342 × 194) */
  layout: PersonaWidgetLayout;
  /** 하트 표기 — data/personaProfile.ts 의 resolveLevel() 결과 (예: 1,200) */
  heartsLabel: string;
  /** 레벨 표기 — 같은 원본에서 계산한다. 마이페이지와 값이 어긋나면 안 된다 (예: Level.41) */
  levelLabel: string;
  /** 현재 Home 에 올라간 위젯 id 목록 */
  widgets: string[];
  /** 위젯 추가 시트에서 한 번이라도 저장했는지 */
  isCustom: boolean;
  onAddWidget: () => void;
  /** 아래 두 ref 는 코치마크가 강조 영역을 잴 때만 쓴다. 평소 렌더링에는 영향 없다. */
  /** ❤️ 하트 + 🍃 Level 배지 영역(.section-header__status) DOM 참조 */
  statusRef?: Ref<HTMLDivElement>;
  /** 위젯 추가(+) 슬롯(.module-card--add) DOM 참조 */
  addSlotRef?: Ref<HTMLDivElement>;
}

export function MyLifeSection({
  layout,
  heartsLabel,
  levelLabel,
  widgets,
  isCustom,
  onAddWidget,
  statusRef,
  addSlotRef,
}: MyLifeSectionProps) {
  /* persona 조합에 이미 들어간 위젯은 1·2번째 줄에서 중복 노출하지 않는다.
   * Home 캔버스는 항상 2줄 고정이라(add-widget이 이 캡을 지킨다), 새로 추가한 위젯도
   * 별도 행을 만들지 않고 크기가 같은 줄에 합류시킨다:
   *   1번째 줄 — Medium(최대 2) 또는 Large 1개 단독
   *   2번째 줄 — Small(최대 2) + Add Slot */
  const inLayout = layoutWidgetIds(layout);
  const added = widgets.filter((id) => !inLayout.includes(id));
  const catalogSize = (id: string) => WIDGET_CATALOG.find((w) => w.id === id)?.size;
  const addedLarge = added.filter((id) => catalogSize(id) === 'large');
  const addedMedium = added.filter((id) => catalogSize(id) === 'medium');
  const addedSmall = added.filter((id) => catalogSize(id) === 'small');
  /* 고정 슬롯 중 위젯 추가 시트에서 꺼둔 것은 Home에서도 자리째 사라진다 */
  const active = activeLayoutSlots(layout, widgets);
  /* Large가 있으면 1번째 줄은 그 하나뿐 — add-widget이 large와 medium 동시 선택을 막아준다 */
  const showLarge = addedLarge.length > 0;

  const handleSlotKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAddWidget();
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
          <div className="stat-bar stat-bar--level">
            <span className="stat-bar__bar">{levelLabel}</span>
            <img className="stat-bar__badge" src={img('badge-level.png')} alt="" />
          </div>
        </div>
      </div>

      <div className={`module-grid${isCustom ? ' is-custom' : ''}`}>
        {/* 1번째 줄 — Large 342 × 114 단독, 없으면 Medium 167 × 114 최대 2개
         * (고정 슬롯 + 위젯 추가 시트에서 새로 담은 것 모두 이 줄 하나에 합류) */}
        {(showLarge || active.medium.length > 0 || addedMedium.length > 0) && (
          <div className="module-grid__row" data-home-large-row={showLarge ? 'true' : undefined}>
            {showLarge ? (
              <WidgetCard id={addedLarge[0]} variant="home" />
            ) : (
              <>
                {active.medium.map((id) => (
                  <MediumWidget key={id} id={id} />
                ))}
                {addedMedium.map((id) => (
                  <WidgetCard key={id} id={id} variant="home" />
                ))}
              </>
            )}
          </div>
        )}

        {/* 2번째 줄 — Small 128.5 × 72 최대 2개 + Add Slot 69 × 72. Add Slot은 위젯 추가
         * 시트를 여는 유일한 진입점이라 개수와 무관하게 항상 보여준다 */}
        <div className="module-grid__row module-grid__row--small">
          {active.small.map((id) => (
            <SmallWidget key={id} id={id} />
          ))}
          {addedSmall.map((id) => (
            <WidgetCard key={id} id={id} variant="home" />
          ))}

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
