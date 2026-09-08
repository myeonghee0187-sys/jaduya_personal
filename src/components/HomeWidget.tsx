import { icon } from '../lib/asset';
import type { MediumWidgetId, SmallWidgetId } from '../data/personaWidgets';

/* Home '내 생활' 캔버스에 들어가는 위젯 본문.
 *
 * Figma Home Widget Library (1465:4192) 규격 그대로:
 *   Medium 167 × 114  → .widget.widget--medium
 *   Small  128.5 × 72 → .module-card
 * 클래스와 크기는 기존 home.css 를 그대로 쓰고, 내용만 위젯별로 바꾼다.
 */

export function MediumWidget({ id }: { id: MediumWidgetId }) {
  return (
    <article className="widget widget--medium" data-widget-id={id}>
      <MediumBody id={id} />
    </article>
  );
}

function MediumBody({ id }: { id: MediumWidgetId }) {
  switch (id) {
    case 'living-cost':
      return (
        <>
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
        </>
      );

    case 'rent':
      return (
        <>
          <div className="widget__header">
            <p className="widget__title">주거</p>
            <p className="widget__dday">D-7</p>
          </div>
          <div className="widget__stack">
            <p className="widget__value">월세 55만원</p>
            <p className="widget__secondary">9/5 납부</p>
          </div>
        </>
      );

    case 'fridge':
      return (
        <>
          <div className="widget__header">
            <p className="widget__title">냉장고</p>
            <p className="widget__dday">D-2</p>
          </div>
          <div className="widget__stack">
            <p className="widget__value">우유 500ml</p>
            <p className="widget__secondary">계란 10개 D-4</p>
          </div>
        </>
      );

    case 'todo':
      return (
        <>
          <div className="widget__header">
            <p className="widget__title">오늘 할 일</p>
            <p className="widget__dday">2개</p>
          </div>
          <div className="widget__stack">
            <p className="widget__value">장보기</p>
            <p className="widget__secondary">분리수거 배출 완료</p>
          </div>
        </>
      );

    case 'deposit':
      return (
        <>
          <div className="widget__header">
            <p className="widget__title">보증금 안전</p>
          </div>
          <div className="widget__stack">
            <p className="widget__value">안전해요</p>
            <p className="widget__secondary">등기부 변동 없음</p>
          </div>
        </>
      );

    case 'benefit':
      return (
        <>
          <div className="widget__header">
            <p className="widget__title">혜택</p>
            <p className="widget__dday">3개</p>
          </div>
          <div className="widget__stack">
            <p className="widget__value">청년 월세 지원</p>
            <p className="widget__secondary">지금 받을 수 있어요</p>
          </div>
        </>
      );

    case 'vet':
      return (
        <>
          <div className="widget__header">
            <p className="widget__title">병원 일정</p>
            <p className="widget__dday">D-5</p>
          </div>
          <div className="widget__stack">
            <p className="widget__value">예방접종</p>
            <p className="widget__secondary">행복동물병원 14:00</p>
          </div>
        </>
      );

    default:
      return null;
  }
}

export function SmallWidget({ id }: { id: SmallWidgetId }) {
  return (
    <article className="module-card" data-widget-id={id}>
      <SmallBody id={id} />
    </article>
  );
}

function SmallBody({ id }: { id: SmallWidgetId }) {
  switch (id) {
    case 'fridge-s':
      return (
        <>
          <p className="module-card__title">냉장고</p>
          <p className="module-card__value">우유 D-2</p>
        </>
      );

    case 'fixed-cost':
      return (
        <>
          <p className="module-card__title">고정지출</p>
          <div className="module-card__services">
            <span className="service service--netflix">N</span>
            <span className="service service--youtube">
              <img src={icon('youtube-play.svg')} alt="" />
            </span>
            <span className="service service--disney">D+</span>
            <span className="service-more">+2</span>
          </div>
        </>
      );

    case 'todo-s':
      return (
        <>
          <p className="module-card__title">오늘 할 일</p>
          <p className="module-card__value">2개 남음</p>
        </>
      );

    case 'clean-s':
      return (
        <>
          <p className="module-card__title">청소</p>
          <p className="module-card__value">오늘</p>
        </>
      );

    case 'budget-s':
      return (
        <>
          <p className="module-card__title">예산</p>
          <p className="module-card__value">15.8만원</p>
        </>
      );

    case 'pet-cost':
      return (
        <>
          <p className="module-card__title">반려 지출</p>
          <p className="module-card__value">12만원</p>
        </>
      );

    case 'pet-supply':
      return (
        <>
          <p className="module-card__title">사료</p>
          <p className="module-card__value">D-6</p>
        </>
      );

    default:
      return null;
  }
}
