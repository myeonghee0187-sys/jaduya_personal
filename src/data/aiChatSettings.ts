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
const defaults: AIChatSettings = { contractType: '월세', location: null };
export function loadAIChatSettings(owner: string): AIChatSettings {
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
      location,
    };
  } catch { return defaults; }
}
export function saveAIChatSettings(owner: string, value: AIChatSettings): void {
  try { localStorage.setItem(PREFIX + owner, JSON.stringify(value)); } catch { /* session state fallback */ }
}
