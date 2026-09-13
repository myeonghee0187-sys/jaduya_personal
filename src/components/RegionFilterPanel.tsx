import { useRef } from 'react';
import { icon } from '../lib/asset';

export const REGION_DWELLING_OPTIONS = ['원룸', '투룸', '오피스텔', '주택'];
export const REGION_NEARBY_OPTIONS = ['소음', '채광', '교통', '인프라'];
export const REGION_RANGE_STEPS = ['내 동네만', '인근 동네', 'OO구 전체', '전체 지역'];

interface RegionFilterPanelProps {
  dwelling: string[];
  onToggleDwelling: (value: string) => void;
  nearby: string[];
  onToggleNearby: (value: string) => void;
  outsideNeighborhood: boolean;
  onToggleOutside: () => void;
  rangeStep: number;
  onChangeRange: (step: number) => void;
  onClose: () => void;
}

/* 지역 후기 '필터' 패널 — Figma SearchFilterCard (3107:25279).
 * 주거별·주변 칩은 실제로 REGION_POSTS 를 걸러내는 데 쓰지만,
 * '범위 설정'(내 동네 밖 토글 + 슬라이더)은 앱에 위치·거리 데이터가 없어
 * 시각적으로만 동작하고 목록 필터링에는 관여하지 않는다. */
export function RegionFilterPanel({
  dwelling,
  onToggleDwelling,
  nearby,
  onToggleNearby,
  outsideNeighborhood,
  onToggleOutside,
  rangeStep,
  onChangeRange,
  onClose,
}: RegionFilterPanelProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastIndex = REGION_RANGE_STEPS.length - 1;
  /* buttons 비트마스크는 일부 입력 경로(자동화 도구, 일부 트랙패드)에서
   * 중간 pointermove 에 정확히 실리지 않을 수 있어 믿지 않는다 — 대신
   * pointerId 를 직접 추적한다 (useSheetGesture 와 같은 방식). */
  const dragPointerId = useRef<number | null>(null);

  const stepFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return rangeStep;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * lastIndex);
  };

  const handleKnobPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!outsideNeighborhood) return;
    event.stopPropagation();
    dragPointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleKnobPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerId.current !== event.pointerId) return;
    onChangeRange(stepFromClientX(event.clientX));
  };

  const endKnobDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerId.current !== event.pointerId) return;
    dragPointerId.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="region-filter" role="dialog" aria-label="지역 후기 필터">
      <div className="region-filter__header">
        <p className="region-filter__title">필터</p>
        <button type="button" className="region-filter__close" aria-label="필터 닫기" onClick={onClose}>
          <img src={icon('region-filter-close.svg')} alt="" />
        </button>
      </div>

      <div className="region-filter__section region-filter__section--dwelling">
        <p className="region-filter__section-title">주거별</p>
        <div className="region-filter__chips">
          {REGION_DWELLING_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`region-filter__chip${dwelling.includes(option) ? ' is-selected' : ''}`}
              aria-pressed={dwelling.includes(option)}
              onClick={() => onToggleDwelling(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="region-filter__section">
        <p className="region-filter__section-title">주변</p>
        <div className="region-filter__chips">
          {REGION_NEARBY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`region-filter__chip${nearby.includes(option) ? ' is-selected' : ''}`}
              aria-pressed={nearby.includes(option)}
              onClick={() => onToggleNearby(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="region-filter__section">
        <p className="region-filter__section-title">범위 설정</p>

        <div className="region-filter__toggle-row">
          <div className="region-filter__toggle-text">
            <p className="region-filter__toggle-title">내 동네 밖의 후기도 보기</p>
            <p className="region-filter__toggle-sub">설정한 범위까지 지역후기를 함께 볼 수 있어요</p>
          </div>
          <button
            type="button"
            className={`region-filter__switch${outsideNeighborhood ? ' is-on' : ''}`}
            role="switch"
            aria-checked={outsideNeighborhood}
            aria-label="내 동네 밖의 후기도 보기"
            onClick={onToggleOutside}
          >
            <span className="region-filter__switch-knob" />
          </button>
        </div>

        <div className="region-filter__slider" aria-hidden={!outsideNeighborhood}>
          <div className="region-filter__track" ref={trackRef}>
            <div
              className="region-filter__track-fill"
              style={{ width: `${(rangeStep / lastIndex) * 100}%` }}
            />
            <button
              type="button"
              className="region-filter__handle"
              style={{ left: `${(rangeStep / lastIndex) * 100}%` }}
              aria-label="범위"
              aria-valuemin={0}
              aria-valuemax={lastIndex}
              aria-valuenow={rangeStep}
              aria-valuetext={REGION_RANGE_STEPS[rangeStep]}
              disabled={!outsideNeighborhood}
              onPointerDown={handleKnobPointerDown}
              onPointerMove={handleKnobPointerMove}
              onPointerUp={endKnobDrag}
              onPointerCancel={endKnobDrag}
            >
              <img src={icon('region-filter-handle.svg')} alt="" />
            </button>
          </div>
          <div className="region-filter__steps">
            {/* 클릭으로 이동하지 않는 표시 전용 라벨 — 값 변경은 핸들 드래그로만 한다.
             * 양 끝은 핸들 쪽으로 정렬해 패널 밖으로 넘치지 않게 하고, 가운데만 중앙 정렬한다. */}
            {REGION_RANGE_STEPS.map((label, index) => {
              const align = index === 0 ? 'start' : index === lastIndex ? 'end' : 'center';
              return (
                <span
                  key={label}
                  className={`region-filter__step${index === rangeStep ? ' is-active' : ''}`}
                  data-align={align}
                  style={{ left: `${(index / lastIndex) * 100}%` }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegionFilterPanel;
