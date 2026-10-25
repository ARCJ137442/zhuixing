'use strict';
// Independent regression audit. Read-only implementation checks; no network or deployment.
// Runs both the source module and the exact embedded module from the candidate HTML.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const dir=__dirname,enginePath=path.resolve(dir,'./recursive-engine/engine.cjs');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const script=id=>{const m=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'));assert.ok(m,'script '+id);return m[1];};
const embedded=vm.runInNewContext(script('unicode-matches')+';({api:RecursiveIDS,index:RecursiveIndex,unicode:UnicodeMatches})');
const source=require(enginePath),rows=JSON.parse(fs.readFileSync(path.join(dir,'recursive-ids.rows.json'),'utf8'));
const actual=source.create(rows),apis=[['source',source],['embedded',embedded.api]];
const result={timestamp:new Date().toISOString(),sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(enginePath)).digest('hex'),candidateSHA256:crypto.createHash('sha256').update(html).digest('hex'),checks:[],observations:{}};
function test(name,fn){try{fn();result.checks.push({name,passed:true});}catch(error){result.checks.push({name,passed:false,error:error.message});}}
const same=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const range=s=>({anchor:0,focus:s.length});
const fixture=[{character:'保',ids:'⿰亻呆'},{character:'呆',ids:'⿱口木'},{character:'仁',ids:'⿰亻二'}];
function both(fn){for(const [name,api]of apis)fn(api,name);}

// Existing host adapter is loaded without its test runner. This executes actual app handlers,
// but is not a browser/native-selection or visual-motion test.
const hostSource=fs.readFileSync(path.join(dir,'input-flow-host-tests.cjs'),'utf8').split('const cases=[];')[0];
const makeHost=new Function('require','__dirname',hostSource+';return host;')(require,dir);

test('embedded module exactly matches maintained source module',()=>{const body=html.match(/const RecursiveIDS=\(\(\)=>\{([\s\S]*?)\r?\nreturn \{create,parseForest,serialize\};\r?\n\}\)\(\);/)[1].replace(/\r\n/g,'\n');assert.equal(fs.readFileSync(enginePath,'utf8').replace(/\r\n/g,'\n').replace(/\nmodule.exports=\{create,parseForest,serialize\};\s*$/,'').trim(),body.trim());});
test('every retained dataset definition remains parseable and indexed',()=>both(api=>{for(const r of rows)assert.doesNotThrow(()=>api.parseForest(r.ids),r.character+'='+r.ids);assert.equal(api.create(rows).stats.characters,new Set(rows.map(r=>r.character)).size);}));
test('standalone and embedded engines agree on genuine corpus transforms',()=>{for(const s of ['⿰亻呆⿰亻⿱口木保','⿱田⿰田田','⿱罒⿰讠刂','A\n⿰亻二\u200D\nB','保\uFE00 𰻝\u{E0100}'])for(const cmd of ['fold-one','fold-all','expand-one','expand-all'])same(actual.transform(s,cmd),embedded.index.transform(s,cmd));});
test('user example normalizes all three presentations to 保 without source mutation',()=>{for(const s of ['⿰亻呆','⿰亻⿱口木'])assert.equal(embedded.unicode.lookup(s),'保');const s='⿰亻呆⿰亻⿱口木保';assert.equal(actual.transform(s,'fold-all').source,'保保保');assert.equal(s,'⿰亻呆⿰亻⿱口木保');});
test('ordinary two-level fold-one advances exactly one available leaf layer',()=>both(api=>{const e=api.create(fixture);assert.equal(e.transform('⿰亻⿱口木','fold-one').source,'⿰亻呆');assert.equal(e.transform('⿰亻呆','fold-one').source,'保');}));
test('fold-one does not bypass an unmapped inner operator',()=>both(api=>{const s='⿱⿰木木火',e=api.create([{character:'丙',ids:s}]);assert.equal(e.transform(s,'fold-one').source,s);}));
test('fold-one does not bypass an ambiguous inner operator',()=>both(api=>{const s='⿱⿰木木火',e=api.create([{character:'甲',ids:'⿰木木'},{character:'乙',ids:'⿰木木'},{character:'丙',ids:s}]);assert.equal(e.transform(s,'fold-one').source,s);}));
test('genuine nested mappings do not skip levels in fold-one',()=>{for(const s of ['⿱田⿰田田','⿱罒⿰讠刂'])assert.equal(actual.transform(s,'fold-one').source,s);});
test('fold-all may still collapse a known full structure without mapped intermediate glyph',()=>both(api=>{const s='⿱⿰木木火',e=api.create([{character:'丙',ids:s}]);assert.equal(e.transform(s,'fold-all').source,'丙');}));
test('genuine full nested 畾 and 罚 mappings still fold completely',()=>{assert.equal(actual.transform('⿱田⿰田田','fold-all').source,'畾');assert.equal(actual.transform('⿱罒⿰讠刂','fold-all').source,'罚');});
test('direct evidence cannot hide a conflicting recursive candidate',()=>both(api=>{const e=api.create([{character:'甲',ids:'⿰乙木'},{character:'丙',ids:'⿰⿱火土木'},{character:'乙',ids:'⿱火土'}]);assert.equal(e.lookup('⿰乙木').kind,'ambiguous');assert.equal(e.transform('⿰乙木','fold-all').source,'⿰乙木');}));
test('full recursive fold is one actual-app undo/redo transaction',()=>{const h=makeHost();const s='⿰亻呆⿰亻⿱口木保';h.type(s);h.select(0,s.length);h.ids.get('join-selection').click();assert.equal(h.source(),'保保保');h.ids.get('undo').click();assert.equal(h.source(),s);h.ids.get('redo').click();assert.equal(h.source(),'保保保');});
test('fold-all retains mixed content and marked clusters',()=>{const s='A\n⿰亻⿱口木，保\uFE00𰻝\u{E0100}👩‍💻';assert.equal(actual.transform(s,'fold-all').source,'A\n保，保\uFE00𰻝\u{E0100}👩‍💻');});
test('fold-all preserves a leaf-attached ZWJ rather than migrating it onto mapped result',()=>{const s='A\n⿰亻二\u200D\nB';assert.equal(actual.transform(s,'fold-all').source,s);});
test('expand-one preserves a ZWJ-bound glyph cluster',()=>{const s='保\u200D';assert.equal(actual.transform(s,'expand-one').source,s);});
test('actual app join handler preserves a leaf-attached ZWJ',()=>{const h=makeHost();const s='A\n⿰亻二\u200D\nB';h.type(s);h.select(0,s.length);h.ids.get('join-selection').click();assert.equal(h.source(),s);});
test('variation selectors and combining marks never migrate',()=>both(api=>{const e=api.create(fixture);for(const ext of ['\uFE00','\u{E0100}','\u0301']){const s='⿰亻二'+ext;assert.equal(e.transform(s,'fold-all').source,s);assert.equal(e.transform('保'+ext,'expand-all').source,'保'+ext);}}));
test('late ambiguous expansion rolls the whole command back to original source',()=>both(api=>{const e=api.create([{character:'甲',ids:'⿰乙木'},{character:'乙',ids:'⿱火土'},{character:'乙',ids:'⿰火土'}]);const r=e.transform('甲','expand-all');assert.equal(r.source,'甲');assert.equal(r.changed,false);assert.equal(r.status,'needs-choice');}));
test('ambiguous exact match is not guessed',()=>both(api=>{const e=api.create([{character:'甲',ids:'⿰木木'},{character:'乙',ids:'⿰木木'}]);assert.equal(e.lookup('⿰木木').kind,'ambiguous');assert.equal(e.transform('⿰木木','fold-all').source,'⿰木木');}));
test('recursive expansion and size budgets retain original source',()=>both(api=>{const e=api.create([{character:'甲',ids:'⿰甲甲'}]);const r=e.transform('甲','expand-all');assert.equal(r.source,'甲');assert.equal(r.changed,false);assert.ok(['cycle','budget-exceeded'].includes(r.status));}));
test('normalization depth budget is independent of dataset row order',()=>both(api=>{const rows=[{character:'甲',ids:'⿰乙木'},{character:'乙',ids:'⿰火土'}],a=api.create(rows,{maxDepth:4}),b=api.create([...rows].reverse(),{maxDepth:4});same(a.lookup('⿰⿰火土木'),b.lookup('⿰⿰火土木'));}));
test('successful transformations remain valid under the engine own tree limits',()=>both(api=>{const rows=[];for(let i=0;i<20;i++)rows.push({character:String.fromCodePoint(0xe000+i),ids:'⿰木⿰木'+String.fromCodePoint(0xe001+i)});const e=api.create(rows),r=e.transform('\ue000','expand-all');if(r.changed)assert.doesNotThrow(()=>api.parseForest(r.source));else assert.equal(r.source,'\ue000');}));
test('actual app split preserves incomplete and invalid structures',()=>{for(const s of ['⿰保\n','⿰保,']){const h=makeHost();h.type(s);h.select(0,s.length);h.ids.get('split-selection').click();assert.equal(h.source(),s);}});
test('incomplete and unsupported source remains untouched',()=>both(api=>{const e=api.create(fixture);for(const s of ['⿰亻','⿾保','⿰保\n','⿰保,'])for(const command of ['fold-all','expand-all'])assert.equal(e.transform(s,command).source,s);}));

const skipped=[],invalidRows=[];for(const {character,ids}of rows){try{const n=source.parseForest(ids)[0];if(n.children.some(c=>c.children.length)&&actual.transform(ids,'fold-one').source===character)skipped.push({character,ids});}catch(error){invalidRows.push({character,ids,error:error.message});}}
result.observations.invalidRows=invalidRows;
result.observations.actualCorpusNestedSingleStepCollapses={count:skipped.length,examples:skipped.slice(0,15)};
result.observations.stats=actual.stats;
result.observations.scope='No source or data edits, network, installation, deployment, or real browser visual certification.';
result.passed=result.checks.filter(x=>x.passed).length;result.failed=result.checks.length-result.passed;
fs.writeFileSync(path.join(dir,'recursive-audit-results.json'),JSON.stringify(result,null,2)+'\n');
for(const c of result.checks)console.log((c.passed?'PASS ':'FAIL ')+c.name+(c.error?'\n  '+c.error:''));
console.log(`\n${result.passed}/${result.checks.length} passed; ${result.failed} regressions or boundary failures.`);
process.exitCode=result.failed?1:0;
