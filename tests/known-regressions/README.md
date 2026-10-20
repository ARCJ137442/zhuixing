# Current known-regression release gate

Run from repository root: node tests/known-regressions/tools/known_gate.cjs

The 10 immutable expectations are copied from the original full-coverage gate. Its source report is retained. Only the default adapter/dependency-manifest locations were adjusted for this repository; assertions and exit semantics are unchanged. The adapter loads the current app engine and rows, and both dependencies are SHA-locked before/after execution. A failed assertion, dependency drift or adapter mutation exits nonzero.

Current outcome: 7 pass, 3 fail, releaseGate blocked. Fix the product, not the expected outputs. Any reviewed target update must preserve old failure reports and explain the change. Passing these anchors does not replace full3500/CJK/browser gates.

No external glyph imagery, reference SVGs, private identifiers or other project files are included.
