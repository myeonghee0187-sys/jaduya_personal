import type { LivingProfilePreferences } from './livingProfile';
import type { AILocation } from './aiChatSettings';

export type SavedLocation = { displayName: string; lat?: number; lng?: number };

export function normalizeSavedLocation(value: unknown): SavedLocation | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as SavedLocation;
  if (typeof raw.displayName !== 'string' || !raw.displayName.trim()) return null;
  const validCoordinates = typeof raw.lat === 'number' && Number.isFinite(raw.lat) && Math.abs(raw.lat) <= 90
    && typeof raw.lng === 'number' && Number.isFinite(raw.lng) && Math.abs(raw.lng) <= 180;
  return { displayName: raw.displayName.trim(), ...(validCoordinates ? { lat: raw.lat, lng: raw.lng } : {}) };
}

export function fromAILocation(location: AILocation | null): SavedLocation | null {
  return location ? normalizeSavedLocation({ displayName: location.displayName, lat: location.latitude, lng: location.longitude }) : null;
}

/** 명시적인 대화 내 변경만 기본 위치를 덮어쓴다. legacy는 설정 전 계정 호환용이다. */
export function resolveUserLocation(
  profile: LivingProfilePreferences,
  temporary: SavedLocation | null = null,
  legacy: SavedLocation | null = null,
): SavedLocation | null {
  const selected = normalizeSavedLocation(temporary);
  if (selected) return selected;
  if (profile.useLocation) {
    const saved = normalizeSavedLocation(profile.locationData)
      ?? normalizeSavedLocation({ displayName: profile.location });
    if (saved) return saved;
  }
  // OFF를 명시적으로 저장한 계정은 과거 위치로 자동 복귀하지 않는다.
  if (profile.locationPreferenceSet && !profile.useLocation) return null;
  return normalizeSavedLocation(legacy);
}
