import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { HouseSheet } from '../lifehouse/HouseSheet';
import { RoutineChips } from '../lifehouse/RoutineChips';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { createFridgeItem, isValidConsumeDate } from '../../data/lifeEat';
import type { FridgeItem, FridgeStorageMethod } from '../../data/lifeEat';

const STORAGE_OPTIONS = [
  { key: '냉장', label: '냉장' },
  { key: '냉동', label: '냉동' },
  { key: '실온', label: '실온' },
] as const;

interface AddIngredientSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: FridgeItem) => void;
}

export function AddIngredientSheet({ open, onClose, onAdd }: AddIngredientSheetProps) {
  const id = useId();
  const reduceMotion = usePrefersReducedMotion();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [storageMethod, setStorageMethod] = useState<FridgeStorageMethod>('냉장');
  const [useByDate, setUseByDate] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const submittingRef = useRef(false);

  useLayoutEffect(() => {
    if (!open) return;
    setName('');
    setAmount('');
    setStorageMethod('냉장');
    setUseByDate('');
    composingRef.current = false;
    submittingRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const input = nameRef.current;
      // 시트가 열리는 동안 이미 입력을 시작했다면 포커스를 빼앗지 않는다.
      if (input?.closest('[role="dialog"]')?.contains(document.activeElement)) return;
      input?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 340);
    return () => window.clearTimeout(timer);
  }, [open, reduceMotion]);

  return (
    <HouseSheet open={open} title="보관 중인 재료 추가" titleId={`${id}-title`} onClose={onClose}>
      <form
        className="le-ingredient-form"
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        onKeyDownCapture={(event) => {
          // 한글 조합을 확정하는 Enter가 폼 제출로 이어지지 않게 한다.
          if (
            event.key === 'Enter' &&
            (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229)
          ) {
            event.preventDefault();
          }
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!open || composingRef.current || submittingRef.current || !name.trim() || !amount.trim() || !isValidConsumeDate(useByDate)) return;
          if (!event.currentTarget.reportValidity()) return;
          submittingRef.current = true;
          onAdd(createFridgeItem({ name, amount, storageMethod, useByDate: useByDate || undefined }));
          onClose();
        }}
      >
        <div className="lh-sheet__field">
          <label className="lh-sheet__label" htmlFor={`${id}-name`}>재료 이름</label>
          <input
            ref={nameRef}
            id={`${id}-name`}
            className="lh-sheet__input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 두부, 우유"
            maxLength={40}
            required
          />
        </div>

        <div className="lh-sheet__field">
          <label className="lh-sheet__label" htmlFor={`${id}-amount`}>남은 양</label>
          <input
            id={`${id}-amount`}
            className="lh-sheet__input"
            type="text"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="예: 반 모, 500ml, 2개"
            maxLength={30}
            required
          />
        </div>

        <div className="lh-sheet__field">
          <span className="lh-sheet__label" id={`${id}-storage`}>보관 위치</span>
          <RoutineChips
            options={STORAGE_OPTIONS}
            value={storageMethod}
            onChange={(key) => setStorageMethod(key as FridgeStorageMethod)}
            labelledBy={`${id}-storage`}
          />
        </div>

        <div className="lh-sheet__field">
          <label className="lh-sheet__label" htmlFor={`${id}-date`}>먹어야 하는 날짜</label>
          <input
            id={`${id}-date`}
            className="lh-sheet__input"
            type="date"
            required
            max="9999-12-31"
            value={useByDate}
            onChange={(event) => setUseByDate(event.target.value)}
            aria-describedby={`${id}-date-hint`}
          />
          <p className="le-ingredient-form__hint" id={`${id}-date-hint`}>
            먹을 날짜를 정하면 D-day로 알려드려요.
          </p>
        </div>

        <button
          type="submit"
          className="lh-sheet__submit"
          disabled={!name.trim() || !amount.trim() || !isValidConsumeDate(useByDate)}
        >
          추가하기
        </button>
      </form>
    </HouseSheet>
  );
}
