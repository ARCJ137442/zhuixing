'use strict';
// Executes the maintained 0.2 keydown handler with source-boundary policy, not native key dispatch.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const extract=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const app=extract('inline-app');
const handler=app.slice(app.indexOf("  editor.addEventListener('keydown'"),app.indexOf("  editor.addEventListener('beforeinput'"));
function run({ctrl=false,ime=false,selection={anchor:4,focus:4},unit='ids-grapheme',view='live',key='Backspace',altGraph=false}={}) {
  const context={initialSelection:selection,ctrl,ime,unit,view,key,altGraph,Intl,navigator:{platform:'Linux'}};
  return vm.runInNewContext(['core','unicode-matches','inline-model','edit-boundary','selection-commands','editor-commands'].map(extract).join('\n')+`
    let source='甲⿰亻二乙',selection=initialSelection,composing=ime,prevented=false,callback;
    const editor={addEventListener:(name,f)=>callback=f};
    const settingsStore={snapshot:{'editor.unit':unit,'editor.view':view,'unicode.presentation':true}};
    const editable=()=>view!=='preview';
    const capture=()=>selection;
    const apply=result=>{source=result.source;selection=result.selection};
  `+handler+`
    callback({key,target:editor,ctrlKey:ctrl,isComposing:ime,getModifierState:()=>altGraph,preventDefault(){prevented=true}});
    ({source,prevented});
  `,context);
}
let count=0;function test(name,f){f();count++;console.log('PASS '+name)}
test('IDS unit Backspace removes final source grapheme',()=>assert.equal(run().source,'甲⿰亻乙'));
test('display unit Backspace removes full root',()=>assert.equal(run({unit:'display-glyph'}).source,'甲乙'));
test('display forward Delete agrees with backward deletion',()=>assert.equal(run({unit:'display-glyph',key:'Delete',selection:{anchor:1,focus:1}}).source,'甲乙'));
test('source view overrides saved display unit and retains partial range precision',()=>{assert.equal(run({unit:'display-glyph',view:'source'}).source,'甲⿰亻乙');assert.equal(run({unit:'display-glyph',selection:{anchor:3,focus:4}}).source,'甲⿰亻乙');});
test('readonly and AltGraph do not enter deletion adapter',()=>{for(const opts of [{view:'preview'},{ctrl:true,altGraph:true}]){const r=run(opts);assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false)}});
test('IME owns Backspace including Control modifier',()=>{for(const ctrl of [false,true]){const r=run({ctrl,ime:true});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false)}});
console.log('\n'+count+' controlled keyboard checks passed. Actual browser key dispatch and IME remain unverified.');
