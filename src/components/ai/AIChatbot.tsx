import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/ai-chatbot.css';
import { AIChatbotButton } from './AIChatbotButton';
import { AIChatbotHint } from './AIChatbotHint';
import { aiFabRef } from './aiFabRef';
import { playAIChatMorph } from './aiChatMorph';
import { useAppNavigation } from '../../navigation/AppNavigation';

interface AIChatbotProps {
  /** AIChatbotButton 의 initialLift 를 그대로 전달한다 */
  initialLift?: number;
  /** 자두AI 전체 화면처럼 버튼이 필요 없는 화면에서 감춘다.
   * 컴포넌트를 지우지 않고 감추기만 해야 드래그해 둔 위치가 남는다. */
  hidden?: boolean;
  /** overlay가 FAB를 덮는 동안 DOM/위치는 유지하고 입력만 차단한다. */
  disabled?: boolean;
  /** 홈 화면에 진입했을 때 AI 기능 안내를 한 번 재생한다. */
  showEntryHint?: boolean;
}

/** 지금 AIChatbot과 같은 App 인스턴스 안에서 보이는 .app — Home 은 다른 화면에서도
 * DOM 에 남아 있으므로(hidden) 실제로 그려지는 것 하나만 고른다.
 *
 * 데스크톱 데모에서 App을 전환 애니메이션으로 다시 마운트하는 동안 이전 App과 새 App이
 * 잠시 함께 존재한다. document 전체의 첫 .app을 고르면 새 버튼이 곧 제거될 이전 App에
 * 붙을 수 있으므로, 렌더 트리 안의 anchor로 현재 App 전환 영역을 먼저 한정한다. */
function visibleApp(anchor: HTMLElement | null): HTMLElement | null {
  const appRoot = anchor?.closest<HTMLElement>('.login-showcase__app-transition');
  const apps = Array.from((appRoot ?? document).querySelectorAll<HTMLElement>('.app'));
  return apps.find((app) => app.getClientRects().length > 0) ?? null;
}

/* 플로팅 버튼 진입점. App 에서 한 번만 렌더하고 화면마다 붙이지 않는다.
 *
 * 버튼은 .app 안에서 position: absolute 로 움직이고 드래그 범위도 .app 기준이라
 * DOM 상으로는 지금 화면의 .app 안에 있어야 한다. 그래서 고정된 host 요소 하나를
 * 만들어 두고 화면이 바뀔 때마다 그 요소만 새 .app 으로 옮긴다.
 * portal 대상 노드가 바뀌지 않으므로 버튼은 다시 마운트되지 않고,
 * 드래그로 옮긴 위치(컴포넌트 state)가 화면을 이동해도 그대로 남는다.
 *
 * 누르면 자두AI 전체 화면(AIChatPage)으로 이동한다. */
export function AIChatbot({
  initialLift,
  hidden = false,
  disabled = false,
  showEntryHint = false,
}: AIChatbotProps) {
  const navigation = useAppNavigation();
  const page = navigation?.page;

  /* 버튼이 담길 고정 host — 한 번만 만들고 계속 재사용한다 */
  const hostRef = useRef<HTMLDivElement | null>(null);
  /* 데모 전환 중 이전/새 App을 구분하기 위한 현재 렌더 트리의 기준점 */
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  /* 화면을 옮긴 뒤 버튼에게 '다시 자리 잡아라' 고 알리는 통로 */
  const settleRef = useRef<(() => void) | null>(null);
  if (!hostRef.current && typeof document !== 'undefined') {
    const host = document.createElement('div');
    /* 레이아웃에 아무 영향도 주지 않아야 한다 — 버튼의 offsetParent 는 .app 그대로다 */
    host.style.display = 'contents';
    hostRef.current = host;
  }

  /* 화면이 바뀌면 host 를 새 .app 안으로 옮긴다 (노드 이동이라 버튼은 그대로 살아 있다) */
  useLayoutEffect(() => {
    const host = hostRef.current;
    const app = visibleApp(anchorRef.current);
    if (host && app && host.parentElement !== app) app.appendChild(host);
    /* 새 화면의 헤더·탭바·금지 영역을 다시 재서 필요하면 비켜 준다
     * (커뮤니티 글쓰기 버튼과 겹친 채로 들어오는 경우) */
    settleRef.current?.();
  }, [page]);

  /* 누른 자리에서 화면이 펼쳐지는 전환. 재생할 수 없는 상황이면 바로 이동한다. */
  const openChat = (button: HTMLButtonElement | null) => {
    const go = () => navigation?.navigate('ai-chat', { returnTo: navigation.page });
    if (!playAIChatMorph(button, go)) go();
  };

  if (!hostRef.current) return null;

  return (
    <>
      <span ref={anchorRef} hidden aria-hidden="true" />
      {createPortal(
        <>
          <AIChatbotHint show={showEntryHint && !hidden && !disabled} />
          <AIChatbotButton
            onClick={openChat}
            initialLift={initialLift}
            hidden={hidden}
            disabled={disabled}
            coachmarkRef={aiFabRef}
            settleRef={settleRef}
          />
        </>,
        hostRef.current,
      )}
    </>
  );
}
