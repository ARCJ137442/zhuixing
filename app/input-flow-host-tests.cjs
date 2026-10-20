'use strict';
// Complete maintained inline-app execution with deterministic DOM/rect/WAAPI adapters.
// This verifies control flow, not real layout, animation quality or native IME dispatch.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const scripts=[...html.matchAll(/<script id="([^"]+)">([\s\S]*?)<\/script>/g)].map(m=>m[2]).join('\n');
function host({reduced=false,hidden=false,apiFailure=false,sourceHtml=html}={}){
  const scripts=[...sourceHtml.matchAll(/<script id="([^"]+)">([\s\S]*?)<\/script>/g)].map(m=>m[2]).join("\n");
  let now=0,seq=0;const timers=new Map(),animations=[],blobs=[],warnings=[],storage=new Map(),ids=new Map();
  class Node {
    constructor(tag='',data=''){this.nodeType=tag==='#text'?3:tag==='#fragment'?11:1;this.tagName=tag.toUpperCase();this.data=data;this.childNodes=[];this.dataset={};this.style={removeProperty:k=>delete this.style[k]};this.attrs={};this.listeners=new Map();this.hidden=false;this.checked=false;this.value='';}
    get firstChild(){return this.childNodes[0]||null}
    get parentElement(){return this.parentNode?.nodeType===1?this.parentNode:null}
    get classList(){return {contains:c=>(this.className||'').split(' ').includes(c),add:c=>{this.className=(this.className||'')+' '+c},remove:c=>{this.className=(this.className||'').split(' ').filter(x=>x!==c).join(' ')}}}
    append(...nodes){for(const n of nodes){if(n.nodeType===11){this.append(...[...n.childNodes]);continue}n.remove();n.parentNode=this;this.childNodes.push(n)}}
    replaceChildren(...nodes){for(const n of this.childNodes)n.parentNode=null;this.childNodes=[];this.append(...nodes)}
    remove(){if(this.parentNode){const p=this.parentNode;p.childNodes=p.childNodes.filter(n=>n!==this);this.parentNode=null}}
    set textContent(s){this.replaceChildren(new Node('#text',String(s)))}
    get textContent(){return this.nodeType===3?this.data:this.childNodes.map(n=>n.textContent).join('')}
    set innerHTML(s){this.replaceChildren();if(s.includes('<svg')){const svg=new Node('svg');const v=s.match(/viewBox="([^"]+)"/);if(v)svg.setAttribute('viewBox',v[1]);this.append(svg)}else this.textContent=s}
    setAttribute(k,v){this.attrs[k]=String(v);if(k==='class')this.className=v}
    getAttribute(k){return this.attrs[k]??null}
    addEventListener(name,f){const a=this.listeners.get(name)||[];a.push(f);this.listeners.set(name,a)}
    dispatch(name,e={}){e.target??=this;e.preventDefault??=()=>{e.defaultPrevented=true};for(const f of this.listeners.get(name)||[])f(e);this['on'+name]?.(e);return e}
    contains(n){return n===this||this.childNodes.some(c=>c.contains(n))}
    matches(s){return s.startsWith('.')?this.classList.contains(s.slice(1)):s==='[data-ids]'?this.dataset.ids!==undefined:s.toUpperCase()===this.tagName}
    closest(s){return this.matches(s)?this:this.parentElement?.closest(s)||null}
    querySelectorAll(s){return this.childNodes.flatMap(n=>[...(n.matches(s)?[n]:[]),...n.querySelectorAll(s)])}
    querySelector(s){return this.querySelectorAll(s)[0]||null}
    focus(){document.activeElement=this}
    getBoundingClientRect(){return {left:10,top:10,width:32,height:32,right:42,bottom:42}}
    animate(frames,options){if(apiFailure)throw Error("Simulated WAAPI failure");let reject;const finished=new Promise((resolve,r)=>{reject=r});const a={frames,options,finished,cancelled:false,cancel(){this.cancelled=true;reject(Error('cancelled'))}};animations.push(a);return a}
    click(){this.dispatch('click')}
  }
  const document=new Node('document');document.body=new Node('body');document.append(document.body);document.hidden=hidden;document.activeElement=null;
  document.getElementById=id=>{if(!ids.has(id)){const n=new Node('div');n.id=id;ids.set(id,n);document.body.append(n)}return ids.get(id)};
  document.createElement=tag=>new Node(tag);document.createTextNode=s=>new Node('#text',s);document.createDocumentFragment=()=>new Node('#fragment');
  document.createRange=()=>({setStart(n,o){this.start=[n,o]},setEnd(n,o){this.end=[n,o]},getBoundingClientRect(){return {left:10,top:10,width:this.start?.[0]===this.end?.[0]&&this.start?.[1]===this.end?.[1]?0:32,height:32}}});
  for(const m of sourceHtml.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){const n=document.getElementById(m[1]);n.checked=/\schecked(?:\s|>)/.test(m[0]);n.hidden=/\shidden(?:\s|>)/.test(m[0]);n.value=m[1]==='selection-shortcuts'?'off':m[1]==='motion-speed'?'1':'';}
  const sel={rangeCount:1,anchorNode:null,focusNode:null,anchorOffset:0,focusOffset:0,setBaseAndExtent(a,ao,f,fo){Object.assign(this,{anchorNode:a,anchorOffset:ao,focusNode:f,focusOffset:fo})}};
  const window=new Node('window');window.matchMedia=()=>({matches:reduced,addEventListener(){}});
  const context={document,window,Element:Node,performance:{now:()=>now},getSelection:()=>sel,console:{...console,warn:(...args)=>warnings.push(args)},Intl,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:(fn,delay=0)=>{const id=++seq;timers.set(id,{fn,at:now+delay});return id},clearTimeout:id=>timers.delete(id),navigator:{clipboard:{writeText:async()=>{}}},URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:test'},revokeObjectURL(){}},Blob:class{constructor(parts,options){this.parts=parts;this.type=options.type}}};
  vm.runInNewContext(scripts,context);
  const editor=ids.get('editor');editor.focus();sel.setBaseAndExtent(editor,0,editor,0);
  function advance(ms){const end=now+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn()}now=end}
  function type(data){editor.dispatch('beforeinput',{inputType:'insertText',data,cancelable:true,isComposing:false})}
  function select(a,b){const at=p=>{let used=0;for(const n of editor.childNodes){const length=n.nodeType===3?n.data.length:(n.dataset.ids||'').length;if(n.nodeType===3&&p<=used+length)return[n,p-used];used+=length}return[editor,editor.childNodes.length]};sel.setBaseAndExtent(...at(a),...at(b));document.dispatch('selectionchange')}
  return {editor,ids,document,sel,animations,blobs,warnings,advance,type,select,storage,Node,source:()=>JSON.parse(storage.get('structure-glyph-draft-v1')).source};
}
let count=0;function test(name,run){run();count++;console.log('PASS '+name)}
test('committed typing reaches settled vector animation without changing source',()=>{const h=host();for(const c of '⿰木水'){h.type(c);h.advance(500)}assert.equal(h.source(),'⿰木水');assert.ok(h.editor.querySelector('.atom'));assert.ok(h.animations.length>0);});
test('0.1.4 baseline confirms Unicode matches suppress animation despite enabled defaults',()=>{const h=host({sourceHtml:fs.readFileSync(__dirname+'/releases/0.1.4/index.html','utf8')});for(const c of '⿰亻二'){h.type(c);h.advance(500)}assert.equal(h.source(),'⿰亻二');assert.equal(h.editor.querySelector('.atom').dataset.display,'unicode');assert.equal(h.ids.get('motion-disabled').checked,false);assert.equal(h.animations.length,0);});
test('current Unicode match reaches real animation creation while preserving IDS',()=>{const h=host();for(const c of '⿰亻二'){h.type(c);h.advance(500)}assert.equal(h.source(),'⿰亻二');assert.equal(h.editor.querySelector('.atom').dataset.display,'unicode');assert.ok(h.animations.length>0);});
test('system reduced motion stays static throughout committed typing',()=>{const h=host({reduced:true});for(const c of '⿰亻二'){h.type(c);h.advance(500)}assert.equal(h.source(),'⿰亻二');assert.equal(h.animations.length,0);});
test('native multiline insertion reaches feedback despite non-flat DOM',()=>{const h=host();const line=new h.Node('div');const text=new h.Node('#text','⿰木水');line.append(text);h.editor.replaceChildren(new h.Node('#text','前'),line);h.sel.setBaseAndExtent(text,3,text,3);h.editor.dispatch('input',{inputType:'insertText',data:'水'});h.advance(500);assert.equal(h.source(),'前\n⿰木水');assert.ok(h.animations.length>0);});
test('menu focus preserves tracked selected source and split is one undo transaction',()=>{const h=host();h.type('前仁后');h.select(1,2);h.ids.get('split-selection').focus();h.sel.setBaseAndExtent(h.document.body,0,h.document.body,0);h.ids.get('split-selection').click();assert.equal(h.source(),'前⿰亻二后');h.ids.get('undo').click();assert.equal(h.source(),'前仁后');h.ids.get('redo').click();assert.equal(h.source(),'前⿰亻二后');});
test('source edit invalidates old selected range before menu command',()=>{const h=host();h.type('前仁后');h.select(1,2);h.type('你');h.ids.get('split-selection').focus();h.ids.get('split-selection').click();assert.equal(h.source(),'前你后');});
test('enabling source conversion never rewrites existing source retroactively',()=>{const h=host();h.type('⿰亻二');h.advance(500);h.ids.get('auto-unicode').checked=true;h.ids.get('auto-unicode').dispatch('change');h.advance(500);assert.equal(h.source(),'⿰亻二');});
test('opt-in typed source conversion is independently undoable',()=>{const h=host();h.ids.get('auto-unicode').checked=true;for(const c of '⿰亻二')h.type(c);assert.equal(h.source(),'仁');h.ids.get('undo').click();assert.equal(h.source(),'⿰亻二');});
test('empty-editor demonstration creates animations without source or history writes',()=>{const h=host();assert.equal(h.source(),'');assert.equal(h.ids.get('undo').disabled,true);h.ids.get('motion-demo').click();assert.ok(h.animations.length>0);assert.equal(h.source(),'');assert.equal(h.ids.get('undo').disabled,true);const demoAnimations=[...h.animations];h.type('甲');assert.ok(demoAnimations.every(a=>a.cancelled));assert.equal(h.source(),'甲');});
test('IME candidate input stays native until one committed source transaction',()=>{const h=host();h.editor.dispatch('compositionstart');const text=new h.Node('#text','⿰亻二');h.editor.replaceChildren(text);h.sel.setBaseAndExtent(text,3,text,3);h.editor.dispatch('input',{inputType:'insertCompositionText',data:'⿰亻二',isComposing:true});assert.equal(h.source(),'');assert.equal(h.animations.length,0);h.editor.dispatch('compositionend',{data:'⿰亻二'});h.advance(500);assert.equal(h.source(),'⿰亻二');assert.ok(h.animations.length>0);h.ids.get('undo').click();assert.equal(h.source(),'');});
test('extreme typing yields only a short non-spatial confirmation',()=>{const h=host();for(const c of '前⿰亻二'){h.type(c);h.advance(50)}h.advance(100);assert.equal(h.source(),'前⿰亻二');assert.equal(h.animations.length,1);assert.equal(h.animations[0].options.duration,110);assert.ok(h.animations[0].frames.every(f=>!Object.hasOwn(f,'transform')));});
test('explicit motion off suppresses both input and demonstration feedback',()=>{const h=host();const toggle=h.ids.get('motion-disabled');toggle.checked=true;toggle.dispatch('change');for(const c of '⿰亻二'){h.type(c);h.advance(500)}h.ids.get('motion-demo').click();assert.equal(h.source(),'⿰亻二');assert.equal(h.animations.length,0);});
test('unmapped missing outline composes through font fallback and truthful status',()=>{const h=host();for(const c of '⿰木尔'){h.type(c);h.advance(500)}assert.equal(h.source(),'⿰木尔');assert.equal(h.editor.querySelector('.atom').dataset.display,'font');assert.match(h.ids.get('inputhelp').textContent,/字体回退.*尔.*本机字体/);assert.ok(h.animations.length>0);});
test('exact known Unicode wins over missing outline without guessing unknown mappings',()=>{const h=host();for(const c of '⿰亻尔'){h.type(c);h.advance(500)}assert.equal(h.source(),'⿰亻尔');assert.equal(h.editor.querySelector('.unicode-glyph').textContent,'你');assert.equal(h.editor.querySelector('.atom').dataset.display,'unicode');assert.ok(h.animations.length>0);h.ids.get('unicode-disabled').checked=true;h.ids.get('unicode-disabled').dispatch('change');assert.equal(h.source(),'⿰亻尔');assert.equal(h.editor.querySelector('.atom').dataset.display,'font');});
test('font fallback remains functional with motion off reduced hidden or WAAPI failure',()=>{for(const options of [{reduced:true},{hidden:true},{apiFailure:true},{off:true}]){const h=host(options);if(options.off){const toggle=h.ids.get('motion-disabled');toggle.checked=true;toggle.dispatch('change')}h.type('⿰木尔');h.advance(500);assert.equal(h.source(),'⿰木尔');const atom=h.editor.querySelector('.atom');assert.equal(atom.dataset.display,'font');assert.notEqual(atom.querySelector('svg').style.opacity,'0');assert.equal(h.animations.length,0);assert.equal(h.warnings.length,options.apiFailure?1:0)}});
test('unsupported structure remains literal instead of fabricating fallback geometry',()=>{const h=host();h.type('⿾尔');h.advance(500);assert.equal(h.source(),'⿾尔');assert.equal(h.editor.querySelector('.atom'),null);assert.match(h.ids.get('inputhelp').textContent,/尚未支持此布局/);assert.equal(h.animations.length,0);});
test('font fallback selection copies IDS and editing remains undoable',()=>{const h=host();h.type('⿰木尔');h.advance(500);h.select(0,3);let copied='';h.editor.dispatch('copy',{clipboardData:{setData(type,text){copied=text}}});assert.equal(copied,'⿰木尔');assert.equal(h.editor.querySelector('.atom'),null);h.type('⿰木水');assert.equal(h.source(),'⿰木水');h.ids.get('undo').click();assert.equal(h.source(),'⿰木尔');});
test('font-dependent export handler writes labelled text SVG while outline export stays unavailable',()=>{const h=host();h.type('⿰木尔');h.advance(500);h.ids.get('inspect').click();assert.equal(h.ids.get('exportsvg').disabled,true);assert.equal(h.ids.get('exportfontsvg').disabled,false);h.ids.get('exportfontsvg').click();assert.equal(h.blobs.length,1);const output=h.blobs[0].parts.join('');assert.match(output,/<text/);assert.match(output,/data-font-dependent="true"/);assert.match(output,/portableOutlines/);assert.doesNotMatch(output,/<path/);assert.equal(h.source(),'⿰木尔');});
console.log('\n'+count+' complete-input controlled host checks passed. Real browser animation and input behavior are not implied.');
