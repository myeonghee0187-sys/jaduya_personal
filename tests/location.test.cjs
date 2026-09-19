// Run with: node --test tests/location.test.cjs (no additional dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', js)(
    name => name.startsWith('.') ? load(path.resolve(path.dirname(filename), name + '.ts')) : require(name),
    module, module.exports,
  );
  return module.exports;
}
const store = new Map();
global.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
global.window = { setTimeout, clearTimeout };
const profile = load('src/data/livingProfile.ts');
const { resolveUserLocation, fromAILocation } = load('src/data/userLocation.ts');
const { geocodeSavedLocation, reverseGeocodeKoreanLocation } = load('src/data/locationSearch.ts');
const { getPreferredRepairLocation } = load('src/services/repairShops.ts');
const { repairSearchLocationStep } = load('src/data/aiScenarios.ts');
const { loadAIChatSettings } = load('src/data/aiChatSettings.ts');
const baseLocation = { displayName: '서울 광진구', lat: 37.5385, lng: 127.0823 };
const temporary = { displayName: '부산 해운대구', lat: 35.163, lng: 129.163 };
const active = { ...profile.createDefaultLivingProfile(), useLocation: true, locationPreferenceSet: true, location: baseLocation.displayName, locationData: baseLocation };

test('CASE 1: explicit OFF suppresses default and legacy; explicit conversation selection remains usable', () => {
  const off = { ...active, useLocation: false };
  assert.equal(resolveUserLocation(off, null, baseLocation), null);
  assert.deepEqual(resolveUserLocation(off, temporary, baseLocation), temporary);
});
test('CASE 2: enabled default wins over legacy and repair skips location question', () => {
  const location = resolveUserLocation(active, null, temporary);
  assert.deepEqual(location, baseLocation);
  const step = repairSearchLocationStep(location.displayName);
  assert.match(step.message, /서울 광진구 기준으로 주변 수리업체를 찾아볼게요/);
  assert.deepEqual(step.ctas, []);
  assert.match(repairSearchLocationStep().message, /지역을 설정/);
});
test('CASE 3 and 8: map uses announced coordinates even with GPS permission; never requests GPS', async () => {
  let gpsCalls = 0;
  Object.defineProperty(global, 'navigator', { configurable: true, value: {
    permissions: { query: async () => { gpsCalls++; return { state: 'granted' }; } },
    geolocation: { getCurrentPosition: () => { gpsCalls++; } },
  } });
  const result = await getPreferredRepairLocation(resolveUserLocation(active));
  assert.equal(result.label, baseLocation.displayName);
  assert.equal(result.latitude, baseLocation.lat);
  assert.equal(result.longitude, baseLocation.lng);
  assert.equal(gpsCalls, 0);
  await assert.rejects(getPreferredRepairLocation(null));
});
test('CASE 4: typed region resolves representative coordinates and saves them', async () => {
  global.fetch = async url => {
    assert.equal(new URL(url).searchParams.get('q'), '서울특별시 광진구');
    return { ok: true, json: async () => [{ lat: '37.5385', lon: '127.0823', display_name: '광진구, 서울특별시', address: { state: '서울특별시', borough: '광진구' } }] };
  };
  const locationData = await geocodeSavedLocation({ displayName: '서울특별시 광진구' });
  assert.deepEqual(locationData, { displayName: '서울특별시 광진구', lat: 37.5385, lng: 127.0823 });
  profile.saveLivingProfile('forward', { ...active, locationData });
  assert.deepEqual(profile.loadLivingProfile('forward').locationData, locationData);
});
test('CASE 5: geocoding failure retains input; map fails instead of silently using another region', async () => {
  global.fetch = async () => { throw new Error('offline'); };
  const locationData = await geocodeSavedLocation({ displayName: '직접 입력 지역' });
  assert.deepEqual(locationData, { displayName: '직접 입력 지역' });
  assert.equal(profile.saveLivingProfile('failed', { ...active, locationData }), true);
  assert.equal(profile.loadLivingProfile('failed').location, '직접 입력 지역');
  await assert.rejects(getPreferredRepairLocation(locationData));
});
test('CASE 6: temporary selection wins for AI and map, without changing default storage', async () => {
  profile.saveLivingProfile('temporary', active);
  const before = store.get('jaduya.livingProfile.temporary');
  const selected = resolveUserLocation(profile.loadLivingProfile('temporary'), temporary);
  assert.deepEqual(selected, temporary);
  assert.equal((await getPreferredRepairLocation(selected)).latitude, temporary.lat);
  assert.equal(store.get('jaduya.livingProfile.temporary'), before);
  assert.deepEqual(resolveUserLocation(profile.loadLivingProfile('temporary')), baseLocation);
});
test('CASE 7: legacy AI and preferences fallback work only before explicit OFF', () => {
  store.set('jaduya.aiChatSettings.legacy', JSON.stringify({ location: { displayName: '기존 지역', latitude: 37, longitude: 127 } }));
  const legacy = fromAILocation(loadAIChatSettings('legacy').location);
  assert.equal(resolveUserLocation(profile.loadLivingProfile('legacy'), null, legacy).displayName, '기존 지역');
  assert.equal(resolveUserLocation(profile.loadLivingProfile('prefs'), null, { displayName: '온보딩 지역' }).displayName, '온보딩 지역');
  store.set('jaduya.livingProfile.legacy', JSON.stringify({ useLocation: false, location: '남아 있는 지역' }));
  assert.equal(resolveUserLocation(profile.loadLivingProfile('legacy'), null, legacy), null);
});
test('CASE 9 and 10: reload, account isolation, normalized keys and old/new formats', () => {
  profile.saveLivingProfile(' Person@Example.com ', active);
  assert.deepEqual(resolveUserLocation(profile.loadLivingProfile('person@example.com')), baseLocation);
  assert.equal(resolveUserLocation(profile.loadLivingProfile('another@example.com')), null);
  store.set('jaduya.livingProfile.old', JSON.stringify({ useLocation: true, location: '서울 광진구', topics: {} }));
  assert.deepEqual(resolveUserLocation(profile.loadLivingProfile('old')), { displayName: '서울 광진구' });
  store.set('jaduya.livingProfile.new', JSON.stringify({ useLocation: true, location: '옛 이름', locationData: baseLocation }));
  assert.equal(profile.loadLivingProfile('new').location, baseLocation.displayName);
  store.set('jaduya.livingProfile.invalid', JSON.stringify({ useLocation: true, locationData: { displayName: '지역', lat: 999, lng: 127 } }));
  assert.deepEqual(profile.loadLivingProfile('invalid').locationData, { displayName: '지역' });
});
test('reverse geocoding keeps the actual requested GPS coordinates', async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ lat: '37.5', lon: '127.1', display_name: '서울 광진구', address: { state: '서울특별시', borough: '광진구' } }) });
  const result = await reverseGeocodeKoreanLocation(37.538512, 127.082345);
  assert.deepEqual(fromAILocation(result), { displayName: '서울 광진구', lat: 37.538512, lng: 127.082345 });
});
