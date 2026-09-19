import { geocodeSavedLocation } from '../data/locationSearch';
import type { SavedLocation } from '../data/userLocation';

export type RepairKind = 'boiler' | 'plumbing' | 'electric' | 'aircon' | 'doorlock' | 'washer' | 'general';

export type RepairSearchLocation = {
  label: string;
  latitude: number;
  longitude: number;
  isCurrentLocation: boolean;
};

export type RepairShop = {
  id: string;
  name: string;
  phone: string;
  address: string;
  roadAddress: string;
  category: string;
  lat: number;
  lng: number;
  description?: string;
  dataSource: 'prototype';
};

const REPAIR_LABELS: Record<RepairKind, { name: string; category: string; description: string }> = {
  boiler: { name: '보일러 수리', category: '보일러·난방', description: '보일러와 난방 설비 점검 예시 업체예요.' },
  plumbing: { name: '배관 수리', category: '배관·수도', description: '누수와 배수 문제 점검 예시 업체예요.' },
  electric: { name: '전기 수리', category: '전기·설비', description: '주택 전기 설비 점검 예시 업체예요.' },
  aircon: { name: '에어컨 수리', category: '에어컨·냉방', description: '에어컨 점검 예시 업체예요.' },
  doorlock: { name: '도어락 수리', category: '도어락·보안', description: '도어락 점검 예시 업체예요.' },
  washer: { name: '세탁기 수리', category: '세탁기·가전', description: '세탁기 점검 예시 업체예요.' },
  general: { name: '생활 수리', category: '집수리·생활설비', description: '생활 설비 점검 예시 업체예요.' },
};

const OFFSETS = [
  { lat: 0.0017, lng: 0.0014 },
  { lat: -0.0021, lng: -0.0018 },
  { lat: 0.0028, lng: -0.0026 },
  { lat: -0.0012, lng: 0.0031 },
] as const;

const DEMO_PHONE_NUMBERS = [
  '02-1234-5601',
  '02-2345-6702',
  '02-3456-7803',
  '02-4567-8904',
] as const;

/** AI가 안내한 위치만 사용한다. GPS나 임의 기본 지역으로 대체하지 않는다. */
export async function getPreferredRepairLocation(selectedLocation: SavedLocation | null): Promise<RepairSearchLocation> {
  if (!selectedLocation) throw new Error('검색 지역을 선택해주세요.');
  const location = await geocodeSavedLocation(selectedLocation);
  if (location.lat === undefined || location.lng === undefined) {
    throw new Error('지역의 좌표를 확인하지 못했어요. 지역을 다시 선택해주세요.');
  }
  return { label: location.displayName, latitude: location.lat, longitude: location.lng, isCurrentLocation: false };
}

export async function getDemoRepairShops(
  location: RepairSearchLocation,
  kind: RepairKind,
  signal?: AbortSignal,
): Promise<RepairShop[]> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const repair = REPAIR_LABELS[kind];
  const locationParts = location.label.split(' ').filter(Boolean);
  const area = locationParts[locationParts.length - 1] ?? '설정 지역';
  return OFFSETS.map((offset, index) => ({
    id: `prototype-${kind}-${index + 1}`,
    name: `${area} ${repair.name} ${String.fromCharCode(65 + index)}`,
    phone: DEMO_PHONE_NUMBERS[index],
    address: `${location.label} 인근`,
    roadAddress: `${location.label} 생활권 ${index + 1}`,
    category: repair.category,
    description: repair.description,
    lat: location.latitude + offset.lat,
    lng: location.longitude + offset.lng,
    dataSource: 'prototype',
  }));
}
