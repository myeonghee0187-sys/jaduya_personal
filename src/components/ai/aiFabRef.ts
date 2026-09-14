import type { RefObject } from 'react';

/* 전역 AI 플로팅 버튼의 DOM 참조.
 *
 * 버튼은 App 에서 한 번만 렌더하므로 Home 처럼 버튼 위치를 알아야 하는 화면
 * (코치마크가 강조 영역을 실측한다)이 자기 ref 를 넘길 수 없다.
 * 대신 이 공용 ref 하나를 버튼이 채우고, 필요한 화면이 그대로 읽는다.
 * 버튼은 드래그로 위치가 바뀌므로 좌표를 저장하지 말고 이 ref 로 매번 재야 한다. */
export const aiFabRef: RefObject<HTMLButtonElement | null> = { current: null };
