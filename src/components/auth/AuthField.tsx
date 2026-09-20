import type { InputHTMLAttributes, ReactNode } from 'react';

/* 로그인/회원가입 공용 입력 필드 (Figma node 1864:5830 / 1864:5881 공용 스타일) */
interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** label 우측에 배치하는 보조 요소 (예: 테스트 계정 선택 버튼) */
  labelExtra?: ReactNode;
  error?: string;
  /** 입력창 왼쪽 안쪽 아이콘 (예: 메일, 자물쇠) */
  leadingIcon?: ReactNode;
  /** 입력창 오른쪽 안쪽 요소 (예: 비밀번호 보기 토글) */
  trailing?: ReactNode;
}

export function AuthField({ label, labelExtra, error, leadingIcon, trailing, id, ...inputProps }: AuthFieldProps) {
  const inputClass = `auth-field__input${leadingIcon ? ' auth-field__input--leading' : ''}${
    trailing ? ' auth-field__input--trailing' : ''
  }`;
  return (
    <div className={`auth-field${error ? ' auth-field--error' : ''}`}>
      <div className="auth-field__label-row">
        <label className="auth-field__label" htmlFor={id}>
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="auth-field__control">
        {leadingIcon && <span className="auth-field__leading">{leadingIcon}</span>}
        <input id={id} className={inputClass} {...inputProps} />
        {trailing && <span className="auth-field__trailing">{trailing}</span>}
      </div>
      {error && <p className="auth-field__error">{error}</p>}
    </div>
  );
}
