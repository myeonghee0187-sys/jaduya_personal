import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** 'living-profile' 은 마이페이지 '자취 프로필' 상세 화면이다 (하단 저장 CTA 를 쓰므로 탭바를 두지 않는다) */
/** 'mission' / 'saved' 는 'my' 아래 하위 화면이다 (탭바는 '마이' active 를 유지한다) */
/** 'life' 는 탭바 '생활' 의 메인 화면이다 */
/** 'life-first' / 'life-homecare' / 'life-house' / 'life-eat' 는 생활 아래 하위 화면이다 (탭바는 '생활' active 를 유지한다) */
/** 'notifications' 는 헤더 종으로 들어가는 알림 화면이다 (어느 화면에서든 열리므로 returnTo 로 돌아온다) */
/** 'money' 는 탭바 '돈관리' 의 메인 화면이다 */
/** 'money-budget' 는 돈관리 아래 예산 설정 화면이다 (탭바는 '돈관리' active 를 유지한다) */
/** 'money-accounts' 는 돈관리 "이번 달" 탭의 "내 계좌" 카드로 들어오는 계좌 목록 화면이다
 * (탭바는 '돈관리' active 를 유지한다) */
/** 'community-question' 은 커뮤니티 '질문' 탭 전용 화면이다 (탭바는 '커뮤니티' active 를 유지한다) */
/** 'community-tip' 은 커뮤니티 '자취 꿀팁' 탭 전용 화면이다 (탭바는 '커뮤니티' active 를 유지한다) */
/** 'community-region' 은 커뮤니티 '지역 후기' 탭 전용 화면이다 (탭바는 '커뮤니티' active 를 유지한다) */
export type AppPage =
  | 'home'
  | 'my'
  | 'settings'
  | 'account'
  | 'support'
  | 'mission'
  | 'living-profile'
  | 'saved'
  | 'life'
  | 'life-first'
  | 'life-homecare'
  | 'life-house'
  | 'life-eat'
  | 'community'
  | 'community-question'
  | 'community-tip'
  | 'community-region'
  | 'benefits'
  | 'benefits-recommend'
  | 'benefit-detail'
  | 'ai-chat'
  | 'money'
  | 'money-budget'
  | 'money-accounts'
  | 'widget-gallery'
  | 'notifications';

/** 이동하면서 도착 화면에 넘기는 값. 도착 화면이 초기 상태를 잡는 데만 쓴다. */
export interface NavigateOptions {
  /** 탭이 있는 화면(커뮤니티 등)에서 처음 열 탭 이름 */
  tab?: string;
  /** 도착 화면에서 처음 보여줄 섹션 id (예: 자취 프로필의 'recommend') */
  section?: string;
  /** 혜택 상세 화면에서 조회할 혜택의 고유 id */
  benefitId?: string;
  /** 커뮤니티 홈으로 들어가면서 바로 열 게시글 id — 마이페이지 "나의 활동"에서
   * 저장한 글/작성한 글/댓글을 눌러 기존 게시글 상세(CommunityPostDetailPanel)로 갈 때 쓴다. */
  postId?: string;
  /** 뒤로가기로 돌아갈 화면. 없으면 도착 화면의 기본 상위 화면으로 간다.
   * history 스택을 만들지 않고 "어디서 들어왔는지" 한 단계만 기억한다. */
  returnTo?: AppPage;
}

interface AppNavigationValue {
  page: AppPage;
  options: NavigateOptions;
  navigate: (page: AppPage, options?: NavigateOptions) => void;
  /** 자두AI는 현재 화면 위에만 얹는다. 닫을 때 기반 화면의 상태를 보존한다. */
  isAIChatOpen: boolean;
  closeAIChat: () => void;
}

const AppNavigationContext = createContext<AppNavigationValue | null>(null);

/** 기존 인증 화면과 같은 state 기반 전환. 미구현 화면의 route는 만들지 않는다. */
export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<{ page: AppPage; options: NavigateOptions }>({
    page: 'home',
    options: {},
  });
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  /* navigate(page) 형태의 기존 호출은 그대로 동작한다 — options 는 선택값이다 */
  const value = useMemo(
    () => ({
      page: route.page,
      options: route.options,
      navigate: (page: AppPage, options: NavigateOptions = {}) => {
        /* AI는 독립 route로 화면을 교체하지 않는다. 현재 .app을 남겨 둔 상태에서
         * fullscreen overlay만 올려야 닫는 동안 실제 이전 화면이 그대로 드러난다. */
        if (page === 'ai-chat') {
          setIsAIChatOpen(true);
          return;
        }
        /* 라우터 없이 화면을 통째로 바꾸는 구조라, 이전 화면에서 스크롤해 내려간 채
         * 넘어오면 도착 화면도 그 위치에서 그려진다 — 새 화면은 항상 맨 위에서 보여야 한다. */
        window.scrollTo(0, 0);
        /* Home 은 다른 화면으로 이동해도 언마운트되지 않고 display:none 으로만 숨는다
         * (App.tsx) — 이동 직전에 포커스 가능한 요소(예: 위젯 추가 슬롯)를 누르면 브라우저가
         * .app 자신의 스크롤(가로/세로)을 그 요소가 보이도록 슬쩍 밀어두는데, window.scrollTo 는
         * 문서 스크롤만 되돌릴 뿐 .app 자신의 scrollLeft/scrollTop 은 그대로 남는다. 숨어있는
         * 동안은 안 보이다가 다시 그 화면으로 돌아오면 전체 콘텐츠가 옆으로/아래로 밀려나
         * 보이는 원인이라, 화면을 옮길 때마다 모든 .app 의 스크롤을 같이 0으로 되돌린다. */
        document.querySelectorAll<HTMLElement>('.app').forEach((el) => {
          el.scrollLeft = 0;
          el.scrollTop = 0;
        });
        /* 같은 이유로 Home 의 하단 시트 내부 스크롤(sheet__scroll)도 같이 되돌린다 —
         * 그대로 두면 다음에 Home 으로 돌아왔을 때 시트가 아래로 스크롤된 채로 보인다. */
        document.getElementById('sheetScroll')?.scrollTo(0, 0);
        setRoute({ page, options });
      },
      isAIChatOpen,
      closeAIChat: () => setIsAIChatOpen(false),
    }),
    [isAIChatOpen, route],
  );
  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}

/** Provider 밖의 기존 독립 컴포넌트는 자체 선택 상태를 유지한다. */
export function useAppNavigation() {
  return useContext(AppNavigationContext);
}
