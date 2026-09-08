import { useState } from 'react';
import '../styles/onboarding.css';
import { StatusBar } from '../components/StatusBar';
import { icon, img } from '../lib/asset';

/* Figma 온보딩 4단계: welcome → interests → stage → complete. */
export type OnboardingSelection = { interests: string[]; stage: string };
interface OnboardingProps { onComplete?: (selection: OnboardingSelection) => void; userName?: string; }

export function Onboarding({ onComplete, userName }: OnboardingProps) {
  const [step, setStep] = useState(0); const [selectedInterests, setSelectedInterests] = useState<string[]>([]); const [selectedStage, setSelectedStage] = useState('');
  const interests = ['생활 꿀팁', '돈 관리', '지원금·혜택', '자취 준비', '음식·장보기', '동네·커뮤니티']; const stages = ['자취 준비 중', '자취를 막 시작했어요', '자취에 조금 익숙해졌어요'];
  const canNext = step === 0 || (step === 1 ? selectedInterests.length > 0 : step === 2 ? !!selectedStage : true);
  const toggle = (value: string) => setSelectedInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  return <main className="onboarding app"><StatusBar /><div className="onboarding__nav"><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{step === 0 ? '‹' : '이전'}</button>{step === 0 && <strong>자두와 첫걸음</strong>}<span>{step + 1} / 4</span></div><div className="onboarding__progress">{[0,1,2,3].map((item) => <i key={item} className={item <= step ? 'is-current' : ''} />)}</div><section className="onboarding__body">
    {step === 0 && <><div className="onboarding__visual"><img src={img('hero-character.png')} alt="" /></div><h1>자두와 함께 자취를<br />시작해볼까요?</h1><p>내 생활에 필요한 정보만 골라<br />더 편하게 자취를 관리해보세요.</p><em>두 가지 선택이면 준비 끝!</em></>}
    {step === 1 && <><small>나에게 필요한 정보</small><h1>어떤 정보가<br />가장 필요하세요?</h1><p>관심 있는 항목을 골라주세요.</p><div className="onboarding__choices">{interests.map((item) => <button type="button" key={item} className={selectedInterests.includes(item) ? 'is-selected' : ''} onClick={() => toggle(item)}>{item}<span className="onboarding__mark">{selectedInterests.includes(item) && <img src={icon('sheet-check-circle.svg')} alt="" />}</span></button>)}</div></>}
    {step === 2 && <><small>지금의 내 생활</small><h1>지금 어떤 단계에<br />가까우세요?</h1><p>지금 내 모습과 가까운 하나를 골라주세요.</p><div className="onboarding__stages">{stages.map((item) => <button type="button" key={item} className={selectedStage === item ? 'is-selected' : ''} onClick={() => setSelectedStage(item)}>{item}<span className="onboarding__radio" /></button>)}</div></>}
    {step === 3 && <><div className="onboarding__visual"><img src={img('hero-character.png')} alt="" /></div><h1>{userName ? `${userName}님을 위한 자두가` : '나를 위한 자두가'}<br />준비됐어요</h1><p>선택한 정보를 바탕으로<br />홈과 추천 콘텐츠를 맞춰드릴게요.</p><div className="onboarding__summary"><div>관심 정보 <b>{selectedInterests.join(', ')}</b></div><div>자취 단계 <b>{selectedStage}</b></div></div></>}
  </section><footer className="onboarding__footer"><p>{step === 1 ? `${selectedInterests.length}개 선택했어요 · 여러 개 골라도 좋아요.` : step === 2 ? '선택한 단계에 맞춰 정보를 추천해드려요.' : step === 3 ? '이제 나에게 맞는 자취 생활을 만나보세요.' : '나중에 마이페이지에서 바꿀 수 있어요.'}</p><button type="button" className="auth-button" disabled={!canNext} onClick={() => step === 3 ? onComplete?.({ interests: selectedInterests, stage: selectedStage }) : setStep(step + 1)}>{step === 0 ? '시작하기' : step === 3 ? '자두 시작하기' : '다음'}</button></footer></main>;
}
