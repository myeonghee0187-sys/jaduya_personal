// node --test tests/homecareProviders.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // Vite의 개발 전용 데이터 점검 분기는 Node 테스트에서 비활성화한다.
  new Function('require', 'module', 'exports', js.replace(/import\.meta\.env\.DEV/g, 'false'))(
    name => name.startsWith('.') ? load(path.resolve(path.dirname(filename), name + '.ts')) : require(name), module, module.exports,
  );
  return module.exports;
}
const { HOMECARE_PROVIDERS, getHomecareProviders } = load('src/data/homecareProviders.ts');
const { selectHomecareService, getHomecareProviderLinks, homecareServiceSearchUrl } = load('src/components/homecare/serviceConnection.ts');
const { HOMECARE_GUIDE_SCENARIOS } = load('src/data/homecareGuide.ts');
const select = title => selectHomecareService({ title, href: '#' }, 'mold', 'mold-tile-wide');

test('three existing buttons show their own providers even within the same mold problem category', () => {
  const expected = [
    ['전문 곰팡이 제거 서비스', ['moldmedical', 'primedm', 'kohel']],
    ['욕실 환풍·방습 점검', ['himpel', 'haatz']],
    ['누수·결로 점검', ['nusudajaba', 'cleanns', 'nusumaster']],
  ];
  assert.deepEqual(HOMECARE_GUIDE_SCENARIOS.mold.tile.wide.services.map(s => s.title), expected.map(([title]) => title));
  for (const [title, ids] of expected) assert.deepEqual(getHomecareProviders(select(title).providerCategory).map(p => p.id), ids);
});

test('unsupported services and private building contacts do not inherit mold/ventilation/leak providers', () => {
  for (const title of ['전문 해충 방역', '욕실 실리콘 재시공', '환풍기 청소', '욕실 방습 점검', '결로 점검', '처음 보는 서비스']) {
    assert.equal(select(title).providerCategory, null, title);
    assert.deepEqual(getHomecareProviders(select(title).providerCategory), []);
  }
  for (const title of ['임대인·관리실 문의', '관리실 긴급 접수']) {
    assert.equal(select(title).contactOnly, true);
    assert.equal(select(title).providerCategory, null);
    assert.equal(homecareServiceSearchUrl(select(title)), null);
  }
});

test('all scenario service names and IDs stay unchanged while only supported fields are matched', () => {
  for (const [category, primaries] of Object.entries(HOMECARE_GUIDE_SCENARIOS)) {
    for (const [primary, severities] of Object.entries(primaries)) {
      for (const [severity, scenario] of Object.entries(severities)) {
        const key = `${category}-${primary}-${severity}`;
        for (const service of scenario.services) {
          const selected = selectHomecareService(service, category, key);
          assert.equal(selected.title, service.title);
          assert.equal(selected.category, category);
          assert.equal(selected.id, `${key}:${service.title}`);
          assert.ok(getHomecareProviders(selected.providerCategory).every(p => p.category === selected.providerCategory));
        }
      }
    }
  }
});

test('every populated public business field has an official source and IDs are unique', () => {
  assert.equal(new Set(HOMECARE_PROVIDERS.map(p => p.id)).size, HOMECARE_PROVIDERS.length);
  for (const p of HOMECARE_PROVIDERS) {
    const fields = new Set(p.sources.flatMap(s => s.fields));
    for (const field of ['name', 'serviceType', 'description', 'area', 'address', 'phone', 'website', 'mapUrl']) {
      if (p[field]) assert.ok(fields.has(field), `${p.id}.${field} source missing`);
    }
    assert.match(p.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    for (const source of p.sources) assert.equal(new URL(source.url).protocol, 'https:');
  }
});

test('only published business numbers become tel links; no missing/malformed CTA', () => {
  const numbers = ['15445802', '07076078685', '15668853', '18990991', '16440806', '01027099771', '18006954', '01029805679'];
  assert.deepEqual(HOMECARE_PROVIDERS.map(p => getHomecareProviderLinks(p).phone), numbers.map(p => `tel:${p}`));
  for (const phone of [undefined, '', ' ', 'undefined', 'javascript:1', '12', '02-1234-5678#99']) {
    assert.equal(getHomecareProviderLinks({ phone }).phone, null);
  }
});

test('location links use only published business addresses, never guessed coordinates or manufacturer factories', () => {
  const withMaps = HOMECARE_PROVIDERS.filter(p => getHomecareProviderLinks(p).map);
  assert.deepEqual(withMaps.map(p => p.id), ['nusudajaba', 'cleanns', 'nusumaster']);
  for (const p of withMaps) {
    const url = new URL(getHomecareProviderLinks(p).map);
    assert.equal(url.origin, 'https://map.kakao.com');
    assert.equal(decodeURIComponent(url.pathname.slice('/link/search/'.length)), p.address);
    assert.equal(url.search, '');
  }
});

test('unsafe or absent external links are omitted and official map URLs take precedence', () => {
  for (const website of [undefined, '', ' ', '#', '/relative', 'undefined', 'javascript:alert(1)', 'data:text/html,hello', 'https://name:pass@example.com']) {
    assert.equal(getHomecareProviderLinks({ website }).website, null);
    assert.equal(getHomecareProviderLinks({ mapUrl: website }).map, null);
  }
  assert.equal(getHomecareProviderLinks({ mapUrl: 'https://map.kakao.com/example', address: '공개 주소' }).map, 'https://map.kakao.com/example');
});

test('provider selection does not mutate static data and changing service returns a fresh list', () => {
  const before = JSON.stringify(HOMECARE_PROVIDERS);
  const list = getHomecareProviders('mold-removal'); list.reverse();
  assert.equal(getHomecareProviders('mold-removal')[0].id, 'moldmedical');
  assert.equal(getHomecareProviders('ventilation')[0].id, 'himpel');
  assert.deepEqual(getHomecareProviders(null), []);
  assert.equal(JSON.stringify(HOMECARE_PROVIDERS), before);
});
