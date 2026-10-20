'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
function script(id) {
  const match = html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'));
  assert.ok(match, id + ' exists');
  return match[1];
}
for (const id of ['core', 'inline-model', 'inline-dom', 'inline-app']) new vm.Script(script(id));
const { C, M, D } = vm.runInNewContext(script('core') + script('inline-model') + script('inline-dom') + ';({C:Core,M:InlineModel,D:InlineDOM})');
let count = 0;
function test(name, run) { run(); count++; console.log('PASS ' + name); }
const caret = n => ({anchor:n, focus:n});
const atoms = s => M.parts(s, caret(s.length)).filter(p => p.atom);
test('new version preserves format and renderer', () => {
  assert.equal(C.VERSION.app, '0.3.1'); assert.equal(C.VERSION.format, 1);
  const project = C.project('⿰木水'); project.appVersion = '1.0.0';
  assert.equal(C.readProject(JSON.stringify(project)).source, '⿰木水');
});
test('single real editable canvas, no textarea or duplicate preview', () => {
  assert.equal((html.match(/contenteditable="true"/g) || []).length, 1);
  assert.doesNotMatch(html.slice(0,html.indexOf('<!-- embedded-document:start -->')), /<textarea|id="flow"|id="glyph"/);
});
test('complete structures collapse; source partitions remain lossless', () => {
  const s = '记录：⿰木水\n𠀀⿱日月'; const p = M.parts(s, caret(s.length));
  assert.equal(p.map(p=>p.text).join(''),s); assert.equal(p.filter(p=>p.atom).length,2);
});
test('caret strictly inside preserves raw structure, edges permit collapse', () => {
  assert.equal(M.parts('⿰木水',caret(1))[0].atom,false);
  assert.equal(M.parts('⿰木水',caret(0))[0].atom,true);
  assert.equal(M.parts('⿰木水',caret(3))[0].atom,true);
});
test('forward and backward crossing selections stay raw', () => {
  for(const sel of [{anchor:1,focus:5},{anchor:5,focus:1}]) {
    assert.equal(M.parts('a⿰木水b',sel).find(p=>p.node.type==='operator').atom,false);
  }
});
test('IME and explicit expansion prevent collapse without changing source', () => {
  assert.equal(M.parts('⿰木水',caret(3),null,true)[0].atom,false);
  assert.equal(M.parts('⿰木水',caret(3),{start:0})[0].atom,false);
});
test('unknown components preview via fonts; invalid incomplete unsupported remain literal', () => {
  assert.equal(atoms('⿰龘青')[0].fontFallback,true);
  for(const s of ['⿰A木','⿰木','⿾木','㇯木木'])assert.equal(atoms(s).length,0);
});
test('UTF16 replace supports supplementary characters and reverse selections', () => {
  const r=M.replace('𠀀⿰木水尾',{anchor:5,focus:2},'⿱日月');
  assert.equal(r.source,'𠀀⿱日月尾');assert.equal(r.selection.anchor,5);
});
test('backspace deletes final grapheme and forward delete remains atomic', () => {
  const s='甲⿰木水乙', h=new C.History(s);
  const r=M.deletion(s,caret(4),-1,atoms(s));assert.equal(r.source,'甲⿰木乙');
  h.record(r.source,r.selection.anchor,r.selection.focus);assert.equal(h.undo().source,s);
  assert.equal(M.deletion(s,caret(1),1,atoms(s)).source,'甲乙');
});
test('ordinary supplementary codepoint and grapheme deletion is safe', () => {
  assert.equal(M.deletion('𠀀木',caret(2),-1).source,'木');
  assert.equal(M.deletion('e\u0301木',caret(0),1).source,'木');
});
test('multiline edits preserve exact source', () => {
  const r=M.replace('一\n二',caret(2),'⿰木水\n');assert.equal(r.source,'一\n⿰木水\n二');
});
test('view transformations do not create source history', () => {
  const h=new C.History('⿰木水');M.parts(h.items[0].source,caret(3));M.parts(h.items[0].source,caret(1));
  assert.equal(h.items.length,1);
});
test('source validation rejects excess length without mutation', () => {
  const s='木'.repeat(4000);assert.throws(()=>M.replace(s,caret(4000),'木'));assert.equal(s.length,4000);
});
function text(data) {return {nodeType:3,data};}
function el(tagName,childNodes=[],dataset={}) {return {nodeType:1,tagName,childNodes,dataset};}
test('DOM serialization treats atom as opaque, excludes SVG metadata', () => {
  const atom=el('SPAN',[el('SVG',[text('metadata must never leak')])],{ids:'⿰木水'});
  const root=el('DIV',[text('前𠀀'),atom,text('\n后')]);
  const snap=D.snapshot(root);assert.equal(snap.source,'前𠀀⿰木水\n后');
  assert.equal(snap.offset(root,2),6);assert.equal(snap.offset(root.childNodes[0],3),3);
});
test('DOM native line blocks are normalized', () => {
  const root=el('DIV',[text('一'),el('DIV',[text('二')]),el('DIV',[text('三')])]);
  assert.equal(D.snapshot(root).source,'一\n二\n三');
});
test('DOM literal injection remains source, not parsed HTML', () => {
  assert.equal(D.snapshot(el('DIV',[text('<img onerror=alert(1)>')])).source,'<img onerror=alert(1)>');
});
test('native trailing BR is a caret placeholder, blank lines preserved', () => {
  assert.equal(D.snapshot(el('DIV',[text('一'),el('DIV',[el('BR')])])).source,'一\n');
  assert.equal(D.snapshot(el('DIV',[el('DIV',[text('一')]),el('DIV',[el('BR')]),el('DIV',[text('二')])])).source,'一\n\n二');
});
test('async replacement ownership rejects A-slow/B-fast and intervening edits', () => {
  const clock = new M.WriteClock();
  const first = clock.begin(), second = clock.begin();
  assert.equal(clock.accepts(first),false); assert.equal(clock.accepts(second),true);
  clock.changed(); assert.equal(clock.accepts(second),false);
  const third = clock.begin(); assert.equal(clock.accepts(third),true);
});
test('late composition completion cannot end a newer session', () => {
  const owner = new M.CompositionOwner();
  const first = owner.begin({source:'一'});
  const second = owner.begin({source:'二'});
  assert.equal(owner.owns(first),false);
  assert.equal(owner.end(first),false);
  assert.equal(owner.owns(second),true);
  assert.equal(owner.end(second),true);
  assert.equal(owner.current,null);
});
test('noncancelable beforeinput is left to native input synchronization', () => {
  assert.match(script('inline-app'), /history\.selection\(selection.anchor,selection.focus\);\s*if\(!e.cancelable\)return/);
});
test('Selection boundaries directly on an atom preserve full source width', () => {
  const atom=el('SPAN',[el('SVG',[text('metadata')])],{ids:'⿰木水'});
  atom.closest=()=>atom;
  const root=el('DIV',[text('前𠀀'),atom,text('后')]);
  root.contains=node=>node===atom;
  const snap=D.snapshot(root);
  assert.equal(snap.offset(atom,0),3);
  assert.equal(snap.offset(atom,atom.childNodes.length),6);
});
test('native insertion shifts real DOM atom ranges before delayed rendering', () => {
  const atom=el('SPAN',[el('SVG')],{ids:'⿰木水',start:'1'});
  const snap=D.snapshot(el('DIV',[text('XA'),atom]));
  assert.equal(snap.atoms[0].start,2);assert.equal(snap.atoms[0].end,5);
  assert.equal(M.deletion(snap.source,caret(5),-1,snap.atoms).source,'XA⿰木');
});
console.log('\n' + count + ' inline checks passed. Browser / visual / native IME: NOT RUN.');
