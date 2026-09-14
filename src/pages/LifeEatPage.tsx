import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { AddIngredientSheet } from '../components/lifeeat/AddIngredientSheet';
import { IngredientDateSheet } from '../components/lifeeat/IngredientDateSheet';
import { IngredientItem } from '../components/lifeeat/IngredientItem';
import { RecipeSection } from '../components/lifeeat/RecipeSection';
import { RecipeQuickSheet } from '../components/lifeeat/RecipeQuickSheet';
import { StorageTipCard } from '../components/lifeeat/StorageTipCard';
import { useFridgeIngredients } from '../components/lifeeat/useFridgeIngredients';
import { usePrefersReducedMotion } from '../components/homecare/usePrefersReducedMotion';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { SubPageHeader } from '../components/SubPageHeader';
import { CategoryTabs } from '../components/homecare/CategoryTabs';
import { DEFAULT_MENU } from '../data/menuCatalog';
import { fridgeItemDaysRemaining, localDateString, mostUrgentFridgeItem, recipeUsesIngredient } from '../data/lifeEat';
import type { FridgeItem, Recipe } from '../data/lifeEat';
import { icon } from '../lib/asset';

type SheetKind = 'add' | 'date' | 'recipe' | null;

/* 생활 > 먹거리 — Figma daily_eat (2628:28631)의 배치 안에서
 * 재료 확인 → 관리 → 남은 재료 활용 → 보관법 확인으로 이어진다. */
export function LifeEatPage() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const ownerKey = user?.email.trim().toLowerCase() ?? 'guest';
  const { ingredients, saveFailed, addIngredient, consumeIngredients, updateIngredientDate } =
    useFridgeIngredients(ownerKey);
  const reduceMotion = usePrefersReducedMotion();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [today, setToday] = useState(() => localDateString());
  const now = useMemo(() => new Date(`${today}T12:00:00`), [today]);
  // 소비 확인 중인 행은 제외하고, 실제 활성 재료에서만 다음 선택을 계산한다.
  const mostUrgentIngredient = useMemo(() => mostUrgentFridgeItem(ingredients, now), [ingredients, now]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(
    () => mostUrgentIngredient?.id ?? null,
  );
  const [expandedIngredientId, setExpandedIngredientId] = useState<string | null>(null);
  const [sheetKind, setSheetKind] = useState<SheetKind>(null);
  const [editingIngredient, setEditingIngredient] = useState<FridgeItem | null>(null);
  const [recipeSheet, setRecipeSheet] = useState<Recipe | null>(null);
  const [consumingItems, setConsumingItems] = useState<FridgeItem[]>([]);
  const [consumingRecipeId, setConsumingRecipeId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const scrollRef = useRef<HTMLElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const sheetKindRef = useRef<SheetKind>(null);
  const sheetSequenceRef = useRef(0);
  const recipeLockRef = useRef(false);
  const timersRef = useRef(new Set<number>());
  const orderRef = useRef(new Map(ingredients.map((item, index) => [item.id, index])));
  const nextOrderRef = useRef(ingredients.length);

  useEffect(() => {
    // 날짜 수정·재료 추가 시 유효한 선택은 유지한다. 선택한 재료가 사라질 때만 넘긴다.
    setSelectedIngredientId((current) =>
      current !== null && ingredients.some((item) => item.id === current)
        ? current
        : mostUrgentIngredient?.id ?? null,
    );
  }, [ingredients, mostUrgentIngredient]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    // 열린 채로 자정을 지나거나 앱으로 돌아와도 날짜가 어제에 머물지 않는다.
    const refreshDate = () => setToday(localDateString());
    const timer = window.setInterval(refreshDate, 60_000);
    window.addEventListener('focus', refreshDate);
    document.addEventListener('visibilitychange', refreshDate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshDate);
      document.removeEventListener('visibilitychange', refreshDate);
    };
  }, []);

  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
  };

  const openSheet = (kind: Exclude<SheetKind, null>, trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    sheetKindRef.current = kind;
    sheetSequenceRef.current += 1;
    setSheetKind(kind);
  };

  const closeSheet = useCallback(() => {
    sheetKindRef.current = null;
    sheetSequenceRef.current += 1;
    setSheetKind(null);
    requestAnimationFrame(() => {
      if (sheetKindRef.current !== null) return;
      const target = returnFocusRef.current;
      if (target?.isConnected && !target.matches(':disabled') && !target.closest('[inert]')) target.focus({ preventScroll: true });
      else addButtonRef.current?.focus({ preventScroll: true });
    });
  }, []);

  // 소비한 행은 짧은 확인 표시만 남기고, 저장되는 활성 목록에서는 즉시 제거한다.
  const displayedIngredients = [...ingredients, ...consumingItems].sort((a, b) => {
    const aDays = fridgeItemDaysRemaining(a, now) ?? Infinity;
    const bDays = fridgeItemDaysRemaining(b, now) ?? Infinity;
    if (aDays !== bDays) return aDays - bDays;
    return (orderRef.current.get(a.id) ?? 0) - (orderRef.current.get(b.id) ?? 0);
  });
  // Effect가 상태를 맞추는 렌더에서도 재료·레시피·팁이 같은 활성 대상을 표시한다.
  const selectedIngredient = ingredients.find((item) => item.id === selectedIngredientId) ?? mostUrgentIngredient;
  const recipeIngredients = recipeSheet ? ingredients.filter((item) => recipeUsesIngredient(recipeSheet, item)) : [];

  const consumeWithFeedback = (ids: readonly string[], onFinished?: () => void) => {
    // ref를 사용하는 commit이 같은 tick의 반복 클릭까지 차단한다.
    const consumed = consumeIngredients(ids);
    if (!consumed.length) return false;
    const idSet = new Set(consumed.map((item) => item.id));
    setConsumingItems((current) => [...current, ...consumed]);
    setAnnouncement(`${consumed.map((item) => item.name).join(', ')} 사용 완료`);
    later(() => {
      setConsumingItems((current) => current.filter((item) => !idSet.has(item.id)));
      setExpandedIngredientId((id) => id && idSet.has(id) ? null : id);
      later(() => {
        if (sheetKindRef.current === null && document.activeElement === document.body) addButtonRef.current?.focus({ preventScroll: true });
        onFinished?.();
      }, reduceMotion ? 0 : 240);
    }, reduceMotion ? 0 : 140);
    return true;
  };

  const finishRecipe = () => {
    if (!recipeSheet || recipeLockRef.current || !recipeIngredients.length) return;
    recipeLockRef.current = true;
    setConsumingRecipeId(recipeSheet.id);
    const sequence = sheetSequenceRef.current;
    const started = consumeWithFeedback(recipeIngredients.map((item) => item.id), () => {
      recipeLockRef.current = false;
      setConsumingRecipeId(null);
      // 이전 시트의 완료 콜백이 새로 연 시트까지 닫지 않는다.
      if (sheetSequenceRef.current === sequence && sheetKindRef.current === 'recipe') closeSheet();
    });
    if (!started) {
      recipeLockRef.current = false;
      setConsumingRecipeId(null);
    }
  };

  return (
    <div className="life-eat app">
      <SubPageHeader title="생활" backLabel="생활로" onBack={() => navigation?.navigate('life')} onMenu={() => setGnbOpen(true)} />
      <CategoryTabs active="food" />

      <main
        className="life-eat__scroll"
        ref={(element) => {
          scrollRef.current = element;
          if (element) element.inert = sheetKind !== null;
        }}
      >
        <div className="le-intro">
          <h2>냉장고 속 재료,<br />버리지 않고 다 먹어요</h2>
          <p>먼저 먹을 재료부터 확인하고 남은 재료로 한 끼를 챙겨요.</p>
        </div>

        <section className="le-section le-section--eat">
          <div className="le-section__head">
            <h2>곧 먹어야 해요</h2>
            <button
              type="button" ref={addButtonRef} className="le-add" aria-haspopup="dialog"
              aria-expanded={sheetKind === 'add'}
              onClick={(event) => openSheet('add', event.currentTarget)}
            >
              보관 중인 재료 추가<img src={icon('life-eat-plus.svg')} alt="" />
            </button>
          </div>
          <LayoutGroup>
            <motion.ul className="le-items" layout={reduceMotion ? false : 'position'}>
              <AnimatePresence initial={false} mode="popLayout">
                {displayedIngredients.map((item) => (
                  <IngredientItem
                    key={item.id} item={item} now={now}
                    expanded={expandedIngredientId === item.id}
                    selected={selectedIngredient?.id === item.id}
                    consuming={consumingItems.some((consumed) => consumed.id === item.id)}
                    onToggle={(id) => {
                      if (!ingredients.some((entry) => entry.id === id)) return;
                      setSelectedIngredientId(id);
                      setExpandedIngredientId((current) => current === id ? null : id);
                    }}
                    onConsume={(id) => { consumeWithFeedback([id]); }}
                    onEditDate={(id, trigger) => {
                      const ingredient = ingredients.find((entry) => entry.id === id);
                      if (!ingredient) return;
                      setEditingIngredient(ingredient);
                      openSheet('date', trigger);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          </LayoutGroup>
          {!displayedIngredients.length && <p className="le-empty">보관 중인 재료가 없어요. 재료를 추가해보세요.</p>}
          {saveFailed && <p className="le-save-note" role="alert">브라우저에 변경 내용을 저장하지 못했어요. 새로고침하면 변경 내용이 사라질 수 있어요.</p>}
        </section>

        <RecipeSection scrollRoot={scrollRef} selectedIngredient={selectedIngredient} onOpenRecipe={(recipe, trigger) => {
          setRecipeSheet(recipe);
          openSheet('recipe', trigger);
        }} />
        <StorageTipCard ingredient={selectedIngredient} />
      </main>

      <BottomNavigation activeTab="life" />
      <GnbOverlay open={gnbOpen} myMenu={DEFAULT_MENU} onClose={() => setGnbOpen(false)} onEditMenu={() => setGnbOpen(false)} />
      <p className="le-announcement" role="status">{announcement}</p>

      <AddIngredientSheet open={sheetKind === 'add'} onClose={closeSheet} onAdd={(item) => {
        if (!addIngredient(item)) return;
        orderRef.current.set(item.id, nextOrderRef.current++);
        setAnnouncement(`${item.name} 재료를 추가했어요.`);
      }} />
      <IngredientDateSheet open={sheetKind === 'date'} item={editingIngredient} onClose={closeSheet} onSave={(id, date) => {
        if (updateIngredientDate(id, date)) setAnnouncement('먹어야 하는 날짜를 수정했어요.');
      }} />
      <RecipeQuickSheet
        open={sheetKind === 'recipe'} recipe={recipeSheet}
        consuming={consumingRecipeId === recipeSheet?.id}
        hasIngredients={recipeIngredients.length > 0 && consumingRecipeId === null}
        onClose={closeSheet} onConsume={finishRecipe}
      />
    </div>
  );
}

export default LifeEatPage;
