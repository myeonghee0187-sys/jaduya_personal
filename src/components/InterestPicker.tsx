import { useEffect, useState } from 'react';
import {
  INTEREST_CATEGORIES,
  INTEREST_TOPICS,
  MAX_INTEREST_CATEGORIES,
  interestTopicHint,
} from '../data/livingProfile';
import type { InterestCategory } from '../data/livingProfile';
import { icon } from '../lib/asset';

/* 맞춤 추천 설정의 "관심 분야 + 관심 주제" 선택 영역 — 홈 시트(HomeRecommendSettings.tsx)와
 * 마이페이지 자취 프로필(pages/ProfileSettingsPage.tsx) 두 곳에 각각 복붙되어 있던 걸
 * 하나로 합쳤다. 화면의 껍데기(시트 vs 페이지, 안내 문구, 저장 버튼 위치)는 각자 그대로
 * 두고, 이 컴포넌트는 `.profile-settings__field` 두 덩어리(분야 선택 / 주제 선택)만
 * 맡는다.
 *
 * 선택 규칙:
 * - 기본은 분야 1개만 고른다 — 그리드에서 하나를 누르면 바로 확정되고, 그 상태에서는
 *   나머지 5개가 비활성이라 다른 분야로 "바꿔" 고를 수 없다(기존 단일 선택 규칙 그대로).
 *   같은(유일하게 선택된) 분야를 다시 눌러도 해제되지 않는다 — 관심 분야는 항상
 *   최소 1개를 유지해야 한다.
 * - 분야가 1개면 '+ 관심 분야 추가' 버튼이 나타난다. 누르면 나머지 5개가 다시 눌러서
 *   고를 수 있는 상태로 바뀌고(같은 6개 그리드를 그대로 쓴다), 하나를 고르면 두 번째
 *   분야로 확정되며 추가 모드는 자동으로 꺼진다.
 * - 분야가 2개인 상태에서는 그리드가 토글로 바뀐다 — 이미 선택된 두 칩 중 하나를
 *   다시 누르면 그 분야가 바로 해제된다(최소 1개 규칙에 걸리지 않으므로 허용). 해제하면
 *   '+' 버튼이 다시 나타나고, 해제한 분야가 지금 보고 있던 관심 주제 탭이었다면 남은
 *   분야로 자동 전환된다. 제거해도 그 분야에서 고른 주제(topics)는 지우지 않는다 —
 *   나중에 같은 분야를 다시 추가하면 이전 선택이 그대로 돌아온다. 분야 해제는 오직 이
 *   위쪽 그리드에서만 하고, 아래 관심 주제 탭에는 별도 삭제 버튼을 두지 않는다(탭은
 *   순수하게 "지금 어느 분야의 주제를 보고 있는지"만 전환한다).
 * - 분야가 2개가 되면 '+' 버튼은 사라지고, 관심 주제 영역 안에 두 분야를 전환하는
 *   segmented tab(예: [돈 관리] [자취])이 나타난다. 중립 트랙 위에 얹힌 pill 형태라
 *   위쪽 관심 분야 그리드의 선택 칩과는 다른 문법으로 읽히고, active 탭은 옅은
 *   Primary 배경 + `#B43936` 텍스트로 살짝만 강조한다(진하게 채우지 않는다 —
 *   "선택 상태를 또 보여주는 칩"이 아니라 "지금 보고 있는 탭"이라는 위계를 낮게 둔다).
 *   탭 전환은 어느 분야의 주제를 보여줄지만 바꿀 뿐, 저장되는 값에는 영향이 없다.
 * - 분야별 관심 주제 선택 상태(topics)는 항상 분야마다 독립적으로 유지된다.
 */

export interface InterestPickerProps {
  /** 지금까지 고른 관심 분야 — 고른 순서 그대로, 최대 MAX_INTEREST_CATEGORIES(2)개 */
  categories: InterestCategory[];
  /** 분야별 관심 주제 선택값 — 6개 분야 전체를 담고 있다(고르지 않은 분야는 빈 배열) */
  topics: Record<InterestCategory, string[]>;
  /** 그리드에서 아직 고르지 않은 분야를 누르면 호출된다. */
  onSelectCategory: (category: InterestCategory) => void;
  /** 그리드에서 이미 선택된 분야를 다시 눌러 해제할 때 호출된다 — 1개만 남았을 때는
   * 이 컴포넌트가 걸러내고 호출하지 않는다(최소 1개 유지). */
  onRemoveCategory: (category: InterestCategory) => void;
  /** 특정 분야의 관심 주제 하나를 토글한다 */
  onToggleTopic: (category: InterestCategory, topic: string) => void;
}

export function InterestPicker({
  categories,
  topics,
  onSelectCategory,
  onRemoveCategory,
  onToggleTopic,
}: InterestPickerProps) {
  /* '+ 관심 분야 추가'를 누르면 그리드에서 남은 항목도 고를 수 있게 잠깐 열어준다 —
   * 저장값이 아니라 이 컴포넌트 안에서만 쓰는 UI 상태다. */
  const [isAdding, setIsAdding] = useState(false);
  /* 분야가 2개일 때 관심 주제로 보여줄 탭 — 저장 대상이 아닌 화면 전용 상태다. */
  const [activeTab, setActiveTab] = useState<InterestCategory | null>(null);

  const canAddMore = categories.length > 0 && categories.length < MAX_INTEREST_CATEGORIES;
  /* 그리드가 클릭을 받을 수 있는 상태 — 아직 하나도 안 골랐거나(첫 선택), 추가 모드일 때 */
  const gridInteractive = categories.length === 0 || isAdding;

  /* 분야 개수가 바뀌면 추가 모드는 항상 끈다 — 다시 열려면 버튼을 다시 눌러야 한다 */
  useEffect(() => {
    setIsAdding(false);
  }, [categories.length]);

  /* 탭이 가리키는 분야가 사라졌거나 아직 안 정해졌으면 가장 최근에 고른 분야로 맞춘다 */
  useEffect(() => {
    if (categories.length === 0) {
      setActiveTab(null);
      return;
    }
    setActiveTab((prev) => (prev && categories.includes(prev) ? prev : categories[categories.length - 1]));
  }, [categories]);

  /* 분야가 0~1개일 때는 탭이 필요 없다 — 있는 그대로(또는 null)를 보여준다 */
  const active = categories.length <= 1 ? (categories[0] ?? null) : activeTab;
  const activeTopics = active ? (topics[active] ?? []) : [];

  const handleCategoryClick = (category: InterestCategory) => {
    if (categories.includes(category)) {
      /* 이미 고른 분야를 다시 누르면 토글 해제한다 — 다만 최소 1개는 항상 남아야
       * 하므로, 그 하나뿐인 분야를 다시 눌러도 해제되지 않는다(기존 규칙 그대로). */
      if (categories.length > 1) onRemoveCategory(category);
      return;
    }
    if (!gridInteractive) return;
    const wasAdding = categories.length > 0;
    onSelectCategory(category);
    if (wasAdding) {
      setIsAdding(false);
      setActiveTab(category); /* 방금 고른 두 번째 분야의 주제를 바로 보여준다 */
    }
  };

  return (
    <>
      <div className="profile-settings__field">
        <h3>
          관심 분야
          <em className="profile-settings__pick-hint">
            {categories.length === 0
              ? '1개 선택'
              : categories.length === 1
                ? '1개 선택됨'
                : '2개 선택됨'}
          </em>
        </h3>
        <p>홈에서 보고 싶은 분야를 하나 선택해주세요.</p>
        <div className="profile-settings__grid profile-settings__grid--3">
          {INTEREST_CATEGORIES.map((category) => {
            const selected = categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                className="profile-settings__choice profile-settings__choice--category"
                aria-pressed={selected}
                disabled={!selected && !gridInteractive}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
        {canAddMore && !isAdding && (
          <button type="button" className="profile-settings__add-category" onClick={() => setIsAdding(true)}>
            <img src={icon('plus-add.svg')} alt="" />
            관심 분야 추가
          </button>
        )}
      </div>

      {/* 분야를 골라야 관심 주제가 나온다. 분야를 바꾸면(또는 탭을 넘기면) 영역은 그대로 두고
        * 내용만 갈아끼운다 — key 를 분야로 두어 바뀔 때마다 등장 효과가 다시 재생된다. */}
      {active && (
        <div key={active} className="profile-settings__field recommend-setup__topics">
          <h3>관심 주제</h3>
          {categories.length === 2 ? (
            <div className="profile-settings__topic-tabs" role="tablist" aria-label="관심 분야 탭">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  className="profile-settings__topic-tab"
                  aria-selected={category === active}
                  onClick={() => setActiveTab(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : (
            <p>{interestTopicHint(active)}</p>
          )}
          <div className="profile-settings__grid profile-settings__grid--2">
            {INTEREST_TOPICS[active].map((topic) => {
              const selected = activeTopics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  className="profile-settings__topic"
                  aria-pressed={selected}
                  onClick={() => onToggleTopic(active, topic)}
                >
                  <span>{topic}</span>
                  <img src={icon(selected ? 'tag-remove.svg' : 'tag-add.svg')} alt="" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default InterestPicker;
