import { icon } from '../lib/asset';
import { WIDGET_CATALOG } from '../data/widgetCatalog';
import type { WidgetSize } from '../types';

/* 위젯 카드 — Figma add_widget (1693:6166) 의 카드 마크업 그대로.
 *
 * 정적 버전은 시트의 .wpick__card DOM 을 Home 으로 클론해 재사용했다.
 * React 에서는 같은 컴포넌트를 variant 만 바꿔 두 곳에서 렌더링한다.
 *   - variant="picker" : 시트 (선택 가능, 체크 배지)
 *   - variant="home"   : Home '내 생활' (선택 결과로 추가된 카드)
 */

const SIZE_CLASS: Record<WidgetSize, string> = {
  small: 'wpick--small',
  medium: '',
  large: 'wpick--large',
};

/** 카드 내부 콘텐츠 — 위젯마다 형태가 달라 id 로 분기한다 */
function WidgetCardBody({ id }: { id: string }) {
  switch (id) {
    case 'living-cost':
      return (
        <span className="wpick__card">
          <span className="wpick__body">
            <span className="wpick__stat">
              <span className="wpick__row">
                <span className="wpick__name">생활비</span>
              </span>
              <span className="wpick__main wpick__main--17">84.2만원</span>
              <span className="wpick__sub">15.8만원 남음</span>
            </span>
            <span className="wpick__ring">
              <span>84%</span>
            </span>
          </span>
        </span>
      );

    case 'fridge':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">냉장고</span>
          </span>
          <span className="wpick__list">
            <span className="wpick__list-row">
              <b>우유</b>
              <i>D-2</i>
            </span>
            <span className="wpick__list-row">
              <span>계란</span>
              <em>D-4</em>
            </span>
          </span>
        </span>
      );

    case 'fridge-s':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">냉장고</span>
          </span>
          <span
            className="wpick__main wpick__main--17"
            style={{ alignSelf: 'center', paddingTop: 6 }}
          >
            우유 D-2
          </span>
        </span>
      );

    case 'rent':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">월세·관리비</span>
          </span>
          <span className="wpick__main" style={{ alignSelf: 'center' }}>
            65만원
          </span>
          <span className="wpick__sub wpick__sub--accent" style={{ alignSelf: 'center' }}>
            3일 후 납부
          </span>
        </span>
      );

    case 'spend-analysis':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">소비 분석</span>
          </span>
          <span className="wpick__bars">
            <span className="wpick__bar">
              <span className="wpick__bar-head">
                <b>주거</b>
                <span>42%</span>
              </span>
              <span className="wpick__bar-track">
                <span
                  className="wpick__bar-fill wpick__bar-fill--primary"
                  style={{ width: '42%' }}
                />
              </span>
            </span>
            <span className="wpick__bar">
              <span className="wpick__bar-head">
                <b>식비</b>
                <span>28%</span>
              </span>
              <span className="wpick__bar-track">
                <span className="wpick__bar-fill" style={{ width: '28%' }} />
              </span>
            </span>
            <span className="wpick__bar">
              <span className="wpick__bar-head">
                <b>생활</b>
                <span>18%</span>
              </span>
              <span className="wpick__bar-track">
                <span className="wpick__bar-fill" style={{ width: '18%' }} />
              </span>
            </span>
            <span className="wpick__bar">
              <span className="wpick__bar-head">
                <b>교통</b>
                <span>12%</span>
              </span>
              <span className="wpick__bar-track">
                <span className="wpick__bar-fill" style={{ width: '12%' }} />
              </span>
            </span>
          </span>
        </span>
      );

    case 'benefit':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">혜택</span>
          </span>
          <span className="wpick__main wpick__main--18" style={{ alignSelf: 'center' }}>
            3개
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            지금 받을 수 있는 혜택
          </span>
        </span>
      );

    case 'todo-s':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">오늘 할 일</span>
          </span>
          <span
            className="wpick__main wpick__main--18"
            style={{ alignSelf: 'center', paddingTop: 6 }}
          >
            <b>2</b> <small>개 남음</small>
          </span>
        </span>
      );

    case 'todo-m':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">오늘 할 일</span>
          </span>
          <span className="wpick__todo">
            <span className="wpick__todo-row wpick__todo-row--done">
              <i />
              분리수거 배출
            </span>
            <span className="wpick__todo-row wpick__todo-row--done">
              <i />
              택배 수거 신청
            </span>
            <span className="wpick__todo-row">
              <i>
                <img src={icon('widget-checkbox.svg')} alt="" />
              </i>
              장보기
            </span>
          </span>
        </span>
      );

    case 'clean-s':
      return (
        <span className="wpick__card">
          <span className="wpick__row wpick__row--icon">
            <img src={icon('widget-clean-13.svg')} alt="" />
            <span className="wpick__name">청소</span>
          </span>
          <span
            className="wpick__main wpick__main--17"
            style={{ alignSelf: 'center', paddingTop: 6 }}
          >
            오늘
          </span>
        </span>
      );

    case 'clean-m':
      return (
        <span className="wpick__card">
          <span className="wpick__row wpick__row--icon">
            <img className="is-14" src={icon('widget-clean-14.svg')} alt="" />
            <span className="wpick__name">다음 청소</span>
          </span>
          <span className="wpick__main" style={{ alignSelf: 'center' }}>
            오늘 20:00
          </span>
          <span className="wpick__sub wpick__sub--accent" style={{ alignSelf: 'center' }}>
            분리수거 배출
          </span>
        </span>
      );

    case 'budget-s':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">예산</span>
          </span>
          <span
            className="wpick__main wpick__main--17"
            style={{ alignSelf: 'center', paddingTop: 6 }}
          >
            15.8만원
          </span>
        </span>
      );

    case 'fixed-cost':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">고정지출</span>
          </span>
          <span className="module-card__services" style={{ alignSelf: 'center' }}>
            <span className="service service--netflix">N</span>
            <span className="service service--youtube">
              <img src={icon('youtube-play.svg')} alt="" />
            </span>
            <span className="service service--disney">D+</span>
            <span className="service-more">+2</span>
          </span>
        </span>
      );

    case 'deposit':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">보증금 안전</span>
          </span>
          <span className="wpick__main" style={{ alignSelf: 'center' }}>
            안전해요
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            등기부 변동 없음
          </span>
        </span>
      );

    case 'neighborhood':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">동네 소식</span>
          </span>
          <span className="wpick__main wpick__main--18" style={{ alignSelf: 'center' }}>
            새 소식 3개
          </span>
        </span>
      );

    case 'popular-post':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">인기 글</span>
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center', fontWeight: 600 }}>
            자취 꿀템 모음
          </span>
        </span>
      );

    case 'mate':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">자두메이트</span>
          </span>
          <span className="wpick__main" style={{ alignSelf: 'center' }}>
            Lv.4
          </span>
          <span className="wpick__bar-track" style={{ alignSelf: 'stretch' }}>
            <span className="wpick__bar-fill wpick__bar-fill--primary" style={{ width: '60%' }} />
          </span>
          <span className="wpick__sub">다음 레벨까지 120exp</span>
        </span>
      );

    case 'saved-content':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">저장한 콘텐츠</span>
          </span>
          <span className="wpick__main wpick__main--18" style={{ alignSelf: 'center' }}>
            12개
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            자취 꿀팁 모음
          </span>
        </span>
      );

    case 'vet':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">병원 일정</span>
          </span>
          <span className="wpick__main" style={{ alignSelf: 'center' }}>
            예방접종
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            행복동물병원 14:00
          </span>
        </span>
      );

    case 'pet-cost':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">반려 지출</span>
          </span>
          <span
            className="wpick__main wpick__main--17"
            style={{ alignSelf: 'center', paddingTop: 6 }}
          >
            12만원
          </span>
        </span>
      );

    case 'pet-supply':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">사료</span>
          </span>
          <span
            className="wpick__main wpick__main--17"
            style={{ alignSelf: 'center', paddingTop: 6 }}
          >
            D-6
          </span>
        </span>
      );

    /* 아래는 위젯 갤러리(data/widgets.ts)에서 새로 추가한 개념 — Home에 실제로 추가됐을 때
     * 렌더링할 내용만 여기 추가한다(추가 전용). 기존 case는 하나도 바꾸지 않았다. */
    case 'life-check':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">생활 체크</span>
          </span>
          <span className="wpick__main" style={{ alignSelf: 'center' }}>
            3/4 완료
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            이번 주 생활 루틴 점검
          </span>
        </span>
      );

    case 'benefit-urgent':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">마감 임박 혜택</span>
          </span>
          <span className="wpick__main" style={{ alignSelf: 'center' }}>
            D-2
          </span>
          <span className="wpick__sub wpick__sub--accent" style={{ alignSelf: 'center' }}>
            청년 월세 지원 신청 마감
          </span>
        </span>
      );

    case 'benefit-match':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">맞춤 혜택</span>
          </span>
          <span className="wpick__main wpick__main--18" style={{ alignSelf: 'center' }}>
            5개
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            서준님 조건에 맞는 혜택
          </span>
        </span>
      );

    case 'benefit-pick':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">자두 추천</span>
          </span>
          <span className="wpick__main wpick__main--17" style={{ alignSelf: 'center' }}>
            청년 월세 지원
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            월 최대 20만원 지원
          </span>
        </span>
      );

    case 'my-activity':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">나의 활동</span>
          </span>
          <span className="wpick__main wpick__main--18" style={{ alignSelf: 'center' }}>
            12개
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            이번 달 작성한 글·댓글
          </span>
        </span>
      );

    case 'my-level':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">자두 레벨</span>
          </span>
          <span className="wpick__main wpick__main--18" style={{ alignSelf: 'center' }}>
            Lv.12
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            다음 레벨까지 320 EXP
          </span>
        </span>
      );

    case 'my-profile':
      return (
        <span className="wpick__card">
          <span className="wpick__row">
            <span className="wpick__name">프로필</span>
          </span>
          <span className="wpick__main wpick__main--18" style={{ alignSelf: 'center' }}>
            이서준
          </span>
          <span className="wpick__sub" style={{ alignSelf: 'center' }}>
            자취 초보 · 가입 92일차
          </span>
        </span>
      );

    default:
      return null;
  }
}

interface WidgetCardProps {
  id: string;
  variant: 'picker' | 'home';
  selected?: boolean;
  hiddenBySearch?: boolean;
  onToggle?: (id: string) => void;
  /** 카탈로그 기본 크기 대신 실제 배치 크기로 보여줘야 할 때(예: Home 캔버스에 이미 올라간 위젯) 지정 */
  size?: WidgetSize;
  /** true면 선택할 수 없다 — 다른 크기 형제 위젯이 이미 고정 슬롯에 들어가 있을 때 등 */
  disabled?: boolean;
}

export function WidgetCard({
  id,
  variant,
  selected = false,
  hiddenBySearch = false,
  onToggle,
  size,
  disabled = false,
}: WidgetCardProps) {
  const def = WIDGET_CATALOG.find((w) => w.id === id);
  if (!def) return null;

  const sizeClass = SIZE_CLASS[size ?? def.size];

  if (variant === 'home') {
    /* Home '내 생활'에 추가된 카드 — 체크 배지 없이 카드만 */
    return (
      <div
        className={`wpick ${sizeClass}`.trim()}
        data-widget-id={id}
        data-home-extra="true"
      >
        <WidgetCardBody id={id} />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`wpick ${sizeClass} ${selected ? 'is-selected' : ''}`.replace(/\s+/g, ' ').trim()}
      data-widget-id={id}
      data-widget-name={def.name}
      aria-pressed={selected}
      hidden={hiddenBySearch}
      disabled={disabled}
      onClick={() => onToggle?.(id)}
    >
      <WidgetCardBody id={id} />
      <span className="wpick__mark">
        <img src={icon('widget-check.svg')} alt="선택됨" />
      </span>
    </button>
  );
}
