import { useEffect, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { icon, img } from '../lib/asset';
import { ACCOUNTS, CARDS } from '../data/moneyAccounts';
import { NEXT_CARD_PAYMENT } from '../data/moneyFixed';
import { TODAY_DAY, TRANSFER_TRANSACTIONS } from '../data/moneyTransactions';

/* 돈관리 > 금융 관리 — "이번 달" 탭의 "내 계좌" 미리보기 카드로 들어오는 하위 화면이다(레퍼런스
 * "05. 계좌·카드·이체", 탭바는 '돈관리' active 유지). 계좌 목록은 이번 달 탭과 같은
 * 원본(moneyAccounts.ts)을 그대로 쓴다 — 두 화면에서 항상 같은 숫자를 보여준다
 * (CLAUDE.md 13. 동일 데이터 정합).
 *
 * 상단 탭은 계좌/카드/이체 3개를 두되, 돈관리 메인 탭(이번 달/수입·지출/고정비/비상금)과
 * 같은 언더라인 스타일(money__tabs-row/money__tabs/money__tab)을 그대로 재사용한다.
 * 세 탭 모두 실제 화면이 있다 — 카드는 카드별 이번 달 사용액(돈관리 카드값·소비와 같은 원본), 이체는 내 계좌 사이
 * 이체 폼과 최근 이체 내역이다.
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

/* 연결 가능한 카드사 — 이미 연결된 카드(신한·카카오뱅크·삼성·국민)는 뺀다. 카드사 전용 로고 에셋이 없어
 * 같은 금융그룹의 은행 로고(bank*.png)를 그대로 쓴다(새 에셋을 임의로 만들지 않는다). */
const CONNECTABLE_CARDS: ConnectableBank[] = [
  { id: 'woori-card', label: '우리카드', logo: 'jaduya_custom_recommendation_36/money_management/bank4.png' },
  { id: 'hana-card', label: '하나카드', logo: 'jaduya_custom_recommendation_36/money_management/bank5.png' },
  { id: 'nh-card', label: 'NH농협카드', logo: 'jaduya_custom_recommendation_36/money_management/bank6.png' },
  { id: 'toss-card', label: '토스뱅크', logo: 'jaduya_custom_recommendation_36/money_management/bank7.png' },
];

type FinTab = 'accounts' | 'cards' | 'transfer';

/* 이체 폼의 빠른 금액 버튼 */
const QUICK_AMOUNTS = [10_000, 50_000, 100_000];

interface RecentTransfer {
  id: string;
  label: string;
  when: string;
  amount: number;
}

/* 최근 이체 내역 초기값 — 이체 거래 원본(moneyTransactions.ts)에서 오늘까지 지난 것만 그대로 가져온다 */
const INITIAL_TRANSFERS: RecentTransfer[] = [...TRANSFER_TRANSACTIONS]
  .filter((tx) => tx.day <= TODAY_DAY)
  .sort((a, b) => b.day - a.day)
  .map((tx) => ({ id: tx.id, label: tx.label, when: `9월 ${tx.day}일`, amount: tx.amount }));

export function MoneyAccountsPage() {
  const navigation = useAppNavigation();
  const [notice, setNotice] = useState('');
  /* "이번 달" 탭 내 자산의 "송금" 버튼으로 들어오면 이체 탭이 먼저 열리고, 그 계좌가 보내는 계좌로 골라져 있다 */
  const requestedTab = navigation?.options.tab;
  const requestedFrom = ACCOUNTS.find((account) => account.id === navigation?.options.section);
  const [tab, setTab] = useState<FinTab>(requestedTab === 'transfer' ? 'transfer' : 'accounts');
  /* 이체하면 이 화면 안에서 계좌 잔액이 바뀌어 보인다(데모 — 원본 데이터에는 저장하지 않는다) */
  const [balances, setBalances] = useState<Record<string, number>>(() =>
    Object.fromEntries(ACCOUNTS.map((account) => [account.id, account.balance]))
  );
  const [fromId, setFromId] = useState((requestedFrom ?? ACCOUNTS[0]).id);
  const [toId, setToId] = useState(
    (ACCOUNTS.find((account) => account.id !== (requestedFrom ?? ACCOUNTS[0]).id) ?? ACCOUNTS[0]).id,
  );
  const [amountText, setAmountText] = useState('');
  const [transfers, setTransfers] = useState<RecentTransfer[]>(INITIAL_TRANSFERS);

  /* 계좌 탭의 총 잔액 — 이체해도 합계는 그대로다(계좌 사이 이동이라) */
  const totalBalance = Object.values(balances).reduce((sum, value) => sum + value, 0);

  const amount = Number(amountText) || 0;
  const fromAccount = ACCOUNTS.find((account) => account.id === fromId) ?? ACCOUNTS[0];
  const toAccount = ACCOUNTS.find((account) => account.id === toId) ?? ACCOUNTS[0];
  const fromBalance = balances[fromAccount.id] ?? 0;
  const transferError =
    fromId === toId
      ? '출금 계좌와 받는 계좌가 같아요.'
      : amount > fromBalance
        ? '출금 가능 금액을 넘었어요.'
        : '';
  const canTransfer = amount > 0 && !transferError;

  const changeFrom = (id: string) => {
    setFromId(id);
    /* 받는 계좌가 출금 계좌와 같아지면 다른 계좌로 옮겨 준다 */
    if (id === toId) setToId(ACCOUNTS.find((account) => account.id !== id)?.id ?? id);
  };

  const submitTransfer = () => {
    if (!canTransfer) return;
    setBalances((prev) => ({
      ...prev,
      [fromAccount.id]: (prev[fromAccount.id] ?? 0) - amount,
      [toAccount.id]: (prev[toAccount.id] ?? 0) + amount,
    }));
    setTransfers((prev) => [
      { id: `local-${Date.now()}`, label: `${fromAccount.bank} → ${toAccount.bank}`, when: '방금', amount },
      ...prev,
    ]);
    setAmountText('');
    setNotice(`${amount.toLocaleString()}원을 ${toAccount.bank}(으)로 이체했어요.`);
  };

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
        onBack={() => navigation?.goBack('money')}
      />

      <main className="money-accounts__scroll">
        <div className="money__tabs-row">
          <div className="money__tabs" role="tablist" aria-label="금융 관리 구분">
            {(
              [
                ['accounts', '계좌'],
                ['cards', '카드'],
                ['transfer', '이체'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`money__tab${tab === key ? ' is-active' : ''}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'accounts' && (
          <>
          <section className="fin-summary" aria-label="총 잔액">
            <p className="fin-summary__label">총 잔액</p>
            <p className="fin-summary__amount">{totalBalance.toLocaleString()}원</p>
          </section>

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
                <span className="money-accounts__row-value">{(balances[account.id] ?? account.balance).toLocaleString()}원</span>
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
          </>
        )}

        {tab === 'cards' && (
          <>
            {NEXT_CARD_PAYMENT && (
              <section className="fin-summary" aria-label="다음 카드값">
                <p className="fin-summary__label">9월 {NEXT_CARD_PAYMENT.day}일 카드값</p>
                <p className="fin-summary__amount">{NEXT_CARD_PAYMENT.amount.toLocaleString()}원</p>
                <p className="fin-summary__sub">카드 {NEXT_CARD_PAYMENT.cards.length}장 · 이번 달 카드 사용액과 같아요</p>
              </section>
            )}
            <h2 className="money-accounts__section-title fin-title">내 카드 {CARDS.length}장</h2>
            <div className="money-accounts__list">
              {CARDS.map((card) => (
                <div key={card.id} className="money-accounts__row">
                  <img className="fin-card-thumb" src={img(card.image)} alt="" aria-hidden="true" />
                  <span className="money-accounts__row-info">
                    <span className="money-accounts__row-bank">{card.issuer}</span>
                    <span className="money-accounts__row-type">
                      {card.tail} · {card.note}
                    </span>
                  </span>
                  <span className="money-accounts__row-value">{card.amount.toLocaleString()}원</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="money-accounts__connect-row money-tappable"
              onClick={() => setNotice('카드 연결 기능은 준비 중이에요.')}
            >
              <span className="money-accounts__connect-row-icon">
                <img src={icon('menu-card.svg')} alt="" />
              </span>
              <span className="money-accounts__connect-row-text">
                <span className="money-accounts__connect-row-title">다른 카드 연결</span>
                <span className="money-accounts__connect-row-sub">쓰는 카드를 연결하면 카드값을 한눈에 볼 수 있어요.</span>
              </span>
              <img className="money-accounts__connect-row-chevron" src={icon('chevron-right-gray.svg')} alt="" />
            </button>

            <section className="money-accounts__banks">
              <h2 className="money-accounts__section-title">연결 가능한 카드사</h2>
              <div className="money-accounts__banks-grid">
                {CONNECTABLE_CARDS.map((issuer) => (
                  <button
                    key={issuer.id}
                    type="button"
                    className="money-accounts__bank money-tappable"
                    onClick={() => setNotice('카드 연결 기능은 준비 중이에요.')}
                  >
                    <span className="money-accounts__bank-badge" aria-hidden="true">
                      <img src={img(issuer.logo)} alt="" />
                    </span>
                    <span className="money-accounts__bank-label">{issuer.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="money-accounts__bank money-tappable"
                  onClick={() => setNotice('카드 연결 기능은 준비 중이에요.')}
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
          </>
        )}

        {tab === 'transfer' && (
          <>
            <h2 className="money-accounts__section-title fin-title">내 계좌로 이체</h2>
            <form
              className="fin-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitTransfer();
              }}
            >
              <label className="fin-field">
                <span className="fin-field__label">출금 계좌</span>
                <select value={fromId} onChange={(event) => changeFrom(event.target.value)}>
                  {ACCOUNTS.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank} {account.type} · {(balances[account.id] ?? 0).toLocaleString()}원
                    </option>
                  ))}
                </select>
              </label>
              <label className="fin-field">
                <span className="fin-field__label">받는 계좌</span>
                <select value={toId} onChange={(event) => setToId(event.target.value)}>
                  {ACCOUNTS.filter((account) => account.id !== fromId).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank} {account.type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="fin-field">
                <span className="fin-field__label">이체 금액</span>
                <span className="fin-field__input">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={amount > 0 ? amount.toLocaleString() : ''}
                    onChange={(event) => setAmountText(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                  <span>원</span>
                </span>
              </label>
              <div className="fin-chips">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmountText(String((amount || 0) + value))}
                  >
                    +{value >= 10_000 ? `${value / 10_000}만` : value.toLocaleString()}
                  </button>
                ))}
                <button type="button" onClick={() => setAmountText(String(fromBalance))}>
                  전액
                </button>
              </div>
              <p className={`fin-hint${transferError ? ' is-error' : ''}`}>
                {transferError || `출금 가능 금액 ${fromBalance.toLocaleString()}원`}
              </p>
              <button type="submit" className="fin-submit money-tappable" disabled={!canTransfer}>
                이체하기
              </button>
            </form>

            <h2 className="money-accounts__section-title fin-title">최근 이체 내역</h2>
            {transfers.length === 0 ? (
              <p className="fin-empty">이체 내역이 없어요</p>
            ) : (
              <div className="money-accounts__list">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="money-accounts__row">
                    <span className="money-accounts__row-info">
                      <span className="money-accounts__row-bank">{transfer.label}</span>
                      <span className="money-accounts__row-type">{transfer.when}</span>
                    </span>
                    <span className="money-accounts__row-value">{transfer.amount.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <p className="money__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="money" />
    </div>
  );
}

export default MoneyAccountsPage;
