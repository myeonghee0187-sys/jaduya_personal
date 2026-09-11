interface StepCardProps {
  heading: string;
  /** 설명이 없는 단계도 있어(원문에 없음) 빈 문자열이면 아예 렌더링하지 않는다 */
  body: string;
}

/** 01~03 단계 카드 — 굵은 한 줄(heading) + 보조 설명(body) */
export function StepCard({ heading, body }: StepCardProps) {
  return (
    <div className="dc-step-card">
      <p className="dc-step-card__heading">{heading}</p>
      {body && (
        <div className="dc-step-card__body">
          <p>{body}</p>
        </div>
      )}
    </div>
  );
}

export default StepCard;
