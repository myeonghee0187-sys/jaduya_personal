import { useEffect, useRef } from 'react';
import { useAppNavigation } from './AppNavigation';

/** 모달/바텀시트/GNB 패널이 열려 있는 동안 뒤로가기 한 단계를 가져간다 — Android 시스템
 * 뒤로가기(또는 브라우저 뒤로가기)가 오면 화면을 벗어나기 전에 이 오버레이부터 닫는다.
 *
 * onClose 는 그대로 두면 된다 — 딤 클릭·X 버튼처럼 기존에 직접 부르던 자리는 손대지
 * 않아도 된다. open 이 true→false 로 바뀔 때 이미 뒤로가기로 닫힌 것인지 스스로 판단해서,
 * 아니라면(직접 닫은 것이라면) 쌓아 둔 history 항목을 마저 정리한다. */
export function useDismissOnBack(open: boolean, onClose: () => void) {
  const navigation = useAppNavigation();
  /* navigation 객체는 다른 이유(예: 다른 화면의 route 전환)로도 매번 새로 만들어지므로,
   * 그것 때문에 이 효과가 다시 실행되어 열려 있는 오버레이를 껐다 켜지 않도록 ref 로만
   * 참조한다 — pushBackGuard/releaseBackGuard 는 항상 같은 내부 상태를 가리켜 최신
   * navigation 값을 안 써도 동작은 같다. */
  const navRef = useRef(navigation);
  navRef.current = navigation;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !open) return;
    const guard = nav.pushBackGuard(() => onCloseRef.current());
    return () => nav.releaseBackGuard(guard);
  }, [open]);
}
