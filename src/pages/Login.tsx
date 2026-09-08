import { useState } from 'react';
import type { FormEvent } from 'react';
import { Header } from '../components/Header';
import { AuthField } from '../components/auth/AuthField';
import { TestAccountSheet } from '../components/auth/TestAccountSheet';
import { useAuth } from '../auth/AuthContext';
import { TEST_PASSWORD } from '../auth/mockUsers';
import type { MockAccount } from '../auth/mockUsers';
import { icon, img } from '../lib/asset';

/* 로그인 화면 (Figma node 1864:5830) */
interface LoginProps {
  onGoSignup: () => void;
}

export function Login({ onGoSignup }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSelectAccount = (account: MockAccount) => {
    setSheetOpen(false);
    setEmail(account.email);
    setPassword(TEST_PASSWORD);
    setError('');
  };

  return (
    <div className="app auth">
      <Header onMenuClick={() => {}} />
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
            <button type="button" className="auth-link" onClick={onGoSignup}>
              회원가입
            </button>
          </div>
        </div>
      </div>

      <TestAccountSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSelect={handleSelectAccount} />
    </div>
  );
}
