import { icon } from '../../lib/asset';

/* 위젯 헤더 아이콘 — 위젯마다 다른 크기/정렬을 쓰지 않도록 size token 3단계만 허용한다. */
type WidgetIconSize = 'sm' | 'md' | 'lg';

interface WidgetIconProps {
  name: string;
  size?: WidgetIconSize;
}

export function WidgetIcon({ name, size = 'sm' }: WidgetIconProps) {
  return <img className={`wicon wicon--${size}`} src={icon(name)} alt="" aria-hidden="true" />;
}
