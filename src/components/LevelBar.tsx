/* 공용 LevelBar — Figma level_bar (2012:11344)
 *
 *   [33 × 33 stage 아이콘] 이 흰색 pill 왼쪽 위에 겹치고, pill 안에 Level.{숫자} 를 쓴다.
 *
 * 숫자 level 과 성장 stage 는 별개 값이다. 이 컴포넌트는 둘 다 props 로만 받고
 * 어느 쪽도 다른 쪽에서 계산하지 않는다. (Lv.2 + 씨앗, Lv.2 + 새싹 모두 정상)
 * AuthContext / persona 를 직접 읽지 않는다 — 부모가 내려준 값만 그린다.
 */
interface LevelBarProps {
  /** 숫자 Level — 그대로 Level.{level} 로 출력한다 */
  level: number;
  /** 성장 stage 아이콘 경로. data/personaProfile.ts 의 resolveLevel() 이 만든 절대 URL */
  levelIcon: string;
  /** 성장 stage 이름 (예: 씨앗). 화면에는 안 보이고 대체 텍스트로만 쓴다 */
  stageName?: string;
  /** 배치용 추가 클래스 — 크기·색은 여기서 바꾸지 않는다 */
  className?: string;
}

export function LevelBar({ level, levelIcon, stageName, className }: LevelBarProps) {
  return (
    <div className={`level-bar${className ? ` ${className}` : ''}`}>
      <span className="level-bar__bar">Level.{level}</span>
      {/* 아이콘이 pill 위에 오도록 DOM 뒤쪽에 둔다 */}
      <img className="level-bar__icon" src={levelIcon} alt={stageName ? `${stageName} 단계` : ''} />
    </div>
  );
}

export default LevelBar;
