import { useState } from 'react';
import type { FormEvent } from 'react';
import { Header } from '../components/Header';
import { AuthField } from '../components/auth/AuthField';
import { TestAccountSheet } from '../components/auth/TestAccountSheet';
import { useAuth } from '../auth/AuthContext';
import { DEMO_SIGNUP_EMAIL } from '../auth/demoSignup';
import { resolveAccountSelection } from '../auth/resolveAccountSelection';
import type { MockAccount } from '../auth/mockUsers';
import { icon, img } from '../lib/asset';

/* 로그인 화면 (Figma node 1864:5830) */
interface LoginProps {
  /** prefillEmail 이 있으면 회원가입 화면의 이메일을 채운 채로 연다 */
  onGoSignup: (prefillEmail?: string) => void;
  /** 외부(LoginShowcase 의 Demo Account 패널 등)에서 이메일/비밀번호를 채운 채로 열 때 사용 */
  initialEmail?: string;
  initialPassword?: string;
}

export function Login({ onGoSignup, initialEmail = '', initialPassword = '' }: LoginProps) {
  const { login, demoSignedUp } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const canSubmit = email.trim() !== '' && password !== '';

  const attemptLogin = () => {
    if (!canSubmit) return;
    const ok = login(email, password);
    if (!ok) setError('이메일 또는 비밀번호를 확인해주세요.');
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    attemptLogin();
  };

  /* 가입 전인 데모 계정(이서준)은 자동 입력 대신 회원가입으로 보낸다 */
  const pendingSignupEmail = demoSignedUp ? null : DEMO_SIGNUP_EMAIL;

  const handleSelectAccount = (account: MockAccount) => {
    setSheetOpen(false);
    const selection = resolveAccountSelection(account, demoSignedUp);
    if (selection.target === 'signup') {
      onGoSignup(selection.email);
      return;
    }
    setEmail(selection.email);
    setPassword(selection.password);
    setError('');
  };

  return (
    <div className="app auth">
      <Header showActions={false} />
      <div className="auth__body auth__body--login">
        <div className="auth__logo">
          <img className="auth__logo-img" src={img('auth-onboarding.svg')} width={147} height={70} alt="" />
          <h1 className="auth__logo-heading">다시 만나 반가워요</h1>
        </div>

        <form className="auth-form" onSubmit={handleFormSubmit}>
          <div className="auth-form__fields">
            <AuthField
              id="login-email"
              label="이메일"
              labelExtra={
                <button type="button" className="auth-testaccount" onClick={() => setSheetOpen(true)}>
                  테스트 계정 선택
                </button>
              }
              type="email"
              placeholder="이메일을 입력해주세요"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
            />
            <AuthField
              id="login-password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
            />
          </div>

          {error && <p className="auth-form__error">{error}</p>}

          <button type="button" className="auth-forgot">
            비밀번호를 잊으셨나요?
          </button>
        </form>

        <div className="auth-bottom">
          <div className="auth-bottom__actions">
            <button type="button" className="auth-button" disabled={!canSubmit} onClick={attemptLogin}>
              로그인
            </button>

            <div className="auth-divider">
              <span className="auth-divider__line" />
              <span className="auth-divider__text">또는 소셜 로그인</span>
              <span className="auth-divider__line" />
            </div>

            <div className="auth-social">
              <button type="button" className="auth-social__btn auth-social__btn--kakao">
                <img className="auth-social__icon" src={icon('auth-kakao.svg')} alt="" />
                Kakao 계정으로 계속하기
              </button>
              <button type="button" className="auth-social__btn auth-social__btn--google">
                <span className="auth-social__icon auth-social__icon--google">
                  <img src={icon('auth-google.svg')} alt="" />
                </span>
                Google 계정으로 계속하기
              </button>
              <button type="button" className="auth-social__btn auth-social__btn--apple">
                <img className="auth-social__icon" src={icon('auth-apple.svg')} alt="" />
                Apple 계정으로 계속하기
              </button>
            </div>
          </div>

          <div className="auth-signup-link">
            <span>아직 자두 계정이 없으신가요?</span>
            <button type="button" className="auth-link" onClick={() => onGoSignup()}>
              회원가입
            </button>
          </div>
        </div>
      </div>

      <TestAccountSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleSelectAccount}
        pendingSignupEmail={pendingSignupEmail}
        onCreateAccount={() => {
          setSheetOpen(false);
          onGoSignup();
        }}
      />
    </div>
  );
}
