import { useEffect, useId, useState } from 'react';
import { motion } from 'motion/react';
import { HouseSheet } from './HouseSheet';
import { RoutineChips } from './RoutineChips';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { ROUTINE_INTERVALS } from '../../data/lifeHouse';
import type { HouseRoutine } from '../../data/lifeHouse';

interface IntervalSheetProps {
  /** 주기를 고치는 대상 루틴. null 이면 시트가 닫힌 상태다. */
  routine: HouseRoutine | null;
  onClose: () => void;
  onSave: (intervalDays: number, intervalLabel: string) => void;
}

/** 지금 주기와 가장 가까운 선택지 — 목록에 없는 일수도 칩 하나는 눌린 상태로 연다. */
function nearestIntervalKey(days: number): string {
  return ROUTINE_INTERVALS.reduce((best, option) =>
    Math.abs(option.days - days) < Math.abs(best.days - days) ? option : best,
  ).key;
}

/* 확장 패널의 "주기 수정" — 주기만 고르는 작은 시트. */
export function IntervalSheet({ routine, onClose, onSave }: IntervalSheetProps) {
  const reduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const [intervalKey, setIntervalKey] = useState<string>('m1');

  useEffect(() => {
    if (!routine) return;
    setIntervalKey(nearestIntervalKey(routine.intervalDays));
  }, [routine]);

  const save = () => {
    const interval =
      ROUTINE_INTERVALS.find((option) => option.key === intervalKey) ?? ROUTINE_INTERVALS[2];
    onSave(interval.days, interval.label);
    onClose();
  };

  return (
    <HouseSheet open={routine !== null} title="주기 수정" titleId={titleId} onClose={onClose}>
      <p className="lh-sheet__desc">
        {routine ? `${routine.name}를 얼마마다 관리할까요?` : ''}
      </p>

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

      <motion.button
        type="button"
        className="lh-sheet__submit"
        onClick={save}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.14 }}
      >
        저장하기
      </motion.button>
    </HouseSheet>
  );
}

export default IntervalSheet;
