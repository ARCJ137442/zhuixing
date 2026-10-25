// White-listed commands. Query is pure; execution owns context checks before calling existing transactions.
const CommandSystem=(()=>{
 const catalogue=Object.freeze([
  ['selection.expandOne','拆一层','构形',['拆字','split'],'edit-selection','split-selection'],
  ['selection.expandAll','展开到底','构形',['递归展开'],'edit-selection','expand-all'],
  ['selection.foldOne','从叶端合一层','构形',['逐层','fold'],'edit-selection','fold-one'],
  ['selection.foldAll','递归合到底','构形',['合字','join'],'edit-selection','join-selection'],
  ['view.live','切换到行内编辑','视图',['编辑'],'view'],['view.source','切换到源码','视图',['IDS'],'view'],['view.preview','切换到只读预览','视图',['阅读'],'view'],
  ['edit.undo','撤销正文','编辑',['undo'],'edit','undo'],['edit.redo','重做正文','编辑',['redo'],'edit','redo'],
  ['project.open','打开项目','文件',['导入'],'idle','importproject'],['project.save','保存项目 JSON','文件',['下载','导出'],'idle','saveproject'],['project.restore','恢复本地项目','文件',['草稿'],'idle','restore'],
  ['structure.inspect','查看结构信息','构形',['树','详情'],'idle','inspect'],['structure.copy','复制当前 IDS','构形',['复制'],'structure','copyids'],['structure.outline','导出纯轮廓 SVG','文件',['矢量'],'structure','exportsvg'],['structure.font','导出字体依赖 SVG','文件',['字体'],'structure','exportfontsvg'],
  ['settings.open','打开设置','设置',['偏好'],'view','settings-open'],['settings.export','导出设置','设置',['配置'],'idle','settings-export'],['settings.import','导入设置','设置',['配置'],'idle','settings-import'],['settings.undo','撤销设置','设置',['偏好'],'view','settings-undo'],['settings.redo','重做设置','设置',['偏好'],'view','settings-redo'],
  ['motion.demo','演示一次合成','帮助',['动效'],'idle','motion-demo'],['motion.status','查看动效状态','帮助',['诊断'],'idle','motion-diagnose'],['help.keys','快捷键提示','帮助',['按键'],'view','key-hints-open']
 ].map(([id,title,category,aliases,scope,button])=>Object.freeze({id,title,category,aliases:Object.freeze(aliases),scope,button})));
 function create({context,handlers}){
  const reason=r=>{const c=context();if(c.composing&&r.scope!=='view')return '请先完成输入法组合';if(c.composing&&r.id.startsWith('view.'))return '请先完成输入法组合';if(r.scope.startsWith('edit')&&c.view==='preview')return '只读预览不能修改正文';if(r.scope==='edit-selection'&&c.selection.anchor===c.selection.focus)return '请先选择要处理的原文';if(!handlers[r.id])return '当前命令不可用';return c.disabled?.(r)||'';};
  function query(text=''){const q=text.trim().toLowerCase();return catalogue.filter(r=>[r.id,r.title,r.category,...r.aliases].join(' ').toLowerCase().includes(q)).map(r=>({...r,reason:reason(r)}));}
  function execute(id,args){if(args!==undefined)return {status:'unavailable',message:'当前命令不接受参数'};const r=catalogue.find(r=>r.id===id);if(!r)return {status:'unavailable',message:'未知命令'};const why=reason(r);if(why)return {status:'unavailable',message:why};try{const value=handlers[id]();if(value&&typeof value.then==='function')return value.then(v=>({status:v===false?'unchanged':'completed'}),e=>({status:'failed',message:e.message}));return {status:value===false?'unchanged':['project.open','settings.import'].includes(id)?'awaiting-input':'completed'};}catch(e){return {status:'failed',message:e.message};}}
  return {query,execute};
 }
 return {catalogue,create};
})();
