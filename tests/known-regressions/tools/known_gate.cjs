'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),file=path.join(ROOT,'regressions/expected-known.json');
const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const lock=JSON.parse(fs.readFileSync(path.join(ROOT,'regressions/expected-known.lock.json')));
if(digest(file)!==lock.sha256)throw Error('Known expectation baseline changed; stop rather than lowering assertions.');
const adapterIndex=process.argv.indexOf('--adapter'),adapterPath=adapterIndex>=0?path.resolve(process.argv[adapterIndex+1]):path.join(__dirname,'current_app_adapter.cjs');
const depIndex=process.argv.indexOf('--dependencies');
const depFile=depIndex>=0?path.resolve(process.argv[depIndex+1]):adapterIndex<0?path.join(ROOT,'current-target.json'):null;
const dependencies=depFile?JSON.parse(fs.readFileSync(depFile)).files:null;
const dependencyMismatches=dependencies?Object.entries(dependencies).filter(([f,h])=>digest(path.resolve(ROOT,f))!==h).map(([f])=>f):['missing-dependency-manifest'];
const before=digest(adapterPath),adapter=require(adapterPath),spec=JSON.parse(fs.readFileSync(file)),rows=[];
for(const c of spec.lookups){let actual,pass=false,error;try{actual=adapter.lookup(c.input);pass=actual.kind==='matched'&&actual.character===c.expected;}catch(e){error=e.message;}rows.push({id:c.id,stage:'known-match',input:c.input,expected:c.expected,actual,error,status:pass?'pass':'fail'});}
for(const c of spec.nonMappings){let actual,pass=false,error;try{actual=adapter.lookup(c.input);pass=!c.forbidden.includes(actual.character)&&!(actual.candidates||[]).some(x=>c.forbidden.includes(x));}catch(e){error=e.message;}rows.push({id:c.id,input:c.input,expectedForbidden:c.forbidden,actual,error,status:pass?'pass':'fail'});}
for(const c of spec.fullStrings){let actual,pass=false,error;try{actual=adapter.transform(c.source,c.command);pass=actual.source===c.expected;}catch(e){error=e.message;}rows.push({id:c.id,stage:'whole-source-transform',source:c.source,expected:c.expected,actual,error,status:pass?'pass':'fail'});}
const failed=rows.filter(x=>x.status!=='pass').length,changed=digest(adapterPath)!==before||(dependencies&&Object.entries(dependencies).some(([f,h])=>digest(path.resolve(ROOT,f))!==h));
const report={schemaVersion:1,adapterPath:path.relative(ROOT,adapterPath),adapterSha256:before,expectedSha256:lock.sha256,targetChanged:changed,dependencyMismatches,dependencyHashes:dependencies,required:rows.length,passed:rows.length-failed,failed,releaseGate:failed||changed||dependencyMismatches.length?'blocked':'known-regressions-pass-only',rows,caveat:'Passing these anchors cannot substitute for full3500/core/browser gates; adapter must expose complete dependency provenance.'};
fs.writeFileSync(path.join(ROOT,'reports/known-regression-latest.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({required:rows.length,failed,releaseGate:report.releaseGate}));process.exitCode=failed||changed||dependencyMismatches.length?1:0;
