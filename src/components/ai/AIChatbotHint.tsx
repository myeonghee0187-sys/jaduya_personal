import { useCallback, useEffect, useRef, useState } from 'react';
import { icon } from '../../lib/asset';

const ENTER_DELAY_MS = 2000;
const AUTO_DISMISS_MS = 3000;
const TRANSITION_MS = 3333;

interface AIChatbotHintProps {
  show: boolean;
}

/** 홈 진입 뒤 AI FAB의 용도를 알려주는 작은 안내창. 레이아웃에는 참여하지 않는다. */
export function AIChatbotHint({ show }: AIChatbotHintProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const hasShownRef = useRef(false);
  const autoDismissTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  const close = useCallback(() => {
    if (autoDismissTimerRef.current !== null) {
      window.clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    setExiting(true);
    setVisible(false);
    exitTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      exitTimerRef.current = null;
    }, TRANSITION_MS);
  }, []);

  useEffect(() => {
    setMounted(false);
    setVisible(false);
    setExiting(false);

    if (!show || hasShownRef.current) return undefined;

    let firstFrame = 0;
    let secondFrame = 0;
    const enterTimer = window.setTimeout(() => {
      hasShownRef.current = true;
      setMounted(true);
      /* 첫 프레임에는 화면 오른쪽 바깥 상태를 그린 뒤 다음 프레임부터 이동한다. */
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          setVisible(true);
          autoDismissTimerRef.current = window.setTimeout(close, AUTO_DISMISS_MS);
        });
      });
    }, ENTER_DELAY_MS);

    return () => {
      window.clearTimeout(enterTimer);
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      if (autoDismissTimerRef.current !== null) {
        window.clearTimeout(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    };
  }, [close, show]);

  if (!mounted) return null;

  return (
    <aside
      className={`ai-fab-hint${visible ? ' is-visible' : ''}${exiting ? ' is-exiting' : ''}`}
      aria-label="자두 AI 안내"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="ai-fab-hint__copy">
        <strong>궁금한 건 자두에게 물어보세요</strong>
        <p>생활 속 궁금한 일을 바로 도와드려요</p>
      </div>
      <button
        type="button"
        className="ai-fab-hint__close"
        onClick={close}
        aria-label="자두 AI 안내 닫기"
      >
        <img src={icon('close-sm.svg')} alt="" aria-hidden="true" />
      </button>
    </aside>
  );
}
