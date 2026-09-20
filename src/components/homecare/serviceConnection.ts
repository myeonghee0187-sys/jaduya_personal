import type { ProblemKey, ServiceLink } from '../../data/homecareGuide';
import type { HomecareProvider, HomecareServiceCategory } from '../../data/homecareProviders';

export type SelectedHomecareService = {
  id: string;
  category: ProblemKey;
  title: string;
  contactOnly: boolean;
  providerCategory: HomecareServiceCategory | null;
};

// 문제 유형(mold 등)이 같아도 서비스 분야는 다르다. 실제 점검 범위가 같은 이름만 연결한다.
// 방역·실리콘 재시공·환풍기 청소·일반 결로 시공에 다른 분야 업체를 대신 넣지 않는다.
const PROVIDER_CATEGORY_BY_SERVICE: Readonly<Partial<Record<string, HomecareServiceCategory>>> = {
  '전문 곰팡이 제거 서비스': 'mold-removal',
  '곰팡이 제거 서비스': 'mold-removal',
  '전문 곰팡이 제거': 'mold-removal',
  '천장 곰팡이 제거': 'mold-removal',
  '벽지 곰팡이 청소': 'mold-removal',
  '욕실 환풍·방습 점검': 'ventilation',
  '욕실 환풍기 점검': 'ventilation',
  '환풍기 점검': 'ventilation',
  '환풍기 교체·점검': 'ventilation',
  '누수·결로 점검': 'leak-inspection',
  '누수·결로 전문 점검': 'leak-inspection',
  '결로·누수 점검': 'leak-inspection',
  '결로·누수 진단': 'leak-inspection',
  '누수 탐지': 'leak-inspection',
  '누수 상담': 'leak-inspection',
};

/** 기존 서비스명을 유지하고, 확인한 서비스 범위로만 업체를 연결한다. */
export function selectHomecareService(
  service: ServiceLink,
  category: ProblemKey,
  scenarioKey: string,
): SelectedHomecareService {
  const contactOnly = /임대인|관리실/.test(service.title);
  return {
    id: `${scenarioKey}:${service.title}`,
    category,
    title: service.title,
    contactOnly,
    providerCategory: contactOnly ? null : PROVIDER_CATEGORY_BY_SERVICE[service.title] ?? null,
  };
}

/** Kakao 공식 검색 URL. 서비스명 또는 공개 사업장 주소만 전달한다.
 * https://apis.map.kakao.com/web/guide/#searchurl */
function mapSearchUrl(query: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
}

export function homecareServiceSearchUrl(service: SelectedHomecareService): string | null {
  return service.contactOnly || !service.title.trim() ? null : mapSearchUrl(service.title);
}

function publicWebsiteUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** 없는 연락처는 CTA도 없다. 좌표를 추정하지 않고 공개된 사업장 주소로 지도 검색한다. */
export function getHomecareProviderLinks(provider: HomecareProvider) {
  const phone = provider.phone?.trim();
  const digits = phone?.replace(/[ ()-]/g, '');
  const phoneUrl = phone && /^\+?[\d ()-]+$/.test(phone) && digits && /^\+?\d{7,15}$/.test(digits)
    ? `tel:${digits}` : null;
  return {
    phone: phoneUrl,
    website: publicWebsiteUrl(provider.website),
    map: publicWebsiteUrl(provider.mapUrl) ?? (provider.address?.trim() ? mapSearchUrl(provider.address.trim()) : null),
  };
}
