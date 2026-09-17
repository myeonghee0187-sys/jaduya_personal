const PREFIX = 'jaduya.aiChatSettings.';
export type AILocation = {
  sido: string;
  sigungu: string;
  dong: string;
  displayName: string;
  latitude: number;
  longitude: number;
};
export type AIChatSettings = { contractType: string; location: AILocation | null };

const DEFAULT_LOCATION_BY_OWNER: Readonly<Record<string, AILocation>> = {
  'seojun@jaduya.com': {
    sido: '서울',
    sigungu: '관악구',
    dong: '신림1동',
    displayName: '서울 관악구 신림1동',
    latitude: 37.4795,
    longitude: 126.927,
  },
  'harin@jaduya.com': {
    sido: '서울',
    sigungu: '서초구',
    dong: '잠원1동',
    displayName: '서울 서초구 잠원1동',
    latitude: 37.5148,
    longitude: 127.014,
  },
  'ayoung@jaduya.com': {
    sido: '경기',
    sigungu: '성남시 분당구',
    dong: '정자2동',
    displayName: '경기 성남시 분당구 정자2동',
    latitude: 37.364,
    longitude: 127.1158,
  },
};

function defaultSettings(owner: string): AIChatSettings {
  return {
    contractType: '월세',
    location: DEFAULT_LOCATION_BY_OWNER[owner.trim().toLowerCase()] ?? null,
  };
}

export function loadAIChatSettings(owner: string): AIChatSettings {
  const defaults = defaultSettings(owner);
  try {
    const stored = JSON.parse(localStorage.getItem(PREFIX + owner) ?? '{}') as Partial<AIChatSettings> & { location?: Partial<AILocation> & { label?: string } };
    const rawLocation = stored.location;
    const displayName = rawLocation?.displayName ?? rawLocation?.label;
    const location = rawLocation && typeof displayName === 'string' && typeof rawLocation.latitude === 'number' && typeof rawLocation.longitude === 'number'
      ? {
          sido: typeof rawLocation.sido === 'string' ? rawLocation.sido : '',
          sigungu: typeof rawLocation.sigungu === 'string' ? rawLocation.sigungu : '',
          dong: typeof rawLocation.dong === 'string' ? rawLocation.dong : '',
          displayName,
          latitude: rawLocation.latitude,
          longitude: rawLocation.longitude,
        }
      : null;
    return {
      contractType: typeof stored.contractType === 'string' ? stored.contractType : defaults.contractType,
      location: location ?? defaults.location,
    };
  } catch { return defaults; }
}
export function saveAIChatSettings(owner: string, value: AIChatSettings): void {
  try { localStorage.setItem(PREFIX + owner, JSON.stringify(value)); } catch { /* session state fallback */ }
}
