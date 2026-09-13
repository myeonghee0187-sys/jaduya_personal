import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';

interface RoutineChipsProps {
  options: ReadonlyArray<{ key: string; label: string }>;
  value: string;
  onChange: (key: string) => void;
  labelledBy: string;
}

/* 살림 시트에서 쓰는 단일 선택 칩.
 * 규격(7/12 · radius 17 · 선택 시 brand-secondary)은 홈케어의 .dc-chip--pill 과 같지만,
 * 그쪽 테두리 색은 .daily-care 안에서만 사는 지역 변수라 살림 범위에 따로 둔다. */
export function RoutineChips({ options, value, onChange, labelledBy }: RoutineChipsProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="lh-chips" role="group" aria-labelledby={labelledBy}>
      {options.map((option) => (
        <motion.button
          key={option.key}
          type="button"
          className={`lh-chip${option.key === value ? ' is-selected' : ''}`}
          aria-pressed={option.key === value}
          onClick={() => onChange(option.key)}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ duration: 0.14 }}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  );
}

export default RoutineChips;
