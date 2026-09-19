const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createMemoryRouter } = require('react-router-dom');
const source = fs.readFileSync(path.join(__dirname, '../src/navigation/routes.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsForTest = {};
new Function('exports', compiled)(exportsForTest);
const { pageUrl, pageForPath, decodeRouteId } = exportsForTest;

test('community remains canonical and legacy question callers share its filter URL', () => {
  assert.equal(pageUrl('community'), '/community');
  assert.equal(pageUrl('community-question'), '/community?filter=question');
  assert.equal(pageUrl('community', { tab: '질문' }), '/community?filter=question');
});
test('dynamic IDs cannot inject a path, query, or fragment', () => {
  const id = '지역/게시글?filter=x#한글';
  const url = new URL(pageUrl('community', { postId: id }), 'https://jaduya.invalid');
  assert.equal(url.search, '');
  assert.equal(url.hash, '');
  assert.equal(decodeRouteId(url.pathname.slice('/community/post/'.length)), id);
  assert.equal(decodeRouteId('%E0%A4%A'), '%E0%A4%A');
});
test('activity tabs and profile sections survive URL serialization', () => {
  const activity = new URL(pageUrl('saved', { tab: '작성한 글' }), 'https://jaduya.invalid');
  assert.equal(activity.pathname, '/my/activity');
  assert.equal(activity.searchParams.get('tab'), '작성한 글');
  assert.equal(pageUrl('living-profile', { section: 'recommend' }), '/my/profile?section=recommend');
});
test('recommended benefits is not interpreted as a dynamic benefit', () => {
  assert.equal(pageForPath('/money/benefits/recommended'), 'benefits-recommend');
  assert.equal(pageForPath('/money/benefits/housing'), 'benefit-detail');
});

// Use the route paths declared by App, so a removed/misspelled Route breaks this
// test even when the compatibility adapter still generates the old URL.
const app = fs.readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf8');
const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map(([, route]) => ({ path: route, id: route }));
test('approved navigation sequences PUSH then POP through actual registered routes', async () => {
  for (const sequence of [
    ['/', '/living', '/living/first'],
    ['/', '/money', '/money/benefits'],
    ['/', '/community', '/community/post/desk'],
    ['/my/activity?tab=작성한 글', '/community/post/demo-harin-post-1'],
    ['/notifications', '/money/benefits'],
    ['/ai', '/living/first'],
  ]) {
    const router = createMemoryRouter(routes, { initialEntries: [sequence[0]] });
    for (const url of sequence.slice(1)) {
      await router.navigate(url);
      assert.equal(router.state.historyAction, 'PUSH');
      assert.notEqual(router.state.matches.at(-1).route.id, '*');
    }
    for (const url of sequence.slice(0, -1).reverse()) {
      await router.navigate(-1);
      assert.equal(router.state.historyAction, 'POP');
      assert.equal(decodeURI(router.state.location.pathname + router.state.location.search), url);
    }
    router.dispose();
  }
});
test('deep-link initialization matches the requested detail instead of home', () => {
  for (const [url, matched] of [
    ['/community/post/desk', '/community/post/:id'],
    ['/living/first', '/living/first'],
    ['/money/benefits/recommended', '/money/benefits/recommended'],
  ]) {
    const router = createMemoryRouter(routes, { initialEntries: [url] });
    assert.equal(router.state.matches.at(-1).route.id, matched);
    router.dispose();
  }
});
