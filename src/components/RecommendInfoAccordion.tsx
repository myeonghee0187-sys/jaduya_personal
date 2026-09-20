import { useState } from 'react';
import { icon } from '../lib/asset';

/* 맞춤 추천 설정 하단의 안내 아코디언 — 홈 시트와 마이페이지에서 공유한다. */
export function RecommendInfoAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`profile-settings__note${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="profile-settings__note-toggle"
        aria-expanded={open}
        aria-controls="recommend-info-body"
        onClick={() => setOpen((prev) => !prev)}
      >
        <img src={icon('info-warn.svg')} alt="" />
        <span>맞춤 추천은 어떻게 적용되나요?</span>
        <img
          className={`profile-settings__note-chevron${open ? ' is-open' : ''}`}
          src={icon('chevron-down.svg')}
          alt=""
        />
      </button>
      <div id="recommend-info-body" className="profile-settings__note-body" aria-hidden={!open}>
        <div className="profile-settings__note-body-inner">
          <p>선택한 관심 주제를 중심으로 콘텐츠를 더 자주 추천해드려요.</p>
          <p>다른 주제의 콘텐츠도 함께 볼 수 있어요.</p>
        </div>
      </div>
    </div>
  );
}

export default RecommendInfoAccordion;
