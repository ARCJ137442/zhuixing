// Pure semantic boundaries; no DOM, animation, settings persistence or source side effects.
const EditBoundary = (() => {
  function graphemes(source){
    if(typeof Intl.Segmenter==='function')return [0,...[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(source)].map(x=>x.index+x.segment.length)];
    const points=[source.length];let p=source.length;
    while(p>0){p=InlineModel.previous(source,p);points.push(p);}
    return points.reverse();
  }
  function effective(settings){return settings['editor.view']==='preview'?null:settings['editor.view']==='source'?'ids-grapheme':settings['editor.unit'];}
  function roots(source,settings){return Core.parse(source).filter(n=>n.type==='operator'&&!Core.hasModifierAt(source,n.end)&&(Core.previewKind(n)!=='source'||UnicodeMatches.lookup(source.slice(n.start,n.end),settings['unicode.presentation'])));}
  function boundaries(source,settings){
    const points=graphemes(source);
    if(effective(settings)!=='display-glyph')return points;
    const spans=roots(source,settings);
    return points.filter(p=>!spans.some(n=>p>n.start&&p<n.end));
  }
  const floor=(points,p)=>points.filter(x=>x<=p).at(-1)??0;
  const ceil=(points,p)=>points.find(x=>x>=p)??points.at(-1);
  function nearest(points,p){const a=floor(points,p),b=ceil(points,p);return p-a<b-p?a:b;}
  function normalize(source,selection,settings,{pointer=false}={}){
    const g=graphemes(source),s=InlineModel.range(selection,source.length);
    if(s.anchor===s.focus){const p=nearest(boundaries(source,settings),s.focus);return {anchor:p,focus:p};}
    const points=pointer&&effective(settings)==='display-glyph'?boundaries(source,settings):g;
    return {anchor:nearest(points,s.anchor),focus:nearest(points,s.focus)};
  }
  function wordTarget(source,p,direction){
    if(typeof Intl.Segmenter==='function'){
      const segments=[...new Intl.Segmenter(undefined,{granularity:'word'}).segment(source)];
      if(direction<0){const before=segments.filter(x=>x.index<p);while(before.length&&/^\s+$/u.test(before.at(-1).segment))before.pop();return before.at(-1)?.index??0;}
      let i=segments.findIndex(x=>x.index+x.segment.length>p);if(i<0)return source.length;
      let end=segments[i].index+segments[i].segment.length;while(i+1<segments.length&&/^\s+$/u.test(segments[i+1].segment))end=segments[++i].index+segments[i].segment.length;
      return end;
    }
    const points=graphemes(source);return direction<0?points.filter(x=>x<p).at(-1)??0:points.find(x=>x>p)??source.length;
  }
  function move(source,selection,direction,settings,{extend=false,word=false}={}){
    if(!effective(settings))return null;
    const points=boundaries(source,settings),[a,b]=InlineModel.bounds(selection);
    let target;
    if(!extend&&a!==b)target=direction<0?floor(points,a):ceil(points,b);
    else if(word){const raw=wordTarget(source,selection.focus,direction);target=direction<0?floor(points,raw):ceil(points,raw);}
    else target=direction<0?points.filter(x=>x<selection.focus).at(-1)??0:points.find(x=>x>selection.focus)??source.length;
    return {anchor:extend?selection.anchor:target,focus:target};
  }
  function deletion(source,selection,direction,settings,{word=false}={}){
    if(!effective(settings))return null;
    selection=normalize(source,selection,settings);
    let [a,b]=InlineModel.bounds(selection);
    if(a===b){const normalized=normalize(source,selection,settings);a=b=normalized.focus;const moved=move(source,normalized,direction,settings,{word});if(direction<0)a=moved.focus;else b=moved.focus;}
    if(a===b)return null;
    return InlineModel.replace(source,{anchor:a,focus:b},'');
  }
  function project(source,selection,expanded,settings){
    const view=settings['editor.view'];
    const resolve=ids=>UnicodeMatches.lookup(ids,settings['unicode.presentation']);
    if(view==='source')return InlineModel.parts(source,selection,expanded).map(p=>({...p,atom:false}));
    if(view==='preview')return InlineModel.parts(source,{anchor:0,focus:0},null,false,resolve);
    if(settings['editor.unit']==='display-glyph'){
      const [a,b]=InlineModel.bounds(selection);
      return InlineModel.parts(source,{anchor:0,focus:0},null,false,resolve).map(p=>({...p,atom:p.atom&&!(a!==b&&((a>p.start&&a<p.end)||(b>p.start&&b<p.end)))}));
    }
    return InlineModel.parts(source,selection,expanded,false,resolve);
  }
  return {graphemes,effective,roots,boundaries,normalize,wordTarget,move,deletion,project};
})();
