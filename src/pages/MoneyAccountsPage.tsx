import { useEffect, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon, img } from '../lib/asset';
import { ACCOUNTS } from '../data/moneyAccounts';

/* 돈관리 > 금융 관리 — "이번 달" 탭의 "내 계좌" 미리보기 카드로 들어오는 하위 화면이다(레퍼런스
 * "05. 계좌·카드·이체", 탭바는 '돈관리' active 유지). 계좌 목록은 이번 달 탭과 같은
 * 원본(moneyAccounts.ts)을 그대로 쓴다 — 두 화면에서 항상 같은 숫자를 보여준다
 * (CLAUDE.md 13. 동일 데이터 정합).
 *
 * 상단 탭은 계좌/카드/이체 3개를 두되, 돈관리 메인 탭(이번 달/수입·지출/고정비/비상금)과
 * 같은 언더라인 스타일(money__tabs-row/money__tabs/money__tab)을 그대로 재사용한다.
 * 카드·이체는 아직 화면이 없어(실 데이터도 없어) 다른 "화면 없는 탭"들과 같은 방식으로
 * 누르면 준비 중 안내만 띄운다 — 탭 자체는 전환되지 않고 계좌 내용이 계속 보인다.
 *
 * 실제 계좌 연동은 아직 없어(다른 금융기관 계좌 연결도 준비 중) 연결 버튼·연결 가능한
 * 금융기관 목록은 모두 눌러도 "준비 중" 안내만 뜬다 — 다른 하위 화면들과 같은 방식.
 *
 * 은행 로고는 실제 로고 이미지 파일(jaduya_custom_recommendation_36/money_management/
 * bank*.png)을 그대로 쓴다 — 계좌 목록(moneyAccounts.ts)과 같은 방식. */

interface ConnectableBank {
  id: string;
  label: string;
  logo: string;
}

const CONNECTABLE_BANKS: ConnectableBank[] = [
  { id: 'kakao', label: '카카오뱅크', logo: 'jaduya_custom_recommendation_36/money_management/bank1.png' },
  { id: 'kb', label: 'KB국민', logo: 'jaduya_custom_recommendation_36/money_management/bank2.png' },
  { id: 'shinhan', label: '신한은행', logo: 'jaduya_custom_recommendation_36/money_management/bank3.png' },
  { id: 'woori', label: '우리은행', logo: 'jaduya_custom_recommendation_36/money_management/bank4.png' },
  { id: 'hana', label: '하나은행', logo: 'jaduya_custom_recommendation_36/money_management/bank5.png' },
  { id: 'nh', label: 'NH농협', logo: 'jaduya_custom_recommendation_36/money_management/bank6.png' },
  { id: 'toss', label: '토스뱅크', logo: 'jaduya_custom_recommendation_36/money_management/bank7.png' },
];

export function MoneyAccountsPage() {
  const navigation = useAppNavigation();
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="money-accounts app">
      <SubPageHeader
        title="금융 관리"
        backLabel="돈관리로"
        onBack={() => navigation?.navigate('money')}
      />

      <main className="money-accounts__scroll">
        <div className="money__tabs-row">
          <div className="money__tabs" role="tablist" aria-label="금융 관리 구분">
            <button type="button" role="tab" aria-selected="true" className="money__tab is-active">
              계좌
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              className="money__tab"
              onClick={() => setNotice('카드 화면은 준비 중이에요.')}
            >
              카드
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              className="money__tab"
              onClick={() => setNotice('이체 화면은 준비 중이에요.')}
            >
              이체
            </button>
          </div>
        </div>

        <button
          type="button"
          className="money-accounts__section-head money-tappable"
          onClick={() => setNotice('내 계좌 전체보기는 준비 중이에요.')}
        >
          <h2 className="money-accounts__section-title">내 계좌 {ACCOUNTS.length}개</h2>
        </button>

        <div className="money-accounts__list">
          {ACCOUNTS.map((account) => (
            <div key={account.id} className="money-accounts__row">
              <span className="money-accounts__row-badge" aria-hidden="true">
                <img src={img(account.logo)} alt="" />
              </span>
              <span className="money-accounts__row-info">
                <span className="money-accounts__row-bank">{account.bank}</span>
                <span className="money-accounts__row-type">{account.type}</span>
              </span>
              <span className="money-accounts__row-value">{account.balance.toLocaleString()}원</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="money-accounts__connect-row money-tappable"
          onClick={() => setNotice('계좌 연결 기능은 준비 중이에요.')}
        >
          <span className="money-accounts__connect-row-icon">
            <img src={icon('money-balance.svg')} alt="" />
          </span>
          <span className="money-accounts__connect-row-text">
            <span className="money-accounts__connect-row-title">다른 금융기관 계좌 연결</span>
            <span className="money-accounts__connect-row-sub">더 많은 금융기관을 연결해보세요.</span>
          </span>
          <img className="money-accounts__connect-row-chevron" src={icon('chevron-right-gray.svg')} alt="" />
        </button>

        <section className="money-accounts__banks">
          <h2 className="money-accounts__section-title">연결 가능한 금융기관</h2>
          <div className="money-accounts__banks-grid">
            {CONNECTABLE_BANKS.map((bank) => (
              <button
                key={bank.id}
                type="button"
                className="money-accounts__bank money-tappable"
                onClick={() => setNotice('계좌 연결 기능은 준비 중이에요.')}
              >
                <span className="money-accounts__bank-badge" aria-hidden="true">
                  <img src={img(bank.logo)} alt="" />
                </span>
                <span className="money-accounts__bank-label">{bank.label}</span>
              </button>
            ))}
            <button
              type="button"
              className="money-accounts__bank money-tappable"
              onClick={() => setNotice('계좌 연결 기능은 준비 중이에요.')}
            >
              <span className="money-accounts__bank-badge money-accounts__bank-badge--more" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="money-accounts__bank-label">그 외</span>
            </button>
          </div>
        </section>
      </main>

      <p className="money__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="money" />
    </div>
  );
}

export default MoneyAccountsPage;
