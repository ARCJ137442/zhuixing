'use strict';
// Read-only check: never normalize files or refresh expectation fingerprints.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const git=(args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trimEnd();
const format=git(['rev-parse','--show-object-format']);
if(!['sha1','sha256'].includes(format))throw Error('Unsupported Git object format: '+format);
const rows=git(['ls-tree','-rz','--full-tree','HEAD']).split('\0').filter(Boolean);
const failures=[];
for(const row of rows){
  const tab=row.indexOf('\t'),[mode,type,expected]=row.slice(0,tab).split(' '),name=row.slice(tab+1);
  if(type!=='blob'){failures.push({name,reason:'unsupported non-blob entry'});continue;}
  try{
    const file=path.join(root,name),bytes=mode==='120000'?Buffer.from(fs.readlinkSync(file)):fs.readFileSync(file);
    const actual=crypto.createHash(format).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if(actual!==expected)failures.push({name,reason:'checkout bytes differ from HEAD',expected,actual});
  }catch(error){failures.push({name,reason:error.message});}
}
console.log(JSON.stringify({check:'checkout-byte-identity',tracked:rows.length,failed:failures.length,failures},null,2));
process.exitCode=failures.length?1:0;
