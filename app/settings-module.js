/* Settings owns preferences only: no source, DOM, rendering, or input capabilities. */
const Settings = (() => {
  'use strict';
  const KIND = 'structure-glyph.settings';
  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = 'structure-glyph.settings.v1';
  const MAX_BYTES = 64 * 1024;
  const HISTORY_LIMIT = 50;
  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const schema = freeze([
    { key: 'render.opticalEnabled', name: '实验光学校正', label: '关闭实验光学校正', inverted: true, type: 'boolean', default: true, description: '仅对受测适用布局启用字面与布局光学校正；未知布局回退原几何。', aliases: ['光学', '字面', '布局', 'optical'], category: '呈现', applicability: '仅受测适用布局；未知布局回退原几何；字体依赖回退不变', risk: '实验呈现功能；不改原文，不改变字体可用性与回退规则。', introducedVersion: 1 },
    { key: 'editor.view', name: '编辑视图', label: '编辑视图', optionLabels: { preview: '只读预览', live: '行内编辑', source: '源码编辑' }, type: 'string', enum: ['preview', 'live', 'source'], default: 'live', description: '选择只读预览、行内编辑或源码编辑。', aliases: ['视图', '预览', '阅读', '源码', 'view', 'preview', 'source'], category: '编辑', applicability: '始终适用', risk: '', introducedVersion: 1 },
    { key: 'editor.unit', name: '编辑单位', label: '编辑单位', optionLabels: { 'display-glyph': '最终呈现字', 'ids-grapheme': '构型原字符簇' }, type: 'string', enum: ['display-glyph', 'ids-grapheme'], default: 'ids-grapheme', description: '光标、选区与前后删除共用最终呈现字或构型原字符簇单位。', aliases: ['光标', '退格', '删除', '粒度', 'unit', 'grapheme'], category: '编辑', applicability: '仅行内编辑；其他视图保留偏好但不使用', risk: '切换时保留已有源选区，不扩大删除范围。', introducedVersion: 1 },
    { key: 'unicode.presentation', name: '匹配字显示', label: '关闭匹配字显示', inverted: true, type: 'boolean', default: true, description: '用已匹配 Unicode 字呈现完整构型，不改原文。', aliases: ['Unicode', '显示', '合字', 'presentation'], category: '匹配', applicability: '行内编辑与只读预览；源码编辑不使用', risk: '只改变显示，不执行真转换。', introducedVersion: 1 },
    { key: 'unicode.autoConvert', name: '自动真转换', label: '自动真转换（改变原文）', inverted: false, type: 'boolean', default: false, description: '将之后新输入的完整构型真正转换为 Unicode 字。', aliases: ['Unicode', '自动转换', '合字', 'autoConvert'], category: '匹配', applicability: '仅行内编辑的新输入；源码模式暂停；不追溯转换', risk: '开启后新输入会改变原文；自动转换具有独立正文撤销事务。', introducedVersion: 1 },
    { key: 'motion.enabled', name: '构型动效', label: '关闭构型动效', inverted: true, type: 'boolean', default: true, description: '显示构型合成与拆分动效。', aliases: ['动画', '动效', 'motion', 'animation'], category: '动效', applicability: '非源码视图；系统减少动态效果时保留偏好并静态显示', risk: '', introducedVersion: 1 },
    { key: 'motion.speed', name: '动效速度', label: '动效速度', optionLabels: { '0.6': '慢看', '1': '自然', '1.65': '利落' }, type: 'number', enum: [0.6, 1, 1.65], default: 1, description: '慢看、自然、利落三档速度。', aliases: ['速度', '慢看', '自然', '利落', 'speed'], category: '动效', applicability: '动效实际启用时', risk: '', introducedVersion: 1 },
    { key: 'motion.guides', name: '构型辅助线', label: '关闭构型辅助线', inverted: true, type: 'boolean', default: true, description: '在构型动效中显示布局辅助线。', aliases: ['辅助线', '引导', 'guides'], category: '动效', applicability: '动效实际启用时', risk: '', introducedVersion: 1 },
    { key: 'shortcuts.idcInsert', name: 'IDC 快捷插入', label: 'IDC 快捷插入', optionLabels: { 'alt-palette': '按住 Alt 显示候选', off: '关闭' }, type: 'string', enum: ['alt-palette', 'off'], default: 'alt-palette', description: '编辑器聚焦时按住 Alt，在光标旁显示全部 IDC SVG 候选；使用候选显示的方向键或字母键直接插入，松开 Alt 即收起。浏览器提供键盘布局映射时，候选键帽随布局显示；不可用时使用标准键位提示。', aliases: ['IDC', '快捷键', '插入', '候选', 'Alt', 'keyboard', 'shortcut'], category: '键盘', applicability: '编辑视图且焦点在编辑器；输入法组合、AltGraph 与只读预览期间暂停', risk: '浏览器或系统可能先截走 Alt 组合键；Alt+方向在部分浏览器会用于页面导航，仍须真人设备验收。', introducedVersion: 1 },
    { key: 'shortcuts.componentInsert', name: '偏旁快捷插入', label: '偏旁快捷插入', optionLabels: { 'shift-keys': '启用 Shift 字母快捷键', off: '关闭' }, type: 'string', enum: ['shift-keys', 'off'], default: 'shift-keys', description: '编辑器聚焦且没有 IME 组合时，纯 Shift+F 插入扌；Ctrl+Shift+F、Shift+方向键和 IME 组合交还宿主。', aliases: ['部件', '偏旁', '扌', '快捷键', 'Shift', 'keyboard', 'shortcut'], category: '键盘', applicability: '编辑视图且焦点在编辑器；手机使用常见偏旁面板', risk: 'Shift+字母可能输入大写字母；Flypy schema 也允许大写码。组合中的字母交给 IME，应用只在空闲编辑状态消费，且可在此关闭。', introducedVersion: 1 },
    { key: 'shortcuts.obInput', name: 'O 符偏旁键位图', label: 'O 符偏旁键位图', optionLabels: { 'alt-shift-map': '按住 Alt+Shift 显示键位图', off: '关闭' }, type: 'string', enum: ['alt-shift-map', 'off'], default: 'alt-shift-map', description: '编辑器聚焦时按住 Alt+Shift 打开 A–Z 键位图；按字母选择 ob+字母组，单个 Unicode 部件直插，多候选显示图形候选并用数字、空格或 Enter 选择。Escape 取消；手机仍用按钮面板。', aliases: ['O符', '小鹤', 'ob', '偏旁', '部件', 'Alt', 'Shift', '快捷键', 'keyboard'], category: '键盘', applicability: '仅可编辑视图与编辑器焦点；IME 组合、AltGraph 和只读视图期间暂停', risk: '快捷键数据是用户提供的私人码表摘取，仅用于本机候选，不随产品发布；不同宿主的 Alt+Shift 事件仍需实体按键验收。', introducedVersion: 1 },
    { key: 'shortcuts.selectionTransform', name: '拆字/合字快捷键', label: '拆字/合字快捷键', optionLabels: { off: '关闭', 'alt-brackets': 'Alt+[ 拆字 / Alt+] 合字' }, type: 'string', enum: ['off', 'alt-brackets'], default: 'alt-brackets', description: 'Alt+[ 对当前选区拆字，Alt+] 对完整 IDS 合字；选区必须有唯一映射，按钮始终可用，结果一次撤销。', aliases: ['快捷键', '选区', '拆字', '合字', 'Alt+[', 'Alt+]', 'keyboard', 'shortcut'], category: '键盘', applicability: '编辑视图且焦点在编辑器；输入法组合期间暂停', risk: '部分键盘布局或宿主可能截获 Alt+括号；画布按钮提供相同操作。', introducedVersion: 1 },
  ]);
  const byKey = new Map(schema.map(entry => [entry.key, entry]));
  class SettingsError extends Error {
    constructor(code, message, keys = []) {
      super(message);
      this.name = 'SettingsError';
      this.code = code;
      this.keys = Object.freeze([...keys]);
    }
  }
  const fail = (code, message, keys) => { throw new SettingsError(code, message, keys); };
  const plain = value => value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

  // Inspect descriptors rather than invoke getters/toJSON from programmatic inputs.
  function inspectData(value) {
    const ancestors = new Set();
    const stack = [{ value, exit: false }];
    while (stack.length) {
      const frame = stack.pop();
      const current = frame.value;
      if (current === null || typeof current !== 'object') continue;
      if (frame.exit) { ancestors.delete(current); continue; }
      if (!plain(current) && !Array.isArray(current)) fail('OBJECT', '设置必须使用普通对象。');
      if (ancestors.has(current)) fail('CYCLE', '设置不能包含循环引用。');
      ancestors.add(current);
      stack.push({ value: current, exit: true });
      for (const key of Reflect.ownKeys(current)) {
        if (typeof key !== 'string') fail('KEY', '设置不能包含 Symbol 键。');
        if (DANGEROUS_KEYS.has(key)) fail('DANGEROUS_KEY', `拒绝危险键：${key}`, [key]);
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        if (!('value' in descriptor)) fail('ACCESSOR', `设置不能包含访问器：${key}`, [key]);
        stack.push({ value: descriptor.value, exit: false });
      }
    }
  }
  function checkSize(text) {
    if (new TextEncoder().encode(text).byteLength > MAX_BYTES) fail('SIZE', '设置文件不能超过 64 KiB UTF-8。');
  }
  // JSON.parse checks grammar; this token walk checks decoded key identity, not text regexes.
  function rejectDuplicateKeys(text) {
    const tokens = text.match(/"(?:[^"\\]|\\.)*"|[{}\[\]:,]|[^\s{}\[\]:,]+/g) || [];
    const containers = [];
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token === '{') containers.push(new Set());
      else if (token === '[') containers.push(null);
      else if (token === '}' || token === ']') containers.pop();
      else if (token.startsWith('"') && tokens[index + 1] === ':') {
        const key = JSON.parse(token);
        const seen = containers[containers.length - 1];
        if (seen.has(key)) fail('DUPLICATE_KEY', `重复的 JSON 键：${key}`, [key]);
        seen.add(key);
      }
    }
  }

  function validateSettings(input, { partial = false } = {}) {
    inspectData(input);
    if (!plain(input)) fail('OBJECT', 'settings 必须是普通对象。');
    const keys = Object.getOwnPropertyNames(input);
    const unknown = keys.filter(key => !byKey.has(key));
    if (unknown.length) fail('UNKNOWN_KEY', `未知设置：${unknown.join('、')}`, unknown);
    const result = {};
    for (const entry of schema) {
      const present = Object.hasOwn(input, entry.key);
      if (!present && partial) continue;
      const value = present ? input[entry.key] : entry.default;
      if (typeof value !== entry.type || (entry.enum && !entry.enum.includes(value))) {
        fail('VALUE', `设置值无效：${entry.key}`, [entry.key]);
      }
      result[entry.key] = value;
    }
    return freeze(result);
  }
  const defaults = () => validateSettings({});
  function decode(input) {
    let envelope;
    if (typeof input === 'string') {
      checkSize(input);
      try { envelope = JSON.parse(input); }
      catch (error) { fail('JSON', `设置 JSON 无效：${error.message}`); }
      rejectDuplicateKeys(input);
    } else {
      envelope = input;
    }
    inspectData(envelope);
    if (!plain(envelope)) fail('OBJECT', '设置文件根必须是普通对象。');
    const extra = Object.getOwnPropertyNames(envelope).filter(key => !['kind', 'schemaVersion', 'settings'].includes(key));
    if (extra.length) fail('UNKNOWN_KEY', `未知文件字段：${extra.join('、')}`, extra);
    if (!Object.hasOwn(envelope, 'kind') || envelope.kind !== KIND) fail('KIND', '这不是结构组字设置文件；项目正文不能作为设置导入。');
    if (!Object.hasOwn(envelope, 'schemaVersion') || envelope.schemaVersion !== SCHEMA_VERSION) fail('VERSION', `不支持设置版本：${String(envelope.schemaVersion)}`);
    if (!Object.hasOwn(envelope, 'settings')) fail('OBJECT', '设置文件缺少 settings。');
    if (!plain(envelope.settings)) fail('OBJECT', '设置必须使用普通对象。');
    const migratedSettings = Object.assign({}, envelope.settings);
    if (['alt-arrows', 'shift-mode'].includes(migratedSettings['shortcuts.idcInsert'])) migratedSettings['shortcuts.idcInsert'] = 'alt-palette';
    if (migratedSettings['shortcuts.selectionTransform'] === 'ctrl-alt') migratedSettings['shortcuts.selectionTransform'] = 'off';
    if (migratedSettings['shortcuts.selectionTransform'] === 'alt-shift') migratedSettings['shortcuts.selectionTransform'] = 'alt-brackets';
    const snapshot = validateSettings(migratedSettings);
    // Object inputs have no original encoding; enforce the same limit on their JSON representation.
    if (typeof input !== 'string') checkSize(JSON.stringify({ kind: KIND, schemaVersion: SCHEMA_VERSION, settings: snapshot }));
    return snapshot;
  }
  function encode(snapshot) {
    return JSON.stringify({ kind: KIND, schemaVersion: SCHEMA_VERSION, settings: validateSettings(snapshot) }, null, 2);
  }
  const same = (left, right) => schema.every(entry => left[entry.key] === right[entry.key]);
  const status = (state, message, error = null) => freeze({ state, message, error: error ? String(error.message || error) : null });

  class Store {
    #snapshot; #storage; #key; #revision = 0; #undo = []; #redo = [];
    #listeners = new Set(); #notifying = false; #listenerErrors = []; #persistStatus;
    constructor({ initial, storage = null, key = STORAGE_KEY } = {}) {
      this.#storage = storage;
      this.#key = key;
      this.#snapshot = initial === undefined ? defaults() : validateSettings(initial);
      this.#persistStatus = status(storage ? 'empty' : 'disabled', storage ? '尚无已保存设置' : '仅本次会话有效');
      if (!storage) return;
      let saved;
      try { saved = storage.getItem(key); }
      catch (error) { this.#persistStatus = status('read-error', '无法读取已保存设置；本次使用会话设置', error); return; }
      if (saved === null || saved === undefined) return;
      try {
        const loaded = decode(saved);
        // Explicit initial preferences win, without silently overwriting existing storage.
        if (initial === undefined) this.#snapshot = loaded;
        this.#persistStatus = initial === undefined ? status('loaded', '已读取保存的设置') : status('session', '使用指定会话设置，未覆盖已保存设置');
      } catch (error) { this.#persistStatus = status('invalid', '保存的设置无效；未覆盖原数据', error); }
    }
    get snapshot() { return this.#snapshot; }
    get revision() { return this.#revision; }
    get canUndo() { return this.#undo.length > 0; }
    get canRedo() { return this.#redo.length > 0; }
    get persistStatus() { return this.#persistStatus; }
    get history() { return freeze({ undo: [...this.#undo], redo: [...this.#redo], limit: HISTORY_LIMIT }); }
    get subscriberErrors() { return Object.freeze([...this.#listenerErrors]); }
    get(key) {
      if (!byKey.has(key)) fail('UNKNOWN_KEY', `未知设置：${String(key)}`, [key]);
      return this.#snapshot[key];
    }
    update(patch) {
      const validated = validateSettings(patch, { partial: true });
      return this.#commit(validateSettings({ ...this.#snapshot, ...validated }), 'update');
    }
    replace(full) { return this.#commit(validateSettings(full), 'replace'); }
    undo() {
      this.#assertWritable();
      if (!this.canUndo) return false;
      const previous = this.#undo.pop();
      this.#redo.push(this.#snapshot);
      return this.#publish(previous, 'undo');
    }
    redo() {
      this.#assertWritable();
      if (!this.canRedo) return false;
      const next = this.#redo.pop();
      this.#undo.push(this.#snapshot);
      return this.#publish(next, 'redo');
    }
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('subscribe 需要函数。');
      this.#listeners.add(listener);
      return () => this.#listeners.delete(listener);
    }
    #assertWritable() {
      if (this.#notifying) fail('REENTRANT', '订阅回调只更新派生显示，不可反向修改设置。');
    }
    #commit(next, reason) {
      this.#assertWritable();
      if (same(next, this.#snapshot)) return false;
      this.#undo.push(this.#snapshot);
      if (this.#undo.length > HISTORY_LIMIT) this.#undo.shift();
      this.#redo = [];
      return this.#publish(next, reason);
    }
    #publish(next, reason) {
      this.#snapshot = next;
      this.#revision++;
      if (this.#storage) {
        try {
          this.#storage.setItem(this.#key, encode(next));
          this.#persistStatus = status('saved', '设置已保存');
        } catch (error) { this.#persistStatus = status('write-error', '本次有效，未能保存', error); }
      }
      const event = freeze({ reason, revision: this.#revision, persistStatus: this.#persistStatus });
      this.#listenerErrors = [];
      this.#notifying = true;
      try {
        for (const listener of [...this.#listeners]) {
          try { listener(this.#snapshot, event); }
          catch (error) { this.#listenerErrors.push(String(error.message || error)); }
        }
      } finally { this.#notifying = false; }
      return true;
    }
  }
  return Object.freeze({ schema, defaults, decode, encode, Store, SettingsError, KIND, SCHEMA_VERSION, STORAGE_KEY, MAX_BYTES, HISTORY_LIMIT });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Settings;
