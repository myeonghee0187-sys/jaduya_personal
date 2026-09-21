import { icon } from '../../lib/asset';

interface ServiceCardProps {
  title: string;
  onSelect: () => void;
}

/** 기존 서비스명과 카드 모양을 유지하며 공통 업체 연결 시트를 연다. */
export function ServiceCard({ title, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      className="dc-service-card"
      aria-label={`${title} 연결 정보 보기`}
      aria-haspopup="dialog"
      onClick={onSelect}
    >
      <span className="dc-service-card__title">{title}</span>
      <img className="dc-service-card__arrow" src={icon('service-card-arrow.svg')} alt="" width={17} height={17} />
    </button>
  );
}

export default ServiceCard;
