import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
export interface OverlayGuard { id: string; consumed: boolean; onTrigger: () => void }
interface OverlayNavigation { push: (onTrigger: () => void) => OverlayGuard; release: (guard: OverlayGuard) => void; canPush: () => boolean }
const Context = createContext<OverlayNavigation | null>(null);
/** Overlay-only registry. React Router owns all history entries, including same-URL sheets. */
export function OverlayBackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const action = useNavigationType();
  const current = useRef({ location, navigate });
  current.current = { location, navigate };
  const guards = useRef(new Map<string, OverlayGuard>());
  const previous = useRef<string[]>([]);
  useEffect(() => {
    const ids: string[] = location.state?.overlayIds ?? [];
    for (const id of [...previous.current].reverse()) {
      if (ids.includes(id)) continue;
      // A page PUSH temporarily hides its retained writer/sheet. Keep the guard
      // for POP back to that history entry instead of creating a duplicate.
      if (action === 'PUSH') continue;
      const guard = guards.current.get(id);
      if (guard && !guard.consumed) { guard.consumed = true; guard.onTrigger(); }
      guards.current.delete(id);
    }
    previous.current = ids;
    // If a child and its parent closed together, discard only their remaining
    // overlay entries. Never skip a page entry.
    let closed = 0;
    for (const id of [...ids].reverse()) {
      if (!guards.current.get(id)?.consumed) break;
      closed++;
    }
    if (closed) navigate(-closed);
  }, [location, action, navigate]);
  const push = (onTrigger: () => void) => {
    const guard: OverlayGuard = { id: crypto.randomUUID(), consumed: false, onTrigger };
    guards.current.set(guard.id, guard);
    const origin = current.current.location.key;
    queueMicrotask(() => {
      if (guard.consumed || current.current.location.key !== origin) return;
      const { location: at, navigate: go } = current.current;
      go(at.pathname + at.search + at.hash, { state: { ...at.state,
        overlayIds: [...(at.state?.overlayIds ?? []), guard.id] } });
    });
    return guard;
  };
  const release = (guard: OverlayGuard) => {
    if (guard.consumed) return;
    guard.consumed = true;
    const { location: at, navigate: go } = current.current;
    const ids: string[] = at.state?.overlayIds ?? [];
    if (ids[ids.length - 1] === guard.id) go(-1);
  };
  const canPush = () => (current.current.location.state?.overlayIds ?? []).every((id: string) => !guards.current.get(id)?.consumed);
  return <Context.Provider value={{ push, release, canPush }}>{children}</Context.Provider>;
}
export const useOverlayBack = () => useContext(Context);
