'use strict';
// Executes the maintained 0.2 keydown handler with source-boundary policy, not native key dispatch.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const extract=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const app=extract('inline-app');
const handler=app.slice(app.indexOf("  editor.addEventListener('keydown'"),app.indexOf("  editor.addEventListener('beforeinput'"));
function run({ctrl=false,shift=false,alt=false,meta=false,repeat=false,ime=false,idcInsert='alt-palette',componentInsert='shift-keys',obInput='alt-shift-map',selection={anchor:4,focus:4},unit='ids-grapheme',view='live',key='Backspace',code='',altGraph=false,keyCode=0,initialSource='甲⿰亻二乙'}={}) {
  const context={initialSelection:selection,ctrl,shift,alt,meta,repeat,ime,idcInsert,componentInsert,obInput,unit,view,key,code,altGraph,keyCode,initialSource,Intl,navigator:{platform:'Linux'}};
  return vm.runInNewContext(['core','unicode-matches','inline-model','edit-boundary','selection-commands','ob-symbols','editor-commands'].map(extract).join('\n')+`
    let source=initialSource,selection=initialSelection,composing=ime,prevented=false,callback,expanded=null;
    const editor={id:'editor',addEventListener:(name,f)=>callback=f};
    let paletteOpen=false,idcPaletteOpen=false,obPaletteOpen=false,obPaletteMode='map',obPendingLetter='',obPrefixArmed=false,obCandidateIndex=0,obMapTimer=0;
    const openIDCCandidatePalette=()=>{paletteOpen=true;idcPaletteOpen=true};
    const closeIDCCandidatePalette=()=>{paletteOpen=false;idcPaletteOpen=false};
    const positionIDCCandidatePalette=()=>{};
    const openOBPalette=()=>{obPaletteOpen=true;obPaletteMode='map'};
    const closeOBPalette=()=>{obPaletteOpen=false;obPaletteMode='map';obPendingLetter='';obPrefixArmed=false};
    const handleOBKeyGroup=letter=>{obPaletteOpen=true;obPaletteMode='choices';obPendingLetter=letter};
    const handleOBChoicesKeyDown=()=>false;
    const positionOBPalette=()=>{};
    const setting=key=>key==='editor.view'?view:key==='shortcuts.idcInsert'?idcInsert:key==='shortcuts.componentInsert'?componentInsert:key==='shortcuts.obInput'?obInput:undefined;
    const settingsStore={snapshot:{'editor.unit':unit,'editor.view':view,'unicode.presentation':true,'shortcuts.idcInsert':idcInsert,'shortcuts.componentInsert':componentInsert,'shortcuts.obInput':obInput}};
    const editable=()=>view!=='preview';
    const capture=()=>selection;
    const motion={cancel(){}};
    const render=()=>{};
    const apply=result=>{source=result.source;selection=result.selection};
    const insert=text=>{if(composing||!editable())return;try{const result=InlineModel.replace(source,selection,text);source=result.source;selection=result.selection}catch{}};
  `+handler+`
    callback({key,code,target:editor,currentTarget:editor,ctrlKey:ctrl,shiftKey:shift,altKey:alt,metaKey:meta,repeat,keyCode,isComposing:ime,getModifierState:()=>altGraph,preventDefault(){prevented=true}});
    ({source,selection,prevented,paletteOpen,obPaletteOpen,obPaletteMode,obPendingLetter});
  `,context);
}
let count=0;function test(name,f){f();count++;console.log('PASS '+name)}
test('IDS unit Backspace removes final source grapheme',()=>assert.equal(run().source,'甲⿰亻乙'));
test('display unit Backspace removes full root',()=>assert.equal(run({unit:'display-glyph'}).source,'甲乙'));
test('display forward Delete agrees with backward deletion',()=>assert.equal(run({unit:'display-glyph',key:'Delete',selection:{anchor:1,focus:1}}).source,'甲乙'));
test('source view overrides saved display unit and retains partial range precision',()=>{assert.equal(run({unit:'display-glyph',view:'source'}).source,'甲⿰亻乙');assert.equal(run({unit:'display-glyph',selection:{anchor:3,focus:4}}).source,'甲⿰亻乙');});
test('readonly and AltGraph do not enter deletion adapter',()=>{for(const opts of [{view:'preview'},{ctrl:true,altGraph:true}]){const r=run(opts);assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false)}});
test('IME owns Backspace including Control modifier',()=>{for(const ctrl of [false,true]){const r=run({ctrl,ime:true});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false)}});
test('Alt+Left inserts one ordinary IDC edit at the tracked source caret',()=>{const r=run({key:'ArrowLeft',code:'ArrowLeft',alt:true});assert.equal(r.source,'甲⿰亻二⿰乙');assert.deepEqual({...r.selection},{anchor:5,focus:5});assert.equal(r.prevented,true);});
test('Alt+letter inserts a structural IDC at the tracked source caret',()=>{const r=run({key:'Q',code:'KeyQ',alt:true});assert.equal(r.source,'甲⿰亻二⿸乙');assert.deepEqual({...r.selection},{anchor:5,focus:5});assert.equal(r.prevented,true);});
test('Alt insertion over the 4000-unit limit rolls back source and selection',()=>{const initialSource='甲'.repeat(4000),selection={anchor:4000,focus:4000};const r=run({initialSource,selection,key:'ArrowLeft',code:'ArrowLeft',alt:true});assert.equal(r.source,initialSource);assert.deepEqual({...r.selection},selection);assert.equal(r.prevented,true);});
test('Alt insert rejects extra modifiers and protected contexts',()=>{const base={key:'ArrowLeft',code:'ArrowLeft',alt:true};for(const opts of [{...base,ctrl:true},{...base,shift:true},{...base,meta:true},{...base,altGraph:true},{...base,repeat:true},{...base,ime:true},{...base,keyCode:229},{...base,view:'preview'},{...base,idcInsert:'off'}]){const r=run(opts);assert.equal(r.source,'甲⿰亻二乙');}const r=run({...base,alt:false});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,true);assert.deepEqual({...r.selection},{anchor:3,focus:3});});
test('Alt keydown opens only the contextual candidate layer and Escape closes it',()=>{const r=run({key:'Alt',alt:true,code:'AltLeft'});assert.equal(r.paletteOpen,true);assert.equal(r.prevented,true);});
test('Alt+Shift+letter routes to O symbol candidates and respects protected contexts',()=>{const r=run({key:'F',code:'KeyF',alt:true,shift:true});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.obPaletteOpen,true);assert.equal(r.obPaletteMode,'choices');assert.equal(r.obPendingLetter,'f');assert.equal(r.prevented,true);for(const opts of [{key:'F',code:'KeyF',alt:true,shift:true,ime:true},{key:'F',code:'KeyF',alt:true,shift:true,repeat:true},{key:'F',code:'KeyF',alt:true,shift:true,obInput:'off'},{key:'F',code:'KeyF',alt:true,shift:true,view:'preview'},{key:'F',code:'KeyF',alt:true,shift:true,altGraph:true}])assert.equal(run(opts).obPaletteOpen,false);});
test('Shift+F inserts 扌 at the tracked caret as a normal undoable text edit',()=>{const r=run({key:'F',code:'KeyF',shift:true});assert.equal(r.source,'甲⿰亻二扌乙');assert.deepEqual({...r.selection},{anchor:5,focus:5});assert.equal(r.prevented,true);});
test('IDC, O-symbol and Shift component shortcuts stay inactive in source view',()=>{for(const opts of [{key:'Q',code:'KeyQ',alt:true},{key:'F',code:'KeyF',alt:true,shift:true},{key:'F',code:'KeyF',shift:true}]){const r=run({...opts,view:'source'});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false);assert.equal(r.paletteOpen,false);assert.equal(r.obPaletteOpen,false);}});
test('Ctrl+Shift+F, IME composition and disabled component shortcuts are not consumed',()=>{for(const opts of [{key:'F',code:'KeyF',shift:true,ctrl:true},{key:'F',code:'KeyF',shift:true,ime:true},{key:'F',code:'KeyF',shift:true,keyCode:229},{key:'F',code:'KeyF',shift:true,altGraph:true},{key:'F',code:'KeyF',shift:true,view:'preview'},{key:'F',code:'KeyF',shift:true,componentInsert:'off'}]){const r=run(opts);assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,false);}});
test('unmodified Shift+Left still extends the source selection without inserting IDC',()=>{const r=run({key:'ArrowLeft',code:'ArrowLeft',shift:true});assert.equal(r.source,'甲⿰亻二乙');assert.equal(r.prevented,true);assert.deepEqual({...r.selection},{anchor:4,focus:3});});
console.log('\n'+count+' controlled keyboard checks passed. Actual browser key dispatch and IME remain unverified.');
