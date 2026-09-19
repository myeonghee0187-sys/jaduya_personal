import type { AILocation } from './aiChatSettings';
import { normalizeSavedLocation } from './userLocation';
import type { SavedLocation } from './userLocation';

const ENDPOINT = 'https://nominatim.openstreetmap.org';
const cache = new Map<string, AILocation[]>();
let lastRequestAt = 0;

type NominatimAddress = Record<string, string | undefined>;
type NominatimResult = { lat: string; lon: string; display_name: string; address?: NominatimAddress };

const SIDO_NAMES: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천', 광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남', 전북특별자치도: '전북', 전라북도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주',
};

function addressParts(result: NominatimResult): Pick<AILocation, 'sido' | 'sigungu' | 'dong' | 'displayName'> {
  const address = result.address ?? {};
  const rawSido = [address.state, address.province, address.city].find((value) => value && (SIDO_NAMES[value] || /(?:특별시|광역시|특별자치시|도)$/.test(value)));
  const sido = rawSido ? (SIDO_NAMES[rawSido] ?? rawSido) : '';
  const sigungu = [address.borough, address.city_district, address.county, address.municipality]
    .find((value) => value && /[구군]$/.test(value));
  const dong = [address.suburb, address.quarter, address.neighbourhood, address.village, address.town]
    .find((value) => value && /(?:동|가|읍|면|리)$/.test(value));
  const displayName = [sido, sigungu, dong].filter(Boolean).join(' ')
    || result.display_name.split(',').slice(0, 3).map((part) => part.trim()).filter(Boolean).join(' ');
  return { sido, sigungu: sigungu ?? '', dong: dong ?? '', displayName };
}

function toLocation(result: NominatimResult): AILocation | null {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const parts = addressParts(result);
  return parts.displayName && Number.isFinite(latitude) && Number.isFinite(longitude) ? { ...parts, latitude, longitude } : null;
}

async function rateLimitedFetch(url: string): Promise<unknown> {
  const wait = Math.max(0, 1000 - (Date.now() - lastRequestAt));
  if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error('location request failed');
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

export async function searchKoreanLocations(query: string): Promise<AILocation[]> {
  const normalized = query.trim();
  if (!normalized) return [];
  const cached = cache.get(normalized);
  if (cached) return cached;
  const params = new URLSearchParams({ q: normalized, format: 'jsonv2', addressdetails: '1', countrycodes: 'kr', 'accept-language': 'ko', limit: '6' });
  const results = await rateLimitedFetch(`${ENDPOINT}/search?${params}`) as NominatimResult[];
  const seen = new Set<string>();
  const locations = results.map(toLocation).filter((value): value is AILocation => Boolean(value)).filter((value) => !seen.has(value.displayName) && Boolean(seen.add(value.displayName)));
  cache.set(normalized, locations);
  return locations;
}

export async function reverseGeocodeKoreanLocation(latitude: number, longitude: number): Promise<AILocation> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: 'jsonv2', addressdetails: '1', zoom: '16', 'accept-language': 'ko' });
  const result = await rateLimitedFetch(`${ENDPOINT}/reverse?${params}`) as NominatimResult;
  const location = toLocation(result);
  if (!location) throw new Error('location not found');
  return { ...location, latitude, longitude };
}

/** 직접 입력한 이름은 검색 실패에도 유지하며, 기존 좌표는 재조회하지 않는다. */
export async function geocodeSavedLocation(value: SavedLocation): Promise<SavedLocation> {
  const location = normalizeSavedLocation(value) ?? { displayName: value.displayName.trim() };
  if (!location.displayName || (location.lat !== undefined && location.lng !== undefined)) return location;
  try {
    const [result] = await searchKoreanLocations(location.displayName);
    return result ? { displayName: location.displayName, lat: result.latitude, lng: result.longitude } : location;
  } catch {
    return location;
  }
}
