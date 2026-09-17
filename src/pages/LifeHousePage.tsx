import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { CategoryTabs } from '../components/homecare/CategoryTabs';
import { usePrefersReducedMotion } from '../components/homecare/usePrefersReducedMotion';
import { RoutineAccordionItem } from '../components/lifehouse/RoutineAccordionItem';
import { AddRoutineSheet } from '../components/lifehouse/AddRoutineSheet';
import { IntervalSheet } from '../components/lifehouse/IntervalSheet';
import { DEFAULT_MENU } from '../data/menuCatalog';
import {
  DEFAULT_ROUTINES,
  HOUSE_TIP,
  TRASH_REGION_NOTICE,
  completeRoutine,
  findTrashItem,
  normalizeTrashQuery,
  sortRoutinesByUrgency,
  withDirectionParticle,
} from '../data/lifeHouse';
import type { HouseRoutine } from '../data/lifeHouse';
import { icon, img } from '../lib/asset';

const EASE = [0.22, 1, 0.36, 1] as const;
/** "오늘 관리했어요 ✓" 를 보여주는 시간 */
const DONE_FEEDBACK_MS = 700;

/* 검색 결과 — 검색을 실행했을 때만 통째로 한 번 fade-up 한다.
 * 줄 단위 stagger 는 쓰지 않는다: 결과가 바뀔 때마다 여러 줄이 따로 움직이면
 * 높이가 여러 번 잡히면서 화면이 출렁이는 것처럼 보인다. */
const resultAppear = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: EASE },
};

/* 생활 > 살림 — 버릴 물건을 검색해 분리배출 방법을 바로 확인하고, 놓치기 쉬운 집안 루틴을
 * 챙기고, 지금 볼 만한 살림 팁을 훑어보는 화면이다. Figma daily_living (3084:23432).
 * 목적: "이거 어떻게 버리지?" 같은 사소하지만 매번 헷갈리는 생활 판단을 빠르게 도와준다.
 *
 * 레이아웃·타이포·색은 Figma 그대로 두고 그 위에 인터랙션만 얹는다. 상태는 영역별로 나눠
 * 둔다 — 검색(query) / 루틴(routines·expandedId) / 시트(addSheetOpen·intervalTargetId). */
export function LifeHousePage() {
  const navigation = useAppNavigation();
  const reduceMotion = usePrefersReducedMotion();
  const [gnbOpen, setGnbOpen] = useState(false);

  /* ---------- ① 검색 ---------- */
  /* 입력 중인 값(draft)과 실제로 검색한 값(submitted)을 나눈다.
   * 한 글자 칠 때마다 검색하면 '여 → 영 → 영수 → 영수증' 동안 결과 영역이 계속 바뀌면서
   * 화면 높이가 출렁이고, 중간에 "등록되지 않은 물건" 안내까지 번쩍인다. */
  const [draftQuery, setDraftQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  /* 한글 조합 중 Enter 는 조합을 확정하는 키다 — 여기서 검색하면 '영수증'이 '영수'로 잘린다 */
  const composingRef = useRef(false);

  const result = useMemo(
    () => (submittedQuery ? findTrashItem(submittedQuery) : null),
    [submittedQuery],
  );

  /* Enter 와 검색 아이콘에서만 실행한다. 빈 값으로 검색하면 결과 영역을 닫는다. */
  const runSearch = useCallback(() => {
    if (composingRef.current) return;
    const query = draftQuery.trim();
    setSubmittedQuery(normalizeTrashQuery(query) ? query : '');
  }, [draftQuery]);

  /* ---------- ② 루틴 ---------- */
  /* import 한 정적 배열을 그대로 들고 있지 않도록 복사해서 시작한다 */
  const [routines, setRoutines] = useState<HouseRoutine[]>(() =>
    DEFAULT_ROUTINES.map((routine) => ({ ...routine })),
  );
  const sortedRoutines = sortRoutinesByUrgency(routines);
  /* 아코디언은 한 번에 하나만 열린다 */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /* 완료할 때마다 올려서 D-day 칩 전환을 다시 재생시키는 카운터 */
  const [completions, setCompletions] = useState<Record<string, number>>({});
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const doneTimer = useRef<number | null>(null);

  /* ---------- ③ 시트 ---------- */
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [intervalTargetId, setIntervalTargetId] = useState<string | null>(null);
  const intervalTarget = routines.find((routine) => routine.id === intervalTargetId) ?? null;
  const anySheetOpen = addSheetOpen || intervalTarget !== null;

  useEffect(
    () => () => {
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
    },
    [],
  );

  /* 관리일을 오늘로 갱신하고 완료한 항목을 배열 끝으로 옮긴다.
   * 오늘 관리한 그룹은 이 순서를 유지하므로 방금 완료한 항목이 항상 맨 아래로 간다.
   * 패널은 열린 상태를 유지하며 항목과 함께 이동한다. */
  const complete = useCallback((id: string) => {
    setRoutines((current) => {
      const routine = current.find((item) => item.id === id);
      if (!routine) return current;
      return [...current.filter((item) => item.id !== id), completeRoutine(routine)];
    });
    setCompletions((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setJustCompletedId(id);
    if (doneTimer.current) window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setJustCompletedId(null), DONE_FEEDBACK_MS);
  }, []);

  const addRoutine = useCallback((routine: HouseRoutine) => {
    setEnteringId(routine.id);
    setRoutines((current) => [...current, routine]);
  }, []);

  const saveInterval = useCallback(
    (intervalDays: number, intervalLabel: string) => {
      if (!intervalTargetId) return;
      setRoutines((current) =>
        current.map((routine) =>
          routine.id === intervalTargetId ? { ...routine, intervalDays, intervalLabel } : routine,
        ),
      );
    },
    [intervalTargetId],
  );

  /* ---------- ④ 살림 팁 ---------- */
  /* 살림 팁은 이 화면에서 상세를 펼치지 않고 커뮤니티의 '자취 꿀팁' 으로 넘긴다 —
   * 카드와 '더보기' 의 목적지는 같다. */
  const openCommunityTips = useCallback(() => {
    navigation?.navigate('community-tip', { returnTo: 'life-house' });
  }, [navigation]);

  /* 스크롤 등장은 살림 팁에만 쓴다 — 검색·루틴은 사용자 action 에 반응하는 쪽이 중심이다 */
  const scrollRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLElement>(null);
  /* 이 화면은 window 가 아니라 .life-house__scroll 안에서 스크롤된다 — root 를 그쪽으로 잡는다.
   * 402×874 에서 이 섹션은 가만히 있어도 30% 쯤 걸쳐 있어서 0.35 로 올려야
   * '스크롤해서 도달했을 때' 나타난다. 한 번 나타나면 되돌리지 않는다. */
  const tipInView = useInView(tipRef, { once: true, amount: 0.35, root: scrollRef });
  const tipShown = reduceMotion || tipInView;

  /* 시트가 떠 있는 동안 뒤 페이지가 같이 스크롤되지 않게 막고, 닫히면 위치까지 되돌린다.
   * 이 앱은 body 가 아니라 화면마다 자기 스크롤 컨테이너를 쓰므로 전역 스크롤은 건드리지 않는다. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !anySheetOpen) return;
    const saved = el.scrollTop;
    el.style.overflowY = 'hidden';
    return () => {
      el.style.overflowY = '';
      el.scrollTop = saved;
    };
  }, [anySheetOpen]);

  return (
    <div className="life-house app">
      <SubPageHeader
        title="생활"
        backLabel="생활로"
        onBack={() => navigation?.goBack('life')}
        onMenu={() => setGnbOpen(true)}
      />

      <CategoryTabs active="house" />

      <main className="life-house__scroll" ref={scrollRef}>
        {/* ============ 인트로 ============ */}
        <div className="lh-intro">
          <h2>
            혼자 살면 은근히 헷갈리는 것들,
            <br />
            필요한 정보만 빠르게 확인해요
          </h2>
          <p>내 지역과 생활 주기에 맞춰 먼저 보여드릴게요.</p>
        </div>

        {/* ============ ① 버리기 전에 확인해요 ============ */}
        <motion.section className="lh-section" layout={!reduceMotion}>
          <h2>버리기 전에 확인해요</h2>

          <div className="lh-search" role="search">
            <button
              type="button"
              className="lh-search__submit"
              aria-label="검색하기"
              onClick={runSearch}
            >
              <img src={icon('life-house-search.svg')} alt="" className="lh-search__icon" />
            </button>
            <input
              type="text"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onCompositionEnd={() => {
                composingRef.current = false;
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                /* 한글 조합을 확정하는 Enter 는 검색이 아니다.
                 * isComposing 과 keyCode 229 는 브라우저마다 채우는 값이 달라 둘 다 본다. */
                const native = event.nativeEvent;
                if (composingRef.current || native.isComposing || native.keyCode === 229) return;
                event.preventDefault();
                runSearch();
              }}
              placeholder="버릴 물건을 검색해보세요"
              aria-label="버릴 물건 검색"
            />
          </div>

          {/* 검색을 실행하기 전(submittedQuery 가 빈 값)에는 결과 영역을 아예 그리지 않는다.
           * 입력 중에는 이 블록이 전혀 다시 계산되지 않아 화면 높이가 흔들리지 않는다. */}
          {submittedQuery && result && (
            <motion.div
              key={result.id}
              className="lh-result"
              initial={reduceMotion ? false : resultAppear.initial}
              animate={resultAppear.animate}
              transition={resultAppear.transition}
              aria-live="polite"
            >
              <p className="lh-result__meta">
                {withDirectionParticle(submittedQuery)} 검색했어요
              </p>
              <div className="lh-result__head">
                <p className="lh-result__name">{result.category}</p>
                <span className="lh-result__tag">{result.recycleLabel}</span>
              </div>
              <p className="lh-result__body">
                {result.description.map((line, index) => (
                  <span key={line}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))}
                {result.caution && (
                  <span>
                    <br />
                    {result.caution}
                  </span>
                )}
              </p>
              <p className="lh-result__notice">{TRASH_REGION_NOTICE}</p>
            </motion.div>
          )}

          {submittedQuery && !result && (
            <motion.p
              className="lh-empty"
              initial={reduceMotion ? false : resultAppear.initial}
              animate={resultAppear.animate}
              transition={resultAppear.transition}
              aria-live="polite"
            >
              아직 등록되지 않은 물건이에요.
              <br />
              다른 이름으로 검색해보세요.
            </motion.p>
          )}
        </motion.section>

        {/* ============ ② 잊기 전에 챙겨요 ============ */}
        <section className="lh-section">
          <div className="lh-section__head">
            <h2>잊기 전에 챙겨요</h2>
            <motion.button
              type="button"
              className="lh-add"
              onClick={() => setAddSheetOpen(true)}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={{ duration: 0.14 }}
            >
              <span className="lh-add__icon" aria-hidden="true" />
              루틴 추가하기
            </motion.button>
          </div>

          <ul className="lh-routines">
            {sortedRoutines.map((routine) => (
              <RoutineAccordionItem
                key={routine.id}
                routine={routine}
                expanded={expandedId === routine.id}
                onToggle={() =>
                  setExpandedId((current) => (current === routine.id ? null : routine.id))
                }
                onComplete={() => complete(routine.id)}
                onEditInterval={() => setIntervalTargetId(routine.id)}
                justCompleted={justCompletedId === routine.id}
                completions={completions[routine.id] ?? 0}
                entering={routine.id === enteringId}
              />
            ))}
          </ul>
        </section>

        {/* ============ ③ 지금 챙겨볼 살림 팁 ============ */}
        <section className="lh-section" ref={tipRef}>
          <motion.div
            className="lh-section__head"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={tipShown ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.26, ease: EASE }}
          >
            <h2>지금 챙겨볼 살림 팁</h2>
            <motion.button
              type="button"
              className="lh-more"
              onClick={openCommunityTips}
              whileTap={reduceMotion ? undefined : { opacity: 0.65 }}
              transition={{ duration: 0.15 }}
            >
              더보기
              <motion.span
                className="lh-more__icon"
                aria-hidden="true"
                variants={{ rest: { x: 0 }, tap: { x: 2 } }}
                initial="rest"
                whileTap={reduceMotion ? undefined : 'tap'}
                transition={{ duration: 0.15, ease: EASE }}
              />
            </motion.button>
          </motion.div>

          {/* 이미지·제목·설명·여백까지 카드 전체가 하나의 버튼이다 */}
          <motion.button
            type="button"
            className="lh-tip"
            onClick={openCommunityTips}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={tipShown ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.34, delay: reduceMotion ? 0 : 0.05, ease: EASE }}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          >
            <img src={img(`life/${HOUSE_TIP.image}`)} alt="" className="lh-tip__photo" />
            <span className="lh-tip__box">
              <span className="lh-tip__title">{HOUSE_TIP.title}</span>
              <span className="lh-tip__subtitle">{HOUSE_TIP.subtitle}</span>
            </span>
          </motion.button>
        </section>
      </main>

      <BottomNavigation activeTab="life" />
      <GnbOverlay
        open={gnbOpen}
        myMenu={DEFAULT_MENU}
        onClose={() => setGnbOpen(false)}
        onEditMenu={() => setGnbOpen(false)}
      />

      <AddRoutineSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onAdd={addRoutine}
      />
      <IntervalSheet
        routine={intervalTarget}
        onClose={() => setIntervalTargetId(null)}
        onSave={saveInterval}
      />
    </div>
  );
}

export default LifeHousePage;
