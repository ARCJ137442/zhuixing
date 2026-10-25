# Current known-regression release gate

Run from repository root: node tests/known-regressions/tools/known_gate.cjs

The 10 immutable expectations are copied from the original full-coverage gate. Its source report is retained. Only the default adapter/dependency-manifest locations were adjusted for this repository; assertions and exit semantics are unchanged. The adapter loads the current app engine and rows, and both dependencies are SHA-locked before/after execution. A failed assertion, dependency drift or adapter mutation exits nonzero.

Current outcome after the reviewed data correction: 10 pass, 0 fail, `releaseGate=known-regressions-pass-only`. This is only the immutable ten-case known-regression gate; it does not replace full3500/CJK/browser gates.

The fixture SHA is byte-pinned to canonical LF. On Windows checkouts that materialize this JSON as CRLF, run the same gate from a temporary canonical-LF staging copy; do not rewrite the expectation or lock to accommodate line endings.

## Reviewed target update · 2026-10-25

The strict imported IDS rows excluded two explicitly required records because their upstream forms carry annotations. The immutable fixture already records the exact source forms: `佨\t⿰亻包.(.);⿰亻包J(J)` and `抱\t⿰扌包.(.);⿰扌包J(J)`. Those two exact IDS bodies were added as individually reviewed rows, and their raw source strings are recorded in `app/recursive-ids-provenance.json`. This does not strip annotations from any other row or alter the broader strict import policy.

A separate engine-reviewed mapping covers `衫`: the pinned MIT source row is `衫\t⿰衤.彡(.);⿰衤J彡(J);⿰衤jh彡(V)` ([pinned source](https://github.com/yi-bai/ids/blob/267e3fb5d0a32de63128e67ef2f329277cc4013c/ids_lv0.txt)). Only the first form's base structure is admitted as `⿰衤彡`; its exact raw row is preserved in the provenance record. This addition is covered by the independent recursive engine tests, not by the immutable ten-case gate.

The negative control remains unchanged: literal `⿰亻报` must not match `保`, `抱`, or `佨`. The full-source expectation still requires `⿰亻报⿰亻包⿰扌包抱` → `⿰亻报佨抱抱`.

`current-target.json` now locks the reviewed candidate engine/data bytes. The immutable expectation JSON and its SHA lock are unchanged. The pre-fix result remains in `reports/original-strict-pre-fix-known-regressions.json`; the current rerun is written to `reports/known-regression-latest.json`. Passing this narrow gate is not release approval.

No external glyph imagery, reference SVGs, private identifiers or other project files are included.
