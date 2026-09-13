import { useId } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { routineStatus } from '../../data/lifeHouse';
import type { HouseRoutine } from '../../data/lifeHouse';
import { icon } from '../../lib/asset';

const EASE = [0.22, 1, 0.36, 1] as const;

interface RoutineAccordionItemProps {
  routine: HouseRoutine;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onEditInterval: () => void;
  /** 방금 완료했으면 true — 버튼이 잠깐 "오늘 관리했어요 ✓" 로 바뀐다 */
  justCompleted: boolean;
  /** 완료 횟수. 값이 바뀌면 D-day 칩 전환을 재생한다 */
  completions: number;
  /** 시트로 새로 추가된 직후에만 true */
  entering: boolean;
}

/* 생활 > 살림 — 루틴 한 줄 + 그 아래로 펼쳐지는 Inline Detail Panel.
 *
 * 헤더(제목+아이콘 / D-day 칩 / 메타 한 줄 / 하단 구분선)는 Figma 그대로 두고,
 * 누르면 같은 자리에서 관리 정보와 완료 버튼이 아코디언으로 열린다 — 새 페이지로 나가지 않고
 * 현재 화면 맥락을 유지한다. 루틴은 끝나는 Todo 가 아니라 반복 관리 항목이라
 * 완료/취소 두 글자보다 "지금 상태 + 명확한 완료 action" 을 같이 보여주는 쪽이 맞다. */
export function RoutineAccordionItem({
  routine,
  expanded,
  onToggle,
  onComplete,
  onEditInterval,
  justCompleted,
  completions,
  entering,
}: RoutineAccordionItemProps) {
  const reduceMotion = usePrefersReducedMotion();
  const status = routineStatus(routine);
  const panelId = useId();
  const headerId = useId();
  const animateChange = completions > 0 && !reduceMotion;

  return (
    <motion.li
      className="lh-routine"
      layout={!reduceMotion}
      initial={entering && !reduceMotion ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <motion.button
        type="button"
        id={headerId}
        className="lh-routine__tap"
        onClick={onToggle}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.14 }}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span className="lh-routine__top">
          <span className="lh-routine__name">
            <img src={icon(routine.iconFile)} alt="" />
            {routine.name}
          </span>

          {/* 칩 상자는 그대로 두고 라벨만 교체한다 — popLayout 이라 나가는 라벨이 자리를
           * 차지하지 않아 칩이 찌그러지지 않는다. */}
          <span className={`lh-routine__dday${status.urgent ? ' is-urgent' : ''}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={status.ddayLabel}
                initial={animateChange ? { opacity: 0, y: 4 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: EASE }}
              >
                {status.ddayLabel}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>

        <span className="lh-routine__meta">
          마지막 관리 {status.lastManagedLabel} · 권장 {routine.intervalLabel}
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            className="lh-panel"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0, y: -4 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, y: -4, transition: { duration: 0.24, ease: EASE } }
            }
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
          >
            <div className="lh-panel__inner">
              <dl className="lh-panel__facts">
                <div>
                  <dt>권장 관리 주기</dt>
                  <dd>{routine.intervalLabel}</dd>
                </div>
                <div>
                  <dt>마지막 관리</dt>
                  <dd>{status.lastManagedLabel}</dd>
                </div>
                <div>
                  <dt>다음 관리</dt>
                  <dd className={status.urgent ? 'is-urgent' : undefined}>
                    {status.nextCareLabel}
                  </dd>
                </div>
              </dl>

              <motion.button
                type="button"
                className={`lh-panel__done${justCompleted ? ' is-done' : ''}`}
                onClick={onComplete}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.14 }}
              >
                {justCompleted ? '오늘 관리했어요 ✓' : '오늘 관리 완료'}
              </motion.button>

              <button type="button" className="lh-panel__edit" onClick={onEditInterval}>
                주기 수정
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default RoutineAccordionItem;
