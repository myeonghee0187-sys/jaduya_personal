import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import '../styles/onboarding.css';
import { StatusBar } from '../components/StatusBar';
import { icon, img } from '../lib/asset';

/* 온보딩 4단계: welcome → interests → stage → complete.
 * 레이아웃/문구/아이콘은 Figma 온보딩 레퍼런스를 그대로 따른다 — 임의로 재해석하지 않는다.
 * 아이콘은 public/assets/img/onboarding/ 의 실제 캐릭터 시트 crop 을 쓴다(placeholder 아님). */
export type OnboardingSelection = { interests: string[]; stage: string };
interface OnboardingProps { onComplete?: (selection: OnboardingSelection) => void; userName?: string; }

const TOTAL_STEPS = 4;

/* 완료 화면 색종이 — 마스코트 위에서 한 번만 부채꼴로 튀어 올랐다 떨어진다(과하지 않게 12조각).
 * 각도·거리·색은 고정값이라 렌더마다 흔들리지 않는다. */
const CONFETTI_COLORS = ['var(--brand-primary)', 'var(--brand-green)', 'var(--brand-secondary)'] as const;
const CONFETTI = Array.from({ length: 12 }, (_, i) => {
  const angle = (-160 + (140 / 11) * i) * (Math.PI / 180);
  const dist = 70 + (i % 3) * 22;
  return {
    tx: Math.round(Math.cos(angle) * dist * 1.5),
    ty: Math.round(Math.sin(angle) * dist),
    rot: (i % 2 ? 1 : -1) * (120 + i * 25),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: 120 + (i % 4) * 40,
  };
});

interface ChoiceOption { label: string; desc: string; icon: string; flip?: boolean }

/* 관심사 카드를 켤 때 아이콘 주변으로 튀는 파티클 6개 — 각도는 고정값 */
const BURST = Array.from({ length: 6 }, (_, i) => {
  const angle = (-90 + (360 / 6) * i) * (Math.PI / 180);
  return { x: Math.round(Math.cos(angle) * 34), y: Math.round(Math.sin(angle) * 34), color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] };
});

/* 완료 화면 색종이 2차 — 좌우 양쪽에서 터진다 */
const CONFETTI_SIDES = ['left', 'right'] as const;

const interestOptions: ChoiceOption[] = [
  { label: '자취 준비', desc: '집 구하기, 이사, 체크리스트', icon: 'image 352.png' },
  { label: '음식 · 장보기', desc: '맛집, 장보기, 간단 요리', icon: 'image 353.png' },
  { label: '생활 꿀팁', desc: '자취 생활 노하우', icon: 'image 354.png' },
  { label: '돈 관리', desc: '지출 관리, 절약 방법', icon: '5b7cbe22-649f-4893-94ce-a1aa616d64a2 3.png' },
  { label: '인테리어', desc: '공간 꾸미기, 가구 추천', icon: 'image 356.png' },
  { label: '동네 · 커뮤니티', desc: '주변 소식, 사람들', icon: 'image 357.png' },
];

const stageOptions: ChoiceOption[] = [
  { label: '자취 준비 중', desc: '곧 자취를 시작할 예정이에요.', icon: 'd479ddad-11e3-4515-a45a-f6a005707f90 2.png' },
  { label: '자취를 막 시작했어요', desc: '이제 막 혼자 살기 시작했어요.', icon: 'd479ddad-11e3-4515-a45a-f6a005707f90 3.png' },
  { label: '자취에 조금 익숙해졌어요', desc: '혼자 사는 게 이제는 익숙해요.', icon: 'image 358.png' },
];

export function Onboarding({ onComplete, userName }: OnboardingProps) {
  const [step, setStep] = useState(0);
  /* 단계 전환 애니메이션 방향 — 다음/이전 버튼이 어느 쪽으로 눌렸는지에 따라
   * 새 콘텐츠가 오른쪽/왼쪽 중 어디서 들어올지를 결정한다. */
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  /* 레퍼런스 목업과 같은 기본 선택값 — 실제로는 사용자가 바꾼 순서 그대로 요약에 반영된다 */
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['생활 꿀팁', '자취 준비']);
  const [selectedStage, setSelectedStage] = useState('자취 준비 중');
  /* 선택할 때마다 1씩 늘려 key 로 쓴다 — 같은 카드/마스코트의 모션이 매번 처음부터 다시 재생된다 */
  const [burst, setBurst] = useState({ label: '', n: 0 });
  const [mascotHop, setMascotHop] = useState(0);

  const canNext = step === 1 ? selectedInterests.length > 0 : step === 2 ? !!selectedStage : true;
  const name = userName ? `${userName}님` : '회원님';

  const toggleInterest = (label: string) => {
    if (!selectedInterests.includes(label)) setBurst((current) => ({ label, n: current.n + 1 }));
    setSelectedInterests((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const goBack = () => {
    setDirection('back');
    setStep((current) => Math.max(0, current - 1));
  };
  const goNext = () => {
    setDirection('forward');
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  };
  /* "수정하기" 처럼 단계를 건너뛰어 되돌아가는 이동도 뒤로가기와 같은 방향으로 본다 */
  const goToStep = (target: number) => {
    setDirection(target < step ? 'back' : 'forward');
    setStep(target);
  };
  const finish = (selection: OnboardingSelection) => onComplete?.(selection);

  /* 요약(선택한 정보)은 카탈로그 순서가 아니라 "사용자가 선택한 순서" 그대로 보여준다 */
  const summaryItems = [
    ...selectedInterests.map((label) => interestOptions.find((item) => item.label === label)).filter((item): item is ChoiceOption => !!item),
    ...stageOptions.filter((item) => item.label === selectedStage),
  ];

  return (
    <main className="onboarding app">
      <StatusBar />
      <div className="onboarding__nav">
        <button
          type="button"
          className="onboarding__back"
          onClick={goBack}
          disabled={step === 0}
        >
          이전
        </button>
        {step === 0 ? (
          <button
            type="button"
            className="onboarding__skip"
            onClick={() => finish({ interests: [], stage: '' })}
          >
            건너뛰기
          </button>
        ) : (
          <span className="onboarding__step-count" aria-hidden="true">{step + 1} / {TOTAL_STEPS}</span>
        )}
      </div>

      {/* 진행 표시 — 점 4개 + 연결선 3개. 현재 단계 점만 크게/빨갛게, 그 앞 구간의 선만 빨갛게
       * (첫 단계는 이전 구간이 없어 다음 구간을 대신 칠한다) — 레퍼런스와 동일한 규칙이다. */}
      <div className="onboarding__progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label="온보딩 진행 단계">
        {(() => {
          /* 현재 단계 앞 구간의 선만 붉게 칠한다 — 1단계는 이전 구간이 없어 다음 구간을 대신 칠한다
           * (레퍼런스 4개 화면을 픽셀 단위로 비교해 확인한 규칙). */
          const activeSegment = Math.max(0, step - 1);
          const units: ReactNode[] = [];
          for (let dotIndex = 0; dotIndex < TOTAL_STEPS; dotIndex++) {
            units.push(<i key={`dot-${dotIndex}`} className={`onboarding__progress-dot${dotIndex === step ? ' is-current' : ''}`} />);
            if (dotIndex < TOTAL_STEPS - 1) {
              units.push(<i key={`line-${dotIndex}`} className={`onboarding__progress-line${dotIndex === activeSegment ? ' is-active' : ''}`} />);
            }
          }
          return units;
        })()}
      </div>

      <section className={`onboarding__body${step === 0 ? ' onboarding__body--visual' : step === 3 ? ' onboarding__body--complete' : ''}`}>
      <div key={step} className={`onboarding__step onboarding__step--${direction}`}>
        {step === 0 && (
          <div className="onboarding__welcome">
            <div className="onboarding__visual onboarding__visual--welcome">
              <img className="onboarding__mascot onboarding__mascot--welcome" src={img('onboarding/mascot-welcome.png')} alt="자두가 인사해요" />
            </div>
            <h1>
              자두와 함께 자취를<br />시작해볼까요?
            </h1>
            <p>
              내 생활에 필요한 정보만 골라<br />더 편하게 자취를 관리해보세요.
            </p>
            <span className="onboarding__accent">두 가지 선택이면 준비 끝!</span>
          </div>
        )}

        {step === 1 && (
          <>
            <small>나에게 필요한 정보</small>
            <h1>어떤 정보가<br /><span className="onboarding__mark">가장 필요하세요?</span></h1>
            <p>관심 있는 항목을 선택해주세요.<br />선택한 관심사에 맞는 위젯을 홈에 자동으로 추가해드려요.</p>
            <div className="onboarding__choices" role="group" aria-label="관심 있는 정보">
              {interestOptions.map(({ label, desc, icon: iconName }, index) => {
                const selected = selectedInterests.includes(label);
                return (
                  <button
                    type="button"
                    key={label}
                    style={{ '--i': index } as CSSProperties}
                    className={selected ? 'is-selected' : ''}
                    aria-pressed={selected}
                    aria-label={`${label}, ${desc}${selected ? ' (선택됨)' : ''}`}
                    onClick={() => toggleInterest(label)}
                  >
                    <img className="onboarding__choice-icon" src={img(`onboarding/${iconName}`)} alt="" />
                    {selected && burst.label === label && (
                      <span key={burst.n} className="onboarding__burst" aria-hidden="true">
                        {BURST.map((dot, i) => (
                          <i key={i} style={{ '--bx': `${dot.x}px`, '--by': `${dot.y}px`, background: dot.color } as CSSProperties} />
                        ))}
                      </span>
                    )}
                    <span className="onboarding__choice-text">
                      <strong>{label}</strong>
                      <em>{desc}</em>
                    </span>
                    <span className={`onboarding__choice-check${selected ? ' is-on' : ''}`} aria-hidden="true">
                      {selected && <img src={img('onboarding/selected-check.png')} alt="" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <small>지금의 내 생활</small>
            <h1>지금 <span className="onboarding__mark">어떤 단계</span>에<br />가까우세요?</h1>
            <p>지금 내 모습과 가까운 하나를 선택해주세요.</p>
            <div className="onboarding__stages" role="radiogroup" aria-label="지금의 자취 단계">
              {stageOptions.map(({ label, desc, icon: iconName, flip }, index) => {
                const selected = selectedStage === label;
                return (
                  <button
                    type="button"
                    key={label}
                    style={{ '--i': index } as CSSProperties}
                    role="radio"
                    aria-checked={selected}
                    className={selected ? 'is-selected' : ''}
                    onClick={() => { setSelectedStage(label); setMascotHop((n) => n + 1); }}
                  >
                    <img className={`onboarding__choice-icon onboarding__choice-icon--stage${flip ? ' is-flipped' : ''}`} src={img(`onboarding/${iconName}`)} alt="" />
                    <span className="onboarding__choice-text">
                      <strong>{label}</strong>
                      <em>{desc}</em>
                    </span>
                    <span className="onboarding__radio" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="onboarding__companion">
              <img key={mascotHop} className={`onboarding__mascot onboarding__mascot--guide${mascotHop ? ' is-hop' : ''}`} src={img('onboarding/mascot-guide-v2.png')} alt="자두야가 노트북을 보고 있어요" />
              <span className="onboarding__companion-text">지금의 자취 생활을<br />더 잘 맞춰볼게요!</span>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="onboarding__visual onboarding__visual--complete">
              <img className="onboarding__mascot onboarding__mascot--complete" src={img('onboarding/mascot-complete-v2.png')} alt="자두야가 완료를 반겨요" />
              <div className="onboarding__confetti" aria-hidden="true">
                {CONFETTI.map((piece, i) => (
                  <i
                    key={i}
                    style={{ '--tx': `${piece.tx}px`, '--ty': `${piece.ty}px`, '--rot': `${piece.rot}deg`, background: piece.color, animationDelay: `${piece.delay}ms` } as CSSProperties}
                  />
                ))}
              </div>
              {CONFETTI_SIDES.map((side) => (
                <div key={side} className={`onboarding__confetti onboarding__confetti--${side}`} aria-hidden="true">
                  {CONFETTI.slice(0, 8).map((piece, i) => (
                    <i
                      key={i}
                      style={{ '--tx': `${Math.round(piece.tx * (side === 'left' ? 0.6 : -0.6))}px`, '--ty': `${piece.ty}px`, '--rot': `${piece.rot}deg`, background: piece.color, animationDelay: `${760 + piece.delay}ms` } as CSSProperties}
                    />
                  ))}
                </div>
              ))}
            </div>
            <h1 className="onboarding__complete-heading">{name}을 위한 자두가<br /><span className="onboarding__mark onboarding__mark--letters" aria-label="준비됐어요">
              {Array.from('준비됐어요').map((ch, i) => (
                <span key={i} aria-hidden="true" style={{ '--c': i } as CSSProperties}>{ch}</span>
              ))}
            </span></h1>
            <p className="onboarding__complete-text">선택한 정보를 바탕으로<br />홈과 추천 콘텐츠를 맞춰드릴게요.</p>

            <div className="onboarding__summary">
              <div className="onboarding__summary-head">
                <span className="onboarding__summary-title">선택한 정보</span>
                <button type="button" className="onboarding__summary-edit" onClick={() => goToStep(1)}>
                  수정하기
                </button>
              </div>
              {summaryItems.map((item, index) => (
                <div key={item.label} className="onboarding__summary-row" style={{ '--i': index } as CSSProperties}>
                  <img className={`onboarding__choice-icon onboarding__choice-icon--summary${item.flip ? ' is-flipped' : ''}`} src={img(`onboarding/${item.icon}`)} alt="" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </section>

      <footer className="onboarding__footer">
        {step === 0 && <p>나중에 설정할 수 있어요</p>}
        {step === 1 && (
          <p>
            <span key={selectedInterests.length} className="onboarding__count">{selectedInterests.length}</span>개를 선택했어요 · 여러 개 골라도 좋아요
          </p>
        )}
        {step === 2 && <p>선택한 단계에 맞춰 정보를 추천해드려요</p>}
        {step === 3 && <p>이제 나에게 맞는 자취 생활을 만나보세요.</p>}
        <button
          type="button"
          className="auth-button onboarding__cta"
          disabled={!canNext}
          onClick={() => (step === TOTAL_STEPS - 1 ? finish({ interests: selectedInterests, stage: selectedStage }) : goNext())}
        >
          {step === 0 ? '시작하기' : step === TOTAL_STEPS - 1 ? '자두 시작하기' : '다음'}
          <img src={icon('chevron-right-white.svg')} alt="" />
        </button>
      </footer>
      {/* 남는 세로 공간을 흡수해 화면 맨 아래로 밀어낸다 — 버튼이 콘텐츠 바로 아래에
       * 붙고, 화면이 다 안 찼을 때 생기는 여백은 버튼 아래(물리적 화면 하단)에만 남는다. */}
      <div className="onboarding__footer-spacer" aria-hidden="true" />
    </main>
  );
}
