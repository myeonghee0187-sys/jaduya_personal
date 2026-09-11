import { motion } from 'motion/react';
import type { ChipOption } from '../../data/homecareGuide';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** 단일 선택 칩 그룹 — 문제 유형(type) / 위치·상태(pill) 두 스타일을 공유한다.
 * 선택 상태는 항상 JADUYA Red 계열이 아니라 secondary 배경 + 진한 텍스트로 표시한다
 * (Figma 홈케어 화면 기준. 곰팡이 칩만 primary 텍스트가 섞여 있었지만 빈 텍스트라 무시한다).
 * 배경·테두리 전환은 기존 CSS transition(160ms) 그대로 두고, 누르는 순간의 눌림만
 * Motion 으로 아주 살짝 더한다 — 디자인 값은 건드리지 않는다. */
interface ChipGroupProps {
  options: ChipOption[];
  value: string | null;
  onChange: (key: string) => void;
  /** type: 문제 유형(radius 12px) / pill: 위치·상태(radius 17px) */
  variant: 'type' | 'pill';
  ariaLabel: string;
}

export function ChipGroup({ options, value, onChange, variant, ariaLabel }: ChipGroupProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className={`dc-chip-group dc-chip-group--${variant}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <motion.button
            key={option.key}
            type="button"
            className={`dc-chip dc-chip--${variant}${selected ? ' is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.14 }}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export default ChipGroup;
