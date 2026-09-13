import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { LevelStage, ResolvedStage } from '../data/personaProfile';
import { icon } from '../lib/asset';

/* 자취 레벨 안내 팝오버 — Figma 랭킹_레벨표식 (2012:11018)
 *
 * 숫자 Level 과 stage 는 1:1 이라 step 이 곧 level 이다(personaProfile.ts 의 LEVEL_STAGES).
 * AuthContext 를 읽지 않고 부모가 준 값만 그린다. */

/** 등장·퇴장 모션 길이. CSS 로 내려보내 애니메이션과 언마운트 타이머가 한 값을 쓴다. */
const MOTION_MS = 240;

/* 삼각형은 카드 위로 11px 솟아 있다(level-info.css 의 .level-info__pointer top: -11px).
 * 버튼 아래 5px 을 띄우고 삼각형이 시작되도록 카드 top 을 그만큼 더 내린다. */
const POINTER_RISE = 11;
const POINTER_GAP = POINTER_RISE + 5;

/* info 버튼의 .app 기준 위치 — 팝오버의 anchorTop / anchorLeft 로 그대로 넘긴다.
 * getBoundingClientRect 는 미리보기 셸처럼 부모에 transform 이 걸리면 화면에 비친
 * 크기를 돌려줘 좌표가 어긋난다. 레이아웃 값인 offset* 으로 재고 스크롤만 빼준다. */
export function levelInfoAnchor(button: HTMLElement): { top: number; left: number } | null {
  const app = button.closest<HTMLElement>('.app');
  if (!app) return null;
  let top = 0;
  let left = 0;
  for (let node: HTMLElement | null = button; node && node !== app; ) {
    top += node.offsetTop;
    left += node.offsetLeft;
    const parent = node.offsetParent as HTMLElement | null;
    /* offsetParent 사이에 낀 스크롤 컨테이너(예: main)의 스크롤량을 뺀다 */
    let scroller: HTMLElement | null = node.parentElement;
    while (scroller && scroller !== parent && scroller !== app) {
      top -= scroller.scrollTop;
      left -= scroller.scrollLeft;
      scroller = scroller.parentElement;
    }
    node = parent;
  }
  return {
    top: top + button.offsetHeight + POINTER_GAP,
    left: left + button.offsetWidth / 2,
  };
}

export type RoadmapState = 'completed' | 'current' | 'next' | 'locked';

/** 단계별 원형 배경 — stage 고유의 색이다 (상태가 아니라 단계에 붙는다) */
const STAGE_TINT: Record<LevelStage, string> = {
  seed: '#f6f0e6',
  sprout: '#dfead2',
  plum_blossom: '#f7ebeb',
  green_plum: '#ecefd1',
  ripe_plum: '#f0d7d7',
};

/** 현재 stage 기준 각 단계의 상태. step 비교만 하고 숫자 level 은 쓰지 않는다. */
export function roadmapState(stage: ResolvedStage, currentStep: number): RoadmapState {
  if (stage.step < currentStep) return 'completed';
  if (stage.step === currentStep) return 'current';
  if (stage.step === currentStep + 1) return 'next';
  return 'locked';
}

interface LevelInfoPopoverProps {
  /** 성장 순서대로 정렬된 5단계 (data/personaProfile.ts 의 LEVEL_STAGE_LIST) */
  stages: ResolvedStage[];
  /** 현재 persona 의 성장 stage */
  stage: LevelStage;
  /** info 버튼 아래 좌표 — .app 기준 px */
  anchorTop: number;
  /** info 버튼 중심 x — .app 기준 px */
  anchorLeft: number;
  onClose: () => void;
}

export function LevelInfoPopover({
  stages,
  stage,
  anchorTop,
  anchorLeft,
  onClose,
}: LevelInfoPopoverProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  /* 닫기는 축소 애니메이션이 끝난 뒤에 부모로 알린다 */
  const [closing, setClosing] = useState(false);
  const close = () => setClosing(true);
  /* 매 렌더마다 새로 오는 onClose 로 타이머가 다시 걸리지 않게 ref 에 담아둔다 */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const current = stages.find((s) => s.stage === stage);
  const currentStep = current?.step ?? 1;
  const next = stages.find((s) => s.step === currentStep + 1);

  /* ESC 로 닫기 */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /* 축소 애니메이션이 끝나면 부모에게 알린다 — 길이는 MOTION_MS 하나로 맞춘다.
   * animationend 는 탭이 가려져 있으면 오지 않아 타이머로 닫는다. */
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onCloseRef.current, MOTION_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  /* 열릴 때 팝오버로 포커스를 옮겨 뒤 콘텐츠가 조작되지 않게 한다 */
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      className={`layer level-info${closing ? ' is-closing' : ''}`}
      style={{ '--level-info-duration': `${MOTION_MS}ms` } as CSSProperties}
    >
      <button type="button" className="layer-dim" aria-label="닫기" onClick={close} />
      <div
        className="level-info__anchor"
        /* info 아이콘 자리(=삼각형 끝)에서 커지고 그 자리로 다시 줄어든다 */
        style={{
          top: `${anchorTop}px`,
          transformOrigin: `calc(${anchorLeft}px - var(--level-info-inset)) top`,
        }}
      >
        {/* 삼각형은 CSS 로 그린다 — 새 에셋을 만들지 않는다 */}
        <span
          className="level-info__pointer"
          style={{ left: `calc(${anchorLeft}px - var(--level-info-inset))` }}
          aria-hidden="true"
        />
        <div
          className="level-info__card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-info-title"
          tabIndex={-1}
          ref={dialogRef}
        >
          <section className="level-info__intro">
            <h2 id="level-info-title">
              <img src={icon('info-warn.svg')} alt="" />
              자취 레벨, 이렇게 쌓여요
            </h2>
            <p>
              미션을 완료하면 XP가 쌓이고, 자취 레벨이 올라가요. 오를수록 자취 노하우도 차곡차곡
              쌓여요. 씨앗에서 잘 익은 자두가 될 때까지,
              <br />
              함께 잘 길러봐요!
            </p>
          </section>

          <section className="level-info__roadmap-box">
            <h3>
              {next ? `${next.step}단계까지 얼마 안 남았어요!` : '최고 단계까지 성장했어요!'}
            </h3>
            <ol className="level-info__roadmap">
              {stages.map((item) => {
                const state = roadmapState(item, currentStep);
                return (
                  <li
                    key={item.stage}
                    className={`level-info__stage is-${state}`}
                    aria-current={state === 'current' ? 'step' : undefined}
                  >
                    <span className="level-info__circle-wrap">
                      <span
                        className="level-info__circle"
                        style={{ background: STAGE_TINT[item.stage] }}
                      >
                        <img src={item.icon} alt="" />
                      </span>
                    </span>
                    <span className="level-info__step">{item.step}단계</span>
                    <span className="level-info__name">{item.name}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

export default LevelInfoPopover;
