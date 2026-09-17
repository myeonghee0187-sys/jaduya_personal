import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppNavigation } from '../navigation/AppNavigation';
import { useAuth } from '../auth/AuthContext';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import {
  useAllCommunityPosts,
  useAllCommunityComments,
  useIsCommunityDetailRoutable,
  useCommunityCommentCount,
} from '../community/communitySelectors';
import { BottomNavigation } from '../components/BottomNavigation';
import { GnbOverlay } from '../components/GnbOverlay';
import { MyMenuEdit } from '../components/MyMenuEdit';
import { SubPageHeader } from '../components/SubPageHeader';
import { SavedCard } from '../components/SavedCard';
import { SAVED_FILTERS, SAVED_CHIP_COLOR } from '../data/savedItems';
import { resolveCommunityPostImage } from '../data/communityPosts';
import type { SavedFilter, SavedItem } from '../data/savedItems';
import { getBenefitById } from '../data/benefits';
import { useMyMenu } from '../menu/MyMenuContext';
import { icon } from '../lib/asset';

/** 나의 활동 1차 탭 — '저장한 정보' 가 기본값이다 */
const ACTIVITY_TABS = ['저장한 정보', '작성한 글', '댓글'] as const;
type ActivityTab = (typeof ACTIVITY_TABS)[number];

/* 나의 활동 — 마이페이지 '나의 활동' / GNB 내 메뉴 '저장한 정보' 로 들어오는 하위 화면.
 * 1차 탭(저장한 정보 / 작성한 글 / 댓글) 아래에 각 탭의 내용을 둔다.
 * 새 헤더·탭바를 만들지 않고 SubPageHeader / BottomNavigation 을 그대로 쓴다.
 * 탭바는 마이페이지의 하위 화면이므로 '마이' active 를 유지한다.
 *
 * 세 탭 모두 마이페이지 전용 mock 데이터가 아니라 실제 커뮤니티/북마크 데이터를
 * authorId·savedPostIds 기준으로 필터링해서 보여준다(communitySelectors.ts,
 * BookmarkContext) — 원본 데이터가 바뀌면(글 작성, 댓글 작성, 북마크 토글) 이 화면도
 * 다시 열 때 그대로 반영된다. */
export function SavedPage() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const bookmarks = useBookmarks();
  const allCommunityPosts = useAllCommunityPosts();
  const allComments = useAllCommunityComments();
  const isRoutable = useIsCommunityDetailRoutable();
  const getCommentCount = useCommunityCommentCount();

  const [gnbOpen, setGnbOpen] = useState(false);
  const myMenu = useMyMenu();
  const requestedTab = navigation?.options.tab;
  const [tab, setTab] = useState<ActivityTab>(() =>
    requestedTab && (ACTIVITY_TABS as readonly string[]).includes(requestedTab)
      ? requestedTab as ActivityTab
      : '저장한 정보',
  );
  const [filter, setFilter] = useState<SavedFilter>('전체');
  const [filterOpen, setFilterOpen] = useState(false);
  /** 방금 저장 해제한 항목 — 토스트의 "되돌리기"가 다시 저장할 때 쓴다 */
  const [undoItem, setUndoItem] = useState<SavedItem | null>(null);
  const [notice, setNotice] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  /* 내가 쓴 글 — 정적 데모 게시글(communityPosts.ts)과 실제로 쓴 글을 구분하지 않고
   * authorId 로만 가려낸다. 댓글 수는 정적 comments 숫자 대신 실제 댓글 개수(게시글
   * 상세·커뮤니티 목록과 같은 기준)로 바꿔서 보여준다. */
  const myPosts = useMemo(
    () =>
      allCommunityPosts
        .filter((post) => post.authorId === user?.email)
        .map((post) => ({ ...post, comments: getCommentCount(post.id, post.comments) })),
    [allCommunityPosts, user?.email, getCommentCount],
  );

  /* 내가 쓴 댓글 — 마찬가지로 정적 데모 댓글(communityComments.ts) + 실제 댓글을 authorId 로 가려낸다 */
  const myComments = useMemo(
    () => allComments.filter((comment) => comment.authorId === user?.email),
    [allComments, user?.email],
  );

  /* 저장한 정보 — 커뮤니티 북마크(savedPostIds) + 혜택 북마크(savedBenefitIds)를
   * 실제 콘텐츠와 매칭해 SavedCard 가 그리는 모양(SavedItem)으로 바꾼다. */
  const savedCommunityItems = useMemo<SavedItem[]>(
    () =>
      bookmarks.savedPostIds
        .map((id) => allCommunityPosts.find((post) => post.id === id))
        .filter((post): post is NonNullable<typeof post> => Boolean(post))
        .map((post) => ({
          id: post.id,
          category: '커뮤니티',
          title: post.title,
          description: post.preview,
          savedAt: post.time,
          /* CommunityPostCard 와 같은 우선순위(resolveCommunityPostImage)로 이미지를
           * 정한다 — 실제 이미지가 없는 게시글(thumbEmoji만 있는 경우)만 undefined 가
           * 되어 아래 icon(장식용 아이콘)으로 자연스럽게 대체된다. */
          thumbnail: resolveCommunityPostImage(post),
          icon: 'community-book.svg',
        })),
    [bookmarks.savedPostIds, allCommunityPosts],
  );

  const savedBenefitItems = useMemo<SavedItem[]>(
    () =>
      bookmarks.savedBenefitIds
        .map((id) => getBenefitById(id))
        .filter((benefit): benefit is NonNullable<typeof benefit> => Boolean(benefit))
        .map((benefit) => ({
          id: benefit.id,
          category: '혜택',
          title: benefit.title,
          description: benefit.description,
          savedAt: benefit.deadline,
          icon: 'money-benefit-sparkle.svg',
        })),
    [bookmarks.savedBenefitIds],
  );

  /* 목록은 저장 순서(북마크 배열 순서)를 그대로 따른다 — 북마크에는 실제 저장 시각이
   * 없어 "최신순"으로 다시 정렬할 기준이 없다 */
  const items = useMemo(() => {
    const all = [...savedCommunityItems, ...savedBenefitItems];
    return filter === '전체' ? all : all.filter((item) => item.category === filter);
  }, [savedCommunityItems, savedBenefitItems, filter]);

  /* 바깥을 누르면 열린 목록을 닫는다 (터치·마우스 공통) */
  useEffect(() => {
    if (!filterOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [filterOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice('');
      setUndoItem(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* 저장 해제 — BookmarkContext 에 바로 반영한다(로컬로만 감추는 게 아니다).
   * 되돌리기는 같은 id 를 다시 toggle 해서 원래 저장 목록에 되돌린다. */
  const unsave = (item: SavedItem) => {
    if (item.category === '혜택') bookmarks.removeBenefit(item.id);
    else bookmarks.remove(item.id);
    setUndoItem(item);
    setNotice('저장을 해제했어요.');
  };

  const undo = () => {
    if (!undoItem) return;
    if (undoItem.category === '혜택') bookmarks.toggleBenefit(undoItem.id);
    else bookmarks.toggle(undoItem.id);
    setUndoItem(null);
    setNotice('');
  };

  /** 저장한 정보 항목 열기 — 커뮤니티 글이면 기존 게시글 상세(CommunityPostDetailPanel)로,
   * 혜택이면 기존 혜택 상세로 보낸다. 게시판/자취 꿀팁/지역 후기 전용 정적 글처럼 기존
   * 앱에 상세 화면 자체가 없는 콘텐츠는 안내만 띄운다(새 상세 화면을 만들지 않는다). */
  const openItem = (item: SavedItem) => {
    if (item.category === '커뮤니티' && isRoutable(item.id)) {
      navigation?.navigate('community', { postId: item.id, returnTo: 'saved', returnTab: tab });
      return;
    }
    if (item.category === '혜택') {
      navigation?.navigate('benefit-detail', { benefitId: item.id, returnTo: 'saved' });
      return;
    }
    setUndoItem(null);
    setNotice(item.title + ' 화면은 준비 중이에요.');
  };

  /** 작성한 글 / 댓글 항목 열기 — 둘 다 결국 커뮤니티 게시글 상세로 이동한다.
   * 내가 쓴 글·댓글은 항상 COMMUNITY_POSTS 또는 실제 작성 글에만 존재해서 always routable. */
  const openPost = (postId: string) => {
    navigation?.navigate('community', { postId, returnTo: 'saved', returnTab: tab });
  };

  return (
    <div className="saved app">
      <SubPageHeader
        title="나의 활동"
        backLabel="마이페이지로"
        onBack={() => navigation?.navigate('my')}
        onMenu={() => setGnbOpen(true)}
      />

      {/* 1차 탭 — 헤더 바로 아래에 고정한다. 다른 세부 화면과 같은 공통 탭 UI(.dc-tabs)를
        * 그대로 쓴다 — 탭 전환 로직(setTab)만 이 화면 것이다. */}
      <nav className="dc-tabs" role="tablist" aria-label="나의 활동">
        {ACTIVITY_TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={`dc-tabs__tab${tab === name ? ' is-active' : ''}`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>

      <main className="saved__scroll">
        {tab === '저장한 정보' && (
          <>
            {/* ① 개수 + 카테고리 드롭다운 — 기본값 '전체' */}
            <div className="saved__summary">
              <p className="saved__count">총 {items.length}개의 저장한 정보</p>
              <div className="saved__controls" ref={menuRef}>
                <div className="saved__sort">
                  <button
                    type="button"
                    className="saved__sort-button"
                    aria-expanded={filterOpen}
                    onClick={() => setFilterOpen((open) => !open)}
                  >
                    {filter}
                    <img src={icon('chevron-down.svg')} alt="" />
                  </button>
                  <ul className="saved__sort-list" hidden={!filterOpen}>
                    {SAVED_FILTERS.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className={name === filter ? 'is-active' : undefined}
                          aria-current={name === filter}
                          onClick={() => {
                            setFilter(name);
                            setFilterOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ② 목록 — 카드는 데이터로만 만든다.
             * 저장 데이터가 0개면 Empty State, 있으면 카드 목록. */}
            {items.length > 0 ? (
              <>
                <div className="saved__list">
                  {items.map((item) => (
                    <SavedCard key={item.id} item={item} bookmarked onToggleBookmark={() => unsave(item)} onOpen={openItem} />
                  ))}
                </div>
                <p className="saved__footer">저장된 콘텐츠가 모두 표시되었습니다.</p>
              </>
            ) : (
              /* Figma saved_empty (1565:7114) — 저장 데이터가 0개일 때 기본으로 보여준다 */
              <div className="saved__empty">
                <div className="saved__empty-copy">
                  <b>아직 저장한 정보가 없어요.</b>
                  <p>
                    지금 필요한 정보를 저장하고
                    <br />
                    나중에 다시 확인해보세요.
                  </p>
                </div>
                {/* 콘텐츠를 둘러볼 곳은 생활 메인 — 새 route 를 만들지 않고 기존 화면으로 보낸다 */}
                <button type="button" className="saved__empty-cta" onClick={() => navigation?.navigate('life')}>
                  콘텐츠 둘러보기
                </button>
              </div>
            )}
          </>
        )}

        {tab === '작성한 글' && (
          <>
            <p className="saved__count">총 {myPosts.length}개의 작성한 글</p>
            {myPosts.length > 0 ? (
              <div className="saved__activity-list">
                {myPosts.map((post) => (
                  <button key={post.id} type="button" className="saved__activity-item" onClick={() => openPost(post.id)}>
                    <span className="saved__activity-chip" style={{ background: SAVED_CHIP_COLOR['커뮤니티'] }}>
                      {post.category}
                    </span>
                    <b className="saved__activity-title">{post.title}</b>
                    <small className="saved__activity-preview">{post.preview}</small>
                    <span className="saved__activity-meta">
                      <span>{post.time}</span>
                      <span>댓글 {post.comments}</span>
                      <span>좋아요 {post.likes}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="saved__empty">
                <div className="saved__empty-copy">
                  <b>아직 작성한 글이 없어요.</b>
                  <p>
                    커뮤니티에 첫 글을 남기면
                    <br />
                    여기서 모아볼 수 있어요.
                  </p>
                </div>
                <button type="button" className="saved__empty-cta" onClick={() => navigation?.navigate('community')}>
                  커뮤니티 둘러보기
                </button>
              </div>
            )}
          </>
        )}

        {tab === '댓글' && (
          <>
            <p className="saved__count">총 {myComments.length}개의 댓글</p>
            {myComments.length > 0 ? (
              <div className="saved__activity-list">
                {myComments.map((comment) => {
                  const post = allCommunityPosts.find((candidate) => candidate.id === comment.postId);
                  return (
                    <button
                      key={comment.id}
                      type="button"
                      className="saved__activity-item"
                      onClick={() => openPost(comment.postId)}
                    >
                      <b className="saved__activity-title">{comment.body}</b>
                      {post && (
                        <small className="saved__comment-source">
                          {post.category} · {post.title}
                        </small>
                      )}
                      <span className="saved__activity-meta">
                        <span>{comment.time}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="saved__empty">
                <div className="saved__empty-copy">
                  <b>아직 작성한 댓글이 없어요.</b>
                  <p>
                    관심 있는 글에 댓글을 남기면
                    <br />
                    여기서 모아볼 수 있어요.
                  </p>
                </div>
                <button type="button" className="saved__empty-cta" onClick={() => navigation?.navigate('community')}>
                  커뮤니티 둘러보기
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <p className="saved__notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
        {undoItem !== null && (
          <button type="button" onClick={undo}>
            되돌리기
          </button>
        )}
      </p>

      {/* 마이페이지 하위 화면이라 '마이' active 를 유지한다 */}
      <BottomNavigation activeTab="my" />
      <GnbOverlay open={gnbOpen} myMenu={myMenu.myMenu} onClose={() => setGnbOpen(false)} onEditMenu={myMenu.openEdit} />
      <MyMenuEdit open={myMenu.editOpen} draft={myMenu.draft} onClose={myMenu.closeEdit} onSave={myMenu.saveEdit} />
    </div>
  );
}

export default SavedPage;
