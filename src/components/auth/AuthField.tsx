import type { InputHTMLAttributes, ReactNode } from 'react';

/* 로그인/회원가입 공용 입력 필드 (Figma node 1864:5830 / 1864:5881 공용 스타일) */
interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** label 우측에 배치하는 보조 요소 (예: 테스트 계정 선택 버튼) */
  labelExtra?: ReactNode;
  error?: string;
}

export function AuthField({ label, labelExtra, error, id, ...inputProps }: AuthFieldProps) {
  return (
    <div className={`auth-field${error ? ' auth-field--error' : ''}`}>
      <div className="auth-field__label-row">
        <label className="auth-field__label" htmlFor={id}>
          {label}
        </label>
        {labelExtra}
      </div>
      <input id={id} className="auth-field__input" {...inputProps} />
      {error && <p className="auth-field__error">{error}</p>}
    </div>
  );
}
