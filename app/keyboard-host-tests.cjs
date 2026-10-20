'use strict';
// Executes the maintained keydown handler with a controlled host. Not native key dispatch.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const extract=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const app=extract('inline-app');
const handler=app.slice(app.indexOf("  editor.addEventListener('keydown'"),app.indexOf("  editor.addEventListener('beforeinput'"));
function run({focused=false,ctrl=false,ime=false,selection={anchor:4,focus:4}}={}) {
  const context={initialSelection:selection,focused,ctrl,ime};
  return vm.runInNewContext(extract('core')+extract('inline-model')+`
    let source='甲⿰亻二乙',selection=initialSelection,composing=ime,prevented=false,callback;
    const atom={dataset:{start:'1',ids:'⿰亻二'}};
    const editor={addEventListener:(name,f)=>callback=f};
    const atomNode=target=>target===atom?atom:null;
    const capture=()=>selection;
    const snapshot=()=>({atoms:[{start:1,end:4}]});
    const apply=result=>{source=result.source;selection=result.selection};
  `+handler+`
    callback({key:'Backspace',target:focused?atom:editor,ctrlKey:ctrl,isComposing:ime,preventDefault(){prevented=true}});
    ({source,prevented});
  `,context);
}
let count=0;function test(name,f){f();count++;console.log('PASS '+name)}
test('focused Unicode atom ordinary Backspace removes only final IDS grapheme',()=>assert.equal(run({focused:true,selection:{anchor:1,focus:4}}).source,'甲⿰亻乙'));
test('focused atom CtrlBackspace deletes its own full IDS',()=>assert.equal(run({focused:true,ctrl:true,selection:{anchor:0,focus:0}}).source,'甲乙'));
test('collapsed atom-tail CtrlBackspace deletes full IDS',()=>{const r=run({ctrl:true});assert.equal(r.source,'甲乙');assert.equal(r.prevented,true)});
test('ordinary text CtrlBackspace remains native',()=>{const r=run({ctrl:true,selection:{anchor:5,focus:5}});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false)});
test('range-selected CtrlBackspace remains native',()=>{const r=run({ctrl:true,selection:{anchor:3,focus:4}});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false)});
test('IME owns Backspace including focused atom and Control modifier',()=>{for(const ctrl of [false,true]){const r=run({focused:true,ctrl,ime:true});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false)}});
console.log('\n'+count+' controlled keyboard checks passed. Actual browser key dispatch and IME remain unverified.');
