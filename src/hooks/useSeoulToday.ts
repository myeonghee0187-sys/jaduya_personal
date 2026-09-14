import { useEffect, useState } from 'react';

/* 오늘부터 며칠치 날짜 — 화면에 그대로 찍을 'MM.DD 요일' 과 그 날의 한 줄 꿀팁을 만든다.
 *
 * 기기 시간대와 무관하게 항상 한국 시간(Asia/Seoul)을 기준으로 한다.
 * 외부 라이브러리 없이 Intl.DateTimeFormat 과 Date.UTC 만 쓴다. */

const TIME_ZONE = 'Asia/Seoul';

/** 0 = 일요일 — Date 의 getUTCDay() 순서 그대로다 */
const WEEKDAY_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/* 날짜마다 하나씩 붙는 짧은 꿀팁. 같은 날짜면 언제 새로고침해도 같은 팁이 나온다. */
const TIPS = [
  '냉장고는 70%만',
  '빨래는 바로 꺼내요',
  '송장은 떼고 버려요',
  '환기 10분 해봐요',
  '냉장고 사진 찍기',
  '음식물 물기 빼기',
  '세탁기 문 열어두기',
  '수건은 완전히 말리기',
  '장보기 목록 챙기기',
  '멀티탭 먼지 체크',
  '고정비 한번 확인',
  '식재료 먼저 확인',
];

/* 하루 지날 때마다 5칸씩 건너뛴다 — 12 와 서로소라 연속한 날에 같은 팁이 겹치지 않는다 */
const TIP_STEP = 5;

export interface SeoulDay {
  /** 'MM.DD 요일' (예: 09.14 월요일) */
  date: string;
  /** 그 날짜의 한 줄 꿀팁 */
  tip: string;
}

/* 서울 기준의 월/일/요일과 시:분:초를 한 번에 뽑는다 —
 * 자정까지 남은 시간도 같은 시각에서 계산해야 어긋나지 않는다. */
function seoulParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>;
}

/* 서울 기준 오늘을 '달력상의 날짜' 로 바꾼다 — 여기서부터는 시간대를 신경 쓰지 않고
 * UTC 자정 기준으로만 더하고 빼면 월말·연말도 Date 가 알아서 넘겨 준다. */
function seoulMidnightUTC(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const ymd = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(ymd.year), Number(ymd.month) - 1, Number(ymd.day));
}

/** 'MM.DD 요일' (예: 09.14 월요일) — offset 일수만큼 뒤의 날짜 */
export function formatSeoulToday(now: Date = new Date(), offsetDays = 0): string {
  const date = new Date(seoulMidnightUTC(now) + offsetDays * 86400000);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${month}.${day} ${WEEKDAY_KO[date.getUTCDay()]}`;
}

/** 오늘부터 count 일치 — 날짜와 그 날의 꿀팁 */
export function seoulDays(now: Date = new Date(), count = 4): SeoulDay[] {
  const base = seoulMidnightUTC(now);
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(base + offset * 86400000);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    /* 1970-01-01 부터 며칠째인지 — 날짜가 같으면 항상 같은 팁이 나온다 */
    const dayNumber = Math.floor(date.getTime() / 86400000);
    const tip = TIPS[(((dayNumber * TIP_STEP) % TIPS.length) + TIPS.length) % TIPS.length];
    return { date: `${month}.${day} ${WEEKDAY_KO[date.getUTCDay()]}`, tip };
  });
}

/** 서울 기준 다음 자정까지 남은 ms */
function msUntilSeoulMidnight(now: Date = new Date()): number {
  const { hour, minute, second } = seoulParts(now);
  /* 자정을 '24' 로 주는 환경이 있어 24 시는 0 시로 본다 */
  const h = Number(hour) % 24;
  const m = Number(minute);
  const s = Number(second);
  const left = ((23 - h) * 3600 + (59 - m) * 60 + (60 - s)) * 1000;
  /* 경계에서 한 번 더 되도록 1초 여유를 둔다 */
  return left + 1000;
}

/** 화면에 표시할 오늘부터 count 일치.
 * 자정이 지나면 한 번만 다시 계산한다(주기적 폴링 없음) — 네 날짜가 함께 하루씩 밀린다. */
export function useSeoulDays(count = 4): SeoulDay[] {
  const [days, setDays] = useState(() => seoulDays(new Date(), count));

  useEffect(() => {
    let timer = 0;
    const scheduleNextMidnight = () => {
      timer = window.setTimeout(() => {
        setDays(seoulDays(new Date(), count));
        scheduleNextMidnight();
      }, msUntilSeoulMidnight());
    };
    scheduleNextMidnight();
    return () => window.clearTimeout(timer);
  }, [count]);

  return days;
}
