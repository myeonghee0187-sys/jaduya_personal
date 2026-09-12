import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { fridgeItemDaysRemaining, fridgeItemDdayLabel } from '../../data/lifeEat';
import type { FridgeItem } from '../../data/lifeEat';

const EASE = [0.22, 1, 0.36, 1] as const;

interface IngredientItemProps {
  item: FridgeItem;
  now: Date;
  expanded: boolean;
  selected: boolean;
  consuming: boolean;
  onToggle: (id: string) => void;
  onConsume: (id: string) => void;
  onEditDate: (id: string, trigger: HTMLButtonElement) => void;
}

interface IngredientManagementPanelProps {
  itemId: string;
  panelId: string;
  triggerId: string;
  consuming: boolean;
  onConsume: (id: string) => void;
  onEditDate: (id: string, trigger: HTMLButtonElement) => void;
}

function IngredientManagementPanel({
  itemId, panelId, triggerId, consuming, onConsume, onEditDate,
}: IngredientManagementPanelProps) {
  const reduceMotion = usePrefersReducedMotion();
  const isPresent = useIsPresent();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 퇴장 모션 동안 화면에 남는 패널에는 키보드 포커스가 들어가지 않는다.
    if (panelRef.current) panelRef.current.inert = !isPresent;
  }, [isPresent]);

  return (
    <motion.div
      ref={panelRef}
      id={panelId}
      className="le-item__panel"
      role="region"
      aria-labelledby={triggerId}
      aria-hidden={!isPresent}
      initial={reduceMotion ? false : { opacity: 0, height: 0, y: -4 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={reduceMotion
        ? { opacity: 0, height: 0, transition: { duration: 0 } }
        : { opacity: 0, height: 0, y: -4, transition: { duration: 0.24, ease: EASE } }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
    >
      <div className="le-item__actions">
        <motion.button
          type="button"
          className={`le-item__action le-item__action--done${consuming ? ' is-done' : ''}`}
          disabled={consuming || !isPresent}
          onClick={() => onConsume(itemId)}
          whileTap={reduceMotion ? undefined : { scale: 0.975 }}
          transition={{ duration: 0.14 }}
        >
          {consuming ? '✓ 먹었어요' : '먹었어요'}
        </motion.button>
        <motion.button
          type="button"
          className="le-item__action"
          aria-haspopup="dialog"
          disabled={consuming || !isPresent}
          onClick={(event) => onEditDate(itemId, event.currentTarget)}
          whileTap={reduceMotion ? undefined : { scale: 0.975 }}
          transition={{ duration: 0.14 }}
        >
          날짜 수정
        </motion.button>
      </div>
    </motion.div>
  );
}

/** 기존 재료 행 안에서만 관리 액션을 펼친다. 펼침·선택·소비 상태는 목록이 관리한다. */
export const IngredientItem = forwardRef<HTMLLIElement, IngredientItemProps>(function IngredientItem({
  item, now, expanded, selected, consuming, onToggle, onConsume, onEditDate,
}, ref) {
  const reduceMotion = usePrefersReducedMotion();
  const id = useId();
  const label = fridgeItemDdayLabel(item, now);
  const latestLabelRef = useRef(label);
  const [reservedLabels, setReservedLabels] = useState([label]);
  useLayoutEffect(() => {
    latestLabelRef.current = label;
    // 빠르게 여러 번 수정해도 퇴장 중인 라벨보다 칩이 먼저 작아지지 않는다.
    setReservedLabels((labels) => reduceMotion
      ? (labels.length === 1 && labels[0] === label ? labels : [label])
      : (labels.includes(label) ? labels : [...labels, label]));
  }, [label, reduceMotion]);
  const days = fridgeItemDaysRemaining(item, now);
  const urgency = days === null ? 'undated'
    : days < 0 ? 'overdue'
      : days === 0 ? 'today'
        : days === 1 ? 'soon'
          : days >= 5 ? 'later' : 'normal';

  return (
    <motion.li
      ref={ref}
      className={`le-item${selected ? ' is-selected' : ''}${consuming ? ' is-consuming' : ''}`}
      data-ingredient-id={item.id}
      layout={reduceMotion ? false : 'position'}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : -6, transition: { duration: reduceMotion ? 0 : 0.24 } }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
    >
      <motion.button
        type="button"
        id={`${id}-trigger`}
        className="le-item__trigger"
        aria-label={`${item.name} 관리`}
        aria-describedby={`${id}-detail ${id}-dday`}
        aria-pressed={selected}
        aria-expanded={expanded}
        aria-controls={`${id}-panel`}
        disabled={consuming}
        onClick={() => onToggle(item.id)}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.14 }}
      >
        <span className="le-item__info">
          <span className="le-item__name">{item.name}</span>
          {item.amountIsNumeric ? (
            <span id={`${id}-detail`} className="le-item__detail le-item__detail--mixed">
              <span className="le-item__detail--numeric">{item.amount}</span>
              <span className="le-item__detail--numeric">·</span>
              <span>{item.storage}</span>
            </span>
          ) : (
            <span id={`${id}-detail`} className="le-item__detail">{item.amount} · {item.storage}</span>
          )}
        </span>
        <span id={`${id}-dday`} className="le-item__dday" data-urgency={urgency} data-dday={label} aria-label={label}>
          <span className="le-item__dday-content" aria-hidden="true">
            {[...new Set([...reservedLabels, label])].map((reserved) => (
              <span
                key={reserved}
                className={`le-item__dday-sizer${/^(?:D-day|D\s*-\s*\d)$/i.test(reserved) ? ' is-compact' : ''}`}
              >
                {reserved}
              </span>
            ))}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={label}
                className="le-item__dday-value"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.12, ease: EASE }}
                onAnimationComplete={(definition) => {
                  if (typeof definition === 'object' && 'opacity' in definition &&
                    definition.opacity === 1 && latestLabelRef.current === label) {
                    setReservedLabels((labels) => labels.length === 1 && labels[0] === label ? labels : [label]);
                  }
                }}
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <IngredientManagementPanel
            key="management"
            itemId={item.id}
            panelId={`${id}-panel`}
            triggerId={`${id}-trigger`}
            consuming={consuming}
            onConsume={onConsume}
            onEditDate={onEditDate}
          />
        )}
      </AnimatePresence>
    </motion.li>
  );
});
