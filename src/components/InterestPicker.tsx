import { useState } from 'react';
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
}

export function InterestPicker({ topics, onToggleTopic }: InterestPickerProps) {
  /* 지금 보여줄 분야 탭 — 저장 대상이 아닌 화면 전용 상태다. 기본은 첫 분야(생활). */
  const [activeTab, setActiveTab] = useState<InterestCategory>(INTEREST_CATEGORIES[0]);

  const totalSelected = INTEREST_CATEGORIES.reduce((sum, category) => sum + topics[category].length, 0);
  const activeTopics = topics[activeTab] ?? [];

  return (
    <div className="profile-settings__field recommend-setup__topics">
      <h3>
        관심 주제
        <em className="profile-settings__pick-hint">{totalSelected}개 선택됨</em>
      </h3>
      <p>홈에서 보고 싶은 정보를 선택해주세요.</p>

      <div className="profile-settings__field-tabs" role="tablist" aria-label="관심 분야">
        {INTEREST_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            className="profile-settings__field-tab"
            aria-selected={category === activeTab}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
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
