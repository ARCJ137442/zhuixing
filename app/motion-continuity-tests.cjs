'use strict';
const fs=require('fs'),vm=require('vm'),a=require('assert/strict');
const h=fs.readFileSync(__dirname+'/index.html','utf8'),script=id=>h.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const C=vm.runInNewContext(script('core')+'\n'+script('composition-motion')+';CompositionMotion;');
let n=0;function test(name,f){f();n++;console.log('PASS '+name)}
for(const duration of [90,180,620,1000])test('phase budget '+duration,()=>{const p=C.phases(duration),k=p.journey('translate(20px,30px) scale(1,1)');a.equal(p.duration,duration);a.equal(k[0].offset,0);a.equal(k[1].offset,.8);a.equal(k[2].offset,1);a.equal(k[1].transform,k[2].transform);a.equal(k[1].opacity,1);a.equal(k[2].opacity,1);a.equal(k[0].easing,C.SETTINGS.easing);a.ok(p.confirmation.every(x=>Number.isFinite(x.opacity)&&Number.isFinite(x.offset)));a.equal(p.confirmation.at(-1).opacity,0);});
test('Unicode/fallback ghost gone by arrival, stable result is not deferred',()=>{const p=C.phases(620,{fading:true}),k=p.journey('translate(0,0)');a.equal(k[0].opacity,.55);a.equal(k[1].opacity,0);a.equal(k[2].opacity,0);a.match(script('composition-motion'),/if\(!part.unicode&&!part.fontFallback\)\{target.style.opacity/);});
test('fast and unavailable source positions use transform-free confirmation',()=>{for(const [d,compact] of [[0,false],[180,true]]){const p=C.phases(d,{compact});a.equal(p.duration,110);a.ok(p.confirmation.every(x=>!('transform'in x)));}});
test('arrival confirmation has no premature full-box pulse or moving target',()=>{const k=C.phases(620).confirmation;a.equal(k[0].opacity,0);a.equal(k[1].offset,.65);a.equal(k[1].opacity,0);a.equal(k[2].offset,.8);a.ok(k.every(x=>!('transform'in x)));});
test('crowded Unicode uses existing compact path, no additional scheduler',()=>{a.match(script('composition-motion'),/part.unicode&&items.length>4/);a.doesNotMatch(script('composition-motion'),/setTimeout|setInterval|requestAnimationFrame/);});
test('overlay remains noninteractive and absent from accessibility tree',()=>{a.match(h,/\.composition-overlay[^}]*pointer-events:none/);a.match(script('composition-motion'),/overlay.setAttribute\('aria-hidden', 'true'\)/);});
test('source transaction remains outside animation phases',()=>{const s=script('composition-motion');a.doesNotMatch(s,/history\.record|source\s*=|selection\s*=/);a.match(s,/if \(!plans.length \|\| !canAnimate\(\)\) return/);a.match(s,/if \(this.current === ticket\) this.cancel\(\)/);});
console.log(n+' motion continuity checks passed (not browser perception evidence).');
