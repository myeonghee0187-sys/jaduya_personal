import type { CSSProperties } from 'react';

interface LeafStyle extends CSSProperties {
  '--leaf-start-left': string;
  '--leaf-start-top': string;
  '--leaf-width': string;
  '--leaf-height': string;
  '--leaf-color': string;
  '--leaf-opacity': number;
  '--leaf-blur': string;
  '--leaf-duration': string;
  '--leaf-delay': string;
  /* 가로(dx1~4): 시작점(--leaf-start-left) 대비 이동량 — home.css 의 --leaf-area-w
   * (컨테이너 폭)에 대한 %(숫자만). 세로(dy1~4): 같은 뜻의 이동량이지만 vh 값 문자열로
   * 직접 넘긴다 — CSS 커스텀 프로퍼티는 텍스트 그대로 치환되기 때문에, --sheet-top 처럼
   * 내부에 "%"를 포함한 값을 transform 안에서 다시 계산하면 그 "%"가 leaf 자신의
   * 높이(9~15px) 기준으로 잘못 해석된다(home.css 의 --leaf-area-w 주석 참고). 그래서
   * 세로는 처음부터 완결된 vh 문자열로 넘겨 그 문제를 피한다. 아래 vh 값은 뷰포트
   * 높이를 --frame-height(874px) 기준으로, peek 상태 sheet-top(575px) 비율(≈0.658)을
   * 곱해 미리 환산해 둔 값이다. */
  '--leaf-dx1': number;
  '--leaf-dy1': string;
  '--leaf-dx2': number;
  '--leaf-dy2': string;
  '--leaf-dx3': number;
  '--leaf-dy3': string;
  '--leaf-dx4': number;
  '--leaf-dy4': string;
  /* 각 지점의 절대 회전각 — r0→r4 로 90~230deg 정도 천천히 돈다(leaf 마다 방향·크기 다름) */
  '--leaf-r0': string;
  '--leaf-r1': string;
  '--leaf-r2': string;
  '--leaf-r3': string;
  '--leaf-r4': string;
}

/* 오른쪽 위(약 85~108%, -5~18%)에서 등장해 왼쪽 중단~하단(약 -12~25%, 55~90%)으로
 * 바람을 타듯 대각선(↙)으로 흩날린다. 실제로 화면을 가로지르는 시간은 8~14초지만,
 * --leaf-duration(전체 주기)은 그 2배로 잡는다 — home.css 의 leaf-drift 가 앞 절반만
 * 날아가고 뒤 절반은 쉬기 때문이다(주석 참고). 기본 leaf 6장이 각자 다른 duration·delay(서로
 * 1.5~3.5초 차)로 독립적으로 무한 반복하며 서로 다른 위상으로 계속 어긋나기 때문에,
 * 기본 밀도에서는 화면이 완전히 비는 순간 없이 대체로 2~4장이 겹쳐 보인다(실측: 쉬는 구간 없이 두면
 * 대부분 6장이 한꺼번에 보여서 낙엽처럼 과해진다 — 절반씩 쉬어야 적당하다). opacity 는
 * 0.22~0.38 로 옅게, 경유점(dx/dy/rotate)은 leaf 마다 다르게 둬서 같은 길을 반복해서
 * 지나가는 것처럼 보이지 않게 했다. */
const BASE_LEAVES: LeafStyle[] = [
  {
    '--leaf-start-left': '90%',
    '--leaf-start-top': '2%',
    '--leaf-width': '18px',
    '--leaf-height': '11px',
    '--leaf-color': '#DCE9A8',
    '--leaf-opacity': 0.3,
    '--leaf-blur': '0.1px',
    /* 비행 8s × 2 = 16s. 진입 직후 이미 날고 있는 것처럼 음수 delay */
    '--leaf-duration': '16s',
    '--leaf-delay': '-2s',
    '--leaf-dx1': -20, '--leaf-dy1': '9vh',
    '--leaf-dx2': -34, '--leaf-dy2': '10vh',
    '--leaf-dx3': -60, '--leaf-dy3': '27vh',
    '--leaf-dx4': -82, '--leaf-dy4': '40.8vh',
    '--leaf-r0': '0deg', '--leaf-r1': '30deg', '--leaf-r2': '70deg', '--leaf-r3': '120deg', '--leaf-r4': '170deg',
  },
  {
    '--leaf-start-left': '102%',
    '--leaf-start-top': '12%',
    '--leaf-width': '24px',
    '--leaf-height': '15px',
    '--leaf-color': '#C9DFA0',
    '--leaf-opacity': 0.24,
    '--leaf-blur': '0px',
    /* 비행 14s × 2 = 28s */
    '--leaf-duration': '28s',
    '--leaf-delay': '1.5s',
    '--leaf-dx1': -26, '--leaf-dy1': '11vh',
    '--leaf-dx2': -46, '--leaf-dy2': '13vh',
    '--leaf-dx3': -85, '--leaf-dy3': '29vh',
    '--leaf-dx4': -114, '--leaf-dy4': '43.4vh',
    '--leaf-r0': '15deg', '--leaf-r1': '-40deg', '--leaf-r2': '-100deg', '--leaf-r3': '-160deg', '--leaf-r4': '-200deg',
  },
  {
    '--leaf-start-left': '85%',
    '--leaf-start-top': '-3%',
    '--leaf-width': '14px',
    '--leaf-height': '9px',
    '--leaf-color': '#E5EDB8',
    '--leaf-opacity': 0.36,
    '--leaf-blur': '0.15px',
    /* 비행 9.5s × 2 = 19s */
    '--leaf-duration': '19s',
    '--leaf-delay': '3.5s',
    '--leaf-dx1': -14, '--leaf-dy1': '8vh',
    '--leaf-dx2': -22, '--leaf-dy2': '9vh',
    '--leaf-dx3': -48, '--leaf-dy3': '26vh',
    '--leaf-dx4': -67, '--leaf-dy4': '40.1vh',
    '--leaf-r0': '-10deg', '--leaf-r1': '15deg', '--leaf-r2': '45deg', '--leaf-r3': '80deg', '--leaf-r4': '110deg',
  },
  {
    '--leaf-start-left': '107%',
    '--leaf-start-top': '17%',
    '--leaf-width': '22px',
    '--leaf-height': '14px',
    '--leaf-color': '#DCE9A8',
    '--leaf-opacity': 0.26,
    '--leaf-blur': '0px',
    /* 비행 13s × 2 = 26s */
    '--leaf-duration': '26s',
    '--leaf-delay': '6s',
    '--leaf-dx1': -28, '--leaf-dy1': '12vh',
    '--leaf-dx2': -50, '--leaf-dy2': '15vh',
    '--leaf-dx3': -88, '--leaf-dy3': '32vh',
    '--leaf-dx4': -115, '--leaf-dy4': '46.7vh',
    '--leaf-r0': '5deg', '--leaf-r1': '-50deg', '--leaf-r2': '-120deg', '--leaf-r3': '-180deg', '--leaf-r4': '-230deg',
  },
  {
    '--leaf-start-left': '96%',
    '--leaf-start-top': '6%',
    '--leaf-width': '16px',
    '--leaf-height': '10px',
    '--leaf-color': '#C9DFA0',
    '--leaf-opacity': 0.33,
    '--leaf-blur': '0.2px',
    /* 비행 10.5s × 2 = 21s */
    '--leaf-duration': '21s',
    '--leaf-delay': '9s',
    '--leaf-dx1': -18, '--leaf-dy1': '10vh',
    '--leaf-dx2': -30, '--leaf-dy2': '11vh',
    '--leaf-dx3': -66, '--leaf-dy3': '27vh',
    '--leaf-dx4': -94, '--leaf-dy4': '40.8vh',
    '--leaf-r0': '0deg', '--leaf-r1': '35deg', '--leaf-r2': '80deg', '--leaf-r3': '115deg', '--leaf-r4': '150deg',
  },
  {
    '--leaf-start-left': '88%',
    '--leaf-start-top': '-5%',
    '--leaf-width': '20px',
    '--leaf-height': '12px',
    '--leaf-color': '#E5EDB8',
    '--leaf-opacity': 0.28,
    '--leaf-blur': '0.1px',
    /* 비행 12s × 2 = 24s */
    '--leaf-duration': '24s',
    '--leaf-delay': '12.5s',
    '--leaf-dx1': -10, '--leaf-dy1': '7vh',
    '--leaf-dx2': -16, '--leaf-dy2': '8vh',
    '--leaf-dx3': -42, '--leaf-dy3': '25vh',
    '--leaf-dx4': -64, '--leaf-dy4': '39.5vh',
    '--leaf-r0': '-20deg', '--leaf-r1': '-5deg', '--leaf-r2': '25deg', '--leaf-r3': '60deg', '--leaf-r4': '95deg',
  },
];

/* 기본 경로·크기·색은 유지하고 각 잎의 주기를 3등분한 위상으로 복제한다.
 * 같은 위치에서 동시에 겹치지 않으면서 화면에 보이는 평균 잎 수를 6~12장으로 늘린다. */
const LEAF_DENSITY_MULTIPLIER = 3;
const LEAVES: LeafStyle[] = BASE_LEAVES.flatMap((style) => {
  const duration = Number.parseFloat(style['--leaf-duration']);
  const delay = Number.parseFloat(style['--leaf-delay']);

  return Array.from({ length: LEAF_DENSITY_MULTIPLIER }, (_, phase) => ({
    ...style,
    '--leaf-delay': `${delay - (duration / LEAF_DENSITY_MULTIPLIER) * phase}s`,
  }));
});

/** 홈 히어로 안에서만 보이는 가벼운 장식 효과. 입력이나 스크롤에는 관여하지 않는다. */
export function FallingLeaves() {
  return (
    <div className="falling-leaves" aria-hidden="true">
      {LEAVES.map((style, index) => (
        <span className="falling-leaves__path" style={style} key={index}>
          <span className="falling-leaves__leaf" />
        </span>
      ))}
    </div>
  );
}
