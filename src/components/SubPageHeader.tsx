import type { ReactNode } from 'react';
import { HeaderIconButton } from './HeaderIconButton';
import { StatusBar } from './StatusBar';
import { icon } from '../lib/asset';

/* 하위 화면 공용 헤더 — 뒤로가기 + 제목 + 알림 (+ 필요한 화면만 닫기).
 * StatusBar / HeaderIconButton 은 기존 공용 컴포넌트를 그대로 쓴다.
 * Home 의 Header(로고형)와는 역할이 달라 별도로 둔다. */
interface SubPageHeaderProps {
  title: string;
  /** 뒤로가기 목적지 설명 — 스크린리더용 (예: 마이페이지로) */
  backLabel: string;
  onBack: () => void;
  /** 글쓰기 패널과 같은 성격의 화면 전용 — 알림 옆에 X 버튼을 두고 누르면 이 화면을 완전히 닫는다. */
  onClose?: () => void;
  /** X 버튼의 스크린리더용 설명 — 기본값 "닫기" */
  closeLabel?: string;
  /** 제목 오른쪽에 덧붙일 요소가 필요할 때 */
  children?: ReactNode;
  /** 알림 버튼 바로 뒤에 배치할 화면 전용 헤더 액션 */
  actions?: ReactNode;
  /** 커뮤니티 화면처럼 알림 버튼의 기존 위치와 액션 순서를 유지한다. */
  preserveBellPlacement?: boolean;
}

export function SubPageHeader({
  title,
  backLabel,
  onBack,
  onClose,
  closeLabel = '닫기',
  children,
  actions,
  preserveBellPlacement = false,
}: SubPageHeaderProps) {
  const keepBellPlacement = preserveBellPlacement || Boolean(actions);

  return (
    <header className="page-header">
      <StatusBar />
      <div className="page-header__nav">
        <button type="button" className="page-header__back" aria-label={backLabel} onClick={onBack}>
          <img src={icon('gnb-back.svg')} alt="" />
        </button>
        <h1>{title}</h1>
        {children && <div className="page-header__extra">{children}</div>}
        <div className={`header-actions${keepBellPlacement ? '' : ' header-actions--bell-last'}`}>
          {keepBellPlacement ? (
            <>
              <HeaderIconButton iconName="bell" label="알림" />
              {actions}
              {onClose && (
                <button type="button" className="header-icon-button" aria-label={closeLabel} onClick={onClose}>
                  <img src={icon('gnb-close.svg')} alt="" />
                </button>
              )}
            </>
          ) : (
            <>
              {onClose && (
                <button type="button" className="header-icon-button" aria-label={closeLabel} onClick={onClose}>
                  <img src={icon('gnb-close.svg')} alt="" />
                </button>
              )}
              <HeaderIconButton iconName="bell" label="알림" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default SubPageHeader;
