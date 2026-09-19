import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { icon } from '../../lib/asset';
import { CATEGORY_TONE, getWidgetDef } from '../../data/widgetRegistry';
import { WidgetCard } from './WidgetCard';
import { WidgetIconBadge } from './WidgetIconBadge';
import type { WidgetDef } from '../../data/widgetRegistry';
import { findWidgetSlot, getPlacedAt, slotRefEquals } from '../../utils/placement';
import type { PlacementConflict, PlacementState, SlotRef } from '../../utils/placement';
import type { WidgetSize } from '../../types';
import { useDismissOnBack } from '../../navigation/useDismissOnBack';

const EASE = [0.22, 1, 0.36, 1] as const;

const SIZES: WidgetSize[] = ['small', 'medium', 'large'];
const SIZE_LABEL: Record<WidgetSize, string> = { small: 'S', medium: 'M', large: 'L' };

/* 실제 위젯 컴포넌트의 고정 픽셀 크기(tokens.css 의 --widget-*-w/h, --content-width 와
 * 같은 값) — 위젯 자체는 항상 이 크기로 그려지고, Preview 는 이 크기를 바꾸지 않은 채
 * "보여주는 크기"만 축소한다. 이 숫자 자체는 화면에 보여주지 않는다 — 사용자에게는
 * S/M/L 라벨만 의미가 있다. */
const NATIVE_SIZE: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 128.5, h: 72 },
  medium: { w: 167, h: 114 },
  large: { w: 342, h: 114 },
};

/* 모달이 지금 보여주는 화면 — 셋 다 같은 모달(.wpg-modal) 높이 안에서, 같은 방식으로
 * 전환되는 "한 페이지"다. 별도 화면 이동도, 딤 배경 위에 뜨는 추가 팝업도 없다.
 *   preview        기본: 미리보기 + S/M/L + CTA(사용 가능/사용 중/크기 변경/공간 부족/
 *                  지원하지 않는 크기)
 *   making-space   공간 부족 → "공간 만들기"로 전환된 비울 위젯 선택 화면. 여기서
 *                  "선택한 위젯 N개 비우고 추가"를 누르면 별도 확인 단계 없이 바로
 *                  처리되고 success 로 넘어간다(사용자가 이미 명확한 CTA를 눌렀다).
 *   success        방금 배치까지 끝낸 뒤 보여주는 완료 화면 */
type ModalStep = 'preview' | 'making-space' | 'success';

interface WidgetPreviewModalProps {
  def: WidgetDef | null;
  initialSize?: WidgetSize;
  /** 이 위젯이 지금 어디에(어떤 크기로) 이미 놓여 있는지, 공간 만들기 화면에서 뭘 비울지
   * 보여주려고 전체 배치 상태를 받는다 */
  placementState: PlacementState;
  checkPlacement: (widgetId: string, size: WidgetSize) => { ok: boolean; conflict?: PlacementConflict };
  /** wasExisting: 새로 추가한 게 아니라 이미 있던 위젯의 크기를 바꾼 것인지 —
   * 호출부(WidgetPage)가 토스트 문구("추가했어요" / "크기를 변경했어요")를 고르는 데 쓴다 */
  onAdd: (widgetId: string, size: WidgetSize, wasExisting: boolean) => void;
  /** "공간 만들기" 화면에서 위젯을 다 고르고 CTA를 눌렀을 때 — 고른 자리를 비우고 새
   * 위젯을 놓거나 기존 위젯의 크기를 바꾼다. 모달은 이 호출 후에도 닫히지 않고 success
   * 화면을 보여준 뒤 사용자가 닫으면 그때 onClose 가 불린다. */
  onResolveConflict: (widgetId: string, size: WidgetSize, refs: SlotRef[], wasExisting: boolean) => void;
  onClose: () => void;
}

/** 위젯 카드를 눌렀을 때 뜨는 중앙 모달 — 실제 카드 크기로 S/M/L을 바로 비교한다.
 * 상황에 따라 하단 CTA가 5가지로 바뀐다:
 *   1) 새로 추가 가능           → "+ 내 위젯에 추가" (강조 버튼)
 *   2) 이미 이 크기로 추가됨     → "✓ 사용 중" (강조 버튼과 같은 자리, disabled)
 *   3) 다른 크기로 이미 추가됨   → "위젯 크기 변경" (실행 가능한 보조 버튼)
 *   4) 공간 부족                → 경고 문구 + "공간 만들기" (누르면 이 모달 안에서
 *      바로 비울 위젯을 고르고 즉시 처리한다 — 화면 전환도, 다른 팝업도, 확인 한 번
 *      더 묻는 단계도 없다)
 *   5) 지원하지 않는 크기       → 안내 문구 + "추가할 수 없어요"(disabled)
 *
 * 모달(.wpg-modal) 자체는 step 과 무관하게 항상 같은 고정 높이다. 내용이 긴 step
 * (preview/success)은 위쪽부터 자연스럽게 흐르고, 내용이 짧은 step(making-space)은
 * 전체 그룹(제목+목록+CTA)이 그 높이 안에서 가운데로 온다 — CTA만 뚝 떨어져 바닥에
 * 붙어 있고 그 위로 빈 공간만 넓게 남는 모양을 만들지 않는다. */
export function WidgetPreviewModal({
  def,
  initialSize,
  placementState,
  checkPlacement,
  onAdd,
  onResolveConflict,
  onClose,
}: WidgetPreviewModalProps) {
  const titleId = useId();
  const reduceMotion = usePrefersReducedMotion();
  const [size, setSize] = useState<WidgetSize>(initialSize ?? 'medium');
  const [step, setStep] = useState<ModalStep>('preview');
  const [selectedRefs, setSelectedRefs] = useState<SlotRef[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  /* Preview 영역(고정 크기) 대비 지금 크기의 실제 위젯이 얼마나 축소돼야 전체가
   * 잘리지 않고 들어오는지 — 1을 넘지 않는다(S를 M/L 폭으로 억지로 키우지 않는다). */
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!def) return;
    setSize(initialSize && def.availableSizes.includes(initialSize) ? initialSize : def.availableSizes[0]);
    setStep('preview');
    setSelectedRefs([]);
  }, [def, initialSize]);

  /* Preview 영역 크기는 S/M/L 과 무관하게 고정이다 — 그 안에서 지금 크기의 위젯이
   * 가로/세로 중 더 빠듯한 쪽 기준으로 contain 축소되도록 매 크기 변경·리사이즈마다
   * 다시 계산한다. 잘라내지 않고(overflow) 비율만 줄인다. */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const recalc = () => {
      const { w: nativeW, h: nativeH } = NATIVE_SIZE[size];
      const availW = stage.clientWidth;
      const availH = stage.clientHeight;
      if (!availW || !availH) return;
      setScale(Math.min(1, availW / nativeW, availH / nativeH));
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [size, def?.id, step]);

  /* 열려 있는 동안(def !== null) 뒤로가기 한 단계를 가져간다 — 시스템 뒤로가기가 오면
   * 이 모달부터 닫는다. 다른 훅들처럼 이른 return(!def) 보다 먼저 호출해서 훅 순서를 지킨다. */
  useDismissOnBack(def !== null, onClose);

  if (!def) return null;

  const sizeSupported = def.availableSizes.includes(size);
  const native = NATIVE_SIZE[size];
  const tone = CATEGORY_TONE[def.category];

  /* 지금 이 위젯이 이미 어디엔가 놓여 있는지 — 크기까지 포함해서 안다 */
  const existing = findWidgetSlot(placementState, def.id);
  const isSameSize = existing?.size === size;
  /* 이미 같은 크기로 놓여 있거나, 지원하지 않는 크기를 보는 중이면 "다시 놓기"를
   * 확인할 필요가 없다 — 순수 조회라 렌더 중에도 안전하다 */
  const placeCheck = isSameSize || !sizeSupported ? null : checkPlacement(def.id, size);
  const conflict = placeCheck && !placeCheck.ok ? placeCheck.conflict : undefined;
  const rowLabel = conflict?.row === 'medium' ? 'M' : 'S';
  /* 지금 하려는 일이 "새로 추가"가 아니라 "이미 있는 위젯의 크기 변경"인지 —
   * 토스트 문구("추가했어요" / "크기를 변경했어요")를 고르는 기준이 된다 */
  const isResize = Boolean(existing);

  const handleAdd = () => {
    const result = checkPlacement(def.id, size);
    if (result.ok) {
      onAdd(def.id, size, isResize);
      onClose();
    }
    /* result.ok 가 아니면 이 버튼은 애초에 "위젯 크기 변경" 용도라 공간 걱정이 없어야
     * 정상이다 — 혹시 그새 상태가 바뀌었다면 아무 것도 하지 않고 CTA가 다시 그려지며
     * 공간 부족 쪽으로 스스로 바뀐다. */
  };

  const toggleSelected = (ref: SlotRef) => {
    if (!conflict) return;
    setSelectedRefs((prev) => {
      if (prev.some((r) => slotRefEquals(r, ref))) return prev.filter((r) => !slotRefEquals(r, ref));
      if (prev.length >= conflict.requiredRemovalCount) return prev;
      return [...prev, ref];
    });
  };

  /* "선택한 위젯 N개 비우고 추가" — 사용자가 이미 명확한 CTA를 눌렀으므로 별도의
   * "정말 진행할까요?" 확인 단계 없이 바로 자리를 비우고 위젯을 놓는다. */
  const handleMakeSpace = () => {
    if (!conflict || selectedRefs.length !== conflict.requiredRemovalCount) return;
    onResolveConflict(def.id, size, selectedRefs, isResize);
    setStep('success');
  };

  /* preview / success 두 화면이 함께 쓰는 위젯 미리보기 + 크기 선택 블록 — 이후 CTA만 다르다.
   * S/M/L 아래에 실측 픽셀(예: "342 × 114")은 표시하지 않는다 — 사용자에게 필요한 건
   * 크기 라벨뿐이다. 지원하지 않는 크기도 버튼 자체는 항상 보여주고 disabled 로 둬서
   * "이 위젯은 이 크기가 없구나"를 바로 알 수 있게 한다(눌러도 반응 없는 버튼 대신). */
  const stageBlock = (
    <>
      <span className={`wpg-modal__cat wpg-modal__cat--${tone}`}>{def.category}</span>
      <h3 className="wpg-modal__title">{def.name}</h3>
      <p className="wpg-modal__desc">{def.description}</p>

      <div className={`wpg-modal__stage wpg-modal__stage--${tone}`}>
        <div className="wpg-modal__viewport" ref={stageRef}>
          {sizeSupported && (
            <div
              className="wpg-modal__stage-inner"
              style={{ width: native.w, height: native.h, transform: `scale(${scale})` }}
            >
              <WidgetCard def={def} size={size} variant="preview" />
            </div>
          )}
        </div>
      </div>

      <div className="wpg-modal__sizes" role="radiogroup" aria-label="위젯 크기">
        {SIZES.map((s) => {
          const supported = def.availableSizes.includes(s);
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              disabled={!supported}
              className={`wpg-modal__size-btn${size === s ? ' is-active' : ''}`}
              onClick={() => {
                setSize(s);
                /* 완료 화면에서 바로 다른 크기를 눌렀다면 "다시 미리보기"로 돌아가서
                 * 그 크기에 맞는 CTA(추가 가능/공간 부족 등)를 새로 보여준다 — 완료
                 * 화면에 그대로 머물러 있으면 방금 크기를 바꿨다는 메시지가 새로 고른
                 * 크기와 안 맞게 남아 있었다. */
                if (step === 'success') setStep('preview');
              }}
            >
              {SIZE_LABEL[s]}
            </button>
          );
        })}
      </div>
    </>
  );

  let stepContent: ReactNode = null;

  if (step === 'making-space' && conflict) {
    stepContent = (
      <>
        <h3 className="wpg-modal__space-title">
          {isResize ? `위젯을 ${SIZE_LABEL[size]} 크기로 변경하려면` : `${SIZE_LABEL[size]} 위젯을 추가하려면`}
          <br />
          아래 위젯 중 {conflict.requiredRemovalCount}개를 선택해주세요.
        </h3>

        <div className="wpg-modal__space-list">
          {conflict.occupied.map((ref, i) => {
            const placed = getPlacedAt(placementState, ref);
            if (!placed) return null;
            const itemDef = getWidgetDef(placed.widgetId);
            if (!itemDef) return null;
            const checked = selectedRefs.some((r) => slotRefEquals(r, ref));
            return (
              <button
                key={i}
                type="button"
                className={`wpg-modal__space-item${checked ? ' is-selected' : ''}`}
                aria-pressed={checked}
                onClick={() => toggleSelected(ref)}
              >
                <span className="wpg-modal__space-check" aria-hidden="true" />
                <WidgetIconBadge icon={itemDef.icon} category={itemDef.category} size="sm" />
                <span className="wpg-modal__space-body">
                  <span className="wpg-modal__space-name">{itemDef.name}</span>
                  <span className="wpg-modal__space-desc">{itemDef.description}</span>
                </span>
                <span className="wpg-modal__space-tag">{SIZE_LABEL[placed.size]}</span>
              </button>
            );
          })}
        </div>

        <div className="wpg-modal__cta">
          <p className="wpg-modal__space-count">
            선택한 위젯 {selectedRefs.length} / {conflict.requiredRemovalCount}개
          </p>
          <button
            type="button"
            className="auth-button wpg-modal__submit"
            disabled={selectedRefs.length !== conflict.requiredRemovalCount}
            onClick={handleMakeSpace}
          >
            선택한 위젯 {conflict.requiredRemovalCount}개 비우고 추가
          </button>
        </div>
      </>
    );
  } else if (step === 'success') {
    stepContent = (
      <>
        {stageBlock}
        <div className="wpg-modal__cta">
          <div className="wpg-modal__success">
            <span aria-hidden="true">✓</span> {isResize ? '위젯 크기를 변경했어요!' : '위젯이 추가되었어요!'}
          </div>
          <p className="wpg-modal__hint">내 위젯에서 확인해보세요.</p>
          <button type="button" className="auth-button wpg-modal__submit" onClick={onClose}>
            확인
          </button>
        </div>
      </>
    );
  } else {
    /* 기본: preview — CTA 5가지 상태 */
    stepContent = (
      <>
        {stageBlock}
        <div className="wpg-modal__cta">
          {!sizeSupported ? (
            <>
              <p className="wpg-modal__hint wpg-modal__hint--warn">
                {SIZE_LABEL[size]} 크기는 지원하지 않는 위젯이에요.
              </p>
              <button type="button" className="auth-button wpg-modal__submit" disabled>
                추가할 수 없어요
              </button>
            </>
          ) : isSameSize ? (
            <button type="button" className="auth-button wpg-modal__submit" disabled>
              ✓ 사용 중
            </button>
          ) : conflict ? (
            <>
              <div className="wpg-modal__warn" role="alert">
                <span className="wpg-modal__warn-icon" aria-hidden="true">
                  !
                </span>
                <span>
                  {rowLabel} 위젯 {conflict.requiredRemovalCount}개의 공간이 필요해요.
                </span>
              </div>
              <button
                type="button"
                className="wpg-modal__secondary-btn"
                onClick={() => {
                  setSelectedRefs([]);
                  setStep('making-space');
                }}
              >
                공간 만들기
              </button>
            </>
          ) : existing ? (
            <>
              <button type="button" className="wpg-modal__secondary-btn" onClick={handleAdd}>
                <span aria-hidden="true">⇄</span> 위젯 크기 변경
              </button>
              <p className="wpg-modal__hint">
                현재 {SIZE_LABEL[existing.size]} 사이즈로 사용 중이에요. {SIZE_LABEL[size]} 사이즈로 변경할까요?
              </p>
            </>
          ) : (
            <button type="button" className="auth-button wpg-modal__submit" onClick={handleAdd}>
              + 내 위젯에 추가
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="wpg-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wpg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wpg-modal__head">
          <h2 className="wpg-modal__head-title" id={titleId}>
            위젯 미리보기
          </h2>
          <button type="button" className="wpg-modal__close" aria-label="닫기" onClick={onClose}>
            <img src={icon('widget-close.svg')} alt="" />
          </button>
        </div>

        <div className="wpg-modal__body">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className={`wpg-modal__step${step === 'making-space' ? ' wpg-modal__step--center' : ''}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
            >
              {stepContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
