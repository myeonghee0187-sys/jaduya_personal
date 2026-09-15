import { useEffect, useState } from 'react';
import { icon } from '../lib/asset';

/** 펼친 상태로 머무는 시간 — 이 뒤에 아이콘만 남게 접힌다 */
const EXPANDED_MS = 1800;

interface CommunityWriteFabProps {
  onClick: () => void;
}

/* 커뮤니티 글쓰기 버튼 — 들어오면 '연필 + 글쓰기' 로 보였다가 잠시 뒤 아이콘만 남긴다.
 *
 * 접히는 건 글자 쪽 폭이라 버튼의 오른쪽 끝(right)은 그대로 있고 왼쪽만 당겨진다.
 * 화면에 처음 붙을 때 한 번만 타이머를 걸어, 리렌더가 일어나도 다시 펼쳐지지 않는다.
 * (커뮤니티 화면을 새로 열면 컴포넌트가 다시 마운트되므로 그때 다시 실행된다) */
export function CommunityWriteFab({ onClick }: CommunityWriteFabProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    /* 모션을 줄이는 설정에서는 오래 붙잡아 두지 않고 곧바로 접는다 */
    const timer = window.setTimeout(() => setExpanded(false), reduceMotion ? 0 : EXPANDED_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="community-fab">
      <button
        type="button"
        className={`community-fab__button${expanded ? ' is-expanded' : ''}`}
        aria-label="글쓰기"
        onClick={onClick}
      >
        <img src={icon('community-pencil.svg')} alt="" />
        {/* 글자는 지우지 않고 폭과 투명도만 줄인다 — display:none 으로 끊기면 튄다 */}
        <span className="community-fab__label">글쓰기</span>
      </button>
    </div>
  );
}

export default CommunityWriteFab;
