import type { ReactNode } from 'react';
import { useDismissOnBack } from '../navigation/useDismissOnBack';

interface BottomSheetProps {
  open: boolean;
  /** 시트 루트에 붙는 기능별 추가 클래스 */
  className: string;
  labelledBy: string;
  onDimClick: () => void;
  children: ReactNode;
}

/* 여러 기능에서 공유하는 Bottom Sheet 셸.
 * dim + .bsheet 구조는 css/overlays.css 의 .layer / .layer-dim / .bsheet 그대로. */
export function BottomSheet({
  open,
  className,
  labelledBy,
  onDimClick,
  children,
}: BottomSheetProps) {
  /* 열려 있는 동안 뒤로가기 한 단계를 가져간다 — 시스템 뒤로가기가 오면 화면을 벗어나기
   * 전에 이 시트부터 닫는다(onDimClick과 동일한 닫기 동작). */
  useDismissOnBack(open, onDimClick);
  return (
    <div className="layer layer--sheet" hidden={!open}>
      <button type="button" className="layer-dim" aria-label="닫기" onClick={onDimClick} />
      <section
        className={`bsheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </section>
    </div>
  );
}
