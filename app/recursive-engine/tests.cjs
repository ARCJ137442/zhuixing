const assert=require('node:assert/strict'),{create,parseForest,serialize}=require('./engine.cjs');
const rows=[{character:'保',ids:'⿰亻呆'},{character:'呆',ids:'⿱口木'},{character:'仁',ids:'⿰亻二'},{character:'仨',ids:'⿰亻三'},{character:'俩',ids:'⿰亻两'}];const E=create(rows);
const cases=[];function test(name,f){f();cases.push(name);}
test('direct and recursively expanded 保 resolve to same Unicode',()=>{for(const x of ['⿰亻呆','⿰亻⿱口木'])assert.equal(E.lookup(x).character,'保');});
test('one-step bottom-up folding has no cascading within operation',()=>{assert.equal(E.transform('⿰亻⿱口木','fold-one').source,'⿰亻呆');assert.equal(E.transform('⿰亻呆','fold-one').source,'保');});
test('full folding selected mixed expressions becomes 保保保',()=>assert.equal(E.transform('⿰亻呆⿰亻⿱口木保','fold-all').source,'保保保'));
test('one-step expansion is symmetric in levels',()=>{assert.equal(E.transform('保','expand-one').source,'⿰亻呆');assert.equal(E.transform('⿰亻呆','expand-one').source,'⿰亻⿱口木');});
test('full expansion stops at known dataset leaves',()=>assert.equal(E.transform('保','expand-all').source,'⿰亻⿱口木'));
test('matched display query leaves raw source unchanged',()=>{const s='⿰亻⿱口木';E.lookup(s);assert.equal(s,'⿰亻⿱口木');});
test('direct example triple resolves through dataset not font heuristic',()=>{for(const [ids,c] of [['⿰亻三','仨'],['⿰亻两','俩'],['⿰亻二','仁']])assert.equal(E.lookup(ids).character,c);});
test('ambiguous direct match does not choose first row',()=>{const a=create([{character:'甲',ids:'⿰木木'},{character:'乙',ids:'⿰木木'}]);assert.equal(a.lookup('⿰木木').kind,'ambiguous');assert.equal(a.transform('⿰木木','fold-all').source,'⿰木木');});
test('multiple decompositions remain unchanged until explicit choice',()=>{const a=create([{character:'甲',ids:'⿰木木'},{character:'甲',ids:'⿱木木'}]);assert.equal(a.transform('甲','expand-one').source,'甲');});
test('cycles and expansion budgets never destroy source',()=>{const a=create([{character:'甲',ids:'⿰甲甲'}]);assert.ok(a.stats.blockedCharacters>0);const r=a.transform('甲','expand-all');assert.equal(r.source,'甲');assert.equal(r.status,'budget-exceeded');});
test('invalid source and unknown commands fail safely',()=>{assert.equal(E.transform('⿰亻','fold-all').source,'⿰亻');assert.throws(()=>E.transform('保','eval'));});
test('variation sequences and supplementary characters preserved',()=>{for(const s of ['保\uFE00','𰻝\u{E0100}','甲乙'])assert.equal(E.transform(s,'expand-all').source,s);});
test('all roundtrips retain source serialization',()=>{for(const s of ['⿰亻呆⿰亻⿱口木保','⿳木⿲口人中木','保\u{E0100}'])assert.equal(parseForest(s).map(serialize).join(''),s);});
console.log(JSON.stringify({passed:cases.length,cases,note:'Pure module prototype only; not browser integration or full linguistic equivalence certification.'},null,2));
