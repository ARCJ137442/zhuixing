'use strict';
// Controlled host adapter tests, not real browser/IME or visual evidence.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const extract = id => html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'))[1];
let calls = 0, failAt = null, cancellations = 0, removals = 0;
const durations = [];
class Element {
  constructor() { this.style = {removeProperty() {}}; }
  setAttribute() {}
  append() {}
  remove() { removals++; }
  querySelector() { return new Element(); }
  getBoundingClientRect() { return {left: 0, top: 0, width: 100, height: 100}; }
  animate(keyframes, options) {
    calls++;
    durations.push(options.duration);
    if (calls === failAt) throw Error('Simulated host animation failure');
    let reject;
    const finished = new Promise((resolve, fail) => { reject = fail; });
    return {finished, cancel() { cancellations++; reject(Error('Cancelled animation')); }};
  }
}
const windowEvents = new Map();
const document = {
  hidden: true,
  addEventListener() {},
  createRange: () => ({setStart() {}, setEnd() {}, getBoundingClientRect() { return {left: 0, top: 0, width: 20, height: 20}; }}),
  createElement: () => new Element(), body: new Element()
};
const window = {
  matchMedia: () => ({matches: false, addEventListener() {}}),
  addEventListener: (name, handler) => windowEvents.set(name, handler)
};
const {motion, core} = vm.runInNewContext(extract('core') + extract('composition-motion') + ';({motion:CompositionMotion,core:Core})', {
  window, document, Element, console: {warn() {}}
});
const part = {atom: true, start: 0, text: '⿰人呆', node: core.parse('⿰人呆')[0]};
const atom = new Element();
atom.dataset = {start: '0', ids: part.text};
const controller = motion.create({editor: {querySelectorAll: () => [atom]}, position: () => [{}, 0]});
const rejected = [];
const onRejection = error => rejected.push(error);
process.on('unhandledRejection', onRejection);
(async () => {
  assert.equal(controller.capture([part], []).length, 0);
  document.hidden = false;
  const plans = controller.capture([part], []);
  assert.equal(plans.length, 1);
  document.hidden = true;
  controller.play(plans);
  assert.equal(calls, 0);
  console.log('PASS hidden page cannot capture or start delayed motion');

  document.hidden = false;
  windowEvents.get('pagehide')();
  assert.equal(controller.capture([part], []).length, 0);
  controller.play(plans);
  assert.equal(calls, 0);
  windowEvents.get('pageshow')();
  assert.equal(controller.capture([part], []).length, 1);
  console.log('PASS pagehide blocks restart until pageshow');

  failAt = 2;
  controller.play(plans);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
  assert.equal(cancellations, 1);
  assert.equal(removals, 1);
  assert.equal(rejected.length, 0);
  console.log('PASS partial animation construction failure disposes without unhandled rejection');
  failAt = null;
  let adaptiveDuration = 180, durationReads = 0;
  const adaptive = motion.create({editor: {querySelectorAll: () => [atom]}, position: () => [{}, 0], duration: () => { durationReads++; return adaptiveDuration; }});
  const adaptivePlans = adaptive.capture([part], []);
  adaptiveDuration = 0;
  const beforeStatic = calls;
  assert.equal(adaptive.capture([part], []).length, 1);
  adaptive.play(adaptivePlans);
  assert.equal(calls, beforeStatic+1);
  assert.equal(durations.at(-1),110);
  adaptive.cancel();
  console.log('PASS extreme cadence replaces movement with a 110ms nonspatial confirmation');

  adaptiveDuration = 180;
  durationReads = 0;
  durations.length = 0;
  adaptive.play(adaptivePlans);
  assert.equal(durationReads, 1);
  assert.deepEqual(durations, [180, 180, 180, 180]);
  const cancelledBefore = cancellations;
  adaptive.cancel();
  adaptiveDuration = 90;
  durations.length = 0;
  adaptive.play(adaptivePlans);
  assert.equal(cancellations - cancelledBefore, 4);
  assert.deepEqual(durations, [90, 90, 90, 90]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(cancellations - cancelledBefore, 4, 'late old completion must not cancel replacement');
  adaptive.cancel();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(rejected.length, 0);
  console.log('PASS adaptive duration applies once per session and replacement never queues');
  console.log('\n5 controlled host checks passed. No browser, visual or IME validation implied.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => process.removeListener('unhandledRejection', onRejection));
