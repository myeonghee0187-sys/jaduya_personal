import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { SubPageHeader } from '../components/SubPageHeader';
import { DEFAULT_PERSONA } from '../data/personaHome';
import { PERSONA_PROFILE } from '../data/personaProfile';
import { icon } from '../lib/asset';
import { InterestPicker } from '../components/InterestPicker';
import { RecommendInfoAccordion } from '../components/RecommendInfoAccordion';
import { SettingsToggle } from '../components/SettingsRow';
import { geocodeSavedLocation, reverseGeocodeKoreanLocation } from '../data/locationSearch';
import {
  clearInterestTopics,
  HOUSING_TYPES,
  LIVING_EXPERIENCES,
  loadLivingProfile,
  saveLivingProfile,
  toggleInterestTopic,
} from '../data/livingProfile';
import type { HousingType, InterestCategory, LivingExperience } from '../data/livingProfile';

/** 홈에서 들어온 경우, 완료 메시지를 읽을 시간을 준 뒤 홈으로 돌아가기까지의 시간 */
const HOME_REDIRECT_MS = 900;

/* 마이페이지 > 자취 프로필 — Figma node 1565:7326 "profile_settings".
 * 저장한 값은 다음 작업에서 홈 개인화가 읽는다(data/livingProfile.ts).
 * 하단에 저장 CTA 가 고정되므로 이 화면에서는 탭바를 겹쳐 띄우지 않는다. */
export function ProfileSettingsPage() {
  const { user } = useAuth();
  const navigation = useAppNavigation();
  /* 설정값은 계정별로 남긴다 — 로그아웃 전 다른 계정 값과 섞이지 않게 */
  const ownerKey = user?.email ?? 'guest';
  /* 자취 경험·주거 형태의 원본은 persona 프로필이다 — 마이페이지 요약과 같은 값을 본다 */
  const persona = PERSONA_PROFILE[user?.persona ?? DEFAULT_PERSONA];

  /* 저장된 값이 있으면 그대로 불러오고, 없을 때만 persona 기본값으로 시작한다.
   * 계정을 바꾸면 ownerKey 가 바뀌어 그 계정 값으로 다시 읽는다. */
  const [profile, setProfile] = useState(() => loadLivingProfile(ownerKey, persona));
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationNotice, setLocationNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const locationRequest = useRef(0);
  const locationTimer = useRef<number | undefined>(undefined);
  const cancelLocationRequest = () => {
    locationRequest.current += 1;
    window.clearTimeout(locationTimer.current);
  };
  useEffect(() => {
    setProfile(loadLivingProfile(ownerKey, persona));
    setLocationLoading(false);
    setLocationNotice('');
    setSaving(false);
    return cancelLocationRequest;
  }, [ownerKey, persona]);

  const loadCurrentLocation = () => {
    if (!profile.useLocation || locationLoading) return;
    if (!navigator.geolocation) {
      setLocationNotice('이 브라우저에서는 위치를 불러올 수 없어요. 지역을 직접 입력해주세요.');
      return;
    }
    cancelLocationRequest();
    const request = locationRequest.current;
    setLocationLoading(true);
    setLocationNotice('현재 위치를 확인하고 있어요.');
    const finish = (message: string) => {
      if (request !== locationRequest.current) return;
      cancelLocationRequest();
      setLocationLoading(false);
      setLocationNotice(message);
    };
    // 좌표 조회뿐 아니라 지역명 변환이 지연될 때도 다시 시도할 수 있게 한다.
    locationTimer.current = window.setTimeout(
      () => finish('위치 확인이 지연되고 있어요. 다시 시도하거나 지역을 직접 입력해주세요.'),
      20000,
    );
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (request !== locationRequest.current) return;
          void reverseGeocodeKoreanLocation(coords.latitude, coords.longitude)
            .then((result) => {
              if (request !== locationRequest.current) return;
              setProfile((prev) => ({ ...prev, location: result.displayName,
                locationData: { displayName: result.displayName, lat: coords.latitude, lng: coords.longitude } }));
              finish('현재 위치를 불러왔어요. 설정 저장하기를 눌러 적용해주세요.');
            })
            .catch(() => finish('지역명을 불러오지 못했어요. 지역을 직접 입력해주세요.'));
        },
        (error) => finish(error.code === 1
          ? '위치 권한이 허용되지 않았어요. 지역을 직접 입력하거나 브라우저 설정에서 권한을 허용해주세요.'
          : error.code === 3
            ? '위치 확인 시간이 초과됐어요. 다시 시도하거나 지역을 직접 입력해주세요.'
            : '현재 위치를 확인할 수 없어요. 다시 시도하거나 지역을 직접 입력해주세요.'),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    } catch {
      finish('현재 위치를 확인할 수 없어요. 지역을 직접 입력해주세요.');
    }
  };

  /* 들어온 경로에 따라 뒤로가기 목적지가 다르다.
   * 마이페이지 메뉴로 들어오면 마이페이지(기본), 홈 '추천 설정'으로 들어오면 홈. */
  const returnTo = navigation?.options.returnTo ?? 'my';
  const backLabel = returnTo === 'home' ? '홈으로' : '마이페이지로';

  /* 홈에서 '추천 설정'으로 들어오면 ② 맞춤 추천 설정부터 보여준다 */
  const recommendRef = useRef<HTMLElement>(null);
  const wantsRecommend = navigation?.options.section === 'recommend';
  useEffect(() => {
    if (!wantsRecommend) return;
    const target = recommendRef.current;
    if (!target) return;
    /* 애니메이션 없이 곧바로 그 위치에서 열린다.
     * behavior:'smooth' 는 탭이 백그라운드이거나 화면을 그리지 않는 동안 진행되지 않아
     * 사용자가 맨 위에 남는 경우가 생긴다 — 딥링크는 도착이 확실한 쪽을 택한다.
     * (감속 설정을 켠 사용자에게도 그대로 안전하다) */
    target.scrollIntoView({ block: 'start' });
  }, [wantsRecommend]);

  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* 완료 메시지를 잠깐 보여준 뒤 홈으로 돌아가는 타이머 — 화면을 먼저 벗어나면 취소한다 */
  const homeRedirectRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (homeRedirectRef.current !== null) window.clearTimeout(homeRedirectRef.current);
    },
    [],
  );

  /* 자취 경험 · 주거 형태는 단일 선택 규칙을 쓴다 — 새로 고르면 이전 선택이 바로 풀리고,
   * 같은 값을 다시 눌러도 해제되지 않는다. */
  const pickExperience = (value: LivingExperience) =>
    setProfile((prev) => (prev.experience === value ? prev : { ...prev, experience: value }));
  const pickHousing = (value: HousingType) =>
    setProfile((prev) => (prev.housing === value ? prev : { ...prev, housing: value }));

  /* 관심 주제를 고르는 로직은 InterestPicker(선택 UI) 와 짝을 이루는 data/livingProfile.ts
   * 의 공용 헬퍼를 그대로 쓴다 — 홈 시트(HomeRecommendSettings)와 같은 함수라 복붙된
   * 로직이 따로 없다. */
  const toggleTopic = (category: InterestCategory, topic: string) =>
    setProfile((prev) => ({ ...prev, topics: toggleInterestTopic(prev.topics, category, topic) }));

  /* 홈에서 들어온 경우에만 저장 후 자동으로 홈으로 돌려보낸다.
   * 저장(동기)이 끝난 뒤에 이동하므로 홈은 항상 방금 저장한 값을 읽는다.
   * 실패하면 이동하지 않고 그 자리에 머문다. */
  const handleSave = async () => {
    if (saving || locationLoading) return;
    setSaving(true);
    const request = locationRequest.current;
    const locationData = profile.useLocation && profile.location.trim()
      ? await geocodeSavedLocation(profile.locationData ?? { displayName: profile.location })
      : profile.locationData;
    if (request !== locationRequest.current) {
      setSaving(false);
      return;
    }
    const savedProfile = { ...profileRef.current, locationPreferenceSet: true, locationData };
    setSaving(false);
    if (!saveLivingProfile(ownerKey, savedProfile)) {
      setToast('설정을 저장하지 못했어요.');
      return;
    }
    setProfile(savedProfile);
    if (returnTo !== 'home') {
      setToast('설정이 저장되었어요.');
      return;
    }
    setToast('맞춤 설정 완료!\n나에게 맞는 추천을 준비했어요.');
    homeRedirectRef.current = window.setTimeout(
      () => navigation?.goBack('home'),
      HOME_REDIRECT_MS,
    );
  };

  return (
    <div className="profile-settings app">
      <SubPageHeader
        title="자취 프로필"
        backLabel={backLabel}
        onBack={() => navigation?.goBack(returnTo)}
      />

      <main className="profile-settings__scroll">
        <div className="profile-settings__hero">
          <img src={icon('profile-tip.svg')} alt="" />
          <div>
            <strong>나만의 자취 추천을 설정해보세요</strong>
            <p>자취 상황과 관심사를 알려주면 필요한 정보와 추천을 골라 보여드려요.</p>
          </div>
        </div>

        {/* ① 나의 자취 정보 — 미션·생활 정보 추천의 기준이 된다 */}
        <section className="profile-settings__section" aria-labelledby="living-info-title">
          <header className="profile-settings__section-head">
            <h2 id="living-info-title">
              <span className="profile-settings__step">1</span>
              나의 자취 정보
            </h2>
            <p>현재 상황에 맞는 미션과 생활 정보를 추천하는 데 사용돼요.</p>
          </header>

          <div className="profile-settings__field">
            <h3>자취 경험</h3>
            <p>현재 자취 상황을 선택해주세요.</p>
            <div className="profile-settings__grid profile-settings__grid--3">
              {LIVING_EXPERIENCES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="profile-settings__choice"
                  aria-pressed={profile.experience === value}
                  onClick={() => pickExperience(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-settings__field">
            <h3>주거 형태</h3>
            <p>주거 형태에 맞는 생활 팁과 관리 정보를 추천해드려요.</p>
            <div className="profile-settings__grid profile-settings__grid--3">
              {HOUSING_TYPES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="profile-settings__choice"
                  aria-pressed={profile.housing === value}
                  onClick={() => pickHousing(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="profile-settings__location">
            <div className="profile-settings__location-heading">
              <strong><img src={icon('profile-location.svg')} alt="" />위치 정보 사용</strong>
              <SettingsToggle
                label="위치 정보 사용"
                checked={profile.useLocation}
                onChange={(useLocation) => {
                  cancelLocationRequest();
                  setLocationLoading(false);
                  setLocationNotice('');
                  setProfile((prev) => ({ ...prev, useLocation }));
                }}
              />
            </div>
            <p>지역 기반 생활 정보, 혜택, 주변 정보 추천에 활용돼요.</p>
            {profile.useLocation && (
              <div className="profile-settings__location-body">
                <label htmlFor="living-location">위치 정보</label>
                <div className="profile-settings__location-controls">
                  <input
                    id="living-location"
                    value={profile.location}
                    placeholder="예: 서울특별시 광진구"
                    aria-describedby="living-location-hint"
                    onChange={(event) => {
                      cancelLocationRequest();
                      setLocationLoading(false);
                      setLocationNotice('');
                      setProfile((prev) => ({ ...prev, location: event.target.value,
                        locationData: { displayName: event.target.value } }));
                    }}
                  />
                  <button type="button" disabled={locationLoading} onClick={loadCurrentLocation}>
                    {locationLoading ? '불러오는 중…' : '현재 위치로 불러오기'}
                  </button>
                </div>
                <p id="living-location-hint">입력하신 지역은 맞춤 추천, 주변 정보, 혜택 안내 등에 활용돼요.</p>
                <p role="status" hidden={!locationNotice}>{locationNotice}</p>
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
              </div>
            )}
          </div>
        </section>

        {/* ② 맞춤 추천 설정 — 분야를 고르면 그 분야의 주제가 아래에 나온다 */}
        <section
          ref={recommendRef}
          className="profile-settings__section profile-settings__section--recommend"
          aria-labelledby="recommend-title"
        >
          <header className="profile-settings__section-head">
            <h2 id="recommend-title">
              <span className="profile-settings__step">2</span>
              맞춤 추천 설정
            </h2>
            <p>선택한 관심사에 맞춰 홈에서 정보를 추천해드려요.</p>
          </header>

          <InterestPicker
            topics={profile.topics}
            onToggleTopic={toggleTopic}
            onClearAll={() => setProfile((prev) => ({ ...prev, topics: clearInterestTopics() }))}
          />
        </section>

        <RecommendInfoAccordion />
      </main>

      <p className="profile-settings__toast" role="status" aria-live="polite" hidden={!toast}>
        {toast}
      </p>

      {/* 저장 후에도 화면을 벗어나지 않는다 — 이어서 더 고를 수 있게 */}
      <div className="profile-settings__footer">
        <button type="button" className="profile-settings__save" disabled={saving || locationLoading} onClick={handleSave}>
          {saving ? '설정 저장 중…' : '설정 저장하기'}
        </button>
      </div>
    </div>
  );
}

export default ProfileSettingsPage;
