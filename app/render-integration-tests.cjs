'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),get=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const {C,R,I,O}=vm.runInNewContext(['core','font-fallback','optical-engine','glyph-renderer','glyph-identity'].map(get).join('\n')+';({C:Core,R:GlyphRenderer,I:GlyphIdentity,O:OpticalGlyph})',{structuredClone});
const plan=(s,optical=true)=>R.plan(C.parse(s)[0],s,{optical});let count=0;function test(n,f){f();count++;console.log('PASS '+n)}
test('optical ready uses original normalized frame not legacy crop',()=>{const p=plan('⿱人中');assert.equal(p.layoutMode,'optical');assert.equal(p.viewBox.join(' '),'0 0 100 100');assert.ok(p.svg.includes('viewBox="0 0 100 100"'));assert.equal(p.leaves.length,2);});
test('preview export and leaf paint share one product',()=>{const p=plan('⿰人呆');for(const leaf of p.leaves){assert.ok(p.svg.includes(leaf.paintGroup));assert.ok(leaf.paintGroup.includes(leaf.paint));assert.equal(leaf.node.char,leaf.char);}assert.equal(p.portableOutlines,true)});
test('new engine assets not blocked by old missing-outline fact',()=>{const s='⿱你中';assert.equal(C.status(C.parse(s)[0]).render,'missing');const p=plan(s);assert.equal(p.layoutMode,'optical');assert.equal(p.portableOutlines,true);});
test('explicit optical off returns old geometry without source mutation',()=>{const p=plan('⿱人中',false);assert.equal(p.layoutMode,'geometric');assert.ok(p.svg.includes('7 7 86 86'));});
test('missing material retains truthful font fallback',()=>{const p=plan('⿰木尔');assert.equal(p.kind,'font');assert.equal(p.portableOutlines,false);assert.ok(p.svg.includes('<text'));});
test('unsupported remains source',()=>assert.equal(plan('⿾尔').kind,'source'));
test('Unicode identity does not conflate font availability or block coverage',()=>{assert.match(I.describe('你'),/Unicode 已收录.*基本区.*U\+4F60/);assert.match(I.describe('𰻝'),/扩展G区.*U\+30EDD/);assert.equal(I.describe(String.fromCodePoint(0x3134B)),'字符身份未核对');});
test('complex original literal markers remain malformed without normalization',()=>{const s='⿺辶⿳穴⿲月⿱svg𮘎⿰svg𲈤长刂心';const roots=C.parse(s);assert.equal(roots.map(n=>s.slice(n.start,n.end)).join(''),s);assert.equal(C.status(roots[0]).syntax,'syntaxerror');assert.equal(plan(s).kind,'source');});
test('legal larger Core depth not rejected by optical capacity',()=>{let s='木';for(let i=0;i<20;i++)s='⿰木'+s;assert.equal(O.eligibility(s).render,'not-applicable');assert.equal(plan(s).kind,'outline');});
test('cross-axis guard chooses identical same-font control not tiny ready geometry',()=>{for(const source of ['⿰乃至','⿰三木']){const p=plan(source),q=p.metrics.qualityGuard;assert.equal(p.layoutMode,'same-font-geometric-fallback');assert.equal(q.applied,true);assert.ok(q.selectedSpan>=.9*q.controlSpan||q.controlSpan-q.selectedSpan<=5);assert.equal(p.svg,O.render(source,{mode:'equal-box'}).svg);for(const leaf of p.leaves)assert.ok(p.svg.includes(leaf.paintGroup));}});
test('expanded target identities require explicit assignment set not block inference',()=>{for(const c of ['保','仨','俩'])assert.match(I.describe(c),/Unicode 已收录.*基本区/);assert.equal(I.describe(String.fromCodePoint(0x3134B)),'字符身份未核对');});
console.log('\n'+count+' shared-render integration checks passed. No real font/layout/performance certification.');
