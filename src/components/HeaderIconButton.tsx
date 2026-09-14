import { icon } from '../lib/asset';
import { FilledBell } from './FilledBell';

type HeaderIconName = 'bell' | 'menu' | 'close';

interface HeaderIconButtonProps {
  iconName: HeaderIconName;
  label: string;
  onClick?: () => void;
}

const ICON_FILES: Record<Exclude<HeaderIconName, 'bell'>, string> = {
  menu: 'header-menu.svg',
  close: 'gnb-close.svg',
};

/** 모든 헤더에서 쓰는 동일한 40px 클릭 영역 + 24px SVG 아이콘 버튼. */
export function HeaderIconButton({ iconName, label, onClick }: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      className={`header-icon-button header-icon-button--${iconName}`}
      aria-label={label}
      onClick={onClick}
    >
      {iconName === 'bell' ? <FilledBell /> : <img src={icon(ICON_FILES[iconName])} alt="" />}
      {iconName === 'bell' && <span className="header-icon-button__badge" aria-hidden="true" />}
    </button>
  );
}

export default HeaderIconButton;
