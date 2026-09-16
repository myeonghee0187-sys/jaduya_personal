import { useState } from 'react';
import { icon } from '../lib/asset';

/* 맞춤 추천 설정 하단의 안내 문구 — 홈 시트(HomeRecommendSettings.tsx)와 마이페이지
 * 자취 프로필(pages/ProfileSettingsPage.tsx) 두 곳에 똑같은 문구가 복붙되어 있던 걸
 * 하나로 합쳤다. 기본은 "ⓘ 맞춤 추천 안내" 한 줄로 접혀 있고, 눌러야 기존 안내
 * 문구가 펼쳐진다 — 위치(관심 주제 아래 / 저장 버튼 바로 위)는 두 화면 모두 그대로다. */
export function RecommendInfoAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="profile-settings__note">
      <button
        type="button"
        className="profile-settings__note-toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <img src={icon('info-warn.svg')} alt="" />
        <span>맞춤 추천 안내</span>
        <img
          className={`profile-settings__note-chevron${open ? ' is-open' : ''}`}
          src={icon('chevron-down.svg')}
          alt=""
        />
      </button>
      {open && (
        <div className="profile-settings__note-body">
          <strong>선택한 분야는 더 자주 추천되며, 다른 콘텐츠도 계속 볼 수 있어요.</strong>
          <p>설정은 마이페이지에서 언제든지 수정할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}

export default RecommendInfoAccordion;
