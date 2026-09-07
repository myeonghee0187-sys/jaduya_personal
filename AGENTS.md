# JADUYA --- AGENTS.md

## 1. Role

이 프로젝트에서 작업하는 모든 AI agent는 JADUYA의 기존 Figma와 Design
System을 우선 존중한다.

새로운 화면을 만드는 것보다 기존 구조를 정확히 이해하고 재사용하는 것을
우선한다.

## Technical Stack

This project must be implemented using:

- React
- TypeScript
- Vite
- CSS

Do not implement the project as a static HTML/CSS/JavaScript website.

All screens must be built as reusable React components.

Use React state and component props for UI interactions such as:
- GNB open / close
- widget add / edit
- bottom sheet states
- modal and overlay states

Do not create separate static HTML files for individual UI states.

------------------------------------------------------------------------

## 2. Mandatory Source Order

작업 전 다음 순서로 확인한다.

1.  현재 Figma
2.  `DESIGN_SYSTEM.md`
3.  `PRD.md`
4.  `CLAUDE.md`

현재 Figma에서 이미 결정된 값은 임의로 변경하지 않는다.

------------------------------------------------------------------------

## 3. Before Designing

새 화면 또는 컴포넌트를 만들기 전에 반드시 확인한다.

-   이 기능이 현재 IA에 존재하는가?
-   기존 화면에 같은 정보가 존재하는가?
-   기존 컴포넌트로 해결할 수 있는가?
-   기존 Design Token으로 표현할 수 있는가?
-   새 화면이 실제 사용자 문제를 해결하는가?
-   다른 화면과 데이터 의미가 충돌하지 않는가?

하나라도 불명확하면 새로운 UI를 임의로 확정하지 않는다.

------------------------------------------------------------------------

## 4. Figma Rules

### Frame

모바일 화면은 기본적으로:

`402 × 874px`

### Grid

`Margin 30 / Content 342 / 4 Columns / Gutter 12`

### Existing Components

기존 Figma component를 우선 사용한다.

동일한 기능을 다른 이름으로 새 컴포넌트로 복제하지 않는다.

------------------------------------------------------------------------

## 5. Design Token Rules

다음 값을 임의로 변경하지 않는다.

### Primary

`#B43936`

### Secondary

-   `#A2B123`
-   `#C7753B`
-   `#FBDD78`

### Background / Surface

-   `#FAF8F5`
-   `#FFFDF9`
-   `#F7F3ED`

### Border

`#E9DED1`

### Text

-   Primary `#3B332E`
-   Secondary `#74716D`

### Spacing

4px base.

### Radius

8 / 12 / 14 / 20 / 24 / Pill

------------------------------------------------------------------------

## 6. Typography Rules

### A2Z

정보 구조와 주요 한글 heading.

### SUIT

본문, UI, 숫자, label, metric.

### KERIS KEDU

Logo only.

Typography를 임의로 교체하지 않는다.

------------------------------------------------------------------------

## 7. IA Rules

### Main Navigation

`생활 / 돈 관리 / 홈 / 커뮤니티 / 마이`

### Home

`오늘 챙길 것 / 내 생활 / 자두의 발견`

### Money

`이번 달 / 소비 / 고정비`

혜택을 독립적인 메인 페이지로 다시 추가하지 않는다.

혜택은 AI Insight 또는 관련 콘텐츠에서 상황에 맞게 노출한다.

------------------------------------------------------------------------

## 8. Home Agent Rules

Home은 shortcut dashboard가 아니다.

### 오늘 챙길 것

Action 중심.

### 내 생활

사용자 개인 위젯 공간.

### 자두의 발견

Discovery content.

이 세 영역의 역할을 섞지 않는다.

------------------------------------------------------------------------

## 9. Widget Rules

### Maximum

사용자 위젯 최대 4개.

### Sizes

-   Large `342 × 114`
-   Medium `167 × 114`
-   Small `128.5 × 72`
-   Add Slot `69 × 72`

Canvas:

`342 × 194`

### Content

Small: 핵심 정보 1개.

Medium: 관련 정보 2\~3개.

Large: 요약 + 추가 정보.

위젯 크기에 맞지 않는 콘텐츠를 억지로 넣지 않는다.

------------------------------------------------------------------------

## 10. Widget Interaction

Normal:

-   편집 UI 없음

Long Press:

-   Edit Mode

Edit Mode:

-   Drag
-   Snap / Reflow
-   Delete
-   Add

Add:

-   Widget Picker

Add Slot은 항상 최대 4개 위젯 제한과 별도로 취급한다.

------------------------------------------------------------------------

## 11. Widget Picker Rules

Picker는 다음 순서를 기본으로 한다.

``` text
Header
↓
Search
↓
현재 사용 중인 위젯
↓
추천 위젯
↓
Categories
↓
Widget Tip
```

이미 사용 중인 위젯을 추천 영역에서 중복하지 않는다.

선택 상태는 Picker 전체에서 공유한다.

선택: `JADUYA Red border + check`

------------------------------------------------------------------------

## 12. Money Agent Rules

돈 관리 화면을 일반적인 가계부 dashboard처럼 만들지 않는다.

### 이번 달

현재 월의 상태를 요약한다.

### 소비

실제 소비 행동을 분석한다.

### 고정비

반복 지출과 결제 일정을 관리한다.

`이번 달`에는 고정비 상세 timeline을 중복해서 넣지 않는다.

------------------------------------------------------------------------

## 13. Fixed Cost Categories

``` text
주거
- 월세
- 관리비
- 공과금

생활
- 통신
- 구독

금융
- 보험
- 기타
```

카테고리를 임의로 변경하지 않는다.

------------------------------------------------------------------------

## 14. AI Rules

AI는 해석 레이어다.

다음 순서를 우선한다.

`변화 → 이유 → 행동`

혜택은 관련성이 있을 때 AI Insight에 연결한다.

AI를 별도의 화려한 dashboard로 만들지 않는다.

------------------------------------------------------------------------

## 15. Visual Rules

### Preferred

-   warm cream
-   restrained red
-   practical information
-   subtle organic layout
-   neutral widget surfaces
-   real-life illustration
-   clear hierarchy

### Avoid

-   excessive cards
-   childish colors
-   rainbow widget backgrounds
-   huge CTA
-   generic dashboard
-   excessive pills
-   excessive rounded rectangles
-   game-like background
-   decorative UI that hides information

------------------------------------------------------------------------

## 16. Content Rules

문장은 짧고 구체적으로 작성한다.

### Good

`월세 납부까지 3일 남았어요`

### Bad

`회원님의 월세 납부 일정이 다가오고 있으니 확인해 보시는 것을 추천드립니다.`

숫자와 단위를 명확하게 표시한다.

같은 데이터는 화면마다 같은 의미로 사용한다.

------------------------------------------------------------------------

## 17. Component Reuse

새 컴포넌트를 만들기 전에:

1.  기존 component 검색
2.  유사 component 확인
3.  variant로 해결 가능한지 확인
4.  token으로 해결 가능한지 확인
5.  그래도 필요할 때만 신규 component 생성

기존 component를 복제해서 이름만 바꾸지 않는다.

------------------------------------------------------------------------

## 18. Screen Build Procedure

모든 화면은 다음 순서로 만든다.

### Step 1 --- Purpose

화면의 목적을 한 문장으로 정의한다.

### Step 2 --- Information

핵심 정보와 보조 정보를 분리한다.

### Step 3 --- IA

현재 IA와 충돌하지 않는지 확인한다.

### Step 4 --- Component

기존 component를 재사용한다.

### Step 5 --- Layout

402 × 874 / Margin 30 / Content 342 기준으로 배치한다.

### Step 6 --- Visual

기존 JADUYA Design System을 적용한다.

### Step 7 --- Interaction

Normal / Edit / Selected / Empty / Error / Loading 상태를 필요한
범위에서 정의한다.

### Step 8 --- QA

Overflow, spacing, typography, hierarchy, interaction을 확인한다.

------------------------------------------------------------------------

## 19. Data Consistency

돈 관리 화면에서는 특히 데이터 의미를 통일한다.

확인해야 할 항목:

-   총액
-   예산
-   남은 금액
-   고정비
-   예정 지출
-   전월 비교
-   결제 예정일

동일한 항목을 화면마다 다른 금액이나 의미로 표시하지 않는다.

------------------------------------------------------------------------

## 20. Empty State

데이터가 없다고 해서 임의의 가짜 콘텐츠를 채우지 않는다.

좋은 Empty State는:

-   현재 상태 설명
-   필요한 경우 다음 행동
-   과도한 illustration 없음

을 원칙으로 한다.

예:

`오늘은 특별히 챙길 일이 없어요.`

------------------------------------------------------------------------

## 21. QA Checklist

### Layout

-   [ ] 402 × 874
-   [ ] 좌우 30px
-   [ ] content 342px
-   [ ] 4-column grid
-   [ ] gutter 12px
-   [ ] spacing token 사용

### Visual

-   [ ] JADUYA color system
-   [ ] typography system
-   [ ] radius system
-   [ ] 기존 component
-   [ ] neutral widget surface
-   [ ] 과도한 장식 없음

### UX

-   [ ] 화면 목적 명확
-   [ ] 핵심 정보 우선
-   [ ] 다음 행동 명확
-   [ ] 정보 중복 없음
-   [ ] 정상/선택/편집 상태 확인
-   [ ] overflow 없음

### Product

-   [ ] IA와 일치
-   [ ] 실제 1인가구 문제 해결
-   [ ] AI가 필요 이상으로 앞에 나오지 않음
-   [ ] 혜택을 별도 페이지로 부활시키지 않음
-   [ ] Money 3탭 역할 중복 없음

------------------------------------------------------------------------

## 22. Final Principle

JADUYA의 UI는 "예쁜 화면"을 만드는 것이 목표가 아니다.

사용자가 혼자 사는 생활을 더 쉽게 이해하고 관리하도록 만드는 것이
목표다.

**정보는 명확하게.\
브랜드는 따뜻하게.\
행동은 자연스럽게.**
