import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { icon, img } from '../lib/asset';
import { useAuth } from '../auth/AuthContext';
import type { Persona } from '../auth/mockUsers';
import { useCommunityPosts } from '../community/CommunityPostsContext';
import type { WriteDraft } from '../community/drafts';
import { readDrafts, writeDrafts } from '../community/drafts';
import type { CommunityPost } from '../data/communityPosts';
import { tipCategoryIdForLabel } from '../data/communityPosts';
import { PERSONA_PROFILE } from '../data/personaProfile';
import { BellButton } from './BellButton';
import { CommunityDraftListPanel } from './CommunityDraftListPanel';
import { StatusBar } from './StatusBar';

/** 태그 하나에 허용하는 최대 개수 — 카테고리 칩으로 자동 붙는 1개 + 직접 입력 3개 */
const MAX_HASHTAGS = 4;

const LEVEL_OPTIONS = ['초보', '중수', '고수', '전문가'];
const POST_TYPE_OPTIONS = ['정보', '질문', '후기', '잡담'];
const HASHTAG_CATEGORY_OPTIONS = ['고정·관리', '자취·식비', '인테리어', '청소·정리', '생활문제', '기타'];

interface PersonaSamplePost {
  level: string;
  title: string;
  body: string;
  postType: string;
  hashtagCategory: string;
  extraHashtags: string[];
}

/** "예시로 빠르게 써보기" 버튼이 채우는 내용 — persona 별로 실제 겪을 법한 고민을 다르게 둔다.
 * 해시태그는 카테고리 자동 태그(1개) + 직접 태그 3개로 MAX_HASHTAGS(4)를 정확히 채운다. */
const PERSONA_SAMPLE_POST: Record<Persona, PersonaSamplePost> = {
  beginner: {
    level: '초보',
    title: '처음 계약하는 거라 보증금 떼일까봐 무서워요',
    body: '이제 곧 첫 자취를 시작하는데 계약서도 등기부등본도 처음 봐서 뭘 확인해야 하는지 하나도 모르겠어요. 보증금 떼이는 사고 뉴스를 하도 많이 봐서 계약하기가 겁나는데, 계약 전에 꼭 확인해야 할 것들 알려주세요.',
    postType: '질문',
    hashtagCategory: '생활문제',
    extraHashtags: ['#자취초보', '#첫계약', '#보증금'],
  },
  worker: {
    level: '고수',
    title: '야근하고 오면 저녁 챙겨먹기가 너무 힘들어요',
    body: '퇴근이 늦어지는 날은 저녁을 그냥 굶거나 배달만 시켜 먹게 되는데, 배달비가 매달 만만치 않게 나가요. 평일 저녁 대충이라도 챙겨 먹으면서 배달비도 줄일 수 있는 방법 있을까요?',
    postType: '질문',
    hashtagCategory: '자취·식비',
    extraHashtags: ['#배달비절약', '#야근러', '#원룸살림'],
  },
  pet: {
    level: '중수',
    title: '고양이 키우는 투룸, 털 때문에 청소가 끝이 없어요',
    body: '아무리 매일 청소기를 돌려도 소파랑 옷에 고양이 털이 계속 붙어있어요. 투룸이라 청소할 공간도 넓어서 더 힘든데, 반려동물 키우면서 털 관리하는 노하우 있으면 공유해주세요.',
    postType: '질문',
    hashtagCategory: '청소·정리',
    extraHashtags: ['#고양이집사', '#반려동물자취', '#털청소'],
  },
};

interface CommunityWritePanelProps {
  open: boolean;
  onClose: () => void;
}

/* 커뮤니티 '글쓰기' — Figma create_post (1742:7314).
 * GNB 전체메뉴와 같은 방식(hidden + CSS transition)으로 오른쪽에서 슬라이드인한다.
 * 뒤로가기/닫기를 누르면 바로 닫히지 않고, 나가기 확인 다이얼로그를 먼저 띄운다.
 * 등록은 CommunityPostsContext 에 저장돼 전체/질문/자취 꿀팁 목록에 바로 반영되고,
 * 임시저장은 localStorage 에 쌓여 임시목록 버튼 위 빨간 점으로 표시된다. "임시목록"
 * 버튼은 글쓰기와 같은 방식(오른쪽 슬라이드인)으로 CommunityDraftListPanel 을 그 위에
 * 한 겹 더 연다 — 거기서 "수정하기" 를 누르면 그 임시글 내용이 이 폼에 그대로 채워지고
 * (editingDraftId 로 기억), 그 상태에서 등록에 성공하면 그 임시글 하나만 사라진다.
 * 사진 첨부는 FileReader 로 data URL 을 만들어 미리보기로 보여주고 등록 시 같이 저장한다
 * (카메라 촬영·파일 첨부는 아직 화면이 없어 '준비 중' 토스트로 안내한다).
 * 뱃지는 이모지 대신 로그인 계정의 프로필 사진(user.profileImage 또는 persona 기본 사진)을 쓴다.
 * 레벨/게시글종류/해시태그 카테고리는 기본 선택 없이 시작해 사용자가 직접 골라야 한다.
 * 등록을 누른 뒤에만(attemptedSubmit) 미작성 항목으로 스크롤 이동 + 안내 문구를 보여준다. */
export function CommunityWritePanel({ open, onClose }: CommunityWritePanelProps) {
  const { user } = useAuth();
  const { addPost } = useCommunityPosts();
  const [level, setLevel] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState<string | null>(null);
  const [hashtagCategory, setHashtagCategory] = useState<string | null>(null);
  const [hashtagText, setHashtagText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [drafts, setDrafts] = useState<WriteDraft[]>(() => readDrafts());
  const [draftListOpen, setDraftListOpen] = useState(false);
  /** 지금 이 폼이 어떤 임시글을 불러와 수정하는 중인지 — 등록에 성공하면 이 임시글만 지운다 */
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  /** 첨부한 사진 — data URL. 백엔드가 없어 그대로 게시글 데이터에 들고 다닌다 */
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const levelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const postTypeRef = useRef<HTMLElement>(null);
  const hashtagRef = useRef<HTMLElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    level !== null &&
    title.trim() !== '' &&
    body.trim() !== '' &&
    postType !== null &&
    hashtagCategory !== null;

  const isEmpty =
    level === null &&
    title.trim() === '' &&
    body.trim() === '' &&
    postType === null &&
    hashtagCategory === null &&
    hashtagText.trim() === '' &&
    hashtags.length === 0 &&
    attachedImage === null;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const resetForm = () => {
    setLevel(null);
    setTitle('');
    setBody('');
    setPostType(null);
    setHashtagCategory(null);
    setHashtagText('');
    setHashtags([]);
    setAttemptedSubmit(false);
    setAttachedImage(null);
    setEditingDraftId(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const requestClose = () => {
    if (isEmpty) {
      resetForm();
      onClose();
      return;
    }
    setConfirmOpen(true);
  };
  const cancelClose = () => setConfirmOpen(false);
  const confirmClose = () => {
    setConfirmOpen(false);
    resetForm();
    onClose();
  };

  /* '#' 로 구간을 나눠 한 번에 여러 태그를 추가한다 — "#예시 #예시2" 처럼 연속으로 써도
   * 각각 태그가 되고, '#' 없이 "예시" 하나만 써도 기존처럼 한 개만 추가된다. 남은 자리
   * 수를 넘는 태그와 이미 있는 태그는 조용히 건너뛴다. */
  const addHashtag = () => {
    const tokens = hashtagText
      .split('#')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
    if (tokens.length === 0) return;
    setHashtags((prev) => {
      const next = [...prev];
      for (const token of tokens) {
        if (next.length >= MAX_HASHTAGS) break;
        const tag = `#${token}`;
        if (!next.includes(tag)) next.push(tag);
      }
      return next;
    });
    setHashtagText('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((item) => item !== tag));
  };

  /* 해시태그 카테고리를 고르면 아래 태그 목록에도 같은 값이 보이게 한다 — 카테고리를 바꾸면
   * 이전에 이렇게 자동으로 붙은 태그만 빼고 새 태그를 붙인다(직접 입력한 태그는 그대로 둔다) */
  const selectHashtagCategory = (option: string) => {
    if (option === hashtagCategory) return;
    setHashtags((prev) => {
      const withoutPrev = hashtagCategory ? prev.filter((tag) => tag !== `#${hashtagCategory}`) : prev;
      const nextTag = `#${option}`;
      if (withoutPrev.includes(nextTag) || withoutPrev.length >= MAX_HASHTAGS) return withoutPrev;
      return [...withoutPrev, nextTag];
    });
    setHashtagCategory(option);
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAttachedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (level === null) {
      setAttemptedSubmit(true);
      levelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (title.trim() === '') {
      setAttemptedSubmit(true);
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleRef.current?.focus();
      return;
    }
    if (body.trim() === '') {
      setAttemptedSubmit(true);
      bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bodyRef.current?.focus();
      return;
    }
    if (postType === null) {
      setAttemptedSubmit(true);
      postTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (hashtagCategory === null) {
      setAttemptedSubmit(true);
      hashtagRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const firstLine = body.trim().split('\n')[0] ?? '';
    const preview = firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine;
    const persona = PERSONA_PROFILE[user?.persona ?? 'beginner'];

    addPost({
      id: `own-${Date.now()}`,
      hashtag: `#${hashtagCategory}`,
      category: postType,
      title: title.trim(),
      preview,
      body: body.trim(),
      badge: '✍️',
      badgeImage: user?.profileImage ?? img(persona.profileImage),
      author: user?.name ?? '자두메이트',
      time: '방금 전',
      likes: 0,
      comments: 0,
      thumbEmoji: '📝',
      thumbDataUrl: attachedImage ?? undefined,
      tipCategory: tipCategoryIdForLabel(hashtagCategory),
      level: level as CommunityPost['level'],
    });

    /* 임시글을 불러와 수정하던 중이었다면, 실제로 등록됐으니 그 임시글만 목록에서 지운다 */
    if (editingDraftId) {
      const nextDrafts = drafts.filter((draft) => draft.id !== editingDraftId);
      writeDrafts(nextDrafts);
      setDrafts(nextDrafts);
    }
    resetForm();
    onClose();
  };

  const handleSaveDraft = () => {
    if (isEmpty) {
      setNotice('저장할 내용이 없어요.');
      return;
    }
    const savedAt = new Date().toISOString();
    /* 임시글을 불러와 수정하던 중이면 새로 만들지 않고 그 항목을 덮어쓴다 */
    const nextDrafts = editingDraftId
      ? drafts.map((draft) =>
          draft.id === editingDraftId
            ? { ...draft, level, title, body, postType, hashtagCategory, hashtags, attachedImage, savedAt }
            : draft,
        )
      : [
          {
            id: `draft-${Date.now()}`,
            level,
            title,
            body,
            postType,
            hashtagCategory,
            hashtags,
            attachedImage,
            savedAt,
          },
          ...drafts,
        ];
    writeDrafts(nextDrafts);
    setDrafts(nextDrafts);
    setNotice('임시저장했어요.');
    resetForm();
  };

  const handleEditDraft = (draft: WriteDraft) => {
    setLevel(draft.level);
    setTitle(draft.title);
    setBody(draft.body);
    setPostType(draft.postType);
    setHashtagCategory(draft.hashtagCategory);
    setHashtags(draft.hashtags);
    setAttachedImage(draft.attachedImage);
    setEditingDraftId(draft.id);
    setDraftListOpen(false);
  };

  const handleDeleteDraft = (id: string) => {
    const nextDrafts = drafts.filter((draft) => draft.id !== id);
    writeDrafts(nextDrafts);
    setDrafts(nextDrafts);
    if (editingDraftId === id) setEditingDraftId(null);
  };

  /* "예시로 빠르게 써보기" — 로그인한 persona 의 고민 예시로 폼 전체를 채운다.
   * 태그는 카테고리 자동 태그 + 직접 태그로 미리 조합해두므로 selectHashtagCategory 를
   * 거치지 않고 hashtags 를 통째로 새로 지정한다. */
  const handleFillSample = () => {
    const sample = PERSONA_SAMPLE_POST[user?.persona ?? 'beginner'];
    setLevel(sample.level);
    setTitle(sample.title);
    setBody(sample.body);
    setPostType(sample.postType);
    setHashtagCategory(sample.hashtagCategory);
    setHashtags([`#${sample.hashtagCategory}`, ...sample.extraHashtags]);
    setHashtagText('');
    setAttachedImage(null);
    setEditingDraftId(null);
    setAttemptedSubmit(false);
  };

  return (
    <>
    <section className="layer write-panel" hidden={!open} aria-label="글쓰기">
      <div className="write-panel__header">
        <StatusBar />
        <div className="nav-header">
          <div className="write-panel__title-button">
            <button type="button" className="write-panel__back" aria-label="뒤로" onClick={requestClose}>
              <img src={icon('gnb-back.svg')} alt="" />
            </button>
            <span className="write-panel__title">글쓰기</span>
          </div>
          <div className="header-actions">
            <BellButton />
            {/* 공용 HeaderIconButton 은 bell / menu 전용이라 여기서만 따로 그린다.
              * 크기·위치는 같아 보이도록 헤더 버튼 공용 클래스를 그대로 쓴다. */}
            <button
              type="button"
              className="header-icon-button"
              aria-label="글쓰기 닫기"
              onClick={requestClose}
            >
              <img src={icon('gnb-close.svg')} alt="" />
            </button>
          </div>
        </div>
      </div>

      <div className="write-panel__scroll">
        <div className="write-panel__content">
          <button type="button" className="write-panel__sample-btn" onClick={handleFillSample}>
            예시로 빠르게 써보기
          </button>

          <section className="write-panel__section" ref={levelRef}>
            <div className="write-panel__label-row">
              <p className="write-panel__label">레벨 선택</p>
              <button
                type="button"
                className="write-panel__draft-list-btn"
                onClick={() => setDraftListOpen(true)}
              >
                임시목록
                {drafts.length > 0 && <span className="write-panel__draft-list-badge" aria-hidden="true" />}
              </button>
            </div>
            <div className="write-panel__chips">
              {LEVEL_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`write-panel__chip${option === level ? ' is-selected' : ''}`}
                  aria-pressed={option === level}
                  disabled={option === '전문가'}
                  onClick={() => setLevel(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="write-panel__section">
            <p className="write-panel__label">제목</p>
            <input
              ref={titleRef}
              type="text"
              className="write-panel__input"
              placeholder="제목을 입력해주세요"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </section>

          <section className="write-panel__section">
            <p className="write-panel__label">본문</p>
            <textarea
              ref={bodyRef}
              className="write-panel__textarea"
              placeholder="자취 생활 이야기를 편하게 들려주세요"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
            <div className="write-panel__attach-row">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageSelect}
              />
              <button
                type="button"
                className="write-panel__attach-btn"
                aria-label="사진 첨부"
                onClick={() => imageInputRef.current?.click()}
              >
                <img src={icon('community-write-image.svg')} alt="" />
              </button>
              <button
                type="button"
                className="write-panel__attach-btn"
                aria-label="카메라로 촬영"
                onClick={() => setNotice('카메라 촬영은 준비 중이에요.')}
              >
                <img src={icon('community-write-camera.svg')} alt="" />
              </button>
              <button
                type="button"
                className="write-panel__attach-btn"
                aria-label="파일 첨부"
                onClick={() => setNotice('파일 첨부는 준비 중이에요.')}
              >
                <img src={icon('community-write-attach.svg')} alt="" />
              </button>
            </div>
            {attachedImage && (
              <div className="write-panel__image-preview">
                <img src={attachedImage} alt="첨부한 사진 미리보기" />
                <button type="button" aria-label="첨부한 사진 삭제" onClick={removeAttachedImage}>
                  <img src={icon('gnb-close.svg')} alt="" />
                </button>
              </div>
            )}
          </section>

          <section className="write-panel__section" ref={postTypeRef}>
            <div className="write-panel__chips">
              {POST_TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`write-panel__chip${option === postType ? ' is-selected' : ''}`}
                  aria-pressed={option === postType}
                  onClick={() => setPostType(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="write-panel__section" ref={hashtagRef}>
            <p className="write-panel__label">해시태그</p>
            <div className="write-panel__chips">
              {HASHTAG_CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`write-panel__chip${option === hashtagCategory ? ' is-selected' : ''}`}
                  aria-pressed={option === hashtagCategory}
                  onClick={() => selectHashtagCategory(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="write-panel__hashtag-input-row">
              <input
                type="text"
                className="write-panel__input"
                placeholder="# 해시태그를 입력해주세요 (예: #자취꿀팁)"
                value={hashtagText}
                disabled={hashtags.length >= MAX_HASHTAGS}
                onChange={(event) => setHashtagText(event.target.value)}
              />
              <button
                type="button"
                className="write-panel__hashtag-add"
                disabled={hashtags.length >= MAX_HASHTAGS}
                onClick={addHashtag}
              >
                추가
              </button>
            </div>
            {hashtags.length > 0 && (
              <div className="write-panel__hashtag-list">
                {hashtags.map((tag) => (
                  <span key={tag} className="write-panel__hashtag-tag">
                    {tag}
                    <button type="button" aria-label={`${tag} 삭제`} onClick={() => removeHashtag(tag)}>
                      <img src={icon('gnb-close.svg')} alt="" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="write-panel__actions-wrap">
        {attemptedSubmit && !canSubmit && (
          <p className="write-panel__required-hint">* 표시된 항목을 모두 작성해주세요</p>
        )}

        <div className="write-panel__actions">
          <button type="button" className="write-panel__save" onClick={handleSaveDraft}>
            임시저장
          </button>
          <button type="button" className="write-panel__submit" onClick={handleSubmit}>
            등록
          </button>
        </div>
      </div>

      <p className="community-notice" role="status" aria-live="polite" hidden={!notice}>
        {notice}
      </p>

      {confirmOpen && (
        <>
          <button
            type="button"
            className="write-panel__confirm-dim"
            aria-label="나가기 취소"
            onClick={cancelClose}
          />
          <div className="write-panel__confirm-card" role="alertdialog" aria-labelledby="write-panel-confirm-title">
            <p id="write-panel-confirm-title" className="write-panel__confirm-title">
              나가시겠습니까?
            </p>
            <p className="write-panel__confirm-desc">작성 중인 내용은 삭제됩니다</p>
            <div className="write-panel__confirm-actions">
              <button type="button" className="write-panel__confirm-no" onClick={cancelClose}>
                아니요
              </button>
              <button type="button" className="write-panel__confirm-yes" onClick={confirmClose}>
                예
              </button>
            </div>
          </div>
        </>
      )}
    </section>
    <CommunityDraftListPanel
      open={draftListOpen}
      drafts={drafts}
      onClose={() => setDraftListOpen(false)}
      onEdit={handleEditDraft}
      onDelete={handleDeleteDraft}
    />
    </>
  );
}

export default CommunityWritePanel;
