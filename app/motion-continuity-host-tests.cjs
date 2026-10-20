'use strict';
// Independent controlled DOM/WAAPI evidence. Not a native browser or IME test.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2] || path.join(__dirname,'index.html'));
const html = fs.readFileSync(app, 'utf8');
const extract = id => html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'))[1];
let checks = 0;
const unhandled = [];
process.on('unhandledRejection', e => unhandled.push(e));
function rig(options = {}) {
  const animations = [], created = [], windows = new Map(), documents = new Map(), observers = [], ranges = [];
  let calls = 0, rangeReads = 0;
  class Element {
    constructor() {
      this.style = {removeProperty(k) { delete this[k]; }};
      this.attrs = {};
      this.children = [];
      this.dataset = {};
      this.removed = false;
      created.push(this);
    }
    setAttribute(k, v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k] ?? null; }
    append(el) { this.children.push(el); }
    remove() { this.removed = true; }
    querySelector() { return this.target || new Element(); }
    getBoundingClientRect() { return {left: 50, top: 80, width: 40, height: 40}; }
    animate(frames, settings) {
      calls++;
      if (calls === options.failAt) throw new Error('Injected WAAPI construction failure');
      let resolve, reject;
      const finished = new Promise((a, b) => { resolve = a; reject = b; });
      const animation = {element: this, frames, settings, finished, cancelled: 0,
        resolve, cancel() { this.cancelled++; reject(new Error('Cancelled')); }};
      animations.push(animation);
      return animation;
    }
  }
  if (options.noWAAPI) delete Element.prototype.animate;
  const reduced = {matches: !!options.reduced, addEventListener(name, fn) { observers.push(fn); }};
  const document = {
    hidden: !!options.hidden,
    body: new Element(),
    addEventListener(name, fn) { documents.set(name, fn); },
    createElement() { return new Element(); },
    createRange() {
      rangeReads++;
      if (options.rangeThrows) throw new Error('Unmeasurable');
      const measured = {};
      ranges.push(measured);
      return {setStart(n, offset) { measured.start = offset; }, setEnd(n, offset) { measured.end = offset; }, getBoundingClientRect() {
        return {left: 10, top: 20, width: options.zeroRange ? 0 : 30, height: 40};
      }};
    }
  };
  const window = {matchMedia: () => reduced, addEventListener(name, fn) { windows.set(name, fn); }};
  const settings = {'motion.enabled': true, 'motion.speed': 1, 'motion.guides': true};
  const settingsStore = {get: key => settings[key], subscribe(fn) { observers.push(fn); }};
  const {C, M} = vm.runInNewContext(
    extract('core') + extract('font-fallback') + extract('composition-motion') + ';({C:Core,M:CompositionMotion});',
    {Element, document, window, console: {warn() {}}}
  );
  const atoms = [];
  const controller = M.create({editor: {querySelectorAll: () => atoms}, position: offset => [{}, offset],
    settingsStore, duration: () => options.duration ?? 620});
  function part(source, extra = {}) {
    const node = C.parse(source).find(n => n.type === 'operator');
    const p = {atom: true, start: node.start, text: source.slice(node.start, node.end), node, ...extra};
    const atom = new Element(), target = new Element();
    target.setAttribute('viewBox', extra.fontFallback ? '7 7 86 86' : '0 0 100 100');
    atom.target = target;
    atom.dataset = {start: String(p.start), ids: p.text};
    atoms.push(atom);
    return {p, target};
  }
  return {C, M, part, controller, animations, created, windows, documents, observers, settings, reduced, ranges,
    rangeReads: () => rangeReads, overlays: () => document.body.children.filter(el => !el.removed)};
}
async function test(name, run) { await run(); checks++; console.log('PASS ' + name); }
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  await test('normal journey arrives at 80% with per-segment easing and no extended total duration', () => {
    const h = rig(), {p, target} = h.part('⿰木水');
    h.controller.play(h.controller.capture([p], []));
    const pieces = h.animations.filter(a => a.element.className === 'composition-piece');
    assert.equal(pieces.length, 2);
    for (const a of pieces) {
      assert.equal(a.settings.duration, 620);
      assert.equal(a.settings.easing, 'linear');
      assert.equal(a.frames[1].offset, .8);
      assert.equal(a.frames[1].transform, a.frames[2].transform);
      assert.equal(a.frames[0].easing, h.M.SETTINGS.easing);
    }
    assert.equal(target.style.opacity, '0');
    h.controller.cancel();
    assert.equal(target.style.opacity, undefined);
    assert.equal(h.overlays().length, 0);
  });
  for (const [name, source, extra] of [
    ['Unicode', '⿰亻二', {unicode: '仁'}],
    ['missing-outline font fallback', '⿰木尔', {fontFallback: true}]
  ]) await test(name + ' result is never hidden and ghosts disappear by arrival', () => {
    const h = rig(), {p, target} = h.part(source, extra);
    h.controller.play(h.controller.capture([p], []));
    assert.equal(target.style.opacity, undefined);
    const pieces = h.animations.filter(a => a.element.className === 'composition-piece');
    assert.equal(pieces.length, 2);
    for (const a of pieces) {
      assert.equal(a.frames[0].opacity, .55);
      assert.equal(a.frames[1].opacity, 0);
      assert.equal(a.frames[2].opacity, 0);
    }
    h.controller.cancel();
  });
  for (const [name, options] of [
    ['extreme cadence', {duration: 0}],
    ['zero-size source Range', {zeroRange: true}],
    ['Range throws', {rangeThrows: true}]
  ]) await test(name + ' uses only 110ms transform-free confirmation', () => {
    const h = rig(options), {p, target} = h.part('⿰亻二', {unicode: '仁'});
    h.controller.play(h.controller.capture([p], []));
    assert.equal(h.animations.length, 1);
    assert.equal(h.animations[0].settings.duration, 110);
    assert.ok(h.animations[0].frames.every(f => !('transform' in f)));
    assert.equal(target.style.opacity, undefined);
    h.controller.cancel();
  });
  await test('five-leaf synthetic Unicode presentation takes compact path before Range reads', () => {
    const h = rig(), {p, target} = h.part('⿳⿰木木⿰木木木', {unicode: 'synthetic-fixture-only'});
    const plans = h.controller.capture([p], []);
    assert.equal(plans.length, 1);
    assert.equal(plans[0].compact, true);
    assert.equal(h.rangeReads(), 0);
    h.controller.play(plans);
    assert.equal(h.animations.length, 1);
    assert.equal(target.style.opacity, undefined);
    h.controller.cancel();
  });
  await test('matched presentation with empty leaves still measures original nested source offsets', () => {
    const h = rig(), {p} = h.part('𰻝甲⿰亻⿱口木', {unicode: '保', presentation: {leaves: []}});
    const plans = h.controller.capture([p], []);
    assert.equal(plans.length, 1);
    assert.equal(plans[0].items.length, 3);
    assert.deepEqual(h.ranges, [{start: 4, end: 5}, {start: 6, end: 7}, {start: 7, end: 8}]);
    h.controller.play(plans);
    assert.equal(h.animations.filter(a => a.element.className === 'composition-piece').length, 3);
    h.controller.cancel();
  });
  await test('large valid AST takes static budget fallback without any Range measurement', () => {
    let source = '木';
    for (let i = 0; i < 9; i++) source = '⿰' + source + source;
    const h = rig(), {p} = h.part(source, {unicode: 'synthetic-fixture-only', presentation: {leaves: []}});
    assert.equal(h.controller.capture([p], []).length, 0);
    assert.equal(h.rangeReads(), 0);
    assert.equal(h.animations.length, 0);
  });
  for (const [name, options] of [['reduced motion', {reduced: true}], ['hidden document', {hidden: true}], ['missing WAAPI', {noWAAPI: true}]])
    await test(name + ' creates no animation or overlay', () => {
      const h = rig(options), {p, target} = h.part('⿰木尔', {fontFallback: true});
      const plans = h.controller.capture([p], []);
      assert.equal(plans.length, 0);
      h.controller.play(plans);
      assert.equal(h.animations.length, 0);
      assert.equal(h.overlays().length, 0);
      assert.equal(target.style.opacity, undefined);
    });
  await test('motion off does not capture or hide stable outline', () => {
    const h = rig(), {p, target} = h.part('⿰木水');
    h.settings['motion.enabled'] = false;
    assert.equal(h.controller.capture([p], []).length, 0);
    assert.equal(target.style.opacity, undefined);
  });
  await test('normal completion removes overlay and restores stable outline', async () => {
    const h = rig(), {p, target} = h.part('⿰木水');
    h.controller.play(h.controller.capture([p], []));
    h.animations.forEach(a => a.resolve());
    await flush();
    assert.equal(h.overlays().length, 0);
    assert.equal(target.style.opacity, undefined);
  });
  await test('partial WAAPI failure observes rejected cancellations and restores stable glyph', async () => {
    const h = rig({failAt: 2}), {p, target} = h.part('⿰木水');
    h.controller.play(h.controller.capture([p], []));
    await flush();
    assert.equal(h.animations.length, 1);
    assert.equal(h.animations[0].cancelled, 1);
    assert.equal(h.overlays().length, 0);
    assert.equal(target.style.opacity, undefined);
  });
  for (const event of ['resize', 'scroll', 'pagehide'])
    await test(event + ' immediately cancels without changing stable target', () => {
      const h = rig(), {p, target} = h.part('⿰木水');
      h.controller.play(h.controller.capture([p], []));
      h.windows.get(event)();
      assert.equal(h.overlays().length, 0);
      assert.equal(target.style.opacity, undefined);
    });
  await test('replacement is immediate and late old completion cannot remove new overlay', async () => {
    const h = rig(), {p, target} = h.part('⿰木水');
    const plans = h.controller.capture([p], []);
    h.controller.play(plans);
    const old = [...h.animations];
    h.controller.play(plans);
    await flush();
    assert.ok(old.every(a => a.cancelled === 1));
    assert.equal(h.overlays().length, 1);
    assert.equal(target.style.opacity, '0');
    h.controller.cancel();
    await flush();
    assert.equal(h.overlays().length, 0);
  });
  await flush();
  assert.equal(unhandled.length, 0);
  console.log(`${checks} independent controlled host checks passed. Native browser, real IME and perception remain untested.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
