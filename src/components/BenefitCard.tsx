import type { BenefitCategory, BenefitListItem } from '../data/benefits';

/* 혜택·복지 전체 / 주거 / 생활비 / 반려동물 / 의료 탭이 공유하는 카드 —
 * 신청방법 칩, 제목 옆 바로 신청, 대상 요약 한 줄로 구성.
 * '온라인신청'은 이 앱의 신청 흐름(신청하러 가기)이 전부 온라인이라 고정값으로 둔다.
 * showCategory 는 전체 탭에서만 켜서 어느 카테고리 항목인지 왼쪽에 같이 보여준다.
 * 카테고리별 배지 색은 지정된 브랜드 토큰 중에서 임의로 배정했다. */
const CATEGORY_TAG_CLASS: Partial<Record<BenefitCategory, string>> = {
  주거: 'benefit-card__tag--housing',
  생활비: 'benefit-card__tag--cost',
  반려동물: 'benefit-card__tag--pet',
  의료: 'benefit-card__tag--medical',
};

interface BenefitCardProps {
  item: BenefitListItem;
  showCategory?: boolean;
}

export function BenefitCard({ item, showCategory = false }: BenefitCardProps) {
  return (
    <article className="benefit-card">
      <div className="benefit-card__tags">
        {showCategory && (
          <span className={`benefit-card__tag ${CATEGORY_TAG_CLASS[item.category] ?? ''}`}>
            {item.category}
          </span>
        )}
        <span className="benefit-card__tag benefit-card__tag--method">온라인신청</span>
      </div>

      <div className="benefit-card__row">
        <h3>{item.title}</h3>
        <button type="button" className="benefit-card__apply">바로 신청</button>
      </div>

      <p className="benefit-card__target">{item.target}</p>
    </article>
  );
}

export default BenefitCard;
