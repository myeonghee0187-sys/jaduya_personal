import { useSyncExternalStore } from 'react';
import { TOTAL_EXPENSE } from './moneyTransactions';

/* 이번 달 생활비 예산 — 예산 설정 화면(MoneyBudgetPage)에서 정한 값이 홈 위젯 등 다른 화면에도 그대로 반영되도록
 * 화면 밖에 두는 작은 공용 저장소다(새로고침해도 유지되게 localStorage 에도 저장한다).
 * 이번 달 쓴 돈은 소비 원본(moneyTransactions.ts TOTAL_EXPENSE)에서 가져온다 — 예산만 사용자가 바꾼다. */

const STORAGE_KEY = 'jaduya:money-budget:v1';
export const DEFAULT_BUDGET = 1_000_000;

function read(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_BUDGET;
  } catch {
    return DEFAULT_BUDGET;
  }
}

let current = read();
const listeners = new Set<() => void>();

export const getBudget = () => current;

export function saveBudget(next: number) {
  current = Math.max(0, Math.round(next));
  try {
    window.localStorage.setItem(STORAGE_KEY, String(current));
  } catch {
    /* 저장이 막힌 환경에서는 이번 방문 동안만 유지된다 */
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useBudget = () => useSyncExternalStore(subscribe, getBudget, getBudget);

/** 1,000,000 → "100만원", 842,000 → "84.2만원" (위젯처럼 좁은 자리에 쓰는 표기) */
export function formatManwon(amount: number): string {
  const manwon = Math.round((amount / 10_000) * 10) / 10;
  return `${Number.isInteger(manwon) ? manwon : manwon.toFixed(1)}만원`;
}

/** 예산 대비 이번 달 사용률(0~100) */
export function budgetUsedPercent(budget: number): number {
  return budget > 0 ? Math.min(100, Math.max(0, Math.round((TOTAL_EXPENSE / budget) * 100))) : 100;
}

/** 남은 예산(초과하면 음수) */
export function budgetRemaining(budget: number): number {
  return budget - TOTAL_EXPENSE;
}
