const fs=require('node:fs');
const path=require('node:path');
const MarkdownIt=require('markdown-it');
const base=__dirname, md=fs.readFileSync(path.join(base,'document.md'),'utf8');
const renderer=new MarkdownIt({html:false,linkify:false,typographer:false});
const ts=renderer.parse(md,{}),toc=[];let index=0;
for(let i=0;i<ts.length;i++)if(ts[i].type==='heading_open'){
 const id='doc-section-'+index++;ts[i].attrSet('id',id);
 if(ts[i].tag==='h2')toc.push({id,title:ts[i+1].content});
}
const safe=s=>renderer.utils.escapeHtml(s);
const body=renderer.renderer.render(ts,renderer.options,{});
const payload=JSON.stringify(md).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const fragment=`<!-- embedded-document:start -->
<style>
#product-document{width:min(1180px,calc(100% - 24px));max-height:90vh;padding:0;border:1px solid var(--line);background:var(--paper);color:var(--ink)}#product-document::backdrop{background:#18201799}.doc-toolbar{position:sticky;top:0;background:var(--paper);border-bottom:1px solid var(--line);padding:14px 22px;display:flex;align-items:center;gap:12px;z-index:2}.doc-toolbar strong{flex:1}.doc-layout{display:grid;grid-template-columns:190px minmax(0,1fr);gap:30px;padding:25px}.doc-toc{font-size:12px;align-self:start;display:grid;gap:8px}.doc-toc a{overflow-wrap:anywhere}.doc-body{min-width:0;overflow-wrap:anywhere;line-height:1.85}.doc-body h1{font-size:27px;font-weight:600;line-height:1.5}.doc-body h2{font-size:21px;font-weight:600;margin:34px 0 15px;padding-bottom:8px;border-bottom:1px solid var(--line);scroll-margin-top:85px}.doc-body h3{font-size:16px;margin-top:24px}.doc-body table{display:block;width:100%;overflow:auto;border-collapse:collapse;margin:20px 0;font-size:12px}.doc-body th,.doc-body td{border:1px solid var(--line);padding:8px 10px;vertical-align:top;min-width:95px}.doc-body pre{overflow:auto;background:var(--wash);padding:14px}.doc-body code{font-size:.92em}.doc-body blockquote{border-left:3px solid var(--red);padding-left:16px;margin-left:0;color:#5e6256}.doc-body p{margin:12px 0}.doc-body li{margin:5px 0}@media(max-width:700px){.doc-layout{display:block;padding:16px}.doc-toc{margin-bottom:24px}.doc-toolbar{padding:10px;flex-wrap:wrap}.doc-toolbar strong{font-size:12px}.doc-body h1{font-size:22px}}
</style>
<dialog id="product-document" aria-labelledby="doc-title"><div class="doc-toolbar"><strong id="doc-title">产品定义与验证方案</strong><button id="doc-download-inline">下载 Markdown</button><form method="dialog"><button aria-label="关闭产品文档">关闭 ×</button></form></div><div class="doc-layout"><nav class="doc-toc" aria-label="产品文档目录">${toc.map(t=>`<a href="#${t.id}">${safe(t.title)}</a>`).join('')}</nav><article class="doc-body">${body}</article></div></dialog>
<script type="application/json" id="product-markdown">${payload}</script>
<script>
(()=>{const dialog=document.getElementById('product-document');document.getElementById('open-docs').onclick=()=>dialog.showModal();function save(){const s=JSON.parse(document.getElementById('product-markdown').textContent),u=URL.createObjectURL(new Blob([s],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='缀形成象-产品定义与验证方案.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}document.getElementById('download-docs').onclick=save;document.getElementById('doc-download-inline').onclick=save;})();
</script>
<!-- embedded-document:end -->`;
let html=fs.readFileSync(path.join(base,'index.html'),'utf8');
html=html.replace(/<!-- embedded-document:start -->[\s\S]*?<!-- embedded-document:end -->/,'');
html=html.replace(/<dialog id="product-document"[^>]*>[\s\S]*?<\/dialog>/,'');
if(!html.includes('id="open-docs"')||!html.includes('id="download-docs"'))throw Error('Document buttons not ready');
html=html.replace('</body>',fragment+'\n</body>');fs.writeFileSync(path.join(base,'index.html'),html);
console.log(JSON.stringify({markdownBytes:Buffer.byteLength(md),htmlBytes:Buffer.byteLength(html),headings:index,toc:toc.length}));
