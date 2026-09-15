import { img } from '../../lib/asset';

interface WidgetGuidePanelProps {
  /** 지금 펼쳐져 있는지 — 접으면 계정별로 기억해서 다음 방문 때는 접힌 채로 시작한다
   * (markWidgetGuideDismissed) */
  expanded: boolean;
  onToggle: () => void;
}

/* 위젯 배치 가이드 — 한 줄(아이콘 + 제목 + 펼치기/접기 화살표)은 항상 떠 있고, 그 아래
 * S/M/L 미리보기 + 마스코트는 펼쳤을 때만 보인다. dimming/overlay 없이 Placement Grid
 * 아래 제자리에 있다(자세한 배치 다이어그램/규칙은 헤더 "가이드" 버튼의
 * PlacementGuideSheet에서 본다). S/M/L은 PlacementGuideSheet의 스와치와 같은 배색으로
 * 구분해서 크기 차이를 한눈에 알아보게 한다. */
export function WidgetGuidePanel({ expanded, onToggle }: WidgetGuidePanelProps) {
  return (
    <div className="wpg-guide">
      <button type="button" className="wpg-guide__head" onClick={onToggle} aria-expanded={expanded}>
        <span className="wpg-guide__icon" aria-hidden="true">
          i
        </span>
        <span className="wpg-guide__title">위젯은 홈 화면에 이렇게 배치돼요.</span>
        <span className={`wpg-guide__toggle${expanded ? ' is-open' : ''}`} aria-hidden="true" />
      </button>

      <div className={`wpg-guide__panel${expanded ? ' is-open' : ''}`}>
        <div className="wpg-guide__panel-inner">
          <div className="wpg-guide__preview">
            <div className="wpg-guide__sizes" aria-hidden="true">
              <span className="wpg-guide__size wpg-guide__size--s">S</span>
              <span className="wpg-guide__size wpg-guide__size--m">M</span>
              <span className="wpg-guide__size wpg-guide__size--l">L</span>
            </div>
            <img
              className="wpg-guide__mascot"
              src={img('onboarding/mascot-select.png')}
              alt=""
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
