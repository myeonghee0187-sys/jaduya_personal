/* JADUYA — 돈관리 "내 계좌"의 단일 진실 공급원. "이번 달" 탭의 "내 계좌" 미리보기 카드와
 * 금융 관리 화면(MoneyAccountsPage.tsx)이 이 배열 하나를 그대로 써서, 계좌 개수·총 잔액이
 * 두 화면에서 항상 같다(CLAUDE.md 13. 동일 데이터 정합).
 *
 * 실제 계좌 연동 기능은 아직 없어(다른 금융기관 계좌 연결도 준비 중) 정적 목업만 둔다.
 * 은행 로고는 실제 로고 이미지 파일(jaduya_custom_recommendation_36/money_management/
 * bank*.png)을 그대로 쓴다 — 경로는 assets/img/ 기준(lib/asset.ts 의 img()). */

export interface MoneyAccount {
  id: string;
  bank: string;
  /** "자유입출금" 같은 계좌 유형 라벨 */
  type: string;
  balance: number;
  /** 은행 로고 이미지 경로 (assets/img/ 기준) */
  logo: string;
}

export const ACCOUNTS: MoneyAccount[] = [
  {
    id: 'kb',
    bank: '국민은행',
    type: '자유입출금',
    balance: 1_284_500,
    logo: 'jaduya_custom_recommendation_36/money_management/bank2.png',
  },
  {
    id: 'kakao',
    bank: '카카오뱅크',
    type: '자유입출금',
    balance: 2_350_000,
    logo: 'jaduya_custom_recommendation_36/money_management/bank1.png',
  },
  {
    id: 'shinhan',
    bank: '신한은행',
    type: '자유입출금',
    balance: 820_000,
    logo: 'jaduya_custom_recommendation_36/money_management/bank3.png',
  },
];

/** 총 계좌 잔액 = 계좌 목록의 합 그 자체다(동일 데이터 정합). */
export const TOTAL_BALANCE = ACCOUNTS.reduce((sum, acc) => sum + acc.balance, 0);
