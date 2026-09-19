import type { CSSProperties } from 'react';
import type { AdIconPosition, AdSheet } from '../data/adContents';
import { img } from '../lib/asset';

/* 광고 아이콘 — 2×2 아이콘 시트 6장(public/assets/img/ads/)을 그대로 CSS sprite 로 쓴다.
 * 개별 파일로 자르거나 색·크기를 손대지 않는다. 시트 전체를 background-image 로 깔고
 * background-size / background-position 만 바꿔 한 칸만 보이게 한다. 홈 카드와 상세
 * 바텀시트가 같은 시트를 쓰고 컨테이너 크기(width)만 다르다 — 높이는 aspect-ratio 로 정사각형을
 * 유지한다(창이 정사각형이라 컨테이너도 정사각형이어야 한다).
 *
 * 기본은 시트를 4등분한 칸(200% 200%, left/right top/bottom)이지만, 실제 시트는 아이콘이 칸
 * 안에 딱 맞지 않는다 — 02 의 카드·06 의 박스는 중앙선을 넘고, 01·03·05·06 은 위쪽 아이콘의
 * 그림자가 아래 칸 윗줄에 걸쳐 옅은 선으로 보인다. 그래서 아이콘마다 "보여줄 창"을
 * 시트 px 좌표(x, y, 한 변)로 실측해 두고, 그 창이 그대로 보이도록 size/position 값만 계산한다
 * (실측: 알파 > 12 픽셀의 연결 성분 경계 + 약 5% 여백, 창 안에 다른 아이콘 픽셀이 없는 것을 확인).
 * 창이 시트 안에 있으므로 원본 이미지는 자르지도 바꾸지도 않는다. */

const SHEET_PX = 1254;

const SHEET_FILE: Record<AdSheet, string> = {
  life: '01_daily_life_icons.png',
  money: '02_money_management_icons.png',
  grocery: '03_grocery_icons.png',
  housing: '04_moving_housing_icons.png',
  interior: '05_interior_icons.png',
  alone: '06_living_alone_icons.png',
};

/** [x, y, 한 변] — 시트(1254×1254) 안에서 이 아이콘이 보이는 정사각형 창 */
type SheetWindow = readonly [number, number, number];

const WINDOW: Record<AdSheet, Record<AdIconPosition, SheetWindow>> = {
  life: {
    'top-left': [66, 56, 583],
    'top-right': [620, 38, 622],
    'bottom-left': [58, 630, 572],
    'bottom-right': [633, 639, 570],
  },
  money: {
    'top-left': [74, 61, 586],
    'top-right': [687, 88, 535],
    'bottom-left': [69, 614, 589],
    'bottom-right': [711, 645, 527],
  },
  grocery: {
    'top-left': [39, 64, 612],
    'top-right': [648, 118, 584],
    'bottom-left': [51, 640, 558],
    'bottom-right': [615, 636, 608],
  },
  housing: {
    'top-left': [93, 87, 542],
    'top-right': [647, 60, 584],
    'bottom-left': [62, 640, 579],
    'bottom-right': [652, 630, 592],
  },
  interior: {
    'top-left': [52, 42, 594],
    'top-right': [631, 51, 604],
    'bottom-left': [74, 618, 589],
    'bottom-right': [678, 631, 576],
  },
  alone: {
    'top-left': [0, 46, 664],
    'top-right': [634, 57, 620],
    'bottom-left': [100, 685, 494],
    'bottom-right': [653, 651, 583],
  },
};

const percent = (value: number) => `${Math.round(value * 100) / 100}%`;

interface AdIconProps {
  sheet: AdSheet;
  position: AdIconPosition;
  /** 광고 내용을 설명하는 대표 이미지라 장식이 아니다 — 스크린리더용 이름 */
  label: string;
  /** 크기(width)는 여기서 정한다 */
  className?: string;
}

export function AdIcon({ sheet, position, label, className }: AdIconProps) {
  const [x, y, side] = WINDOW[sheet][position];
  /* background-position 의 % 는 (컨테이너 − 이미지) 기준이라, 창의 왼쪽 위가 x, y 가 되려면
   * x / (시트 − 창) 이 된다. size 는 시트가 창의 몇 배로 커져야 창이 컨테이너를 채우는지다. */
  const style: CSSProperties = {
    display: 'block',
    aspectRatio: '1 / 1',
    backgroundImage: `url(${img(`ads/${SHEET_FILE[sheet]}`)})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: percent((SHEET_PX / side) * 100),
    backgroundPosition: `${percent((x / (SHEET_PX - side)) * 100)} ${percent((y / (SHEET_PX - side)) * 100)}`,
  };
  return <span className={className} role="img" aria-label={label} style={style} />;
}
