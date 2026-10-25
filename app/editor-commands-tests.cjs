'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),html=fs.readFileSync(__dirname+'/index.html','utf8'),sourceModule=fs.readFileSync(__dirname+'/editor-commands.js','utf8');const get=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
const shared=['core','unicode-matches','inline-model','selection-commands','ob-symbols'].map(get).join('\n');
const R=vm.runInNewContext(shared+'\n'+get('editor-commands')+';EditorCommands');
const RSource=vm.runInNewContext(shared+'\n'+sourceModule+'\nEditorCommands');
const settings={'editor.view':'live','editor.unit':'ids-grapheme','shortcuts.selectionTransform':'alt-brackets','shortcuts.idcInsert':'alt-palette','shortcuts.componentInsert':'shift-keys','shortcuts.obInput':'alt-shift-map'};let count=0;function test(n,f){f();count++;console.log('PASS '+n)}
test('registry resolves editor local directional and delete commands',()=>{for(const [key,id]of[['ArrowLeft','left'],['ArrowRight','right'],['Backspace','backspace'],['Delete','delete']])assert.equal(R.resolve({key},settings),id)});
test('source/glyph hint reflects same current unit while preview hides editing',()=>{assert.match(R.hints({...settings,'editor.unit':'display-glyph'})[0].label,/完整呈现字/);assert.match(R.hints({...settings,'editor.view':'source','editor.unit':'display-glyph'})[0].label,/原字符簇/);assert.equal(R.hints({...settings,'editor.view':'preview'}).length,1);assert.equal(R.resolve({key:'Backspace'},{...settings,'editor.view':'preview'}),null)});
test('Alt bracket transform hints and execution stay on the bracket keys',()=>{for(const [command,key,code]of[['split','[','BracketLeft'],['join',']','BracketRight']]){const event={key,code,currentTarget:{id:'editor'},altKey:true};assert.equal(R.resolve(event,settings),command);assert.equal(R.hints(settings).find(r=>r.id===command).keys.join('+'),'Alt+'+key);}assert.equal(R.resolve({key:'d',code:'KeyD',ctrlKey:true,altKey:true},settings),null);assert.equal(R.resolve({key:'d',code:'KeyD',altKey:true,shiftKey:true,currentTarget:{id:'editor'}},settings),'ob-group:d')});
test('IME AltGraph OS combinations never resolve history command',()=>{for(const extra of [{isComposing:true},{keyCode:229},{altKey:true},{getModifierState:()=>true}])assert.equal(R.resolve({key:'z',ctrlKey:true,...extra},settings),null)});
test('platform caps and undo redo exact modifiers match dispatch',()=>{assert.equal(R.resolve({key:'z',metaKey:true},settings,true),'undo');assert.equal(R.resolve({key:'z',metaKey:true,shiftKey:true},settings,true),'redo');assert.ok(R.hints(settings,true).find(r=>r.id==='undo').keys.includes('⌘'));});
test('standalone and embedded IDC shortcut registries stay identical',()=>{const shape=registry=>Array.from(registry.insertBindings,({operator,code,key})=>[operator,code,key]);assert.deepEqual(shape(RSource),shape(R));});
test('all 17 IDC operators have Alt-hold candidate mappings and matching hints',()=>{
 const editor={id:'editor'};
 const expected=[['⿰','ArrowLeft','←'],['⿲','ArrowRight','→'],['⿱','ArrowUp','↑'],['⿳','ArrowDown','↓'],['⿴','KeyO','O'],['⿵','KeyT','T'],['⿶','KeyB','B'],['⿷','KeyL','L'],['⿼','KeyR','R'],['⿸','KeyQ','Q'],['⿹','KeyE','E'],['⿺','KeyZ','Z'],['⿽','KeyC','C'],['⿻','KeyP','P'],['⿾','KeyM','M'],['⿿','KeyG','G'],['㇯','Minus','−']];
 assert.equal(R.insertBindings.length,17);
 assert.deepEqual(Array.from(R.insertBindings,({operator,code,key})=>[operator,code,key]),expected);
 for(const binding of R.insertBindings){
  const event={key:binding.key,code:binding.code,currentTarget:editor,altKey:true};
  assert.equal(R.resolve(event,settings),'insert:'+binding.operator);
  assert.ok(R.hints(settings).some(h=>h.id==='insert:'+binding.operator&&h.keys.join('+')==='Alt+'+binding.key&&h.label.includes(binding.label)));
 }
 assert.equal(R.hints({...settings,'shortcuts.idcInsert':'off'}).filter(h=>h.id.startsWith('insert:')).length,0);
 assert.equal(R.hints({...settings,'editor.view':'preview'}).filter(h=>h.id.startsWith('insert:')).length,0);
});
test('IDC, O-symbol and component hotkeys are live-editor only',()=>{
 const source={...settings,'editor.view':'source'},editor={id:'editor'};
 assert.equal(R.resolve({key:'Q',code:'KeyQ',currentTarget:editor,altKey:true},source),null);
 assert.equal(R.resolve({key:'F',code:'KeyF',currentTarget:editor,altKey:true,shiftKey:true},source),null);
 assert.equal(R.resolve({key:'F',code:'KeyF',currentTarget:editor,shiftKey:true},source),null);
 for(const hint of R.hints(source))assert.ok(!hint.id.startsWith('insert:')&&!hint.id.startsWith('insert-component:')&&hint.id!=='ob-map');
});
test('Alt insert rejects extra modifiers and protected contexts; Shift remains native selection',()=>{
 const base={key:'ArrowLeft',code:'ArrowLeft',currentTarget:{id:'editor'},altKey:true};
 for(const event of [
  {...base,currentTarget:{id:'other'}},{...base,shiftKey:true},{...base,ctrlKey:true},{...base,altKey:false},{...base,metaKey:true},{...base,repeat:true},
  {...base,isComposing:true},{...base,keyCode:229},{...base,getModifierState:()=>true},{...base,code:'KeyA'},{...base,code:'F1'}
 ])assert.ok(!String(R.resolve(event,settings)||'').startsWith('insert:'));
 assert.equal(R.resolve(base,{...settings,'editor.view':'preview'}),null);
 assert.notEqual(R.resolve(base,{...settings,'shortcuts.idcInsert':'off'}),'insert:⿰');
 assert.notEqual(R.resolve({...base,currentTarget:null},settings),'insert:⿰');
 assert.equal(R.resolve({key:'ArrowLeft',code:'ArrowLeft',currentTarget:{id:'editor'},shiftKey:true},settings),'left');
});
test('Shift+F inserts the explicit radical pilot; Ctrl+Shift+F and protected states pass through',()=>{
 const editor={id:'editor'},binding=R.componentBindings[0];
 assert.deepEqual({operator:binding.operator,code:binding.code,key:binding.key,label:binding.label},{operator:'扌',code:'KeyF',key:'F',label:'提手旁'});
 assert.equal(R.resolve({key:'F',code:'KeyF',currentTarget:editor,shiftKey:true},settings),'insert-component:扌');
 assert.equal(R.resolve({key:'u',code:'KeyF',currentTarget:editor,shiftKey:true},settings),'insert-component:扌');
 assert.ok(R.hints(settings).some(h=>h.id==='insert-component:扌'&&h.keys.join('+')==='Shift+F'&&h.label.includes('提手旁')));
 assert.equal(R.resolve({key:'F',code:'KeyF',currentTarget:editor,shiftKey:true,ctrlKey:true},settings),null);
 for(const event of [
  {key:'F',code:'KeyF',currentTarget:editor,altKey:true,shiftKey:true},
  {key:'F',code:'KeyF',currentTarget:editor,metaKey:true,shiftKey:true},
  {key:'F',code:'KeyF',currentTarget:editor,repeat:true,shiftKey:true},
  {key:'F',code:'KeyF',currentTarget:{id:'other'},shiftKey:true},
  {key:'F',code:'KeyF',currentTarget:editor,isComposing:true,shiftKey:true},
  {key:'F',code:'KeyF',currentTarget:editor,keyCode:229,shiftKey:true},
  {key:'F',code:'KeyF',currentTarget:editor,getModifierState:()=>true,shiftKey:true}
 ])assert.notEqual(R.resolve(event,settings),'insert-component:扌');
 assert.notEqual(R.resolve({key:'F',code:'KeyF',currentTarget:editor,shiftKey:true},{...settings,'shortcuts.componentInsert':'off'}),'insert-component:扌');
 assert.equal(R.resolve({key:'F',code:'KeyF',currentTarget:editor,shiftKey:true},{...settings,'editor.view':'preview'}),null);
});
console.log('\n'+count+' command registry checks passed. OS key delivery remains unverified.');
