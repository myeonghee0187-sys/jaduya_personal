import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { LevelInfoPopover } from '../components/LevelInfoPopover';
import { DEFAULT_PERSONA } from '../data/personaHome';
import { LEVEL_STAGE_LIST, PERSONA_PROFILE, resolveLevel } from '../data/personaProfile';
import {
  CATEGORY_CHIP,
  MISSIONS,
  STATUS_CHIP,
  STATUS_TABS,
  categoryOptions,
  missionProgress,
} from '../data/missions';
import type { Mission, MissionCategory, MissionStatus } from '../data/missions';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

/** 미션 상세 화면이 생기면 여기로 연결한다. 지금은 화면이 없어 route 를 만들지 않는다. */
export interface MissionPageProps {
  onOpenMission?: (missionId: string) => void;
}

/* 자취 미션 — 마이페이지 '나의 자취 레벨 > 전체보기' 에서 들어오는 하위 화면.
 * 레벨 영역은 persona 데이터를 그대로 쓰고, 시각 구조만 Figma 1565:6712 를 따른다.
 * (공용 LevelBar 와는 형태가 달라 적용하지 않는다) */
export function MissionPage({ onOpenMission }: MissionPageProps) {
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const persona = user?.persona ?? DEFAULT_PERSONA;
  const level = resolveLevel(PERSONA_PROFILE[persona].level);

  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const [status, setStatus] = useState<MissionStatus | null>(null);
  const [category, setCategory] = useState<MissionCategory | '전체'>('전체');
  const [filterOpen, setFilterOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  /* 레벨 안내 팝오버 — info 버튼 위치를 재서 그 아래에 띄운다 */
  const appRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLButtonElement>(null);
  const [levelInfo, setLevelInfo] = useState<{ top: number; left: number } | null>(null);

  const openLevelInfo = () => {
    const button = infoRef.current?.getBoundingClientRect();
    const app = appRef.current?.getBoundingClientRect();
    if (!button || !app) return;
    setLevelInfo({
      top: button.bottom - app.top + 12,
      left: button.left + button.width / 2 - app.left,
    });
  };

  const options = useMemo(() => categoryOptions(MISSIONS), []);
  const missions = useMemo(
    () =>
      MISSIONS.filter(
        (m) => (status === null || m.status === status) && (category === '전체' || m.category === category),
      ),
    [status, category],
  );

  /* 바깥을 누르면 필터를 닫는다 (터치·마우스 공통) */
  useEffect(() => {
    if (!filterOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [filterOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const openMission = (mission: Mission) => {
    if (onOpenMission) onOpenMission(mission.id);
    else setNotice(`${mission.title} 화면은 준비 중이에요.`);
  };

  return (
    <div className="mission app" ref={appRef}>
      <SubPageHeader
        title="자취 미션"
        backLabel="마이페이지로"
        onBack={() => navigation?.navigate('my')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="mission__scroll">
        {/* ① 레벨 — 마이페이지와 같은 데이터, 카드 없이 평평하게 */}
        <section className="mission__level" aria-labelledby="mission-level-title">
          <h2 id="mission-level-title">
            나의 자취 레벨
            <button
              type="button"
              className="mission__info"
              aria-label="자취 레벨 안내 보기"
              aria-haspopup="dialog"
              aria-expanded={levelInfo !== null}
              ref={infoRef}
              onClick={openLevelInfo}
            >
              <img src={icon('info-warn.svg')} alt="" />
            </button>
          </h2>
          <div className="mission__level-row">
            <span className="mission__level-title">
              <img src={level.levelIcon} alt="" />
              <strong>Lv.{level.level}</strong>
              <b>{level.stageName}</b>
            </span>
            {/* 최고 레벨은 진행률 대신 MAX 를 쓴다 (마이페이지 카드와 같은 규칙) */}
            <strong className="mission__percent">
              {level.progressLabel}
              {!level.isMaxLevel && <small>%</small>}
            </strong>
          </div>
          <div
            className="mission__bar"
            role="progressbar"
            aria-valuenow={level.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="레벨 진행도"
          >
            <span style={{ width: `${level.progress}%` }} />
          </div>
          <p className="mission__xp">
            {level.isMaxLevel ? (
              <strong>자취 고수 레벨을 달성했어요!</strong>
            ) : (
              <>
                <strong>{level.remainingXp}XP</strong> 더 모으면 레벨업 할 수있어요!
              </>
            )}
          </p>
        </section>

        {/* ② 상태 탭 + 카테고리 필터 */}
        <div className="mission__filters">
          <div className="mission__tabs" role="tablist" aria-label="미션 상태">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={status === tab.status}
                className={`mission__tab${status === tab.status ? ' is-active' : ''}`}
                onClick={() => setStatus(tab.status)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mission__filter" ref={filterRef}>
            <button
              type="button"
              className="mission__filter-button"
              aria-haspopup="listbox"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((open) => !open)}
            >
              {category}
              <i
                className="mission__filter-arrow"
                style={{ maskImage: `url(${icon('chevron-down.svg')})` }}
                aria-hidden="true"
              />
            </button>
            <ul className="mission__filter-menu" role="listbox" hidden={!filterOpen}>
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={category === option}
                    className={category === option ? 'is-selected' : ''}
                    onClick={() => {
                      setCategory(option);
                      setFilterOpen(false);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ③ 미션 목록 */}
        {missions.length > 0 ? (
          <div className="mission__list">
            {missions.map((mission) => {
              const chip = STATUS_CHIP[mission.status];
              const isAvailable = mission.status === 'available';
              const isDone = mission.status === 'done';
              return (
                <article
                  key={mission.id}
                  className={`mission__card${isAvailable ? ' mission__card--available' : ''}${
                    isDone ? ' mission__card--done' : ''
                  }`}
                >
                  <div className="mission__card-top">
                    <span className="mission__chips">
                      <span
                        className="mission__chip mission__chip--status"
                        style={{ background: chip.background, color: chip.color }}
                      >
                        {chip.label}
                      </span>
                      <span
                        className="mission__chip"
                        /* 완료 카드는 카테고리도 상태 chip 과 같은 회색 */
                        style={{
                          background: isDone ? chip.background : CATEGORY_CHIP[mission.category],
                        }}
                      >
                        {mission.category}
                      </span>
                    </span>
                    <span className="mission__xp-badge">
                      +{mission.xp}
                      <em>XP</em>
                    </span>
                  </div>

                  <h3 className="mission__card-title">{mission.title}</h3>
                  <p className="mission__card-desc">{mission.description}</p>

                  <div className="mission__card-foot">
                    {isDone ? (
                      /* 완료 카드는 진행도·이어하기 대신 완료 시점과 부가 정보만 보여준다 */
                      <>
                        <span className="mission__done-at">완료 일시 : {mission.completedAt}</span>
                        {mission.secondaryInfo && (
                          <span className="mission__done-info">{mission.secondaryInfo}</span>
                        )}
                      </>
                    ) : isAvailable ? (
                      <>
                        <span className="mission__time">예상 소요 시간: {mission.estimatedTime}</span>
                        <button
                          type="button"
                          className="mission__start"
                          onClick={() => openMission(mission)}
                        >
                          미션 시작하기
                          <i
                            className="mission__start-arrow"
                            style={{ maskImage: `url(${icon('chevron-right-sm.svg')})` }}
                            aria-hidden="true"
                          />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="mission__progress">
                          <span className="mission__progress-label">
                            {mission.completed}/{mission.total} 완료
                          </span>
                          <span
                            className="mission__progress-bar"
                            role="progressbar"
                            aria-valuenow={missionProgress(mission)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${mission.title} 진행도`}
                          >
                            <span style={{ width: `${missionProgress(mission)}%` }} />
                          </span>
                        </span>
                        <button
                          type="button"
                          className="mission__continue"
                          onClick={() => openMission(mission)}
                        >
                          이어하기
                          <i
                            className="mission__continue-arrow"
                            style={{ maskImage: `url(${icon('chevron-right-sm.svg')})` }}
                            aria-hidden="true"
                          />
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mission__empty">조건에 맞는 미션이 없어요.</p>
        )}
      </main>

      <p className="mission__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      {levelInfo && (
        <LevelInfoPopover
          stages={LEVEL_STAGE_LIST}
          stage={level.stage}
          anchorTop={levelInfo.top}
          anchorLeft={levelInfo.left}
          onClose={() => setLevelInfo(null)}
        />
      )}

      <BottomNavigation activeTab="my" />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />
      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
    </div>
  );
}

export default MissionPage;
