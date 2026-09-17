import type { LevelValue } from './personaProfile';

export interface CommunityComment {
  id: string;
  author: string;
  /** 화면에 보이는 이름(author)과 별개로, 실제 로그인 사용자와 비교하기 위한 식별값 —
   * 이 프로젝트에서는 AuthUser.email 을 그대로 쓴다. 정적 mock 댓글에는 없다(optional). */
  authorId?: string;
  /** 닉네임 옆 원형 아바타에 쓰는 이모지 — 실제 사진이 없는 mock 댓글 전용 */
  avatar: string;
  /** 댓글 작성자의 계정 성장 레벨(1~5) — personaProfile.ts LEVEL_STAGES 와 1:1 대응 */
  level: LevelValue;
  body: string;
  time: string;
  /** '인기' 정렬 기준 좋아요 수 */
  likes: number;
}

/** 게시글 id → 댓글 목록. 아직 상세보기(post.body)가 있는 게시글에만 채워둔다. */
export const COMMUNITY_COMMENTS: Record<string, CommunityComment[]> = {
  desk: [
    { id: 'desk-1', author: '정리요정', avatar: '🌱', level: 4, body: '트레이 하나로 이렇게 달라진다니 바로 따라해봐야겠어요', time: '2시간 전', likes: 14 },
    { id: 'desk-2', author: '책상은깨끗해', avatar: '🏠', level: 2, body: '저도 충전 케이블 때문에 늘 엉켜있었는데 팁 감사해요', time: '3시간 전', likes: 6 },
    { id: 'desk-3', author: '다이소덕후', avatar: '🐰', level: 5, body: '다이소 트레이 사이즈 몇 리터짜리 쓰셨는지 궁금해요', time: '3시간 전', likes: 22 },
    { id: 'desk-4', author: '자취3년차', avatar: '🐇', level: 5, body: '저는 서랍에 몰아넣는 파라 진짜 공감돼요 바꿔야겠어요', time: '4시간 전', likes: 31 },
    { id: 'desk-5', author: '미니멀라이프', avatar: '🐣', level: 3, body: '6천원으로 이 정도면 가성비 최고네요', time: '4시간 전', likes: 9 },
    { id: 'desk-6', author: '이제자취1년', avatar: '📬', level: 2, body: '영수증 서류함 아이디어 진짜 좋다', time: '5시간 전', likes: 4 },
    { id: 'desk-7', author: '집순이일상', avatar: '🧑‍💼', level: 1, body: '저도 자취 시작하면 꼭 이렇게 정리해야지', time: '5시간 전', likes: 2 },
    { id: 'desk-8', author: '오늘도청소', avatar: '🚚', level: 3, body: '필기구 세로 칸막이 바구니 어디꺼 쓰시나요', time: '6시간 전', likes: 7 },
    { id: 'desk-9', author: '자취뉴비', avatar: '🧴', level: 1, body: '책상 정리만 해도 공부 집중력이 다르다는 거 공감해요', time: '6시간 전', likes: 11 },
    { id: 'desk-10', author: '살림9단', avatar: '💳', level: 5, body: '눈에 보이는 곳에 종류별로 두는 거 진짜 정답이에요', time: '7시간 전', likes: 45 },
    { id: 'desk-11', author: '원룸라이프', avatar: '🐱', level: 2, body: '저희 집도 딱 이 상태인데 주말에 정리해야겠어요', time: '8시간 전', likes: 3 },
    { id: 'desk-12', author: '소소한행복', avatar: '🐶', level: 4, body: '사진만 봐도 깔끔해서 기분 좋아지네요', time: '9시간 전', likes: 8 },
    { id: 'desk-13', author: '정리는어려워', avatar: '🌻', level: 1, body: '저는 정리해도 금방 다시 어질러지던데 유지 팁도 궁금해요', time: '10시간 전', likes: 17 },
    { id: 'desk-14', author: '자취요정', avatar: '📦', level: 3, body: '트레이 색깔 예쁘네요 어디서 사셨어요', time: '11시간 전', likes: 5 },
    { id: 'desk-15', author: '책상위전쟁', avatar: '🧦', level: 2, body: '영수증이 계속 쌓이는 거 진짜 제 얘기인 줄', time: '12시간 전', likes: 12 },
    { id: 'desk-16', author: '자취고수', avatar: '🍞', level: 5, body: '충전 케이블 트레이 따로 두는 거 저도 강추합니다', time: '13시간 전', likes: 26 },
    { id: 'desk-17', author: '알뜰소비자', avatar: '🪴', level: 4, body: '6천원에 이 정도 효과면 바로 지릅니다', time: '14시간 전', likes: 6 },
    { id: 'desk-18', author: '방탈출성공', avatar: '🔑', level: 3, body: '드디어 책상 위에서 물건 찾는 시간 줄겠네요', time: '15시간 전', likes: 4 },
    { id: 'desk-19', author: '정돈러', avatar: '🌱', level: 4, body: '서랍 안에 다 넣는 것보다 훨씬 효율적인 것 같아요', time: '16시간 전', likes: 10 },
    { id: 'desk-20', author: '자취일기', avatar: '🏠', level: 2, body: '저장해두고 이번 주말에 따라해볼게요', time: '17시간 전', likes: 1 },
    { id: 'desk-21', author: '하루한줄', avatar: '🐰', level: 1, body: '초보라 뭐부터 사야할지 몰랐는데 목록 감사해요', time: '18시간 전', likes: 3 },
    { id: 'desk-22', author: '공간활용왕', avatar: '🐇', level: 5, body: '작은 바구니 3개로 이 효율이라니 대단하세요', time: '19시간 전', likes: 19 },
    { id: 'desk-23', author: '느긋한자취', avatar: '🐣', level: 3, body: '저도 예전에 비슷하게 정리했는데 확실히 편해요', time: '20시간 전', likes: 5 },
    { id: 'desk-24', author: '자취템수집가', avatar: '📬', level: 4, body: '다이소 트레이 종류가 많던데 추천템 더 없나요', time: '21시간 전', likes: 13 },
    { id: 'desk-25', author: '집꾸미기중', avatar: '🧑‍💼', level: 2, body: '색감도 튀지 않고 깔끔해서 좋네요', time: '어제', likes: 2 },
    { id: 'desk-26', author: '노트북옆자리', avatar: '🚚', level: 1, body: '저도 케이블 정리부터 시작해보려고요', time: '어제', likes: 0 },
    { id: 'desk-27', author: '자취n년차', avatar: '🧴', level: 5, body: '초반에 이런 글 봤으면 시행착오 덜 겪었을 텐데', time: '어제', likes: 24 },
    { id: 'desk-28', author: '작은방라이프', avatar: '💳', level: 3, body: '책상 좁아도 이렇게 하면 넓어 보이겠어요', time: '어제', likes: 7 },
    { id: 'desk-29', author: '정리정돈덕후', avatar: '🐱', level: 4, body: '서류함은 A4 사이즈인가요 궁금해요', time: '어제', likes: 1 },
    { id: 'desk-30', author: '오늘의다짐', avatar: '🐶', level: 1, body: '이 글 보고 바로 다이소 다녀왔어요', time: '어제', likes: 9 },
    { id: 'desk-31', author: '자취생활백서', avatar: '🌻', level: 2, body: '정리 습관 들이는 게 제일 어려운 것 같아요', time: '2일 전', likes: 15 },
    { id: 'desk-32', author: '깔끔쟁이', avatar: '📦', level: 5, body: '저장 완료 이번 기회에 저도 정리 좀 해야겠어요', time: '2일 전', likes: 3 },
    { id: 'desk-33', author: '자취러버', avatar: '🧦', level: 3, body: '트레이 하나가 이렇게 큰 변화를 주는군요', time: '2일 전', likes: 6 },
    { id: 'desk-34', author: '월세방탈출', avatar: '🍞', level: 2, body: '충전기 자리 딱 정해두는 거 진짜 필요했어요', time: '2일 전', likes: 2 },
    { id: 'desk-35', author: '작심삼일방지', avatar: '🪴', level: 1, body: '저는 꾸준히 유지가 안 되던데 팁 있으면 알려주세요', time: '3일 전', likes: 4 },
    { id: 'desk-36', author: '자취9년차', avatar: '🔑', level: 5, body: '오래 자취해도 책상 정리는 늘 숙제네요 잘 보고 갑니다', time: '3일 전', likes: 21 },
    /* 데모 계정(이서준/김하린/조아영) 댓글 — 마이페이지 "나의 활동 > 댓글"이 실제
     * authorId 로 필터링한다는 걸 보여주기 위한 고정 데모 데이터(활동량: 서준7·하린4·아영1). */
    { id: 'demo-comment-seojun-1', author: '이서준', authorId: 'seojun@jaduya.com', avatar: '🐣', level: 1, body: '혹시 이건 관리비에도 포함되나요?', time: '3시간 전', likes: 1 },
    { id: 'demo-comment-seojun-2', author: '이서준', authorId: 'seojun@jaduya.com', avatar: '🐣', level: 1, body: '정리 팁 감사합니다. 저도 따라해볼게요!', time: '2시간 전', likes: 0 },
    { id: 'demo-comment-harin-3', author: '김하린', authorId: 'harin@jaduya.com', avatar: '🧑‍💼', level: 5, body: '이 방법 써봤는데 생각보다 편했어요.', time: '1시간 전', likes: 3 },
  ],
  'demo-seojun-post-2': [
    { id: 'demo-comment-harin-1', author: '김하린', authorId: 'harin@jaduya.com', avatar: '🧑‍💼', level: 5, body: '관리비 항목도 같이 확인해보는 게 좋아요.', time: '어제', likes: 2 },
  ],
  'demo-seojun-post-3': [
    { id: 'demo-comment-harin-2', author: '김하린', authorId: 'harin@jaduya.com', avatar: '🧑‍💼', level: 5, body: '저는 입주하자마자 사진부터 찍어뒀어요.', time: '1일 전', likes: 4 },
    { id: 'demo-comment-ayoung-1', author: '조아영', authorId: 'ayoung@jaduya.com', avatar: '🐾', level: 3, body: '환기부터 하고 짐 정리하면 훨씬 쾌적해요!', time: '1일 전', likes: 1 },
  ],
  'demo-harin-post-1': [
    { id: 'demo-comment-seojun-3', author: '이서준', authorId: 'seojun@jaduya.com', avatar: '🐣', level: 1, body: '이 부분은 처음 알았어요.', time: '4시간 전', likes: 2 },
  ],
  'demo-harin-post-2': [
    { id: 'demo-comment-seojun-4', author: '이서준', authorId: 'seojun@jaduya.com', avatar: '🐣', level: 1, body: '저도 곧 입주하는데 도움됐어요!', time: '20시간 전', likes: 1 },
    { id: 'demo-comment-seojun-5', author: '이서준', authorId: 'seojun@jaduya.com', avatar: '🐣', level: 1, body: '계약 전에 확인해봐야겠네요.', time: '19시간 전', likes: 0 },
  ],
  'demo-ayoung-post-1': [
    { id: 'demo-comment-seojun-6', author: '이서준', authorId: 'seojun@jaduya.com', avatar: '🐣', level: 1, body: '반려동물 키우면 수납 고민이 더 크겠어요, 좋은 정보 감사합니다!', time: '3시간 전', likes: 1 },
    { id: 'demo-comment-seojun-7', author: '이서준', authorId: 'seojun@jaduya.com', avatar: '🐣', level: 1, body: '저도 곧 필요할 것 같아서 저장해둡니다.', time: '2시간 전', likes: 0 },
    { id: 'demo-comment-harin-4', author: '김하린', authorId: 'harin@jaduya.com', avatar: '🧑‍💼', level: 5, body: '저도 비슷하게 하고 있는데 확실히 편합니다.', time: '1시간 전', likes: 2 },
  ],
};
