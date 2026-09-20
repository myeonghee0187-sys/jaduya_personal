import { clearInterestTopics, INTEREST_CATEGORIES, toggleInterestTopic } from '../data/livingProfile';
import type { InterestCategory } from '../data/livingProfile';
import { InterestPicker } from './InterestPicker';
import { RecommendInfoAccordion } from './RecommendInfoAccordion';
import { icon } from '../lib/asset';

/* 홈 시트 안에서 열리는 '맞춤 추천 설정' View.
 *
 * 새 시트를 띄우지 않고 기존 시트 콘텐츠만 이 화면으로 갈아끼운다.
 * 관심 주제 선택 UI/로직은 마이페이지 자취 프로필(pages/ProfileSettingsPage.tsx)과
 * 완전히 같은 컴포넌트(InterestPicker)를 그대로 쓴다(복사본을 만들지 않는다) —
 * 분야 목록과 분야별 주제 데이터도 같은 원본(data/livingProfile.ts)에서 온다.
 * 저장 대상만 다르다: 그쪽 전역 데이터가 아니라 홈이 들고 있는 임시 state 다. */

export interface RecommendDraft {
  /** 분야별 관심 주제 — 분야를 오갔다 와도 각자 남는다(복수 선택). 관심 분야 자체는
   * 저장 대상이 아니다(관심 주제를 탐색하는 탭일 뿐). */
  topics: Record<InterestCategory, string[]>;
}

/** 아직 아무것도 고르지 않은 상태 — 분야 목록은 원본에서 그대로 가져온다 */
export function emptyRecommendDraft(): RecommendDraft {
  return {
    topics: Object.fromEntries(
      INTEREST_CATEGORIES.map((category) => [category, [] as string[]]),
    ) as Record<InterestCategory, string[]>,
  };
}

interface HomeRecommendSettingsProps {
  /** 지금까지 저장된 임시 선택값 — 다시 들어왔을 때 그대로 보여준다 */
  value: RecommendDraft;
  /** 설정 overlay만 닫는다 */
  onClose: () => void;
  /** 설정 저장하기 — 고른 값을 넘기고 이전 View 로 돌아간다 */
  onSave: (draft: RecommendDraft) => void;
  /** 저장 전 선택값도 패널을 닫았다 다시 열 때 유지한다 */
  onChange: (draft: RecommendDraft) => void;
}

export function HomeRecommendSettings({ value, onClose, onSave, onChange }: HomeRecommendSettingsProps) {
  /* 관심 주제를 고르는 로직은 InterestPicker(선택 UI) 와 짝을 이루는 data/livingProfile.ts
   * 의 공용 헬퍼를 그대로 쓴다 — 마이페이지(ProfileSettingsPage)와 같은 함수라 복붙된
   * 로직이 따로 없다. */
  const toggleTopic = (category: InterestCategory, topic: string) =>
    onChange({ ...value, topics: toggleInterestTopic(value.topics, category, topic) });

  return (
    <section className="sheet-view sheet-view--recommend" aria-labelledby="home-recommend-title">
      <header className="recommend-setup__top">
        <h2 id="home-recommend-title">맞춤 추천 설정</h2>
        <button
          type="button"
          className="recommend-setup__close"
          aria-label="맞춤 추천 설정 닫기"
          onClick={onClose}
        >
          <img src={icon('gnb-close.svg')} alt="" />
        </button>
      </header>

      <InterestPicker
        topics={value.topics}
        onToggleTopic={toggleTopic}
        onClearAll={() => onChange({ ...value, topics: clearInterestTopics() })}
      />

      <RecommendInfoAccordion />

      {/* 시트 안에서는 기본적으로 하단에 고정하지 않는다 — 콘텐츠가 짧으면 스크롤 끝에
       * 자연스럽게 놓여 탭바·AI 챗봇 FAB 와 겹치지 않는다. 다만 안내를 접어도 주제를 많이
       * 고른 경우처럼 콘텐츠가 길어지면 sticky 로 하단에 붙여 계속 보이게 한다
       * (.recommend-setup__save, home.css) — 콘텐츠가 짧을 때는 sticky 가 아무 효과도
       * 내지 않으므로 별도 분기 없이 이 한 규칙으로 "그때만" 처리된다. 관심 주제는
       * 0개여도 저장할 수 있다(주제에는 검증이 없다 — 분야 선택 요건도 더 이상 없다). */}
      <button
        type="button"
        className="profile-settings__save recommend-setup__save"
        onClick={() => onSave(value)}
      >
        설정 저장하기
      </button>
    </section>
  );
}

export default HomeRecommendSettings;
