/* 알림 목록 — 페르소나별 mock 데이터.
 *
 * 화면은 사용자 이름을 비교하지 않는다. AuthContext 의 persona 값으로만 목록을 고른다.
 * 페르소나가 늘어나면 NOTIFICATIONS_BY_PERSONA 에 키를 하나 더 두면 된다.
 *
 * read 여부는 여기 두지 않는다 — 계정마다 달라져야 해서 NotificationContext 가 따로 관리한다.
 */

import type { Persona } from '../auth/mockUsers';
import type { AppPage } from '../navigation/AppNavigation';

export type NotificationType = 'benefit' | 'money' | 'community' | 'life' | 'recommend';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** '3분 전' 처럼 이미 다듬어진 문자열 — mock 이라 계산하지 않는다 */
  createdAt: string;
  /** 누르면 갈 화면. 없으면 읽음 처리만 한다 */
  route?: AppPage;
}

/** 카드 왼쪽 원형 아이콘 — 아이콘 파일과 파스텔 배경을 타입별로 묶어 둔다 */
export const NOTIFICATION_META: Record<
  NotificationType,
  { label: string; iconFile: string; tone: string }
> = {
  benefit: { label: '혜택', iconFile: 'gnb-nav-benefit.svg', tone: 'benefit' },
  money: { label: '돈 관리', iconFile: 'gnb-nav-money.svg', tone: 'money' },
  community: { label: '커뮤니티', iconFile: 'gnb-nav-community.svg', tone: 'community' },
  life: { label: '생활', iconFile: 'gnb-nav-living.svg', tone: 'life' },
  recommend: { label: '맞춤 추천', iconFile: 'money-benefit-sparkle.svg', tone: 'recommend' },
};

export const NOTIFICATIONS_BY_PERSONA: Record<Persona, NotificationItem[]> = {
  /* 이서준 — 아직 받은 알림이 없다 */
  beginner: [],

  /* 김하린 */
  worker: [
    {
      id: 'harin-benefit-housing',
      type: 'benefit',
      title: '청년 주거비 지원 신청이 3일 남았어요',
      message: '저장해둔 혜택의 신청 기간을 확인해보세요.',
      createdAt: '3분 전',
      route: 'benefits',
    },
    {
      id: 'harin-money-rent',
      type: 'money',
      title: '내일은 월세 납부일이에요',
      message: '예정된 고정비 일정을 확인해보세요.',
      createdAt: '1시간 전',
      route: 'money',
    },
    {
      id: 'harin-community-comment',
      type: 'community',
      title: '작성한 글에 새로운 댓글이 달렸어요',
      message: '다른 자취생의 답변을 확인해보세요.',
      createdAt: '어제',
      route: 'community-question',
    },
  ],

  /* 조아영 */
  pet: [
    {
      id: 'ayoung-life-checklist',
      type: 'life',
      title: '집에 생긴 문제를 함께 해결해봐요',
      message: '홈케어에서 상황에 맞는 해결 방법을 확인해보세요.',
      createdAt: '방금 전',
      route: 'life-homecare',
    },
    {
      id: 'ayoung-benefit-new',
      type: 'benefit',
      title: '아영님이 신청할 수 있는 새로운 혜택이 있어요',
      message: '조건에 맞는 지원 정보를 확인해보세요.',
      createdAt: '2시간 전',
      route: 'benefits-recommend',
    },
    {
      id: 'ayoung-recommend-info',
      type: 'recommend',
      title: '아영님을 위한 새로운 자취 정보가 도착했어요',
      message: '관심 분야를 바탕으로 추천했어요.',
      /* 지금은 연결할 화면이 뚜렷하지 않아 읽음 처리만 한다 */
      createdAt: '어제',
    },
  ],
};
