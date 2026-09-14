import { HeaderIconButton } from './HeaderIconButton';

/** 기존 호출부 호환용 — 실제 렌더링은 공통 HeaderIconButton이 담당한다. */
export function BellButton() {
  return <HeaderIconButton iconName="bell" label="알림" />;
}
