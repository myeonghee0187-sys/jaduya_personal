import { useEffect, useRef, useState } from 'react';
import { icon } from '../lib/asset';

interface CommunitySearchToggleButtonProps {
  open: boolean;
  controls: string;
  onToggle: () => void;
}

interface CommunitySearchDropdownProps {
  id: string;
  open: boolean;
  value: string;
  placeholder: string;
  label: string;
  onChange: (value: string) => void;
  onClose: () => void;
  recentSearches?: readonly string[];
  popularSearches?: readonly string[];
  onSearch?: (value: string, saveToRecent: boolean) => void;
  onRemoveRecentSearch?: (value: string) => void;
}

/** 커뮤니티 목록 화면에서만 알림 버튼 옆에 놓이는 검색 토글. */
export function CommunitySearchToggleButton({ open, controls, onToggle }: CommunitySearchToggleButtonProps) {
  return (
    <button
      type="button"
      className={`header-icon-button community-search-toggle${open ? ' is-active' : ''}`}
      aria-label={open ? '검색창 닫기' : '검색창 열기'}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      <img src={icon('community-search.svg')} alt="" />
    </button>
  );
}

/** 기존 커뮤니티 검색 기능을 헤더 토글 아래에서 그대로 재사용하는 드롭다운. */
export function CommunitySearchDropdown({
  id,
  open,
  value,
  placeholder,
  label,
  onChange,
  onClose,
  recentSearches,
  popularSearches,
  onSearch,
  onRemoveRecentSearch,
}: CommunitySearchDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;

    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (panelRef.current?.contains(target)) return;
      if (target.closest(`[aria-controls="${id}"]`)) return;
      onClose();
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [id, onClose, open]);

  if (!rendered) return null;

  const submitSearch = (term = value, saveToRecent = true) => {
    const trimmed = term.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onSearch?.(trimmed, saveToRecent);
    inputRef.current?.focus();
  };

  const showSuggestions = recentSearches !== undefined || popularSearches !== undefined;

  return (
    <section
      id={id}
      ref={panelRef}
      className={`community-search community-search--dropdown${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-label={`${label} 입력창`}
    >
      <div className="community-search__input">
        <input
          ref={inputRef}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            submitSearch();
          }}
        />
        {value && (
          <button
            type="button"
            className="community-search__icon"
            aria-label="검색어 지우기"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            <img src={icon('gnb-close.svg')} alt="" />
          </button>
        )}
        <button
          type="button"
          className="community-search__icon"
          aria-label="검색"
          onClick={() => submitSearch()}
        >
          <img src={icon('community-search.svg')} alt="" />
        </button>
      </div>

      {showSuggestions && (
        <div className="community-search__suggestions">
          <div className="community-search__suggestion-group">
            <h2>최근 검색어</h2>
            {recentSearches && recentSearches.length > 0 ? (
              <ul className="community-search__term-list">
                {recentSearches.map((term) => (
                  <li key={term} className="community-search__recent-chip">
                    <button
                      type="button"
                      className="community-search__recent-term"
                      onClick={() => submitSearch(term, false)}
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      className="community-search__recent-remove"
                      aria-label={`${term} 최근 검색어 삭제`}
                      onClick={() => onRemoveRecentSearch?.(term)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="community-search__empty">최근 검색어가 없어요.</p>
            )}
          </div>

          <div className="community-search__suggestion-group">
            <h2>인기 검색어</h2>
            <ol className="community-search__popular-list">
              {(popularSearches ?? []).map((term, index) => (
                <li key={term}>
                  <span>{index + 1}</span>
                  <button type="button" onClick={() => submitSearch(term, false)}>{term}</button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
