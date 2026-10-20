import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../app/',import.meta.url));
const tests=["app-tests.cjs", "branding-tests.cjs", "command-system-tests.cjs", "editor-boundary-tests.cjs", "editor-commands-tests.cjs", "em-geometry-tests.cjs", "font-fallback-tests.cjs", "inline-tests.cjs", "input-flow-host-tests.cjs", "keyboard-host-tests.cjs", "motion-host-tests.cjs", "motion-tests.cjs", "pacing-tests.cjs", "recursive-audit-tests.cjs", "render-integration-tests.cjs", "selection-command-tests.cjs", "settings-module-tests.cjs", "unicode-edit-tests.cjs", "recursive-engine/tests.cjs", "recursive-engine/independent-review-tests.cjs"];
for(const test of tests){const r=spawnSync(process.execPath,[test],{cwd,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
for(const test of ['optical-engine-source/browser/build-browser.cjs','optical-engine-source/browser/browser-tests.cjs']){const r=spawnSync(process.execPath,[test],{cwd,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
console.log(`${tests.length} app suites and browser adapter suite passed; real-browser and IME acceptance are separate.`);
