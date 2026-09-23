import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { AuthField } from '../components/auth/AuthField';
import { useAuth } from '../auth/AuthContext';
import { DEMO_SIGNUP_EMAIL } from '../auth/demoSignup';
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

/* 데모 계정 선택 확인 배너의 설명 문구 — 페르소나별로 다르게 보여준다.
 * beginner(이서준)는 TEST_ACCOUNTS 안에서 유일하게 항상 signupCta 로 가는 계정이라
 * "회원가입 후" 문구를 쓴다. */
const DEMO_CONFIRM_DESC: Record<Persona, string> = {
  beginner: '회원가입 후 바로 체험해보세요.',
  worker: '직장인 자취생활을 미리 살펴보세요.',
  pet: '반려동물과 함께하는 자취생활을 만나보세요.',
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

export function Login({ onGoSignup }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /* 데모 계정 선택 안내 배너 — X 로 닫으면 이번 선택에 한해 다시 띄우지 않는다
   * (다른 계정을 새로 고르면 다시 보여준다: pickDemoAccount 에서 false 로 되돌림).
   * bannerClosing 은 닫힘 애니메이션이 끝나기 전까지 DOM 에 남겨 두기 위한 과도 상태다. */
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [bannerClosing, setBannerClosing] = useState(false);
  const bannerCloseTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  /* 데모 계정 선택 → 필요할 때만 로그인 버튼까지 스크롤. 버튼의 샤인 스윕 자체는 타이머가
   * 아니라 "데모 계정이 선택돼 있는 동안" 이라는 상태에 그대로 묶여 있어(아래 pickedAccount
   * 참고) 계속 반복되다가, 폼을 직접 고치거나 다른 계정으로 바꾸면 자연스럽게 꺼진다. */
  const loginButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* 데모 계정 선택 시 입력창(이메일/비밀번호)이 실제로 채워졌다는 걸 짧게 하이라이트로 알려준다. */
  const [fieldFlash, setFieldFlash] = useState(false);
  const fieldFlashTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(
    () => () => {
      clearTimeout(bannerCloseTimeoutRef.current);
      clearTimeout(fieldFlashTimeoutRef.current);
    },
    [],
  );

  const closeDemoBanner = () => {
    setBannerClosing(true);
    clearTimeout(bannerCloseTimeoutRef.current);
    bannerCloseTimeoutRef.current = setTimeout(() => {
      setDemoBannerDismissed(true);
      setBannerClosing(false);
    }, 200); // auth-demo-confirm-out 애니메이션 길이와 맞춘다
  };

  /* 데모 패널에서 이서준(가입 전)으로 시작하면 주 버튼이 "회원가입"으로 바뀐다 */
  const location = useLocation();
  const navigate = useNavigate();
  const [signupCta, setSignupCta] = useState(false);

  /* 데모 계정 선택 시 입력창 하이라이트를 짧게 재생한다 — pickDemoAccount(모바일에서 직접
   * 프로필을 고를 때) 와, 아래 history state 효과(데스크톱 쇼케이스 CTA 로 넘어올 때) 둘 다
   * 같은 신호를 써야 해서 함수로 뺐다. */
  const flashFields = () => {
    clearTimeout(fieldFlashTimeoutRef.current);
    setFieldFlash(false);
    requestAnimationFrame(() => setFieldFlash(true));
    fieldFlashTimeoutRef.current = setTimeout(() => setFieldFlash(false), 700);
  };

  /* 일회성 신호 — 받자마자 history state 에서 지워, 새로고침하면 기본 "로그인"으로 돌아온다 */
  useEffect(() => {
    const state = location.state as { signupCta?: boolean; prefill?: { email: string; password: string } } | null;
    if (!state?.signupCta && !state?.prefill) return;
    if (state.signupCta) {
      setSignupCta(true);
      flashFields();
    }
    if (state.prefill) {
      setSignupCta(false);
      setEmail(state.prefill.email);
      setPassword(state.prefill.password);
      setError('');
      flashFields();
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

  /* 데모 배너의 프로필을 누르면 바로 로그인시키지 않고 폼만 채운다 — 이서준은 가입 여부와 상관없이
   * 항상 신규 가입 흐름을 보여주므로, 폼을 채우지 않고 주 버튼이 "회원가입"이 된다 */
  /* 지금 폼에 채워진 데모 계정 — 이서준은 폼을 비우고 "회원가입" 주 버튼이 되므로
   * signupCta 로 판단한다. 따로 상태를 두지 않아 폼을 직접 고치면 선택 표시도 사라진다. */
  const pickedEmail = signupCta
    ? DEMO_SIGNUP_EMAIL
    : (TEST_ACCOUNTS.find((account) => account.email === email && account.password === password)?.email ?? null);

  /* 이서준(가입 전)도 pickedEmail 로 동일하게 찾는다 — 로그인 폼은 안 채워지지만
   * "데모 계정을 선택했다"는 사실 자체는 이서준도 똑같이 안내 배너/버튼 인터랙션 대상이다. */
  const pickedAccount = TEST_ACCOUNTS.find((account) => account.email === pickedEmail);

  const pickDemoAccount = (account: MockAccount) => {
    setError('');
    const isSignupDemo = account.email === DEMO_SIGNUP_EMAIL;
    setSignupCta(isSignupDemo);
    setEmail(isSignupDemo ? '' : account.email);
    setPassword(isSignupDemo ? '' : account.password);

    setDemoBannerDismissed(false);
    setBannerClosing(false);
    clearTimeout(bannerCloseTimeoutRef.current);

    /* 이서준은 폼을 채우는 대신 비우지만(회원가입 유도), "데모 계정을 골랐다"는 신호 자체는
     * 다른 계정과 똑같이 입력창 하이라이트로 보여준다. */
    flashFields();

    /* 배너가 끼어들며 레이아웃이 한 번 밀리는 걸 한 프레임 기다린 뒤, 주 버튼("로그인"/
     * "회원가입" — 이서준이어도 같은 DOM 버튼이라 ref 도 그대로 재사용된다)이 이미 화면에
     * 안 보일 때만 부드럽게 스크롤한다. 버튼의 샤인 스윕은 pickedAccount 가 있는 동안 계속
     * 반복되니(아래 className), 스크롤이 끝나는 시점을 따로 잴 필요가 없다. */
    requestAnimationFrame(() => {
      const button = loginButtonRef.current;
      const container = scrollContainerRef.current;
      if (!button || !container) return;

      const buttonRect = button.getBoundingClientRect();
      const viewRect = container.getBoundingClientRect();
      const alreadyVisible = buttonRect.top >= viewRect.top && buttonRect.bottom <= viewRect.bottom;

      if (!alreadyVisible) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  return (
    <div className="app auth">
      <Header showActions={false} />
      <div className="auth__body auth__body--login" ref={scrollContainerRef}>
        <section className="auth-hero">
          <div className="auth-hero__mascot-wrap">
            <img className="auth-hero__mascot" src={img('auth-onboarding.svg')} alt="" />
            <span className="auth-hero__greeting" aria-hidden="true">
              좋은 하루
              <br />
              보내요!
            </span>
          </div>
          <div className="auth-hero__text">
            <h1 className="auth-hero__title">다시 만나 반가워요</h1>
            <p className="auth-hero__desc">
              오늘도 자두야와 함께
              <br />
              더 편한 자취 생활을 시작해요!
            </p>
          </div>
        </section>

        <section className="auth-demo" aria-label="데모 계정">
          <div className="auth-demo__intro">
            <div className="auth-demo__copy">
              <p className="auth-demo__title">데모 계정으로 간편하게 체험해보세요!</p>
              <p className="auth-demo__desc">3명의 자취 라이프로 미리 만나보세요.</p>
            </div>
          </div>
          <ul className={`auth-demo__people${pickedEmail ? ' has-selection' : ''}`}>
            {TEST_ACCOUNTS.map((account) => {
              const picked = account.email === pickedEmail;
              return (
                <li key={account.email}>
                  <button
                    type="button"
                    className={`auth-demo__person${picked ? ' is-selected' : ''}`}
                    aria-pressed={picked}
                    onClick={() => pickDemoAccount(account)}
                  >
                    <span className="auth-demo__avatar-wrap">
                      <img
                        className="auth-demo__avatar"
                        src={img(`onboarding/${DEMO_AVATAR[account.persona]}`)}
                        alt=""
                      />
                      {picked && (
                        <span className="auth-demo__check" aria-hidden="true">
                          <img src={icon('auth-check.svg')} width={10} height={10} alt="" />
                        </span>
                      )}
                    </span>
                    <span className="auth-demo__name">{account.name}</span>
                    <span className="auth-demo__role">{DEMO_ROLE[account.persona]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {pickedAccount && !demoBannerDismissed && (
          <div className={`auth-demo-confirm${bannerClosing ? ' is-closing' : ''}`} role="status">
            <img
              className="auth-demo-confirm__icon"
              src={img('jaduya_custom_recommendation_36/money_management/image 1.png')}
              alt=""
            />
            <div className="auth-demo-confirm__text">
              <p className="auth-demo-confirm__title">{pickedAccount.name} 데모 계정을 선택했어요!</p>
              <p className="auth-demo-confirm__desc">{DEMO_CONFIRM_DESC[pickedAccount.persona]}</p>
            </div>
            <button
              type="button"
              className="auth-demo-confirm__close"
              aria-label="데모 계정 선택 안내 닫기"
              onClick={closeDemoBanner}
            >
              <img src={icon('close-sm.svg')} width={14} height={14} alt="" />
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleFormSubmit}>
          <div className={`auth-form__fields${fieldFlash ? ' auth-form__fields--flash' : ''}`}>
            <AuthField
              id="login-email"
              label="이메일"
              leadingIcon={<MailIcon />}
              trailing={
                pickedAccount && !signupCta ? <span className="auth-field__demo-badge">데모 계정</span> : undefined
              }
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
            <button
              ref={loginButtonRef}
              type="button"
              className={`auth-button${pickedAccount ? ' auth-button--sparkle' : ''}`}
              disabled={!canSubmit}
              onClick={attemptLogin}
            >
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

    </div>
  );
}
