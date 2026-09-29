import { useEffect, useRef, useState } from 'react';
import type { HomeTimeOverride } from '../lib/homeTimeBackground';

interface HomeTimePreviewProps {
  value: HomeTimeOverride;
  onChange: (value: HomeTimeOverride) => void;
}

const TIME_OPTIONS: readonly { value: HomeTimeOverride; label: string }[] = [
  { value: 'auto', label: '자동' },
  { value: 'dawn', label: '새벽' },
  { value: 'morning', label: '아침' },
  { value: 'day', label: '낮' },
  { value: 'afternoon', label: '일몰' },
  { value: 'night', label: '밤' },
];

export function HomeTimePreview({ value, onChange }: HomeTimePreviewProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const selectTime = (next: HomeTimeOverride) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className={`home-time-preview${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="header-icon-button home-time-preview__trigger"
        aria-label="시간대 미리보기"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg className="home-time-preview__clock" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 7.5v4.9l3.2 1.9" />
        </svg>
      </button>

      {open && (
        <div className="home-time-preview__popover" role="menu" aria-label="시간대 미리보기 선택">
          <p className="home-time-preview__title">시간대 미리보기</p>
          <div className="home-time-preview__options">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={value === option.value}
                className={`home-time-preview__option${value === option.value ? ' is-selected' : ''}`}
                onClick={() => selectTime(option.value)}
              >
                <span>{option.label}</span>
                <span className="home-time-preview__check" aria-hidden="true">✓</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
