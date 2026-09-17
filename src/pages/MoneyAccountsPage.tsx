import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';
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
 * 은행 로고 이미지 파일은 쓰지 않는다(실제 브랜드 로고 아트워크를 그대로 가져오지 않는다) —
 * 대신 계좌 목록과 같은 원형 배지에 은행 이니셜을 넣는다. 카카오뱅크만 배지 배경 자체가
 * 브랜드 색(노랑)인 실제 UI 관례를 따르고, 나머지는 흰 배경 + 색 이니셜로 구분한다. */

interface ConnectableBank {
  id: string;
  label: string;
  initial: string;
  color: string;
  /** 카카오뱅크처럼 배지 배경 자체가 브랜드 색인 은행만 'solid' */
  fill?: 'solid';
}

const CONNECTABLE_BANKS: ConnectableBank[] = [
  { id: 'kakao', label: '카카오뱅크', initial: 'B', color: 'var(--brand-secondary)', fill: 'solid' },
  { id: 'kb', label: 'KB국민', initial: 'K', color: 'var(--brand-green)' },
  { id: 'shinhan', label: '신한은행', initial: 'S', color: '#4a6fa5' },
  { id: 'woori', label: '우리은행', initial: 'W', color: '#2f6fd6' },
  { id: 'hana', label: '하나은행', initial: 'H', color: 'var(--brand-orange)' },
  { id: 'nh', label: 'NH농협', initial: 'N', color: 'var(--brand-rose)' },
  { id: 'toss', label: '토스뱅크', initial: 'T', color: 'var(--brand-primary)' },
];

/** 은행 배지 색 — 'solid'(카카오뱅크)는 배경 자체가 브랜드 색, 나머지는 흰 배경 + 색 이니셜. */
function badgeStyle(color: string, fill?: 'solid'): CSSProperties {
  return fill === 'solid' ? { background: color, color: '#3a1d1d' } : { background: '#fff', color };
}

export function MoneyAccountsPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
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
        onMenu={() => setGnbOpen(true)}
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

        <div className="money-accounts__section-head">
          <h2 className="money-accounts__section-title">내 계좌 {ACCOUNTS.length}개</h2>
          <button
            type="button"
            className="money-accounts__connect-pill"
            onClick={() => setNotice('계좌 연결 기능은 준비 중이에요.')}
          >
            <img src={icon('plus-small.svg')} alt="" />
            계좌 연결하기
          </button>
        </div>

        <div className="money-accounts__list">
          {ACCOUNTS.map((account) => (
            <div key={account.id} className="money-accounts__row">
              <span
                className={`money-accounts__row-badge${account.fill === 'solid' ? ' is-solid' : ''}`}
                style={badgeStyle(account.color, account.fill)}
                aria-hidden="true"
              >
                {account.initial}
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
                <span
                  className={`money-accounts__bank-badge${bank.fill === 'solid' ? ' is-solid' : ''}`}
                  style={badgeStyle(bank.color, bank.fill)}
                  aria-hidden="true"
                >
                  {bank.initial}
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
      <GnbOverlay
        open={gnbOpen}
        myMenu={myMenu.myMenu}
        onClose={() => setGnbOpen(false)}
        onEditMenu={myMenu.openEdit}
      />
      <MyMenuEdit
        open={myMenu.editOpen}
        draft={myMenu.draft}
        onClose={myMenu.closeEdit}
        onSave={myMenu.saveEdit}
      />
    </div>
  );
}

export default MoneyAccountsPage;
