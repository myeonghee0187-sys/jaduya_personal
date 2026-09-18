# JADUYA --- Design System

## 1. Foundation

### Mobile Frame

-   Base frame: `402 × 874px`
-   Screen Margin: `30px`
-   Content Width: `342px`
-   Grid: `4 columns`
-   Gutter: `12px`
-   Base unit: `4px`

### Important

`402 / Margin 30 / Content 342 / 4 Columns / Gutter 12`

이 값을 기준으로 화면을 설계한다.

`Margin 20px` 또는 `Content 362px`을 사용하지 않는다.

------------------------------------------------------------------------

## 2. Spacing Scale

4px base system.

  Token     Value
  ------- -------
  2XS         4px
  XS          8px
  SM         12px
  MD         16px
  LG         20px
  XL         24px
  2XL        32px
  3XL        40px
  4XL        48px

### Semantic Usage

-   Screen Margin: 30px
-   Grid Gutter: 12px
-   Section Gap: 24px
-   Card Gap: 12px
-   Card Padding S: 12px
-   Card Padding M: 16px
-   Card Padding L: 20px

화면 Margin은 Grid token과 별개로 `30px`을 사용한다.

------------------------------------------------------------------------

## 3. Radius

기본 scale:

  Usage                                      Radius
  ----------------------------------- -------------
  Small surface / basic information             8px
  Button / selected state                      12px
  General card / section surface               14px
  Major surface                                20px
  Bottom Sheet / large container               24px
  Pill                                  Pill radius

### Prohibited

다음 radius를 임의로 추가하지 않는다.

`10 / 18 / 22 / 26 / 30px`

------------------------------------------------------------------------

## 4. Color

### Primary

`#B43936`

JADUYA Red.

사용: - Primary action - Important emphasis - Selected state - Important
status - Brand accent

### Secondary Palette

-   Green: `#A2B123`
-   Orange: `#C7753B`
-   Yellow: `#FBDD78`

### Full Tint/Shade Scale

Figma "컬러" 섹션(node `952:4114`) 기준. 각 색상은 0(가장 밝음)~10(가장
어두움) 단계로 정의되며, 위 Primary/Secondary Palette 값은 아래 5단계와
동일하다(코드 토큰: `tokens.css`의 `--color-<name>-<step>`).

| 단계 | 잘 익은 자두 (primary) | 햇살 과육 (secondary) | 구운 자두 (orange) | 풋자두 (green/point) | 오트 크림 (cream) | Gray |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `#FEFFFD` | `#FFFFFF` | `#FFFFFF` |
| 0.5 | `#F8EBEB` | `#FFFCF2` | `#F9F1EB` | `#F5F7E7` | `#FCFAF7` | `#F1F1F1` |
| 1 | `#F0D7D7` | `#FEF8E4` | `#F4E3D8` | `#ECEFD1` | `#F9F5EF` | `#E3E3E3` |
| 1.5 | `#E9C4C3` | `#FEF5D7` | `#EED6C4` | `#E2E8BC` | `#F6F0E6` | `#D6D6D6` |
| 2 | `#E1B0AF` | `#FDF1C9` | `#E9C8B1` | `#D9E0A6` | `#F3EBDE` | `#C8C8C8` |
| 3 | `#D28886` | `#FDEBAE` | `#DDAC89` | `#C7D07A` | `#ECE1CE` | `#ACACAC` |
| 4 | `#C3615E` | `#FCE493` | `#D29162` | `#B4C14F` | `#E6D7BD` | `#919191` |
| 5 | `#B43936` | `#FBDD78` | `#C7753B` | `#A2B123` | `#E0CDAD` | `#757575` |
| 6 | `#902E2B` | `#D7BC60` | `#9F5E2F` | `#82BE1C` | `#C2AF90` | `#5E5E5E` |
| 7 | `#6C2220` | `#B49B49` | `#774623` | `#616A15` | `#A49173` | `#464646` |
| 8 | `#481716` | `#907B31` | `#502F18` | `#41470E` | `#857456` | `#2F2F2F` |
| 8.5 | `#361110` | `#7E6A25` | `#3C2312` | `#31350B` | `#766548` | `#232323` |
| 9 | `#240B0B` | `#6D5A1A` | `#28170C` | `#202307` | `#675639` | `#171717` |
| 9.5 | `#120605` | `#5B490E` | `#140C06` | `#101204` | `#58472B` | `#0C0C0C` |
| 10 | `#000000` | `#493902` | `#000000` | `#000000` | `#49381C` | `#000000` |

### Surface

-   Warm background: `#FAF8F5`
-   Light cream surface: `#FFFDF9`
-   Warm widget surface: `#F7F3ED`
-   Border: `#919191` (Gray 4 — 이전 `#E9DED1`은 흰 배경 대비 1.5:1로 UI 컴포넌트 경계
    기준(3:1) 미달이라 교체)

### Text

-   Primary: `#3B332E`
-   Secondary: `#74716D`

### Interaction

Brand colors are accents, not widget backgrounds.

모든 위젯을 서로 다른 색으로 채우지 않는다.

------------------------------------------------------------------------

## 5. Typography

### Font Roles

  Role                                  Font
  ------------------------------------- -------------------------
  Logo                                  KERIS KEDU
  Korean information hierarchy          A2Z
  Body / UI / numbers                   SUIT
  English / number / symbol expansion   Asta Sans where defined

### Core Styles

  Style             Font               Weight       Size
  ----------------- ------------------ ---------- ------
  Logo              KERIS KEDU         Bold         24px
  Display L         Handon 3gyeopsal   600          24px
  Display M         Handon 3gyeopsal   600          20px
  Display Support   Handon 3gyeopsal   300          20px
  Heading 1         A2Z                Bold         24px
  Heading 2         A2Z                Bold         20px
  Heading 3         A2Z                SemiBold     18px
  Heading 4         A2Z                SemiBold     16px
  Body L            SUIT               Regular      16px
  Body M            SUIT               Regular      14px
  Body S            SUIT               Regular      12px
  Label L           SUIT               SemiBold     14px
  Label M           SUIT               Medium       12px
  Caption           SUIT               Regular      10px

기존 Figma Typography Style을 우선 사용한다.

------------------------------------------------------------------------

## 6. Typography Usage

### A2Z

-   Page title
-   Major section heading
-   Brand/editorial emotional heading

### SUIT

-   Body
-   UI labels
-   Metrics
-   Numbers
-   Meta information
-   Buttons
-   Navigation

작은 글씨로 정보를 억지로 넣지 않는다.

------------------------------------------------------------------------

## 7. Layout Principles

### Information Hierarchy

한 화면에 하나의 dominant information을 둔다.

예:

``` text
큰 숫자
↓
변화 / 비교
↓
해석
↓
다음 행동
```

### Section Zoning

동일한 카드의 반복 대신: - spacing - background surface - typography -
divider - visual anchor

를 사용하여 섹션을 구분한다.

------------------------------------------------------------------------

## 8. Components

기존 JADUYA Component Library를 우선 재사용한다.

주요 컴포넌트 유형:

-   Button
-   Icon Button
-   Badge
-   Tag
-   Search
-   Switch
-   Checkbox
-   Progress Bar
-   Discovery
-   Editorial Card
-   Action List
-   Widget Grid
-   Bottom Sheet
-   Personal Canvas
-   Navigation
-   FAB

새 컴포넌트가 필요하면 기존 컴포넌트와 시각적/행동적 규칙을 먼저
비교한다.

------------------------------------------------------------------------

## 9. Action List

Action List는 "오늘 챙길 것"에 사용한다.

구조:

``` text
Title / Subject
Current state
Next action →
```

같은 주제에 대해 insight card와 별도 action row를 동시에 만들지 않는다.

------------------------------------------------------------------------

## 10. Widget System

### Canvas

`342 × 194px`

### Widget Sizes

  Type                 Size
  ---------- --------------
  Large         342 × 114px
  Medium        167 × 114px
  Small        128.5 × 72px
  Add Slot        69 × 72px

최대 사용자 위젯: `4개`

Add Slot은 제외.

------------------------------------------------------------------------

## 11. Widget Internal Grid

### Large / Medium

-   Left anchor: 16px
-   Title Y: 16px
-   Main Y: 40\~42px
-   Secondary Y: 70\~76px
-   Indicator Y: 94\~98px

### Small

-   Left anchor: 14px
-   Title Y: 12px
-   Main Y: 32\~35px
-   Bottom Y: 53\~56px

### Responsive Content

위젯이 작아질수록: 1. 부가 설명 제거 2. secondary content 제거 3. 시각적
요소 단순화 4. 마지막으로 필요한 경우 typography 조정

단순 scale-down으로 해결하지 않는다.

------------------------------------------------------------------------

## 12. Bottom Sheet

Home의 Personal Canvas는 Bottom Sheet / expandable panel 구조를 사용할
수 있다.

### Peek

-   Hero가 보인다.
-   Personal Canvas의 일부가 노출된다.
-   drag handle을 사용한다.

### Expanded

-   상단 Hero는 축소된다.
-   `오늘 챙길 것`
-   `내 생활`
-   `자두의 발견`

순으로 콘텐츠가 확장된다.

권장 Expanded: - Top: 약 88px - Height: 약 786px - Radius: 24px

Sheet surface: `rgba(255,253,249,0.96)`

Drag handle: `#C9C3BD`

------------------------------------------------------------------------

## 13. Navigation

Bottom Navigation:

`생활 / 돈 관리 / 홈 / 커뮤니티 / 마이`

홈은 중앙의 primary position이다.

네비게이션 아이콘과 label은 기존 Figma component를 사용한다.

------------------------------------------------------------------------

## 14. FAB

Chatbot은 Home card가 아니다.

-   전역 floating action button
-   Bottom Navigation 위쪽
-   화면 우측에 위치
-   원형 구조
-   브랜드 캐릭터/상태를 활용할 수 있다.

큰 chatbot panel을 Home에 상시 노출하지 않는다.

------------------------------------------------------------------------

## 15. Home Visual Direction

Home은 다음 구조를 따른다.

``` text
Hero / Context
      ↓
① 오늘 챙길 것
      ↓
② 내 생활
      ↓
③ 자두의 발견
```

### World-building

하늘, 흙, 식물, 창가, 반려동물 등의 요소를 사용할 수 있다.

단, 게임 UI처럼 보이면 안 된다.

목표는: `cozy + fresh + practical`

------------------------------------------------------------------------

## 16. Finance Visual Direction

돈 관리 화면은 일반적인 "카드가 쌓인 가계부"처럼 만들지 않는다.

### Preferred Patterns

-   dominant number
-   comparison
-   progress
-   one clear chart
-   timeline
-   list + divider
-   visual icon / illustration
-   AI interpretation

### 이번 달

현재 상태.

### 소비

행동과 패턴.

### 고정비

반복되는 의무 지출과 일정.

------------------------------------------------------------------------

## 17. Card Principles

카드는 정보 그룹화가 필요할 때만 사용한다.

피해야 할 것:

-   모든 섹션을 카드로 감싸기
-   같은 radius 카드 반복
-   카드 안에 또 카드 넣기
-   색상만 다른 카드 여러 개 만들기

대신 section spacing, divider, typography, surface zoning을 사용한다.

------------------------------------------------------------------------

## 18. Illustration & Mascot

Mascot은 브랜드 인상을 강화하지만 정보보다 앞서지 않는다.

-   중요한 행동을 방해하지 않는다.
-   캐릭터를 모든 카드에 넣지 않는다.
-   같은 캐릭터의 얼굴/비율/스타일을 임의로 변경하지 않는다.
-   일러스트는 실제 생활 장면과 연결한다.

------------------------------------------------------------------------

## 19. Content UI

### Numbers

숫자는 한눈에 읽혀야 한다.

예: `84.2만원`

보조 정보: `전월보다 8% 늘었어요`

### Status

상태는 색상 하나만으로 전달하지 않는다.

텍스트 + indicator를 함께 사용한다.

------------------------------------------------------------------------

## 20. Accessibility / QA

검수 항목:

-   402 × 874 frame
-   좌우 30px margin
-   342px content width
-   4-column grid
-   12px gutter
-   text overflow 없음
-   숫자 단위 명확
-   contrast 확보
-   tap target 충분
-   기존 component 사용
-   radius / spacing token 준수
-   동일 정보 중복 없음
-   bottom navigation과 FAB 충돌 없음
-   widget 내부 content overflow 없음

------------------------------------------------------------------------

## 21. Visual Do / Don't

### Do

-   warm
-   matte
-   clean
-   fresh
-   practical
-   restrained playful
-   organic composition
-   neutral widget surfaces

### Don't

-   neon
-   childish
-   excessive gradients
-   rainbow widgets
-   generic AI dashboard
-   generic Toss clone
-   oversized CTA
-   excessive pill UI
-   every element rounded
-   game-like sky/soil screen
