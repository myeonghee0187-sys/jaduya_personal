/* 커뮤니티 홈 게시글 — Figma community_home (1742:6378) 의 PostList 내용 그대로.
 * 카드 UI 는 모두 CommunityPostCard 하나로 그린다. */

export interface CommunityPost {
  id: string;
  /** 해시태그 chip (초록 계열) */
  hashtag: string;
  /** 분류 chip (베이지 계열) — 정보 / 질문 / 후기 / 잡담 */
  category: string;
  title: string;
  /** 본문 미리보기 — 카드에서 한 줄로 줄임 */
  preview: string;
  /** 작성자 뱃지 이모지 */
  badge: string;
  author: string;
  time: string;
  likes: number;
  comments: number;
  /** assets/img/community/ 아래 썸네일 파일명 */
  thumb: string;
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'fee-1',
    hashtag: '#고정비·관리비',
    category: '정보',
    title: '이번 달 관리비 3만원 아꼈어요',
    preview: '가스비 절약 습관 5가지 공유합니다! 작지만 꾸준히 하니까 확실히 차이가 나요',
    badge: '🌱',
    author: '알뜰살림꾼',
    time: '3시간 전',
    likes: 112,
    comments: 26,
    thumb: 'post-fee.png',
  },
  {
    id: 'grocery',
    hashtag: '#자취 요리·식비',
    category: '질문',
    title: '마트 장보기는 일주일에 몇 번 하세요?',
    preview: '한 번에 많이 사면 남아서 버리게 되고, 자주 사러 나가면 그때마다 자잘하게 돈이 새나가요',
    badge: '🏠',
    author: '자취요리사',
    time: '1시간 전',
    likes: 136,
    comments: 47,
    thumb: 'post-grocery.png',
  },
  {
    id: 'desk',
    hashtag: '#인테리어·수납',
    category: '후기',
    title: '다이소 바구니만으로 책상 정리 끝냈어요',
    preview:
      '책상 위에 충전기, 필기구, 영수증이 계속 쌓여서 정신없어 보였는데, 작은 트레이 하나로 정리하니까 확 달라졌어요',
    badge: '🐰',
    author: '수납장인',
    time: '어제',
    likes: 211,
    comments: 36,
    thumb: 'post-desk.png',
  },
  {
    id: 'clean',
    hashtag: '#청소·정리',
    category: '잡담',
    title: '분명 대청소했는데',
    preview:
      '일주일도 안 돼서 다시 원상복구됐어요. 주말에 몰아서 청소하는 방식 자체가 문제였던 것 같아요',
    badge: '🐇',
    author: '청소요정',
    time: '5시간 전',
    likes: 91,
    comments: 15,
    thumb: 'post-clean.png',
  },
  {
    id: 'parcel',
    hashtag: '#생활 문제 해결',
    category: '정보',
    title: '택배 분실됐을 때 대처법 정리',
    preview: '택배기사님 연락부터 신고 절차까지 알려드립니다',
    badge: '🌱',
    author: '생활해결사',
    time: '6시간 전',
    likes: 58,
    comments: 12,
    thumb: 'post-parcel.png',
  },
];

/** 상단 탭 */
/** 다른 화면(생활 > 살림의 살림 팁)에서도 이 탭을 지정해 들어오므로 이름을 한 곳에 둔다 */
export const COMMUNITY_TIP_TAB = '자취 꿀팁';

export const COMMUNITY_TABS = ['전체', '질문', COMMUNITY_TIP_TAB, '지역 후기', '소비 비교'] as const;

/* 질문 페이지 게시글 — Figma question (2012:7334) 의 QuestionList 내용 그대로.
 * 카드 UI 는 community_home 과 동일하게 CommunityPostCard 하나로 그린다. */
export const QUESTION_POSTS: CommunityPost[] = [
  {
    id: 'question-fee',
    hashtag: '#자취 요리·식비',
    category: '질문',
    title: '이번 달 관리비 3만원 아꼈어요',
    preview: '가스비 절약 습관 5가지 공유합니다~',
    badge: '🍳',
    author: '자취5년차',
    time: '2시간 전',
    likes: 8,
    comments: 14,
    thumb: 'post-question-cooking.webp',
  },
  {
    id: 'question-closet',
    hashtag: '#인테리어·수납',
    category: '질문',
    title: '옷장 없는 원룸인데 행거 어떤 거 쓰세요?',
    preview: '튼튼한 거 찾고 있는데 다이소 제품은 어떨지 궁금해요',
    badge: '🪟',
    author: '미니멀라이프',
    time: '5시간 전',
    likes: 12,
    comments: 19,
    thumb: 'post-question-closet.webp',
  },
  {
    id: 'question-mailbox',
    hashtag: '#생활 문제 해결',
    category: '질문',
    title: '우편함 자물쇠 비번 모르는데 어디에 물어봐야 하나요',
    preview: '이사 온 지 얼마 안 돼서 전 세입자 정보도 없어요',
    badge: '📮',
    author: '이사준비중',
    time: '어제',
    likes: 4,
    comments: 6,
    thumb: 'post-question-hallway.webp',
  },
  {
    id: 'question-tax',
    hashtag: '#고정비·관리비',
    category: '질문',
    title: '누진세 구간 어떻게 확인하나요? 이번 달 유독 많이 나왔어요',
    preview: '작년이랑 비교하고 싶은데 고지서 보는 법을 모르겠어요',
    badge: '💡',
    author: '짠테크입문',
    time: '2일 전',
    likes: 21,
    comments: 27,
    thumb: 'post-question-bill.webp',
  },
];
