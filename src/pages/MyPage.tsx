import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { BellButton } from '../components/BellButton';
import { GnbOverlay } from '../components/GnbOverlay';
import { StatusBar } from '../components/StatusBar';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { DEFAULT_PERSONA } from '../data/personaHome';
import {
  ACTIVITY_EMPTY,
  ACTIVITY_TAB_ICONS,
  ACTIVITY_TABS,
  CATEGORY_CHIP_COLOR,
  PERSONA_PROFILE,
  resolveLevel,
} from '../data/personaProfile';
import type { ActivityTab } from '../data/personaProfile';
import { icon, img } from '../lib/asset';

export type MyPageDestination = 'profile' | 'level' | 'activity' | 'settings' | 'support';

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
  const [gnbOpen, setGnbOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityTab>('저장');
  /* 아직 화면이 없는 항목은 토스트로만 알린다 — 없는 route 를 만들지 않는다 */
  const [notice, setNotice] = useState('');
  const name = user?.name ?? '자두';
  const items = profile.activity[activity];

  /* 안내는 잠깐만 띄우고 스스로 사라진다 — 닫는 동작을 따로 만들지 않는다 */
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const go = (destination: MyPageDestination, label: string) => {
    /* 아직 화면이 없는 항목은 부모가 처리하지 않으므로 안내만 띄운다 */
    if (onDetailNavigate?.(destination)) return;
    setNotice(label + ' 화면은 준비 중이에요.');
  };

  return (
    <div className="mypage app">
      <header className="mypage__header">
        <StatusBar />
        <div className="mypage__nav">
          <button
            type="button"
            className="mypage__back"
            aria-label="홈으로"
            onClick={() => navigation?.navigate('home')}
          >
            <img src={icon('gnb-back.svg')} alt="" />
          </button>
          <h1>마이페이지</h1>
          <div className="mypage__actions">
            <BellButton />
            <button
              type="button"
              className="mypage__menu"
              aria-label="전체 메뉴"
              onClick={() => setGnbOpen(true)}
            >
              <img src={icon('header-menu.svg')} alt="" />
            </button>
          </div>
        </div>
      </header>

      <main className="mypage__scroll">
        {/* ① 프로필 — 지금 어떤 상태인지 한 줄로 */}
        <section className="mypage__profile" aria-labelledby="profile-title">
          <img className="mypage__avatar" src={img(profile.profileImage)} alt="" />
          <div className="mypage__profile-copy">
            <h2 id="profile-title">{name}님</h2>
            <p>{profile.status}</p>
            <button
              type="button"
              className="mypage__profile-button"
              onClick={() => go('profile', '프로필 관리')}
            >
              프로필 관리
              {/* 화살표는 버튼 텍스트 색(currentColor)으로 칠한다.
                * 공용 chevron-right-sm.svg 는 fill 이 박혀 있고 다른 곳에서도 쓰므로
                * 파일을 고치지 않고 이 버튼에서만 마스크로 색을 입힌다. */}
              <i
                className="mypage__profile-arrow"
                style={{ maskImage: `url(${icon('chevron-right-sm.svg')})` }}
                aria-hidden="true"
              />
            </button>
          </div>
        </section>

        {/* ② 레벨 — 게임처럼 강조하지 않고 진행 상태만 가볍게 */}
        <button type="button" className="mypage__level" onClick={() => go('level', '자취 레벨')}>
          <div className="mypage__level-head">
            <h2>
              나의 자취 레벨
              <img className="mypage__info" src={icon('info-warn.svg')} alt="" />
            </h2>
            <span>
              전체보기
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </span>
          </div>
          <div className="mypage__level-row">
            <div className="mypage__level-title">
              <img src={level.levelIcon} alt="" />
              <strong>Lv.{level.level}</strong>
              <b>{level.stageName}</b>
            </div>
            <strong className="mypage__percent">
              {level.progress}
              <small>%</small>
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
          <p className="mypage__xp">
            <b>{level.remainingXp}XP</b> 더 모으면 레벨업 할 수있어요!
          </p>
        </button>

        {/* ③ 나의 활동 — 저장 / 완료 / 작성 / 댓글 */}
        <section className="mypage__activity" aria-labelledby="activity-title">
          <div className="mypage__section-head">
            <h2 id="activity-title">나의 활동</h2>
            <button type="button" onClick={() => go('activity', '나의 활동')}>
              전체보기
              <img src={icon('chevron-right-sm.svg')} alt="" />
            </button>
          </div>
          {/* 탭은 밑줄이 아니라 개별 pill 버튼이다 (Figma 1665:5338) */}
          <div className="mypage__tabs" role="tablist" aria-label="나의 활동 종류">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activity === tab}
                className={`mypage__tab${activity === tab ? ' is-active' : ''}`}
                onClick={() => setActivity(tab)}
              >
                <span>{tab}</span>
                {/* 아이콘은 마스크로 칠해 active(흰색)/inactive(먹색)를 한 파일로 처리한다 */}
                <i
                  className="mypage__tab-icon"
                  style={{ maskImage: `url(${icon(ACTIVITY_TAB_ICONS[tab])})` }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          <p className="mypage__recent-label">
            <span>최근 항목</span>
          </p>

          {items.length > 0 ? (
            <div className="mypage__activity-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="mypage__card"
                  onClick={() => setNotice(item.title + ' 화면은 준비 중이에요.')}
                >
                  {item.thumbnail ? (
                    <img
                      className="mypage__card-thumb"
                      src={img(`thumb/${item.thumbnail}`)}
                      alt=""
                    />
                  ) : (
                    /* thumbnail 이 없는 항목은 카테고리 아이콘을 같은 80×80 자리에 둔다 */
                    <span
                      className="mypage__card-thumb mypage__card-thumb--icon"
                      style={{ background: CATEGORY_CHIP_COLOR[item.category] }}
                    >
                      <img src={icon(item.icon)} alt="" />
                    </span>
                  )}
                  <span className="mypage__card-body">
                    <span className="mypage__card-top">
                      <span
                        className="mypage__chip"
                        style={{ background: CATEGORY_CHIP_COLOR[item.category] }}
                      >
                        {item.category}
                      </span>
                      <i
                        className="mypage__card-bookmark"
                        style={{ maskImage: `url(${icon('card-bookmark.svg')})` }}
                        aria-hidden="true"
                      />
                    </span>
                    <b className="mypage__card-title">{item.title}</b>
                    <small className="mypage__card-desc">{item.desc}</small>
                    <small className="mypage__card-date">
                      {item.date} {activity}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mypage__empty">{ACTIVITY_EMPTY[activity]}</p>
          )}
        </section>

        {/* ④ 설정 · 고객 관리 — 같은 형태의 행으로 통일한다 */}
        <section className="mypage__links" aria-label="설정">
          <button type="button" onClick={() => go('profile', '자취 프로필')}>
            <span className="mypage__link-copy">
              <b>자취 프로필</b>
              <small>자취기간 / 주거 형태 / 관심분야 등</small>
            </span>
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </button>
          <button type="button" onClick={() => go('settings', '앱 설정')}>
            <span className="mypage__link-copy">
              <b>앱 설정</b>
              <small>알림 / 계정 / 약관</small>
            </span>
            <img src={icon('chevron-right-sm.svg')} alt="" />
          </button>
          <button type="button" onClick={() => go('support', '고객관리')}>
            <span className="mypage__link-copy">
              <b>고객관리</b>
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

      <BottomNavigation activeTab="my" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={DEFAULT_MENU}
        onClose={() => setGnbOpen(false)}
        onEditMenu={() => {
          setGnbOpen(false);
          setNotice('내 메뉴 편집은 홈에서 이용할 수 있어요.');
        }}
      />
    </div>
  );
}

export default MyPage;
