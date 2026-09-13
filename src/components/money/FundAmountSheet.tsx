import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { BottomSheet } from '../BottomSheet';
import { icon } from '../../lib/asset';

/* JADUYA — 비상금 탭의 "목표 수정하기" / "추가로 모으기"가 공유하는 입력 시트.
 * 두 흐름 모두 "금액 하나를 입력해서 저장" 이라는 같은 모양이라 컴포넌트를 나누지
 * 않고 mode props 로만 문구/기본값을 바꾼다. 별도 화면(route)을 새로 만들지 않고
 * 기존 GNB 메뉴 편집(BottomSheet.tsx)이 쓰는 공용 시트 셸을 그대로 재사용한다. */

const QUICK_ADD_AMOUNTS = [10_000, 50_000, 100_000];

interface FundAmountSheetProps {
  open: boolean;
  mode: 'goal' | 'add';
  /** goal: 현재 목표 금액 / add: 현재까지 모은 금액 — 안내 문구에만 쓴다 */
  referenceAmount: number;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

export function FundAmountSheet({ open, mode, referenceAmount, onClose, onSubmit }: FundAmountSheetProps) {
  const titleId = useId();
  const isGoal = mode === 'goal';
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) return;
    setValue(isGoal ? String(referenceAmount) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const numeric = Number(value.replace(/[^0-9]/g, ''));
  const canSubmit = numeric > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(numeric);
    onClose();
  };

  const addQuick = (amount: number) => {
    setValue((prev) => String((Number(prev.replace(/[^0-9]/g, '')) || 0) + amount));
  };

  return (
    <BottomSheet
      open={open}
      className="fund-sheet"
      labelledBy={titleId}
      onDimClick={onClose}
    >
      <div className="bsheet__grip">
        <span />
      </div>

      <div className="fund-sheet__header">
        <h2 className="fund-sheet__title" id={titleId}>
          {isGoal ? '비상금 목표를 바꿔볼까요?' : '얼마를 더 모을까요?'}
        </h2>
        <button type="button" className="fund-sheet__close" aria-label="닫기" onClick={onClose}>
          <img src={icon('sheet-close.svg')} alt="" />
        </button>
      </div>

      <p className="fund-sheet__ref">
        {isGoal ? '현재 목표' : '지금까지 모은 비상금'}
        <b>{referenceAmount.toLocaleString()}원</b>
      </p>

      <form className="fund-sheet__form" onSubmit={handleSubmit}>
        <label className="fund-sheet__field">
          <span className="fund-sheet__label">{isGoal ? '목표 금액' : '추가할 금액'}</span>
          <span className="fund-sheet__input-row">
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={value ? Number(value.replace(/[^0-9]/g, '')).toLocaleString() : ''}
              onChange={(e) => setValue(e.target.value)}
              aria-label={isGoal ? '목표 금액' : '추가할 금액'}
            />
            <span>원</span>
          </span>
        </label>

        {!isGoal && (
          <div className="fund-sheet__quick">
            {QUICK_ADD_AMOUNTS.map((amount) => (
              <button
                type="button"
                key={amount}
                className="fund-sheet__quick-btn"
                onClick={() => addQuick(amount)}
              >
                +{amount.toLocaleString()}
              </button>
            ))}
          </div>
        )}

        <button type="submit" className="fund-sheet__submit" disabled={!canSubmit}>
          {isGoal ? '저장하기' : '추가하기'}
        </button>
      </form>
    </BottomSheet>
  );
}

export default FundAmountSheet;
