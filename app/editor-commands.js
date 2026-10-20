// Local editor command registry: execution matching and contextual hints share these definitions.
const EditorCommands=(()=>{
 const records=[
  {id:'left',icon:'←',label:'向前',key:'ArrowLeft',hint:['←'],edit:true},
  {id:'right',icon:'→',label:'向后',key:'ArrowRight',hint:['→'],edit:true},
  {id:'backspace',icon:'⌫',label:'删除前项',key:'Backspace',hint:['⌫'],edit:true},
  {id:'delete',icon:'⌦',label:'删除后项',key:'Delete',hint:['Delete'],edit:true},
  {id:'undo',icon:'↶',label:'撤销正文',key:'z',modifier:true,hint:['Mod','Z'],edit:true},
  {id:'redo',icon:'↷',label:'重做正文',key:'z',modifier:true,shift:true,hint:['Mod','Shift','Z'],edit:true},
  {id:'split',icon:'分',label:'选区拆为 IDS',transform:true,edit:true},
  {id:'join',icon:'合',label:'选区合为 Unicode',transform:true,edit:true},
  {id:'copy',icon:'⧉',label:'复制原文',key:'c',modifier:true,hint:['Mod','C'],native:true}
 ];
 function resolve(event,settings,mac=false){
  if(event.isComposing||event.keyCode===229||event.getModifierState?.('AltGraph'))return null;
  const command=SelectionCommands.shortcut(event,settings['shortcuts.selectionTransform']);
  if(command&&settings['editor.view']!=='preview')return command;
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
  if(r.transform){const mode=settings['shortcuts.selectionTransform'];keys=mode==='off'?['更多菜单']:mode==='alt-shift'?['Alt','Shift',r.id==='split'?'D':'J']:['Ctrl','Alt',r.id==='split'?'D':'J'];}
  const unit=settings['editor.view']==='source'||settings['editor.unit']==='ids-grapheme'?'原字符簇':'完整呈现字';
  const commandId={split:'selection.expandOne',join:'selection.foldAll',undo:'edit.undo',redo:'edit.redo'}[r.id];const title=typeof CommandSystem!=='undefined'&&CommandSystem.catalogue.find(c=>c.id===commandId)?.title||r.label;
  return {...r,keys,label:title+(['left','right','backspace','delete'].includes(r.id)?' · '+unit:'')};
 });}
 return {resolve,hints};
})();
