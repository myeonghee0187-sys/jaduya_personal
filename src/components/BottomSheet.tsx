import type { CSSProperties, ReactNode } from 'react';
import { useDismissOnBack } from '../navigation/useDismissOnBack';

interface BottomSheetProps {
  open: boolean;
  /** 시트 루트에 붙는 기능별 추가 클래스 */
  className: string;
  labelledBy: string;
  /** 레이어(딤 포함) 바깥 요소에 붙는 추가 클래스 — 레이어 모양을 조정할 때만 쓴다 */
  layerClassName?: string;
  /** 레이어 바깥 요소의 인라인 스타일 — 딤 진하기 같은 변수를 넘길 때만 쓴다 */
  layerStyle?: CSSProperties;
  /** 시트 루트의 인라인 스타일 — 손잡이를 끌어 시트를 따라 움직이게 할 때만 쓴다 */
  sheetStyle?: CSSProperties;
  onDimClick: () => void;
  children: ReactNode;
}

/* 여러 기능에서 공유하는 Bottom Sheet 셸.
 * dim + .bsheet 구조는 css/overlays.css 의 .layer / .layer-dim / .bsheet 그대로. */
export function BottomSheet({
  open,
  className,
  labelledBy,
  layerClassName,
  layerStyle,
  sheetStyle,
  onDimClick,
  children,
}: BottomSheetProps) {
  /* 열려 있는 동안 뒤로가기 한 단계를 가져간다 — 시스템 뒤로가기가 오면 화면을 벗어나기
   * 전에 이 시트부터 닫는다(onDimClick과 동일한 닫기 동작). */
  useDismissOnBack(open, onDimClick);
  return (
    <div
      className={`layer layer--sheet${layerClassName ? ` ${layerClassName}` : ''}`}
      style={layerStyle}
      hidden={!open}
    >
      <button type="button" className="layer-dim" aria-label="닫기" onClick={onDimClick} />
      <section
        className={`bsheet ${className}`}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </section>
    </div>
  );
}
