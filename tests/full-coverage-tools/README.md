# Unicode core and 3,500 common-character audit

This audit is a complete **input-set audit** for the pinned Unicode 17.0.0 scope, not a product-pass certificate. The full set is the assigned URO range U+4E00..U+9FFF (20,992 characters); the common subset is TGH 2013 levels 1 ranks 1–3,500, extracted from Unicode 17.0.0 Unihan `kTGH`. Official scope details are documented by [Unicode UAX #38](https://www.unicode.org/reports/tr38/) and [Unicode 17.0.0 UCD](https://www.unicode.org/Public/17.0.0/ucd/). The Chinese Ministry of Education describes the first level of the General Standard Chinese Characters Table as 3,500 characters: [official notice](https://www.moe.gov.cn/jyb_xwfb/s5147/201308/t20130828_156388.html).

The reference fixtures and source hashes are in `sets/source-manifest.json`. They were regenerated in memory from Unicode's versioned `DerivedAge.txt` and `Unihan.zip`; no compressed source archive is required for the ordinary offline audit. Rebuild them with:

    pwsh -NoProfile -File tests/full-coverage-tools/tools/build-reference-sets.ps1

Run the full direct-coverage audit with:

    node tests/full-coverage-tools/tools/audit-current.cjs

The runner enumerates all 20,992 core characters and reports the 3,500 subset separately. It checks source/embedded data identity, every direct row's returned identity, exact-string join for unique and multi-form IDS records, one-step reverse split only for unique character forms, conservative no-guess handling for ambiguous characters, missing candidates, and no-degradation against the previous full run. It writes the per-character results and summary into `reports/`.

Exit code `0` means data coverage and integrity both meet the current gate; `1` means an integrity or no-degradation failure; `2` means the full input set ran correctly but missing/ambiguous mappings keep data coverage incomplete. In that last case, inspect `coverage` and each row in the JSONL instead of treating the completed enumeration as a product pass.

`reports/browser-review-latest.json` records representative UI smoke on the user-run local HTTP page, including exact source HTML/data hashes and the paths exercised. The runner links it only while both hashes match the current worktree. It does not satisfy `browserChromium` full-set rendering; Firefox/WebKit, font cmap, outline export, cross-font comparisons and native IME remain separate stages.

A missing candidate, ambiguous mapping, missing glyph, timeout or unrun renderer stage never counts as a pass. The overall gate remains blocked until coverage semantics and the separately required font, export and real-browser stages are evidenced. The audit does not reinterpret source annotations or claim cross-regional glyph equivalence.

Unicode data notice: [UNICODE-DATA-LICENSE.txt](../../app/glyph-complex-cases/UNICODE-DATA-LICENSE.txt). IDS data notice: [IDS-DATA-LICENSE.txt](../../app/IDS-DATA-LICENSE.txt).
