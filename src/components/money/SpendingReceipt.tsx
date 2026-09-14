import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { icon, img } from '../../lib/asset';
import { StatusBar } from '../StatusBar';
import { useAppNavigation } from '../../navigation/AppNavigation';
import {
  CATEGORY_META,
  CATEGORY_PERCENTAGES,
  CATEGORY_TOTALS,
  CONSUME_CHANGE_PERCENT,
  CONSUME_DIFF,
  EXPENSE_TRANSACTIONS,
  TOP_CATEGORY,
  TOTAL_EXPENSE,
  findTransaction,
  formatFullDate,
  transactionApprovalNumber,
  transactionPaymentMethod,
  transactionTime,
  transactionsGroupedByDay,
} from '../../data/moneyTransactions';
import type { CategoryKey, ExpenseTransaction } from '../../data/moneyTransactions';

/* 소비 탭 "핵심 소비 인사이트" — 영수증 리디자인 전에 있던 카드. money.css 의
 * .money-highlight-insight 가 바로 이 카드용으로 이미 만들어져 있던 스타일이라 그대로 쓴다. */
const CONSUME_INSIGHT = {
  title: `이번 달은 ${TOP_CATEGORY.label}가 가장 많이 사용됐어요.`,
  sub: '특히 배달앱 이용이 지난달보다 3번 늘었어요.',
};

/* JADUYA — 돈관리 > 소비 탭 "디지털 영수증" UX.
 *
 * 핵심 경험: 탭 진입 → 영수증 출력 → 이번 달 소비 확인 → 거래 하나 눌러 상세 → 뒤로가기.
 * 여기 구현하는 화면은 정확히 4개뿐이다 — 진입 전 상태, 출력 애니메이션, 월간 영수증
 * (하단 간단 분석 포함), 거래 상세. 거래 상세의 "전체 영수증" 화면이나 별도 소비 분석
 * 페이지는 이번 버전 범위 밖이라 만들지 않는다.
 *
 * 출력 인터랙션 — 출력구는 화면에서 사라지지 않고 계속 그 자리에 있다. 종이가 나오는
 * 움직임은 "영수증 전체(거래 41건 + 분석 포함, 실측 3000px대)"가 아니라 화면에 한 번에
 * 들어오는 head 블록(기간·총액·검색/필터)만 0 → 실제 높이로 늘린다 — 전체를 늘리면
 * 늘어나는 대부분이 뷰포트 아래(화면 밖)에서 일어나 눈에 보이지 않기 때문이다(실측:
 * 전체 높이가 뷰포트의 4배 이상이라, 안 보이는 곳에서 다 자라버리고 화면에는 처음
 * 100~200ms만 보이고 멈춘 것처럼 보였다). head 가 다 나오면 그 아래 거래 목록·분석은
 * 늘어나는 애니메이션 없이 바로 이어붙는다 — 어차피 스크롤해서 보는 부분이다.
 * 탭에 들어올 때마다 매번 재생한다(요구사항). prefers-reduced-motion 에서는 늘리는
 * 과정 없이 바로 펼쳐진 상태로 보여준다. */
function usePrefersReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
}

/* 800ms 전체를 종이가 자라나는 데 그대로 쓴다 — 이전에는 프린터가 반짝인 뒤 150ms
 * 동안 아무것도 안 움직이다가 그제서야 종이가 자라기 시작해서, "프린터 작동 → (정지) →
 * 종이 출력"으로 끊어져 보였다(실제 피드백). 지연 없이 같은 프레임에서 같이 시작해야
 * 프린터가 계속 작동하며 종이가 쉬지 않고 나오는 느낌이 된다. */
const FEED_DURATION_MS = 800;

interface SpendingReceiptProps {
  onNotice: (message: string) => void;
}

export function SpendingReceipt({ onNotice }: SpendingReceiptProps) {
  const navigation = useAppNavigation();
  const reducedMotion = usePrefersReducedMotion();
  const feedRef = useRef<HTMLDivElement>(null);
  /* head 블록의 실제 콘텐츠 높이 — overflow:hidden 으로 감싸도 scrollHeight 는
   * 잘리지 않은 실제 높이를 그대로 준다. 이 값으로 늘어날 목표 높이를 정한다. */
  const [feedHeight, setFeedHeight] = useState(0);
  const [feeding, setFeeding] = useState(false);
  const [fed, setFed] = useState(reducedMotion);
  /* bodyVisible 은 head 가 다 자란 뒤(트랜지션이 "끝난" 시점)에만 true 가 된다.
   * fed 는 트랜지션을 "시작"하는 순간 true 가 되므로, 거래 목록을 fed 기준으로
   * 붙이면 머리가 다 나오기도 전에 목록이 같이 나타나 겹쳐 보인다(실제로 겪은 버그). */
  const [bodyVisible, setBodyVisible] = useState(reducedMotion);
  /* 프린터를 눌러 다시 출력할 때, 종이를 0으로 되돌리는 순간만 트랜지션을 꺼서
   * "훅 줄어드는" 게 안 보이게 한다(순간 리셋 → 다시 트랜지션 켜고 출력). */
  const [resetting, setResetting] = useState(false);
  const timersRef = useRef<{ raf: number | null; timeout: number | null }>({ raf: null, timeout: null });

  useEffect(() => {
    if (feedRef.current) setFeedHeight(feedRef.current.scrollHeight);
  }, []);

  const startFeeding = useCallback(() => {
    setFeeding(true);
    /* rAF 한 프레임만 기다린다 — height:0 이 실제로 한 번 페인트된 뒤에 목표
     * 높이로 바꿔야 트랜지션이 재생된다(그 프레임이 없으면 그냥 완성된 채로
     * 바로 그려진다). setTimeout(150) 같은 인위적 정지 구간은 두지 않는다. */
    timersRef.current.raf = requestAnimationFrame(() => setFed(true));
    timersRef.current.timeout = window.setTimeout(() => {
      setFeeding(false);
      setBodyVisible(true);
    }, FEED_DURATION_MS);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    startFeeding();
    return () => {
      if (timersRef.current.raf !== null) cancelAnimationFrame(timersRef.current.raf);
      if (timersRef.current.timeout !== null) window.clearTimeout(timersRef.current.timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  /* 프린터(출력구)를 누르면 처음부터 다시 출력한다 — 이미 재생 중이면 무시한다. */
  const handleReprint = () => {
    if (reducedMotion || feeding) return;
    if (timersRef.current.raf !== null) cancelAnimationFrame(timersRef.current.raf);
    if (timersRef.current.timeout !== null) window.clearTimeout(timersRef.current.timeout);

    setResetting(true);
    setFed(false);
    setBodyVisible(false);
    /* 두 프레임을 기다린다 — 첫 프레임에서 "트랜지션 없이 height:0" 이 실제로
     * 페인트되어야, 두 번째 프레임에서 트랜지션을 다시 켜고 목표 높이로 바꿨을 때
     * 되감기 애니메이션 없이 곧바로 새 출력이 재생된다. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setResetting(false);
        startFeeding();
      });
    });
  };

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const query = searchQuery.trim().toLowerCase();
  const groups = useMemo(
    () =>
      transactionsGroupedByDay((t) => {
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
        if (query && !t.merchant.toLowerCase().includes(query)) return false;
        return true;
      }),
    [selectedCategory, query],
  );

  const selectedTransaction = selectedTransactionId ? findTransaction(selectedTransactionId) : undefined;

  return (
    <div className="spend">
      <button
        type="button"
        className={`spend-printer${feeding ? ' spend-printer--active' : ''}`}
        onClick={handleReprint}
        disabled={feeding}
        aria-label="영수증 다시 출력하기"
      >
        <span className="spend-printer__body">
          <span className="spend-printer__slot" />
        </span>
      </button>

      <article className="spend-receipt" aria-label="이번 달 소비 영수증">
        {/* head 블록만 늘어나는 애니메이션의 대상이다 — 뷰포트 안에서 다 보이는 크기라
         * "종이가 나와서 뻗는" 움직임이 눈에 보인다(위 주석 참고). resetting 인 동안은
         * 트랜지션을 꺼서 0으로 되돌아가는 게 눈에 안 보이게 한다(프린터를 다시
         * 눌렀을 때 되감기 없이 바로 새 출력처럼 보이게). */}
        <div
          className={`spend-feed${fed ? ' is-fed' : ''}${resetting ? ' is-resetting' : ''}`}
          style={{ '--feed-h': `${feedHeight}px` } as CSSProperties}>
          <div className="spend-feed__inner" ref={feedRef}>
            <header className="spend-receipt__head">
              <p className="spend-receipt__period">2026. 09</p>
              <p className="spend-receipt__range">09.01 — 09.30</p>
            </header>

            <div className="spend-receipt__summary">
              <p className="spend-receipt__label">이번 달 소비</p>
              <p className="spend-receipt__amount">{`${TOTAL_EXPENSE.toLocaleString()}원`}</p>
              <p className="spend-receipt__meta">
                {`${EXPENSE_TRANSACTIONS.length}건의 결제 · 지난달보다 ${CONSUME_CHANGE_PERCENT}% ${
                  CONSUME_DIFF >= 0 ? '적게' : '더'
                }`}
              </p>
            </div>

            <div className="spend-receipt__divider spend-receipt__divider--dashed" role="presentation" />

            <div className="spend-filter">
              <label className="spend-search">
                <img src={icon('community-search.svg')} alt="" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="어디에서 쓴 돈을 찾을까요?"
                  aria-label="거래처 검색"
                />
              </label>
              <div className="spend-filter__pills" role="tablist" aria-label="카테고리 필터">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === 'all'}
                  className={`spend-filter__pill${selectedCategory === 'all' ? ' is-active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  전체
                </button>
                {CATEGORY_META.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === c.key}
                    className={`spend-filter__pill${selectedCategory === c.key ? ' is-active' : ''}`}
                    onClick={() => setSelectedCategory(c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* head 가 다 나온 뒤(fed)에만 붙는다 — 늘어나는 애니메이션 없이 그냥 이어진다.
         * 41건을 전부 늘리면 화면 밖에서 자라 안 보이던 문제(위 주석)를 여기서 피한다. */}
        {bodyVisible && (
          <div className="spend-receipt__body">
            <div className="spend-transactions">
              {groups.length === 0 ? (
                <p className="spend-empty">검색 결과가 없어요.</p>
              ) : (
                groups.map((group) => (
                  <div key={group.day} className="spend-day-group">
                    <p className="spend-day-group__label">{group.label}</p>
                    {group.items.map((t) => {
                      const meta = CATEGORY_META.find((c) => c.key === t.category);
                      if (!meta) return null;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className="spend-row money-tappable"
                          onClick={() => setSelectedTransactionId(t.id)}
                        >
                          <span
                            className="spend-row__badge"
                            style={{ background: `color-mix(in srgb, ${meta.color} 18%, white)`, color: meta.color }}
                          >
                            {t.merchant.charAt(0)}
                          </span>
                          <span className="spend-row__text">
                            <span className="spend-row__merchant">{t.merchant}</span>
                            <span className="spend-row__category">{meta.label}</span>
                          </span>
                          <span className="spend-row__amount">{`${t.amount.toLocaleString()}원`}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="spend-receipt__divider spend-receipt__divider--dashed" role="presentation" />

            <div className="spend-analysis">
              <p className="spend-analysis__title">카테고리별 소비</p>
              {CATEGORY_META.map((c) => (
                <div key={c.key} className="spend-analysis__row">
                  <span className="spend-analysis__label">{c.label}</span>
                  <span className="spend-analysis__track">
                    <span
                      className="spend-analysis__fill"
                      style={{ width: `${CATEGORY_PERCENTAGES[c.key]}%`, background: c.color }}
                    />
                  </span>
                  <span className="spend-analysis__value">{`${CATEGORY_TOTALS[c.key].toLocaleString()}원 · ${CATEGORY_PERCENTAGES[c.key]}%`}</span>
                </div>
              ))}
              <p className="spend-analysis__compare">
                {CONSUME_DIFF >= 0 ? (
                  <img src={icon('arrow-down.svg')} alt="" />
                ) : (
                  <span className="spend-analysis__compare-up" aria-hidden="true">
                    ▲
                  </span>
                )}
                {`지난달보다 ${Math.abs(CONSUME_DIFF).toLocaleString()}원 ${CONSUME_DIFF >= 0 ? '적게' : '더'} 썼어요.`}
              </p>
            </div>
          </div>
        )}
      </article>

      {/* 자두 인사이트 — 영수증 용지 밖, 카테고리별 소비 아래에 여백을 두고 별도 카드로 둔다
       * (영수증 안에 넣으면 출력 애니메이션 높이 계산에 끼어들고, 종이 질감과도 안 어울린다).
       * bodyVisible 과 같은 타이밍에 보여줘서 카테고리 분석과 함께 나타난다. */}
      {bodyVisible && (
        <button
          type="button"
          className="money-card money-highlight-insight money-highlight-insight--clickable money-tappable"
          onClick={() => navigation?.navigate('ai-chat')}
        >
          <img src={img('money-insight-badge.png')} alt="" className="money-highlight-insight__badge" />
          <p className="money-highlight-insight__title">{CONSUME_INSIGHT.title}</p>
          <p className="money-highlight-insight__sub">{CONSUME_INSIGHT.sub}</p>
        </button>
      )}

      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransactionId(null)}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}

interface TransactionDetailProps {
  transaction: ExpenseTransaction;
  onClose: () => void;
  onNotice: (message: string) => void;
}

/* 거래 상세 — 06번(전체 영수증 화면)을 만들지 않고, 이 화면 하나로 끝낸다.
 * 실제 프로젝트 데이터에 없는 가맹점 주소 등은 근거 없이 지어내지 않고 뺀다. */
function TransactionDetail({ transaction, onClose, onNotice }: TransactionDetailProps) {
  const meta = CATEGORY_META.find((c) => c.key === transaction.category);
  return (
    <div className="spend-detail" role="dialog" aria-modal="true" aria-label={`${transaction.merchant} 거래 상세`}>
      <StatusBar />
      <div className="spend-detail__head">
        <button type="button" className="spend-detail__back" aria-label="소비 내역으로 돌아가기" onClick={onClose}>
          <img src={icon('gnb-back.svg')} alt="" />
        </button>
        <h2>소비 상세</h2>
      </div>
      <div className="spend-detail__body">
        <span
          className="spend-detail__badge"
          style={
            meta
              ? { background: `color-mix(in srgb, ${meta.color} 18%, white)`, color: meta.color }
              : undefined
          }
        >
          {transaction.merchant.charAt(0)}
        </span>
        <p className="spend-detail__merchant">{transaction.merchant}</p>
        <p className="spend-detail__amount">{`${transaction.amount.toLocaleString()}원`}</p>
        <p className="spend-detail__datetime">
          {`${formatFullDate(transaction.day)} · ${transactionTime(transaction.id)}`}
        </p>

        <div className="spend-detail__divider" role="presentation" />

        <dl className="spend-detail__list">
          <div className="spend-detail__row">
            <dt>카테고리</dt>
            <dd>{meta?.label ?? '기타'}</dd>
          </div>
          <div className="spend-detail__row">
            <dt>결제수단</dt>
            <dd>{transactionPaymentMethod(transaction.id)}</dd>
          </div>
          <div className="spend-detail__row">
            <dt>승인번호</dt>
            <dd>{transactionApprovalNumber(transaction.id)}</dd>
          </div>
        </dl>

        <div className="spend-detail__divider" role="presentation" />

        <button
          type="button"
          className="spend-detail__memo"
          onClick={() => onNotice('메모 추가 기능은 준비 중이에요.')}
        >
          <img src={icon('community-pencil.svg')} alt="" />
          메모 추가하기
        </button>
        <button
          type="button"
          className="spend-detail__share auth-button"
          onClick={() => onNotice('영수증 공유하기 기능은 준비 중이에요.')}
        >
          영수증 공유하기
        </button>
      </div>
    </div>
  );
}

export default SpendingReceipt;
