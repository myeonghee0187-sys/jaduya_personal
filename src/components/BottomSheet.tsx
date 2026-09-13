import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  /** 시트 루트에 붙는 추가 클래스 (.menu-edit / .add-widget) */
  className: string;
  labelledBy: string;
  onDimClick: () => void;
  children: ReactNode;
}

/* 내 메뉴 편집 / 위젯 추가가 공유하는 Bottom Sheet 셸.
 * dim + .bsheet 구조는 css/overlays.css 의 .layer / .layer-dim / .bsheet 그대로. */
export function BottomSheet({
  open,
  className,
  labelledBy,
  onDimClick,
  children,
}: BottomSheetProps) {
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
