import { useEffect, useRef, useState } from 'react';
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
  /* 드래그 중에는 이 연속값(0~1)으로 핸들이 손가락을 그대로 따라가고,
   * 손을 뗄 때만 가장 가까운 단계로 반올림해 onChangeRange 를 호출한다.
   * null 이면 드래그 중이 아니라는 뜻 — 이때는 rangeStep 기준 위치를 쓴다. */
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  const ratioFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return rangeStep / lastIndex;
    const rect = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const handleKnobPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!outsideNeighborhood) return;
    event.stopPropagation();
    dragPointerId.current = event.pointerId;
    setDragRatio(rangeStep / lastIndex);
  };

  /* 핸들(18px)에만 pointermove/up 을 걸고 setPointerCapture 에 기대는 대신, window 에 직접
   * 건다 — setPointerCapture 가 안 먹히는 환경(데스크톱 마우스 일부 경로에서 확인됨)에서도
   * 마우스가 작은 핸들 밖으로 살짝만 벗어나면 이벤트를 놓쳐 드래그가 아예 안 움직이는
   * 문제가 있었다. dragPointerId 로 지금 드래그 중인 포인터인지만 가른다. */
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (dragPointerId.current === null || event.pointerId !== dragPointerId.current) return;
      setDragRatio(ratioFromClientX(event.clientX));
    };
    const onUp = (event: PointerEvent) => {
      if (dragPointerId.current === null || event.pointerId !== dragPointerId.current) return;
      dragPointerId.current = null;
      setDragRatio((current) => {
        if (current !== null) onChangeRange(Math.round(current * lastIndex));
        return null;
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [onChangeRange, lastIndex]);

  const isDragging = dragRatio !== null;
  const displayRatio = dragRatio ?? rangeStep / lastIndex;

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
              className={`region-filter__track-fill${isDragging ? ' is-dragging' : ''}`}
              style={{ width: `${displayRatio * 100}%` }}
            />
            <button
              type="button"
              className={`region-filter__handle${isDragging ? ' is-dragging' : ''}`}
              style={{ left: `${displayRatio * 100}%` }}
              aria-label="범위"
              aria-valuemin={0}
              aria-valuemax={lastIndex}
              aria-valuenow={rangeStep}
              aria-valuetext={REGION_RANGE_STEPS[rangeStep]}
              disabled={!outsideNeighborhood}
              onPointerDown={handleKnobPointerDown}
            >
              <img src={icon('region-filter-handle.svg')} alt="" draggable={false} />
            </button>
          </div>
          <div className="region-filter__steps">
            {/* 클릭으로 이동하지 않는 표시 전용 라벨 — 값 변경은 핸들 드래그로만 한다.
             * 트랙과 같은 좌우 여백(30px)을 둔 좌표계 안에서, 4개 모두 핸들 위치(%)에
             * 중앙 정렬한다 — 양 끝 라벨도 빨간 점 중심이 글자 한가운데에 오게 한다. */}
            {REGION_RANGE_STEPS.map((label, index) => (
              <span
                key={label}
                className={`region-filter__step${index === rangeStep ? ' is-active' : ''}`}
                style={{ left: `${(index / lastIndex) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegionFilterPanel;
