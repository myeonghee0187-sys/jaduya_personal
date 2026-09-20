import type {
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import type { SheetState } from '../types';

export interface SheetHandleProps {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
}

interface HomeSheetProps {
  state: SheetState;
  sheetRef: MutableRefObject<HTMLElement | null>;
  scrollRef: MutableRefObject<HTMLDivElement | null>;
  handleRef: MutableRefObject<HTMLDivElement | null>;
  handleProps: SheetHandleProps;
  children: ReactNode;
  overlay?: ReactNode;
}

/** Home 대시보드 Bottom Sheet 셸 (peek ↔ expanded) */
export function HomeSheet({
  state,
  sheetRef,
  scrollRef,
  handleRef,
  handleProps,
  children,
  overlay,
}: HomeSheetProps) {
  const expanded = state === 'expanded';

  return (
    <section className="sheet" aria-label="홈 대시보드" ref={sheetRef}>
      <div
        className="sheet__handle-wrap"
        ref={handleRef}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls="sheetScroll"
        aria-label={expanded ? '대시보드 접기' : '대시보드 펼치기'}
        {...handleProps}
      >
        <span className="sheet__handle" />
      </div>

      <div className="sheet__scroll" id="sheetScroll" ref={scrollRef}>
        {children}
      </div>
      {overlay}
    </section>
  );
}
