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
import { useMyMenu } from '../menu/MyMenuContext';
import { img } from '../lib/asset';

/* 생활 카테고리 4종 — 이미지는 정사각 원본이라 카드 안에서 크롭 위치를 따로 잡는다.
 * (modifier 로 life.css 에서 top/left/height 를 지정) */
const CATEGORIES = [
  { key: 'first', title: '첫 자취', sub: '방 구하기부터 정착까지', file: 'life-category-first.png' },
  { key: 'homecare', title: '홈케어', sub: '문제 확인부터 해결까지', file: 'life-category-homecare.png' },
  { key: 'house', title: '살림', sub: '청소부터 분리배출까지', file: 'life-category-house.png' },
  { key: 'food', title: '먹거리', sub: '보관부터 한 끼까지', file: 'life-category-food.png' },
] as const;

/* 해결팁 — 배열 순서가 곧 화면 순서. 가운데로 온 카드가 강조 카드가 된다. */
const TIPS = [
  {
    key: 'storage',
    file: 'life-tip-storage.png',
    problem: '짐 때문에 발 딛을 틈이 없어요',
    solution: ['세로형 수납장', '구매 후 정리'],
  },
  {
    key: 'wallpaper',
    file: 'life-tip-wallpaper.png',
    problem: '입주 후 벽지 훼손을 발견했어요',
    solution: ['입주 첫날 찍어둔 사진으로', '집주인에게 전달'],
  },
  {
    key: 'bug',
    file: 'life-tip-bug.png',
    problem: '작은 벌레가 계속 들어와요',
    solution: ['문틈을 막고 배수구', '커버 설치'],
  },
] as const;

/* 해결팁 캐러셀 — 슬라이더 중심에서 멀어질수록 카드가 작아진다.
 * 0.87 은 15px 본문이 축소돼도 최소 13px 을 지키는 값이다. */
const TIP_SCALE_MIN = 0.87;
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

/* 생활 퀴즈 — 답을 고른 뒤에만 결과를 공개한다.
 * 결과 막대는 50:50 에서 시작해 실제 응답 비율(69:31)로 경계가 이동한다. */
const QUIZ_ANSWERS = ['일반 쓰레기', '음식물 쓰레기'] as const;
type QuizAnswer = (typeof QUIZ_ANSWERS)[number];
const QUIZ_CORRECT: QuizAnswer = '일반 쓰레기';
const QUIZ_START_RATIO = 50;
const QUIZ_RATIO = 69;
const QUIZ_DURATION = 700;

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
  /* 퀴즈: 답을 고르기 전에는 결과를 감춰 둔다 */
  const [quizAnswer, setQuizAnswer] = useState<QuizAnswer | null>(null);
  const [quizPercent, setQuizPercent] = useState(QUIZ_START_RATIO);
  /* 계란 껍데기를 끌어다 놓는 방식 — 탭으로도 같은 답변 처리를 쓴다 */
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizDragging, setQuizDragging] = useState(false);
  const [quizOver, setQuizOver] = useState<QuizAnswer | null>(null);
  const [quizEggGone, setQuizEggGone] = useState(false);
  const eggRef = useRef<HTMLDivElement>(null);
  const eggStart = useRef({ x: 0, y: 0 });
  /* 잡고 있는지는 ref 로 본다 — 리렌더를 기다리지 않아 첫 move 부터 따라온다 */
  const eggHeld = useRef(false);
  const zoneRefs = useRef<Partial<Record<QuizAnswer, HTMLButtonElement | null>>>({});
  /* 해결팁 pagination — 복제를 뺀 실제 카드 번호 */
  const [tipPage, setTipPage] = useState(0);

  /* 해결팁 캐러셀 — 가운데에 가까울수록 큰 카드다.
   * 스크롤 위치가 바뀔 때마다 크기를 다시 그리므로 드래그하는 중에도 연속적으로 변한다.
   * 터치 스와이프는 브라우저의 가로 스크롤 + scroll-snap 이 그대로 처리하고,
   * 마우스 드래그와 좌/우 방향키만 여기서 보탠다. */
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

    let dragging = false;
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
        if (!dragging && !gliding) rail.style.scrollSnapType = '';
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
        if (!dragging && !gliding) fixLoop();
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

    /* 데스크톱 마우스 드래그 — 터치는 브라우저 기본 스와이프를 그대로 쓴다 */
    let startX = 0;
    let startScroll = 0;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      /* 누르기만 해서는 loop 을 켜지 않는다 — 실제로 밀려서 scroll 이 나야 켜진다 */
      dragging = true;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      cancelAnimationFrame(snapFrame);
      rail.style.scrollSnapType = 'none';
      try {
        rail.setPointerCapture(event.pointerId);
      } catch {
        /* 캡처가 안 되어도 드래그 자체는 그대로 동작한다 */
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      rail.scrollLeft = startScroll - (event.clientX - startX);
    };
    const endDrag = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
      goTo(nearest().index);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      /* 방향키로 왼쪽 끝을 넘어갈 수 있어야 하므로 이동 전에 loop 을 켠다 */
      enableLoop();
      goTo(nearest().index + (event.key === 'ArrowRight' ? 1 : -1));
    };

    rail.addEventListener('scroll', onScroll, { passive: true });
    rail.addEventListener('pointerdown', onPointerDown);
    rail.addEventListener('pointermove', onPointerMove);
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
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
      rail.removeEventListener('pointerdown', onPointerDown);
      rail.removeEventListener('pointermove', onPointerMove);
      rail.removeEventListener('pointerup', endDrag);
      rail.removeEventListener('pointercancel', endDrag);
      rail.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', paint);
    };
  }, []);

  /* 드래그로 놓든 탭으로 고르든 답변 처리는 이 하나를 쓴다 */
  const answerQuiz = (answer: QuizAnswer) => {
    if (quizAnswer) return;
    setQuizAnswer(answer);
    setQuizOver(null);
  };

  /* 고른 자리를 먼저 보여주고 잠깐 뒤에 결과를 연다 */
  useEffect(() => {
    if (!quizAnswer) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const reveal = window.setTimeout(() => setQuizRevealed(true), reduceMotion ? 0 : 120);
    /* 계란 껍데기는 고른 칸 쪽으로 짧게 빠지고 사라진다 — 결과를 가리지 않게 */
    const clear = window.setTimeout(() => setQuizEggGone(true), reduceMotion ? 0 : 260);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(clear);
    };
  }, [quizAnswer]);

  /* 포인터 위치가 어느 칸 안인지 — 마우스와 터치를 같은 식으로 본다 */
  const zoneAt = (x: number, y: number): QuizAnswer | null =>
    QUIZ_ANSWERS.find((answer) => {
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

  /* 답을 고르면 결과를 공개하고 50:50 → 69:31 로 경계를 옮긴다.
   * 막대 폭과 두 숫자를 하나의 값에서 함께 계산해 서로 어긋나지 않게 한다. */
  useEffect(() => {
    if (!quizRevealed) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setQuizPercent(QUIZ_RATIO);
      return;
    }

    let frame = 0;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / QUIZ_DURATION, 1);
      /* cubic-bezier(0.22, 1, 0.36, 1) 과 비슷한 ease-out — bounce 없음 */
      const eased = 1 - Math.pow(1 - progress, 5);
      setQuizPercent(QUIZ_START_RATIO + (QUIZ_RATIO - QUIZ_START_RATIO) * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [quizRevealed]);

  /* 두 숫자는 항상 합이 100 이 되도록 왼쪽 값에서 함께 만든다 */
  const left = Math.round(quizPercent);

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
                /* 첫 자취만 화면이 있다 — 나머지는 아직 route 를 만들지 않는다 */
                onClick={item.key === 'first' ? () => navigation?.navigate('life-first') : undefined}
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
            <p>계란 껍데기, 어디에 버리세요?</p>
          </div>

          <div className="life-quiz__result">
            {!quizAnswer && (
              <p className="life-quiz__guide">계란 껍데기를 알맞은 곳에 넣어보세요</p>
            )}

            {/* 끌어다 놓는 계란 껍데기 — 답을 고르면 고른 칸 쪽으로 빠지며 사라진다 */}
            {!quizEggGone && (
              <div className="life-quiz__egg-row">
                <div
                  ref={eggRef}
                  className={`life-quiz__egg${quizDragging ? ' is-dragging' : ''}${
                    quizAnswer ? ' is-done' : ''
                  }`}
                  style={
                    quizAnswer
                      ? ({ '--egg-drop': quizAnswer === QUIZ_ANSWERS[0] ? '-56px' : '56px' } as CSSProperties)
                      : undefined
                  }
                  onPointerDown={onEggDown}
                  onPointerMove={onEggMove}
                  onPointerUp={onEggUp}
                  onPointerCancel={onEggUp}
                >
                  <img
                    className="life-quiz__egg-img"
                    src={img('life/life-quiz-eggshell.png')}
                    alt="계란 껍데기"
                    draggable={false}
                  />
                </div>
              </div>
            )}

            <div className="life-quiz__labels">
              {QUIZ_ANSWERS.map((answer) => (
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
                  {/* 고른 쪽만 체크로 표시한다 — 색은 버튼 글자색을 따라간다 */}
                  {quizAnswer === answer && (
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
                  )}
                  {answer}
                </button>
              ))}
            </div>

            {/* 결과는 답을 고른 뒤에만 공개한다 */}
            {quizRevealed && (
              <>
                <div
                  className="life-quiz__bar"
                  role="progressbar"
                  aria-valuenow={left}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="일반 쓰레기라고 답한 비율"
                >
                  <span className="life-quiz__fill" style={{ width: `${quizPercent}%` }} />
                  <span className="life-quiz__values">
                    <em>{left}%</em>
                    <em>{100 - left}%</em>
                  </span>
                </div>
                <p
                  className={`life-quiz__feedback${quizAnswer === QUIZ_CORRECT ? ' is-correct' : ''}`}
                  role="status"
                >
                  <strong>{quizAnswer === QUIZ_CORRECT ? '맞았어요!' : '아쉬워요!'}</strong>
                  {quizAnswer === QUIZ_CORRECT
                    ? '계란 껍데기는 일반 쓰레기로 버려주세요.'
                    : '계란 껍데기는 일반 쓰레기예요.'}
                </p>
              </>
            )}
          </div>
        </section>

        {/* ================= ③ 자취생들의 해결팁 ================= */}
        <section className="life-tips">
          <h2>자취생들의 해결팁</h2>
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
                <img className="life-tip__image" src={img(`life/${tip.file}`)} alt="" />
                <span className="life-tip__veil" />
                <div className="life-tip__body">
                  <p className="life-tip__problem">{tip.problem}</p>
                  <p className="life-tip__solution">
                    {tip.solution[0]}
                    <br />
                    {tip.solution[1]}
                  </p>
                </div>
              </article>
            ))}
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
