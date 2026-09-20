import { useId } from 'react';

/* 저장하지 않은 변경이 있는 채로 메뉴 관리를 떠나려 할 때 뜨는 확인 Dialog.
 * 중앙 Dialog(.menu-guide-layer / .menu-guide-dialog)를 그대로 쓰고, 버튼은 두 개뿐이다 —
 * 저장은 하단 Action Bar 에서 하므로 여기에는 넣지 않는다. */

interface MenuLeaveDialogProps {
  open: boolean;
  /** 계속 편집 — Dialog 를 닫고 화면에 남는다 */
  onStay: () => void;
  /** 저장하지 않고 나가기 — 변경한 draft 를 버리고 이동한다 */
  onLeave: () => void;
}

export function MenuLeaveDialog({ open, onStay, onLeave }: MenuLeaveDialogProps) {
  const titleId = useId();

  return (
    <div className="layer menu-guide-layer" hidden={!open}>
      <button type="button" className="layer-dim" aria-label="계속 편집" onClick={onStay} />
      <section className="menu-guide-dialog menu-leave-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 className="menu-leave-dialog__title" id={titleId}>변경사항을 저장하지 않을까요?</h2>
        <p className="menu-leave-dialog__desc">저장하지 않고 나가면 변경한 메뉴 설정이 사라져요.</p>
        <div className="menu-leave-dialog__actions">
          <button type="button" className="menu-leave-dialog__stay" onClick={onStay}>계속 편집</button>
          <button type="button" className="menu-leave-dialog__leave" onClick={onLeave}>저장하지 않고 나가기</button>
        </div>
      </section>
    </div>
  );
}
