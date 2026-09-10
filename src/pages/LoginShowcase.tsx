import { useState } from 'react';
import { IPhoneFrame } from '../components/IPhoneFrame';
import App from '../App';
import { Login } from './Login';
import { Signup } from './Signup';
import { useAuth } from '../auth/AuthContext';
import { TEST_ACCOUNTS } from '../auth/mockUsers';
import type { MockAccount } from '../auth/mockUsers';
import { DEMO_SIGNUP_EMAIL, DEMO_SIGNUP_LABEL } from '../auth/demoSignup';
import { resolveAccountSelection } from '../auth/resolveAccountSelection';
import { icon, img } from '../lib/asset';

/* 사이트 기본 화면(main.tsx 진입점). 실 로그인 화면(Login.tsx)을 실물형 iPhone 목업
 * (IPhoneFrame) 안에 그대로 넣어 항상 실제 화면과 같은 모습을 유지하는 쇼케이스 컷이다.
 * 3단 반응형 모두 IPhoneFrame 은 항상 보이고(login-showcase.css 의 --phone-scale 로 크기만
 * 조절), Demo Account 패널만 768px 미만(모바일)에서 CSS로 숨긴다.
 *
 * 로그인 전에는 여기서 직접 Demo Account 연동된 Login/Signup 을 보여주고, 로그인에
 * 성공하면(useAuth().user 가 채워지면) App.tsx 가 원래 하던 대로 온보딩/Home 으로 넘겨받는다
 * — App.tsx 는 자기 안에서도 Login/Signup 을 그리지만 user 가 있을 때만 그 분기를 쓴다. */
export function LoginShowcase() {
  const { user, demoSignedUp, logout } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState(TEST_ACCOUNTS[0]?.email ?? '');
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  /* Demo Account 클릭으로 채울 값 — 기본은 비워 둬서 처음 열었을 때는 빈 로그인 폼 그대로다 */
  const [loginPrefill, setLoginPrefill] = useState<{ email: string; password: string } | null>(null);
  const [signupPrefillEmail, setSignupPrefillEmail] = useState('');

  /* 가입 전인 데모 계정(이서준)은 카드 설명을 "처음 시작하기 · 회원가입 필요"로 바꿔서
   * 앱 안 "테스트 계정 선택" 바텀시트와 동일하게 보여준다 */
  const pendingSignupEmail = demoSignedUp ? null : DEMO_SIGNUP_EMAIL;

  const handleSelectAccount = (account: MockAccount) => {
    setSelectedEmail(account.email);
    const selection = resolveAccountSelection(account, demoSignedUp);
    if (selection.target === 'signup') {
      setSignupPrefillEmail(selection.email);
      setAuthView('signup');
      return;
    }
    setLoginPrefill({ email: selection.email, password: selection.password });
    setAuthView('login');
  };

  /* "새 계정으로 시작하기" — 로그인되어 Home 이 떠 있어도 로그아웃하고
   * 항상 첫 로그인 화면(빈 Login)으로 되돌아간다. */
  const handleStartNewAccount = () => {
    if (user) logout();
    setLoginPrefill(null);
    setSignupPrefillEmail('');
    setSelectedEmail(TEST_ACCOUNTS[0]?.email ?? '');
    setAuthView('login');
  };

  return (
    <div className="login-showcase">
      <img
        className="login-showcase__bg"
        src={img('screen-background.png')}
        alt=""
        aria-hidden="true"
      />

      <div className="login-showcase__topbar">
        <div className="login-showcase__brand">
          <img className="login-showcase__brand-logo" src={icon('logo-mark.svg')} alt="" />
          <span className="login-showcase__brand-name">자두야</span>
        </div>
        <div className="login-showcase__meta">
          <span className="login-showcase__meta-label">APP DEMO</span>
          <span className="login-showcase__dots">
            <i className="login-showcase__dot login-showcase__dot--red" />
            <i className="login-showcase__dot login-showcase__dot--green" />
            <i className="login-showcase__dot login-showcase__dot--yellow" />
          </span>
        </div>
      </div>

      <div className="login-showcase__stage">
        <IPhoneFrame>
          {user ? (
            <App />
          ) : authView === 'login' ? (
            <Login
              key={loginPrefill?.email ?? 'default'}
              onGoSignup={(prefillEmail) => {
                setSignupPrefillEmail(prefillEmail ?? '');
                setAuthView('signup');
              }}
              initialEmail={loginPrefill?.email}
              initialPassword={loginPrefill?.password}
            />
          ) : (
            <Signup
              key={signupPrefillEmail || 'default'}
              onGoLogin={() => setAuthView('login')}
              initialEmail={signupPrefillEmail}
            />
          )}
        </IPhoneFrame>

        <div className="login-showcase__panel">
          <div className="login-showcase__panel-head">
            <h2 className="login-showcase__panel-title">Demo Account</h2>
            <img className="login-showcase__panel-info" src={icon('info.svg')} alt="" />
          </div>
          <p className="login-showcase__panel-desc">
            테스트 계정을 선택하여
            <br />
            다양한 사용자의 화면을 확인해보세요.
          </p>

          <ul className="login-showcase__accounts">
            {TEST_ACCOUNTS.map((account) => {
              const selected = account.email === selectedEmail;
              const pending = account.email === pendingSignupEmail;
              const avatarName = account.email.split('@')[0];
              return (
                <li key={account.email}>
                  <button
                    type="button"
                    className={`login-showcase__account${selected ? ' login-showcase__account--selected' : ''}`}
                    onClick={() => handleSelectAccount(account)}
                  >
                    <img
                      className="login-showcase__avatar"
                      src={img(`profile_${avatarName}.png`)}
                      alt=""
                    />
                    <span className="login-showcase__account-text">
                      <span className="login-showcase__account-name">{account.name}</span>
                      <span className="login-showcase__account-desc">
                        {pending ? DEMO_SIGNUP_LABEL : account.description}
                      </span>
                    </span>
                    <img className="login-showcase__chevron" src={icon('chevron-right-sm.svg')} alt="" />
                  </button>
                </li>
              );
            })}
          </ul>

          <button type="button" className="login-showcase__new" onClick={handleStartNewAccount}>
            <span className="login-showcase__new-icon">
              <img src={icon('plus-add.svg')} alt="" />
            </span>
            새 계정으로 시작하기
            <img className="login-showcase__new-arrow" src={icon('chevron-right-sm.svg')} alt="" />
          </button>
        </div>
      </div>
    </div>
  );
}
