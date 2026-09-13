import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../homecare/usePrefersReducedMotion';
import { storageTipForIngredient } from '../../data/lifeEat';
import type { FridgeItem } from '../../data/lifeEat';

interface StorageTipCardProps {
  ingredient: FridgeItem | null;
}

export function StorageTipCard({ ingredient }: StorageTipCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const tip = storageTipForIngredient(ingredient);

  return (
    <section className="le-section le-section--keep">
      <h2>이렇게 보관해봐요!</h2>
      <article className="le-keep" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={ingredient?.id ?? 'default'}
            className="le-keep__content"
            data-tip-for={ingredient?.id ?? 'default'}
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.12, ease: 'linear' }}
          >
            <p className="le-keep__meta">{tip.eyebrow}</p>
            <blockquote className="le-keep__quote">“{tip.quote}”</blockquote>
            <p className="le-keep__body">{tip.description}</p>
          </motion.div>
        </AnimatePresence>
      </article>
    </section>
  );
}
