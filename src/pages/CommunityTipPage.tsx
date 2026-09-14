import { useEffect, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { AIChatbot } from '../components/ai/AIChatbot';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { CommunityWritePanel } from '../components/CommunityWritePanel';
import { COMMUNITY_TABS, COMMUNITY_TIP_TAB, TIP_CATEGORIES, TIP_POSTS } from '../data/communityPosts';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

/* 서브탭 라벨을 좁은 화면에서 정확히 지정된 지점으로 두 줄로 나눈다
 * ("고정비·관리비" → "고정비" / "관리비", "생활 문제 해결" → "생활 문제" / "해결").
 * '·' 가 있으면 그 자리에서, 없으면 마지막 공백에서 나눈다. 넓은 화면에서는
 * CSS 로 구분자(·)만 보이고 줄바꿈은 숨긴다 — TIP_CATEGORIES 라벨 순서를
 * 그대로 유지한다. */
function renderTipLabel(label: string) {
  const dotIndex = label.indexOf('·');
  if (dotIndex !== -1) {
    return (
      <>
        {label.slice(0, dotIndex)}
        <span className="tip-category__label-dot" aria-hidden="true">
          ·
        </span>
        <br className="tip-category__label-break" />
        {label.slice(dotIndex + 1)}
      </>
    );
  }
  const spaceIndex = label.lastIndexOf(' ');
  if (spaceIndex === -1) return label;
  return (
    <>
      {label.slice(0, spaceIndex)}{' '}
      <br className="tip-category__label-break" />
      {label.slice(spaceIndex + 1)}
    </>
  );
}

/* 커뮤니티 '자취 꿀팁' — 헤더·탭바·글쓰기 버튼·게시글 카드는 question 화면과 같은 레이아웃을
 * 그대로 쓴다 (카드는 CommunityPostCard, chips 행만 없음). 정렬 필터 대신 이 탭 전용
 * 서브탭(TipTiles, Figma tip 2257:13827)을 둔다. */
export function CommunityTipPage() {
  const navigation = useAppNavigation();
  const [gnbOpen, setGnbOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const myMenu = useMyMenu();
  const [category, setCategory] = useState<string>(TIP_CATEGORIES[0].id);
  const bookmarks = useBookmarks();
  const [liked, setLiked] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]));

  const visiblePosts = TIP_POSTS.filter((post) => post.tipCategory === category);

  return (
    <div className="community app">
      <SubPageHeader
        title="커뮤니티"
        backLabel="커뮤니티 홈으로"
        onBack={() => navigation?.navigate('community')}
        onMenu={() => setGnbOpen(true)}
      />

      <main className="community__scroll">
        {/* ============ 검색 — 커뮤니티 홈과 같은 입력창, 타이틀 문구는 없음 ============ */}
        <section className="community-search">
          <div className="community-search__input">
            <input
              ref={searchRef}
              type="search"
              value={keyword}
              placeholder="다른 자취러들의 꿀팁을 찾아보세요"
              aria-label="자취 꿀팁 검색"
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button
                type="button"
                className="community-search__icon"
                aria-label="검색어 지우기"
                onClick={() => {
                  setKeyword('');
                  searchRef.current?.focus();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6 18 18M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            <button type="button" className="community-search__icon" aria-label="검색">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M16.5 16.5 21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </section>

        {/* ============ 탭 — '전체' / '질문' 은 각자의 화면으로 돌아간다 ============ */}
        <nav className="community-tabs" aria-label="커뮤니티 분류">
          {COMMUNITY_TABS.map((name) => (
            <button
              key={name}
              type="button"
              className={`community-tabs__tab${name === COMMUNITY_TIP_TAB ? ' is-active' : ''}`}
              aria-current={name === COMMUNITY_TIP_TAB ? 'page' : undefined}
              onClick={() => {
                if (name === '전체') navigation?.navigate('community');
                else if (name === '질문') navigation?.navigate('community-question');
                else if (name === '지역 후기') navigation?.navigate('community-region');
                else if (name === '소비 비교') navigation?.navigate('community-spend-compare');
              }}
            >
              {name}
            </button>
          ))}
        </nav>

        {/* ============ 자취 꿀팁 전용 서브탭 ============ */}
        <div className="tip-categories" role="tablist" aria-label="자취 꿀팁 카테고리">
          {TIP_CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`tip-category${active ? ' is-active' : ''}`}
                onClick={() => setCategory(item.id)}
              >
                <span className="tip-category__circle">
                  <span
                    className="tip-category__glyph"
                    style={{ maskImage: `url(${icon(item.icon)})`, WebkitMaskImage: `url(${icon(item.icon)})` }}
                    aria-hidden="true"
                  />
                </span>
                <span className="tip-category__label">{renderTipLabel(item.label)}</span>
              </button>
            );
          })}
        </div>

        {/* ============ 게시글 목록 — question 과 같은 카드, chips 행만 뺀다 ============ */}
        <section className="community-feed">
          <div className="community-feed__list">
            {visiblePosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                saved={bookmarks.isSaved(post.id)}
                liked={liked.includes(post.id)}
                onToggleSave={() => bookmarks.toggle(post.id)}
                onToggleLike={() => toggleLike(post.id)}
                showChips={false}
              />
            ))}
          </div>
        </section>
      </main>

      {/* 글쓰기 — 다른 커뮤니티 화면과 같은 위치·동작 */}
      <div className="community-fab">
        <button
          type="button"
          className="community-fab__button"
          onClick={() => setWriteOpen(true)}
        >
          <img src={icon('community-pencil.svg')} alt="" />
          글쓰기
        </button>
      </div>

      <p className="community-notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      <BottomNavigation activeTab="community" />
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
      <CommunityWritePanel open={writeOpen} onClose={() => setWriteOpen(false)} />
      <AIChatbot initialLift={68} />
    </div>
  );
}

export default CommunityTipPage;
