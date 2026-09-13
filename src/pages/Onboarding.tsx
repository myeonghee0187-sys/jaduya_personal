import { useState } from 'react';
import '../styles/onboarding.css';
import { StatusBar } from '../components/StatusBar';
import { icon, img } from '../lib/asset';

/* Figma 온보딩 4단계: welcome → interests → stage → complete. */
export type OnboardingSelection = { interests: string[]; stage: string };
interface OnboardingProps { onComplete?: (selection: OnboardingSelection) => void; userName?: string; }

const MAX_INTERESTS = 2;
const interestOptions = [
  { label: '생활 꿀팁', desc: '자취 생활 노하우', icon: 'menu-tip.svg' },
  { label: '돈 관리', desc: '지출 관리, 절약 방법', icon: 'menu-wallet.svg' },
  { label: '지원금·혜택', desc: '청년 지원, 혜택 정보', icon: 'money-benefit-sparkle.svg' },
  { label: '자취 준비', desc: '가구, 이사, 체크리스트', icon: 'menu-checklist.svg' },
  { label: '음식·장보기', desc: '맛집, 장보기 정보', icon: 'menu-food.svg' },
  { label: '동네·커뮤니티', desc: '주변 소식, 사람들', icon: 'nav-community.svg' },
];
const stageOptions = [
  { label: '자취 준비 중', desc: '곧 자취를 시작할 예정이에요.', icon: 'menu-checklist.svg' },
  { label: '자취를 막 시작했어요', desc: '이제 막 혼자 살기 시작했어요.', icon: 'persona-briefcase.svg' },
  { label: '자취에 조금 익숙해졌어요', desc: '혼자 사는 게 이제는 익숙해요.', icon: 'life-house-daily.svg' },
];

export function Onboarding({ onComplete, userName }: OnboardingProps) {
  const [step, setStep] = useState(0); const [selectedInterests, setSelectedInterests] = useState<string[]>(['생활 꿀팁', '자취 준비']); const [selectedStage, setSelectedStage] = useState('자취 준비 중');
  const canNext = step === 0 || (step === 1 ? selectedInterests.length > 0 : step === 2 ? !!selectedStage : true);
  const toggle = (value: string) => setSelectedInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : current.length >= MAX_INTERESTS ? current : [...current, value]);
  const summaryItems = [...interestOptions.filter((item) => selectedInterests.includes(item.label)), ...stageOptions.filter((item) => item.label === selectedStage)];
  return <main className="onboarding app"><StatusBar /><div className="onboarding__nav"><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{step === 0 ? '‹' : '이전'}</button><span>{step + 1} / 4</span></div><div className="onboarding__progress">{[0,1,2,3].map((item) => <i key={item} className={item <= step ? 'is-current' : ''} />)}</div><section className="onboarding__body">
    {step === 0 && <><small>자두야, 처음 만나요</small><h1>나에게 딱 맞는<br />자취 생활을 시작해볼까요?</h1><p>몇 가지만 알려주시면<br />내게 필요한 정보와 기능을 골라드릴게요.</p><div className="onboarding__visual"><img src={img('hero-character.png')} alt="" /><span className="onboarding__bubble">자두와 함께<br />더 편한 자취 생활을<br />시작해요!</span></div></>}
    {step === 1 && <><small>나에게 필요한 정보</small><h1>어떤 정보가<br />가장 필요하세요?</h1><p>관심 있는 항목을 선택해주세요.<br />(최대 {MAX_INTERESTS}개까지)</p><div className="onboarding__choices">{interestOptions.map(({ label, desc, icon: iconName }) => { const selected = selectedInterests.includes(label); return <button type="button" key={label} className={selected ? 'is-selected' : ''} disabled={!selected && selectedInterests.length >= MAX_INTERESTS} onClick={() => toggle(label)}><span className="onboarding__choice-icon"><img src={icon(iconName)} alt="" /></span><span className="onboarding__choice-text"><strong>{label}</strong><em>{desc}</em></span>{selected && <span className="onboarding__choice-check"><img src={icon('sheet-check-circle.svg')} alt="" /></span>}</button>; })}</div></>}
    {step === 2 && <><small>지금의 내 생활</small><h1>지금 어떤 단계에<br />가까우세요?</h1><p>지금 내 모습과 가까운 하나를 선택해주세요.</p><div className="onboarding__stages">{stageOptions.map(({ label, desc, icon: iconName }) => <button type="button" key={label} className={selectedStage === label ? 'is-selected' : ''} onClick={() => setSelectedStage(label)}><span className="onboarding__choice-icon"><img src={icon(iconName)} alt="" /></span><span className="onboarding__choice-text"><strong>{label}</strong><em>{desc}</em></span><span className="onboarding__radio" /></button>)}</div><div className="onboarding__companion"><img src={img('hero-character.png')} alt="" /><p>지금의 자취 생활을<br />알려주셔서 고마워요!</p></div></>}
    {step === 3 && <><div className="onboarding__visual"><img src={img('hero-character.png')} alt="" /></div><h1>{userName ? `${userName}님을 위한 자두가` : '나를 위한 자두가'}<br />준비됐어요</h1><p>선택한 정보를 바탕으로<br />홈과 추천 콘텐츠를 맞춰드릴게요.</p><div className="onboarding__summary"><span className="onboarding__summary-title">선택한 정보</span>{summaryItems.map((item) => <div key={item.label} className="onboarding__summary-row"><span className="onboarding__choice-icon"><img src={icon(item.icon)} alt="" /></span><span>{item.label}</span><img className="onboarding__summary-arrow" src={icon('chevron-right-gray.svg')} alt="" /></div>)}</div></>}
  </section><footer className="onboarding__footer"><p>{step === 1 ? (selectedInterests.length > 0 ? `${selectedInterests.length}개를 선택했어요. 이런 게 좋을 것 같아요!` : `관심 있는 항목을 최대 ${MAX_INTERESTS}개까지 선택해주세요.`) : step === 2 ? '선택한 단계에 맞춰 정보를 추천해드려요.' : step === 3 ? '이제 나에게 맞는 자취 생활을 만나보세요.' : '나중에 설정할 수 있어요.'}</p><button type="button" className="auth-button" disabled={!canNext} onClick={() => step === 3 ? onComplete?.({ interests: selectedInterests, stage: selectedStage }) : setStep(step + 1)}>{step === 0 ? '시작하기' : step === 3 ? '자두 시작하기' : '다음'}</button></footer></main>;
}
