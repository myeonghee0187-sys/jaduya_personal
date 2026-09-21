import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { BottomSheet } from '../BottomSheet';
import { icon } from '../../lib/asset';
import { HOMECARE_CATEGORIES } from '../../data/homecareGuide';
import { getHomecareProviders } from '../../data/homecareProviders';
import { getHomecareProviderLinks, homecareServiceSearchUrl } from './serviceConnection';
import type { SelectedHomecareService } from './serviceConnection';
import '../../styles/homecare-service-connection.css';

interface ServiceConnectionSheetProps {
  service: SelectedHomecareService | null;
  onClose: () => void;
}

export function ServiceConnectionSheet({ service, onClose }: ServiceConnectionSheetProps) {
  const titleId = useId();
  const open = service !== null;
  const lastServiceRef = useRef(service);
  if (service) lastServiceRef.current = service;
  // 닫힘 애니메이션 중에도 제목을 유지한다. 다시 열면 새 서비스만 표시한다.
  const displayedService = service ?? lastServiceRef.current;
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [open, service?.id]);

  useEffect(() => {
    if (!open) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const layer = panelRef.current?.closest('.layer');
    const siblings = Array.from(layer?.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== layer)
      .map((element) => ({ element, wasInert: element.hasAttribute('inert') }));
    siblings.forEach(({ element }) => element.setAttribute('inert', ''));
    closeRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key !== 'Tab') return;
      const focusables = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex="0"]',
      ) ?? []).filter((element) => element.getClientRects().length > 0);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      siblings.forEach(({ element, wasInert }) => { if (!wasInert) element.removeAttribute('inert'); });
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [open]);

  const searchUrl = displayedService ? homecareServiceSearchUrl(displayedService) : null;
  const providers = getHomecareProviders(displayedService?.providerCategory ?? null);

  return (
    <BottomSheet open={open} className="dc-service-sheet" labelledBy={titleId} onDimClick={onClose}>
      <div ref={panelRef} className="dc-service-sheet__panel" data-service-category={displayedService?.category} data-provider-category={displayedService?.providerCategory ?? undefined}>
        <button type="button" className="bsheet__grip dc-service-sheet__grip" aria-label="업체 연결 시트 닫기" onClick={onClose}><span /></button>
        <header className="dc-service-sheet__head">
          <div>
            <p className="dc-service-sheet__eyebrow">{displayedService ? HOMECARE_CATEGORIES[displayedService.category].label : ''} · 서비스 연결</p>
            <h2 id={titleId} className="dc-service-sheet__title">{displayedService?.title}</h2>
          </div>
          <button ref={closeRef} type="button" className="dc-service-sheet__close" aria-label="서비스 연결 닫기" onClick={onClose}>
            <img src={icon('sheet-close.svg')} alt="" />
          </button>
        </header>
        <div ref={bodyRef} className="dc-service-sheet__body">
          {displayedService?.contactOnly ? (
            <div className="dc-service-sheet__notice">
              <strong>연락처가 등록되어 있지 않아요.</strong>
              <p>계약서나 건물 안내에 적힌 임대인·관리실 연락처로 문의해주세요.</p>
            </div>
          ) : providers.length > 0 ? (
            <>
              <ul className="dc-provider-list" aria-label={`${displayedService?.title} 관련 업체`}>
                {providers.map((provider) => {
                  const links = getHomecareProviderLinks(provider);
                  return (
                    <li key={provider.id}>
                      <article className="dc-provider" data-provider-id={provider.id}>
                        <div className="dc-provider__head">
                          <p className="dc-provider__type">{provider.serviceType}</p>
                          <h3 className="dc-provider__name">{provider.name}</h3>
                        </div>
                        {provider.description && <p className="dc-provider__description">{provider.description}</p>}
                        {(provider.area || provider.address) && (
                          <dl className="dc-provider__details">
                            {provider.area && <div><dt>서비스 지역</dt><dd>{provider.area}</dd></div>}
                            {provider.address && <div><dt>{provider.addressLabel || '주소'}</dt><dd>{provider.address}</dd></div>}
                          </dl>
                        )}
                        {provider.note && <p className="dc-provider__note">{provider.note}</p>}
                        {(links.phone || links.website || links.map) && (
                          <div className="dc-provider__actions">
                            {links.phone && <a href={links.phone} aria-label={`${provider.name} 전화하기 ${provider.phone ?? ''}`}>전화하기</a>}
                            {links.website && <a href={links.website} target="_blank" rel="noopener noreferrer" aria-label={`${provider.name} 홈페이지 보기 (새 탭)`}>홈페이지 보기</a>}
                            {links.map && <a href={links.map} target="_blank" rel="noopener noreferrer"
                              aria-label={provider.mapUrl ? `${provider.name} 위치 보기 (새 탭)` : `${provider.name} 사업장 주소로 위치 보기 (카카오맵 새 탭)`}
                              title={provider.mapUrl ? undefined : '공개된 사업장 주소로 검색해요'}>위치 보기</a>}
                          </div>
                        )}
                        {provider.checkedAt && <p className="dc-provider__checked">정보 확인일 {provider.checkedAt}</p>}
                      </article>
                    </li>
                  );
                })}
              </ul>
              <p className="dc-service-sheet__hint dc-service-sheet__disclosure">공식 공개 정보를 바탕으로 안내해요. 자두야와 제휴된 업체는 아니에요. 이용 전 최신 정보와 방문 가능 지역을 업체에 확인해주세요.</p>
            </>
          ) : (
            <>
              <div className="dc-service-sheet__notice">
                <strong>현재 연결 가능한 업체 정보를 준비 중이에요.</strong>
                <p>카카오맵에서 검색 지역을 정한 뒤 실제 업체를 찾아볼 수 있어요.</p>
              </div>
              {searchUrl && <a className="dc-service-sheet__search-link" href={searchUrl} target="_blank" rel="noopener noreferrer"
                aria-label={`${displayedService?.title} 카카오맵에서 찾기 (새 탭)`}>카카오맵에서 업체 찾기</a>}
              <p className="dc-service-sheet__hint">지도 검색 결과에서 업체를 선택해 전화번호·위치·홈페이지를 확인해주세요.</p>
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
