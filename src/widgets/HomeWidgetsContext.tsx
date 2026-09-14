import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { DEFAULT_PERSONA } from '../data/personaHome';
import { PERSONA_WIDGETS, layoutCatalogIds } from '../data/personaWidgets';
import type { PersonaWidgetLayout } from '../data/personaWidgets';
import {
  MAX_ROW_MEDIUM,
  MAX_ROW_SMALL,
  MAX_WIDGET,
  WIDGET_CATALOG,
  widgetWeight,
} from '../data/widgetCatalog';
import { homeSizeOf, legacyIdFor } from '../data/widgets';
import type { WidgetSize } from '../types';

/* Home의 위젯 상태(myWidgets/isCustom)를 Home.tsx 로컬 state 대신 여기서 관리해서
 * Home 화면과 새 Widget Gallery 페이지가 같은 값을 공유한다(BookmarkProvider/MyMenuProvider와
 * 같은 패턴 — in-memory, localStorage 없음). Home.tsx/MyLifeSection.tsx 가 받는 값의 모양은
 * 기존과 완전히 같아서 Home의 렌더링 결과는 바뀌지 않는다. */

interface PlaceResult {
  ok: boolean;
  reason?: string;
}

interface HomeWidgetsValue {
  layout: PersonaWidgetLayout;
  widgets: string[];
  isCustom: boolean;
  count: number;
  max: number;
  isAdded: (type: string) => boolean;
  currentSize: (type: string) => WidgetSize | undefined;
  canPlace: (type: string, size: WidgetSize) => PlaceResult;
  addWidget: (type: string, size: WidgetSize) => PlaceResult;
  removeWidget: (type: string) => void;
}

const HomeWidgetsContext = createContext<HomeWidgetsValue | null>(null);

const catalogSizeOf = (id: string): WidgetSize | undefined =>
  WIDGET_CATALOG.find((w) => w.id === id)?.size;

export function HomeWidgetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const persona = user?.persona ?? DEFAULT_PERSONA;
  const layout = PERSONA_WIDGETS[persona];

  const [widgets, setWidgets] = useState<string[]>(() => layoutCatalogIds(layout));
  const [isCustom, setIsCustom] = useState(false);

  const count = useMemo(
    () => widgets.reduce((sum, id) => sum + widgetWeight(catalogSizeOf(id) ?? 'small'), 0),
    [widgets],
  );

  const currentSize = useCallback((type: string) => homeSizeOf(type, widgets), [widgets]);
  const isAdded = useCallback((type: string) => currentSize(type) !== undefined, [currentSize]);

  const canPlace = useCallback(
    (type: string, size: WidgetSize): PlaceResult => {
      const legacyId = legacyIdFor(type, size);
      if (!legacyId) return { ok: false, reason: '이 위젯은 이 크기로 추가할 수 없어요.' };
      if (widgets.includes(legacyId)) return { ok: true };

      const activeSize = homeSizeOf(type, widgets);
      if (activeSize && activeSize !== size) {
        return { ok: false, reason: '이미 다른 크기로 추가된 위젯이에요.' };
      }

      const hasLarge = widgets.some((id) => catalogSizeOf(id) === 'large');
      const mediumCount = widgets.filter((id) => catalogSizeOf(id) === 'medium').length;
      const smallCount = widgets.filter((id) => catalogSizeOf(id) === 'small').length;

      if (size === 'large') {
        if (hasLarge) return { ok: false, reason: '큰 위젯은 한 번에 하나만 담을 수 있어요.' };
        if (mediumCount > 0) {
          return { ok: false, reason: '큰 위젯을 담으려면 1번째 줄의 위젯을 먼저 빼주세요.' };
        }
      } else if (size === 'medium') {
        if (hasLarge) {
          return { ok: false, reason: '큰 위젯이 있으면 1번째 줄에 다른 위젯을 담을 수 없어요.' };
        }
        if (mediumCount >= MAX_ROW_MEDIUM) {
          return { ok: false, reason: '1번째 줄에는 위젯을 2개까지 담을 수 있어요.' };
        }
      } else if (smallCount >= MAX_ROW_SMALL) {
        return { ok: false, reason: '2번째 줄에는 위젯을 2개까지 담을 수 있어요.' };
      }

      return { ok: true };
    },
    [widgets],
  );

  const addWidget = useCallback(
    (type: string, size: WidgetSize): PlaceResult => {
      const result = canPlace(type, size);
      if (!result.ok) return result;
      const legacyId = legacyIdFor(type, size)!;
      setWidgets((prev) => (prev.includes(legacyId) ? prev : [...prev, legacyId]));
      setIsCustom(true);
      return { ok: true };
    },
    [canPlace],
  );

  const removeWidget = useCallback(
    (type: string) => {
      const size = homeSizeOf(type, widgets);
      if (!size) return;
      const legacyId = legacyIdFor(type, size);
      if (!legacyId) return;
      setWidgets((prev) => prev.filter((id) => id !== legacyId));
      setIsCustom(true);
    },
    [widgets],
  );

  const value = useMemo<HomeWidgetsValue>(
    () => ({
      layout,
      widgets,
      isCustom,
      count,
      max: MAX_WIDGET,
      isAdded,
      currentSize,
      canPlace,
      addWidget,
      removeWidget,
    }),
    [layout, widgets, isCustom, count, isAdded, currentSize, canPlace, addWidget, removeWidget],
  );

  return <HomeWidgetsContext.Provider value={value}>{children}</HomeWidgetsContext.Provider>;
}

export function useHomeWidgets() {
  const value = useContext(HomeWidgetsContext);
  if (!value) throw new Error('useHomeWidgets 는 HomeWidgetsProvider 안에서만 쓸 수 있다');
  return value;
}
