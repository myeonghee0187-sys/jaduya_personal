import { icon } from '../lib/asset';
import { DEFAULT_MENU, MAX_MENU, MENU_CATALOG, findMenu } from '../data/menuCatalog';
import { useDraftSelection } from '../hooks/useDraftSelection';
import { BottomSheet } from './BottomSheet';
import { MenuCard } from './MenuCard';

interface MyMenuEditProps {
  open: boolean;
  draft: ReturnType<typeof useDraftSelection>;
  onClose: () => void;
  onSave: () => void;
}

/** ② 내 메뉴 편집 Bottom Sheet — Figma gnb_my_menu_edit (1432:4729) */
export function MyMenuEdit({ open, draft, onClose, onSave }: MyMenuEditProps) {
  const available = MENU_CATALOG.filter((item) => !draft.has(item.id));

  return (
    <BottomSheet open={open} className="menu-edit" labelledBy="menuEditTitle" onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>

      <div className="menu-edit__header">
        <div className="menu-edit__heading">
          <h2 className="menu-edit__title" id="menuEditTitle">
            내 메뉴 편집
          </h2>
          <span className="menu-edit__badge">
            선택됨 {draft.count}/{MAX_MENU}
          </span>
        </div>
        <button type="button" className="menu-edit__close" aria-label="편집 닫기" onClick={onClose}>
          <img src={icon('sheet-close.svg')} alt="" />
        </button>
      </div>

      <div className="menu-edit__body">
        <div className="menu-edit__notice">
          <p className="menu-edit__notice-text">
            <img src={icon('sheet-info.svg')} alt="" />
            <span>
              자주 쓰는 메뉴를 <b>최대 4개</b>까지 등록하세요.
            </span>
          </p>
          <span className="menu-edit__status" hidden={!draft.isFull}>
            최대 개수 충족
          </span>
        </div>

        <div className="menu-edit__group">
          <div className="menu-edit__group-head">
            <h3 className="menu-edit__group-title">선택된 메뉴</h3>
            <span className="menu-edit__group-hint">카드를 터치하여 해제</span>
          </div>
          <div className="shortcut-grid">
            {draft.draft.map((id) => {
              const item = findMenu(id);
              return item ? (
                <MenuCard key={id} item={item} selected onClick={draft.remove} />
              ) : null;
            })}
          </div>
        </div>

        <div className="menu-edit__group">
          <div className="menu-edit__group-head">
            <h3 className="menu-edit__group-title">추가 가능한 메뉴</h3>
            <span className="menu-edit__group-hint">터치하여 추가</span>
          </div>
          <div className="shortcut-grid">
            {available.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                selected={false}
                disabled={draft.isFull}
                onClick={draft.add}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="menu-edit__footer">
        <button
          type="button"
          className="menu-edit__reset"
          onClick={() => draft.reset(DEFAULT_MENU)}
        >
          초기화
        </button>
        <button type="button" className="menu-edit__save" onClick={onSave}>
          저장하기
        </button>
      </div>
    </BottomSheet>
  );
}
