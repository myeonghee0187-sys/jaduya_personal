import type { ReactNode } from 'react';
import { icon } from '../lib/asset';

interface SettingsToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

/** 설정 화면 공용 44×24 switch. 상태는 각 페이지가 소유한다. */
export function SettingsToggle({ checked, label, onChange }: SettingsToggleProps) {
  return (
    <button
      type="button"
      className={`settings-toggle${checked ? ' is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span aria-hidden="true" />
    </button>
  );
}

interface SettingsToggleRowProps extends SettingsToggleProps {
  title: string;
  description: string;
}

/** Figma __settings/toggle_row 대응: 제목·설명·switch가 있는 74px 행. */
export function SettingsToggleRow({
  title,
  description,
  checked,
  label,
  onChange,
}: SettingsToggleRowProps) {
  return (
    <div className="settings-row settings-row--detail settings-row--toggle">
      <span className="settings-row__copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <SettingsToggle checked={checked} label={label} onChange={onChange} />
    </div>
  );
}

interface SettingsNavigationRowProps {
  title: string;
  description?: string;
  value?: ReactNode;
  showChevron?: boolean;
  muted?: boolean;
  className?: string;
  onClick?: () => void;
}

/** Figma __settings/navigation_row 대응: Detail / Simple / Value 행을 한 구조로 공유한다. */
export function SettingsNavigationRow({
  title,
  description,
  value,
  showChevron = true,
  muted = false,
  className = '',
  onClick,
}: SettingsNavigationRowProps) {
  const content = (
    <>
      <span className="settings-row__copy">
        <strong className={muted ? 'is-muted' : undefined}>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      {(value !== undefined || showChevron) && (
        <span className="settings-row__accessory">
          {value !== undefined && <span className="settings-row__value">{value}</span>}
          {showChevron && <img src={icon('chevron-right-thin.svg')} alt="" />}
        </span>
      )}
    </>
  );

  const classes = `settings-row ${description ? 'settings-row--detail' : 'settings-row--simple'}${className ? ` ${className}` : ''}`;

  return onClick ? (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  );
}

