# URL navigation

페이지 선택과 PUSH/POP은 `BrowserRouter` / `Routes`가 담당한다. 기존
`AppNavigation.navigate(page, options)`는 URL을 만드는 호환 API이며 `page`는
URL에서 계산한 표시용 값이다. 별도 메모리 navigation stack은 없다.

## Routes

| 영역 | 경로 |
| --- | --- |
| 시작 | `/`, `/login`, `/signup`, `/onboarding` |
| 생활 | `/living`, `/living/first`, `/living/home-care`, `/living/housekeeping`, `/living/food` |
| 돈관리 | `/money`, `/money/budget`, `/money/accounts` |
| 혜택 | `/money/benefits`, `/money/benefits/recommended`, `/money/benefits/:id` |
| 커뮤니티 | `/community`, `/community?filter=question`, `/community/tips`, `/community/reviews`, `/community/post/:id` |
| 마이 | `/my`, `/my/profile`, `/my/activity`, `/my/missions`, `/my/settings`, `/my/account`, `/my/support` |
| 기타 | `/widgets`, `/notifications`, `/ai` |

`/community`가 게시판 canonical이다. `/community/board`만 호환 redirect를 한다.
혜택은 기존 진입점만 유지하며 독립 GNB 항목을 추가하지 않는다.
활동 탭은 `?tab=`, 프로필 진입 섹션은 `?section=`으로 전달한다.

## History와 상태

- 일반 화면/탭 이동은 PUSH. 내부 Back도 `navigate(-1)`이다.
- 인증/온보딩 redirect, alias, 직접 진입의 내부 Back fallback에만 replace를 쓴다.
- 앱에서 PUSH한 entry는 `location.state.appEntry`로 식별한다. 새로고침해도
  브라우저 entry의 상태는 유지된다. 직접 진입이면 기존 `returnTo` 옵션 또는
  해당 페이지의 상위 화면을 fallback으로 사용한다.
- 방문한 화면의 DOM을 세션 동안 유지해 위젯, 입력, 검색, 스크롤을 보존한다.
  이 캐시는 뒤로갈 순서를 결정하지 않는다. 현재 URL만 보이는 화면을 결정한다.
  계정 변경 시 사용자별 Provider를 재생성한다. 기존 storage 키/데이터는 유지한다.
- 게시글 상세와 AI 전체 화면에는 overlay guard를 사용하지 않는다.
- 기존 `useDismissOnBack` 호출부는 유지한다. `OverlayBackProvider`가 Router로
  동일 URL overlay entry를 쌓아 Router의 history state와 충돌하지 않게 한다.
  작성 확인 취소 후 guard 재등록과 중첩 overlay 정리만 보완했다.
- `jaduyaBack`, 페이지 `backStackRef`, `routeGuardRef`, `suppressPopRef`, 직접
  `popstate`, `registerRouteBack`/`unregisterRouteBack`은 제거했다.

## 검증 (2026-09-19)

- `node --test tests/routes.test.cjs`: 6개 통과. canonical query, ID 인코딩,
  활동 탭/섹션 직렬화, 정적/동적 혜택 매칭, 등록 route PUSH/POP, deep link 검사.
- `npm run build`: TypeScript + Vite 성공. 기존 단일 bundle 크기 경고는 남는다.
- 로컬 브라우저의 실제 Back/Forward와 URL/화면을 확인:
  - 홈 → 생활 → 첫 자취 → Back 생활 → Back 홈.
  - 홈 → 돈관리 → 혜택 → Back 돈관리 → Back 홈.
  - 홈 → 커뮤니티 → `/community/post/desk` → Back 커뮤니티.
  - 나의 활동 작성한 글 → 상세 → Back 작성한 글 탭. 내부 Back 및 Forward도 확인.
  - 알림 → 혜택 화면 → Back 알림, 읽음 상태 유지.
  - AI → 첫 자취 → Back AI, 기존 대화와 체크리스트 후속 안내 유지.
  - `/community/post/desk` 직접 진입/새로고침 → 같은 글, 내부 Back → 커뮤니티.
  - `/living/first` 직접 진입/새로고침 → 같은 화면, 내부 Back → 생활.
  - 질문 필터 → `?filter=question` → Back 전체 필터.
  - 글쓰기 → 시스템 POP → 작성 확인 → 취소 → 재차 POP → 작성 확인.
  - 글쓰기 → 임시목록 → POP 임시목록 닫기 → POP 빈 글쓰기 닫기, URL 유지.
  - 작성 중 알림으로 이동 → POP 작성 화면 복원 → POP 작성 확인, 초안 유지.
  - 비로그인 `/living/first` → `/login` → 직장인 데모 로그인 → `/living/first` 복원.

현재 알림 mock 데이터는 `route`만 갖고 게시글/혜택 ID가 없다. 따라서
“알림 → 특정 상세” 자체는 기존 UI에 존재하지 않는다. 실제 기존 연결인
알림 → 혜택/목록의 origin 복귀를 검증했다. 상세 알림을 추가하려면
알림 데이터에 `postId`/`benefitId`를 연결하는 별도 변경이 필요하다.

## 배포와 Android 확인 범위

`vercel.json`의 기존 `/(.*) → /index.html` rewrite를 유지한다.
현재 production의 `/living/first`, `/community/post/route-audit` 요청은 HTTP 200과
SPA root를 반환했다. 이는 서버 fallback 확인이며 새 Router 코드의 production
검증은 아니다. 오너가 PR을 머지한 후 해당 두 실제 경로의 새로고침을 재확인한다.

브라우저 POP 검증은 Android 런처의 Back 전달을 보장하지 않는다. Galaxy에서
Chrome/설치된 앱/런처를 각각 확인하고, WebView 기반이면 런처가 시스템 Back을
`canGoBack()` / `goBack()`으로 전달하는지 별도로 확인한다. 앱 내부 history가
없는 최초 route에서 시스템 Back으로 앱을 나가는 것은 강제로 차단하지 않는다.

세션의 방문 화면을 유지하므로 많은 상세를 열면 메모리 사용량이 늘 수 있다.
원래 영속화하지 않던 작성 중 입력/스크롤은 전체 새로고침까지 보장하지 않는다.
기존 본문 없는 mock 게시글은 여전히 상세 진입 대상이 아니다.
