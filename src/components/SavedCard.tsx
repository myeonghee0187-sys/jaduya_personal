import { icon, img } from '../lib/asset';
import { SAVED_CHIP_COLOR } from '../data/savedItems';
import type { SavedItem } from '../data/savedItems';

interface SavedCardProps {
  item: SavedItem;
  /** 북마크 상태 — false 면 저장 해제된 항목이다 */
  bookmarked: boolean;
  onToggleBookmark: (id: number) => void;
  onOpen: (item: SavedItem) => void;
}

/* 저장 카드 — Figma saved_list card (1565:6992).
 * 규격은 마이페이지 활동 카드와 같다 (80×80 썸네일 / radius 16). */
export function SavedCard({ item, bookmarked, onToggleBookmark, onOpen }: SavedCardProps) {
  return (
    <article className="saved-card">
      <button type="button" className="saved-card__open" onClick={() => onOpen(item)}>
        {item.thumbnail ? (
          <img className="saved-card__thumb" src={img(`thumb/${item.thumbnail}`)} alt="" />
        ) : (
          /* 썸네일이 없는 항목은 카테고리 아이콘을 같은 80×80 자리에 둔다 */
          <span
            className="saved-card__thumb saved-card__thumb--icon"
            style={{ background: SAVED_CHIP_COLOR[item.category] }}
          >
            <img src={icon(item.icon)} alt="" />
          </span>
        )}
        <span className="saved-card__body">
          <span className="saved-card__chip" style={{ background: SAVED_CHIP_COLOR[item.category] }}>
            {item.category}
          </span>
          <b className="saved-card__title">{item.title}</b>
          <small className="saved-card__desc">{item.description}</small>
          <small className="saved-card__date">{item.savedAt} 저장</small>
        </span>
      </button>
      {/* 북마크는 카드 열기와 별개 동작이라 버튼을 겹치지 않게 따로 둔다 */}
      <button
        type="button"
        className={`saved-card__bookmark${bookmarked ? ' is-on' : ''}`}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? `${item.title} 저장 해제` : `${item.title} 저장`}
        onClick={() => onToggleBookmark(item.id)}
      >
        <i style={{ maskImage: `url(${icon('card-bookmark.svg')})` }} aria-hidden="true" />
      </button>
    </article>
  );
}

export default SavedCard;
