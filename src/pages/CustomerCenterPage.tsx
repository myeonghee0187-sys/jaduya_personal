import { useState } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SettingsNavigationRow } from '../components/SettingsRow';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon } from '../lib/asset';
import { useMyMenu } from '../menu/MyMenuContext';
import { useAppNavigation } from '../navigation/AppNavigation';

export type CustomerCenterAction =
  | 'faq'
  | 'contact'
  | 'history'
  | 'notice'
  | 'terms'
  | 'privacy';

interface CustomerCenterPageProps {
  onItemSelect?: (action: CustomerCenterAction) => void;
}

export function CustomerCenterPage({ onItemSelect }: CustomerCenterPageProps) {
  const navigation = useAppNavigation();
  const myMenu = useMyMenu();
  const [gnbOpen, setGnbOpen] = useState(false);
  const select = (action: CustomerCenterAction) => () => onItemSelect?.(action);

  return (
    <div className="settings-page support-page app">
      <SubPageHeader
        title="고객센터"
        backLabel="마이페이지로"
        onBack={() => navigation?.navigate('my')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="settings-page__scroll support-page__scroll">
        <section className="settings-section" aria-labelledby="help-title">
          <h2 id="help-title">도움받기</h2>
          <div className="settings-list">
            <SettingsNavigationRow
              title="자주 묻는 질문"
              description="많이 묻는 질문을 빠르게 확인해보세요."
              onClick={select('faq')}
            />
            <SettingsNavigationRow
              title="1:1 문의하기"
              description="오류 제보나 궁금한 점을 남겨주세요."
              onClick={select('contact')}
            />
            <SettingsNavigationRow
              title="문의 내역"
              description="내가 남긴 문의와 답변을 확인할 수 있어요."
              onClick={select('history')}
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="service-info-title">
          <h2 id="service-info-title">서비스 정보</h2>
          <div className="settings-list">
            <SettingsNavigationRow title="공지사항" onClick={select('notice')} />
            <SettingsNavigationRow title="이용약관" onClick={select('terms')} />
            <SettingsNavigationRow title="개인정보 처리방침" onClick={select('privacy')} />
            <SettingsNavigationRow title="버전 정보" value="v1.4.2 (최신 버전)" showChevron={false} />
          </div>
        </section>

        <section className="settings-section settings-section--notice" aria-labelledby="support-notice-title">
          <h2 id="support-notice-title">안내</h2>
          <p className="settings-info settings-info--support">
            <img src={icon('info.svg')} alt="" />
            앱 이용 중 문제가 생기면 언제든 문의해주세요.
          </p>
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

export default CustomerCenterPage;

