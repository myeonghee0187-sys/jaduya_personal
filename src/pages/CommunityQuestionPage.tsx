import { CommunityPage } from './CommunityPage';

/* 기존 알림·딥링크가 사용하는 community-question 경로는 유지한다.
 * 화면을 복제하지 않고 질문 서브탭이 선택된 게시판으로 연결한다. */
export function CommunityQuestionPage() {
  return <CommunityPage initialBoardView="질문" returnToCommunity />;
}

export default CommunityQuestionPage;
