'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../../..');
const BASE = path.resolve(__dirname, '..');
const file = relative => path.join(ROOT, relative);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(fs.readFileSync(path.join(BASE, 'sets/source-manifest.json'), 'utf8'));
function readSet(name, expected, expectedHash) {
  const bytes = fs.readFileSync(path.join(BASE, 'sets', name));
  if (sha(bytes) !== expectedHash) throw new Error('reference set SHA mismatch: ' + name);
  const values = bytes.toString('utf8').trimEnd('\n').split('\n');
  if (values.length !== expected || new Set(values).size !== expected) throw new Error('reference set cardinality mismatch: ' + name);
  return { bytes, values };
}
const coreRef = readSet(manifest.core.fixture, manifest.core.assigned, manifest.core.fixtureSha256);
const commonRef = readSet(manifest.common3500.fixture, manifest.common3500.count, manifest.common3500.fixtureSha256);
const coreSet = new Set(coreRef.values);
const commonSet = new Set(commonRef.values);
if (commonRef.values.some(char => !coreSet.has(char))) throw new Error('common set is not a subset of core set');
const rowBytes = fs.readFileSync(file('app/recursive-ids.rows.json'));
const rows = JSON.parse(rowBytes.toString('utf8'));
const htmlBytes = fs.readFileSync(file('app/index.html'));
const html = htmlBytes.toString('utf8');
const browserReportPath = path.join(BASE, 'reports', 'browser-review-latest.json');
let browserReview = null;
if (fs.existsSync(browserReportPath)) {
  try { browserReview = JSON.parse(fs.readFileSync(browserReportPath, 'utf8')); }
  catch { browserReview = { status: 'invalid-report' }; }
}
const browserReviewMatchesCurrent = !!browserReview && browserReview.source?.appHtmlSha256 === sha(htmlBytes) && browserReview.source?.rowsSha256 === sha(rowBytes);
function extract(id) {
  const open = '<script id="' + id + '">';
  const start = html.indexOf(open);
  if (start < 0) throw new Error('missing embedded script: ' + id);
  const bodyStart = start + open.length;
  const end = html.indexOf('</script>', bodyStart);
  if (end < 0) throw new Error('missing script close: ' + id);
  return html.slice(bodyStart, end);
}
const marker = 'const RecursiveIndex=RecursiveIDS.create(';
const markerAt = html.indexOf(marker);
if (markerAt < 0) throw new Error('missing embedded RecursiveIndex');
const jsonStart = markerAt + marker.length;
const jsonEnd = html.indexOf(');', jsonStart);
if (jsonEnd < 0) throw new Error('missing embedded RecursiveIndex terminator');
const embeddedRows = JSON.parse(html.slice(jsonStart, jsonEnd));
const embeddedDataMatches = JSON.stringify(embeddedRows) === JSON.stringify(rows);
const modules = ['core', 'unicode-matches', 'inline-model', 'selection-commands'];
const api = vm.runInNewContext(modules.map(extract).join('\n') + '\n;({RecursiveIDS,RecursiveIndex,UnicodeMatches,SelectionCommands})');
const rowsByChar = new Map();
for (const row of rows) {
  const list = rowsByChar.get(row.character) || [];
  list.push(row.ids);
  rowsByChar.set(row.character, list);
}
let coreUnique = 0, coreAmbiguous = 0, coreMissing = 0;
let coreFallbackCorrect = 0, coreReverseCorrect = 0, coreJoinCorrect = 0, coreAmbiguousJoinCorrect = 0, coreDirectCorrect = 0;
let commonUnique = 0, commonAmbiguous = 0, commonMissing = 0;
let commonFallbackCorrect = 0, commonReverseCorrect = 0, commonJoinCorrect = 0, commonAmbiguousJoinCorrect = 0, commonDirectCorrect = 0;
let coreAmbiguousSplitSafe = 0, commonAmbiguousSplitSafe = 0;
let badDirect = 0, badFallback = 0, badJoin = 0, badReverse = 0, badAmbiguousSplit = 0;
const caseLines = [];
for (const char of coreRef.values) {
  const definitions = api.RecursiveIndex.definitions.get(char) || [];
  const uniqueForms = new Set();
  for (const definition of definitions) {
    const ids = api.RecursiveIDS.serialize(definition);
    const hit = api.RecursiveIndex.lookup(ids, { recursive: false });
    if (hit.kind === 'matched' && hit.character === char) uniqueForms.add(ids);
    else if (hit.kind === 'matched' || hit.kind === 'ambiguous') badDirect++;
  }
  const forms = [...uniqueForms];
  let status = forms.length === 1 ? 'unique' : forms.length > 1 ? 'ambiguous' : definitions.length ? 'unresolved-candidate' : 'missing-candidate';
  let fallback = false, reverseSplit = false, join = false, direct = false;
  const splitResult = api.SelectionCommands.transform(char, 'split', api.UnicodeMatches.records);
  for (const ids of forms) {
    if (api.RecursiveIndex.lookup(ids, { recursive: false }).character === char) direct = true;
    if (api.UnicodeMatches.lookup(ids) === char) fallback = true;
    else badFallback++;
    if (api.SelectionCommands.transform(ids, 'join', api.UnicodeMatches.records) === char) join = true;
    else badJoin++;
    if (forms.length === 1) {
      if (api.UnicodeMatches.records[ids] === char && splitResult === ids) reverseSplit = true;
      else badReverse++;
    }
  }
  const ambiguousSplitSafe = forms.length > 1 && splitResult === char;
  if (forms.length > 1 && !ambiguousSplitSafe) badAmbiguousSplit++;
  if (forms.length === 1) {
    coreUnique++;
    if (reverseSplit) coreReverseCorrect++;
    if (join) coreJoinCorrect++;
  } else if (forms.length > 1) { coreAmbiguous++; if (join) coreAmbiguousJoinCorrect++; }
  else coreMissing++;
  if (direct) coreDirectCorrect++;
  if (fallback) coreFallbackCorrect++;
  if (commonSet.has(char)) {
    if (forms.length === 1) commonUnique++;
    else if (forms.length > 1) commonAmbiguous++;
    else commonMissing++;
    if (direct) commonDirectCorrect++;
    if (fallback) commonFallbackCorrect++;
    if (reverseSplit) commonReverseCorrect++;
    if (join) commonJoinCorrect++;
    if (ambiguousSplitSafe) commonAmbiguousSplitSafe++;
    if (forms.length > 1 && join) commonAmbiguousJoinCorrect++;
  }
  if (forms.length > 1) coreAmbiguousSplitSafe++;
  caseLines.push(JSON.stringify({char, codePoint: 'U+' + char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'), common3500: commonSet.has(char), rawRows: (rowsByChar.get(char) || []).length, directForms: forms, status, fallback, reverseSplit, join, ambiguousSplitSafe, direct}));
}
const shanFallback = api.UnicodeMatches.lookup('⿰衤彡');
const shanSplit = api.SelectionCommands.transform('衫', 'split', api.UnicodeMatches.records);
const integrity = embeddedDataMatches && badDirect === 0 && badFallback === 0 && badJoin === 0 && badReverse === 0 && badAmbiguousSplit === 0 && shanFallback === '衫' && shanSplit === '⿰衤彡';
const dataCoverageComplete = coreUnique === coreRef.values.length && commonUnique === commonRef.values.length;
const reportDir = path.join(BASE, 'reports');
const previousPath = path.join(reportDir, 'full-coverage-cases.jsonl');
const rank = {unique: 3, ambiguous: 2, 'unresolved-candidate': 1, 'missing-candidate': 0, 'fallback-mismatch': -1, 'reverse-split-mismatch': -1};
const regressions = [];
let previousCases = 0;
if (fs.existsSync(previousPath)) {
  const previous = fs.readFileSync(previousPath, 'utf8').trimEnd('\n').split('\n').filter(Boolean).map(line => JSON.parse(line));
  previousCases = previous.length;
  const current = new Map(caseLines.map(line => { const item = JSON.parse(line); return [item.char, item]; }));
  for (const item of previous) { const now=current.get(item.char); if(now && (rank[item.status]??-1)>(rank[now.status]??-1))regressions.push({char:item.char,previous:item.status,current:now.status}); }
}
const summary = {
  schemaVersion: 1,
  generatedAt: '2026-10-25',
  sources: {
    unicodeVersion: manifest.unicodeVersion,
    coreSet: {count: coreRef.values.length, sha256: sha(coreRef.bytes)},
    common3500: {count: commonRef.values.length, sha256: sha(commonRef.bytes)},
    recursiveRows: {count: rows.length, sha256: sha(rowBytes)},
    appHtml: {bytes: htmlBytes.length, sha256: sha(htmlBytes)}
  },
  coverage: {
    core: {expected: coreRef.values.length, uniqueDirect: coreUnique, ambiguous: coreAmbiguous, missingOrUnresolved: coreMissing, fallbackCorrect: coreFallbackCorrect, joinCorrect: coreJoinCorrect, ambiguousJoinCorrect: coreAmbiguousJoinCorrect, reverseSplitCorrect: coreReverseCorrect, ambiguousSplitSafe: coreAmbiguousSplitSafe, directLookupCorrect: coreDirectCorrect},
    common3500: {expected: commonRef.values.length, uniqueDirect: commonUnique, ambiguous: commonAmbiguous, missingOrUnresolved: commonMissing, fallbackCorrect: commonFallbackCorrect, joinCorrect: commonJoinCorrect, ambiguousJoinCorrect: commonAmbiguousJoinCorrect, reverseSplitCorrect: commonReverseCorrect, ambiguousSplitSafe: commonAmbiguousSplitSafe, directLookupCorrect: commonDirectCorrect}
  },
  integrity: {embeddedRowsMatchSource: embeddedDataMatches, badDirect: badDirect, badFallback: badFallback, badJoin: badJoin, badUniqueReverseSplit: badReverse, badAmbiguousSplit: badAmbiguousSplit, shanFallback: shanFallback, shanSplit: shanSplit, uniqueExactIdsJoinRecords: Object.keys(api.UnicodeMatches.records).length, priorCasesCompared: previousCases, noDegradation: regressions.length === 0, regressions: regressions.slice(0,100)},
  browserSmoke: {status: browserReviewMatchesCurrent ? browserReview.status : browserReview ? 'stale-or-invalid' : 'not-run', sourceMatchesCurrent: browserReviewMatchesCurrent, scope: browserReviewMatchesCurrent ? browserReview.scope : null, engineVersion: browserReviewMatchesCurrent ? browserReview.browser?.engineVersion ?? null : null, report: browserReviewMatchesCurrent ? 'browser-review-latest.json' : null},
  additionalStages: {fontCmap: 'not-run', fallbackRender: 'not-run', outlineExport: 'not-run', sameFontSvg: 'not-run', sameFontPixels: 'not-run', crossFontReference: 'not-run', browserChromium: 'not-run', browserFirefox: 'not-run', browserWebkit: 'not-run', nativeIme: 'not-run'},
  dataCoverageComplete: dataCoverageComplete,
  releaseGate: 'blocked-until-data-render-export-and-browser-stages-complete',
  limitations: ['The exact 20,992 and 3,500 case sets are executed; missing/ambiguous candidate cases remain blockers.', 'Raw annotated IDS semantics are not globally projected.', 'A unique IDS is dataset-scoped, not proof of universal glyph or etymology equivalence.']
};
fs.mkdirSync(reportDir, {recursive: true});
fs.writeFileSync(path.join(reportDir, 'full-coverage-cases.jsonl'), caseLines.join('\n') + '\n');
fs.writeFileSync(path.join(reportDir, 'full-coverage-latest.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (!integrity || regressions.length) process.exitCode = 1;
else if (!dataCoverageComplete) process.exitCode = 2;
