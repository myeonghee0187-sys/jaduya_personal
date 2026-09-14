/* 커뮤니티 '소비 비교' 게시글 데이터 — Figma compare_spending (2257:17167) 내용 그대로. */

export const MY_SPENDING_REPORT = {
  title: '이번달 지출 리포트',
  deltaLabel: '지난달보다 8.2% 줄었어요',
  amount: 642_000,
  ctaLabel: '전체보기',
};

export interface PeerComparison {
  id: string;
  name: string;
  avatarInitial: string;
  avatarColor: string;
  condition: string;
  amount: number;
  deltaLabel: string;
  /** 배지 색 톤 — positive: 나는 이 사람보다 적게 썼다(초록), negative: 더 썼다(주황) */
  deltaTone: 'positive' | 'negative';
}

export const PEER_COMPARISONS: PeerComparison[] = [
  {
    id: 'alddeuri',
    name: '알뜰이',
    avatarInitial: '알',
    avatarColor: '#c7753b',
    condition: '서울 · 원룸 · 1인가구',
    amount: 725_000,
    deltaLabel: '알뜰이보다 11.4% 적게 썼어요',
    deltaTone: 'positive',
  },
  {
    id: 'minimalist',
    name: '미니멀러',
    avatarInitial: '미',
    avatarColor: '#a2b123',
    condition: '경기 · 오피스텔 · 1인가구',
    amount: 598_000,
    deltaLabel: '미니멀러보다 7.4% 더 썼어요',
    deltaTone: 'negative',
  },
  {
    id: 'jachwigosu',
    name: '자취고수',
    avatarInitial: '자',
    avatarColor: '#b43936',
    condition: '서울 · 원룸 · 1인가구',
    amount: 640_000,
    deltaLabel: '자취고수보다 0.3% 더 썼어요',
    deltaTone: 'negative',
  },
];

export const SPEND_INSIGHT_APP_LINK = {
  title: '가계부 앱과 연동해보세요',
  sub: '뱅크샐러드 최다 연동 중',
};
