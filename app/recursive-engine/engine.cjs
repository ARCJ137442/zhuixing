'use strict';
const ARITY={'⿰':2,'⿱':2,'⿲':3,'⿳':3,'⿴':2,'⿵':2,'⿶':2,'⿷':2,'⿸':2,'⿹':2,'⿺':2,'⿻':2};
const serialize=n=>n.c+n.children.map(serialize).join('');
function parseForest(s){if(typeof s!=='string'||s.length>4000)throw Error('input-limit');const a=[...s];let p=0,count=0;function read(d){if(d>32||++count>2048)throw Error('tree-limit');const c=a[p++];if(c===undefined)throw Error('incomplete');if(/[⿼-⿿㇯]/u.test(c))throw Error('unsupported-operator');if(d>0&&!ARITY[c]&&!/^[\u3007\u3021-\u3029\u30B3\u30EA\uFF1F\u2E80-\u2FDF\u31C0-\u31E5\u3400-\u9FFF\uF900-\uFAFF\uE000-\uF8FF\u{20000}-\u{3347F}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]$/u.test(c))throw Error('invalid-component');let raw=c;const children=[];for(let j=0;j<(ARITY[c]||0);j++)children.push(read(d+1));if(!children.length){while(a[p]&&/[\p{Grapheme_Extend}\p{Mark}\p{Emoji_Modifier}\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u.test(a[p]))raw+=a[p++];while(a[p]==='\u200D'){raw+=a[p++];if(a[p])raw+=a[p++];while(a[p]&&/[\p{Grapheme_Extend}\p{Mark}\p{Emoji_Modifier}]/u.test(a[p]))raw+=a[p++];}}return {c:raw,children};}const roots=[];while(p<a.length)roots.push(read(0));return roots;}
function create(rows,{maxForms=32,maxDepth=16}={}){
 const defs=new Map(),direct=new Map();for(const {character,ids} of rows){if([...character].length!==1)continue;try{const roots=parseForest(ids);if(roots.length!==1||!roots[0].children.length)continue;const list=defs.get(character)||[];if(!list.some(x=>serialize(x)===ids))list.push(roots[0]);defs.set(character,list);const set=direct.get(ids)||new Set();set.add(character);direct.set(ids,set);}catch{}}
 const memo=new Map(),blocked=new Set();
 function products(c,children){let out=[c];for(const values of children){const next=[];for(const a of out)for(const b of values){if(a.length+b.length>4000)throw Error('form-size-limit');next.push(a+b);if(next.length>maxForms)throw Error('variants-limit');}out=[...new Set(next)];}return out;}
 function formsNode(n,path,depth){if(depth>maxDepth)throw Error('depth-limit');if(n.children.length)return products(n.c,n.children.map(x=>formsNode(x,path,depth+1)));return formsChar(n.c,path,depth+1);}
 function formsChar(c,path,depth){if(depth>maxDepth)throw Error('depth-limit');if(path.has(c))throw Error('cycle');const memoKey=c+'@'+depth;if(memo.has(memoKey))return memo.get(memoKey);const list=defs.get(c);if(!list)return [c];const next=new Set(path);next.add(c);const forms=[...new Set(list.flatMap(n=>formsNode(n,next,depth+1)))];if(forms.length>maxForms)throw Error('variants-limit');memo.set(memoKey,forms);return forms;}
 const normalized=new Map();for(const c of defs.keys()){try{for(const f of formsChar(c,new Set(),0)){const set=normalized.get(f)||new Set();set.add(c);normalized.set(f,set);}}catch{blocked.add(c);}}
 const queryCache=new Map();
 function lookup(ids,{recursive=true}={}){
  if(typeof ids!=='string'||/[\u200D\p{Emoji_Modifier}]/u.test(ids))return {kind:'unresolved',candidates:[],reason:'attached-modifier'};
  const cachedKey=(recursive?'r:':'d:')+ids;if(queryCache.has(cachedKey))return queryCache.get(cachedKey);
  const found=new Set(direct.get(ids)||[]);let method=found.size?'direct':'recursive';
  if(recursive){try{const roots=parseForest(ids);if(roots.length!==1)return {kind:'unmapped',candidates:[]};for(const f of formsNode(roots[0],new Set(),0))for(const c of normalized.get(f)||[])found.add(c);if(found.size&&(direct.get(ids)?.size||0))method='direct-and-recursive';}catch{return {kind:'unresolved',candidates:[],reason:'cycle-or-budget-or-syntax'};}}
  const candidates=[...found].sort();const result=Object.freeze({kind:candidates.length===1?'matched':candidates.length?'ambiguous':'unmapped',character:candidates.length===1?candidates[0]:null,candidates:Object.freeze(candidates),method,datasetScoped:true});if(queryCache.size>=256)queryCache.delete(queryCache.keys().next().value);queryCache.set(cachedKey,result);return result;
 }
 function expandOnce(n){if(n.children.length){const parts=n.children.map(expandOnce);return {node:{c:n.c,children:parts.map(x=>x.node)},changed:parts.some(x=>x.changed),ambiguous:parts.some(x=>x.ambiguous)};}const options=defs.get(n.c)||[];if(options.length!==1)return {node:n,changed:false,ambiguous:options.length>1};return {node:options[0],changed:true};}
 function foldOnce(n,all=false){
  if(!n.children.length)return {node:n,changed:false};
  const children=n.children.map(c=>foldOnce(c,all));
  if(children.some(x=>x.ambiguous))return {node:n,changed:false,ambiguous:true};
  if(children.some(x=>x.changed))return {node:{c:n.c,children:children.map(x=>x.node)},changed:true};
  if(!all&&n.children.some(c=>c.children.length))return {node:n,changed:false};
  const found=lookup(serialize(n));
  return found.kind==='matched'?{node:{c:found.character,children:[]},changed:true}:{node:n,changed:false,ambiguous:found.kind==='ambiguous'};
 }
 function transform(source,command){if(!['expand-one','expand-all','fold-one','fold-all'].includes(command))throw Error('unknown-command');let roots;try{roots=parseForest(source);}catch{return {source,changed:false,status:'invalid-or-incomplete'};}const seen=new Set([source]);let current=source,rounds=0;const full=command.endsWith('all');while(rounds++<(full?32:1)){const nodes=roots.map(n=>command.startsWith('expand')?expandOnce(n):foldOnce(n,full));if(nodes.some(x=>x.ambiguous))return {source,changed:false,status:'needs-choice'};const next=nodes.map(x=>serialize(x.node)).join('');if(next===current)return {source:current,changed:current!==source,status:'stable',rounds:rounds-1};try{parseForest(next);}catch{return {source,changed:false,status:'budget-exceeded'};}if(seen.has(next))return {source,changed:false,status:'cycle'};seen.add(next);current=next;roots=nodes.map(x=>x.node);if(!full)return {source:current,changed:true,status:'applied',rounds:1};}return {source,changed:false,status:'budget-exceeded'};}
 return {lookup,transform,stats:{characters:defs.size,directExpressions:direct.size,normalForms:normalized.size,blockedCharacters:blocked.size,ambiguousDirect:[...direct.values()].filter(x=>x.size>1).length},definitions:defs};
}
module.exports={create,parseForest,serialize};
