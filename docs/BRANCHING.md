# JADUYA --- 브랜치 전략 & 배포 루트

> 목적: **main 은 항상 배포 가능한 상태로 유지한다.**
> 팀원 6명이 각자 다른 AI 에이전트(Claude / Codex)로 동시에 작업해도 배포가 깨지지 않게 한다.

작성일 2026-09-09 · 배포 대상 <https://jaduya.vercel.app>

---

## 1. 한 장 요약

| 항목 | 결정 |
| --- | --- |
| 배포 플랫폼 | **Vercel 하나만** 쓴다 (GitHub Pages 폐기) |
| 프로덕션 브랜치 | `main` — 여기에 머지되면 바로 라이브 |
| 작업 브랜치 | `feat/<이름>-<화면>` — 짧게 쓰고 머지 후 삭제 |
| main 에 직접 push | **금지.** 반드시 PR |
| 머지 조건 | ① CI 초록불 ② Vercel Preview 확인 ③ 리뷰 1명 |
| 머지 방식 | **Squash and merge** |
| 각자 건드리지 않는 파일 | `package.json`, `package-lock.json`, `vite.config.ts`, `vercel.json`, `index.html` |

---

## 2. 지난번에 왜 계속 배포가 실패했나

원인은 하나가 아니라 **세 가지가 겹쳤다.** 순서대로 확인한 내용이다.

### ① `package.json` + `package-lock.json` 이 통째로 삭제된 채 main 에 머지됐다

```
8d0de50  test                   ← package.json, package-lock.json 둘 다 D(삭제)
a48d298  패키지 제이슨 삭제복구      ← package.json 만 복구
c86f136  restore package files   ← 여기서야 package-lock.json 복구
```

`a48d298` 로 "복구했다"고 생각했지만 **lockfile 은 여전히 없는 상태**였다.
그래서 그 사이 머지들이 계속 실패했다. 실제 CI 에러 메시지:

```
Dependencies lock file is not found in /home/runner/work/jaduya/jaduya.
Supported file patterns: package-lock.json, npm-shrinkwrap.json, yarn.lock
```

> **핵심**: `package.json` 과 `package-lock.json` 은 **한 세트**다. 하나만 복구하면 복구가 아니다.

### ② PR 단계에 검사가 하나도 없었다

기존 워크플로는 `on: push: branches: [main]` 이었다.
즉 **머지된 다음에야** 빌드를 돌렸다. 깨진 코드가 main 에 들어가는 걸 막을 방법이 없었다.

→ `.github/workflows/ci.yml` 을 추가해서 **PR 단계에서** `npm ci` + `typecheck` + `build` 를 돌린다.
이제 package.json 이 없는 PR 은 머지 전에 빨간불이 뜬다.

### ③ 쓰지도 않는 GitHub Pages 워크플로가 계속 실패해서 main 이 항상 빨간불이었다

현재 저장소는 Pages 가 꺼져 있다 (`has_pages: false`). 그래서 최신 커밋까지 포함해 **7번 연속 실패** 중이었다.
빌드는 멀쩡히 성공하는데 마지막 단계에서 이렇게 죽는다:

```
Get Pages site failed. Please verify that the repository has Pages enabled...
```

빌드가 아니라 **Pages 설정 때문에** 실패한 것인데, 팀에서는 "또 배포 실패"로 읽혔다.
→ `deploy.yml` 을 삭제했다. 배포는 Vercel 이 한다.

### 참고: Vercel 프로덕션은 지금 정상이다

`ce12a45` 기준 Production 배포는 `success` 다. 다만 Preview 배포 중 일부가
`Deployment was blocked` 로 실패한다 (오늘만 21건 배포). Vercel 대시보드에서 Hobby 플랜
동시 빌드 / 일일 배포 한도를 확인해야 한다. → 6번 항목 참고.

---

## 3. 브랜치 전략

```
main ────●────────●────────────●────────────●──▶  (= 프로덕션, 항상 초록불)
          \      /          \  /          \  /
           ●────●            ●●            ●●
     feat/jieun-home   feat/soobin-money  feat/myeonghee-community
```

**GitHub Flow (main + 단기 feature 브랜치)** 를 쓴다.
`develop` 브랜치는 만들지 않는다. 6명 · 단기 프로젝트에서는 관리 비용만 늘고 배포가 느려진다.

### 브랜치 이름 규칙

```
feat/<이름>-<화면>     기능 개발   예) feat/jieun-mission
fix/<이름>-<무엇>      버그 수정   예) fix/soobin-gnb-overflow
chore/<무엇>           설정/문서   예) chore/ci-guardrail
deps/<무엇>            의존성 변경 예) deps/vite-6
```

기존의 `zip_jieun`, `audgml`, `soobin`, `young` 처럼 **사람 이름만 쓰는 브랜치는 만들지 않는다.**
그 브랜치는 절대 안 사라지고 계속 살아 있어서, main 과 벌어지다가 결국 대형 충돌이 난다.

### 브랜치 수명

- **하루 안에 머지되는 크기**로 자른다.
- 화면 1개 = 브랜치 1개 = PR 1개.
- 머지되면 **바로 삭제한다.** 같은 브랜치를 재사용하지 않는다.
- 하루 이상 걸리는 작업이면, 매일 아침 `main` 을 받아온다 (아래 4번).

### 파일 담당 나누기 (충돌 예방)

에이전트가 파일을 통째로 다시 쓰는 일이 잦기 때문에, **같은 파일을 두 사람이 동시에 만지지 않는 것**이
가장 확실한 충돌 예방책이다.

| 영역 | 파일 |
| --- | --- |
| 홈 | `src/pages/Home.tsx`, `src/styles/home.css` |
| 생활/미션 | `src/pages/MissionPage.tsx`, `src/styles/mission.css` |
| 마이 | `src/pages/MyPage.tsx`, `src/styles/mypage.css` |
| 저장됨 | `src/pages/SavedPage.tsx`, `src/styles/saved.css` |
| 로그인/온보딩 | `src/pages/Login.tsx`, `src/pages/Signup.tsx`, `src/pages/Onboarding.tsx`, `src/styles/auth.css` |
| 커뮤니티 | (신규) `src/pages/Community*.tsx`, `src/styles/community.css` |
| 공용 | `src/components/`, `src/styles/tokens.css`, `src/navigation/`, `src/App.tsx` |

**공용 파일을 고쳐야 하면 작업 시작 전에 팀 채널에 먼저 말한다.**
`tokens.css`, `AppNavigation.tsx`, `App.tsx`, `main.tsx` 는 특히 조심.

---

## 4. 하루 작업 루틴 (그대로 복붙)

### 작업 시작할 때

```bash
git checkout main
git pull origin main
git checkout -b feat/내이름-화면이름
npm ci
npm run dev
```

`npm install` 이 아니라 `npm ci` 다. lockfile 그대로 설치해서 **팀원 전원이 같은 버전**을 쓰게 한다.

### 커밋하기 전에 (필수)

```bash
npm run build
```

**빌드가 깨지면 push 하지 않는다.** 여기서 1분 쓰면 팀 전체가 30분을 아낀다.

### 올리기

```bash
git status
```

`package.json` / `package-lock.json` 이 목록에 있으면 **멈추고 확인한다.**

```bash
git add -A
git commit -m "feat: 커뮤니티 질문·고민 탭 구현"
git push -u origin feat/내이름-화면이름
gh pr create --base main --fill
```

### 하루 이상 걸리는 브랜치는 아침마다

```bash
git checkout main
git pull origin main
git checkout feat/내이름-화면이름
git merge main
```

충돌은 여기서, 작게, 미리 해결한다.

### 머지된 다음

```bash
git checkout main
git pull origin main
git branch -d feat/내이름-화면이름
git push origin --delete feat/내이름-화면이름
```

---

## 5. AI 에이전트(Claude / Codex) 사용 규칙

팀원마다 다른 에이전트를 쓰기 때문에, **에이전트가 저지르는 사고 유형**을 미리 막아야 한다.
이번 `package.json` 삭제도 사람이 손으로 지운 것에 가깝지 않다.

### 반드시 지킬 것

1. **`package.json` / `package-lock.json` 을 지우거나 다시 쓰라고 시키지 않는다.**
   의존성을 추가할 땐 파일을 편집하지 말고 명령으로 한다.

   ```bash
   npm install <패키지명>
   ```

   그리고 `package.json` 과 `package-lock.json` **둘 다** 커밋한다.

2. **의존성 버전을 바꾸는 작업은 별도 PR 로 분리한다.** (`deps/...` 브랜치)
   화면 작업 PR 에 라이브러리 업그레이드를 섞지 않는다. 문제가 생겼을 때 원인 분리가 불가능해진다.

3. **에이전트에게 "정리해줘 / 필요없는 파일 지워줘" 를 시키지 않는다.**
   무엇을 지워도 되는지 판단할 컨텍스트가 없다. 지울 파일은 사람이 지정한다.

4. **push 전에 사람이 직접 diff 를 본다.**

   ```bash
   git diff --stat main...HEAD
   ```

   내가 만든 화면 말고 다른 파일이 잔뜩 바뀌어 있으면 그대로 올리지 않는다.

5. **한 세션에 한 화면만 시킨다.** 여러 화면을 한 번에 시키면 diff 가 커지고 리뷰가 불가능해진다.

6. **`main` 에서 직접 에이전트를 돌리지 않는다.** 항상 feature 브랜치를 먼저 판다.

7. 프로젝트 규칙은 `CLAUDE.md` / `AGENTS.md` 에 있다. 새 규칙이 필요하면 개인 프롬프트에 넣지 말고
   이 파일들에 넣어서 **모두의 에이전트가 같은 규칙을 읽게 한다.**

### 에이전트에게 붙여 쓰면 좋은 문장

```
작업 전에 CLAUDE.md, AGENTS.md, docs/BRANCHING.md 를 읽어라.
package.json, package-lock.json, vite.config.ts, vercel.json, index.html 은 수정하지 마라.
작업 범위는 <화면 이름> 하나로 제한한다. 끝나면 npm run build 로 검증해라.
```

---

## 6. 배포 루트 (Vercel)

### 구조

```
feature 브랜치 push  →  Vercel Preview 배포  →  PR 에 Preview URL 자동 코멘트
        │
     PR 생성        →  GitHub Actions CI (npm ci + typecheck + build)
        │
   main 에 머지     →  Vercel Production 배포  →  https://jaduya.vercel.app
```

### 지금 설정 상태

- `vercel.json` 을 추가해서 빌드 방식을 **명시적으로 고정**했다.
  Vercel 이 프레임워크를 자동 감지하다가 `package.json` 이 없으면 정적 사이트로 착각하는 상황을 막는다.

  ```json
  {
    "framework": "vite",
    "installCommand": "npm ci",
    "buildCommand": "npm run build",
    "outputDirectory": "dist"
  }
  ```

- `installCommand` 가 `npm install` 이 아니라 **`npm ci`** 다.
  lockfile 이 없거나 `package.json` 과 어긋나면 **조용히 넘어가지 않고 즉시 실패**한다. 의도한 동작이다.
- SPA rewrite 를 넣어뒀다. 지금은 라우터가 없어 영향이 없지만, 나중에 react-router 를 붙여도
  새로고침 404 가 나지 않는다.

### 안심해도 되는 점

**빌드가 실패해도 라이브 사이트는 안 죽는다.** Vercel 은 빌드 실패 시 직전 성공 배포를 그대로 유지한다.
즉 최악의 경우도 "사이트가 안 바뀜"이지 "사이트가 사라짐"이 아니다.

### 오너(@phin0107)가 확인할 것

- [ ] Vercel 프로젝트 → Settings → Git → **Production Branch = `main`** 확인
- [ ] Vercel 대시보드에서 `Deployment was blocked` 원인 확인 (Hobby 플랜 동시 빌드 / 일일 배포 한도)
- [ ] Settings → Node.js Version 을 **22.x** 로 맞춘다 (CI 와 동일하게)
- [ ] GitHub → Settings → General → **Automatically delete head branches** 켜기 (현재 꺼져 있음)

---

## 7. main 을 지키는 법 (지금 플랜에서 가능한 것 / 불가능한 것)

현재 저장소는 **private + free 플랜**이다. 이 조합에서는 GitHub 의 브랜치 보호(Branch protection)와
Ruleset 을 쓸 수 없다. API 응답이 이렇게 온다:

```
Upgrade to GitHub Pro or make this repository public to enable this feature.
```

즉 **"CI 실패하면 머지 버튼 비활성화"를 강제할 수단이 지금은 없다.** 선택지는 세 가지다.

| 선택지 | 얻는 것 | 비용 |
| --- | --- | --- |
| **A. 저장소를 public 으로 전환** (추천) | 브랜치 보호 · 필수 상태 체크 · CODEOWNERS 전부 무료로 활성화 | 코드가 공개된다 (현재 API 키·비밀값 **없음** — 확인함) |
| B. GitHub Pro 결제 | private 유지 + 보호 규칙 | 월 $4 |
| C. 규칙으로만 운영 | 비용 0 | 강제력 없음 — 사람이 지켜야 함 |

**추천은 A다.** 이 프로젝트는 순수 프론트엔드 정적 사이트이고 커밋된 비밀값이 없다.
public 으로 바꾸면 그 즉시 아래 설정이 가능해진다.

Settings → Branches → Add rule → `main`

- [x] Require a pull request before merging
- [x] Require status checks to pass → **`typecheck + build`** 선택
- [x] Require branches to be up to date before merging

이렇게 설정하면 **package.json 이 없는 PR 은 머지 버튼 자체가 눌리지 않는다.**
이번 사고가 구조적으로 재발 불가능해진다.

C를 택한다면 최소한 이것만은 지킨다.

- main 머지는 **오너(@phin0107) 만** 누른다
- 빨간불인 PR 은 절대 머지하지 않는다
- `package.json` / `package-lock.json` 이 diff 에 보이면 무조건 확인 후 머지

---

## 8. 사고 복구 레시피

### `package.json` 이 또 날아갔을 때

```bash
git checkout main -- package.json package-lock.json
npm ci
npm run build
```

**둘 다** 복구해야 한다. 하나만 되돌리면 이번과 똑같이 실패한다.

main 에서도 사라졌다면 마지막으로 살아있던 커밋에서 가져온다.

```bash
git log --oneline --name-status -- package.json package-lock.json
```

```bash
git checkout <살아있던_커밋> -- package.json package-lock.json
```

### `package-lock.json` 충돌이 났을 때

lockfile 은 **손으로 병합하지 않는다.** main 것을 받고 다시 만든다.

```bash
git checkout --theirs package-lock.json
npm install
git add package-lock.json
```

### main 이 깨졌을 때 (되돌리기)

```bash
git checkout main
git pull origin main
git revert <머지커밋_해시>
git push origin main
```

`git reset --hard` + force push 는 **쓰지 않는다.** 다른 팀원 로컬이 전부 꼬인다.

### 배포만 다시 돌리고 싶을 때

빈 커밋을 만들지 말고 (`trigger vercel deploy` 같은 커밋이 이미 하나 있다),
Vercel 대시보드 → Deployments → 해당 배포 → **Redeploy** 를 누른다.

---

## 9. 자주 하는 실수 체크리스트

- [ ] `main` 에서 바로 작업하고 있지 않은가
- [ ] 브랜치가 사람 이름만으로 되어 있지 않은가 (`soobin` → `feat/soobin-money`)
- [ ] push 전에 `npm run build` 를 돌렸는가
- [ ] `git status` 에 `package-lock.json` 이 예상 밖으로 올라와 있지 않은가
- [ ] PR diff 에 내 화면과 무관한 파일이 섞여 있지 않은가
- [ ] 머지된 브랜치를 삭제했는가
