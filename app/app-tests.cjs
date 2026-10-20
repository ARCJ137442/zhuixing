'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const C=vm.runInNewContext(script+';Core;');
let count=0;function test(name,f){try{f();console.log('PASS '+name);count++}catch(e){console.error('FAIL '+name);throw e}}
function root(s){return C.parse(s).find(n=>n.type==='operator')}
const cases=JSON.parse(fs.readFileSync(__dirname+'/test-cases.json')).parserCases;
for(const c of cases)test(c.id,()=>{const ts=C.parse(c.source),n=ts.find(x=>x.type==='operator'),e=c.expected;assert.equal(ts.map(t=>c.source.slice(t.start,t.end)).join(''),c.source);if(e.syntax)assert.equal(n.status,e.syntax);if(e.strictSyntax)assert.equal(n.status,'syntaxerror');if(e.arity)assert.equal(n.children.length,e.arity);if(e.idsSource)assert.equal(c.source.slice(n.start,n.end),e.idsSource);if(e.utf16Range)assert.equal(JSON.stringify([n.start,n.end]),JSON.stringify(e.utf16Range));if(e.trailingText)assert.equal(ts.at(-1).text,e.trailingText);if(e.missingOperands){let i=0;C.walk(n,x=>{if(x.type==='missing')i++});assert.equal(i,e.missingOperands)}if(e.render==='unsupported-not-fake-subtraction')assert.equal(C.status(n).render,'unsupported');if(e.iviOutsideIds)assert.equal(ts[0].text,'〾');if(e.mustNotSilentlyConsumeAcrossNewline)assert.equal(n.status,'incomplete');});
test('12 supported layouts export paths, no font text',()=>{for(const op of Object.keys(C.NAMES)){let s=op+'木'.repeat(C.OPS[op]),out=C.svg(root(s),s);assert.match(out,/<path/);assert.doesNotMatch(out,/<text|<script|href=/);assert.match(out,/viewBox="0 0 100 100"/);assert.match(out,/非规范字形/);}});
test('five new IDC parse but do not fake render',()=>{for(const op of ['⿼','⿽','⿾','⿿','㇯']){let s=op+'木'.repeat(C.OPS[op]);assert.equal(root(s).status,'complete');assert.equal(C.status(root(s)).render,'unsupported');assert.throws(()=>C.svg(root(s),s));}});
test('unknown CJK is missing, not syntax error',()=>{assert.equal(root('⿰龘青').status,'complete');assert.equal(C.status(root('⿰龘青')).render,'missing')});
test('JSON exact roundtrip and bundled dependency',()=>{const s='字：⿰⿱宀女木\n⿰𠮷木';const p=C.project(s);assert.ok(p.dependencies.木);assert.equal(C.readProject(JSON.stringify(p)).source,s)});
test('incomplete JSON roundtrip',()=>{let s='⿲木';assert.equal(C.readProject(JSON.stringify(C.project(s))).source,s)});
test('reject malformed and version mismatches',()=>{for(const x of ['',null,'{}','[]','null'])assert.throws(()=>C.readProject(x));for(const [key,val]of [['formatVersion',99],['rendererVersion','future'],['dataVersion','future'],['source',null]]){let p=C.project('⿰木水');p[key]=val;assert.throws(()=>C.readProject(JSON.stringify(p)))}});
test('reject arbitrary dependency injection',()=>{let p=C.project('⿰木水');p.dependencies.木=['M0 0"/><script>alert(1)</script>'];assert.throws(()=>C.readProject(JSON.stringify(p)));p=C.project('⿰木水');p.dependencies.__evil__=['M0 0'];assert.throws(()=>C.readProject(JSON.stringify(p)))});
test('missing bundled dependency rejected',()=>{let p=C.project('⿰木水');delete p.dependencies.木;assert.throws(()=>C.readProject(JSON.stringify(p)))});
test('file, source and depth bounds',()=>{assert.throws(()=>C.readProject(' '.repeat(200001)));assert.throws(()=>C.parse('木'.repeat(4001)));assert.throws(()=>C.parse('⿰'.repeat(33)+'木'.repeat(34)));assert.doesNotThrow(()=>C.parse('⿰'.repeat(31)+'木'.repeat(32)))});
test('source undo redo and branch',()=>{let h=new C.History('⿰木水');h.selection(1,2);h.record('⿰日水',2,2);assert.equal(h.undo().source,'⿰木水');assert.equal(h.redo().source,'⿰日水');h.undo();h.record('⿱木水',1,1);assert.equal(h.redo(),null);assert.equal(h.undo().start,1)});
test('history memory bounded',()=>{let h=new C.History('');for(let i=0;i<150;i++)h.record(String(i),0,0);assert.equal(h.items.length,100);assert.equal(h.index,99)});
test('different input paths parse identically',()=>{const source='⿰⿱宀女木',h=new C.History('');let typed='';for(const char of source){typed+=char;h.record(typed,typed.length,typed.length)}assert.equal(JSON.stringify(C.parse(typed)),JSON.stringify(C.parse(source)))});
test('escaping all HTML significant characters',()=>{assert.equal(C.esc(`<img x="'">&`),'&lt;img x=&quot;&apos;&quot;&gt;&amp;')});
test('no remote script, fonts or dependencies',()=>{assert.doesNotMatch(html,/<script\s+src|@import|url\(https?:|<link\s[^>]*href="https?:/i)});
test('all scripts compile',()=>{for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1])});
console.log('\n'+count+' tests passed. Browser/IME integration is not implied by these tests.');
