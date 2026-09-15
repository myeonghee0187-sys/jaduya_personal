/* 돈 관리 '소비' 탭 맨 아래 — 비슷한 자취생과 비교 / 소비 인사이트 공유 데이터.
 * 원래 커뮤니티 '소비 비교' 탭 데이터였다 (Figma compare_spending 2257:17167 내용 그대로). */

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
    deltaLabel: '알뜰이보다 0.7% 더 썼어요',
    deltaTone: 'negative',
  },
  {
    id: 'minimalist',
    name: '미니멀러',
    avatarInitial: '미',
    avatarColor: '#a2b123',
    condition: '경기 · 오피스텔 · 1인가구',
    amount: 598_000,
    deltaLabel: '미니멀러보다 22.1% 더 썼어요',
    deltaTone: 'negative',
  },
  {
    id: 'jachwigosu',
    name: '자취고수',
    avatarInitial: '자',
    avatarColor: '#b43936',
    condition: '서울 · 원룸 · 1인가구',
    amount: 640_000,
    deltaLabel: '자취고수보다 14.1% 더 썼어요',
    deltaTone: 'negative',
  },
];

export const SPEND_INSIGHT_APP_LINK = {
  title: '가계부 앱과 연동해보세요',
  sub: '뱅크샐러드 최다 연동 중',
};
