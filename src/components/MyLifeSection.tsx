import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { icon, img } from '../lib/asset';
import { HOME_NATIVE_WIDGETS } from '../data/widgetCatalog';
import { WidgetCard } from './WidgetCard';

/* ② 내 생활 (Personal Widget Canvas)
 *
 * 정적 버전의 applyWidgetsToHome() 을 state 기반으로 재작성했다.
 *   - Home 마크업에 원래 있던 위젯(living-cost / rent / fridge)은 노출/숨김
 *   - 그 밖에 선택된 위젯은 WidgetCard(variant="home") 로 추가 행에 렌더링
 *   - 자식이 모두 숨겨진 기본 행은 접는다
 *   - 저장을 한 번이라도 하면 캔버스 높이가 auto 로 풀린다(.is-custom)
 * 고정지출과 + 슬롯은 위젯 카탈로그가 관리하지 않으므로 항상 노출된다.
 */

interface MyLifeSectionProps {
  /** 현재 Home 에 올라간 위젯 id 목록 */
  widgets: string[];
  /** 위젯 추가 시트에서 한 번이라도 저장했는지 */
  isCustom: boolean;
  onAddWidget: () => void;
}

export function MyLifeSection({ widgets, isCustom, onAddWidget }: MyLifeSectionProps) {
  const has = (id: string) => widgets.includes(id);

  /* Home 마크업에 없는, 새로 선택된 위젯 */
  const added = widgets.filter((id) => !HOME_NATIVE_WIDGETS.includes(id));

  /* 기본 행: 자식이 모두 숨겨지면 행 자체를 접는다 */
  const mediumRowHidden = !has('living-cost') && !has('rent');
  /* 작은 행은 고정지출과 + 슬롯이 항상 있으므로 접히지 않는다 (정적 버전과 동일) */

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
          <img
            className="section-header__plus"
            src={icon('plus-small.svg')}
            alt=""
            onClick={onAddWidget}
          />
        </div>
        <div className="section-header__status">
          <div className="stat-bar stat-bar--love">
            <span className="stat-bar__bar">1,200</span>
            <img className="stat-bar__badge" src={img('badge-love.png')} alt="" />
          </div>
          <div className="stat-bar stat-bar--level">
            <span className="stat-bar__bar">Level.41</span>
            <img className="stat-bar__badge" src={img('badge-level.png')} alt="" />
          </div>
        </div>
      </div>

      <div className={`module-grid${isCustom ? ' is-custom' : ''}`}>
        <div className="module-grid__row" hidden={mediumRowHidden}>
          <article className="widget widget--medium" data-widget-id="living-cost" hidden={!has('living-cost')}>
            <div className="widget__header">
              <p className="widget__title">생활비</p>
              <div className="ring">
                <img className="ring__track" src={icon('ring-track.svg')} alt="" />
                <img className="ring__progress" src={icon('ring-progress.svg')} alt="" />
                <span className="ring__value">84%</span>
              </div>
            </div>
            <p className="widget__value">84.2만원 사용</p>
            <p className="widget__secondary">예산 15.8만원 남음</p>
          </article>

          <article className="widget widget--medium" data-widget-id="rent" hidden={!has('rent')}>
            <div className="widget__header">
              <p className="widget__title">주거</p>
              <p className="widget__dday">D-7</p>
            </div>
            <div className="widget__stack">
              <p className="widget__value">월세 55만원</p>
              <p className="widget__secondary">9/5 납부</p>
            </div>
          </article>
        </div>

        <div className="module-grid__row module-grid__row--small">
          <article className="module-card" data-widget-id="fridge" hidden={!has('fridge')}>
            <p className="module-card__title">냉장고</p>
            <p className="module-card__value">우유 D-2</p>
          </article>

          <article className="module-card">
            <p className="module-card__title">고정지출</p>
            <div className="module-card__services">
              <span className="service service--netflix">N</span>
              <span className="service service--youtube">
                <img src={icon('youtube-play.svg')} alt="" />
              </span>
              <span className="service service--disney">D+</span>
              <span className="service-more">+2</span>
            </div>
          </article>

          <div
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

        {added.length > 0 && (
          <div className="module-grid__row" data-home-extra-row="">
            {added.map((id) => (
              <WidgetCard key={id} id={id} variant="home" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
