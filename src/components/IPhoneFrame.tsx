import type { ReactNode } from 'react';

interface IPhoneFrameProps {
  /** 실제 화면 안에 그대로 렌더될 콘텐츠 (Login/Signup 등) — 크기·디자인에 관여하지 않는다 */
  children: ReactNode;
}

/* 실물 iPhone처럼 보이기 위한 순수 프레젠테이션 컴포넌트 (LoginShowcase 전용).
 * 구조를 역할별로 분리한다:
 *   IPhoneFrame        — 실제 px 크기를 갖는 사이징 박스 (그리드/플렉스가 정확히 계산하도록)
 *    ├─ device-shadow  — 기기 아래 깔리는 contact shadow (별도 레이어)
 *    └─ device-body    — 티타늄 프레임 자체 (그라데이션·베젤·하이라이트), 402x874 고정 디자인에
 *        ├─ dynamic-island   zoom 만 걸어 축소 — 바깥 박스와 같은 --phone-scale 을 공유해서
 *        └─ screen            시각적 크기와 레이아웃이 차지하는 크기가 항상 일치한다.
 *            └─ children (Login/Signup) */
export function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="iphone-frame">
      <div className="iphone-frame__shadow" aria-hidden="true" />
      <div className="iphone-frame__device-body">
        <div className="iphone-frame__dynamic-island" aria-hidden="true" />
        <div className="iphone-frame__screen">{children}</div>
      </div>
    </div>
  );
}
