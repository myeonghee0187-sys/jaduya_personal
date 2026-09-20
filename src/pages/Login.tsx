import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { AuthField } from '../components/auth/AuthField';
import { TestAccountSheet } from '../components/auth/TestAccountSheet';
import { useAuth } from '../auth/AuthContext';
import { DEMO_SIGNUP_EMAIL } from '../auth/demoSignup';
import { resolveAccountSelection } from '../auth/resolveAccountSelection';
import { TEST_ACCOUNTS } from '../auth/mockUsers';
import type { MockAccount, Persona } from '../auth/mockUsers';
import { SIGNUP_TEST_PROFILES } from '../auth/signupTestProfiles';
import type { SignupTestProfile } from '../auth/signupTestProfiles';
import { icon, img } from '../lib/asset';

/* 로그인 화면 (Figma node 1864:5830) */
interface LoginProps {
  /** profile 이 있으면 회원가입 화면을 "테스트 정보 불러오기"를 누른 것과 동일하게 채운 채로 연다 */
  onGoSignup: (profile?: SignupTestProfile) => void;
}

/* 데모 배너 프로필 아래 한 줄 설명 */
const DEMO_ROLE: Record<Persona, string> = {
  beginner: '자취 초보',
  worker: '직장인 자취러',
  pet: '반려동물 자취러',
};

/* 데모 배너 프로필 이미지 — public/assets/img/onboarding/ */
const DEMO_AVATAR: Record<Persona, string> = {
  beginner: 'image 274.png', // 이서준
  worker: 'image 280.png', // 김하린
  pet: 'image 276.png', // 조아영
};

/* 입력창·배너 안 단색 아이콘 (stroke=currentColor) */
const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const;
const stroke = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function MailIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" {...stroke} />
      <path d="m4 7.5 8 6 8-6" {...stroke} />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...svgProps}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" {...stroke} />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...stroke} />
      <circle cx="12" cy="15.3" r="1.1" fill="currentColor" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg {...svgProps}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" {...stroke} />
      <circle cx="12" cy="12" r="3" {...stroke} />
      {off && <path d="M4 4l16 16" {...stroke} />}
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg className="auth-demo__flask" width="32" height="36" viewBox="0 0 32 36" fill="none" aria-hidden="true">
      <path d="M12 3h8M13.5 3v10L5 28.5A3 3 0 0 0 7.6 33h16.8a3 3 0 0 0 2.6-4.5L18.5 13V3" {...stroke} strokeWidth={2} />
      <path d="M9.5 24h13l3.5 6.2a1.5 1.5 0 0 1-1.3 2.3H7.3A1.5 1.5 0 0 1 6 30.2L9.5 24Z" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

export function Login({ onGoSignup }: LoginProps) {
  const { login, loginDemo, demoSignedUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* 데모 패널에서 이서준(가입 전)으로 시작하면 주 버튼이 "회원가입"으로 바뀐다 */
  const location = useLocation();
  const navigate = useNavigate();
  const [signupCta, setSignupCta] = useState(false);

  /* 일회성 신호 — 받자마자 history state 에서 지워, 새로고침하면 기본 "로그인"으로 돌아온다 */
  useEffect(() => {
    const state = location.state as { signupCta?: boolean; prefill?: { email: string; password: string } } | null;
    if (!state?.signupCta && !state?.prefill) return;
    if (state.signupCta) setSignupCta(true);
    if (state.prefill) {
      setSignupCta(false);
      setEmail(state.prefill.email);
      setPassword(state.prefill.password);
      setError('');
    }
    navigate(location.pathname, { replace: true, state: { ...state, signupCta: undefined, prefill: undefined } });
  }, [location.state, location.pathname, navigate]);

  const canSubmit = signupCta || (email.trim() !== '' && password !== '');

  const attemptLogin = () => {
    if (!canSubmit) return;
    if (signupCta) {
      onGoSignup(SIGNUP_TEST_PROFILES.seojunDemo);
      return;
    }
    const ok = login(email, password);
    if (!ok) setError('이메일 또는 비밀번호를 확인해주세요.');
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    attemptLogin();
  };

  /* 가입 전인 데모 계정(이서준)은 자동 입력 대신 회원가입으로 보낸다 */
  const pendingSignupEmail = demoSignedUp ? null : DEMO_SIGNUP_EMAIL;

  /* 데모 배너의 프로필을 누르면 바로 로그인시키지 않고 폼만 채운다 — 이서준은 가입 여부와 상관없이
   * 항상 신규 가입 흐름을 보여주므로, 폼을 채우지 않고 주 버튼이 "회원가입"이 된다 */
  const pickDemoAccount = (account: MockAccount) => {
    setError('');
    if (account.email === DEMO_SIGNUP_EMAIL) {
      setSignupCta(true);
      setEmail('');
      setPassword('');
      return;
    }
    setSignupCta(false);
    setEmail(account.email);
    setPassword(account.password);
  };

  const handleSelectAccount = (account: MockAccount) => {
    setSheetOpen(false);
    const selection = resolveAccountSelection(account, demoSignedUp);
    if (selection.target === 'signup') {
      onGoSignup(SIGNUP_TEST_PROFILES.seojunDemo);
      return;
    }
    const ok = loginDemo(selection.personaId);
    if (!ok) setError('데모 계정으로 로그인할 수 없어요.');
  };

  return (
    <div className="app auth">
      <Header showActions={false} />
      <div className="auth__body auth__body--login">
        <section className="auth-hero">
          <span className="auth-hero__greeting" aria-hidden="true">
            좋은 하루
            <br />
            보내요!
          </span>
          <div className="auth-hero__text">
            <h1 className="auth-hero__title">다시 만나 반가워요</h1>
            <p className="auth-hero__desc">
              오늘도 자두야와 함께
              <br />
              더 편한 자취 생활을 시작해요!
            </p>
          </div>
          <img className="auth-hero__mascot" src={img('auth-onboarding.svg')} alt="" />
        </section>

        <section className="auth-demo" aria-label="데모 계정">
          <div className="auth-demo__intro">
            <FlaskIcon />
            <div className="auth-demo__copy">
              <p className="auth-demo__title">데모 계정으로 간편하게 체험해보세요!</p>
              <p className="auth-demo__desc">3명의 자취 라이프로 미리 만나보세요.</p>
            </div>
          </div>
          <ul className="auth-demo__people">
            {TEST_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button type="button" className="auth-demo__person" onClick={() => pickDemoAccount(account)}>
                  <img
                    className="auth-demo__avatar"
                    src={img(`onboarding/${DEMO_AVATAR[account.persona]}`)}
                    alt=""
                  />
                  <span className="auth-demo__name">{account.name}</span>
                  <span className="auth-demo__role">{DEMO_ROLE[account.persona]}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="auth-demo__more" aria-label="데모 계정 전체 보기" onClick={() => setSheetOpen(true)}>
            <img src={icon('chevron-right-primary.svg')} alt="" />
          </button>
        </section>

        <form className="auth-form" onSubmit={handleFormSubmit}>
          <div className="auth-form__fields">
            <AuthField
              id="login-email"
              label="이메일"
              leadingIcon={<MailIcon />}
              type="email"
              autoComplete="email"
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
              leadingIcon={<LockIcon />}
              trailing={
                <button
                  type="button"
                  className="auth-field__toggle"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <EyeIcon off={!showPassword} />
                </button>
              }
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
              {signupCta ? '회원가입' : '로그인'}
            </button>

            <div className="auth-divider">
              <span className="auth-divider__line" />
              <span className="auth-divider__text">또는 소셜 로그인</span>
              <span className="auth-divider__line" />
            </div>

            <div className="auth-social">
              <button type="button" className="auth-social__btn auth-social__btn--kakao">
                <img className="auth-social__icon" src={icon('auth-kakao.svg')} alt="" />
                카카오 계정으로 계속하기
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
