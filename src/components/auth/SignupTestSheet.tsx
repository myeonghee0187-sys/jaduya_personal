import { BottomSheet } from '../BottomSheet';
import { SIGNUP_TEST_PROFILE_LIST } from '../../auth/signupTestProfiles';
import type { SignupTestProfile } from '../../auth/signupTestProfiles';

/* 회원가입 폼 자동입력 Bottom Sheet.
 * 로그인 화면의 TestAccountSheet 와 같은 셸/스타일(.bsheet, .test-account)을 재사용한다. */
interface SignupTestSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (profile: SignupTestProfile) => void;
}

export function SignupTestSheet({ open, onClose, onSelect }: SignupTestSheetProps) {
  return (
    <BottomSheet open={open} className="test-account" labelledBy="signup-test-title" onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>
      <h2 id="signup-test-title" className="test-account__title">
        테스트 정보 불러오기
      </h2>
      <ul className="test-account__list">
        {SIGNUP_TEST_PROFILE_LIST.map((profile) => (
          <li key={profile.id}>
            <button type="button" className="test-account__item" onClick={() => onSelect(profile)}>
              <span className="test-account__name-row">
                <span className="test-account__name">{profile.label}</span>
                <span className="test-account__desc">{profile.description}</span>
              </span>
              <span className="test-account__email">{profile.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
