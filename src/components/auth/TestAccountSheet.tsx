import { BottomSheet } from '../BottomSheet';
import { TEST_ACCOUNTS } from '../../auth/mockUsers';
import type { MockAccount } from '../../auth/mockUsers';

/* 테스트 계정 선택 Bottom Sheet (Figma "더미데이터 계정 선택" 상태) */
interface TestAccountSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (account: MockAccount) => void;
}

export function TestAccountSheet({ open, onClose, onSelect }: TestAccountSheetProps) {
  return (
    <BottomSheet open={open} className="test-account" labelledBy="test-account-title" onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>
      <h2 id="test-account-title" className="test-account__title">
        테스트 계정 선택
      </h2>
      <ul className="test-account__list">
        {TEST_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button type="button" className="test-account__item" onClick={() => onSelect(account)}>
              <span className="test-account__name-row">
                <span className="test-account__name">{account.name}</span>
                <span className="test-account__desc">{account.description}</span>
              </span>
              <span className="test-account__email">{account.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
