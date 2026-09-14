import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const CLOSE_THRESHOLD = 80; // px — 이만큼 아래로 끌면 닫힌다

/** Bottom Sheet 핸들 전용 drag-to-close — Home 히어로 시트(useSheetGesture)는
 * peek/expanded 2단계 + 고정 픽셀 상수라 이 용도(단순 열기/닫기)엔 맞지 않아 따로 둔다. */
export function useDragToClose(onClose: () => void) {
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    setDragY(Math.max(0, e.clientY - startYRef.current));
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragY > CLOSE_THRESHOLD) onClose();
    setDragY(0);
  };

  return {
    dragY,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
