'use strict';
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname+'/index.html','utf8');
const extract = id => html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const P = vm.runInNewContext(extract('input-pacing')+';InputPacing');
let count=0;
function test(name, run) { run(); count++; console.log('PASS '+name); }
function rig() {
  let time=0;
  const controller=new P.Controller({now:()=>time});
  return {c:controller, advance:ms=>time+=ms, plan:speed=>controller.plan({baseDurationMs:620,speed}), beat:()=>controller.record('beat'), ime:units=>controller.record('ime',{units})};
}
function burst(r, ms, number=6, kind='beat') { for(let i=0;i<number;i++){r.advance(ms);kind==='beat'?r.beat():r.ime(1);} }
test('initial presentation uses baseline without delaying semantic edits',()=>{const r=rig();assert.equal(r.plan().durationMs,620);assert.equal(r.plan().settleMs,300);});
test('only one committed codepoint or deletion counts as a typing beat',()=>{for(const data of ['木','𠮷'])assert.equal(P.classify({inputType:'insertText',data}),'beat');for(const inputType of ['deleteContentBackward','deleteContentForward'])assert.equal(P.classify({inputType}),'beat');});
test('paste replacement import-like and multi-codepoint input are not synthetic keystrokes',()=>{for(const inputType of ['insertFromPaste','insertReplacementText','historyUndo','insertParagraph'])assert.equal(P.classify({inputType,data:'木'}),'discrete');assert.equal(P.classify({inputType:'insertText',data:'中文'}),'discrete');});
test('composition input events never supply beats',()=>assert.equal(P.classify({inputType:'insertText',data:'字',isComposing:true}),'ignore'));
test('one interval is insufficient to guess a fast user',()=>{const r=rig();burst(r,50,2);assert.equal(r.plan().durationMs,620);});
test('sustained fast typing shortens both visual wait and animation',()=>{const r=rig();burst(r,100);assert.ok(r.plan().durationMs<200);assert.ok(r.plan().settleMs<120);assert.ok(r.plan().durationMs>=80);});
test('extreme typing uses stable presentation even with slow manual playback',()=>{const r=rig();burst(r,50,4);assert.equal(r.plan(.6).durationMs,0);assert.equal(r.plan(.6).settleMs,80);});
test('short pause recovers continuously, without a discrete duration jump',()=>{const r=rig();burst(r,100);r.advance(450);const a=r.plan().durationMs;r.advance(100);const b=r.plan().durationMs;r.advance(100);const c=r.plan().durationMs;assert.ok(a<b&&b<c&&c<620);});
test('first keystroke after a pause does not reset or revive pressure',()=>{const r=rig();burst(r,100);r.advance(1700);const before=r.plan();r.beat();assert.deepEqual(r.plan(),before);});
test('long idle converges to manual baseline',()=>{const r=rig();burst(r,100);r.advance(20000);assert.equal(r.plan().durationMs,620);assert.equal(r.plan().settleMs,300);});
test('manual speed remains a baseline rather than defeating adaptation',()=>{const r=rig();assert.ok(r.plan(.6).durationMs>r.plan(1).durationMs);assert.ok(r.plan(1).durationMs>r.plan(1.65).durationMs);const slow=r.plan(.6).durationMs;burst(r,100);assert.ok(r.plan(.6).durationMs<slow);});
test('non-typing operations break the sampling chain but do not create speed evidence',()=>{const r=rig();r.beat();r.advance(100);r.c.record('discrete');r.advance(1);r.beat();assert.equal(r.plan().durationMs,620);});
test('equal or reversed clock readings do not fabricate extreme typing',()=>{const r=rig();for(let i=0;i<10;i++)r.beat();assert.equal(r.plan().durationMs,620);r.advance(-10);r.beat();assert.equal(r.plan().durationMs,620);});
test('multiple compositionupdates ignored without changing measured state',()=>{const r=rig();burst(r,100);const before=r.plan();for(let i=0;i<100;i++)r.c.record('ignore');assert.deepEqual(r.plan(),before);});
test('short repeated IME commits accelerate without counting text length as keys',()=>{const r=rig();for(let i=0;i<6;i++){r.c.breakSequence({includeCommits:false});r.advance(100);r.ime(2);}assert.ok(r.plan().durationMs<200);assert.equal(r.c.intervals,0);});
test('long candidate wait is not a slow-typing sample',()=>{const r=rig();burst(r,100,6,'ime');r.advance(800);const before=r.plan();r.ime(1);assert.deepEqual(r.plan(),before);});
test('a large IME confirmation is one batch with a static result',()=>{const r=rig();r.ime(8);assert.equal(r.plan().durationMs,0);assert.equal(r.plan().settleMs,80);assert.equal(r.c.intervals,0);assert.equal(r.c.commitIntervals,0);r.advance(1000);assert.equal(r.plan().durationMs,620);});
test('paste undo and import break both regular and IME chains',()=>{const r=rig();r.ime(1);r.advance(100);r.c.breakSequence();r.advance(1);r.ime(1);assert.equal(r.c.commitIntervals,0);assert.equal(r.plan().durationMs,620);});
test('IME commit interval of zero is not fast-typing evidence',()=>{const r=rig();for(let i=0;i<6;i++)r.ime(1);assert.equal(r.plan().durationMs,620);});
test('adaptive duration is injected into motion, not into source or history',()=>{const app=extract('inline-app');assert.match(app,/duration: speed => pacing.plan/);assert.match(app,/setTimeout\(\(\)=>render\(\),pacing.plan/);assert.match(app,/if \(result.source !== source\) pacing.record\(inputKind\)/);assert.match(app,/readNative\(\{inputKind:'ime',units:/);assert.doesNotMatch(extract('input-pacing'),/document\.|history\.|selection\.|source\s*=/);});
console.log('\n'+count+' deterministic pacing checks passed. Parameter values are initial policy, not measured UX targets.');
