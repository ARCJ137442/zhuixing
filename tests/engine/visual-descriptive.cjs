'use strict';
// Emits only our own SVG; the optional Python step reads reference PNG, never reference SVG.
const fs=require('node:fs'),path=require('node:path'),{engine}=require('./lib/targets.cjs');
const dir=path.join(__dirname,'reports/visual-descriptive');fs.mkdirSync(dir,{recursive:true});
for(const [id,input] of [['renzhong','⿱人中'],['naizhi','⿰乃至']]){const r=engine.render(input);fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify({...r,svg:undefined},null,2));if(r.render!=='ready')throw Error(id+': '+r.render);fs.writeFileSync(path.join(dir,id+'.svg'),r.svg);}
console.log('Two locally generated SVGs only; run raster/comparison separately. No visual quality pass is asserted.');
