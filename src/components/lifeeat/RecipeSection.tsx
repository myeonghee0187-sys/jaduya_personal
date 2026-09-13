import { useRef } from 'react';
import type { RefObject } from 'react';
import { motion, useInView } from 'motion/react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { RECIPES, recipeUsesIngredient } from '../../data/lifeEat';
import type { FridgeItem, Recipe } from '../../data/lifeEat';
import { img } from '../../lib/asset';

interface RecipeSectionProps {
  scrollRoot: RefObject<HTMLElement>;
  selectedIngredient: FridgeItem | null;
  onOpenRecipe: (recipe: Recipe, trigger: HTMLButtonElement) => void;
}

export function RecipeSection({
  scrollRoot, selectedIngredient, onOpenRecipe,
}: RecipeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  // 이 화면은 window가 아니라 main 안에서 스크롤한다. 한 번 나타난 카드는 유지한다.
  const inView = useInView(sectionRef, { root: scrollRoot, once: true, amount: 0.15 });
  const visible = reduceMotion || inView;

  return (
    <section ref={sectionRef} className="le-section le-section--recipes">
      <h2>남은 재료부터 비워봐요</h2>
      <div className="le-recipes">
        {RECIPES.map((recipe, index) => {
          const related = selectedIngredient !== null &&
            recipeUsesIngredient(recipe, selectedIngredient);
          return (
            <motion.button
              key={recipe.id}
              type="button"
              className={`le-recipe le-recipe--${recipe.id}${related ? ' is-related' : ''}`}
              aria-label={`${recipe.title} 레시피 보기`}
              aria-description={related ? `${selectedIngredient?.name} 활용 추천` : undefined}
              aria-haspopup="dialog"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
              whileTap={reduceMotion ? undefined : { scale: 0.975 }}
              transition={{
                opacity: { duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : index * 0.05 },
                y: { duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : index * 0.05 },
                scale: { duration: reduceMotion ? 0 : 0.14, ease: 'easeOut' },
              }}
              onClick={(event) => onOpenRecipe(recipe, event.currentTarget)}
            >
              <span className="le-recipe__photo">
                <img src={img(`life/${recipe.image}`)} alt="" />
              </span>
              <span className="le-recipe__text">
                <span className="le-recipe__title">{recipe.title}</span>
                <span className="le-recipe__tags">
                  {recipe.tags.map((tag, tagIndex) => (
                    <span key={tag} className={related && tagIndex === 1 ? 'is-related' : undefined}>
                      # {tag}
                    </span>
                  ))}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
