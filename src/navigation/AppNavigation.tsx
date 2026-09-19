import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
/** 'community-question' 은 기존 알림·딥링크 호환용이며 게시판의 질문 서브탭으로 연결한다. */
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
  /** 돌아갈 화면에서 복원할 탭. 재사용 상세 화면의 진입 문맥을 한 단계만 전달한다. */
  returnTab?: string;
  /** 중간 상세를 한 번 더 거쳐도 원래 화면의 옵션을 잃지 않게 넘기는 값. */
  returnOptions?: NavigateOptions;
  /** 자두AI에서 외부 화면으로 이동한 뒤 돌아올 때 기존 대화를 다시 연다. */
  reopenAIChat?: boolean;
}

/** Android 시스템 뒤로가기 한 단계에 대응하는 항목.
 * `<` 버튼 클릭이든 실제 시스템 뒤로가기든, 결국 이 항목의 onTrigger 가 딱 한 번 불린다. */
interface BackGuard {
  onTrigger: () => void;
  /** 실제 popstate(시스템 뒤로가기)로 소비됐으면 true — 그러면 release() 는 아무 일도 하지 않는다. */
  consumed: boolean;
}

interface AppNavigationValue {
  page: AppPage;
  options: NavigateOptions;
  navigate: (page: AppPage, options?: NavigateOptions) => void;
  goBack: (fallbackPage: AppPage) => void;
  /** 하단 탭바 전환 전용 — 탭은 서로 아래위로 쌓이는 화면이 아니라 나란한 루트라, navigate()
   * 처럼 매번 history 를 쌓으면 탭을 여러 번 오갈수록 시스템 뒤로가기를 그만큼 여러 번 눌러야
   * 겨우 앱을 빠져나가게 된다. 대신 지금 쌓여 있는 단계를 전부 이 탭 하나로 대체한다 —
   * 그 탭 안에서 더 들어간 하위 화면(navigate)은 평소처럼 쌓인다. */
  navigateTab: (page: AppPage) => void;
  /** 자두AI는 현재 화면 위에만 얹는다. 닫을 때 기반 화면의 상태를 보존한다. */
  isAIChatOpen: boolean;
  hasAIChatOpened: boolean;
  closeAIChat: () => void;
  /** 지금 화면(SubPageHeader)의 `<` 버튼이 하는 일을 등록해 둔다 — 시스템 뒤로가기가 오면
   * 똑같은 함수를 그대로 호출해서 인앱 뒤로가기와 결과를 통일한다. token 은 화면(SubPageHeader
   * 인스턴스)마다 고유해서, 화면 전환 시 새 화면이 먼저 등록한 값을 이전 화면의 언마운트
   * 정리가 덮어쓰지 않게 막는다. SubPageHeader 전용. */
  registerRouteBack: (token: symbol, onBack: () => void) => void;
  /** registerRouteBack 으로 등록한 값을 정리한다 — 등록된 token 이 여전히 내 것일 때만 지운다. */
  unregisterRouteBack: (token: symbol) => void;
  /** 모달/바텀시트/패널이 열려 있는 동안 뒤로가기 한 단계를 등록한다. 열릴 때 부르고,
   * 반환값을 닫힐 때(혹은 언마운트 시) 불러서 정리한다 — useDismissOnBack 전용. */
  pushBackGuard: (onTrigger: () => void) => BackGuard;
  releaseBackGuard: (guard: BackGuard) => void;
}

const AppNavigationContext = createContext<AppNavigationValue | null>(null);

/** 기존 인증 화면과 같은 state 기반 전환. 미구현 화면의 route는 만들지 않는다. */
export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<{ page: AppPage; options: NavigateOptions }>({
    page: 'home',
    options: {},
  });
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [hasAIChatOpened, setHasAIChatOpened] = useState(false);

  const routeRef = useRef(route);
  routeRef.current = route;

  /* Android/브라우저 뒤로가기 한 번 = 이 스택에서 한 항목을 pop. navigate() 로 화면을
   * 한 단계 들어갈 때, 그리고 모달/시트가 열릴 때 각각 한 항목씩 쌓인다. 오버레이가
   * 화면보다 나중에 열리므로 항상 화면보다 위에 쌓여, 뒤로가기가 오면 오버레이부터
   * 닫힌다 — 별도 우선순위 로직 없이 스택 순서 자체가 그 규칙을 만든다. */
  const backStackRef = useRef<BackGuard[]>([]);
  /* 우리 코드가 직접 history.back() 을 불러서 "쌓아 둔 항목을 정리"할 때(예: 딤 클릭으로
   * 시트를 닫았을 때) 그로 인해 발생하는 popstate 는 실제 사용자 뒤로가기가 아니므로
   * 건너뛴다. */
  const suppressPopRef = useRef(0);

  const pushBackGuard = (onTrigger: () => void): BackGuard => {
    history.pushState({ jaduyaBack: true }, '');
    const guard: BackGuard = { onTrigger, consumed: false };
    backStackRef.current.push(guard);
    return guard;
  };

  /* popstate 로 이미 소비된 항목이면 아무 것도 하지 않는다. 그렇지 않다면(사용자가
   * X/딤 클릭·인앱 `<` 버튼처럼 시스템 뒤로가기를 거치지 않고 직접 닫은 경우) 쌓아 둔
   * history 항목을 스스로 정리해서 다음 실제 뒤로가기가 엉뚱한 단계로 새지 않게 한다. */
  const releaseBackGuard = (guard: BackGuard) => {
    if (guard.consumed) return;
    guard.consumed = true;
    const idx = backStackRef.current.indexOf(guard);
    if (idx === -1) return;
    backStackRef.current.splice(idx, 1);
    suppressPopRef.current += 1;
    history.back();
  };

  /* 지금 화면의 `<` 버튼이 하는 일 — SubPageHeader 가 렌더될 때마다 최신 값으로 갱신한다.
   * 화면 전환 직후에는 다음 렌더에서 새 화면이 다시 등록하기 전까지 비어 있다(예: 루트인
   * 홈은 아예 등록하지 않는다). */
  const routeBackRef = useRef<{ token: symbol; onBack: () => void } | null>(null);
  /* navigate() 로 지금 화면에 들어오며 쌓은 항목 — goBack() 이 직접(클릭으로) 불렸을 때
   * 이 항목을 정리해서 history 깊이를 맞춘다. */
  const routeGuardRef = useRef<BackGuard | null>(null);
  /* 지금이 navigateTab() 으로 도착한 "탭 루트"인지 — 맞다면 다음 navigateTab() 은 새로
   * 쌓지 않고 지금 항목을 재사용(교체)한다. navigate()/goBack() 을 거치면(그 탭 안에서
   * 더 들어가거나 뒤로 나가면) false 로 돌아가 다음 탭 전환은 다시 새로 쌓는다 — 그래야
   * 홈에서 처음 탭으로 들어갈 때는 확실히 한 단계가 쌓여 뒤로가기로 홈에 돌아올 수 있다. */
  const isTabRootRef = useRef(false);

  /* 라우터 없이 화면을 통째로 바꾸는 구조라, 이전 화면에서 스크롤해 내려간 채 넘어오면
   * 도착 화면도 그 위치에서 그려진다 — 새 화면은 항상 맨 위에서 보여야 한다. */
  const resetScroll = () => {
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
  };

  useEffect(() => {
    const onPopState = () => {
      if (suppressPopRef.current > 0) {
        suppressPopRef.current -= 1;
        return;
      }
      const guard = backStackRef.current.pop();
      if (!guard) return; // 더 돌아갈 곳이 없다 — 브라우저 기본 동작(앱 종료)에 맡긴다
      guard.consumed = true;
      guard.onTrigger();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /* navigate(page) 형태의 기존 호출은 그대로 동작한다 — options 는 선택값이다 */
  const value = useMemo(
    () => ({
      page: route.page,
      options: route.options,
      navigate: (page: AppPage, options: NavigateOptions = {}) => {
        /* AI는 독립 route로 화면을 교체하지 않는다. 현재 .app을 남겨 둔 상태에서
         * fullscreen overlay만 올려야 닫는 동안 실제 이전 화면이 그대로 드러난다.
         * AIChatPage 자신이 useDismissOnBack 으로 뒤로가기 항목을 쌓으므로 여기서는
         * route 항목을 쌓지 않는다. */
        if (page === 'ai-chat') {
          setHasAIChatOpened(true);
          setIsAIChatOpen(true);
          return;
        }
        resetScroll();
        isTabRootRef.current = false;
        /* 도착 화면이 SubPageHeader 로 자기 `<` 동작을 등록해 두면(registerRouteBack) 이
         * 항목이 뒤로가기에 소비될 때 바로 그 함수가 불린다. 도착 화면에 SubPageHeader 가
         * 없으면(예: 홈) routeBackRef 가 비어 있으니 아무 일도 하지 않는다. */
        routeGuardRef.current = pushBackGuard(() => routeBackRef.current?.onBack());
        setRoute({ page, options });
      },
      navigateTab: (page: AppPage) => {
        resetScroll();
        routeBackRef.current = null;
        if (isTabRootRef.current && routeGuardRef.current) {
          /* 이미 탭 루트에 있다 — 탭을 오갈 때마다 새로 쌓지 않고 지금 항목을 재사용
           * (history.replaceState)한다. 그 탭 안에서 열려 있던 오버레이가 있었다면
           * 화면 자체가 통째로 바뀌므로 그 항목도 함께 버린다. */
          backStackRef.current = [routeGuardRef.current];
          history.replaceState({ jaduyaBack: true }, '');
        } else {
          /* 홈처럼 아직 아무것도 쌓이지 않았거나, 다른 화면 깊숙이 들어가 있던 상태에서
           * 탭을 눌렀다 — 이번엔 새로 한 단계 쌓아야 뒤로가기로 돌아올 자리가 생긴다. */
          routeGuardRef.current = pushBackGuard(() => routeBackRef.current?.onBack());
        }
        isTabRootRef.current = true;
        setRoute({ page, options: {} });
      },
      goBack: (fallbackPage: AppPage) => {
        const { returnTo, returnTab, returnOptions, reopenAIChat } = routeRef.current.options;
        const nextOptions = returnOptions ?? (returnTab ? { tab: returnTab } : {});
        resetScroll();
        isTabRootRef.current = false;
        setRoute({ page: returnTo ?? fallbackPage, options: nextOptions });
        if (reopenAIChat) {
          setHasAIChatOpened(true);
          /* AIChatPage 는 현재 보이는 .app 안으로 portal 된다. route 와 동시에 열면
           * 이전 화면 DOM을 portal 대상으로 잡을 수 있어, 새 화면이 커밋된 다음 프레임에 연다. */
          window.requestAnimationFrame(() => setIsAIChatOpen(true));
        }
        /* 실제 시스템 뒤로가기(popstate)로 여기 온 경우 이 항목은 이미 소비됐으니
         * release 는 아무 일도 하지 않는다. `<` 버튼처럼 직접 호출된 경우에만 쌓아 둔
         * history 항목을 마저 정리(history.back())해서 다음 뒤로가기가 엉뚱한 단계로
         * 새지 않게 한다. 정리 후에는 방금 돌아온 화면이 원래 갖고 있던 항목이 스택
         * 맨 위에 남으므로, 그걸 다시 "지금 화면의 항목"으로 이어받는다. */
        const guard = routeGuardRef.current;
        if (guard) releaseBackGuard(guard);
        routeGuardRef.current = backStackRef.current[backStackRef.current.length - 1] ?? null;
      },
      isAIChatOpen,
      hasAIChatOpened,
      closeAIChat: () => setIsAIChatOpen(false),
      registerRouteBack: (token: symbol, onBack: () => void) => {
        routeBackRef.current = { token, onBack };
      },
      unregisterRouteBack: (token: symbol) => {
        if (routeBackRef.current?.token === token) routeBackRef.current = null;
      },
      pushBackGuard,
      releaseBackGuard,
    }),
    [isAIChatOpen, route],
  );
  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}

/** Provider 밖의 기존 독립 컴포넌트는 자체 선택 상태를 유지한다. */
export function useAppNavigation() {
  return useContext(AppNavigationContext);
}
