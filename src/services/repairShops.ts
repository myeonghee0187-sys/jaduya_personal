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

const DEFAULT_LOCATION: RepairSearchLocation = {
  label: '서울 광진구',
  latitude: 37.5385,
  longitude: 127.0823,
  isCurrentLocation: false,
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

export async function getPreferredRepairLocation(
  savedLocation?: Omit<RepairSearchLocation, 'isCurrentLocation'> | null,
): Promise<RepairSearchLocation> {
  try {
    const permission = await navigator.permissions?.query({ name: 'geolocation' });
    if (permission?.state === 'granted' && navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 });
      });
      return {
        label: savedLocation?.label ?? '현재 위치',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isCurrentLocation: true,
      };
    }
  } catch {
    /* 위치 확인 실패는 저장 지역이나 기본 지역으로 자연스럽게 대체한다. */
  }

  return savedLocation ? { ...savedLocation, isCurrentLocation: false } : DEFAULT_LOCATION;
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
