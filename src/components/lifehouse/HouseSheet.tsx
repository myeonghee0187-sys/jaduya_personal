import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { icon } from '../../lib/asset';

const EASE = [0.22, 1, 0.36, 1] as const;

interface HouseSheetProps {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}

/* 살림 전용 Bottom Sheet 셸.
 *
 * 공용 BottomSheet 는 `hidden`(display:none) 으로 여닫아서 퇴장 애니메이션을 걸 자리가 없고,
 * 그 컴포넌트를 고치면 위젯 추가·메뉴 편집까지 영향을 받는다. 그래서 살림 범위 안에서
 * 따로 두고, 공용 컴포넌트는 손대지 않는다.
 *
 * 쌓임 순서는 .lh-sheet-layer 의 z-index(70) 로 정한다 — 콘텐츠 < AI 버튼(50) <
 * 바텀네비(40)·기존 오버레이(60) < 이 시트. 시트가 떠 있는 동안 그 둘이 위로 올라오지 않는다.
 *
 * 접근성: role="dialog" + aria-modal, 열면 시트 안으로 포커스를 넣고 닫으면 되돌리며,
 * Escape 로 닫히고 Tab 은 시트 안에서만 돈다. 배경 탭과 닫기 버튼으로도 닫힌다. */
export function HouseSheet({ open, title, titleId, onClose, children }: HouseSheetProps) {
  const reduceMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  useEffect(() => {
    if (open) return;
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        /* AnimatePresence 의 직계 자식은 motion 이어야 퇴장 완료를 제대로 기다린다 */
        <motion.div
          className="lh-sheet-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'linear' }}
        >
          <button
            type="button"
            className="lh-sheet-dim"
            aria-label="닫기"
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            className="lh-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { y: 0 } : { y: '100%', transition: { duration: 0.26 } }}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: EASE }}
          >
            <div className="lh-sheet__grip" aria-hidden="true">
              <span />
            </div>

            <div className="lh-sheet__head">
              <h2 className="lh-sheet__title" id={titleId}>
                {title}
              </h2>
              <button
                type="button"
                className="lh-sheet__close"
                aria-label={`${title} 닫기`}
                onClick={onClose}
              >
                <img src={icon('sheet-close.svg')} alt="" />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HouseSheet;
