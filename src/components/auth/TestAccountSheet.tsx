import { BottomSheet } from '../BottomSheet';
import { TEST_ACCOUNTS } from '../../auth/mockUsers';
import { DEMO_SIGNUP_LABEL } from '../../auth/demoSignup';
import type { MockAccount } from '../../auth/mockUsers';

/* 테스트 계정 선택 Bottom Sheet (Figma "더미데이터 계정 선택" 상태) */
interface TestAccountSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (account: MockAccount) => void;
  /** 시트 하단 secondary 액션 — 회원가입 화면으로 이동 */
  onCreateAccount: () => void;
  /** 아직 가입하지 않아 이메일 대신 상태 문구를 보여줄 계정 이메일 */
  pendingSignupEmail?: string | null;
}

export function TestAccountSheet({
  open,
  onClose,
  onSelect,
  onCreateAccount,
  pendingSignupEmail = null,
}: TestAccountSheetProps) {
  return (
    <BottomSheet open={open} className="test-account" labelledBy="test-account-title" onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>
      <h2 id="test-account-title" className="test-account__title">
        테스트 계정 선택
      </h2>
      <ul className="test-account__list">
        {TEST_ACCOUNTS.map((account) => {
          const pending = account.email === pendingSignupEmail;
          return (
          <li key={account.email}>
            <button type="button" className="test-account__item" onClick={() => onSelect(account)}>
              <span className="test-account__name-row">
                <span className="test-account__name">{account.name}</span>
                <span className="test-account__desc">{account.description}</span>
              </span>
              {pending ? (
                <span className="test-account__status">{DEMO_SIGNUP_LABEL}</span>
              ) : (
                <span className="test-account__email">{account.email}</span>
              )}
            </button>
          </li>
          );
        })}
      </ul>
      <button type="button" className="test-account__new" onClick={onCreateAccount}>
        새 계정으로 시작하기
      </button>
    </BottomSheet>
  );
}
