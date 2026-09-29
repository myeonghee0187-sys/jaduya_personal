import { FilledBell } from './FilledBell';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useNotifications } from '../notifications/NotificationContext';

type HeaderIconName = 'bell';

interface HeaderIconButtonProps {
  iconName: HeaderIconName;
  label: string;
  onClick?: () => void;
}

/** 모든 헤더에서 쓰는 동일한 40px 클릭 영역 + 24px SVG 아이콘 버튼.
 *
 * 종은 Header / SubPageHeader 두 곳에서 쓰이므로 알림 관련 동작
 * (읽지 않은 표시 · 알림 화면 이동)을 전부 여기 한 곳에서만 처리한다.
 * 호출부는 예전과 똑같이 iconName="bell" 만 넘기면 되고 레이아웃도 그대로다. */
export function HeaderIconButton({ iconName, label, onClick }: HeaderIconButtonProps) {
  const navigation = useAppNavigation();
  const { unreadCount } = useNotifications();
  const isBell = iconName === 'bell';
  const hasUnread = isBell && unreadCount > 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    /* 종은 기본 동작으로 알림 화면을 연다 — 뒤로가기로 지금 화면에 돌아온다 */
    if (isBell) navigation?.navigate('notifications', { returnTo: navigation.page });
  };

  return (
    <button
      type="button"
      className={`header-icon-button header-icon-button--${iconName}`}
      aria-label={label}
      onClick={handleClick}
    >
      <FilledBell />
      {/* 읽지 않은 알림이 있을 때만 빨간 점을 그린다 */}
      {hasUnread && <span className="header-icon-button__badge" aria-hidden="true" />}
    </button>
  );
}

export default HeaderIconButton;
