import { icon } from '../../lib/asset';

interface WidgetToastProps {
  message: string | null;
  /** 있으면 토스트에 액션 버튼을 함께 보여준다 — 삭제 Undo 전용(요구사항 20) */
  actionLabel?: string;
  onAction?: () => void;
}

/** 위젯 추가/삭제 결과를 알려주는 짧은 토스트. 너무 오래 유지하지 않는다 —
 * 자동 닫힘 타이머는 호출부(WidgetPage)가 관리한다. */
export function WidgetToast({ message, actionLabel, onAction }: WidgetToastProps) {
  return (
    <div className="wpg-toast" role="status" aria-live="polite" hidden={!message}>
      <img className="wpg-toast__check" src={icon('widget-check.svg')} alt="" aria-hidden="true" />
      <span className="wpg-toast__message">{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="wpg-toast__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
