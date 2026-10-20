'use strict';
// Lossless upstream envelope reader. Unknown node annotations remain opaque,
// never become implicit plain IDS mappings. Offsets use UTF-16 source indices.
const VERSION='0.1.0';
function splitTop(raw,delimiter){
 const parts=[],stack=[];let start=0;const pairs={')':'(',']':'[','}':'{'};
 for(let i=0;i<raw.length;i++){const c=raw[i];if('([{'.includes(c))stack.push({c,i});else if(pairs[c]){if(stack.at(-1)?.c!==pairs[c])throw Object.assign(Error('unbalanced-group'),{offset:i});stack.pop();}else if(c===delimiter&&!stack.length){parts.push({raw:raw.slice(start,i),start,end:i});start=i+1;}}
 if(stack.length)throw Object.assign(Error('unclosed-group'),{offset:stack.at(-1).i});parts.push({raw:raw.slice(start),start,end:raw.length});return parts;
}
function entry(raw){
 // Parentheses are documented sequence-variant indicators. Preserve multiple
 // groups separately rather than conflate e.g. #(H)(.) with one variant.
 const groups=[];let end=raw.length;
 while(end&&raw[end-1]===')'){let depth=1,i=end-2;for(;i>=0;i--){if(raw[i]===')')depth++;if(raw[i]==='('&&!--depth)break;}if(i<0)throw Error('unbalanced-indicator');groups.unshift({raw:raw.slice(i,end),value:raw.slice(i+1,end-1),indicators:raw.slice(i+1,end-1).split(','),start:i,end});end=i;}
 const expression=raw.slice(0,end);return {raw,expression,trailingGroupRole:expression.includes('#')?'unresolved-hash-expression':'sequence-variant-indicators',variantGroups:groups,annotations:tokens(expression)};
}
function tokens(raw){const out=[];let i=0;while(i<raw.length){const start=i,c=String.fromCodePoint(raw.codePointAt(i));i+=c.length;if(c==='['||c==='{'){const close=c==='['?']':'}';let depth=1;while(i<raw.length&&depth){if(raw[i]===c)depth++;if(raw[i]===close)depth--;i++;}out.push({kind:c==='['?'parameter-group':'opaque-reference',raw:raw.slice(start,i),start,end:i});}else if(/[A-Za-z0-9._:#?\-|]/.test(c)){while(i<raw.length&&/[A-Za-z0-9._:#?\-|]/.test(raw[i]))i++;out.push({kind:'opaque-annotation',raw:raw.slice(start,i),start,end:i});}else out.push({kind:'unicode-token',raw:c,start,end:i});}return out;}
function line(raw,lineNumber){const columns=raw.split('\t');const record={lineNumber,raw,character:columns[0],columns:[],errors:[]};if(columns.length<2||columns.length>3)record.errors.push({code:'column-count',actual:columns.length});for(let i=1;i<columns.length;i++){const column={role:i===1?'primary':'alternative',raw:columns[i],entries:[]};try{column.entries=splitTop(columns[i],';').map(part=>({...entry(part.raw),columnStart:part.start,columnEnd:part.end}));}catch(e){record.errors.push({code:e.message,column:i,offset:e.offset??null});}record.columns.push(column);}return record;}
function read(raw){return raw.split(/\r?\n/).filter(Boolean).map((s,i)=>line(s,i+1));}
module.exports={VERSION,splitTop,entry,tokens,line,read};
// Structural token tree only: annotations are retained verbatim, not interpreted.
const ARITY={'⿰':2,'⿱':2,'⿲':3,'⿳':3,'⿴':2,'⿵':2,'⿶':2,'⿷':2,'⿸':2,'⿹':2,'⿺':2,'⿻':2,'⿼':2,'⿽':2,'⿾':1,'⿿':1,'㇯':2};
function expressionTree(expression){const ts=tokens(expression);let p=0,nodes=0;function read(depth){if(depth>64||++nodes>4096)throw Error('tree-budget');const token=ts[p++];if(!token)throw Error('missing-operand');if(token.kind!=='unicode-token')throw Object.assign(Error('opaque-operand'),{offset:token.start});const node={token:token.raw,start:token.start,end:token.end,parameters:[],suffix:[],children:[]};const arity=ARITY[token.raw]||0;if(arity){while(ts[p]?.kind==='parameter-group')node.parameters.push(ts[p++]);for(let j=0;j<arity;j++)node.children.push(read(depth+1));node.end=node.children.at(-1).end;}else{while(ts[p]?.kind==='opaque-annotation'){node.suffix.push(ts[p++]);node.end=node.suffix.at(-1).end;}}return node;}
 try{const tree=read(0);if(p!==ts.length)return {status:'unresolved',reason:'remaining-tokens',offset:ts[p].start,tree,raw:expression};return {status:'parsed-annotations-uninterpreted',tree,raw:expression};}catch(e){return {status:'unresolved',reason:e.message,offset:e.offset??ts[p-1]?.start??0,raw:expression};}}
module.exports.expressionTree=expressionTree;
