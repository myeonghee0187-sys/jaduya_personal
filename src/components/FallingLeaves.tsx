import type { CSSProperties } from 'react';

interface LeafStyle extends CSSProperties {
  '--leaf-start-right': string;
  '--leaf-start-top': string;
  '--leaf-width': string;
  '--leaf-height': string;
  '--leaf-color': string;
  '--leaf-opacity': number;
  '--leaf-blur': string;
  '--leaf-duration': string;
  '--leaf-delay': string;
  '--leaf-dx1': number;
  '--leaf-dy1': string;
  '--leaf-dx2': number;
  '--leaf-dy2': string;
  '--leaf-dx3': number;
  '--leaf-dy3': string;
  '--leaf-dx4': number;
  '--leaf-dy4': string;
  '--leaf-dx5': number;
  '--leaf-dy5': string;
  '--leaf-r0': string;
  '--leaf-r1': string;
  '--leaf-r2': string;
  '--leaf-r3': string;
  '--leaf-r4': string;
  '--leaf-r5': string;
}

/* 렌더마다 바뀌는 난수 없이 다섯 잎의 시작점·곡선·깊이를 고정한다.
 * 시작점은 나무가 있는 오른쪽 영역, 경로는 전체적으로 왼쪽 아래를 향하되 각 중간점에서
 * 잠깐 오른쪽으로 되돌아가 바람에 밀렸다 풀리는 느낌을 만든다. */
const LEAVES: LeafStyle[] = [
  {
    '--leaf-start-right': '-4%', '--leaf-start-top': '18%',
    '--leaf-width': '22px', '--leaf-height': '14px',
    '--leaf-color': '#DCE9A8', '--leaf-opacity': 0.86, '--leaf-blur': '0px',
    '--leaf-duration': '6.8s', '--leaf-delay': '-4.9s',
    '--leaf-dx1': -18, '--leaf-dy1': '4.5vh',
    '--leaf-dx2': -12, '--leaf-dy2': '10.5vh',
    '--leaf-dx3': -47, '--leaf-dy3': '18vh',
    '--leaf-dx4': -39, '--leaf-dy4': '27vh',
    '--leaf-dx5': -105, '--leaf-dy5': '43vh',
    '--leaf-r0': '10deg', '--leaf-r1': '-24deg', '--leaf-r2': '34deg',
    '--leaf-r3': '5deg', '--leaf-r4': '-32deg', '--leaf-r5': '18deg',
  },
  {
    '--leaf-start-right': '8%', '--leaf-start-top': '31%',
    '--leaf-width': '18px', '--leaf-height': '11px',
    '--leaf-color': '#C9DFA0', '--leaf-opacity': 0.66, '--leaf-blur': '0.4px',
    '--leaf-duration': '7.9s', '--leaf-delay': '-1.8s',
    '--leaf-dx1': -13, '--leaf-dy1': '5vh',
    '--leaf-dx2': -8, '--leaf-dy2': '12vh',
    '--leaf-dx3': -39, '--leaf-dy3': '20vh',
    '--leaf-dx4': -33, '--leaf-dy4': '30vh',
    '--leaf-dx5': -96, '--leaf-dy5': '45vh',
    '--leaf-r0': '-8deg', '--leaf-r1': '28deg', '--leaf-r2': '-20deg',
    '--leaf-r3': '38deg', '--leaf-r4': '7deg', '--leaf-r5': '-34deg',
  },
  {
    '--leaf-start-right': '19%', '--leaf-start-top': '15%',
    '--leaf-width': '13px', '--leaf-height': '8px',
    '--leaf-color': '#E5EDB8', '--leaf-opacity': 0.4, '--leaf-blur': '1.2px',
    '--leaf-duration': '9.2s', '--leaf-delay': '-7.1s',
    '--leaf-dx1': -10, '--leaf-dy1': '4vh',
    '--leaf-dx2': -4, '--leaf-dy2': '9vh',
    '--leaf-dx3': -31, '--leaf-dy3': '17vh',
    '--leaf-dx4': -25, '--leaf-dy4': '25vh',
    '--leaf-dx5': -84, '--leaf-dy5': '40vh',
    '--leaf-r0': '18deg', '--leaf-r1': '-12deg', '--leaf-r2': '27deg',
    '--leaf-r3': '-19deg', '--leaf-r4': '31deg', '--leaf-r5': '-11deg',
  },
  {
    '--leaf-start-right': '1%', '--leaf-start-top': '47%',
    '--leaf-width': '24px', '--leaf-height': '15px',
    '--leaf-color': '#DCE9A8', '--leaf-opacity': 0.82, '--leaf-blur': '0px',
    '--leaf-duration': '10.4s', '--leaf-delay': '-3.4s',
    '--leaf-dx1': -21, '--leaf-dy1': '3.5vh',
    '--leaf-dx2': -15, '--leaf-dy2': '9vh',
    '--leaf-dx3': -54, '--leaf-dy3': '16vh',
    '--leaf-dx4': -45, '--leaf-dy4': '24vh',
    '--leaf-dx5': -112, '--leaf-dy5': '38vh',
    '--leaf-r0': '-15deg', '--leaf-r1': '22deg', '--leaf-r2': '-30deg',
    '--leaf-r3': '40deg', '--leaf-r4': '4deg', '--leaf-r5': '-38deg',
  },
  {
    '--leaf-start-right': '24%', '--leaf-start-top': '61%',
    '--leaf-width': '15px', '--leaf-height': '9px',
    '--leaf-color': '#C9DFA0', '--leaf-opacity': 0.44, '--leaf-blur': '1px',
    '--leaf-duration': '8.6s', '--leaf-delay': '-6.2s',
    '--leaf-dx1': -9, '--leaf-dy1': '3vh',
    '--leaf-dx2': -2, '--leaf-dy2': '8vh',
    '--leaf-dx3': -28, '--leaf-dy3': '15vh',
    '--leaf-dx4': -20, '--leaf-dy4': '23vh',
    '--leaf-dx5': -78, '--leaf-dy5': '36vh',
    '--leaf-r0': '6deg', '--leaf-r1': '-21deg', '--leaf-r2': '35deg',
    '--leaf-r3': '-8deg', '--leaf-r4': '-29deg', '--leaf-r5': '14deg',
  },
];

/** 홈 히어로 안에서만 보이는 가벼운 장식 효과. 입력이나 스크롤에는 관여하지 않는다.
 *  hidden 이면 잎을 서서히 숨긴다(night 배경에서 쓴다). 잎의 위치·속도는 그대로다. */
export function FallingLeaves({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className={`falling-leaves${hidden ? ' is-hidden' : ''}`} aria-hidden="true">
      {LEAVES.map((style, index) => (
        <span className="falling-leaves__path" style={style} key={index}>
          <span className="falling-leaves__leaf" />
        </span>
      ))}
    </div>
  );
}
