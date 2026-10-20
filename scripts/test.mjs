import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../app/',import.meta.url));
const tests=["app-tests.cjs", "font-fallback-tests.cjs", "inline-tests.cjs", "input-flow-host-tests.cjs", "keyboard-host-tests.cjs", "motion-host-tests.cjs", "motion-tests.cjs", "pacing-tests.cjs", "selection-command-tests.cjs", "unicode-edit-tests.cjs"];
for(const test of tests){const r=spawnSync(process.execPath,[test],{cwd,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
console.log(`${tests.length} test suites passed; real-browser and IME acceptance are separate.`);
