import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { getLivingQuizByPersona } from '../data/livingQuizData';
import type { LivingQuizData, LivingQuizOption } from '../data/livingQuizData';
import { useMyMenu } from '../menu/MyMenuContext';
import { img } from '../lib/asset';

/* 생활 카테고리 4종 — 이미지는 정사각 원본이라 카드 안에서 크롭 위치를 따로 잡는다.
 * (modifier 로 life.css 에서 top/left/height 를 지정) */
const CATEGORIES = [
  { key: 'first', title: '첫 자취', sub: '방 구하기부터 정착까지', file: 'first_home.png' },
  { key: 'homecare', title: '홈케어', sub: '문제 확인부터 해결까지', file: 'homecare.png' },
  { key: 'house', title: '살림', sub: '청소부터 분리배출까지', file: 'housekeeping.png' },
  { key: 'food', title: '먹거리', sub: '보관부터 한 끼까지', file: 'food.png' },
] as const;

/* 해결팁 — 배열 순서가 곧 화면 순서. 가운데로 온 카드가 강조 카드가 된다.
 * 카드를 더 넣거나 빼면 캐러셀 복제·페이지네이션이 알아서 따라간다.
 * situation(무슨 상황인지) → title(무엇부터 하면 되는지) → meta(품이 얼마나 드는지) 순서다. */
const TIPS = [
  {
    key: 'mold',
    image: 'tip_mold.png',
    situation: '창틀에 곰팡이가 생겨요',
    title: ['닦기 전에', '결로 원인부터 확인해요'],
    meta: '5분 · 환기 체크',
  },
  {
    key: 'food-waste',
    image: 'tip_food_waste.png',
    situation: '음식물 쓰레기 냄새가 심해요',
    title: ['물기 빼고', '밀폐 보관부터 해보세요'],
    meta: '3분 · 냄새 감소',
  },
  {
    key: 'laundry',
    image: 'tip_laundry.png',
    situation: '빨래에서 꿉꿉한 냄새가 나요',
    title: ['세제보다', '말리는 간격부터 바꿔보세요'],
    meta: '바로 실천 · 추가비용 거의 없음',
  },
  {
    key: 'utility',
    image: 'tip_utility.png',
    situation: '관리비가 갑자기 많이 나와요',
    title: ['전기·수도·가스', '3가지부터 비교해보세요'],
    meta: '10분 · 고지서 확인',
  },
] as const;

/* 해결팁 캐러셀 — 슬라이더 중심에서 멀어질수록 카드가 작아진다.
 * 0.87 은 15px 본문이 축소돼도 최소 13px 을 지키는 값이다. */
const TIP_SCALE_MIN = 0.91;
/* 옆 카드는 뒤에 있는 것처럼 흐려진다 — 형태는 알아볼 수 있는 선까지만 */
const TIP_OPACITY_MIN = 0.55;
const TIP_BLUR_MAX = 1.8;
const TIP_SNAP_DURATION = 320;
/* 이만큼 가로로 끌어야 옆 카드로 넘어간다. 그 아래는 제자리로 돌아온다 */
const TIP_SWIPE_THRESHOLD = 45;
/* 가로가 세로보다 이만큼 커야 캐러셀 제스처로 본다 — 세로 스크롤을 뺏지 않으려는 값 */
const TIP_AXIS_RATIO = 1.4;

/* 양 끝에 복제 카드를 한 장씩 붙여 순환시킨다.
 * head(마지막 카드 복제)는 최초 진입에서만 감춰 두고, 사용자가 한 번 움직이면 loop 에 합류한다. */
const TIP_SLIDES = [
  { ...TIPS[TIPS.length - 1], slideKey: 'clone-head', edge: 'head' as const },
  ...TIPS.map((tip) => ({ ...tip, slideKey: tip.key, edge: null })),
  { ...TIPS[0], slideKey: 'clone-tail', edge: 'tail' as const },
];

/* 복제를 뺀 실제 카드 수 — loop 보정과 pagination 이 모두 이 값을 쓴다 */
const TIP_REAL_COUNT = TIP_SLIDES.filter((slide) => !slide.edge).length;

/* 오늘의 자취 스낵퀴즈 — 문제는 data/lifeSnackQuiz 에서 읽고,
 * 답을 고른 뒤에 결과 한 줄과 짧은 설명만 보여준다. */
/* 한 번 낸 답은 새로고침해도 그대로 둔다 */
const QUIZ_STORE_KEY = 'jaduya.life.snack-quiz';

type QuizSaved = {
  quizId: string;
  answer: string;
  correct: boolean;
  submitted: boolean;
};

/* 저장된 답 — 지금 배열에 있는 문제의 보기와 맞을 때만 인정한다
 * (문제가 바뀌거나 보기가 수정되면 저장값을 버리고 처음부터 푼다) */
function readQuizSaved(quiz: LivingQuizData): QuizSaved | null {
  try {
    const raw = localStorage.getItem(QUIZ_STORE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<QuizSaved>;
    if (saved.quizId !== quiz.id || !saved.answer || !quiz.options.some((option) => option.id === saved.answer)) {
      return null;
    }
    const selectedOption = quiz.options.find((option) => option.id === saved.answer);
    return {
      quizId: quiz.id,
      answer: saved.answer,
      correct: selectedOption?.isCorrect ?? false,
      submitted: true,
    };
  } catch {
    /* 시크릿 창처럼 저장소를 못 읽거나 값이 깨졌으면 처음 푸는 것으로 본다 */
    return null;
  }
}

/* 생활 메인 — 탭바 '생활' 로 들어오는 메인 화면.
 * 목적: 자취하다 막혔을 때 필요한 생활 정보를 카테고리 / 퀴즈 / 해결팁으로 빠르게 찾게 한다.
 * 하위 상세 화면은 아직 없으므로 route 를 만들지 않는다. */
export function LifePage() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const quiz = getLivingQuizByPersona(user?.persona);
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const tipsRef = useRef<HTMLDivElement>(null);
  /* 캐러셀 내부의 앞뒤 이동 — 좌우 버튼이 이걸 부른다 */
  const tipNextRef = useRef<(() => void) | null>(null);
  const tipPrevRef = useRef<(() => void) | null>(null);
  /* 퀴즈: 답을 고르기 전에는 결과를 감춰 둔다.
   * 저장된 답이 있으면 결과가 끝난 모습 그대로 시작한다 (애니메이션 없이). */
  const [restoredSaved] = useState(() => readQuizSaved(quiz));
  const solved = restoredSaved !== null;
  const [quizAnswer, setQuizAnswer] = useState<string | null>(restoredSaved?.answer ?? null);
  const [quizRevealed, setQuizRevealed] = useState(solved);
  const [quizDragging, setQuizDragging] = useState(false);
  const [quizOver, setQuizOver] = useState<string | null>(null);
  const [quizEggGone, setQuizEggGone] = useState(solved);
  const [quizEggCracked, setQuizEggCracked] = useState(solved);
  const eggRef = useRef<HTMLDivElement>(null);
  const eggStart = useRef({ x: 0, y: 0 });
  const eggHeld = useRef(false);
  const zoneRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const previousQuizIdRef = useRef(quiz.id);
  /* 해결팁 pagination — 복제를 뺀 실제 카드 번호 */
  const [tipPage, setTipPage] = useState(0);

  /* 계정/persona가 바뀌면 이전 문제의 선택·결과·드래그 상태를 새 문제로 넘기지 않는다. */
  useLayoutEffect(() => {
    if (previousQuizIdRef.current === quiz.id) return;
    previousQuizIdRef.current = quiz.id;
    setQuizAnswer(null);
    setQuizRevealed(false);
    setQuizDragging(false);
    setQuizOver(null);
    setQuizEggGone(false);
    setQuizEggCracked(false);
    eggHeld.current = false;
    try {
      localStorage.removeItem(QUIZ_STORE_KEY);
    } catch {
      /* 저장소를 사용할 수 없어도 화면 상태 초기화는 유지한다 */
    }
  }, [quiz.id]);

  /* 해결팁 캐러셀 — 가운데에 가까울수록 큰 카드다.
   * 넘기는 방법은 좌우 버튼 / 방향키 / 손가락 스와이프 세 가지이고 모두 같은 이동 함수를 쓴다.
   * 스와이프는 '가로가 세로보다 확실히 클 때' 만 캐러셀 제스처로 보고, 그 전까지는
   * 아무것도 가로채지 않아서 위아래 스크롤이 그대로 페이지로 간다(CSS touch-action: pan-y). */
  useEffect(() => {
    const rail = tipsRef.current;
    if (!rail) return;
    const cards = () => Array.from(rail.children) as HTMLElement[];
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    /* 카드 중심과 슬라이더 중심의 거리(카드 한 칸 = 1)로 scale 을 보간한다 */
    const paint = () => {
      const list = cards();
      if (!list.length) return;
      const step = list.length > 1 ? list[1].offsetLeft - list[0].offsetLeft : list[0].offsetWidth;
      const center = rail.scrollLeft + rail.clientWidth / 2;
      list.forEach((card, index) => {
        const gap = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        const distance = Math.min(gap / step, 1);
        card.style.transform = `scale(${1 - (1 - TIP_SCALE_MIN) * distance})`;
        card.style.opacity = String(1 - (1 - TIP_OPACITY_MIN) * distance);
        /* blur 는 카드가 아니라 이미지에만 건다 — 카드 밖으로 번지지 않게 */
        card.style.setProperty('--tip-blur', `${(TIP_BLUR_MAX * distance).toFixed(2)}px`);
        /* 가운데 카드가 항상 앞에 온다 */
        card.style.zIndex = String(Math.round((1 - distance) * 10));
        /* pagination 은 카드가 확실히 가운데에 들어왔을 때만 바꿔 드래그 중 깜빡이지 않게 한다.
         * 복제 카드는 같은 내용의 진짜 카드 번호로 환산한다. */
        if (distance < 0.35) {
          setTipPage((index - 1 + TIP_REAL_COUNT) % TIP_REAL_COUNT);
        }
      });
    };

    /* 최초 진입에서는 왼쪽 복제 카드를 감춰 1번 카드가 첫 카드처럼 보이게 하고,
     * 사용자가 한 번이라도 움직이면 그때부터 완전한 순환으로 바꾼다. */
    let ready = false;
    let looping = false;
    const enableLoop = () => {
      if (looping) return;
      looping = true;
      rail.classList.add('is-loop');
    };

    let gliding = false;

    /* 복제 카드에 멈췄으면 같은 내용의 진짜 카드 위치로 소리 없이 옮긴다 */
    const fixLoop = () => {
      const list = cards();
      const last = list.length - 1;
      if (!looping || list.length < 3) return;
      const { index, gap } = nearest();
      if ((index !== 0 && index !== last) || gap > 2) return;
      const step = list[1].offsetLeft - list[0].offsetLeft;
      rail.style.scrollSnapType = 'none';
      rail.scrollLeft += (index === 0 ? 1 : -1) * TIP_REAL_COUNT * step;
      paint();
      /* 위치를 옮긴 다음 프레임에 snap 을 되돌린다 (같은 자리라 튀지 않는다) */
      requestAnimationFrame(() => {
        if (!gliding) rail.style.scrollSnapType = '';
      });
    };

    let ticking = false;
    let idleTimer = 0;
    const onScroll = () => {
      /* 터치 스와이프·트랙패드 등 모든 사용자 스크롤이 loop 을 켠다 */
      if (ready) enableLoop();
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          paint();
        });
      }
      /* 관성이 멎은 뒤에만 경계를 보정한다 */
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (!gliding) fixLoop();
      }, 140);
    };

    /* 놓았을 때 가장 가까운 카드를 정확히 가운데로 붙인다 */
    let snapFrame = 0;
    const glideTo = (to: number) => {
      cancelAnimationFrame(snapFrame);
      gliding = true;
      const from = rail.scrollLeft;
      const delta = to - from;
      const settle = () => {
        gliding = false;
        rail.style.scrollSnapType = '';
        fixLoop();
      };
      if (reduceMotion || Math.abs(delta) < 1) {
        rail.scrollLeft = to;
        settle();
        paint();
        return;
      }
      let start = 0;
      const move = (now: number) => {
        if (!start) start = now;
        const progress = Math.min((now - start) / TIP_SNAP_DURATION, 1);
        /* cubic-bezier(0.22, 1, 0.36, 1) 과 비슷한 ease-out */
        rail.scrollLeft = from + delta * (1 - Math.pow(1 - progress, 5));
        if (progress < 1) snapFrame = requestAnimationFrame(move);
        else settle();
      };
      snapFrame = requestAnimationFrame(move);
    };

    const centerOf = (card: HTMLElement) =>
      card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;

    const nearest = () => {
      const center = rail.scrollLeft + rail.clientWidth / 2;
      const list = cards();
      let index = 0;
      let gap = Infinity;
      list.forEach((card, at) => {
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (distance < gap) {
          gap = distance;
          index = at;
        }
      });
      return { index, gap };
    };

    const goTo = (index: number) => {
      const list = cards();
      const card = list[Math.min(Math.max(index, 0), list.length - 1)];
      if (!card) return;
      rail.style.scrollSnapType = 'none';
      glideTo(centerOf(card));
    };

    /* 좌우 버튼이 부르는 이동 — 양끝은 복제 카드를 지나 반대쪽으로 이어진다 */
    const step = (direction: 1 | -1) => {
      /* 이동하는 중에는 입력만 무시한다 — 버튼을 숨기거나 흐리게 만들지 않는다 */
      if (gliding) return;
      enableLoop();
      goTo(nearest().index + direction);
    };
    tipNextRef.current = () => step(1);
    tipPrevRef.current = () => step(-1);

    /* ---------- 손가락/마우스 스와이프 ----------
     * axis 가 정해지기 전에는 아무것도 하지 않는다. 세로로 먼저 움직이면 그 제스처는
     * 끝까지 무시해서 페이지 스크롤을 방해하지 않는다. */
    let swipe: {
      id: number;
      startX: number;
      startY: number;
      scroll: number;
      /* 손을 대기 전에 가운데 있던 카드 — 뗄 때 이 번호 기준으로 ±1 만 움직인다 */
      startIndex: number;
      axis: 'none' | 'x' | 'y';
    } | null = null;

    /* 카드 한 칸의 폭(카드 + gap) — 드래그를 이만큼으로 묶어 옆 카드를 지나치지 않게 한다 */
    const cardStep = () => {
      const list = cards();
      return list.length > 1 ? list[1].offsetLeft - list[0].offsetLeft : list[0]?.offsetWidth ?? 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (gliding) return;
      swipe = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scroll: rail.scrollLeft,
        startIndex: nearest().index,
        axis: 'none',
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!swipe || swipe.id !== event.pointerId || swipe.axis === 'y') return;
      const dx = event.clientX - swipe.startX;
      const dy = event.clientY - swipe.startY;

      if (swipe.axis === 'none') {
        /* 아직 방향이 안 정해졌다 — 충분히 움직인 뒤에 가로/세로를 가른다 */
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dx) <= Math.abs(dy) * TIP_AXIS_RATIO) {
          swipe.axis = 'y';
          return;
        }
        swipe.axis = 'x';
        enableLoop();
        cancelAnimationFrame(snapFrame);
        rail.style.scrollSnapType = 'none';
        try {
          rail.setPointerCapture(event.pointerId);
        } catch {
          /* 캡처가 안 되어도 스와이프 자체는 그대로 동작한다 */
        }
      }

      /* 손가락을 따라 움직이되 한 칸 폭까지만 — 세게 밀어도 옆 카드를 지나치지 않는다 */
      const limit = cardStep();
      const followed = Math.max(-limit, Math.min(limit, dx));
      rail.scrollLeft = swipe.scroll - followed;
    };

    const endSwipe = (event: PointerEvent) => {
      if (!swipe || swipe.id !== event.pointerId) return;
      const { axis, startX, startIndex } = swipe;
      const dx = event.clientX - startX;
      swipe = null;
      if (axis !== 'x') return;
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
      /* 이동 결정은 손을 뗄 때 딱 한 번 한다. 기준은 '지금 어디까지 밀렸는지' 가 아니라
       * '손을 대기 전 카드' 라서, 아무리 세게 밀어도 한 장보다 많이 넘어가지 않는다.
       * 문턱을 못 넘으면 원래 카드로 되돌아온다 — 버튼과 같은 glideTo 를 쓴다. */
      const direction = Math.abs(dx) >= TIP_SWIPE_THRESHOLD ? (dx < 0 ? 1 : -1) : 0;
      goTo(startIndex + direction);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      /* 방향키로 왼쪽 끝을 넘어갈 수 있어야 하므로 이동 전에 loop 을 켠다 */
      enableLoop();
      goTo(nearest().index + (event.key === 'ArrowRight' ? 1 : -1));
    };

    rail.addEventListener('scroll', onScroll, { passive: true });
    rail.addEventListener('keydown', onKeyDown);
    rail.addEventListener('pointerdown', onPointerDown);
    rail.addEventListener('pointermove', onPointerMove);
    rail.addEventListener('pointerup', endSwipe);
    rail.addEventListener('pointercancel', endSwipe);
    window.addEventListener('resize', paint);

    /* 처음에는 1번 카드(head 복제 다음 칸)를 가운데에 둔다 */
    const first = cards()[1];
    if (first) rail.scrollLeft = centerOf(first);
    paint();
    /* 초기 위치를 잡느라 발생한 scroll 은 사용자 조작으로 세지 않는다 */
    requestAnimationFrame(() => {
      ready = true;
    });

    return () => {
      cancelAnimationFrame(snapFrame);
      window.clearTimeout(idleTimer);
      rail.removeEventListener('scroll', onScroll);
      rail.removeEventListener('keydown', onKeyDown);
      rail.removeEventListener('pointerdown', onPointerDown);
      rail.removeEventListener('pointermove', onPointerMove);
      rail.removeEventListener('pointerup', endSwipe);
      rail.removeEventListener('pointercancel', endSwipe);
      window.removeEventListener('resize', paint);
      tipNextRef.current = null;
      tipPrevRef.current = null;
    };
  }, []);

  /* 드래그로 놓든 탭으로 고르든 답변 처리는 이 하나를 쓴다 */
  const answerQuiz = (option: LivingQuizOption) => {
    if (quizAnswer) return;
    setQuizAnswer(option.id);
    setQuizOver(null);
    try {
      const saved: QuizSaved = {
        quizId: quiz.id,
        answer: option.id,
        correct: option.isCorrect,
        submitted: true,
      };
      localStorage.setItem(QUIZ_STORE_KEY, JSON.stringify(saved));
    } catch {
      /* 저장을 못 해도 이번 화면에서는 결과가 그대로 보인다 */
    }
  };

  /* '다시 풀기' — 저장된 답과 화면 상태를 함께 처음으로 돌린다 */
  const resetQuiz = () => {
    try {
      localStorage.removeItem(QUIZ_STORE_KEY);
    } catch {
      /* 지우지 못해도 이번 화면은 초기 상태로 돌아간다 */
    }
    setQuizAnswer(null);
    setQuizRevealed(false);
    setQuizEggGone(false);
    setQuizEggCracked(false);
    setQuizDragging(false);
    setQuizOver(null);
    moveEgg(0, 0);
  };

  /* 고른 자리를 먼저 보여주고 잠깐 뒤에 결과를 연다 */
  useEffect(() => {
    if (!quizAnswer || quizRevealed) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const clearEgg = window.setTimeout(() => setQuizEggGone(true), reduceMotion ? 0 : 200);
    const reveal = window.setTimeout(() => setQuizRevealed(true), reduceMotion ? 0 : 220);
    return () => {
      window.clearTimeout(clearEgg);
      window.clearTimeout(reveal);
    };
  }, [quizAnswer]);

  const zoneAt = (x: number, y: number): LivingQuizOption | null =>
    quiz.options.find((option) => {
      const box = zoneRefs.current[option.id]?.getBoundingClientRect();
      return !!box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    }) ?? null;

  const moveEgg = (x: number, y: number) => {
    const egg = eggRef.current;
    if (!egg) return;
    egg.style.setProperty('--egg-x', `${x}px`);
    egg.style.setProperty('--egg-y', `${y}px`);
  };

  const onEggDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (quizAnswer) return;
    eggStart.current = { x: event.clientX, y: event.clientY };
    eggHeld.current = true;
    setQuizEggCracked(true);
    setQuizDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* 포인터 캡처를 지원하지 않아도 드래그 자체는 유지한다 */
    }
  };

  const onEggMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!eggHeld.current) return;
    moveEgg(event.clientX - eggStart.current.x, event.clientY - eggStart.current.y);
    setQuizOver(zoneAt(event.clientX, event.clientY)?.id ?? null);
  };

  const onEggUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!eggHeld.current) return;
    eggHeld.current = false;
    setQuizDragging(false);
    const dropped = zoneAt(event.clientX, event.clientY);
    moveEgg(0, 0);
    if (dropped) answerQuiz(dropped);
    else setQuizOver(null);
  };

  /* 결과 문구가 여러 곳에서 같은 판정을 봐야 해서 한 번만 계산한다 */
  const quizCorrect = quiz.options.find((option) => option.id === quizAnswer)?.isCorrect ?? false;
  const correctDetail = quiz.correctFeedback.replace(/^정답이에요!\s*/, '');
  const incorrectDetail = quiz.incorrectFeedback.replace(/^아쉬워요!\s*/, '');

  return (
    <div className="life app">
      <SubPageHeader
        title="생활"
        backLabel="홈으로"
        onBack={() => navigation?.goBack('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="life__scroll">
        {/* ================= ① 생활 카테고리 ================= */}
        <section className="life-category">
          <div className="life-category__head">
            <h2>생활</h2>
            <p>
              자취하다 막힐 때, 필요한 생활정보를 빠르게 찾아보세요.
            </p>
          </div>

          <div className="life-category__grid">
            {CATEGORIES.map((item) => (
              <button
                key={item.key}
                type="button"
                className="life-category__card"
                aria-label={`${item.title} — ${item.sub}`}
                /* 네 카테고리 모두 화면이 있다 */
                onClick={
                  item.key === 'first'
                    ? () => navigation?.navigate('life-first')
                    : item.key === 'homecare'
                      ? () => navigation?.navigate('life-homecare')
                      : item.key === 'house'
                        ? () => navigation?.navigate('life-house')
                        : item.key === 'food'
                          ? () => navigation?.navigate('life-eat')
                          : undefined
                }
              >
                <span className={`life-category__thumb life-category__thumb--${item.key}`}>
                  <img src={img(`life/${item.file}`)} alt="" />
                </span>
                <span className="life-category__title">{item.title}</span>
                <span className="life-category__sub">{item.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ================= ② 생활 퀴즈 ================= */}
        <section className="life-quiz">
          <div className="life-quiz__head">
            <h2>오늘의 퀴즈</h2>
          </div>

          <div className="life-quiz__result">
            <p className="life-quiz__question">{quiz.question}</p>

            {quiz.visualKey === 'egg' && (
              <div
                className={`life-quiz__intro${quizEggGone ? ' is-gone' : ''}`}
                aria-hidden={quizEggGone || undefined}
              >
                <div className="life-quiz__intro-inner">
                  <div className="life-quiz__egg-row">
                    <div
                      ref={eggRef}
                      className={`life-quiz__egg${quizDragging ? ' is-dragging' : ''}${
                        quizEggCracked ? ' is-cracked' : ''
                      }${quizAnswer ? ' is-done' : ''}`}
                      style={
                        quizAnswer
                          ? ({
                              '--egg-drop': quizAnswer === quiz.options[0]?.id ? '-56px' : '56px',
                            } as CSSProperties)
                          : undefined
                      }
                      onPointerDown={onEggDown}
                      onPointerMove={onEggMove}
                      onPointerUp={onEggUp}
                      onPointerCancel={onEggUp}
                    >
                      <span className="life-quiz__egg-stack">
                        <img
                          className="life-quiz__egg-img life-quiz__egg-img--whole"
                          src={img('life/life-quiz_egg.png')}
                          alt="계란"
                          draggable={false}
                        />
                        <img
                          className="life-quiz__egg-img life-quiz__egg-img--cracked"
                          src={img('life/life-quiz-eggshell.png')}
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                        />
                      </span>
                    </div>
                  </div>
                  <p className={`life-quiz__guide${quizAnswer ? ' is-gone' : ''}`}>
                    계란을 끌어서 알맞은 곳에 넣어보세요
                  </p>
                </div>
              </div>
            )}

            <div className="life-quiz__labels">
              {quiz.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  ref={(node) => {
                    zoneRefs.current[option.id] = node;
                  }}
                  className={`life-quiz__choice${quizAnswer === option.id ? ' is-picked' : ''}${
                    quizOver === option.id ? ' is-over' : ''
                  }`}
                  aria-pressed={quizAnswer === option.id}
                  disabled={quizAnswer !== null}
                  onClick={() => answerQuiz(option)}
                >
                  {quizAnswer === option.id ? (
                    <svg
                      className="life-quiz__check"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                  {option.label}
                </button>
              ))}
            </div>

            {/* 결과는 답을 고른 뒤에만 공개한다 — 결과 한 줄과 짧은 설명까지가 전부다 */}
            {quizRevealed && (
              <div className="life-quiz__reveal" role="status">
                <p className={`life-quiz__headline${quizCorrect ? ' is-correct' : ''}`}>
                  {quizCorrect ? '정답이에요!' : '아쉬워요!'}
                </p>
                <p className="life-quiz__why">
                  {quizCorrect ? correctDetail : `${incorrectDetail} ${correctDetail}`}
                </p>

                <div className="life-quiz__actions">
                  <button type="button" className="life-quiz__retry" onClick={resetQuiz}>
                    <svg
                      className="life-quiz__retry-icon"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 6a4 4 0 1 1-1.2-2.85"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.2 1.6v2.2H8"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    다시 풀기
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= ③ 자취생들의 해결팁 ================= */}
        <section className="life-tips">
          <div className="life-tips__head">
            <h2>자취생들의 해결팁</h2>
            <p>혼자 사는 게 처음이어도, 이렇게 하면 좀 더 쉬워요!</p>
          </div>
          <div className="life-tips__stage">
            <div
              className="life-tips__rail"
              ref={tipsRef}
              tabIndex={0}
              role="group"
              aria-label="자취생들의 해결팁 — 좌우 방향키로 넘길 수 있어요"
            >
              {TIP_SLIDES.map((tip) => (
                <article
                  key={tip.slideKey}
                  className={`life-tip${tip.edge ? ` life-tip--clone life-tip--${tip.edge}-clone` : ''}`}
                  /* 복제 카드는 보조기술에 같은 내용이 두 번 읽히지 않게 감춘다 */
                  aria-hidden={tip.edge ? true : undefined}
                >
                  <img
                    className="life-tip__image"
                    src={img(`life/${tip.image}`)}
                    alt=""
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                  />
                  <span className="life-tip__veil" />
                  <p className="life-tip__meta">{tip.meta}</p>
                  <div className="life-tip__body">
                    <p className="life-tip__situation">{tip.situation}</p>
                    <p className="life-tip__title">
                      {tip.title[0]}
                      <br />
                      {tip.title[1]}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {/* 카드를 끌어서 넘기지 않으므로 넘기는 조작은 이 두 버튼이 전부다.
             * 가운데 카드와 옆 카드 사이 여백에 서로 대칭으로 선다 */}
            <button
              type="button"
              className="life-tips__nav life-tips__nav--prev"
              aria-label="이전 해결팁 보기"
              onClick={() => tipPrevRef.current?.()}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="life-tips__nav life-tips__nav--next"
              aria-label="다음 해결팁 보기"
              onClick={() => tipNextRef.current?.()}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          {/* 지금 몇 번째 팁인지만 알려주는 표시 — 복제 카드는 세지 않는다 */}
          <div className="life-tips__pager">
            {TIPS.map((tip, index) => (
              <span
                key={tip.key}
                className={`life-tips__dot${index === tipPage ? ' is-active' : ''}`}
              />
            ))}
            <span className="life-tips__status" aria-live="polite">
              현재 해결팁 {tipPage + 1} / 전체 {TIP_REAL_COUNT}
            </span>
          </div>
        </section>
      </main>

      <BottomNavigation activeTab="life" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />
    </div>
  );
}

export default LifePage;
