import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { HeaderIconButton } from './HeaderIconButton';
import { StatusBar } from './StatusBar';
import { icon } from '../lib/asset';
import { useAppNavigation } from '../navigation/AppNavigation';

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
}

export function SubPageHeader({
  title,
  backLabel,
  onBack,
  onClose,
  closeLabel = '닫기',
  children,
}: SubPageHeaderProps) {
  const navigation = useAppNavigation();
  /* 이 화면이 떠 있는 동안 `<` 버튼이 하는 일을 시스템 뒤로가기의 동작으로도 등록해 둔다 —
   * Android 시스템 뒤로가기가 와도 이 onBack 이 그대로 불려서 결과가 통일된다.
   * 등록/해제를 같은 effect 안에 짝으로 둬야 한다 — 커밋 후 곧바로 등록만 렌더 본문에서
   * 해 두면, 개발 모드 StrictMode 가 마운트를 검증하려고 이 effect 를 한 번 더 껐다 켜는
   * 과정에서(정리만 실행되고 등록은 다시 실행되지 않아) 방금 써 둔 값이 사라져 버린다.
   * token 은 이 SubPageHeader 인스턴스 고유값이다 — 다음 화면이 먼저 등록을 마친 뒤에
   * 이 화면의 정리가 실행돼도, 자기 token 일 때만 지우므로 다음 화면 값을 실수로
   * 덮어쓰지 않는다. */
  const tokenRef = useRef<symbol>();
  if (!tokenRef.current) tokenRef.current = Symbol('routeBack');
  useLayoutEffect(() => {
    const token = tokenRef.current!;
    navigation?.registerRouteBack(token, onBack);
    return () => navigation?.unregisterRouteBack(token);
  }, [navigation, onBack]);
  return (
    <header className="page-header">
      <StatusBar />
      <div className="page-header__nav">
        <button type="button" className="page-header__back" aria-label={backLabel} onClick={onBack}>
          <img src={icon('gnb-back.svg')} alt="" />
        </button>
        <h1>{title}</h1>
        {children && <div className="page-header__extra">{children}</div>}
        <div className="header-actions">
          <HeaderIconButton iconName="bell" label="알림" />
          {onClose && (
            /* 공용 HeaderIconButton 은 알림 종 전용이라(글쓰기 패널과 같은 이유로)
             * 여기서만 따로 그린다 — 크기·자리는 같은 header-icon-button 클래스를 쓴다. */
            <button type="button" className="header-icon-button" aria-label={closeLabel} onClick={onClose}>
              <img src={icon('gnb-close.svg')} alt="" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default SubPageHeader;
