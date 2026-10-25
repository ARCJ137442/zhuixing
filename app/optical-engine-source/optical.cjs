'use strict';
// Clean-room optical packing of pinned OFL outlines. No DOM, network, font lookup or code evaluation.
const bundled=require('./assets.json');
const provenance=require('./provenance.json');
const VERSION='0.2.0';
const ENGINE_NAME='optical-experimental';
const MATCHES=Object.freeze(Object.fromEntries(require('./unicode-matches.provenance.json').entries.map(e=>[e.ids,e.character])));
const OPS={'⿰':2,'⿱':2,'⿲':3,'⿳':3,'⿴':2,'⿵':2,'⿶':2,'⿷':2,'⿸':2,'⿹':2,'⿺':2,'⿻':2,'⿼':2,'⿽':2,'⿾':1,'⿿':1,'㇯':2};
const DEFAULTS=Object.freeze({gap:3,axialScale:.64,crossScale:.94,margin:7,compensation:.7,mode:'optical',unicodeMatch:false,color:'#242820',size:600});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const number=n=>Number(n.toFixed(5));
function options(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid options');
 for(const k of Object.keys(raw))if(!Object.hasOwn(DEFAULTS,k))throw Error('Unknown option: '+k);
 const p={...DEFAULTS,...raw};
 for(const [k,lo,hi] of [['gap',1,10],['axialScale',.3,.85],['crossScale',.5,1],['margin',3,15],['compensation',0,1.5],['size',16,4096]])if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw Error('Invalid '+k);
 if(typeof p.unicodeMatch!=='boolean')throw Error('Invalid unicodeMatch');
 if(typeof p.color!=='string'||!/^#[a-f\d]{6}$/i.test(p.color)||!['optical','equal-box'].includes(p.mode))throw Error('Invalid style');
 return p;
}
function parse(source){
 if(typeof source!=='string'||source.length>1024)throw Error('Source must be at most 1024 UTF-16 units');
 const chars=[...source];let i=0,count=0;
 function expr(depth){if(depth>16||++count>255)throw Error('Tree limit exceeded');const char=chars[i++];if(!char)throw Error('Incomplete structure');const children=[];for(let j=0;j<(OPS[char]||0);j++)children.push(expr(depth+1));if(!OPS[char]&&!/^[\u3007\u3400-\u9fff\uf900-\ufaff\u{20000}-\u{323af}\ue000-\uf8ff]$/u.test(char))throw Error('Invalid leaf');return {char,children};}
 const n=expr(0);if(i!==chars.length)throw Error('Expected exactly one structure');return n;
}
function validateAssets(input){
 // Snapshot once before validation: accessors cannot swap data between validation and emission.
 input=structuredClone(input);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length>200)throw Error('Invalid assets');
 const out=Object.create(null);
 for(const [ch,a] of Object.entries(input)){
  if([...ch].length!==1||!a||!Array.isArray(a.paths)||!a.paths.length||a.paths.length>32||!Array.isArray(a.runs)||a.runs.length>10000)throw Error('Invalid component');
  for(const d of a.paths){if(typeof d!=='string'||d.length>50000||!/^M[MLHVQCZmlhvqcz\s\d.,+\-eE]+$/.test(d))throw Error('Unsafe path');const tokens=d.match(/[MLHVQCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)||[];if(tokens.join('')!==d.replace(/[\s,]/g,''))throw Error('Invalid path tokens');let pos=0;while(pos<tokens.length){const cmd=tokens[pos++];const arity={M:2,L:2,H:1,V:1,Q:4,C:6,Z:0}[cmd];if(arity===undefined)throw Error('Invalid path command');let count=0;while(pos<tokens.length&&!/^[MLHVQCZ]$/i.test(tokens[pos])){count++;pos++;}if(arity===0?count!==0:count===0||count%arity!==0)throw Error('Invalid path arity');}
   for(const v of d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)||[])if(!Number.isFinite(+v)||Math.abs(+v)>1000)throw Error('Unbounded path');}
  for(const r of a.runs)if(!Array.isArray(r)||r.length!==3||r.some(v=>!Number.isInteger(v))||r[0]<0||r[0]>99||r[1]<0||r[2]>100||r[1]>=r[2])throw Error('Invalid ink mask');
  // Detached immutable copy: callers cannot mutate a warmed cache's dependencies.
  out[ch]=Object.freeze({paths:Object.freeze([...a.paths]),runs:Object.freeze(a.runs.map(r=>Object.freeze([...r])))});
 }
 return Object.freeze(out);
}
function bounds(points){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y] of points){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return [x0,y0,x1,y1];}
function transform(s,sx,sy,tx,ty){return {points:s.points.map(([x,y])=>[x*sx+tx,y*sy+ty]),leaves:s.leaves.map(l=>({...l,sx:l.sx*sx,sy:l.sy*sy,tx:l.tx*sx+tx,ty:l.ty*sy+ty})),warnings:[...s.warnings],packing:[...s.packing]};}
function union(a,b){return {points:[...a.points,...b.points],leaves:[...a.leaves,...b.leaves],warnings:[...a.warnings,...b.warnings],packing:[...a.packing,...b.packing]};}
function contour(s,axis){const map=new Map();for(const p of s.points){const key=Math.floor(p[1-axis]);const v=p[axis],cur=map.get(key)||[Infinity,-Infinity];cur[0]=Math.min(cur[0],v);cur[1]=Math.max(cur[1],v);map.set(key,cur);}return map;}
function pack(a,b,axis,gap){
 const aa=contour(a,axis),bb=contour(b,axis);let shift=-Infinity;
 // Adjacent bins guard raster quantization and modest paint compensation.
 for(const [key,av] of aa)for(let k=key-1;k<=key+1;k++){const bv=bb.get(k);if(bv)shift=Math.max(shift,av[1]-bv[0]+gap+1.5);}
 const ab=bounds(a.points),bd=bounds(b.points);const separated=ab[axis+2]-bd[axis]+gap;
 if(!Number.isFinite(shift))shift=separated;
 // Never invert component ordering or interlock more than 35% of smaller axial extent.
 shift=Math.max(shift,separated-.35*Math.min(ab[axis+2]-ab[axis],bd[axis+2]-bd[axis]));
 const moved=transform(b,1,1,axis===0?shift:0,axis===1?shift:0),result=union(a,moved);
 result.packing.push({axis:axis===0?'x':'y',bboxSeparation:number(separated),contourShift:number(shift),nesting:number(separated-shift)});return result;
}
function canopy(s){
 // Shape classification, not a character lookup: narrow crown, broad feet and hollow lower center.
 const b=bounds(s.points),w=b[2]-b[0],h=b[3]-b[1];
 if(w<35||h<35)return false;
 const top=s.points.filter(([x,y])=>y<b[1]+h*.25),bottom=s.points.filter(([x,y])=>y>b[1]+h*.7);
 if(!top.length||!bottom.length)return false;
 const t=bounds(top),d=bounds(bottom),center=(b[0]+b[2])/2;
 const middle=bottom.filter(([x])=>Math.abs(x-center)<w*.12).length/bottom.length;
 return (t[2]-t[0])/w<.48&&(d[2]-d[0])/w>.8&&middle<.05;
}
function normalize(s,p){const b=bounds(s.points),w=b[2]-b[0],h=b[3]-b[1];const available=100-2*p.margin;
 // Global fit only: never expand individual ink bboxes. Sparse glyphs retain whitespace.
 const k=Math.min(1.12,available/Math.max(w,h,1));return transform(s,k,k,50-(b[0]+b[2])/2*k,50-(b[1]+b[3])/2*k);
}
function createRenderer(input=bundled){
 const assets=validateAssets(input),cache=new Map();
 // Dependencies are detached, deeply frozen, and scoped to this renderer's private cache.
 // No cache is shared across instances, so dependency identity is the closure, not a huge per-key string.
 const templates=new Map();
 function leaf(ch){if(!Object.hasOwn(assets,ch))throw Object.assign(Error('Missing component: '+ch),{kind:'missing'});if(!templates.has(ch)){const points=[];for(const [y,x0,x1] of assets[ch].runs)for(let x=x0;x<x1;x++)points.push([x+.5,y+.5]);if(!points.length)throw Error('Empty ink');templates.set(ch,{points,leaves:[{char:ch,sx:1,sy:1,tx:0,ty:0}],warnings:[],packing:[]});}return templates.get(ch);}
 function compose(n,p){if(!n.children.length)return leaf(n.char);if(!['⿰','⿱','⿲','⿳'].includes(n.char))throw Object.assign(Error('No optical rule for '+n.char),{kind:'unsupported'});
  const axis=['⿰','⿲'].includes(n.char)?0:1;
  let parts=n.children.map(c=>compose(c,p));
  if(p.mode==='equal-box'){
   const n=parts.length,step=100/n,sz=n===2?.48:.30;
   parts=parts.map((s,i)=>transform(s,axis===0?sz:1,axis===1?sz:1,axis===0?i*(100-sz*100)/(n-1):0,axis===1?i*(100-sz*100)/(n-1):0));
   return parts.reduce(union);
  }
  const scale=parts.length===3?p.axialScale*.78:p.axialScale;
  const roof=axis===1&&parts.length===2&&canopy(parts[0]);
  parts=parts.map((s,i)=>{const axial=roof?(i===0?scale*.66:scale*1.06):scale;const cross=roof&&i===1?p.crossScale*.88:p.crossScale;return transform(s,axis===0?axial:cross,axis===1?axial:cross,0,0);});
  // Center cross-axis ink once; narrow pre-positioned radicals are not stretched to fill a half-cell.
  parts=parts.map(s=>{const b=bounds(s.points);const delta=50-(b[1-axis]+b[3-axis])/2;return transform(s,1,1,axis===1?delta:0,axis===0?delta:0);});
  if(roof)parts[0].packing.push({rule:'narrow-crown-hollow-base',axialRatio:.66,lowerCrossRatio:.88});
  let r=parts.reduce((a,b)=>pack(a,b,axis,p.gap));return normalize(r,p);
 }
 function render(source,raw={}){try{
  const p=options(raw),n=parse(source),key=JSON.stringify([VERSION,source,p]);
  if(cache.has(key)){const result=cache.get(key);return JSON.parse(result);}
  const matched=p.unicodeMatch&&Object.hasOwn(MATCHES,source)?MATCHES[source]:null;
  let s=matched?leaf(matched):compose(n,p);if(p.mode==='equal-box')s=transform(s,.86,.86,7,7);else s=normalize(s,p);
  // Avoid claiming a painted glyph when nested affine compression makes a leaf subpixel/zero after serialization.
  if(s.leaves.some(l=>Math.min(Math.abs(l.sx),Math.abs(l.sy))<.001))throw Object.assign(Error('Optical geometry below minimum effective scale'),{kind:'unsupported',reason:'geometry-limit'});
  const leafMetrics=[];const groups=s.leaves.map((l,i)=>{
   const a=assets[l.char],anisotropy=1-Math.min(l.sx,l.sy)/Math.max(l.sx,l.sy);
   const stroke=p.mode==='optical'?p.compensation*anisotropy:0;
   const points=leaf(l.char).points.map(([x,y])=>[x*l.sx+l.tx,y*l.sy+l.ty]);const b=bounds(points);
   leafMetrics.push({index:i,char:l.char,bbox:b.map(number),bboxType:'sampled-ink-cell-centers-before-compensation',transform:[l.sx,l.sy,l.tx,l.ty].map(number),compensationStroke:number(stroke)});
   // Approximate geometric-mean compensation only; anisotropic transforms still change local stroke weight.
   const attrs=`transform="translate(${number(l.tx)} ${number(l.ty)}) scale(${number(l.sx)} ${number(l.sy)})"`;
   return `<g ${attrs}>${a.paths.map(d=>`<path d="${d}" fill="${p.color}"${stroke?` stroke="${p.color}" stroke-width="${number(stroke/Math.sqrt(l.sx*l.sy))}" stroke-linejoin="round"`:''}/>`).join('')}</g>`;
  }).join('');
  const title=matched?`已核Unicode对应：${matched} U+${matched.codePointAt(0).toString(16).toUpperCase()} · Noto字形`:`${source} · 构形试验 / 编码映射未确认`;
  const warnings=matched?['已核Unicode对应；完整轮廓来自OFL Noto Serif CJK SC，地域字形可能不同。']:['构形试验，编码映射尚未确认。','轮廓仿射压缩不等同于语义笔画粗细重建。'];
  const result={render:'ready',sourceIDS:source,match:matched?{character:matched,policy:'six-reviewed-exact-IDS'}:null,outputKind:matched?'matched-unicode-outline':'custom-composition-unconfirmed-match',svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${p.size}" height="${p.size}" viewBox="0 0 100 100"><title>${esc(title)}</title>${groups}</svg>`,warnings,metrics:{engine:VERSION,engineName:ENGINE_NAME,mode:p.mode,provenance,componentBboxes:leafMetrics,packing:s.packing,bbox:bounds(s.points).map(number),style:'single pinned Noto Serif CJK SC Regular',semanticStrokeConsistency:'not-computed',maskResolution:100}};
  if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(key,JSON.stringify(result));return JSON.parse(JSON.stringify(result));
 }catch(e){return {render:e.kind||'rejected',sourceIDS:typeof source==='string'?source:null,reason:e.reason||null,error:e.message,svg:null,metrics:null,warnings:['No guessed glyph or fallback font is emitted.']};}}
 return {render,clearCache:()=>cache.clear(),cacheSize:()=>cache.size};
}
const instance=createRenderer();
module.exports={VERSION,ENGINE_NAME,DEFAULTS,parse,createRenderer,render:instance.render,clearCache:instance.clearCache};
