// Synthetic envelope fixtures, not authoritative character decompositions.
const assert=require('node:assert/strict'),I=require('./importer.cjs');
const r=I.line('甲\t⿰木木.(.);⿰木木J(J)',1);assert.equal(r.errors.length,0);assert.equal(r.columns[0].entries[0].expression,'⿰木木.');assert.equal(r.columns[0].entries[1].variantGroups[0].value,'J');
assert.equal(r.columns[0].entries.map(e=>e.raw).join(';'),r.columns[0].raw);
const x=I.line('乙\t⿻[l,l,.]木木.(.);⿻[l,l,.]木木.(J)',2);assert.equal(x.columns[0].entries[0].annotations[1].raw,'[l,l,.]');
assert.equal(I.entry('#(H)(.)').variantGroups.length,2);
assert.equal(I.line('甲\t⿰木[abc',3).errors[0].code,'unclosed-group');
assert.equal(I.line('丙\t⿱木.木.\t⿱木.木.',4).columns[1].role,'alternative');
console.log('8 synthetic lossless envelope assertions passed; no projection/semantic coverage claimed');
