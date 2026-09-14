import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { greetingName } from '../data/personaHome';
import { SNACK_QUIZZES } from '../data/lifeSnackQuiz';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon, img } from '../lib/asset';

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
const TIP_SNAP_DURATION = 420;

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
function readQuizSaved(): QuizSaved | null {
  try {
    const raw = localStorage.getItem(QUIZ_STORE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<QuizSaved>;
    const quiz = SNACK_QUIZZES.find((item) => item.id === saved.quizId);
    if (!quiz || !saved.answer || !quiz.options.some((option) => option === saved.answer)) {
      return null;
    }
    return {
      quizId: quiz.id,
      answer: saved.answer,
      correct: saved.answer === quiz.correctAnswer,
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
  /* 인사말 이름은 Home·마이페이지와 같은 기준을 쓴다 (성 제외) */
  const name = greetingName(user?.name ?? '자두');
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const tipsRef = useRef<HTMLDivElement>(null);
  /* 캐러셀 내부의 앞뒤 이동 — 좌우 버튼이 이걸 부른다 */
  const tipNextRef = useRef<(() => void) | null>(null);
  const tipPrevRef = useRef<(() => void) | null>(null);
  /* 퀴즈: 답을 고르기 전에는 결과를 감춰 둔다.
   * 저장된 답이 있으면 결과가 끝난 모습 그대로 시작한다 (애니메이션 없이). */
  const [restoredSaved] = useState(readQuizSaved);
  const solved = restoredSaved !== null;
  /* 지금 푸는 문제 — 저장된 답이 있으면 그 문제부터 보여준다 */
  const [quizIndex, setQuizIndex] = useState(() => {
    const found = restoredSaved
      ? SNACK_QUIZZES.findIndex((item) => item.id === restoredSaved.quizId)
      : 0;
    return found < 0 ? 0 : found;
  });
  const quiz = SNACK_QUIZZES[quizIndex];
  /* 다음 문제가 없으면 '다음 퀴즈' 를 그리지 않는다 — 같은 문제를 다시 내지 않기 위해서다 */
  const nextQuiz = SNACK_QUIZZES[quizIndex + 1] ?? null;
  const [quizAnswer, setQuizAnswer] = useState<string | null>(restoredSaved?.answer ?? null);
  /* 계란 껍데기를 끌어다 놓는 방식 — 탭으로도 같은 답변 처리를 쓴다 */
  const [quizRevealed, setQuizRevealed] = useState(solved);
  const [quizDragging, setQuizDragging] = useState(false);
  const [quizOver, setQuizOver] = useState<string | null>(null);
  const [quizEggGone, setQuizEggGone] = useState(solved);
  /* 잡는 순간 온전한 계란이 깨진 껍데기로 바뀐다 — 한 번 깨지면 되돌리지 않는다 */
  const [quizEggCracked, setQuizEggCracked] = useState(solved);
  const eggRef = useRef<HTMLDivElement>(null);
  const eggStart = useRef({ x: 0, y: 0 });
  /* 잡고 있는지는 ref 로 본다 — 리렌더를 기다리지 않아 첫 move 부터 따라온다 */
  const eggHeld = useRef(false);
  const zoneRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  /* 해결팁 pagination — 복제를 뺀 실제 카드 번호 */
  const [tipPage, setTipPage] = useState(0);

  /* 해결팁 캐러셀 — 가운데에 가까울수록 큰 카드다.
   * 카드를 직접 끌어서 넘기지 않는다. 손가락·마우스가 카드를 잡으면 페이지 세로 스크롤을
   * 방해해서, 넘기는 조작은 오른쪽 '다음' 버튼(과 좌/우 방향키)만 담당한다.
   * 레일 자체도 overflow-x: hidden 이라 스와이프·트랙패드 가로 스크롤이 걸리지 않는다. */
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
      enableLoop();
      goTo(nearest().index + direction);
    };
    tipNextRef.current = () => step(1);
    tipPrevRef.current = () => step(-1);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      /* 방향키로 왼쪽 끝을 넘어갈 수 있어야 하므로 이동 전에 loop 을 켠다 */
      enableLoop();
      goTo(nearest().index + (event.key === 'ArrowRight' ? 1 : -1));
    };

    rail.addEventListener('scroll', onScroll, { passive: true });
    rail.addEventListener('keydown', onKeyDown);
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
      window.removeEventListener('resize', paint);
      tipNextRef.current = null;
      tipPrevRef.current = null;
    };
  }, []);

  /* 드래그로 놓든 탭으로 고르든 답변 처리는 이 하나를 쓴다 */
  const answerQuiz = (answer: string) => {
    if (quizAnswer) return;
    setQuizAnswer(answer);
    setQuizOver(null);
    try {
      const saved: QuizSaved = {
        quizId: quiz.id,
        answer,
        correct: answer === quiz.correctAnswer,
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
    moveEgg(0, 0);
    setQuizAnswer(null);
    setQuizRevealed(false);
    setQuizEggGone(false);
    setQuizEggCracked(false);
    setQuizDragging(false);
    setQuizOver(null);
  };

  /* 다음 문제 — 현재 문제를 초기화한 뒤 배열의 다음 항목으로 넘어간다 */
  const goNextQuiz = () => {
    if (!nextQuiz) return;
    resetQuiz();
    setQuizIndex((index) => index + 1);
  };

  /* 고른 자리를 먼저 보여주고 잠깐 뒤에 결과를 연다 */
  useEffect(() => {
    if (!quizAnswer || quizRevealed) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    /* 계란 껍데기는 고른 칸 쪽으로 짧게 빠지고, 그 뒤에 영역 높이가 접힌다 —
     * 한 프레임에 사라지면 선택 버튼이 위로 튀어 올라간다 */
    const clear = window.setTimeout(() => setQuizEggGone(true), reduceMotion ? 0 : 200);
    const reveal = window.setTimeout(() => setQuizRevealed(true), reduceMotion ? 0 : 220);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(clear);
    };
  }, [quizAnswer]);

  /* 포인터 위치가 어느 칸 안인지 — 마우스와 터치를 같은 식으로 본다 */
  const zoneAt = (x: number, y: number): string | null =>
    quiz.options.find((answer) => {
      const box = zoneRefs.current[answer]?.getBoundingClientRect();
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
      /* 캡처가 안 되어도 드래그 자체는 그대로 동작한다 */
    }
  };

  const onEggMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!eggHeld.current) return;
    moveEgg(event.clientX - eggStart.current.x, event.clientY - eggStart.current.y);
    setQuizOver(zoneAt(event.clientX, event.clientY));
  };

  const onEggUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!eggHeld.current) return;
    eggHeld.current = false;
    setQuizDragging(false);
    const dropped = zoneAt(event.clientX, event.clientY);
    /* 칸 밖에서 놓으면 제자리로 돌아온다 (transition 이 짧게 되돌린다) */
    moveEgg(0, 0);
    if (dropped) answerQuiz(dropped);
    else setQuizOver(null);
  };

  return (
    <div className="life app">
      <SubPageHeader
        title="생활"
        backLabel="홈으로"
        onBack={() => navigation?.navigate('home')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="life__scroll">
        {/* ================= ① 생활 카테고리 ================= */}
        <section className="life-category">
          <div className="life-category__head">
            <h2>생활</h2>
            <p>
              자취하다 막힐 때,
              <br />
              필요한 생활정보를 빠르게 찾아보세요.
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
            <h2>{name}님, 이것도 알고 있나요?</h2>
            <p>30초면 끝나요. 오늘 하나만 알아가세요.</p>
          </div>

          <div className="life-quiz__result">
            {/* 안내문과 계란은 DOM 에서 바로 빼지 않는다 — 높이를 접어서 버튼이 부드럽게 올라오게 한다 */}
            <div
              className={`life-quiz__intro${quizEggGone ? ' is-gone' : ''}`}
              aria-hidden={quizEggGone || undefined}
            >
              <div className="life-quiz__intro-inner">
                {/* 끌어다 놓는 계란 — 잡으면 깨지고, 답을 고르면 고른 칸 쪽으로 빠지며 사라진다 */}
                <div className="life-quiz__egg-row">
                  <div
                    ref={eggRef}
                    className={`life-quiz__egg${quizDragging ? ' is-dragging' : ''}${
                      quizEggCracked ? ' is-cracked' : ''
                    }${quizAnswer ? ' is-done' : ''}`}
                    style={
                      quizAnswer
                        ? ({ '--egg-drop': quizAnswer === quiz.options[0] ? '-56px' : '56px' } as CSSProperties)
                        : undefined
                    }
                    onPointerDown={onEggDown}
                    onPointerMove={onEggMove}
                    onPointerUp={onEggUp}
                    onPointerCancel={onEggUp}
                  >
                    {/* 온전한 계란과 깨진 껍데기를 같은 크기의 칸에 겹쳐 두고 서로 교차시킨다 —
                     * 이미지를 갈아끼우지 않아 높이가 흔들리지 않는다 */}
                    <span className="life-quiz__egg-stack">
                      <img
                        className="life-quiz__egg-img life-quiz__egg-img--whole"
                        src={img(quiz.image)}
                        alt="계란"
                        draggable={false}
                      />
                      <img
                        className="life-quiz__egg-img life-quiz__egg-img--cracked"
                        src={img(quiz.crackedImage ?? quiz.image)}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                      />
                    </span>
                  </div>
                </div>

                {/* 끌 수 있다는 안내는 계란 바로 아래에 둔다 */}
                <p className={`life-quiz__guide${quizAnswer ? ' is-gone' : ''}`}>
                  계란을 끌어서 알맞은 곳에 넣어보세요
                </p>
              </div>
            </div>

            {/* 무엇에 대한 문제인지 먼저 알려주고 질문을 던진다 */}
            <p className="life-quiz__chip">
              {quiz.category} · {quiz.difficulty}
            </p>
            <p className="life-quiz__question">{quiz.question}</p>

            <div className="life-quiz__labels">
              {quiz.options.map((answer) => (
                <button
                  key={answer}
                  type="button"
                  ref={(node) => {
                    zoneRefs.current[answer] = node;
                  }}
                  className={`life-quiz__choice${quizAnswer === answer ? ' is-picked' : ''}${
                    quizOver === answer ? ' is-over' : ''
                  }`}
                  aria-pressed={quizAnswer === answer}
                  disabled={quizAnswer !== null}
                  onClick={() => answerQuiz(answer)}
                >
                  {/* 평소엔 쓰레기통, 고른 뒤엔 같은 자리에서 체크로 바뀐다 — 두 아이콘 모두
                   * 같은 크기라 글자 위치는 그대로다. 쓰레기통은 <img> 가 부모 color 를
                   * 못 받아서 mask 로 그린다. */}
                  {quizAnswer === answer ? (
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
                  ) : (
                    <span
                      className="life-quiz__choice-icon"
                      style={{
                        maskImage: `url(${icon('delete.svg')})`,
                        WebkitMaskImage: `url(${icon('delete.svg')})`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                  {answer}
                </button>
              ))}
            </div>

            {/* 결과는 답을 고른 뒤에만 공개한다 — 결과 한 줄과 짧은 설명까지가 전부다 */}
            {quizRevealed && (
              <div className="life-quiz__reveal" role="status">
                <p
                  className={`life-quiz__headline${
                    quizAnswer === quiz.correctAnswer ? ' is-correct' : ''
                  }`}
                >
                  {quizAnswer === quiz.correctAnswer ? quiz.result.correct : quiz.result.wrong}
                </p>
                <p className="life-quiz__answer">{quiz.explanation.point}</p>
                <p className="life-quiz__why">{quiz.explanation.detail}</p>

                {nextQuiz && (
                  <button type="button" className="life-quiz__next" onClick={goNextQuiz}>
                    다음 퀴즈 <span aria-hidden="true">→</span>
                  </button>
                )}
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
                  />
                  <span className="life-tip__veil" />
                  <div className="life-tip__body">
                    <p className="life-tip__situation">{tip.situation}</p>
                    <p className="life-tip__title">
                      {tip.title[0]}
                      <br />
                      {tip.title[1]}
                    </p>
                    <p className="life-tip__meta">{tip.meta}</p>
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
      <AIChatbot />
    </div>
  );
}

export default LifePage;
