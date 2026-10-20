'use strict';
const fs=require('fs'),vm=require('vm'),a=require('assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),script=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const {C,F,M}=vm.runInNewContext(['core','font-fallback','inline-model'].map(script).join('\n')+';({C:Core,F:FontFallback,M:InlineModel})');
let count=0;function test(n,f){f();count++;console.log('PASS '+n)}
const cases=['⿰扌包','⿰亻包','⿰亻报','⿱木包','⿲木包木','⿳木包木','⿰木⿱包龘','⿴囗包','⿰𠮷包'];
for(const s of cases)test('slot geometry and baseline '+s,()=>{const n=C.parse(s)[0],svg=F.svg(n,s),leaves=C.layoutLeaves(n);for(const {box,node} of leaves){a.ok(svg.includes(`matrix(${box[2]/100} 0 0 ${box[3]/100} ${box[0]} ${box[1]})`));a.ok(svg.includes(`>${node.char}</text>`));const baseline=box[1]+.88*box[3];a.ok(baseline>box[1]&&baseline<box[1]+box[3]);}a.equal((svg.match(/font-size="100"/g)||[]).length,leaves.length);a.match(svg,/viewBox="7 7 86 86"/);a.match(svg,/portableOutlines&quot;:false/);});
test('narrow/wide slots do not set local font size by the short axis',()=>{for(const s of ['⿰扌包','⿱木包']){const svg=F.svg(C.parse(s)[0],s);a.doesNotMatch(svg,/font-size="(?:38.7|19.35|77.4)"/);a.match(svg,/font-size="100"/);}});
test('motion leaf uses independent viewport axes, same local origin',()=>{const svg=F.leafSVG('包');a.match(svg,/preserveAspectRatio="none"/);a.match(svg,/matrix\(1 0 0 1 0 0\)/);a.match(svg,/<text x="0" y="88"/);});
test('escaping and existing multi-codepoint leaf contract preserved',()=>{a.match(F.leafSVG('𠮷\u{E0100}'),/𠮷\u{E0100}/u);a.match(F.leafSVG('<>&"\''),/&lt;&gt;&amp;&quot;&apos;/);});
test('exact user source survives project copy/edit/undo',()=>{const s='⿰亻报⿰亻包⿰扌包抱',p=C.project(s);a.equal(C.readProject(JSON.stringify(p)).source,s);const parts=M.parts(s,{anchor:s.length,focus:s.length});a.equal(parts.map(x=>x.text).join(''),s);const history=new C.History(s);history.record(s+'甲',s.length+1,s.length+1);a.equal(history.undo().source,s);});
console.log(count+' em geometry checks passed; mathematical SVG tests, not browser pixel proof.');
