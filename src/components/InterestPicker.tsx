import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { INTEREST_CATEGORIES, INTEREST_TOPICS } from '../data/livingProfile';
import type { InterestCategory } from '../data/livingProfile';
import { icon } from '../lib/asset';

/* 맞춤 추천 설정의 "관심 주제" 선택 영역 — 홈 시트(HomeRecommendSettings.tsx)와
 * 마이페이지 자취 프로필(pages/ProfileSettingsPage.tsx) 두 곳에서 공유한다.
 *
 * 관심 분야(6개)는 더 이상 사용자가 고르고 저장하는 값이 아니다 — 관심 주제를
 * 탐색하기 위한 탭일 뿐이다. 그래서:
 * - 6개 분야를 항상 모두 보여주는 가로 스크롤 탭으로 그린다(1~2개만 고르는 그리드가
 *   아니다).
 * - 탭 전환은 어느 분야의 주제를 보여줄지만 바꾸고, 저장되는 값에는 영향이 없다
 *   (activeTab 은 이 컴포넌트 안에서만 쓰는 화면 전용 state 다).
 * - 실제로 저장되는 값은 topics(분야별 관심 주제) 뿐이다. 분야를 넘나들어도 각
 *   분야의 선택은 독립적으로 유지된다 — 저장/조회는 항상 이 컴포넌트 밖(부모)에서
 *   전체 topics 를 그대로 들고 있다가 한 번에 저장한다.
 * - 제목 옆 개수 배지는 지금 탭의 개수가 아니라 모든 분야를 합친 전체 선택 개수다.
 */

export interface InterestPickerProps {
  /** 분야별 관심 주제 선택값 — 6개 분야 전체를 담고 있다(고르지 않은 분야는 빈 배열) */
  topics: Record<InterestCategory, string[]>;
  /** 특정 분야의 관심 주제 하나를 토글한다 */
  onToggleTopic: (category: InterestCategory, topic: string) => void;
  /** 분야 탭은 그대로 두고 모든 주제 선택만 해제한다 */
  onClearAll: () => void;
}

export function InterestPicker({ topics, onToggleTopic, onClearAll }: InterestPickerProps) {
  /* 지금 보여줄 분야 탭 — 저장 대상이 아닌 화면 전용 상태다. 기본은 첫 분야(생활). */
  const [activeTab, setActiveTab] = useState<InterestCategory>(INTEREST_CATEGORIES[0]);
  const [draggingTabs, setDraggingTabs] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabDragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const suppressTabClickUntilRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const targetScrollLeftRef = useRef(0);

  const totalSelected = INTEREST_CATEGORIES.reduce((sum, category) => sum + topics[category].length, 0);
  const activeTopics = topics[activeTab] ?? [];

  const cancelScrollAnimation = () => {
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
    if (inertiaFrameRef.current !== null) window.cancelAnimationFrame(inertiaFrameRef.current);
    scrollFrameRef.current = null;
    inertiaFrameRef.current = null;
  };

  useEffect(() => cancelScrollAnimation, []);

  const onTabsPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    cancelScrollAnimation();
    const now = window.performance.now();
    tabDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      lastX: event.clientX,
      lastTime: now,
      velocity: 0,
      moved: false,
    };
    targetScrollLeftRef.current = event.currentTarget.scrollLeft;
  };

  const onTabsPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = tabDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraggingTabs(true);
    }
    const now = window.performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.velocity = -(event.clientX - drag.lastX) / elapsed;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    suppressTabClickUntilRef.current = window.performance.now() + 250;
    targetScrollLeftRef.current = drag.scrollLeft - delta * 1.08;
    if (scrollFrameRef.current === null) {
      const tabs = event.currentTarget;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        tabs.scrollLeft = targetScrollLeftRef.current;
        scrollFrameRef.current = null;
      });
    }
  };

  const endTabsDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = tabDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    tabDragRef.current = null;
    setDraggingTabs(false);
    if (!drag.moved) return;

    const tabs = event.currentTarget;
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
      tabs.scrollLeft = targetScrollLeftRef.current;
    }
    let velocity = Math.max(-0.6, Math.min(0.6, drag.velocity));
    let previousTime = window.performance.now();
    let travelled = 0;
    const startedAt = previousTime;
    const glide = (time: number) => {
      const elapsed = Math.min(32, time - previousTime);
      previousTime = time;
      const step = velocity * elapsed;
      const remaining = Math.max(0, 70 - Math.abs(travelled));
      const limitedStep = Math.sign(step) * Math.min(Math.abs(step), remaining);
      tabs.scrollLeft += limitedStep;
      travelled += limitedStep;
      velocity *= Math.pow(0.78, elapsed / 16.67);
      if (time - startedAt < 220 && Math.abs(velocity) > 0.02 && Math.abs(travelled) < 70) {
        inertiaFrameRef.current = window.requestAnimationFrame(glide);
      } else {
        inertiaFrameRef.current = null;
      }
    };
    inertiaFrameRef.current = window.requestAnimationFrame(glide);
  };

  const blockClickAfterDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (window.performance.now() >= suppressTabClickUntilRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressTabClickUntilRef.current = 0;
  };

  const selectTab = (category: InterestCategory, button: HTMLButtonElement) => {
    setActiveTab(category);
    const tabs = tabsRef.current;
    if (!tabs) return;
    const tabRect = button.getBoundingClientRect();
    const containerRect = tabs.getBoundingClientRect();
    if (tabRect.left < containerRect.left) {
      tabs.scrollTo({ left: tabs.scrollLeft - (containerRect.left - tabRect.left), behavior: 'smooth' });
    } else if (tabRect.right > containerRect.right) {
      tabs.scrollTo({ left: tabs.scrollLeft + (tabRect.right - containerRect.right), behavior: 'smooth' });
    }
  };

  return (
    <div className="profile-settings__field recommend-setup__topics">
      <div className="profile-settings__topic-head">
        <h3>
          관심 주제
          <em className="profile-settings__pick-hint">· {totalSelected}개 선택</em>
        </h3>
        <button
          type="button"
          className="profile-settings__clear-topics"
          disabled={totalSelected === 0}
          onClick={onClearAll}
        >
          전체 해제
        </button>
      </div>
      <p>홈에서 보고 싶은 정보를 선택해주세요.</p>
      <div
        ref={tabsRef}
        className={`profile-settings__field-tabs${draggingTabs ? ' is-dragging' : ''}`}
        role="tablist"
        aria-label="관심 분야"
        onPointerDown={onTabsPointerDown}
        onPointerMove={onTabsPointerMove}
        onPointerUp={endTabsDrag}
        onPointerCancel={endTabsDrag}
        onClickCapture={blockClickAfterDrag}
      >
        {INTEREST_CATEGORIES.map((category) => {
          const selectedCount = topics[category]?.length ?? 0;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              className="profile-settings__field-tab"
              data-has-selection={selectedCount > 0}
              aria-selected={category === activeTab}
              aria-label={`${category}${selectedCount > 0 ? `, ${selectedCount}개 선택` : ''}`}
              onClick={(event) => selectTab(category, event.currentTarget)}
            >
              <span>{category}</span>
              {selectedCount > 0 && (
                <span className="profile-settings__field-tab-count" aria-hidden="true">
                  {selectedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 탭을 넘기면(분야를 바꾸면) 내용만 갈아끼운다 — key 를 분야로 두어 바뀔 때마다
        * 등장 효과가 다시 재생된다. */}
      <div key={activeTab} className="profile-settings__grid profile-settings__grid--2">
        {INTEREST_TOPICS[activeTab].map((topic) => {
          const selected = activeTopics.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              className="profile-settings__topic"
              aria-pressed={selected}
              onClick={() => onToggleTopic(activeTab, topic)}
            >
              <span>{topic}</span>
              <img src={icon(selected ? 'tag-remove.svg' : 'tag-add.svg')} alt="" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default InterestPicker;
