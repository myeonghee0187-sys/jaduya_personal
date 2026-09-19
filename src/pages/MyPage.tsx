import { useEffect, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { AccountSwitchSheet } from '../components/auth/AccountSwitchSheet';
import { BottomNavigation } from '../components/BottomNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { DEFAULT_PERSONA } from '../data/personaHome';
import { LevelInfoPopover, levelInfoAnchor } from '../components/LevelInfoPopover';
import {
  LEVEL_STAGE_LIST,
  PERSONA_PROFILE,
  profileSummary,
  resolveLevel,
} from '../data/personaProfile';
import { icon, img } from '../lib/asset';

export type MyPageDestination =
  | 'living-profile'
  | 'level'
  | 'activity'
  | 'settings'
  | 'account'
  | 'support';

interface MyPageProps {
  /** 이동을 처리했으면 true. false/미지정이면 '준비 중' 안내를 그대로 띄운다. */
  onDetailNavigate?: (destination: MyPageDestination) => boolean | void;
}

/* 마이페이지 — 개인 상태(프로필·레벨)와 활동을 한 화면에서 확인한다.
 * Home 과 같이 라우터 없이 AppNavigation 상태로만 열린다.
 * 콘텐츠는 화면에 박아두지 않고 persona 별 data/personaProfile.ts 에서 가져온다. */
export function MyPage({ onDetailNavigate }: MyPageProps) {
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const persona = user?.persona ?? DEFAULT_PERSONA;
  const profile = PERSONA_PROFILE[persona];
  /* Home stat bar 와 같은 원본에서 계산한다 */
  const level = resolveLevel(profile.level);
  /* 계정 전환 진입점 — 예전에는 GNB(하단 탭바) '마이' hover/click 에서 열었지만,
   * 이제는 여기 프로필 영역의 '계정 관리' 버튼에서만 연다. 시트 자체(AccountSwitchSheet)와
   * 데모 로그인/로그아웃 로직은 그대로 재사용하고 진입점만 옮긴다. */
  const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);
  /* 아직 화면이 없는 항목은 토스트로만 알린다 — 없는 route 를 만들지 않는다 */
  const [notice, setNotice] = useState('');
  /* 레벨 안내 팝오버 — 자취 미션 화면과 같은 LevelInfoPopover 를 쓴다 */
  const [levelInfo, setLevelInfo] = useState<{ top: number; left: number } | null>(null);
  const name = user?.name ?? '자두';

  /* 안내는 잠깐만 띄우고 스스로 사라진다 — 닫는 동작을 따로 만들지 않는다 */
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* info 아이콘만 팝오버를 연다 — 카드의 '전체보기' navigation 으로 번지지 않게 막는다 */
  const openLevelInfo = (event: ReactMouseEvent | ReactKeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const anchor = levelInfoAnchor(event.currentTarget as HTMLElement);
    if (anchor) setLevelInfo(anchor);
  };

  const go = (destination: MyPageDestination, label: string) => {
    /* 아직 화면이 없는 항목은 부모가 처리하지 않으므로 안내만 띄운다 */
    if (onDetailNavigate?.(destination)) return;
    setNotice(label + ' 화면은 준비 중이에요.');
  };

  return (
    <div className="mypage app">
      {/* 헤더는 다른 하위 화면과 같은 공용 컴포넌트를 쓴다 — 높이·Y·우측 액션이 한 곳에서 정해진다 */}
      <SubPageHeader
        title="마이페이지"
        backLabel="홈으로"
        onBack={() => navigation?.goBack('home')}
      />

      <main className="mypage__scroll">
        {/* ① 프로필 — 지금 어떤 상태인지 한 줄로 */}
        <section className="mypage__profile" aria-labelledby="profile-title">
          <img className="mypage__avatar" src={user?.profileImage ?? img(profile.profileImage)} alt="" />
          {/* 자취 정보 수정은 아래 '자취 프로필' 메뉴에서만 한다 — 여기서는 보여주기만 */}
          <div className="mypage__profile-copy">
            <div className="mypage__profile-name-row">
              <h2 id="profile-title">{name}님</h2>
              {/* 예전 GNB '마이' hover/click 계정 전환 진입점을 여기로 옮겼다 —
                * 시트(AccountSwitchSheet)·데모 로그인 로직은 그대로, 여는 자리만 바뀐다.
                * 로그아웃까지 포괄할 진입점이라 '계정 전환'이 아니라 '계정 관리'로 고정한다. */}
              <button
                type="button"
                className="mypage__account-btn"
                onClick={() => setAccountSwitchOpen(true)}
              >
                계정 관리
              </button>
            </div>
            <p>{profileSummary(profile)}</p>
          </div>
        </section>

        {/* ② 레벨 — 게임처럼 강조하지 않고 진행 상태만 가볍게 */}
        {/* 카드는 컨테이너일 뿐이고, 누를 수 있는 곳(info / 전체보기 / 본문)만 button 이다 */}
        <section className="mypage__level" aria-labelledby="mypage-level-title">
          <div className="mypage__level-head">
            <h2 id="mypage-level-title">
              나의 자취 레벨
              {/* 이 아이콘만 레벨 안내를 연다 — 미션 화면으로 이동하지 않는다 */}
              <button
                type="button"
                className="mypage__info"
                aria-label="자취 레벨 안내 보기"
                aria-haspopup="dialog"
                aria-expanded={levelInfo !== null}
                onClick={openLevelInfo}
              >
                <img src={icon('info-warn.svg')} alt="" />
              </button>
            </h2>
            <button
              type="button"
              className="mypage__level-more"
              onClick={() => go('level', '자취 레벨')}
            >
              미션보기
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </button>
          </div>

          {/* 본문을 눌러도 전체보기와 같이 자취 미션으로 간다 (기존 카드 전체 클릭 유지) */}
          <button
            type="button"
            className="mypage__level-body"
            aria-label="자취 레벨 전체보기"
            onClick={() => go('level', '자취 레벨')}
          >
            <div className="mypage__level-row">
              <div className="mypage__level-title">
                <img src={level.levelIcon} alt="" />
                <strong>Lv.{level.level}</strong>
                <b>{level.stageName}</b>
              </div>
              {/* 최고 레벨은 진행률 대신 MAX 를 쓴다 */}
              <strong className="mypage__percent">
                {level.progressLabel}
                {!level.isMaxLevel && <small>%</small>}
              </strong>
            </div>
            <div
              className="mypage__progress"
              role="progressbar"
              aria-valuenow={level.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="레벨 진행도"
            >
              <span style={{ width: level.progress + '%' }} />
            </div>
            {/* 최고 레벨에는 다음 레벨이 없으므로 '0XP 더 모으면' 대신 달성 문구를 띄운다 */}
            <p className="mypage__xp">
              {level.isMaxLevel ? (
                <b className="mypage__xp-max">자취 고수 레벨을 달성했어요!</b>
              ) : (
                <>
                  <b>{level.remainingXp}XP</b> 더 모으면 레벨업 할 수있어요!
                </>
              )}
            </p>
          </button>
        </section>

        {/* ③ 메뉴 — 카드가 아니라 한 줄 메뉴 + divider (Figma 3131:16854) */}
        <section className="mypage__links" aria-label="메뉴">
          <button type="button" onClick={() => go('activity', '나의 활동')}>
            <span className="mypage__link-copy">
              <b>나의 활동</b>
              <small>저장한 정보 / 작성한글 / 댓글</small>
            </span>
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </button>
          {/* 화살표만이 아니라 행 전체가 자취 프로필 상세로 들어간다 */}
          <button type="button" onClick={() => go('living-profile', '자취 프로필')}>
            <span className="mypage__link-copy">
              <b>자취 프로필</b>
              <small>자취기간 / 주거 형태 / 관심분야</small>
            </span>
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </button>
          <button type="button" onClick={() => go('settings', '앱 설정')}>
            <span className="mypage__link-copy">
              <b>앱 설정</b>
              <small>알림 설정</small>
            </span>
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </button>
          <button type="button" onClick={() => go('account', '계정 관리')}>
            <span className="mypage__link-copy">
              <b>계정 관리</b>
              <small>프로필 / 로그인·보안</small>
            </span>
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </button>
          <button type="button" onClick={() => go('support', '고객센터')}>
            <span className="mypage__link-copy">
              <b>고객센터</b>
              <small>FAQ / 문의하기 / 약관</small>
            </span>
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </button>
        </section>

      </main>

      {/* 스크롤 끝이 아니라 탭바 바로 위에 띄워, 누른 자리에서 바로 보이게 한다 */}
      <p className="mypage__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      {levelInfo && (
        <LevelInfoPopover
          stages={LEVEL_STAGE_LIST}
          stage={level.stage}
          remainingXp={level.remainingXp}
          anchorTop={levelInfo.top}
          anchorLeft={levelInfo.left}
          onViewMissions={() => {
            setLevelInfo(null);
            go('level', '자취 레벨');
          }}
          onClose={() => setLevelInfo(null)}
        />
      )}

      <AccountSwitchSheet open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} />

      <BottomNavigation activeTab="my" />
    </div>
  );
}

export default MyPage;
