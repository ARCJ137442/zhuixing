'use strict';
// Local editor command registry: execution matching and contextual hints share these definitions.
const EditorCommands=(()=>{
 const insertBindings=Object.freeze([
  {operator:'⿰',code:'ArrowLeft',key:'←',label:'左右分置'},
  {operator:'⿲',code:'ArrowRight',key:'→',label:'左中右分置'},
  {operator:'⿱',code:'ArrowUp',key:'↑',label:'上下分置'},
  {operator:'⿳',code:'ArrowDown',key:'↓',label:'上中下分置'},
  {operator:'⿴',code:'KeyO',key:'O',label:'全包围'},
  {operator:'⿵',code:'KeyT',key:'T',label:'上三包'},
  {operator:'⿶',code:'KeyB',key:'B',label:'下三包'},
  {operator:'⿷',code:'KeyL',key:'L',label:'左三包'},
  {operator:'⿼',code:'KeyR',key:'R',label:'右包围'},
  {operator:'⿸',code:'KeyQ',key:'Q',label:'左上包'},
  {operator:'⿹',code:'KeyE',key:'E',label:'右上包'},
  {operator:'⿺',code:'KeyZ',key:'Z',label:'左下包'},
  {operator:'⿽',code:'KeyC',key:'C',label:'右下包围'},
  {operator:'⿻',code:'KeyP',key:'P',label:'叠加'},
  {operator:'⿾',code:'KeyM',key:'M',label:'水平反射'},
  {operator:'⿿',code:'KeyG',key:'G',label:'旋转'},
  {operator:'㇯',code:'Minus',key:'−',label:'减去笔画'}
 ].map(binding=>Object.freeze(binding)));
 const componentBindings=Object.freeze([
  {operator:'扌',code:'KeyF',key:'F',label:'提手旁'}
 ].map(binding=>Object.freeze(binding)));
 const selectionBindings=SelectionCommands.shortcutBindings;
 const records=[
  {id:'left',icon:'←',label:'向前',key:'ArrowLeft',hint:['←'],edit:true},
  {id:'right',icon:'→',label:'向后',key:'ArrowRight',hint:['→'],edit:true},
  {id:'backspace',icon:'⌫',label:'删除前项',key:'Backspace',hint:['⌫'],edit:true},
  {id:'delete',icon:'⌦',label:'删除后项',key:'Delete',hint:['Delete'],edit:true},
  {id:'undo',icon:'↶',label:'撤销正文',key:'z',modifier:true,hint:['Mod','Z'],edit:true},
  {id:'redo',icon:'↷',label:'重做正文',key:'z',modifier:true,shift:true,hint:['Mod','Shift','Z'],edit:true},
  {id:'split',icon:'分',label:'拆字 · 选区转 IDS',transform:true,edit:true},
  {id:'join',icon:'合',label:'合字 · 选区转 Unicode',transform:true,edit:true},
  {id:'copy',icon:'⧉',label:'复制原文',key:'c',modifier:true,hint:['Mod','C'],native:true}
 ];
 function resolve(event,settings,mac=false){
  if(event.isComposing||event.keyCode===229||event.getModifierState?.('AltGraph'))return null;
  const editor=event.currentTarget?.id==='editor';
  if(settings['editor.view']==='live'&&(settings['shortcuts.idcInsert']??'alt-palette')==='alt-palette'&&editor&&event.repeat!==true&&event.altKey&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey){
   const binding=insertBindings.find(item=>item.code===event.code);
   if(binding)return 'insert:'+binding.operator;
  }
  if(settings['editor.view']==='live'&&(settings['shortcuts.obInput']??'alt-shift-map')==='alt-shift-map'&&editor&&event.repeat!==true&&event.altKey&&event.shiftKey&&!event.ctrlKey&&!event.metaKey&&/^Key[A-Z]$/.test(event.code||'')){
   const letter=event.code.slice(3).toLowerCase();
   if(OBSymbols.groups[letter])return 'ob-group:'+letter;
  }
  if(settings['editor.view']==='live'&&(settings['shortcuts.componentInsert']??'shift-keys')==='shift-keys'&&editor&&event.repeat!==true&&event.shiftKey&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
   const binding=componentBindings.find(item=>item.code===event.code);
   if(binding)return 'insert-component:'+binding.operator;
  }
  const transform=SelectionCommands.shortcut(event,settings['shortcuts.selectionTransform']);
  if(transform&&settings['editor.view']!=='preview')return transform;
  for(const r of records){if(r.transform||r.native||r.edit&&settings['editor.view']==='preview')continue;
   if(event.key?.toLowerCase()!==r.key.toLowerCase())continue;
   if(r.modifier){if(!(event.ctrlKey||event.metaKey)||event.altKey||!!event.shiftKey!==!!r.shift)continue;}
   else {const word=mac?event.altKey&&!event.ctrlKey&&!event.metaKey:event.ctrlKey&&!event.altKey&&!event.metaKey;if((event.ctrlKey||event.altKey||event.metaKey)&&!word)continue;}
   return r.id;
  }
  if(settings['editor.view']!=='preview'&&event.ctrlKey&&!event.altKey&&!event.metaKey&&event.key?.toLowerCase()==='y')return 'redo';
  return null;
 }
 function hints(settings,mac=false){return records.filter(r=>!r.edit||settings['editor.view']!=='preview').map(r=>{
  let keys=r.hint?.map(k=>k==='Mod'?(mac?'⌘':'Ctrl'):k)||[];
  if(r.transform){const binding=selectionBindings.find(item=>item.command===r.id);keys=settings['shortcuts.selectionTransform']==='alt-brackets'?['Alt',binding.key]:['更多菜单'];}
  const unit=settings['editor.view']==='source'||settings['editor.unit']==='ids-grapheme'?'原字符簇':'完整呈现字';
  const commandId={split:'selection.expandOne',join:'selection.foldAll',undo:'edit.undo',redo:'edit.redo'}[r.id];const title=typeof CommandSystem!=='undefined'&&CommandSystem.catalogue.find(c=>c.id===commandId)?.title||r.label;
  return {...r,keys,label:title+(['left','right','backspace','delete'].includes(r.id)?' · '+unit:'')};
 }).concat(settings['editor.view']!=='live'||settings['shortcuts.idcInsert']==='off'?[]:insertBindings.map(binding=>({id:'insert:'+binding.operator,icon:binding.operator,label:'按住 Alt 显示候选并插入 '+binding.operator+' · '+binding.label,keys:['Alt',binding.key]})))
 .concat(settings['editor.view']!=='live'||(settings['shortcuts.componentInsert']??'shift-keys')==='off'?[]:componentBindings.map(binding=>({id:'insert-component:'+binding.operator,icon:binding.operator,label:'插入部件 · '+binding.label,keys:['Shift',binding.key]})))
 .concat(settings['editor.view']!=='live'||(settings['shortcuts.obInput']??'alt-shift-map')==='off'?[]:[{id:'ob-map',icon:'部',label:'按住 Alt+Shift 显示 O 符键位图；多候选需再选',keys:['Alt','Shift']}]);}
 return {resolve,hints,insertBindings,componentBindings,selectionBindings};
})();
