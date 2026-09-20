import { useEffect, useId, useRef, useState } from 'react';

/* 메뉴 관리에서 위젯을 바꾸거나, 자리가 부족해 기존 위젯을 정리해야 할 때 뜨는 중앙 Dialog 흐름.
 * "공간 부족 = 추가 불가"가 아니라 "공간 부족 = 기존 위젯과 교체 제안"이라서, 막고 끝나는 Dialog 는 없다.
 * 선택 데이터는 마지막 단계의 확정 버튼(onConfirm)에서만 바뀌고, 취소·닫기·backdrop 은 아무것도 바꾸지 않는다.
 *
 * 단계(step)는 호출부가 다음 흐름 객체를 넘겨서 옮긴다:
 *   prompt  : 안내 + [취소] [다음 행동]  — 다음 단계(onNext)로 이어진다
 *   pick    : 바꿀/정리할 기존 위젯 선택 — 필요한 개수를 다 고르면 변경 내용을 보여주고 [변경하기]
 *   confirm : 현재 → 변경 내용 + [취소] [확정] */

export interface ChangeCompare {
  /** 위쪽 캡션 — 기본은 "현재 위젯" */
  fromCaption?: string;
  fromLabel: string;
  toLabel: string;
}

export interface ChangeCandidate {
  assetId: string;
  label: string;
}

export type MenuChangeFlow =
  | { step: 'prompt'; title: string; body: string; confirmLabel: string; onNext: () => void }
  | { step: 'confirm'; title: string; body: string; compare: ChangeCompare; confirmLabel: string; onConfirm: () => void }
  | {
    step: 'pick';
    title: string;
    hint?: string;
    candidates: readonly ChangeCandidate[];
    /** 고르는 개수 — 1 이면 라디오처럼 하나만, 그 이상이면 정확히 이 개수만큼 고른다 */
    required: number;
    /** 다 골랐을 때 보여줄 변경 내용 */
    compareFor: (selectedIds: string[]) => ChangeCompare;
    onConfirm: (selectedIds: string[]) => void;
  }
  | null;

interface MenuChangeDialogProps {
  flow: MenuChangeFlow;
  onClose: () => void;
}

function Compare({ compare }: { compare: ChangeCompare }) {
  return (
    <div className="menu-change-dialog__compare">
      <div className="menu-change-dialog__side">
        <span className="menu-change-dialog__caption">{compare.fromCaption ?? '현재 위젯'}</span>
        <span className="menu-change-dialog__from">{compare.fromLabel}</span>
      </div>
      <span className="menu-change-dialog__arrow" aria-hidden="true">↓</span>
      <div className="menu-change-dialog__side">
        <span className="menu-change-dialog__caption">변경</span>
        <span className="menu-change-dialog__to">{compare.toLabel}</span>
      </div>
    </div>
  );
}

export function MenuChangeDialog({ flow, onClose }: MenuChangeDialogProps) {
  const titleId = useId();
  /* 닫히는 동안에도 내용이 사라지지 않게 마지막 흐름을 든다 */
  const lastRef = useRef<Exclude<MenuChangeFlow, null> | null>(null);
  if (flow) lastRef.current = flow;
  const shown = flow ?? lastRef.current;

  const [selected, setSelected] = useState<string[]>([]);
  /* 새 흐름(단계)으로 넘어갈 때마다 고른 것을 비운다 */
  useEffect(() => setSelected([]), [flow]);

  const toggle = (assetId: string, required: number) => {
    setSelected((current) => {
      if (current.includes(assetId)) return current.filter((id) => id !== assetId);
      if (required === 1) return [assetId];
      return current.length >= required ? current : [...current, assetId];
    });
  };

  return (
    <div className="layer menu-guide-layer" hidden={!flow}>
      <button type="button" className="layer-dim" aria-label="닫기" onClick={onClose} />
      <section className="menu-guide-dialog menu-change-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        {shown && (
          <>
            <h2 className="menu-change-dialog__title" id={titleId}>{shown.title}</h2>
            {shown.step !== 'pick' && <p className="menu-change-dialog__desc">{shown.body}</p>}
            {shown.step === 'pick' && shown.hint && <p className="menu-change-dialog__desc">{shown.hint}</p>}

            {shown.step === 'confirm' && <Compare compare={shown.compare} />}

            {shown.step === 'pick' && (
              <>
                {shown.required > 1 && (
                  <p className="menu-change-dialog__count" role="status" aria-live="polite">
                    {selected.length} / {shown.required} 선택
                  </p>
                )}
                <ul className="menu-change-dialog__list">
                  {shown.candidates.map((candidate) => {
                    const on = selected.includes(candidate.assetId);
                    return (
                      <li key={candidate.assetId}>
                        <button
                          type="button"
                          className={`menu-change-dialog__option${on ? ' is-selected' : ''}`}
                          aria-pressed={on}
                          disabled={!on && shown.required > 1 && selected.length >= shown.required}
                          onClick={() => toggle(candidate.assetId, shown.required)}
                        >
                          <span className="menu-change-dialog__mark" aria-hidden="true" />
                          {candidate.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {selected.length === shown.required && <Compare compare={shown.compareFor(selected)} />}
              </>
            )}

            <div className="menu-change-dialog__actions">
              <button type="button" className="menu-change-dialog__cancel" onClick={onClose}>취소</button>
              {shown.step === 'prompt' && (
                <button type="button" className="menu-change-dialog__confirm" onClick={shown.onNext}>{shown.confirmLabel}</button>
              )}
              {shown.step === 'confirm' && (
                <button
                  type="button"
                  className="menu-change-dialog__confirm"
                  onClick={() => { shown.onConfirm(); onClose(); }}
                >
                  {shown.confirmLabel}
                </button>
              )}
              {shown.step === 'pick' && (
                <button
                  type="button"
                  className="menu-change-dialog__confirm"
                  disabled={selected.length !== shown.required}
                  onClick={() => { shown.onConfirm(selected); onClose(); }}
                >
                  변경하기
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
