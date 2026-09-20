import { useId } from 'react';
import { GlyphIcon } from './GlyphIcon';
import { icon } from '../lib/asset';
import { useDismissOnBack } from '../navigation/useDismissOnBack';

/* 메뉴 관리 "사용법" — 헤더 info 버튼을 눌렀을 때만 뜨는, 잠깐 읽고 닫는 중앙 도움말 Dialog.
 * 화면 이동 없이 위에 얹히기만 해서, 닫아도 페이지의 아코디언·선택 상태는 그대로다.
 * 닫기: X 버튼 / 바깥 dim 클릭 / 뒤로가기 (확인 버튼은 두지 않는다). */

/* 새 MY 메뉴 규칙 — 1×1 = 1칸, 2×2 = 4칸, 최대 8칸. 2×2 는 하나만, 기존 위젯은 지우지 않는다. */
const RULES = [
  { title: '최대 8칸', text: 'MY 메뉴는 최대 8칸까지 사용할 수 있어요.' },
  { title: '위젯 크기별 칸 수', text: '1×1 위젯은 1칸, 2×2 위젯은 4칸을 사용해요.' },
  { title: '2×2는 1개만', text: '2×2 위젯은 MY 메뉴에서 한 번에 1개만 사용할 수 있어요.' },
  { title: '기존 위젯은 그대로', text: '공간이 남아 있다면 기존 위젯을 삭제하지 않고 새 위젯을 추가할 수 있어요.' },
] as const;

interface MenuGuideSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MenuGuideSheet({ open, onClose }: MenuGuideSheetProps) {
  const titleId = useId();
  /* 열려 있는 동안 뒤로가기 한 단계를 가져간다 — 페이지를 벗어나기 전에 이 Dialog 부터 닫는다 */
  useDismissOnBack(open, onClose);

  return (
    <div className="layer menu-guide-layer" hidden={!open}>
      <button type="button" className="layer-dim" aria-label="닫기" onClick={onClose} />
      <section className="menu-guide-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="menu-guide-dialog__head">
          <h2 id={titleId}>MY 메뉴 이용 안내</h2>
          <button type="button" className="menu-guide-dialog__close" aria-label="닫기" onClick={onClose}>
            <img src={icon('sheet-close.svg')} alt="" />
          </button>
        </div>

        <ol className="menu-guide-dialog__list">
          {RULES.map((rule) => (
            <li key={rule.title}>
              <span className="menu-guide-dialog__icon">
                <GlyphIcon file="money-fund-check.svg" size={14} />
              </span>
              <span className="menu-guide-dialog__body">
                <strong>{rule.title}</strong>
                <span>{rule.text}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* 규칙 목록과 구분되는 예시 — "2×2 를 추가하면 기존 1×1 을 지워야 하나?" 라는 오해를 막는다 */}
        <aside className="menu-guide-dialog__notice">
          <span className="menu-guide-dialog__grid" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <div className="menu-guide-dialog__notice-body">
            <strong>2×2를 추가해도 기존 위젯은 그대로예요</strong>
            <p>1×1 위젯이 4개 있어도 2×2 위젯 1개를 더하면 정확히 8/8이라, 기존 위젯을 지우지 않고 함께 쓸 수 있어요.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
