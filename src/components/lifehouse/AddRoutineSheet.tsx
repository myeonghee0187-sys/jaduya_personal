import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { HouseSheet } from './HouseSheet';
import { RoutineChips } from './RoutineChips';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { ROUTINE_INTERVALS, ROUTINE_LAST_CARES, createRoutine } from '../../data/lifeHouse';
import type { HouseRoutine } from '../../data/lifeHouse';

const DEFAULT_INTERVAL = 'm1'; // 1개월 — Figma 목업의 두 루틴과 같은 주기
const DEFAULT_LAST_CARE = 'today';

interface AddRoutineSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (routine: HouseRoutine) => void;
}

/* "+ 루틴 추가하기" — 새 페이지로 나가지 않고 시트에서 이름·주기·마지막 관리일만 받는다. */
export function AddRoutineSheet({ open, onClose, onAdd }: AddRoutineSheetProps) {
  const reduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const nameId = useId();

  const [name, setName] = useState('');
  const [intervalKey, setIntervalKey] = useState<string>(DEFAULT_INTERVAL);
  const [lastCareKey, setLastCareKey] = useState<string>(DEFAULT_LAST_CARE);

  const nameRef = useRef<HTMLInputElement>(null);
  /* onAdd → onClose 가 같은 tick 에 일어나서 state 로는 더블클릭을 못 막는다 */
  const submittingRef = useRef(false);

  /* 열 때마다 빈 입력으로 되돌린다 — 이전에 쓰다 만 값이 남아 있으면 안 된다 */
  useEffect(() => {
    if (!open) return;
    setName('');
    setIntervalKey(DEFAULT_INTERVAL);
    setLastCareKey(DEFAULT_LAST_CARE);
    submittingRef.current = false;
    /* 시트가 올라오는 동안 키보드가 먼저 튀어나오지 않게 전환이 끝난 뒤 포커스를 준다 */
    const timer = window.setTimeout(() => nameRef.current?.focus(), reduceMotion ? 0 : 340);
    return () => window.clearTimeout(timer);
  }, [open, reduceMotion]);

  const submit = () => {
    if (submittingRef.current) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    submittingRef.current = true;
    const interval =
      ROUTINE_INTERVALS.find((option) => option.key === intervalKey) ?? ROUTINE_INTERVALS[2];
    const lastCare =
      ROUTINE_LAST_CARES.find((option) => option.key === lastCareKey) ?? ROUTINE_LAST_CARES[0];
    onAdd(
      createRoutine({
        name: trimmed,
        intervalDays: interval.days,
        intervalLabel: interval.label,
        lastCareDaysAgo: lastCare.daysAgo,
      }),
    );
    onClose();
  };

  return (
    <HouseSheet open={open} title="루틴 추가하기" titleId={titleId} onClose={onClose}>
      <div className="lh-sheet__field">
        <label className="lh-sheet__label" htmlFor={nameId}>
          루틴 이름
        </label>
        <input
          id={nameId}
          ref={nameRef}
          className="lh-sheet__input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
          placeholder="예: 배수구 청소"
          maxLength={20}
        />
      </div>

      <div className="lh-sheet__field">
        <span className="lh-sheet__label" id={`${titleId}-interval`}>
          관리 주기
        </span>
        <RoutineChips
          options={ROUTINE_INTERVALS}
          value={intervalKey}
          onChange={setIntervalKey}
          labelledBy={`${titleId}-interval`}
        />
      </div>

      <div className="lh-sheet__field">
        <span className="lh-sheet__label" id={`${titleId}-last`}>
          마지막 관리일
        </span>
        <RoutineChips
          options={ROUTINE_LAST_CARES}
          value={lastCareKey}
          onChange={setLastCareKey}
          labelledBy={`${titleId}-last`}
        />
      </div>

      <motion.button
        type="button"
        className="lh-sheet__submit"
        onClick={submit}
        disabled={name.trim().length === 0}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.14 }}
      >
        추가하기
      </motion.button>
    </HouseSheet>
  );
}

export default AddRoutineSheet;
