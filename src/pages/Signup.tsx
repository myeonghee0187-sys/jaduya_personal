import { useState } from 'react';
import type { FormEvent } from 'react';
import { Header } from '../components/Header';
import { AuthField } from '../components/auth/AuthField';
import { useAuth } from '../auth/AuthContext';
import { MOCK_USERS } from '../auth/mockUsers';
import { icon } from '../lib/asset';

/* 회원가입 화면 (Figma node 1864:5881 / 상태 예시 1908:7169) */
interface SignupProps {
  onGoLogin: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Agreements {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
}

export function Signup({ onGoLogin }: SignupProps) {
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [agreements, setAgreements] = useState<Agreements>({ terms: false, privacy: false, marketing: false });

  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 4;
  const confirmValid = passwordConfirm === password && passwordConfirm !== '';
  const nicknameValid = nickname.trim().length >= 1;
  const requiredAgreed = agreements.terms && agreements.privacy;
  const allAgreed = agreements.terms && agreements.privacy && agreements.marketing;

  const canSubmit = emailValid && passwordValid && confirmValid && nicknameValid && requiredAgreed;

  const showEmailError = (emailTouched || submitAttempted) && email !== '' && !emailValid;
  const showConfirmError = (confirmTouched || submitAttempted) && passwordConfirm !== '' && !confirmValid;
  const showDuplicateError = duplicateEmail;

  const emailError = showDuplicateError
    ? '이미 사용 중인 이메일이에요.'
    : showEmailError
      ? '올바른 이메일 형식을 입력해주세요.'
      : undefined;
  const confirmError = showConfirmError ? '비밀번호가 일치하지 않습니다.' : undefined;

  const toggleAll = (checked: boolean) => {
    setAgreements({ terms: checked, privacy: checked, marketing: checked });
  };

  const toggleOne = (key: keyof Agreements, checked: boolean) => {
    setAgreements((prev) => {
      const next = { ...prev, [key]: checked };
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setDuplicateEmail(false);
    if (!canSubmit) return;

    const key = email.trim().toLowerCase();
    if (MOCK_USERS[key]) {
      setDuplicateEmail(true);
      return;
    }

    signup({ email: key, password, nickname: nickname.trim() });
  };

  return (
    <div className="app auth">
      <Header onMenuClick={() => {}} />
      <div className="auth__body auth__body--signup">
        <div className="auth-intro">
          <h1 className="auth-intro__title">자두와 함께 시작해요</h1>
          <p className="auth-intro__desc">사용하실 계정 정보를 입력해주세요.</p>
        </div>

        <form className="auth-form auth-form--signup" onSubmit={handleSubmit}>
          <div className="auth-form__fields">
            <AuthField
              id="signup-email"
              label="이메일"
              type="email"
              placeholder="이메일을 입력해주세요"
              value={email}
              error={emailError}
              onChange={(e) => {
                setEmail(e.target.value);
                setDuplicateEmail(false);
              }}
              onBlur={() => setEmailTouched(true)}
            />
            <AuthField
              id="signup-password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <AuthField
              id="signup-password-confirm"
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              value={passwordConfirm}
              error={confirmError}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
            />
            <AuthField
              id="signup-nickname"
              label="닉네임"
              type="text"
              placeholder="자두에서 사용 할 닉네임을 알려주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="auth-agreements">
            <div className="auth-agreement auth-agreement--all">
              <label className="auth-agreement__label">
                <span
                  className={`auth-check${allAgreed ? ' auth-check--on' : ''}`}
                  role="checkbox"
                  aria-checked={allAgreed}
                  tabIndex={0}
                  onClick={() => toggleAll(!allAgreed)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAll(!allAgreed);
                    }
                  }}
                >
                  {allAgreed && <img src={icon('auth-check.svg')} width={14} height={14} alt="" />}
                </span>
                <span className="auth-agreement__text">약관 전체 동의</span>
              </label>
              <img className="auth-agreement__chevron" src={icon('auth-agreement-arrow.svg')} width={18} height={18} alt="" aria-hidden="true" />
            </div>

            <div className="auth-agreements__sub-group">
            <div className="auth-agreement auth-agreement--sub">
              <label className="auth-agreement__label">
                <span
                  className={`auth-check${agreements.terms ? ' auth-check--on' : ''}`}
                  role="checkbox"
                  aria-checked={agreements.terms}
                  tabIndex={0}
                  onClick={() => toggleOne('terms', !agreements.terms)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleOne('terms', !agreements.terms);
                    }
                  }}
                >
                  {agreements.terms && <img src={icon('auth-check.svg')} width={14} height={14} alt="" />}
                </span>
                <span className="auth-agreement__text">[필수] 이용약관 동의</span>
              </label>
            </div>
            <div className="auth-agreement auth-agreement--sub">
              <label className="auth-agreement__label">
                <span
                  className={`auth-check${agreements.privacy ? ' auth-check--on' : ''}`}
                  role="checkbox"
                  aria-checked={agreements.privacy}
                  tabIndex={0}
                  onClick={() => toggleOne('privacy', !agreements.privacy)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleOne('privacy', !agreements.privacy);
                    }
                  }}
                >
                  {agreements.privacy && <img src={icon('auth-check.svg')} width={14} height={14} alt="" />}
                </span>
                <span className="auth-agreement__text">[필수] 개인정보 수집 및 이용 동의</span>
              </label>
            </div>
            <div className="auth-agreement auth-agreement--sub">
              <label className="auth-agreement__label">
                <span
                  className={`auth-check${agreements.marketing ? ' auth-check--on' : ''}`}
                  role="checkbox"
                  aria-checked={agreements.marketing}
                  tabIndex={0}
                  onClick={() => toggleOne('marketing', !agreements.marketing)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleOne('marketing', !agreements.marketing);
                    }
                  }}
                >
                  {agreements.marketing && <img src={icon('auth-check.svg')} width={14} height={14} alt="" />}
                </span>
                <span className="auth-agreement__text">[선택] 마케팅 정보 수신 동의</span>
              </label>
            </div>
            </div>
          </div>

          <div className="auth-bottom auth-bottom--signup">
            <button type="submit" className="auth-button" disabled={!canSubmit}>
              회원가입
            </button>
            <div className="auth-signup-link">
              <span>이미 계정이 있으신가요?</span>
              <button type="button" className="auth-link" onClick={onGoLogin}>
                로그인
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
