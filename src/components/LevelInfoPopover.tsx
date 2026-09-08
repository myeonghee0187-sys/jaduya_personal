import { useEffect, useRef } from 'react';
import type { LevelStage, ResolvedStage } from '../data/personaProfile';
import { icon } from '../lib/asset';

/* 자취 레벨 안내 팝오버 — Figma 랭킹_레벨표식 (2012:11018)
 *
 * 로드맵 상태는 숫자 level 이 아니라 stage 로만 결정한다.
 * (Lv.41 + 씨앗 같은 조합도 정상이므로 level 로 계산하면 안 된다)
 * AuthContext 를 읽지 않고 부모가 준 값만 그린다. */

export type RoadmapState = 'completed' | 'current' | 'next' | 'locked';

/** 단계별 원형 배경 — stage 고유의 색이다 (상태가 아니라 단계에 붙는다) */
const STAGE_TINT: Record<LevelStage, string> = {
  seed: '#f6f0e6',
  sprout: '#dfead2',
  blossom: '#f7ebeb',
  'green-plum': '#ecefd1',
  'ripe-plum': '#f0d7d7',
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
  const current = stages.find((s) => s.stage === stage);
  const currentStep = current?.step ?? 1;
  const next = stages.find((s) => s.step === currentStep + 1);

  /* ESC 로 닫기 */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  /* 열릴 때 팝오버로 포커스를 옮겨 뒤 콘텐츠가 조작되지 않게 한다 */
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className="layer level-info">
      <button type="button" className="layer-dim" aria-label="닫기" onClick={onClose} />
      <div className="level-info__anchor" style={{ top: `${anchorTop}px` }}>
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
