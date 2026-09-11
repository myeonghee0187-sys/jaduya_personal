import { icon } from '../../lib/asset';
import type { ServiceLink } from '../../data/homecareGuide';

/** 04 단계 — 외부/사내 서비스로 연결하는 링크 카드. 지금은 목적지가 없어 href="#". */
export function ServiceCard({ title, href }: ServiceLink) {
  return (
    <a className="dc-service-card" href={href}>
      <span className="dc-service-card__title">{title}</span>
      <img
        className="dc-service-card__arrow"
        src={icon('service-card-arrow.svg')}
        alt=""
        width={8}
        height={14}
      />
    </a>
  );
}

export default ServiceCard;
