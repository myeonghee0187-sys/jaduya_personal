import { useEffect, useState } from 'react';
import { icon } from '../lib/asset';
import { FilledBell } from './FilledBell';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useNotifications } from '../notifications/NotificationContext';

type HeaderIconName = 'bell' | 'menu';

interface HeaderIconButtonProps {
  iconName: HeaderIconName;
  label: string;
  onClick?: () => void;
  /** menu 버튼에서 GNB 열림 상태와 두 SVG의 교차 전환을 동기화한다. */
  open?: boolean;
}

/** 모든 헤더에서 쓰는 동일한 40px 클릭 영역 + 24px SVG 아이콘 버튼.
 *
 * 종은 Header / SubPageHeader / GNB 세 곳에서 쓰이므로 알림 관련 동작
 * (읽지 않은 표시 · 반짝임 · 알림 화면 이동)을 전부 여기 한 곳에서만 처리한다.
 * 호출부는 예전과 똑같이 iconName="bell" 만 넘기면 되고 레이아웃도 그대로다. */
export function HeaderIconButton({ iconName, label, onClick, open = false }: HeaderIconButtonProps) {
  const navigation = useAppNavigation();
  const { unreadCount } = useNotifications();
  const isBell = iconName === 'bell';
  const hasUnread = isBell && unreadCount > 0;

  /* 반짝임은 화면에 처음 나타날 때 한 번만 — 계속 반복하지 않는다 */
  const [sparkle, setSparkle] = useState(false);
  useEffect(() => {
    if (!hasUnread) return;
    setSparkle(true);
    const done = window.setTimeout(() => setSparkle(false), 900);
    return () => window.clearTimeout(done);
    /* 읽지 않은 알림이 처음 생긴 시점에만 돈다 — 개수가 줄어드는 것으로는 다시 돌지 않는다 */
  }, [hasUnread]);

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
      className={`header-icon-button header-icon-button--${iconName}${open ? ' is-open' : ''}`}
      aria-label={label}
      aria-expanded={iconName === 'menu' ? open : undefined}
      onClick={handleClick}
    >
      {isBell ? (
        <FilledBell />
      ) : (
        <>
          <img className="header-menu-icon header-menu-icon--hamburger" src={icon('header-menu.svg')} alt="" />
          <img className="header-menu-icon header-menu-icon--close" src={icon('gnb-close.svg')} alt="" />
        </>
      )}
      {/* 읽지 않은 알림이 있을 때만 빨간 점을 그린다 */}
      {hasUnread && <span className="header-icon-button__badge" aria-hidden="true" />}
      {sparkle && (
        <span className="header-icon-button__sparkle" aria-hidden="true">
          <i />
          <i />
        </span>
      )}
    </button>
  );
}

export default HeaderIconButton;
