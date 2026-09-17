/* JADUYA — 돈관리 "내 계좌"의 단일 진실 공급원. "이번 달" 탭의 "내 계좌" 미리보기 카드와
 * 금융 관리 화면(MoneyAccountsPage.tsx)이 이 배열 하나를 그대로 써서, 계좌 개수·총 잔액이
 * 두 화면에서 항상 같다(CLAUDE.md 13. 동일 데이터 정합).
 *
 * 실제 계좌 연동 기능은 아직 없어(다른 금융기관 계좌 연결도 준비 중) 정적 목업만 둔다.
 * 은행 로고 이미지 에셋이 없어, 소비 탭 아래 "비슷한 자취생과 비교"의 peer-card 아바타와
 * 같은 방식(원형 배지 + 이니셜)으로 표시한다(실제 은행 브랜드 로고를 새로 만들지 않는다). */

export interface MoneyAccount {
  id: string;
  bank: string;
  /** "자유입출금" 같은 계좌 유형 라벨 */
  type: string;
  balance: number;
  initial: string;
  color: string;
  /** 카카오뱅크처럼 배지 배경 자체가 브랜드 색인 은행만 'solid' — 나머지는 흰 배경 + 색 이니셜 */
  fill?: 'solid';
}

export const ACCOUNTS: MoneyAccount[] = [
  { id: 'kb', bank: '국민은행', type: '자유입출금', balance: 1_284_500, initial: 'K', color: 'var(--brand-green)' },
  {
    id: 'kakao',
    bank: '카카오뱅크',
    type: '자유입출금',
    balance: 2_350_000,
    initial: 'B',
    color: 'var(--brand-secondary)',
    fill: 'solid',
  },
  { id: 'shinhan', bank: '신한은행', type: '자유입출금', balance: 820_000, initial: 'S', color: '#4a6fa5' },
];

/** 총 계좌 잔액 = 계좌 목록의 합 그 자체다(동일 데이터 정합). */
export const TOTAL_BALANCE = ACCOUNTS.reduce((sum, acc) => sum + acc.balance, 0);
