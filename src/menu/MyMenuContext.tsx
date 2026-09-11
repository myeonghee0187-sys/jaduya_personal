import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_MENU, MAX_MENU } from '../data/menuCatalog';
import { useDraftSelection } from '../hooks/useDraftSelection';

/* GNB "내 메뉴" 선택 + 편집 시트 상태 — 모든 화면이 같은 값을 본다.
 * 예전에는 Home.tsx 로컬 state였어서 GNB의 "편집"이 Home에서만 동작했다
 * (다른 화면은 GnbOverlay 는 있어도 MyMenuEdit 시트 자체가 없었다). */

interface MyMenuValue {
  /** 현재 GNB에 노출되는 "내 메뉴" id 목록 */
  myMenu: string[];
  /** 편집 시트가 열려 있는지 */
  editOpen: boolean;
  /** 저장본을 draft로 복사하고 편집 시트를 연다 */
  openEdit: () => void;
  closeEdit: () => void;
  draft: ReturnType<typeof useDraftSelection>;
  /** draft를 저장본에 반영하고 시트를 닫는다 */
  saveEdit: () => void;
}

const MyMenuContext = createContext<MyMenuValue | null>(null);

export function MyMenuProvider({ children }: { children: ReactNode }) {
  const [myMenu, setMyMenu] = useState<string[]>(DEFAULT_MENU);
  const [editOpen, setEditOpen] = useState(false);
  const draft = useDraftSelection(DEFAULT_MENU, MAX_MENU);

  const value: MyMenuValue = {
    myMenu,
    editOpen,
    openEdit: () => {
      draft.reset(myMenu);
      setEditOpen(true);
    },
    closeEdit: () => setEditOpen(false),
    draft,
    saveEdit: () => {
      setMyMenu(draft.draft.slice());
      setEditOpen(false);
    },
  };

  return <MyMenuContext.Provider value={value}>{children}</MyMenuContext.Provider>;
}

export function useMyMenu(): MyMenuValue {
  const ctx = useContext(MyMenuContext);
  if (!ctx) throw new Error('useMyMenu 는 MyMenuProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
