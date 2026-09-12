import { useCallback, useRef, useState } from 'react';
import { isValidConsumeDate, loadFridgeItems, saveFridgeItems } from '../../data/lifeEat';
import type { FridgeItem } from '../../data/lifeEat';

/** 실제 목록 변경은 즉시 저장하고, 소비 확인/퇴장 모션은 화면에서 따로 관리한다. */
export function useFridgeIngredients(ownerKey: string) {
  const [ingredients, setIngredients] = useState(() => loadFridgeItems(ownerKey));
  const currentRef = useRef(ingredients);
  const [saveFailed, setSaveFailed] = useState(false);

  const commit = useCallback((next: FridgeItem[]) => {
    currentRef.current = next;
    setIngredients(next);
    setSaveFailed(!saveFridgeItems(ownerKey, next));
  }, [ownerKey]);

  const addIngredient = useCallback((item: FridgeItem) => {
    if (currentRef.current.some((existing) => existing.id === item.id)) return false;
    commit([...currentRef.current, { ...item }]);
    return true;
  }, [commit]);

  const consumeIngredients = useCallback((ids: readonly string[]) => {
    const consumedIds = new Set(ids);
    const consumed = currentRef.current.filter((item) => consumedIds.has(item.id));
    if (consumed.length) commit(currentRef.current.filter((item) => !consumedIds.has(item.id)));
    return consumed;
  }, [commit]);

  const updateIngredientDate = useCallback((id: string, date: string) => {
    if (!isValidConsumeDate(date) || !currentRef.current.some((item) => item.id === id)) return false;
    commit(currentRef.current.map((item) => item.id === id ? { ...item, useByDate: date } : item));
    return true;
  }, [commit]);

  return { ingredients, saveFailed, addIngredient, consumeIngredients, updateIngredientDate };
}
