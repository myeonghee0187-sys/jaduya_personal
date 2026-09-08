# Graph Report - jaduya  (2026-09-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 278 nodes · 609 edges · 13 communities (10 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e1c02f9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AuthContext.tsx
- icon
- Home.tsx
- package.json
- types.ts
- img
- compilerOptions
- compilerOptions
- MyMenuEdit.tsx
- react
- tsconfig.json
- nextjs-metadata.ts

## God Nodes (most connected - your core abstractions)
1. `icon()` - 42 edges
2. `react` - 25 edges
3. `compilerOptions` - 19 edges
4. `img()` - 18 edges
5. `compilerOptions` - 15 edges
6. `useAuth()` - 13 edges
7. `useAppNavigation()` - 9 edges
8. `Home()` - 9 edges
9. `BottomSheet()` - 7 edges
10. `MyPage()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `MediumBody()` --calls--> `icon()`  [EXTRACTED]
  src/components/HomeWidget.tsx → src/lib/asset.ts
- `SmallBody()` --calls--> `icon()`  [EXTRACTED]
  src/components/HomeWidget.tsx → src/lib/asset.ts
- `WidgetCardBody()` --calls--> `icon()`  [EXTRACTED]
  src/components/WidgetCard.tsx → src/lib/asset.ts
- `TestAccountSheetProps` --references--> `MockAccount`  [EXTRACTED]
  src/components/auth/TestAccountSheet.tsx → src/auth/mockUsers.ts
- `AddWidgetProps` --references--> `useDraftSelection()`  [EXTRACTED]
  src/components/AddWidget.tsx → src/hooks/useDraftSelection.ts

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.08
Nodes (36): App(), AuthContext, AuthProvider(), AuthValue, loadStoredUser(), SignupInput, useAuth(), DEMO_SIGNUP_EMAIL (+28 more)

### Community 1 - "icon"
Cohesion: 0.11
Nodes (31): MainPages(), BellButton(), BottomNavigation(), BottomNavigationProps, TabId, GnbMenuItem(), GnbMenuItemProps, GnbOverlay() (+23 more)

### Community 2 - "Home.tsx"
Cohesion: 0.10
Nodes (25): Persona, HomeSheet(), HomeSheetProps, SheetHandleProps, DEFAULT_PERSONA, greetingName(), HOME_PERSONA_CONTENT, ACTIVITY_EMPTY (+17 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (26): dependencies, react, react-dom, @vercel/speed-insights, devDependencies, @types/react, @types/react-dom, typescript (+18 more)

### Community 4 - "types.ts"
Cohesion: 0.11
Nodes (20): AddWidget(), CATEGORIES, IN_USE_IDS, RECOMMEND_GROUPS, Greeting(), GreetingProps, SIZE_CLASS, WidgetCard() (+12 more)

### Community 5 - "img"
Cohesion: 0.13
Nodes (19): DiscoverySection(), Hero(), MediumBody(), MediumWidget(), SmallBody(), SmallWidget(), MyLifeSection(), MyLifeSectionProps (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+12 more)

### Community 7 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowSyntheticDefaultImports, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+8 more)

### Community 8 - "MyMenuEdit.tsx"
Cohesion: 0.23
Nodes (11): AddWidgetProps, MenuCard(), MenuCardProps, MyMenuEdit(), MyMenuEditProps, DEFAULT_MENU, findMenu(), MAX_MENU (+3 more)

### Community 9 - "react"
Cohesion: 0.23
Nodes (10): react, AIChatbot(), AIChatbotButton(), AIChatbotButtonProps, Bounds, clamp(), readBounds(), Side (+2 more)

## Knowledge Gaps
- **103 isolated node(s):** `SignupInput`, `AccountSwitchSheetProps`, `AuthFieldProps`, `LoginProps`, `Agreements` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 106 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `AuthContext.tsx`, `icon`, `Home.tsx`, `package.json`, `types.ts`, `img`, `MyMenuEdit.tsx`?**
  _High betweenness centrality (0.228) - this node is a cross-community bridge._
- **Why does `icon()` connect `icon` to `AuthContext.tsx`, `types.ts`, `img`, `MyMenuEdit.tsx`, `react`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `SignupInput`, `AccountSwitchSheetProps`, `AuthFieldProps` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08127721335268505 - nodes in this community are weakly interconnected._
- **Should `icon` be split into smaller, more focused modules?**
  _Cohesion score 0.10887949260042283 - nodes in this community are weakly interconnected._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._