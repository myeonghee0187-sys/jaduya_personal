import { icon } from '../../lib/asset';

export type ServiceKind = 'netflix' | 'youtube' | 'disney';

interface ServiceChipsProps {
  services: ServiceKind[];
  more?: number;
}

/** 위젯 공통 "연결된 서비스" 배지 로우 — 고정지출처럼 구독/서비스 목록을 보여줘야 하는
 * 위젯이 재사용하는 슬롯이다(스펙 32의 공통 Image Slot 성격). 위젯마다 배지 크기·간격을
 * 새로 만들지 않고 이 컴포넌트 하나로 통일한다. */
export function ServiceChips({ services, more }: ServiceChipsProps) {
  return (
    <span className="wcard__services">
      {services.map((s) => (
        <span key={s} className={`wcard__service wcard__service--${s}`}>
          {s === 'netflix' && 'N'}
          {s === 'disney' && 'D+'}
          {s === 'youtube' && <img src={icon('chip-youtube.svg')} alt="" />}
        </span>
      ))}
      {more ? <span className="wcard__service-more">+{more}</span> : null}
    </span>
  );
}
