import { useId } from 'react';
import type { CSSProperties, RefObject, TransitionEventHandler } from 'react';
import { BottomSheet } from '../BottomSheet';
import { icon } from '../../lib/asset';
import { WidgetCategoryFilter } from './WidgetCategoryFilter';
import type { CategoryFilter } from './WidgetCategoryFilter';
import { WidgetListCard } from './WidgetListCard';
import type { WidgetDef } from '../../data/widgetRegistry';

interface WidgetAllSheetProps {
  open: boolean;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  visibleWidgets: readonly WidgetDef[];
  hasMore: boolean;
  onMore: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  listRef: RefObject<HTMLDivElement>;
  listStyle?: CSSProperties;
  onListTransitionEnd?: TransitionEventHandler<HTMLDivElement>;
}

/** "전체 위젯" — 예전엔 "내 위젯" 아래로 이어지는 페이지 섹션이었는데(스크롤 이동), 지금은
 * "+" 를 눌렀을 때 여는 Bottom Sheet 다. 안의 카테고리 필터·목록·더보기는 그대로 옮겨왔다 —
 * 위젯을 고르면 시트를 먼저 닫고(WidgetPreviewModal 자체 dim과 겹치지 않게) 미리보기
 * 모달을 연다(WidgetPage.tsx onSelect). */
export function WidgetAllSheet({
  open,
  category,
  onCategoryChange,
  visibleWidgets,
  hasMore,
  onMore,
  onSelect,
  onClose,
  listRef,
  listStyle,
  onListTransitionEnd,
}: WidgetAllSheetProps) {
  const titleId = useId();

  return (
    <BottomSheet open={open} className="wpg-all-sheet" labelledBy={titleId} onDimClick={onClose}>
      <div className="bsheet__grip">
        <span />
      </div>

      <div className="wpg-all-sheet__header">
        {/* 제목/설명 타이포는 예전 인라인 섹션과 같은 .wpg-all__head 를 그대로 쓴다 —
         * "추천 위젯" 제목(.wpg-recommend__head)과도 공유하는 스타일이라 새로 만들지
         * 않는다. */}
        <div className="wpg-all__head">
          <h2 id={titleId}>전체 위젯</h2>
          <p>자두야의 모든 위젯을 둘러보세요.</p>
        </div>
        <button type="button" className="wpg-all-sheet__close" aria-label="닫기" onClick={onClose}>
          <img src={icon('sheet-close.svg')} alt="" />
        </button>
      </div>

      <div className="wpg-all-sheet__body">
        <WidgetCategoryFilter value={category} onChange={onCategoryChange} />

        {visibleWidgets.length > 0 ? (
          <>
            <div
              className="wpg-all__list"
              ref={listRef}
              style={listStyle}
              onTransitionEnd={onListTransitionEnd}
            >
              {visibleWidgets.map((def) => (
                <WidgetListCard key={def.id} def={def} onSelect={() => onSelect(def.id)} />
              ))}
            </div>
            {hasMore && (
              <button type="button" className="wpg-all__more" onClick={onMore}>
                더보기
                <span aria-hidden="true">▾</span>
              </button>
            )}
          </>
        ) : (
          <p className="wg-empty">해당 카테고리에 위젯이 없어요.</p>
        )}
      </div>
    </BottomSheet>
  );
}

export default WidgetAllSheet;
