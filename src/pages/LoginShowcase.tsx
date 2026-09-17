import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IPhoneFrame } from '../components/IPhoneFrame';
import { IntroSplash } from '../components/IntroSplash';
import { usePrefersReducedMotion } from '../components/homecare/usePrefersReducedMotion';
import App from '../App';
import { Login } from './Login';
import { Signup } from './Signup';
import { useAuth } from '../auth/AuthContext';
import { getDemoAccountId, TEST_ACCOUNTS } from '../auth/mockUsers';
import type { MockAccount, Persona } from '../auth/mockUsers';
import { DEMO_SIGNUP_EMAIL } from '../auth/demoSignup';
import { SIGNUP_TEST_PROFILES } from '../auth/signupTestProfiles';
import type { SignupTestProfile } from '../auth/signupTestProfiles';
import { icon, img } from '../lib/asset';

const EASE = [0.22, 1, 0.36, 1] as const;

/** IPhoneFrame 쇼케이스는 데스크톱/태블릿(768px 이상) 전용이다.
 * 실제 모바일 기기 폭에서는 프레임이 아예 사라지고 앱을 그대로 전체화면으로 보여준다. */
const DESKTOP_BREAKPOINT = 768;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

/* 페르소나별 탭 라벨/아이콘 — mockUsers.ts 의 persona 필드를 그대로 키로 쓴다 */
const PERSONA_LABEL: Record<Persona, string> = {
  beginner: '자취 초보',
  worker: '직장인',
  pet: '반려생활',
};
const PERSONA_ICON: Record<Persona, string> = {
  beginner: 'persona-home.svg',
  worker: 'persona-briefcase.svg',
  pet: 'persona-paw.svg',
};

/* 프로필 미리보기 서술 문구 — mockUsers.ts 의 짧은 description 과는 별개로 쇼케이스 전용.
 * 이메일을 키로 써서 TEST_ACCOUNTS 순서가 바뀌어도 안전하다. \n 은 2줄로 자연스럽게
 * 보이도록 명시적으로 끊은 지점 — .login-showcase__profile-desc 의 white-space:pre-line
 * 이 그대로 줄바꿈으로 렌더한다. */
const ACCOUNT_BLURBS: Record<string, string> = {
  'seojun@jaduya.com': '처음 자취를 시작한 이서준의\n리얼한 자취 생활을 경험해보세요.',
  'harin@jaduya.com': '바쁜 직장인 김하린의\n깔끔하고 효율적인 자취 생활을 경험해보세요.',
  'ayoung@jaduya.com': '반려동물과 함께 사는 조아영의\n똑똑한 자취 생활을 경험해보세요.',
};

/* 사이트 기본 화면(main.tsx 진입점). 실 로그인 화면(Login.tsx)을 실물형 iPhone 목업
 * (IPhoneFrame) 안에 그대로 넣어 항상 실제 화면과 같은 모습을 유지하는 쇼케이스 컷이다.
 * 데스크톱/태블릿(768px 이상)에서만 IPhoneFrame + Demo Account 패널을 보여주고,
 * 실제 모바일 기기 폭에서는 프레임 없이 App 을 그대로 전체화면으로 보여준다
 * — IA 상의 진짜 진입 화면은 그대로 Login/App 이다.
 *
 * 로그인 전에는 여기서 직접 Demo Account 연동된 Login/Signup 을 보여주고, 로그인에
 * 성공하면(useAuth().user 가 채워지면) App.tsx 가 원래 하던 대로 온보딩/Home 으로 넘겨받는다
 * — App.tsx 는 자기 안에서도 Login/Signup 을 그리지만 user 가 있을 때만 그 분기를 쓴다.
 *
 * Demo Account 패널은 탭 3개가 곧 선택지다 — 캐러셀/페이지네이션 없이 탭을 누르면 바로
 * 그 사람의 프로필 미리보기로 바뀐다(selectedIndex 하나만 공유). "이서준(자취 초보)"은
 * 이 패널 안에서는 항상 "회원가입하기"로 표시하고 항상 회원가입 화면으로 보낸다 —
 * 실제 로그인 화면의 "테스트 계정 선택"(resolveAccountSelection, demoSignedUp 여부로
 * 갈림)과 달리, 이 쇼케이스 패널은 그 계정이 이미 데모 가입을 마쳤는지와 무관하게 항상
 * "신규 사용자가 가입하는 흐름"을 보여주는 게 목적이라 일부러 그 상태를 안 본다.
 * CTA 를 눌러야 실제로 로그인 폼/회원가입 폼에 반영된다(자동 제출은 하지 않는다). */
export function LoginShowcase() {
  const isDesktop = useIsDesktop();
  const reduceMotion = usePrefersReducedMotion();
  const { user, loginDemo, logout, demoSignedUp } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [signupPrefillProfile, setSignupPrefillProfile] = useState<SignupTestProfile | undefined>(undefined);

  const activeAccount = TEST_ACCOUNTS[selectedIndex] ?? TEST_ACCOUNTS[0];
  /* 이서준은 데모 가입을 마치기 전까지 로그인 대상이 아니라 항상 회원가입 플로우로 보낸다 */
  const isPendingSignupAccount = activeAccount.email === DEMO_SIGNUP_EMAIL && !demoSignedUp;
  const isCurrentAccount = user?.email === activeAccount.email;

  /* App 을 다시 마운트해 폰 목업을 Home 부터 보여준다 —
   * 계정별 진행 상태는 localStorage 에 있어 remount 로 사라지지 않는다.
   * (App.tsx 는 이미 user.email 로 AppNavigationProvider 를 remount 한다) */
  const [appKey, setAppKey] = useState(0);
  const showHome = () => setAppKey((key) => key + 1);

  /* 가입 전 이서준 — 로그인시키지 않고 회원가입 화면으로 보낸다 */
  const goSignupAsSeojun = () => {
    if (user) logout();
    setSignupPrefillProfile(SIGNUP_TEST_PROFILES.seojunDemo);
    setAuthView('signup');
  };

  /* 메인 CTA — 최초 시작 / 다른 계정으로 변경 / 현재 계정 계속 보기 모두
   * "이 계정을 currentUser 로 두고 Home 을 본다" 라는 같은 동작이다.
   * 변경·계속 보기는 그 계정의 진행 상태를 그대로 둔다(지우지 않는다). */
  const handleUseAccount = (account: MockAccount) => {
    if (isPendingSignupAccount) {
      goSignupAsSeojun();
      return;
    }
    const personaId = getDemoAccountId(account.email);
    if (user?.email !== account.email && personaId) loginDemo(personaId);
    showHome();
  };

  /* 보조 CTA — 데모 계정에서 빠져나와 원래 로그인 화면을 보여준다.
   * 계정의 진행 상태나 가입 여부는 건드리지 않는다 — 지워 버리면 그 로그인 화면에서
   * 같은 계정으로 다시 들어갈 수 없다. */
  const handleStartOver = () => {
    if (user) logout();
    setSignupPrefillProfile(undefined);
    setAuthView('login');
  };

  /* 실제 모바일 기기 폭 — 프레임/Demo Account 없이 앱을 그대로 전체화면으로 보여준다.
   * (App 이 자기 안에서 로그인 전/후, 온보딩까지 전부 알아서 분기한다) */
  if (!isDesktop) {
    return (
      <>
        <IntroSplash />
        <App />
      </>
    );
  }

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
        <div className="login-showcase__intro">
          <p className="login-showcase__eyebrow">혼자여도, 잘 사는 일상</p>
          <h1 className="login-showcase__headline">
            자취하는 모든 순간,
            <br />
            <span className="login-showcase__headline-accent">자두야</span>와.
          </h1>
          <p className="login-showcase__lead">
            자취 생활에 필요한 정보부터
            <br />
            나에게 맞는 생활 팁까지, 더 쉽고 가볍게.
          </p>

          <div className="login-showcase__qr-cta">
            <img
              className="login-showcase__qr-image"
              src={img('jaduya_deploy_qr.png')}
              alt="자두야 체험 QR 코드"
            />
            <div className="login-showcase__qr-text">
              <p className="login-showcase__qr-title">지금 바로 자두야를 체험해보세요</p>
              <p className="login-showcase__qr-desc">QR을 스캔하면 바로 시작할 수 있어요.</p>
              <p className="login-showcase__qr-url">jaduya.vercel.app</p>
            </div>
          </div>
        </div>

        <IPhoneFrame>
          {/* 인트로는 목업 화면 안에서 재생된다 (.iphone-frame__screen 기준) */}
          <IntroSplash />
          {user ? (
            /* key 를 올리면 App 이 다시 마운트되어 Home 부터 보인다(진행 상태는 localStorage
             * 유지) — remount 자체는 순간적이라, 오른쪽 프로필 카드 전환과 같은 톤(fade +
             * 살짝 scale, 같은 EASE·시간)으로 감싸서 계정을 바꿀 때 화면이 "팝" 하고 튀지
             * 않고 자연스럽게 넘어가 보이게 한다. */
            <AnimatePresence initial={false}>
              <motion.div
                key={appKey}
                className="login-showcase__app-transition"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE }}
              >
                <App />
              </motion.div>
            </AnimatePresence>
          ) : authView === 'login' ? (
            <Login
              onGoSignup={(profile) => {
                setSignupPrefillProfile(profile);
                setAuthView('signup');
              }}
            />
          ) : (
            <Signup
              key={signupPrefillProfile?.email ?? 'default'}
              onGoLogin={() => setAuthView('login')}
              initialProfile={signupPrefillProfile}
            />
          )}
        </IPhoneFrame>

        {/* 로그인 여부와 무관하게 항상 보여준다 — 로그인 후에도 탭으로 다른 계정
         * 미리보기를 계속 고를 수 있고, CTA 를 누르면 로그아웃 후 그 계정으로
         * 전환하는 Login/Signup 화면으로 돌아간다(handleConfirmAccount 참고). */}
        <div className="login-showcase__panel">
          <h2 className="login-showcase__panel-title">
            어떤 자취생활을
            <br />
            시작해볼까요?
          </h2>
          <p className="login-showcase__panel-desc">
            원하는 라이프스타일을 선택하고
            <br />
            자두야의 실제 화면을 미리 경험해보세요.
          </p>

          <div className="login-showcase__tabs" role="tablist">
            {TEST_ACCOUNTS.map((account, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={account.email}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`login-showcase__tab${active ? ' login-showcase__tab--active' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  {active && (
                    <motion.span
                      className="login-showcase__tab-highlight"
                      layoutId="login-showcase-tab-highlight"
                      aria-hidden="true"
                      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="login-showcase__tab-content">
                    <span
                      className="login-showcase__tab-icon"
                      style={{ maskImage: `url(${icon(PERSONA_ICON[account.persona])})`, WebkitMaskImage: `url(${icon(PERSONA_ICON[account.persona])})` }}
                      aria-hidden="true"
                    />
                    {PERSONA_LABEL[account.persona]}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeAccount.email}
              className="login-showcase__profile"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
            >
              <img
                className="login-showcase__profile-avatar"
                src={img(`profile_${activeAccount.email.split('@')[0]}.png`)}
                alt=""
              />
              <h3 className="login-showcase__profile-name">{activeAccount.name}</h3>
              <p className="login-showcase__profile-tag">{PERSONA_LABEL[activeAccount.persona]}</p>
              <p className="login-showcase__profile-desc">{ACCOUNT_BLURBS[activeAccount.email]}</p>
            </motion.div>
          </AnimatePresence>

          {/* CTA 는 currentUser 기준으로 갈린다 —
            * 없음: 시작하기 / 다른 계정: 변경하기 / 현재 계정: 계속 보기 */}
          <button
            type="button"
            className="login-showcase__cta"
            onClick={() => handleUseAccount(activeAccount)}
          >
            {isPendingSignupAccount
              ? '회원가입하기'
              : !user
                ? '이 계정으로 시작하기'
                : isCurrentAccount
                  ? '이 계정으로 계속 보기'
                  : '이 계정으로 변경하기'}
          </button>

          {/* 이미 데모를 시작한 뒤에만 의미가 있다 — 최초 진입에는 띄우지 않는다 */}
          {user && (
            <button
              type="button"
              className="login-showcase__new-link"
              onClick={handleStartOver}
            >
              처음부터 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
