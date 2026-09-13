import { useEffect, useId, useRef } from 'react';
import { motion } from 'motion/react';
import { HouseSheet } from '../lifehouse/HouseSheet';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import type { Recipe } from '../../data/lifeEat';

interface RecipeQuickSheetProps {
  open: boolean;
  recipe: Recipe | null;
  consuming: boolean;
  hasIngredients: boolean;
  onClose: () => void;
  onConsume: () => void;
}

export function RecipeQuickSheet({
  open, recipe, consuming, hasIngredients, onClose, onConsume,
}: RecipeQuickSheetProps) {
  const id = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (open) submittedRef.current = false;
  }, [open, recipe?.id]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const dialog = contentRef.current?.closest('[role="dialog"]');
      // 열리는 동안 이미 조작한 요소의 포커스와 시트 스크롤 위치를 보존한다.
      if (!dialog || dialog.contains(document.activeElement)) return;
      dialog.querySelector<HTMLButtonElement>('.lh-sheet__close')?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 340);
    return () => window.clearTimeout(timer);
  }, [open, recipe?.id, reduceMotion]);

  return (
    <HouseSheet
      open={open}
      title={recipe?.title ?? '레시피'}
      titleId={`${id}-title`}
      onClose={onClose}
    >
      {recipe && (
        <div ref={contentRef} className="le-recipe-sheet">
          <p className="le-recipe-sheet__meta">{recipe.time} · {recipe.tags[1]}</p>

          <div>
            <h3 className="le-recipe-sheet__heading">준비 재료</h3>
            <ul className="le-recipe-sheet__ingredients">
              {recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="le-recipe-sheet__heading">만드는 방법</h3>
            <ol className="le-recipe-sheet__steps">
              {recipe.steps.map((step, index) => (
                <li key={step}>
                  <span className="le-recipe-sheet__step-number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {!hasIngredients && !consuming && (
            <p className="le-recipe-sheet__note">보관 중인 관련 재료가 없어요.</p>
          )}
          <motion.button
            type="button"
            className="lh-sheet__submit"
            disabled={consuming || !hasIngredients}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            transition={{ duration: reduceMotion ? 0 : 0.14 }}
            onClick={() => {
              if (!open || consuming || !hasIngredients || submittedRef.current) return;
              submittedRef.current = true;
              onConsume();
            }}
          >
            {consuming ? '✓ 사용했어요' : '이 레시피로 먹었어요'}
          </motion.button>
        </div>
      )}
    </HouseSheet>
  );
}
