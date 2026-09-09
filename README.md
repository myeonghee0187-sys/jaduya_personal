# 자두야 (JADUYA)

혼자 사는 사람의 생활을 더 쉽게 관리하도록 돕는 모바일 앱.

React + TypeScript + Vite · 배포 <https://jaduya.vercel.app>

---

## 시작하기

```bash
git clone https://github.com/phin0107/jaduya.git
cd jaduya
git config core.hooksPath .githooks
npm ci
npm run dev
```

`npm install` 이 아니라 **`npm ci`** 를 쓴다. `package-lock.json` 그대로 설치해서 팀원 전원이 같은 버전을 쓰게 한다.

`git config core.hooksPath .githooks` 는 **최초 1회만** 실행하면 된다. 이걸 해야 커밋 직전에 안전장치가 동작한다 (아래 참고).

브라우저에서 <http://localhost:5173> 을 열고, **개발자도구 → 기기 모드 → 402 × 874** 로 맞춰서 확인한다.

## 스크립트

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 (5173) |
| `npm run build` | 타입 검사 + 프로덕션 빌드 → `dist/` |
| `npm run typecheck` | 타입 검사만 |
| `npm run preview` | 빌드 결과 로컬 확인 |

**커밋 전에 반드시 `npm run build` 를 통과시킨다.** 실패하면 push 하지 않는다.

## 작업 전에 읽을 것

| 문서 | 내용 |
| --- | --- |
| [`docs/BRANCHING.md`](docs/BRANCHING.md) | **브랜치 전략 · 배포 루트 · 사고 복구** — 제일 먼저 읽는다 |
| [`CLAUDE.md`](CLAUDE.md) | 프로젝트 작업 규칙 (Claude 용) |
| [`AGENTS.md`](AGENTS.md) | AI 에이전트 공통 규칙 (Codex 등) |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | 컬러 · 타이포 · 컴포넌트 토큰 |
| [`PRD.md`](PRD.md) | 제품 요구사항 |

팀원마다 다른 AI 에이전트(Claude / Codex)를 쓰기 때문에, 규칙은 개인 프롬프트가 아니라 **저장소 문서에 넣어서 모두의 에이전트가 같은 규칙을 읽게 한다.**

## 안전장치 (3중)

문서는 "지침"일 뿐이라 에이전트가 무시할 수 있다. 그래서 실제로 막는 장치를 3겹으로 뒀다.

| 층 | 무엇이 막히나 | 적용 대상 |
| --- | --- | --- |
| `.claude/settings.json` | `package.json` · `package-lock.json` · `vite.config.ts` · `vercel.json` · `index.html` · `tsconfig*.json` · `.github/` 편집, `gh pr merge`, force push | Claude Code 사용자 (자동) |
| `.githooks/pre-commit` | `main` 직접 커밋, package 파일 삭제 커밋 | **전원** (`core.hooksPath` 설정 후) |
| `.github/workflows/ci.yml` | package 파일 누락, 타입 에러, 빌드 실패한 PR | **전원** (자동, 우회 불가) |

의존성을 추가할 때는 파일을 편집하지 말고 명령을 쓴다. 이건 막히지 않는다.

```bash
npm install <패키지명>
```

## 구조

```
src/
  pages/        화면 (Home, MyPage, MissionPage, SavedPage, Login, Signup, Onboarding)
  components/   재사용 컴포넌트
  navigation/   GNB · 화면 전환
  styles/       화면별 CSS (tokens.css 가 디자인 토큰)
  auth/         로그인 상태 (AuthContext)
  hooks/        공용 훅 (useLayerStack 등)
  data/         목 데이터
  lib/asset.ts  public/assets 경로 헬퍼 — img() / icon()
public/assets/  이미지 · 아이콘 (여기 한 곳에서만 관리)
```

에셋은 `import` 하지 않고 `img()` / `icon()` 헬퍼로만 참조한다. 자세한 규칙은 `CLAUDE.md` 10-1절.

## 배포

`main` 에 머지되면 Vercel 이 자동으로 프로덕션에 배포한다.

- 머지 버튼은 **오너(@phin0107) 만** 누른다
- **`Create a merge commit`** 을 쓴다 (Squash 금지)

이유는 [`docs/BRANCHING.md`](docs/BRANCHING.md) 2절 ②에 정리되어 있다. 다른 사람이 머지하면 커밋 author 가 바뀌어 Vercel 배포가 차단된다.
