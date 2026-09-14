import { useEffect, useRef, useState } from 'react';
import { icon } from '../lib/asset';
import { BellButton } from './BellButton';
import { StatusBar } from './StatusBar';

const LEVEL_OPTIONS = ['초보', '중수', '고수', '전문가'];
const POST_TYPE_OPTIONS = ['정보', '질문', '후기', '잡담'];
const HASHTAG_CATEGORY_OPTIONS = ['고정비·관리비', '자취 요리·식비', '인테리어·수납', '청소·정리', '생활 문제 해결', '기타'];

interface CommunityWritePanelProps {
  open: boolean;
  onClose: () => void;
}

/* 커뮤니티 '글쓰기' — Figma create_post (1742:7314).
 * GNB 전체메뉴와 같은 방식(hidden + CSS transition)으로 오른쪽에서 슬라이드인한다.
 * 뒤로가기/닫기를 누르면 바로 닫히지 않고, 나가기 확인 다이얼로그를 먼저 띄운다.
 * 백엔드가 없어 등록·임시저장·사진 첨부·임시목록은 '준비 중' 토스트로 처리한다.
 * 레벨/게시글종류/해시태그 카테고리는 기본 선택 없이 시작해 사용자가 직접 골라야 한다.
 * 등록을 누른 뒤에만(attemptedSubmit) 미작성 항목으로 스크롤 이동 + 안내 문구를 보여준다. */
export function CommunityWritePanel({ open, onClose }: CommunityWritePanelProps) {
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

  const levelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const postTypeRef = useRef<HTMLElement>(null);
  const hashtagRef = useRef<HTMLElement>(null);

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
    hashtags.length === 0;

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

  const addHashtag = () => {
    const trimmed = hashtagText.trim();
    if (!trimmed || hashtags.length >= 3) return;
    const tag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (hashtags.includes(tag)) {
      setHashtagText('');
      return;
    }
    setHashtags((prev) => [...prev, tag]);
    setHashtagText('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((item) => item !== tag));
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
    setNotice('게시글 등록은 준비 중이에요.');
  };

  return (
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
          <section className="write-panel__section" ref={levelRef}>
            <div className="write-panel__label-row">
              <p className="write-panel__label">레벨 선택</p>
              <button
                type="button"
                className="write-panel__draft-list-btn"
                onClick={() => setNotice('임시저장 목록은 준비 중이에요.')}
              >
                임시목록
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
              <button
                type="button"
                className="write-panel__attach-btn"
                aria-label="사진 첨부"
                onClick={() => setNotice('사진 첨부는 준비 중이에요.')}
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
                  onClick={() => setHashtagCategory(option)}
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
                disabled={hashtags.length >= 3}
                onChange={(event) => setHashtagText(event.target.value)}
              />
              <button
                type="button"
                className="write-panel__hashtag-add"
                disabled={hashtags.length >= 3}
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
          <button
            type="button"
            className="write-panel__save"
            onClick={() => setNotice('임시저장은 준비 중이에요.')}
          >
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
  );
}

export default CommunityWritePanel;
