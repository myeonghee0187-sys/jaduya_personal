import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { HouseSheet } from '../lifehouse/HouseSheet';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { isValidConsumeDate, localDateString } from '../../data/lifeEat';
import type { FridgeItem } from '../../data/lifeEat';

interface IngredientDateSheetProps {
  open: boolean;
  item: FridgeItem | null;
  onClose: () => void;
  onSave: (id: string, date: string) => void;
}

export function IngredientDateSheet({ open, item, onClose, onSave }: IngredientDateSheetProps) {
  const id = useId();
  const reduceMotion = usePrefersReducedMotion();
  const [date, setDate] = useState('');
  const dateRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const submittingRef = useRef(false);

  useLayoutEffect(() => {
    if (!open || !item) return;
    setDate(item.useByDate && isValidConsumeDate(item.useByDate) ? item.useByDate : localDateString());
    composingRef.current = false;
    submittingRef.current = false;
  }, [open, item?.id]);

  useEffect(() => {
    if (!open || !item) return;
    const timer = window.setTimeout(() => {
      const input = dateRef.current;
      const dialog = input?.closest('[role="dialog"]');
      // 열리는 동안 사용자가 먼저 누른 입력·버튼의 포커스를 빼앗지 않는다.
      if (!input || !dialog || dialog.contains(document.activeElement)) return;
      input.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 340);
    return () => window.clearTimeout(timer);
  }, [open, item?.id, reduceMotion]);

  return (
    <HouseSheet open={open} title="먹어야 하는 날짜 수정" titleId={`${id}-title`} onClose={onClose}>
      <form
        className="le-date-form"
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        onKeyDownCapture={(event) => {
          if (event.key === 'Enter' && (
            composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229
          )) event.preventDefault();
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!open || !item || composingRef.current || submittingRef.current || !isValidConsumeDate(date)) return;
          if (!event.currentTarget.reportValidity()) return;
          submittingRef.current = true;
          onSave(item.id, date);
          onClose();
        }}
      >
        <div className="lh-sheet__field">
          <label className="lh-sheet__label" htmlFor={`${id}-date`}>
            {item?.name} 먹어야 하는 날짜
          </label>
          <input
            ref={dateRef}
            id={`${id}-date`}
            className="lh-sheet__input"
            type="date"
            max="9999-12-31"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-describedby={`${id}-hint`}
            required
          />
          <p className="le-ingredient-form__hint" id={`${id}-hint`}>
            날짜를 저장하면 D-day가 함께 바뀌어요.
          </p>
        </div>
        <button type="submit" className="lh-sheet__submit" disabled={!item || !isValidConsumeDate(date)}>
          날짜 저장
        </button>
      </form>
    </HouseSheet>
  );
}
