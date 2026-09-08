# Graph Report - jaduya  (2026-09-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1353 nodes · 3754 edges · 68 communities (64 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e1c02f9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- beginWork
- "node_modules/react-dom/cjs/react-dom.development.js"
- "node_modules/react/cjs/react.development.js"
- push
- AuthContext.tsx
- Home.tsx
- MyPage.tsx
- icon
- ChildReconciler
- mountWorkInProgressHook
- package.json
- updateDehydratedSuspenseComponent
- diffHydratedProperties
- createElement
- error
- restoreSelection
- createRoot
- findInstanceBlockingEvent
- compilerOptions
- completeWork
- captureCommitPhaseError
- renderRootConcurrent
- updateWorkInProgressHook
- flushPassiveEffects
- commitDeletionEffectsOnFiber
- react-dom_client.js
- getComponentNameFromFiber
- compilerOptions
- dispatchEventForPluginEventSystem
- popHydrationState
- react
- AddWidget.tsx
- toString
- extractEvents$4
- constructSelectEvent
- GnbOverlay.tsx
- createClassErrorUpdate
- dispatchSetState
- getInstIfValueChanged
- dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay
- commitPlacement
- scheduleUpdateOnFiber
- describeNativeComponentFrame
- performConcurrentWorkOnRoot
- commitMutationEffectsOnFiber
- commitLayoutEffectOnFiber
- ensureRootIsScheduled
- finishConcurrentRender
- mergeLanes
- updateSuspenseListComponent
- setValueForProperty
- checkAttributeStringCoercion
- throwException
- commitRootImpl
- commitPassiveMountEffects_complete
- warnNonhydratedInstance
- findCurrentHostFiber
- flushPassiveEffectsImpl
- warnUnhydratedInstance
- completeDehydratedSuspenseBoundary
- retryTimedOutBoundary
- forceStoreRerender
- recursivelyTraverseMutationEffects
- pushHostContext
- tsconfig.json
- nextjs-metadata.ts
- deps/package.json

## God Nodes (most connected - your core abstractions)
1. `"node_modules/react-dom/cjs/react-dom.development.js"()` - 919 edges
2. `error()` - 118 edges
3. `"node_modules/react/cjs/react.development.js"()` - 87 edges
4. `push()` - 42 edges
5. `icon()` - 42 edges
6. `completeWork()` - 40 edges
7. `beginWork()` - 33 edges
8. `captureCommitPhaseError()` - 30 edges
9. `"node_modules/scheduler/cjs/scheduler.development.js"()` - 27 edges
10. `commitRootImpl()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `renderWithHooks()` --calls--> `Component()`  [EXTRACTED]
  .vite/deps/react-dom_client.js → .vite/deps/chunk-GFWMZNU4.js
- `WidgetCardBody()` --calls--> `icon()`  [EXTRACTED]
  src/components/WidgetCard.tsx → src/lib/asset.ts
- `TestAccountSheetProps` --references--> `MockAccount`  [EXTRACTED]
  src/components/auth/TestAccountSheet.tsx → src/auth/mockUsers.ts
- `AddWidgetProps` --references--> `useDraftSelection()`  [EXTRACTED]
  src/components/AddWidget.tsx → src/hooks/useDraftSelection.ts
- `MenuCardProps` --references--> `MenuItem`  [EXTRACTED]
  src/components/MenuCard.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (68 total, 3 thin omitted)

### Community 0 - "beginWork"
Cohesion: 0.06
Nodes (93): adoptClassInstance(), applyDerivedStateFromProps(), attemptEarlyBailoutIfNoScheduledUpdate(), bailoutHooks(), bailoutOnAlreadyFinishedWork(), beginWork(), cacheContext(), callComponentWillMount() (+85 more)

### Community 1 - ""node_modules/react-dom/cjs/react-dom.development.js""
Cohesion: 0.03
Nodes (53): "node_modules/react-dom/cjs/react-dom.development.js"(), addEventBubbleListener(), addEventBubbleListenerWithPassiveFlag(), addEventCaptureListener(), addEventCaptureListenerWithPassiveFlag(), addTrappedEventListener(), callCallback2(), canHydrateInstance() (+45 more)

### Community 2 - ""node_modules/react/cjs/react.development.js""
Cohesion: 0.05
Nodes (84): "node_modules/react/cjs/react.development.js"(), act(), checkKeyStringCoercion(), checkPropTypes(), cloneAndReplaceKey(), cloneElement(), cloneElementWithValidation(), Component() (+76 more)

### Community 3 - "push"
Cohesion: 0.07
Nodes (46): accumulateTwoPhaseListeners(), createAndAccumulateChangeEvent(), createLaneMap(), enqueuePendingPassiveProfilerEffect(), enqueueStateRestore(), extractBeforeInputEvent(), extractCompositionEvent(), extractEvents() (+38 more)

### Community 4 - "AuthContext.tsx"
Cohesion: 0.09
Nodes (30): AuthContext, AuthProvider(), AuthValue, loadStoredUser(), SignupInput, DEMO_SIGNUP_EMAIL, DEMO_SIGNUP_LABEL, isDemoSignupDone() (+22 more)

### Community 5 - "Home.tsx"
Cohesion: 0.09
Nodes (33): Persona, AddWidgetProps, Greeting(), GreetingProps, HomeSheet(), HomeSheetProps, SheetHandleProps, MenuCard() (+25 more)

### Community 6 - "MyPage.tsx"
Cohesion: 0.09
Nodes (29): App(), MainPages(), useAuth(), AccountSwitchSheet(), BottomNavigation(), BottomNavigationProps, TabId, GnbOverlay() (+21 more)

### Community 7 - "icon"
Cohesion: 0.12
Nodes (26): DiscoverySection(), Hero(), MediumBody(), MediumWidget(), SmallBody(), SmallWidget(), MyLifeSection(), MyLifeSectionProps (+18 more)

### Community 8 - "ChildReconciler"
Cohesion: 0.19
Nodes (33): checkDepsAreArrayDev(), ChildReconciler(), createChild(), deleteChild(), deleteRemainingChildren(), mapRemainingChildren(), placeChild(), placeSingleChild() (+25 more)

### Community 9 - "mountWorkInProgressHook"
Cohesion: 0.09
Nodes (30): basicStateReducer(), createFunctionComponentUpdateQueue(), getBitLength(), getLeadingBit(), getTreeId(), getWorkInProgressRoot(), includesBlockingLane(), mountCallback() (+22 more)

### Community 10 - "package.json"
Cohesion: 0.07
Nodes (26): dependencies, react, react-dom, @vercel/speed-insights, devDependencies, @types/react, @types/react-dom, typescript (+18 more)

### Community 11 - "updateDehydratedSuspenseComponent"
Cohesion: 0.10
Nodes (28): addSubtreeSuspenseContext(), createCapturedValue(), createFiberFromFragment(), createFiberFromOffscreen(), getRemainingWorkInPrimaryTree(), getSuspendedCache(), getSuspenseInstanceFallbackErrorDetails(), isSuspenseInstanceFallback() (+20 more)

### Community 12 - "diffHydratedProperties"
Cohesion: 0.13
Nodes (26): assertValidProps(), checkControlledValueProps(), checkSelectPropTypes(), diffHydratedProperties(), diffProperties(), getCurrentFiberOwnerNameInDevOrNull(), getDeclarationErrorAddendum(), getEventListenerSet() (+18 more)

### Community 13 - "createElement"
Cohesion: 0.09
Nodes (24): checkForUnmatchedText(), commitUpdate(), createElement(), createInstance(), createTextInstance(), createTextNode(), didNotMatchHydratedContainerTextInstance(), didNotMatchHydratedTextInstance() (+16 more)

### Community 14 - "error"
Cohesion: 0.13
Nodes (24): createFiberFromProfiler(), error(), getReactRootElementInContainer(), hydrate(), imperativeHandleEffect(), isConcurrentActEnvironment(), isContainerMarkedAsRoot(), isValidContainerLegacy() (+16 more)

### Community 15 - "restoreSelection"
Cohesion: 0.10
Nodes (23): commitBeforeMutationEffects(), commitBeforeMutationEffects_begin(), containsNode(), getActiveElementDeep(), getLeafNode(), getModernOffsetsFromPoints(), getNodeForCharacterOffset(), getOffsets() (+15 more)

### Community 16 - "createRoot"
Cohesion: 0.11
Nodes (23): createContainer(), createFiberRoot(), createHostRootFiber(), createPortal(), createPortal$1(), createRoot(), createRoot$1(), hydrateRoot() (+15 more)

### Community 17 - "findInstanceBlockingEvent"
Cohesion: 0.12
Nodes (22): assertIsMounted(), attachPingListener(), attemptExplicitHydrationTarget(), findCurrentFiberUsingSlowPath(), findCurrentHostFiberWithNoPortals(), findCurrentHostFiberWithNoPortalsImpl(), findCurrentUnmaskedContext(), findHostInstanceWithNoPortals() (+14 more)

### Community 18 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+12 more)

### Community 19 - "completeWork"
Cohesion: 0.20
Nodes (21): completeWork(), cutOffTailIfNeeded(), finalizeInitialChildren(), getRenderTargetTime(), markRef$1(), markUpdate(), pop(), popContext() (+13 more)

### Community 20 - "captureCommitPhaseError"
Cohesion: 0.15
Nodes (20): captureCommitPhaseError(), commitDoubleInvokeEffectsInDEV(), commitHookEffectListMount(), invokeEffectsInDev(), invokeLayoutEffectMountInDEV(), invokeLayoutEffectUnmountInDEV(), invokePassiveEffectMountInDEV(), invokePassiveEffectUnmountInDEV() (+12 more)

### Community 21 - "renderRootConcurrent"
Cohesion: 0.16
Nodes (19): addFiberToLanesMap(), getTransitionsForLanes(), handleError(), laneToIndex(), markComponentErrored(), markComponentSuspended(), markRenderStarted(), markRenderStopped() (+11 more)

### Community 22 - "updateWorkInProgressHook"
Cohesion: 0.15
Nodes (19): areHookInputsEqual(), includesOnlyNonUrgentLanes(), isSubsetOfLanes(), markSkippedUpdateLanes(), markWorkInProgressReceivedUpdate(), rerenderDeferredValue(), rerenderReducer(), rerenderState() (+11 more)

### Community 23 - "flushPassiveEffects"
Cohesion: 0.18
Nodes (19): batchedUpdates$1(), commitRoot(), discreteUpdates(), dispatchContinuousEvent(), dispatchDiscreteEvent(), dispatchEvent(), flushPassiveEffects(), flushRoot() (+11 more)

### Community 24 - "commitDeletionEffectsOnFiber"
Cohesion: 0.14
Nodes (19): clearContainer(), clearSuspenseBoundary(), clearSuspenseBoundaryFromContainer(), commitDeletionEffectsOnFiber(), commitHookEffectListUnmount(), commitHydratedContainer(), commitHydratedSuspenseInstance(), commitSuspenseHydrationCallbacks() (+11 more)

### Community 25 - "react-dom_client.js"
Cohesion: 0.11
Nodes (12): ./MyComponent, TODO: When we delete legacy mode, we should make this error argument, TODO: Remove this dead flag, TODO: Remove outdated deferRenderPhaseUpdateToNextBatch experiment. We, NOTE: This will not work correctly for non-generic events such as `change`,, NOTE: menuitem's close tag should be omitted, but that causes problems., TODO: Remove Update flag from before mutation phase by re-landing Visibility, TODO: This prevents the assignment of defaultValue to regular (+4 more)

### Community 26 - "getComponentNameFromFiber"
Cohesion: 0.20
Nodes (18): commitBeforeMutationEffects_complete(), commitBeforeMutationEffectsOnFiber(), completeUnitOfWork(), findDOMNode(), findHostInstanceWithWarning(), getComponentNameFromFiber(), getContextName$1(), getWrappedName$1() (+10 more)

### Community 27 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowSyntheticDefaultImports, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+8 more)

### Community 28 - "dispatchEventForPluginEventSystem"
Cohesion: 0.13
Nodes (17): batchedUpdates(), clearCaughtError(), dispatchEventForPluginEventSystem(), dispatchEventsForPlugins(), executeDispatch(), finishEventHandler(), getEventTarget(), invokeGuardedCallback() (+9 more)

### Community 29 - "popHydrationState"
Cohesion: 0.16
Nodes (17): createFiberFromHostInstanceForDeletion(), deleteHydratableInstance(), getNextHydratableInstanceAfterSuspenseInstance(), getNextHydratableSibling(), insertNonHydratedInstance(), markRef(), popHydrationState(), popToNextHostParent() (+9 more)

### Community 30 - "react"
Cohesion: 0.19
Nodes (12): react, AIChatbot(), AIChatbotButton(), AIChatbotButtonProps, Bounds, clamp(), readBounds(), Side (+4 more)

### Community 31 - "AddWidget.tsx"
Cohesion: 0.16
Nodes (13): AddWidget(), CATEGORIES, IN_USE_IDS, RECOMMEND_GROUPS, SIZE_CLASS, WidgetCardBody(), WidgetCardProps, DEFAULT_WIDGETS (+5 more)

### Community 32 - "toString"
Cohesion: 0.20
Nodes (16): getToStringValue(), postMountWrapper(), postMountWrapper$1(), postMountWrapper$2(), postUpdateWrapper(), restoreControlledState(), restoreControlledState$1(), restoreControlledState$2() (+8 more)

### Community 33 - "extractEvents$4"
Cohesion: 0.14
Nodes (15): accumulateEnterLeaveListenersForEvent(), accumulateEnterLeaveTwoPhaseListeners(), accumulateSinglePhaseListeners(), createDispatchListener(), extractEvents$4(), getEventCharCode(), getEventKey(), getFiberCurrentPropsFromNode() (+7 more)

### Community 34 - "constructSelectEvent"
Cohesion: 0.17
Nodes (15): constructSelectEvent(), extractEvents$1(), extractEvents$2(), extractEvents$3(), extractEvents$5(), getActiveElement(), getEventTargetDocument(), getNodeFromInstance() (+7 more)

### Community 35 - "GnbOverlay.tsx"
Cohesion: 0.20
Nodes (9): BellButton(), GnbMenuItem(), GnbMenuItemProps, GnbOverlayProps, ShortcutCard(), GNB_CATEGORIES, GNB_DEFAULT_OPEN, GnbCategory (+1 more)

### Community 36 - "createClassErrorUpdate"
Cohesion: 0.19
Nodes (14): captureCommitPhaseErrorOnRoot(), createClassErrorUpdate(), createHydrationContainer(), createRootErrorUpdate(), createUpdate(), enqueueUpdate(), isUnsafeClassRenderPhaseUpdate(), logCapturedError() (+6 more)

### Community 37 - "dispatchSetState"
Cohesion: 0.21
Nodes (14): claimNextTransitionLane(), dispatchReducerAction(), dispatchSetState(), enqueueConcurrentClassUpdate(), enqueueConcurrentHookUpdate(), enqueueConcurrentHookUpdateAndEagerlyBailout(), enqueueRenderPhaseUpdate(), isRenderPhaseUpdate() (+6 more)

### Community 38 - "getInstIfValueChanged"
Cohesion: 0.15
Nodes (14): detachTracker(), getInstIfValueChanged(), getTargetInstForClickEvent(), getTargetInstForInputEventPolyfill(), getTargetInstForInputOrChangeEvent(), getTracker(), getValueFromNode(), handleEventsForInputEventPolyfill() (+6 more)

### Community 39 - "dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay"
Cohesion: 0.18
Nodes (13): accumulateOrCreateContinuousQueuedReplayableEvent(), attemptReplayContinuousQueuedEvent(), attemptReplayContinuousQueuedEventInMap(), attemptSynchronousHydration(), clearIfContinuousEvent(), createQueuedReplayableEvent(), dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay(), getInstanceFromNode() (+5 more)

### Community 40 - "commitPlacement"
Cohesion: 0.21
Nodes (13): appendChild(), appendChildToContainer(), appendInitialChild(), commitPlacement(), commitReconciliationEffects(), getHostParentFiber(), getHostSibling(), insertBefore() (+5 more)

### Community 41 - "scheduleUpdateOnFiber"
Cohesion: 0.24
Nodes (13): attemptContinuousHydration$1(), attemptHydrationAtCurrentPriority$1(), attemptSynchronousHydration$1(), checkForNestedUpdates(), enqueueConcurrentRenderForLane(), getIsUpdatingOpaqueValueInRenderPhaseInDEV(), higherPriorityLane(), markRetryLaneIfNotHydrated() (+5 more)

### Community 42 - "describeNativeComponentFrame"
Cohesion: 0.21
Nodes (13): describeBuiltInComponentFrame(), describeClassComponentFrame(), describeFiber(), describeFunctionComponentFrame(), describeNativeComponentFrame(), describeUnknownElementTypeFrameInDEV(), disabledLog(), disableLogs() (+5 more)

### Community 43 - "performConcurrentWorkOnRoot"
Cohesion: 0.21
Nodes (13): errorHydratingContainer(), finishQueueingConcurrentUpdates(), getLanesToRetrySynchronouslyOnError(), includesExpiredLane(), isRenderConsistentWithExternalStores(), markRootSuspended(), markRootSuspended$1(), performConcurrentWorkOnRoot() (+5 more)

### Community 44 - "commitMutationEffectsOnFiber"
Cohesion: 0.26
Nodes (12): attachSuspenseRetryListeners(), commitAttachRef(), commitMutationEffects(), commitMutationEffectsOnFiber(), commitSuspenseCallback(), commitTextUpdate(), disappearLayoutEffects_begin(), disappearLayoutEffects_complete() (+4 more)

### Community 45 - "commitLayoutEffectOnFiber"
Cohesion: 0.18
Nodes (12): callCallback(), commitLayoutEffectOnFiber(), commitLayoutEffects(), commitLayoutEffects_begin(), commitLayoutMountEffects_complete(), commitMount(), commitPassiveEffectDurations(), commitUpdateQueue() (+4 more)

### Community 46 - "ensureRootIsScheduled"
Cohesion: 0.23
Nodes (12): cancelCallback$1(), ensureRootIsScheduled(), getBumpedLaneForHydration(), getHighestPriorityLane(), getHighestPriorityLanes(), getHighestPriorityPendingLanes(), getNextLanes(), includesNonIdleWork() (+4 more)

### Community 47 - "finishConcurrentRender"
Cohesion: 0.18
Nodes (12): computeExpirationTime(), finishConcurrentRender(), getMostRecentEventTime(), includesOnlyRetries(), includesOnlyTransitions(), jnd(), markRootFinished(), markRootPinged() (+4 more)

### Community 48 - "mergeLanes"
Cohesion: 0.24
Nodes (12): entangleTransitions(), entangleTransitionUpdate(), intersectLanes(), isTransitionLane(), markRootEntangled(), mergeLanes(), pickArbitraryLane(), propagateContextChange() (+4 more)

### Community 49 - "updateSuspenseListComponent"
Cohesion: 0.18
Nodes (12): findFirstSuspended(), findLastContentRow(), hasSuspenseContext(), initSuspenseListRenderState(), isSuspenseInstancePending(), propagateSuspenseContextChange(), setDefaultShallowSuspenseContext(), setShallowSuspenseContext() (+4 more)

### Community 50 - "setValueForProperty"
Cohesion: 0.20
Nodes (12): getPropertyInfo(), getValueForAttribute(), getValueForProperty(), isAttributeNameSafe(), sanitizeURL(), setInitialDOMProperties(), setValueForProperty(), setValueForStyles() (+4 more)

### Community 51 - "checkAttributeStringCoercion"
Cohesion: 0.38
Nodes (11): checkAttributeStringCoercion(), checkCSSPropertyStringCoercion(), checkFormFieldValueStringCoercion(), checkHtmlStringCoercion(), checkKeyStringCoercion(), checkPropStringCoercion(), coerceRef(), isReactClass() (+3 more)

### Community 52 - "throwException"
Cohesion: 0.20
Nodes (10): attachRetryListener(), enqueueCapturedUpdate(), getNearestSuspenseBoundaryToCapture(), includesSyncLane(), isAlreadyFailedLegacyErrorBoundary(), markDidThrowWhileHydratingDEV(), renderDidError(), resetSuspendedComponent() (+2 more)

### Community 53 - "commitRootImpl"
Cohesion: 0.20
Nodes (10): commitRootImpl(), flushRenderPhaseStrictModeWarningsInDEV(), markCommitStarted(), markCommitStopped(), markLayoutEffectsStarted(), markLayoutEffectsStopped(), markNestedUpdateScheduled(), onCommitRoot() (+2 more)

### Community 54 - "commitPassiveMountEffects_complete"
Cohesion: 0.31
Nodes (9): commitPassiveMountEffects_complete(), commitPassiveMountOnFiber(), commitPassiveUnmountEffects_begin(), commitPassiveUnmountEffects_complete(), commitPassiveUnmountEffectsInsideOfDeletedTree_begin(), commitPassiveUnmountInsideDeletedTreeOnFiber(), commitPassiveUnmountOnFiber(), recordPassiveEffectDuration() (+1 more)

### Community 55 - "warnNonhydratedInstance"
Cohesion: 0.33
Nodes (9): didNotFindHydratableInstance(), didNotFindHydratableInstanceWithinContainer(), didNotFindHydratableInstanceWithinSuspenseInstance(), didNotFindHydratableTextInstance(), didNotFindHydratableTextInstanceWithinContainer(), didNotFindHydratableTextInstanceWithinSuspenseInstance(), warnForInsertedHydratedElement(), warnForInsertedHydratedText() (+1 more)

### Community 56 - "findCurrentHostFiber"
Cohesion: 0.22
Nodes (9): findCurrentHostFiber(), findCurrentHostFiberImpl(), findHostInstanceByFiber(), getCurrentFiberForDevTools(), getLabelForLane(), getLaneLabelMap(), injectInternals(), injectIntoDevTools() (+1 more)

### Community 57 - "flushPassiveEffectsImpl"
Cohesion: 0.29
Nodes (7): commitPassiveMountEffects(), commitPassiveMountEffects_begin(), commitPassiveUnmountEffects(), flushPassiveEffectsImpl(), markPassiveEffectsStarted(), markPassiveEffectsStopped(), onPostCommitRoot()

### Community 58 - "warnUnhydratedInstance"
Cohesion: 0.60
Nodes (6): didNotHydrateInstance(), didNotHydrateInstanceWithinContainer(), didNotHydrateInstanceWithinSuspenseInstance(), warnForDeletedHydratableElement(), warnForDeletedHydratableText(), warnUnhydratedInstance()

### Community 59 - "completeDehydratedSuspenseBoundary"
Cohesion: 0.40
Nodes (5): bubbleProperties(), completeDehydratedSuspenseBoundary(), hasUnhydratedTailNodes(), queueRecoverableErrors(), upgradeHydrationErrorsToRecoverable()

### Community 60 - "retryTimedOutBoundary"
Cohesion: 0.40
Nodes (5): claimNextRetryLane(), requestRetryLane(), resolveRetryWakeable(), retryDehydratedSuspenseBoundary(), retryTimedOutBoundary()

### Community 61 - "forceStoreRerender"
Cohesion: 0.67
Nodes (4): checkIfSnapshotChanged(), forceStoreRerender(), subscribeToStore(), updateStoreInstance()

### Community 62 - "recursivelyTraverseMutationEffects"
Cohesion: 0.50
Nodes (4): commitDeletionEffects(), detachFiberMutation(), getCurrentFiber(), recursivelyTraverseMutationEffects()

### Community 63 - "pushHostContext"
Cohesion: 0.50
Nodes (4): getHostContext(), getRootHostContainer(), pushHostContext(), requiredContext()

## Knowledge Gaps
- **104 isolated node(s):** `AIChatbotButtonProps`, `Bounds`, `Side`, `AIChatbotPanelProps`, `BottomSheetProps` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `"node_modules/react-dom/cjs/react-dom.development.js"()` connect `"node_modules/react-dom/cjs/react-dom.development.js"` to `beginWork`, `push`, `ChildReconciler`, `mountWorkInProgressHook`, `updateDehydratedSuspenseComponent`, `diffHydratedProperties`, `createElement`, `error`, `restoreSelection`, `createRoot`, `findInstanceBlockingEvent`, `completeWork`, `captureCommitPhaseError`, `renderRootConcurrent`, `updateWorkInProgressHook`, `flushPassiveEffects`, `commitDeletionEffectsOnFiber`, `react-dom_client.js`, `getComponentNameFromFiber`, `dispatchEventForPluginEventSystem`, `popHydrationState`, `toString`, `extractEvents$4`, `constructSelectEvent`, `createClassErrorUpdate`, `dispatchSetState`, `getInstIfValueChanged`, `dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay`, `commitPlacement`, `scheduleUpdateOnFiber`, `describeNativeComponentFrame`, `performConcurrentWorkOnRoot`, `commitMutationEffectsOnFiber`, `commitLayoutEffectOnFiber`, `ensureRootIsScheduled`, `finishConcurrentRender`, `mergeLanes`, `updateSuspenseListComponent`, `setValueForProperty`, `checkAttributeStringCoercion`, `throwException`, `commitRootImpl`, `commitPassiveMountEffects_complete`, `warnNonhydratedInstance`, `findCurrentHostFiber`, `flushPassiveEffectsImpl`, `warnUnhydratedInstance`, `completeDehydratedSuspenseBoundary`, `retryTimedOutBoundary`, `forceStoreRerender`, `recursivelyTraverseMutationEffects`, `pushHostContext`?**
  _High betweenness centrality (0.604) - this node is a cross-community bridge._
- **Why does `"node_modules/react/cjs/react.development.js"()` connect `"node_modules/react/cjs/react.development.js"` to `react-dom_client.js`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `renderWithHooks()` connect `beginWork` to `"node_modules/react-dom/cjs/react-dom.development.js"`, `"node_modules/react/cjs/react.development.js"`, `error`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `"node_modules/react-dom/cjs/react-dom.development.js"()` (e.g. with `attemptContinuousHydration$1()` and `attemptHydrationAtCurrentPriority$1()`) actually correct?**
  _`"node_modules/react-dom/cjs/react-dom.development.js"()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `"node_modules/react/cjs/react.development.js"()` (e.g. with `countChildren()` and `forEachChildren()`) actually correct?**
  _`"node_modules/react/cjs/react.development.js"()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AIChatbotButtonProps`, `Bounds`, `Side` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `beginWork` be split into smaller, more focused modules?**
  _Cohesion score 0.06007480130902291 - nodes in this community are weakly interconnected._