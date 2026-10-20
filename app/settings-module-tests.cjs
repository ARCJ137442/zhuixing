'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const Settings = require('./settings-module.js');
const envelope = (settings = {}, extra = {}) => ({ kind: Settings.KIND, schemaVersion: 1, settings, ...extra });
const json = settings => JSON.stringify(envelope(settings));
const rejects = (input, code) => assert.throws(() => Settings.decode(input), error => error instanceof Settings.SettingsError && error.code === code);
const memoryStorage = (initial = null) => ({
  value: initial, writes: [],
  getItem(key) { this.readKey = key; return this.value; },
  setItem(key, value) { this.writes.push({ key, value }); this.value = value; },
});

test('schema is the nine-item, deeply frozen authority for defaults and metadata', () => {
  assert.equal(Settings.schema.length, 9);
  assert.equal(new Set(Settings.schema.map(row => row.key)).size, 9);
  for (const row of Settings.schema) {
    for (const field of ['key', 'name', 'label', 'type', 'default', 'description', 'aliases', 'category', 'applicability', 'risk', 'introducedVersion']) assert.ok(Object.hasOwn(row, field), `${row.key}: ${field}`);
    assert.equal(Settings.defaults()[row.key], row.default);
    assert.ok(Object.isFrozen(row));
    assert.ok(Object.isFrozen(row.aliases));
  }
  assert.throws(() => Settings.schema.find(row => row.key === 'editor.view').enum.push('other'), TypeError);
});
test('round trip uses exact envelope, defaults and independent snapshots', () => {
  const input = Settings.defaults();
  const encoded = Settings.encode(input);
  assert.deepEqual(Object.keys(JSON.parse(encoded)), ['kind', 'schemaVersion', 'settings']);
  assert.deepEqual(Settings.decode(encoded), input);
  assert.notEqual(Settings.defaults(), Settings.defaults());
  assert.ok(Object.isFrozen(Settings.decode(envelope())));
  assert.equal(Settings.decode(envelope({ 'editor.view': 'source' }))['motion.enabled'], true);
});
test('all schema enum members and booleans round trip without coercion', () => {
  for (const row of Settings.schema) {
    for (const value of row.enum || [true, false]) assert.equal(Settings.decode(json({ [row.key]: value }))[row.key], value);
    for (const value of [null, [], {}, row.type === 'boolean' ? 'true' : false, row.type === 'number' ? '1' : 42]) rejects(envelope({ [row.key]: value }), 'VALUE');
  }
  rejects(envelope({ 'motion.speed': 0.7 }), 'VALUE');
  rejects(envelope({ 'motion.speed': NaN }), 'VALUE');
  rejects(envelope({ 'motion.speed': Infinity }), 'VALUE');
});
test('unknown and project fields are rejected, including top-level extra fields', () => {
  rejects(envelope({ source: '⿰木木', typo: true }), 'UNKNOWN_KEY');
  rejects(envelope({}, { source: 'body' }), 'UNKNOWN_KEY');
  rejects({ formatVersion: 1, source: 'body' }, 'UNKNOWN_KEY');
  rejects(envelope({}, { kind: 'project' }), 'KIND');
  assert.throws(() => Settings.decode(envelope({ a: 1, b: 2 })), error => assert.deepEqual(error.keys, ['a', 'b']) === undefined);
});
test('unsupported, missing and string versions are rejected', () => {
  for (const version of [0, 2, '1', null, undefined]) rejects(envelope({}, { schemaVersion: version }), 'VERSION');
});
test('duplicate keys rejected at root, settings, nested and escaped identity', () => {
  rejects('{"kind":"structure-glyph.settings","schemaVersion":1,"schemaVersion":1,"settings":{}}', 'DUPLICATE_KEY');
  rejects('{"kind":"structure-glyph.settings","schemaVersion":1,"settings":{"motion.enabled":true,"motion.enabled":false}}', 'DUPLICATE_KEY');
  rejects('{"kind":"structure-glyph.settings","schemaVersion":1,"settings":{"motion.enabled":true,"motion\\u002eenabled":false}}', 'DUPLICATE_KEY');
  rejects('{"kind":"structure-glyph.settings","schemaVersion":1,"settings":{"bad":[{"x":1,"x":2}]}}', 'DUPLICATE_KEY');
});
test('key-looking string content does not produce duplicate false positives', () => {
  rejects(envelope({ 'editor.view': '"x":1,"x":2' }), 'VALUE');
  rejects(json({ 'editor.view': '\\"x\\":1,\\"x\\":2' }), 'VALUE');
  assert.deepEqual(Settings.decode(json({})), Settings.defaults());
});
test('dangerous keys rejected deeply, including hidden and escaped keys', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    rejects(`{"kind":"structure-glyph.settings","schemaVersion":1,"settings":{"${key}":true}}`, 'DANGEROUS_KEY');
    rejects(envelope({ unexpected: [{ [key]: {} }] }), 'DANGEROUS_KEY');
    const object = {};
    Object.defineProperty(object, key, { value: true });
    rejects(envelope(object), 'DANGEROUS_KEY');
  }
  rejects('{"kind":"structure-glyph.settings","schemaVersion":1,"settings":{"\\u005f_proto__":true}}', 'DANGEROUS_KEY');
});
test('non-plain roots/settings rejected; null prototypes allowed', () => {
  for (const value of [null, 3, true, [], new Date(), Object.create({})]) rejects(value, 'OBJECT');
  for (const value of [null, [], new Date(), Object.create({})]) rejects(envelope(value), 'OBJECT');
  const root = Object.assign(Object.create(null), envelope(Object.create(null)));
  assert.deepEqual(Settings.decode(root), Settings.defaults());
});
test('programmatic accessors and Symbols rejected without invoking code', () => {
  let called = 0;
  const settings = Object.defineProperty({}, 'motion.enabled', { get() { called++; return false; }, enumerable: true });
  rejects(envelope(settings), 'ACCESSOR');
  assert.equal(called, 0);
  rejects(envelope({ [Symbol('x')]: true }), 'KEY');
  const cycle = {}; cycle.x = cycle;
  rejects(envelope(cycle), 'CYCLE');
});
test('invalid JSON and exact 64 KiB UTF-8 byte boundary', () => {
  for (const input of ['', '{', '{"x":1,}', '/* comment */ {}']) rejects(input, 'JSON');
  const valid = json({});
  const exact = valid + ' '.repeat(Settings.MAX_BYTES - Buffer.byteLength(valid));
  assert.deepEqual(Settings.decode(exact), Settings.defaults());
  rejects(exact + ' ', 'SIZE');
  rejects(JSON.stringify(envelope({ unknown: '字'.repeat(23000) })), 'SIZE');
});
test('encode rejects non-preference data instead of leaking it', () => {
  assert.throws(() => Settings.encode({ ...Settings.defaults(), source: 'private' }), /未知设置/);
  assert.equal(Settings.encode({ 'editor.view': 'source' }).includes('source'), true); // enum value is not a source field
  assert.equal(Object.hasOwn(JSON.parse(Settings.encode({})), 'source'), false);
});
test('one atomic replacement = one revision, notification, persisted snapshot and undo', () => {
  const storage = memoryStorage();
  const store = new Settings.Store({ storage });
  const events = [];
  store.subscribe((snapshot, event) => events.push({ snapshot, event }));
  const next = Settings.decode(envelope({ 'editor.view': 'source', 'motion.speed': 0.6, 'unicode.autoConvert': true }));
  assert.equal(store.replace(next), true);
  assert.equal(store.revision, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].event.reason, 'replace');
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.writes[0].key, Settings.STORAGE_KEY);
  assert.deepEqual(Settings.decode(storage.value), next);
  assert.equal(store.undo(), true);
  assert.deepEqual(store.snapshot, Settings.defaults());
  assert.equal(store.redo(), true);
  assert.deepEqual(store.snapshot, next);
});
test('invalid update and import commit nothing; unchanged calls do not add history', () => {
  const storage = memoryStorage();
  const store = new Settings.Store({ storage });
  const before = store.snapshot;
  assert.throws(() => store.update({ 'motion.enabled': false, 'editor.view': 'invalid' }));
  assert.throws(() => store.replace({ unknown: true }));
  assert.throws(() => store.replace(Settings.decode(envelope({}, { schemaVersion: 2 }))));
  assert.equal(store.snapshot, before);
  assert.equal(store.revision, 0);
  assert.equal(store.update({}), false);
  assert.equal(store.replace(Settings.defaults()), false);
  assert.equal(store.undo(), false);
  assert.equal(store.redo(), false);
  assert.equal(storage.writes.length, 0);
});
test('replace fills missing with defaults; update preserves unspecified preferences', () => {
  const store = new Settings.Store();
  store.update({ 'motion.enabled': false, 'editor.view': 'source' });
  store.update({ 'motion.speed': 1.65 });
  assert.equal(store.get('motion.enabled'), false);
  store.replace({ 'motion.speed': 0.6 });
  assert.equal(store.get('motion.enabled'), true);
  assert.equal(store.get('editor.view'), 'live');
  assert.throws(() => store.get('unknown'), /未知设置/);
});
test('read-only snapshots and histories cannot mutate preferences', () => {
  const store = new Settings.Store();
  assert.throws(() => { store.snapshot['editor.view'] = 'preview'; }, TypeError);
  store.update({ 'editor.view': 'source' });
  assert.throws(() => { store.history.undo[0]['editor.view'] = 'preview'; }, TypeError);
  assert.throws(() => store.history.undo.push({}), TypeError);
  assert.equal(store.get('editor.view'), 'source');
});
test('history retains 50 committed transitions and branches clear redo', () => {
  const store = new Settings.Store();
  for (let index = 0; index < 65; index++) store.update({ 'motion.enabled': !store.get('motion.enabled') });
  assert.equal(store.history.limit, 50);
  assert.equal(store.history.undo.length, 50);
  for (let index = 0; index < 50; index++) assert.equal(store.undo(), true);
  assert.equal(store.undo(), false);
  assert.equal(store.history.redo.length, 50);
  assert.equal(store.redo(), true);
  store.update({ 'editor.view': 'preview' });
  assert.equal(store.canRedo, false);
});
test('subscribe is lazy, disposable, frozen, and isolates exceptions/reentrant writes', () => {
  const store = new Settings.Store();
  let count = 0;
  store.subscribe(() => { throw new Error('bad subscriber'); });
  store.subscribe(() => store.update({ 'editor.view': 'preview' }));
  const off = store.subscribe((snapshot, event) => { count++; assert.ok(Object.isFrozen(snapshot)); assert.ok(Object.isFrozen(event)); });
  assert.equal(count, 0);
  store.update({ 'motion.enabled': false });
  assert.equal(count, 1);
  assert.equal(store.get('editor.view'), 'live');
  assert.equal(store.revision, 1);
  assert.equal(store.subscriberErrors.length, 2);
  off();
  store.undo();
  assert.equal(count, 1);
});
test('construction loads valid storage without writes or initial history', () => {
  const storage = memoryStorage(json({ 'editor.view': 'preview' }));
  const store = new Settings.Store({ storage });
  assert.equal(store.get('editor.view'), 'preview');
  assert.equal(store.persistStatus.state, 'loaded');
  assert.equal(store.revision, 0);
  assert.equal(store.canUndo, false);
  assert.equal(storage.writes.length, 0);
});
test('explicit initial wins without automatically overwriting saved data', () => {
  const storage = memoryStorage(json({ 'editor.view': 'preview' }));
  const store = new Settings.Store({ initial: { 'editor.view': 'source' }, storage });
  assert.equal(store.get('editor.view'), 'source');
  assert.equal(store.persistStatus.state, 'session');
  assert.equal(storage.writes.length, 0);
});
test('broken storage retained with readable state until an explicit valid change', () => {
  const storage = memoryStorage('{broken');
  const store = new Settings.Store({ storage });
  assert.equal(store.persistStatus.state, 'invalid');
  assert.equal(storage.value, '{broken');
  assert.equal(storage.writes.length, 0);
  assert.deepEqual(store.snapshot, Settings.defaults());
  assert.equal(store.update({}), false);
  assert.equal(storage.value, '{broken');
  store.update({ 'motion.enabled': false });
  assert.equal(store.persistStatus.state, 'saved');
  assert.equal(Settings.decode(storage.value)['motion.enabled'], false);
});
test('storage read and write failure preserve session truth and permit later recovery', () => {
  let failWrite = true;
  const storage = {
    getItem() { throw new Error('denied'); },
    setItem(key, value) { if (failWrite) throw new Error('quota'); this.value = value; },
  };
  const store = new Settings.Store({ storage });
  assert.equal(store.persistStatus.state, 'read-error');
  store.update({ 'unicode.autoConvert': true });
  assert.equal(store.get('unicode.autoConvert'), true);
  assert.equal(store.persistStatus.state, 'write-error');
  assert.equal(store.persistStatus.message, '本次有效，未能保存');
  assert.ok(store.canUndo);
  failWrite = false;
  store.undo();
  assert.equal(store.persistStatus.state, 'saved');
  assert.equal(Settings.decode(storage.value)['unicode.autoConvert'], false);
});
test('storage write failure does not replace last successful persistent snapshot', () => {
  const storage = memoryStorage();
  const store = new Settings.Store({ storage });
  store.update({ 'editor.view': 'source' });
  storage.setItem = () => { throw new Error('quota'); };
  store.update({ 'editor.view': 'preview' });
  assert.equal(store.get('editor.view'), 'preview');
  assert.equal(new Settings.Store({ storage }).get('editor.view'), 'source');
});
test('autoConvert remains only a preference across replace, undo and redo', () => {
  const project = Object.freeze({ source: '⿰木木', selection: Object.freeze({ anchor: 0, focus: 3 }) });
  const sourceBefore = JSON.stringify(project);
  const store = new Settings.Store();
  store.replace(Settings.decode(envelope({ 'unicode.autoConvert': true })));
  store.undo(); store.redo();
  assert.equal(JSON.stringify(project), sourceBefore);
  assert.equal(store.get('unicode.autoConvert'), true);
  assert.equal(Object.hasOwn(store.snapshot, 'source'), false);
});

test('control labels and inverted checkboxes derive from schema', () => {
  for (const entry of Settings.schema) {
    if (entry.enum) {
      for (const value of entry.enum) assert.equal(typeof entry.optionLabels[value], 'string');
      assert.ok(Object.isFrozen(entry.optionLabels));
    } else {
      assert.equal(entry.inverted, entry.default === true);
      if (entry.default) assert.ok(entry.label.startsWith('关闭'));
    }
  }
});

test('deep invalid input is rejected cleanly without recursive stack exhaustion', () => {
  const depth = 10000;
  const input = '{"kind":"structure-glyph.settings","schemaVersion":1,"settings":{"bad":' + '['.repeat(depth) + '0' + ']'.repeat(depth) + '}}';
  rejects(input, 'UNKNOWN_KEY');
  const shared = {};
  rejects(envelope({ a: shared, b: shared }), 'UNKNOWN_KEY');
});

test('pre-release eight-setting files default the new optical preference', () => {
  const oldSnapshot = { ...Settings.defaults() };
  delete oldSnapshot['render.opticalEnabled'];
  assert.equal(Object.keys(oldSnapshot).length, 8);
  const restored = Settings.decode(envelope(oldSnapshot));
  assert.equal(restored['render.opticalEnabled'], true);
  assert.equal(Settings.decode(json({ 'render.opticalEnabled': false }))['render.opticalEnabled'], false);
  assert.equal(Settings.SCHEMA_VERSION, 1);
});
