/* JADUYA — 돈관리 "내 계좌"의 단일 진실 공급원. "이번 달" 탭의 "내 계좌" 미리보기 카드와
 * 금융 관리 화면(MoneyAccountsPage.tsx)이 이 배열 하나를 그대로 써서, 계좌 개수·총 잔액이
 * 두 화면에서 항상 같다(CLAUDE.md 13. 동일 데이터 정합).
 *
 * 실제 계좌 연동 기능은 아직 없어(다른 금융기관 계좌 연결도 준비 중) 정적 목업만 둔다.
 * 은행 로고는 실제 로고 이미지 파일(jaduya_custom_recommendation_36/money_management/
 * bank*.png)을 그대로 쓴다 — 경로는 assets/img/ 기준(lib/asset.ts 의 img()). */

import { CARD_STATEMENTS } from './moneyFixed';

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

/** 카드 — 별도 카드 연동이 아직 없어, 소비·고정비 원본에서 카드별로 합친 이번 달 명세서(moneyFixed.ts 의
 * CARD_STATEMENTS)를 그대로 쓴다(동일 데이터 정합 — 숫자를 따로 만들지 않는다). */
export interface MoneyCard {
  id: string;
  /** "신한카드" 같은 카드사 이름 */
  issuer: string;
  /** "•• 4821" 같은 카드 뒷자리 표기 */
  tail: string;
  /** 카드 이미지 — public/assets/img/ 기준 경로 */
  image: string;
  /** 이번 달 이 카드로 쓴 금액(소비) — 모든 카드를 더하면 이번 달 쓴 돈과 같다 */
  amount: number;
  /** "25일 결제" 같은 보조 표기 */
  note: string;
}

export const CARDS: MoneyCard[] = CARD_STATEMENTS.map((card) => ({
  id: card.id,
  issuer: card.issuer,
  tail: card.tail,
  image: card.image,
  amount: card.amount,
  note: `${card.billingDay}일 결제`,
}));

/** 대출 — 실제 연동이 없는 정적 목업. */
export interface MoneyLoan {
  id: string;
  /** "전세대출" 같은 대출 종류 */
  kind: string;
  bank: string;
  /** 대출 잔액(원) */
  amount: number;
  /** 연 이자율(%) */
  rate: number;
}

export const LOANS: MoneyLoan[] = [
  { id: 'jeonse', kind: '전세대출', bank: '카카오뱅크', amount: 100_000_000, rate: 3.82 },
  { id: 'credit', kind: '신용대출', bank: '국민은행', amount: 5_000_000, rate: 4.5 },
];

/** 내 신용점수 — 이번 달 조회값과 지난달 값(1,000점 만점). 실제 조회 연동이 없어 정적 목업이다. */
export const CREDIT_SCORE = { score: 812, prevScore: 806, max: 1000 } as const;
