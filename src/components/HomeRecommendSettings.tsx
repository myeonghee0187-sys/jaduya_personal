import { useState } from 'react';
import { INTEREST_CATEGORIES, INTEREST_TOPICS } from '../data/livingProfile';
import type { InterestCategory } from '../data/livingProfile';
import { icon } from '../lib/asset';

/* 홈 시트 안에서 열리는 '맞춤 추천 설정' View.
 *
 * 새 시트를 띄우지 않고 기존 시트 콘텐츠만 이 화면으로 갈아끼운다.
 * 선택 UI·규칙은 마이페이지 자취 프로필(pages/ProfileSettingsPage.tsx)의
 * ② 맞춤 추천 설정과 똑같이 맞춘다 — 분야 목록과 분야별 주제는 그쪽과 같은
 * 원본(data/livingProfile.ts)을 그대로 import 해서 쓴다(복사본을 만들지 않는다).
 * 저장 대상만 다르다: 그쪽 전역 데이터가 아니라 홈이 들고 있는 임시 state 다 —
 * 두 화면을 공용 데이터로 묶는 일은 다음 작업에서 한다. */

export interface RecommendDraft {
  /** 관심 분야 — 단일 선택. 아직 고르지 않았으면 null */
  category: InterestCategory | null;
  /** 분야별 관심 주제 — 분야를 오갔다 와도 각자 남는다(복수 선택) */
  topics: Record<InterestCategory, string[]>;
}

/** 아직 아무것도 고르지 않은 상태 — 분야 목록은 원본에서 그대로 가져온다 */
export function emptyRecommendDraft(): RecommendDraft {
  return {
    category: null,
    topics: Object.fromEntries(
      INTEREST_CATEGORIES.map((category) => [category, [] as string[]]),
    ) as Record<InterestCategory, string[]>,
  };
}

interface HomeRecommendSettingsProps {
  /** 지금까지 저장된 임시 선택값 — 다시 들어왔을 때 그대로 보여준다 */
  value: RecommendDraft;
  /** ← 뒤로가기 — 고친 값을 넘기지 않고 이전 View 로 돌아간다 */
  onBack: () => void;
  /** 설정 저장하기 — 고른 값을 넘기고 이전 View 로 돌아간다 */
  onSave: (draft: RecommendDraft) => void;
}

export function HomeRecommendSettings({ value, onBack, onSave }: HomeRecommendSettingsProps) {
  /* 편집 중인 값은 여기서만 들고 있다 — 뒤로가기로 나가면 그대로 버려지고,
   * 저장했을 때만 onSave 로 부모에게 넘어간다. */
  const [draft, setDraft] = useState<RecommendDraft>(value);

  const active = draft.category;
  const activeTopics = active ? (draft.topics[active] ?? []) : [];

  /* 관심 분야는 단일 선택이다 — 새로 고르면 이전 선택이 바로 풀린다.
   * 다만 같은 값을 다시 눌러도 해제하지 않는다: 한 번 고른 뒤에는 항상 하나가 선택된
   * 상태를 유지하고, 아래 관심 주제가 사라졌다 나타나지 않게 한다.
   * (마이페이지 selectCategory 와 같은 규칙) */
  const selectCategory = (category: InterestCategory) =>
    setDraft((prev) => (prev.category === category ? prev : { ...prev, category }));

  /* 주제는 분야별로 따로 담기므로 분야를 오갔다 와도 선택이 남는다(분야와 달리 복수 선택).
   * (마이페이지 toggleTopic 과 같은 규칙) */
  const toggleTopic = (category: InterestCategory, topic: string) =>
    setDraft((prev) => {
      const current = prev.topics[category] ?? [];
      return {
        ...prev,
        topics: {
          ...prev.topics,
          [category]: current.includes(topic)
            ? current.filter((item) => item !== topic)
            : [...current, topic],
        },
      };
    });

  return (
    <section className="sheet-view sheet-view--recommend" aria-labelledby="home-recommend-title">
      <header className="recommend-setup__top">
        {/* 페이지 이동이 아니라 시트 안에서 이전 View 로 돌아가는 버튼이다 */}
        <button
          type="button"
          className="recommend-setup__back"
          aria-label="자두가 알려드려요로 돌아가기"
          onClick={onBack}
        >
          <img src={icon('gnb-back.svg')} alt="" />
        </button>
        <h2 id="home-recommend-title">맞춤 추천 설정</h2>
      </header>

      <p className="recommend-setup__lead">관심사에 맞춰 홈에서 정보를 추천해드려요.</p>

      <div className="profile-settings__field">
        {/* 단일 선택 영역이라는 걸 제목 옆 보조 텍스트로 알린다 — 마이페이지와 같은 규칙 */}
        <h3>
          관심 분야
          <em className="profile-settings__pick-hint">1개 선택</em>
        </h3>
        <p>홈에서 보고 싶은 분야를 하나 선택해주세요.</p>
        <div className="profile-settings__grid profile-settings__grid--3">
          {INTEREST_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className="profile-settings__choice profile-settings__choice--category"
              aria-pressed={category === active}
              onClick={() => selectCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 분야를 골라야 관심 주제가 나온다. 분야를 바꾸면 영역은 그대로 두고 내용만 갈아끼운다 —
       * key 를 분야로 두어 바뀔 때마다 등장 효과가 다시 한 번 재생된다. */}
      {active && (
        <div key={active} className="profile-settings__field recommend-setup__topics">
          <h3>관심 주제</h3>
          <p>원하는 주제를 선택해주세요.</p>
          <div className="profile-settings__grid profile-settings__grid--2">
            {INTEREST_TOPICS[active].map((topic) => {
              const selected = activeTopics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  className="profile-settings__topic"
                  aria-pressed={selected}
                  onClick={() => toggleTopic(active, topic)}
                >
                  <span>{topic}</span>
                  <img src={icon(selected ? 'tag-remove.svg' : 'tag-add.svg')} alt="" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="profile-settings__note">
        <img src={icon('info-warn.svg')} alt="" />
        <div>
          <strong>선택한 분야는 더 자주 추천되며, 다른 콘텐츠도 계속 볼 수 있어요.</strong>
          <p>설정은 마이페이지에서 언제든지 수정할 수 있습니다.</p>
        </div>
      </div>

      {/* 시트 안에서는 하단에 고정하지 않는다 — 시트 스크롤 끝에 두어야
       * 탭바·AI 챗봇 FAB 와 겹치지 않고 시트의 스크롤 구조도 그대로 유지된다.
       * 관심 주제는 마이페이지와 같이 0개여도 저장할 수 있다(주제에는 검증이 없다). */}
      <button
        type="button"
        className="profile-settings__save recommend-setup__save"
        disabled={active === null}
        onClick={() => active !== null && onSave(draft)}
      >
        설정 저장하기
      </button>
    </section>
  );
}

export default HomeRecommendSettings;
