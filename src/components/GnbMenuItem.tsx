import type { ReactNode } from 'react';
import { icon } from '../lib/asset';

interface GnbMenuItemProps {
  /** assets/icon/ 아래 파일명 */
  iconFile: string;
  name: string;
  /** 하위 링크가 있으면 아코디언으로 동작한다 */
  open?: boolean;
  onToggle?: () => void;
  /** 아코디언 하위 영역의 id (aria-controls) */
  subId?: string;
  /** 하위 메뉴가 없는 항목을 눌렀을 때 */
  onSelect?: () => void;
  children?: ReactNode;
}

/** GNB 메인 메뉴 한 줄. 하위 링크가 있으면 아코디언, 없으면 단순 링크. */
export function GnbMenuItem({ iconFile, name, open, onToggle, subId, onSelect, children }: GnbMenuItemProps) {
  const accordion = Boolean(children);
  const chevron = accordion && open ? 'chevron-up.svg' : 'chevron-down.svg';

  const label = (
    <>
      <span className="gnb-menu__label">
        <img className="gnb-menu__icon" src={icon(iconFile)} alt="" />
        <span className="gnb-menu__name">{name}</span>
      </span>
      {accordion && <img className="gnb-menu__chevron" src={icon(chevron)} alt="" />}
    </>
  );

  if (!accordion) {
    return (
      <div className="gnb-menu__item">
        <a
          className="gnb-menu__button"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onSelect?.();
          }}
        >
          {label}
        </a>
      </div>
    );
  }

  return (
    <div className="gnb-menu__item" data-open={String(Boolean(open))}>
      <button
        type="button"
        className="gnb-menu__button"
        aria-expanded={Boolean(open)}
        aria-controls={subId}
        onClick={onToggle}
      >
        {label}
      </button>
      {/* 안쪽 한 겹은 높이 0fr↔1fr 로 스르륵 여닫기 위한 것이다 (overlays.css) */}
      <div className="gnb-menu__sub" id={subId}>
        <div className="gnb-menu__sub-inner">{children}</div>
      </div>
    </div>
  );
}
