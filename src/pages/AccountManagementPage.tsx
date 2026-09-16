import { ChangeEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SettingsNavigationRow } from '../components/SettingsRow';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon, img } from '../lib/asset';
import { DEFAULT_PERSONA } from '../data/personaHome';
import { PERSONA_PROFILE } from '../data/personaProfile';
import { useMyMenu } from '../menu/MyMenuContext';
import { useAppNavigation } from '../navigation/AppNavigation';

/* 앱 설정에 있던 계정 UI와 이벤트를 분리한 마이페이지 하위 화면이다. */
export type AccountManagementAction = 'account' | 'password' | 'connections' | 'withdraw';

interface AccountManagementPageProps {
  onAction?: (action: AccountManagementAction) => void;
}

export function AccountManagementPage({ onAction }: AccountManagementPageProps) {
  const navigation = useAppNavigation();
  const { user, logout, updateProfile } = useAuth();
  const myMenu = useMyMenu();
  const [gnbOpen, setGnbOpen] = useState(false);
  const defaultProfileImage = img(PERSONA_PROFILE[user?.persona ?? DEFAULT_PERSONA].profileImage);
  const [name, setName] = useState(user?.name ?? '');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? defaultProfileImage);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
    setProfileImage(user?.profileImage ?? defaultProfileImage);
  }, [defaultProfileImage, user?.name, user?.profileImage]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImage(typeof reader.result === 'string' ? reader.result : defaultProfileImage);
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    const nextName = name.trim();
    if (!nextName) {
      setNotice('사용자 이름을 입력해주세요.');
      return;
    }
    updateProfile({ name: nextName, profileImage });
    setNotice('프로필을 저장했어요.');
  };

  return (
    <div className="settings-page app">
      <SubPageHeader
        title="계정 관리"
        backLabel="마이페이지로"
        onBack={() => navigation?.navigate('my')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="settings-page__scroll">
        <section className="settings-section account-profile" aria-labelledby="profile-title">
          <h2 id="profile-title">프로필</h2>
          <div className="account-profile__summary">
            <img className="account-profile__image" src={profileImage} alt="현재 프로필" />
            <strong>{name || '사용자'}</strong>
          </div>
          <div className="settings-list">
            <label className="settings-row settings-row--simple account-profile__photo">
              <span className="settings-row__copy"><strong>프로필 사진 변경</strong></span>
              <span className="settings-row__accessory">
                <span className="settings-row__value">사진 선택</span>
                <img src={icon('chevron-right-thin.svg')} alt="" />
              </span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
            <label className="settings-row settings-row--simple account-profile__name">
              <span className="settings-row__copy"><strong>사용자 이름</strong></span>
              <input
                aria-label="사용자 이름"
                value={name}
                maxLength={20}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          </div>
          <button type="button" className="account-profile__save" onClick={saveProfile}>프로필 저장</button>
          <p className="account-profile__notice" role="status" aria-live="polite" hidden={!notice}>{notice}</p>
        </section>

        <section className="settings-section" aria-labelledby="account-title">
          <h2 id="account-title">계정 정보</h2>
          <div className="settings-list">
            <SettingsNavigationRow
              title="이메일"
              value={user?.email ?? ''}
              onClick={() => onAction?.('account')}
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="account-management-title">
          <h2 id="account-management-title">로그인 및 보안</h2>
          <div className="settings-list">
            <SettingsNavigationRow title="비밀번호 변경" onClick={() => onAction?.('password')} />
            <SettingsNavigationRow
              title="연결 계정 관리"
              className="settings-row--connections"
              value={
                <span className="settings-connections">
                  <span className="settings-connections__icons" aria-hidden="true">
                    <span className="settings-connections__icon settings-connections__icon--kakao">
                      <img src={icon('auth-kakao.svg')} alt="" />
                    </span>
                    <span className="settings-connections__icon settings-connections__icon--google">
                      <img src={icon('auth-google.svg')} alt="" />
                    </span>
                  </span>
                  연동됨
                </span>
              }
              onClick={() => onAction?.('connections')}
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="account-management-actions-title">
          <h2 id="account-management-actions-title">계정 관리</h2>
          <div className="settings-list">
            <SettingsNavigationRow title="로그아웃" onClick={logout} />
            <SettingsNavigationRow title="회원탈퇴" muted onClick={() => onAction?.('withdraw')} />
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

export default AccountManagementPage;
