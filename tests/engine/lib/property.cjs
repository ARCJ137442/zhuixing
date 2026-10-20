'use strict';
const fs=require('node:fs'),path=require('node:path');
const OPS={'⿰':2,'⿱':2,'⿲':3,'⿳':3,'⿴':2,'⿵':2,'⿶':2,'⿷':2,'⿸':2,'⿹':2,'⿺':2,'⿻':2,'⿼':2,'⿽':2,'⿾':1,'⿿':1,'㇯':2};
const SEED=Number(process.env.GLYPH_SEED||20261020)>>>0;
const ITERATIONS=Number(process.env.GLYPH_ITERATIONS||64);
function rng(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function tree(random,depth=3,ops=Object.keys(OPS),leaves=['木','人','中','𠮷']){if(!depth||random()<.35)return leaves[Math.floor(random()*leaves.length)];const op=ops[Math.floor(random()*ops.length)];return op+Array.from({length:OPS[op]},()=>tree(random,depth-1,ops,leaves)).join('');}
const serialize=n=>n.char+(n.children||[]).map(serialize).join('');
function walk(n,f){f(n);for(const c of n.children||[])walk(c,f);}
function shrinkCandidates(source){const chars=[...source],out=new Set(['木',...chars]);for(let chunk=Math.ceil(chars.length/2);chunk>=1;chunk=Math.floor(chunk/2))for(let i=0;i<chars.length;i+=chunk)out.add(chars.slice(0,i).concat(chars.slice(i+chunk)).join(''));out.delete(source);return [...out].filter(s=>s.length<source.length).sort((a,b)=>a.length-b.length);}
function minimize(source,predicate,maxAttempts=80){const signature=e=>[e.name,e.code||'',String(e.message).split('\n')[0]].join('|');let initial;try{predicate(source);}catch(e){initial=signature(e);}let current=source,attempts=0,changed=true;while(changed&&attempts<maxAttempts){changed=false;for(const candidate of shrinkCandidates(current)){if(attempts>=maxAttempts)break;attempts++;try{predicate(candidate);}catch(e){if(signature(e)!==initial)continue;current=candidate;changed=true;break;}}}return {minimal:current,attempts,budget:maxAttempts,failureSignature:initial,kind:'bounded deletion shrink retaining error signature; locally minimal only, not proof of global minimum'};}
function checkProperty(id,inputs,predicate){for(let i=0;i<inputs.length;i++){try{predicate(inputs[i]);}catch(error){const shrunk=minimize(inputs[i],predicate);const dir=path.resolve(__dirname,'../reports/failures');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify({id,seed:SEED,iteration:i,original:inputs[i],...shrunk,error:String(error.stack),replay:'Use original/minimal input with the same named property and recorded target-lock hashes.'},null,2)+'\n');throw error;}}}
module.exports={OPS,SEED,ITERATIONS,rng,tree,serialize,walk,minimize,checkProperty};
