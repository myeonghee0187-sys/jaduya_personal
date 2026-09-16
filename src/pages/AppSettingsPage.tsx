import { useState } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SettingsToggleRow } from '../components/SettingsRow';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon } from '../lib/asset';
import { useMyMenu } from '../menu/MyMenuContext';
import { useAppNavigation } from '../navigation/AppNavigation';

type NotificationSetting = 'schedule' | 'mission' | 'budget' | 'fixedCost' | 'community';
type AppSettingsAction = 'guide';

interface AppSettingsPageProps {
  onAction?: (action: AppSettingsAction) => void;
}

const INITIAL_NOTIFICATIONS: Record<NotificationSetting, boolean> = {
  schedule: true,
  mission: false,
  budget: true,
  fixedCost: false,
  community: true,
};

export function AppSettingsPage({ onAction }: AppSettingsPageProps) {
  const navigation = useAppNavigation();
  const myMenu = useMyMenu();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const setNotification = (key: NotificationSetting, checked: boolean) => {
    setNotifications((current) => ({ ...current, [key]: checked }));
  };

  return (
    <div className="settings-page app">
      <SubPageHeader
        title="앱 설정"
        backLabel="마이페이지로"
        onBack={() => navigation?.navigate('my')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="settings-page__scroll">
        <section className="settings-section" aria-labelledby="living-notification-title">
          <div className="settings-section__header">
            <h2 id="living-notification-title">생활알림</h2>
            <button type="button" className="settings-section__guide" onClick={() => onAction?.('guide')}>
              알림 설정 가이드
              <img src={icon('chevron-right-gray.svg')} alt="" />
            </button>
          </div>
          <div className="settings-list">
            <SettingsToggleRow
              title="생활 일정 알림"
              description="공과금 납부일, 분리수거 일정을 알려드려요."
              checked={notifications.schedule}
              label="생활 일정 알림"
              onChange={(checked) => setNotification('schedule', checked)}
            />
            <SettingsToggleRow
              title="자취 미션 알림"
              description="오늘의 미션과 마감이 가까운 미션을 알려드려요."
              checked={notifications.mission}
              label="자취 미션 알림"
              onChange={(checked) => setNotification('mission', checked)}
            />
            <SettingsToggleRow
              title="예산 초과 알림"
              description="설정한 예산을 넘기기 전에 알려드려요."
              checked={notifications.budget}
              label="예산 초과 알림"
              onChange={(checked) => setNotification('budget', checked)}
            />
            <SettingsToggleRow
              title="고정비 알림"
              description="월세, 구독료 등 예정된 고정비를 미리 알려드려요."
              checked={notifications.fixedCost}
              label="고정비 알림"
              onChange={(checked) => setNotification('fixedCost', checked)}
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="news-notification-title">
          <h2 id="news-notification-title">소식 알림</h2>
          <div className="settings-list">
            <SettingsToggleRow
              title="커뮤니티 알림"
              description="내 글 반응과 인기 소식을 알려드려요."
              checked={notifications.community}
              label="커뮤니티 알림"
              onChange={(checked) => setNotification('community', checked)}
            />
            <p className="settings-info">
              <img src={icon('info.svg')} alt="" />
              알림을 꺼도 앱 안에서는 계속 확인할 수 있어요.
            </p>
          </div>
        </section>
      </main>

      <BottomNavigation activeTab="my" />
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

export default AppSettingsPage;

