import { useState } from 'react';
import type { CSSProperties } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { FilledBell } from '../components/FilledBell';
import { NOTIFICATION_META } from '../data/notifications';
import { icon } from '../lib/asset';
import { useMyMenu } from '../menu/MyMenuContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useNotifications } from '../notifications/NotificationContext';

/* 알림 — 헤더의 종으로 들어오는 하위 화면.
 * 새 헤더를 만들지 않고 SubPageHeader / BottomNavigation 을 그대로 쓴다.
 * 읽음 처리는 화면 진입이 아니라 카드를 눌렀을 때만 일어난다. */
export function NotificationPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const { items, markRead } = useNotifications();

  /* 종을 누른 화면으로 돌아간다 — 어디서 들어왔는지는 navigate 가 넘겨준다 */
  const goBack = () => navigation?.goBack('home');

  const open = (id: string, route?: Parameters<NonNullable<typeof navigation>['navigate']>[0]) => {
    markRead(id);
    if (route) navigation?.navigate(route, { returnTo: 'notifications', returnOptions: navigation.options });
  };

  return (
    <div className="notifications app">
      <SubPageHeader
        title="알림"
        backLabel="이전 화면으로"
        onBack={goBack}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="notifications__scroll">
        {items.length === 0 ? (
          /* 알림이 없을 때 — 버튼 없이 지금 상태만 알려준다 */
          <div className="notifications__empty">
            <span className="notifications__empty-bell" aria-hidden="true">
              <FilledBell />
            </span>
            <p className="notifications__empty-title">아직 새로운 알림이 없어요</p>
            <p className="notifications__empty-text">새로운 소식이 생기면 여기에서 알려드릴게요.</p>
          </div>
        ) : (
          <ul className="notifications__list">
            {items.map((item) => {
              const meta = NOTIFICATION_META[item.type];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification-card${item.read ? '' : ' is-unread'}`}
                    onClick={() => open(item.id, item.route)}
                  >
                    <span
                      className={`notification-card__icon notification-card__icon--${meta.tone}`}
                      /* 아이콘 파일은 변수로 넘기고 실제 그리기는 ::before 가 맡는다
                       * (원형 배경까지 mask 로 잘리지 않게 하려는 것) */
                      style={{ '--notif-icon': `url(${icon(meta.iconFile)})` } as CSSProperties}
                      aria-hidden="true"
                    />
                    <span className="notification-card__body">
                      <span className={`notification-card__category is-${meta.tone}`}>
                        {meta.label}
                      </span>
                      <span className="notification-card__title">{item.title}</span>
                      <span className="notification-card__message">{item.message}</span>
                      <span className="notification-card__time">{item.createdAt}</span>
                    </span>
                    {!item.read && <span className="notification-card__dot" aria-label="읽지 않음" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNavigation activeTab="home" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />
    </div>
  );
}

export default NotificationPage;
