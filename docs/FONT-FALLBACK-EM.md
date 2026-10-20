# Font fallback geometry candidate

This is a non-release engineering change. `app/index.html` is the maintained, buildless source. No live site is deployed by this commit.

The fallback formerly sized CJK text from the smaller of the slot width/height, which made narrow left/right parts short as well as narrow. It now maps a local 100-em box independently along x/y, with the existing Noto reference baseline at 88. Motion leaf SVGs use the same independent-axis contract. Installed-font differences and missing characters remain possible; this is not portable outline rendering or a claim of pixel equivalence to a third-party service.

Only FontFallback changes in the app. Source text, parsing, matching, history, editing and copying are unchanged. Thirteen added tests cover slots, nesting, baseline, non-BMP/multi-codepoint leaves, escaping and source/copy/undo preservation. An independent controlled Motion.play check matched animated slots to the actual cropped final SVG. No real-browser/font/IME acceptance was performed.

Local controlled results on 2026-10-20: 20 app suites / 354 checks plus 38 adapter checks passed. Historical engine: 49 passed, 3 skipped. Known regression gate actually ran 10 cases: 7 passed, 3 failed, release blocked. Semantic expectations and fingerprint lock files were not changed. These results do not establish CJK-core/common-3500 coverage, Unicode matching for 抱/佨, or a product release.

The existing plan.viewBox metadata inconsistency remains separately recorded; current motion reads and normalizes the actual SVG viewBox. It is not expanded into this small change.
