import '../../styles/account-switch.css';
import { BottomSheet } from '../BottomSheet';
import { useAuth } from '../../auth/AuthContext';
import { TEST_ACCOUNTS, TEST_PASSWORD } from '../../auth/mockUsers';
import { DEMO_SIGNUP_EMAIL } from '../../auth/demoSignup';

/* 개발·발표용 빠른 계정 전환 시트.
 * 로그인 화면 TestAccountSheet 와 같은 셸/스타일(.bsheet, .test-account)을 재사용하고,
 * 전환은 새 로직 없이 기존 AuthContext 의 login() / logout() 만 호출한다. */
interface AccountSwitchSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSwitchSheet({ open, onClose }: AccountSwitchSheetProps) {
  const { user, login, logout, demoSignedUp } = useAuth();

  /* 가입 전 이서준은 로그인 대상이 아니다 (demoSignup 플래그는 읽기만 한다) */
  const pendingSignupEmail = demoSignedUp ? null : DEMO_SIGNUP_EMAIL;

  const handleSelect = (email: string) => {
    if (email === user?.email) return; // 현재 계정 재선택은 무시
    onClose();
    if (email === pendingSignupEmail) {
      /* 가입 전 이서준 — 즉시 전환하지 않고 기존 회원가입 플로우로 보낸다 */
      logout();
      return;
    }
    login(email, TEST_PASSWORD);
  };

  return (
    <BottomSheet
      open={open}
      className="test-account account-switch"
      labelledBy="account-switch-title"
      onDimClick={onClose}
    >
      <div className="bsheet__grip">
        <span />
      </div>
      <h2 id="account-switch-title" className="test-account__title">
        계정 전환
      </h2>

      {user && (
        <div className="account-switch__current">
          <span className="test-account__name-row">
            <span className="test-account__name">{user.name}</span>
            <span className="account-switch__badge">현재 사용 중</span>
          </span>
          <span className="test-account__email">{user.email}</span>
        </div>
      )}

      <ul className="test-account__list">
        {TEST_ACCOUNTS.map((account) => {
          const isCurrent = account.email === user?.email;
          const isPending = account.email === pendingSignupEmail;
          return (
            <li key={account.email}>
              <button
                type="button"
                className="test-account__item"
                disabled={isCurrent}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => handleSelect(account.email)}
              >
                <span className="test-account__name-row">
                  <span className="test-account__name">{account.name}</span>
                  <span className="test-account__desc">{account.description}</span>
                </span>
                {isCurrent ? (
                  <span className="account-switch__badge">현재 사용 중</span>
                ) : isPending ? (
                  <span className="test-account__status">회원가입 필요</span>
                ) : (
                  <span className="test-account__email">{account.email}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="test-account__new account-switch__logout"
        onClick={() => {
          onClose();
          logout();
        }}
      >
        로그아웃
      </button>
    </BottomSheet>
  );
}
