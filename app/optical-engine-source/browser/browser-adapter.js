// Browser-only, no persistence, DOM, input transactions, network or per-frame asset initialization.
function createOpticalGlyph(engine, assetChars, matchRecords) {
  'use strict';
  const supported = new Set(['⿰','⿱','⿲','⿳']);
  const assets = new Set([...assetChars]);
  const matches = Object.freeze({...matchRecords});
  const arity = Object.freeze({'⿰':2,'⿱':2,'⿲':3,'⿳':3,'⿴':2,'⿵':2,'⿶':2,'⿷':2,'⿸':2,'⿹':2,'⿺':2,'⿻':2,'⿼':2,'⿽':2,'⿾':1,'⿿':1,'㇯':2});
  const capabilities = Object.freeze({engineVersion:engine.VERSION, engineName:engine.ENGINE_NAME, supportedOperators:Object.freeze([...supported]), opticalMaxSourceUnits:1024, opticalMaxDepth:16, opticalMaxNodes:255, hostCheckMaxSourceUnits:4000, hostCheckMaxDepth:32, hostCheckMaxNodes:4000, cacheLimit:128, coordinateSpace:'viewBox units', defaultViewBox:Object.freeze([0,0,100,100])});
  const cache = new Map();
  let engineCalls=0, cacheHits=0;
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = (source,reason,error) => ({render:'rejected',sourceIDS:typeof source==='string'?source:null,reason,error,svg:null,leaves:[],viewBox:null,layoutMode:'none',outputKind:'source',portableOutlines:false,warnings:['Rejected input must not be retried through a more permissive renderer.']});
  function normalize(raw={}) {
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Options must be an object');
    const opt={enabled:true,...engine.DEFAULTS,...raw};
    for(const key of Object.keys(opt))if(key!=='enabled'&&!Object.hasOwn(engine.DEFAULTS,key))throw Error('Unknown option: '+key);
    if(typeof opt.enabled!=='boolean'||typeof opt.unicodeMatch!=='boolean')throw Error('Boolean setting required');
    for(const [key,lo,hi] of [['gap',1,10],['axialScale',.3,.85],['crossScale',.5,1],['margin',3,15],['compensation',0,1.5],['size',16,4096]])if(typeof opt[key]!=='number'||!Number.isFinite(opt[key])||opt[key]<lo||opt[key]>hi)throw Error('Invalid '+key);
    if(typeof opt.color!=='string'||!/^#[a-f\d]{6}$/i.test(opt.color)||typeof opt.mode!=='string'||!['optical','equal-box'].includes(opt.mode))throw Error('Invalid style');
    return opt;
  }
  function validLeaf(char){const p=char.codePointAt(0);return p===0x3007||p===0xff1f||(p>=0x31c0&&p<=0x31e5)||(p>=0xe000&&p<=0xf8ff)||(p>=0xf0000&&p<=0xffffd)||(p>=0x100000&&p<=0x10fffd)||(p>=0x2e80&&p<=0x2fdf)||(p>=0x3400&&p<=0x4dbf)||(p>=0x4e00&&p<=0x9fff)||(p>=0xf900&&p<=0xfaff)||(p>=0x20000&&p<=0x323af);}
  function inspect(source,opt){
    if(typeof source!=='string'||source.length>4000)throw Error('Source exceeds host safety boundary or is not a string');
    let pos=0,nodes=0,maxDepth=0;const leaves=[],unsupported=new Set(),missing=new Set();
    function expr(depth){
      if(depth>32||++nodes>4000)throw Error('Host tree safety boundary exceeded');
      maxDepth=Math.max(maxDepth,depth);
      if(pos>=source.length)throw Error('Incomplete IDS');
      const start=pos,char=String.fromCodePoint(source.codePointAt(pos));pos+=char.length;
      if(Object.hasOwn(arity,char)){if(!supported.has(char))unsupported.add(char);for(let i=0;i<arity[char];i++)expr(depth+1);}
      else{if(!validLeaf(char))throw Error('Invalid IDS leaf');leaves.push({char,sourceStart:start,sourceEnd:pos});if(!assets.has(char))missing.add(char);}
    }
    expr(0);if(pos!==source.length)throw Error('Expected exactly one IDS root');
    // Unicode identity is never guessed. Only an explicit caller request can use the six reviewed mappings.
    const matched=opt.unicodeMatch&&Object.hasOwn(matches,source)?matches[source]:null;
    const reasons=[];
    if(!opt.enabled)reasons.push('disabled');
    if(source.length>1024||nodes>255||maxDepth>16)reasons.push('optical-capacity');
    if(!matched&&unsupported.size)reasons.push('unsupported-layout');
    if(!matched&&missing.size)reasons.push('missing-outlines');
    return {render:reasons.length?'not-applicable':'eligible',sourceIDS:source,reason:reasons[0]||null,reasons,unsupported:[...unsupported],missing:[...missing],leaves,nodes,maxDepth,matched};
  }
  function eligibility(source,raw={}){try{return inspect(source,normalize(raw));}catch(error){return fail(source,'invalid-input',error.message);}}
  function render(source,raw={}){
    let opt;
    try{opt=normalize(raw);}catch(error){return fail(source,'invalid-options',error.message);}
    // Bound source before key creation. Cache identity includes all normalized settings and source;
    // this singleton's frozen assets were validated exactly once when the browser bundle initialized.
    if(typeof source!=='string'||source.length>4000)return fail(source,'invalid-input','Source exceeds host safety boundary or is not a string');
    const key=JSON.stringify([engine.VERSION,source,opt]);
    if(cache.has(key)){cacheHits++;return clone(cache.get(key));}
    let check;
    try{check=inspect(source,opt);}catch(error){return fail(source,'invalid-input',error.message);}
    let result;
    if(check.render==='not-applicable')result={...check,svg:null,viewBox:null,layoutMode:'not-applicable',outputKind:'source',portableOutlines:false,warnings:['Optical capability does not apply; the host may choose its independently validated geometric/font fallback.']};
    else {
      const options={...opt};delete options.enabled;
      engineCalls++;let painted=engine.render(source,options);
      if(painted.render==='unsupported'&&painted.reason==='geometry-limit'){
        const result={...check,render:'not-applicable',reason:'geometry-limit',reasons:['geometry-limit'],svg:null,viewBox:null,layoutMode:'not-applicable',outputKind:'source',portableOutlines:false,warnings:['Optical geometry would become subpixel; host may use its explicit geometric/font fallback.']};
        if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(key,clone(result));return clone(result);
      }
      if(painted.render!=='ready')return {...fail(source,'engine-'+painted.render,painted.error||'Optical engine failed'),engineStatus:painted.render,warnings:[...painted.warnings,'Do not silently downgrade an unexpected engine rejection.']};
      let qualityGuard=null;
      // A conservative selection guard, not a new distortion: retain the same-font control
      // when default optical LR packing loses substantial cross-axis ink extent.
      // Explicit custom geometry settings are respected and are not silently overridden.
      const defaultGeometry=['gap','axialScale','crossScale','margin','compensation'].every(k=>opt[k]===engine.DEFAULTS[k]);
      if(!painted.match&&opt.mode==='optical'&&defaultGeometry&&['⿰','⿲'].includes([...source][0])){
        engineCalls++;const control=engine.render(source,{...options,mode:'equal-box'});
        if(control.render==='ready'){
          const candidateBBox=[...painted.metrics.bbox],controlBBox=[...control.metrics.bbox];
          const candidateSpan=candidateBBox[3]-candidateBBox[1],controlSpan=controlBBox[3]-controlBBox[1];
          const applied=controlSpan>=45&&candidateSpan/controlSpan<.9&&controlSpan-candidateSpan>5;
          qualityGuard={evaluated:true,applied,axis:'y',candidateBBox,controlBBox,candidateSpan,controlSpan,selectedSpan:applied?controlSpan:candidateSpan,minimumRatio:.9,minimumControlSpan:45,absoluteLossThreshold:5,reason:applied?'cross-axis-occupancy-loss':controlSpan<45?'sparse-cross-axis':'no-material-loss'};
          if(applied)painted=control;
        }
      }
      // These fragments come from the same trusted SVG string used for preview/export, not a second layout.
      const groups=painted.svg.match(/<g\b[^>]*>[\s\S]*?<\/g>/g)||[];
      const rows=painted.metrics.componentBboxes;
      if(groups.length!==rows.length||(!painted.match&&rows.length!==check.leaves.length))return fail(source,'layout-contract','SVG and component count differ');
      const leaves=rows.map((row,index)=>{
        const range=painted.match?{sourceStart:0,sourceEnd:source.length,char:painted.match.character}:check.leaves[index];
        const [sx,sy,tx,ty]=row.transform;
        return {...range,index,transform:[sx,sy,tx,ty],box:[tx,ty,100*sx,100*sy],bbox:[...row.bbox],bboxType:row.bboxType,paint:groups[index].replace(/^<g\b[^>]*>/,'').replace(/<\/g>$/,''),paintGroup:groups[index],compensationStroke:row.compensationStroke};
      });
      const guarded=!!qualityGuard?.applied;
      result={...painted,leaves,viewBox:[0,0,100,100],layoutMode:painted.match?'matched-outline':guarded?'same-font-geometric-fallback':opt.mode==='optical'?'optical':'equal-box',outputKind:painted.match?'matched-unicode-outline':guarded?'same-font-geometric-outline':'optical-outline',portableOutlines:true,motionPolicy:painted.match?'static-match':'component-transform',reason:guarded?'cross-axis-occupancy-loss':null,fallbackReason:guarded?'cross-axis-occupancy-loss':null,metrics:{...painted.metrics,qualityGuard},warnings:guarded?[...painted.warnings,'光学组合降低交叉轴墨迹占用，采用同字体几何回退；未宣称光学质量提升。']:painted.warnings};
    }
    if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(key,clone(result));return clone(result);
  }
  function clearCache(){cache.clear();engine.clearCache();}
  return Object.freeze({render,eligibility,capabilities,clearCache,cacheInfo:()=>({size:cache.size,limit:128,engineCalls,cacheHits})});
}
