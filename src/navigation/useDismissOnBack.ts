import { useEffect, useRef } from 'react';
import { useAppNavigation } from './AppNavigation';
import { useOverlayBack } from './OverlayBack';
import type { OverlayGuard } from './OverlayBack';

/** 모달/바텀시트/GNB 패널이 열려 있는 동안 뒤로가기 한 단계를 가져간다 — Android 시스템
 * 뒤로가기(또는 브라우저 뒤로가기)가 오면 화면을 벗어나기 전에 이 오버레이부터 닫는다.
 *
 * onClose 는 그대로 두면 된다 — 딤 클릭·X 버튼처럼 기존에 직접 부르던 자리는 손대지
 * 않아도 된다. open 이 true→false 로 바뀔 때 이미 뒤로가기로 닫힌 것인지 스스로 판단해서,
 * 아니라면(직접 닫은 것이라면) 쌓아 둔 history 항목을 마저 정리한다. */
export function useDismissOnBack(open: boolean, onClose: () => void, suspended = false) {
  const page = useAppNavigation();
  const navigation = useOverlayBack();
  const active = page?.active ?? true;
  /* 페이지가 잠시 숨겨져도 열린 overlay의 guard를 유지한다.
   * POP으로 돌아왔을 때 같은 history 항목을 중복해서 쌓지 않는다. */
  const navRef = useRef(navigation);
  navRef.current = navigation;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const guardRef = useRef<OverlayGuard | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    return () => {
      if (guardRef.current) nav?.release(guardRef.current);
      guardRef.current = null;
    };
  }, [open]);
  // A cancelled exit confirmation leaves the writer open after its POP was
  // consumed. Re-arm it once the confirmation's history entry has gone.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !open || !active || suspended || !nav.canPush()) return;
    if (!guardRef.current || guardRef.current.consumed) {
      guardRef.current = nav.push(() => onCloseRef.current());
    }
  });
}
