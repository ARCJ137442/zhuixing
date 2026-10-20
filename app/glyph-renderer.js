// One presentation plan owns the SVG frame and motion geometry. Source and identity are separate.
const GlyphRenderer=(()=>{
  function plan(node,source,{optical=true}={}){
    const ids=source.slice(node.start,node.end),kind=Core.previewKind(node);
    if(kind==='source')return {kind:'source',layoutMode:'source',svg:null,leaves:[],portableOutlines:false};
    // Cold optical packing is presentation-only. Keep deeply nested/bulk input on cheap geometry.
    let leafCount=0,maxDepth=0;function measure(n,d){maxDepth=Math.max(maxDepth,d);if(!n.children?.length)leafCount++;else n.children.forEach(c=>measure(c,d+1));}measure(node,0);
    const withinInteractiveBudget=leafCount<=18&&maxDepth<=8;
    if(optical&&withinInteractiveBudget&&typeof OpticalGlyph!=='undefined'){
      const result=OpticalGlyph.render(ids,{enabled:true,unicodeMatch:false});
      if(result.render==='ready')return {...result,kind:'outline',optical:true,leaves:result.leaves.map(leaf=>({...leaf,node:{char:leaf.char,start:node.start+leaf.sourceStart,end:node.start+leaf.sourceEnd}}))};
      if(result.render==='rejected')return {...result,kind:'source',leaves:[],svg:null};
    }
    const font=kind==='font';
    return {kind,fallbackReason:optical&&!withinInteractiveBudget?'interactive-complexity-budget':null,layoutMode:font?'font-fallback':'geometric',optical:false,svg:font?FontFallback.svg(node,source):Core.svg(node,source).replace('viewBox="0 0 100 100"','viewBox="7 7 86 86"'),viewBox:font?[0,0,100,100]:[7,7,86,86],leaves:Core.layoutLeaves(node),portableOutlines:!font};
  }
  function presentation(node,source,options={}){
    const ids=source.slice(node.start,node.end),character=options.unicode!==false&&!Core.hasModifierAt(source,node.end)&&UnicodeMatches.lookup(ids);
    if(!character)return plan(node,source,options);
    const family='Noto Serif CJK SC, serif';
    const metadata={sourceIDS:ids,character,identity:'dataset-scoped-unique-match',portableOutlines:false,fontDependency:family};
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" data-font-dependent="true" role="img"><title>'+Core.esc(character)+' · 已匹配字符的字体依赖呈现</title><metadata>'+Core.esc(JSON.stringify(metadata))+'</metadata><text x="50" y="84.2" text-anchor="middle" font-size="90" font-family="'+family+'" fill="currentColor">'+Core.esc(character)+'</text></svg>';
    return {kind:'font',layoutMode:'matched-unicode-font',character,svg,portableOutlines:false,viewBox:[0,0,100,100],leaves:[]};
  }
  return {plan,presentation};
})();
