# Engineering evidence, not a product release

This small batch adds research and validation contracts only; it does not change the engine or claim full reproduction.

## Current integration evidence

Base: `789c0fb5fe6024946261c4034aa7a85fa2844abb`.
[CI run 39392852046](https://github.com/exomind-team/zhuixing/actions/runs/39392852046) completed with failure: Windows and Ubuntu checkout-byte checks passed; 19 app suites and 38 adapter checks passed; engine tests were 49 pass / 3 skip / 0 fail; the real known-regression gate was 7 pass / 3 fail out of 10. This is no longer a fingerprint refusal. It is not full CJK, common-3500, or browser acceptance.

## Included

- `annotated-import/`: lossless envelope parser, synthetic local assertions, pinned grammar attribution and historical audits. Semantic projection remains disabled.
- `browser-validation/`: frozen-file loopback server, acceptance contract and honestly blocked browser record. No actual browser acceptance is claimed.
- `../tests/full-coverage-tools/`: coverage state contract, empty browser evidence matrix, reference contract and historical blocked summary reports.

## Deliberately deferred

- Full inventory/oracle/comparison runners: require omitted IDS/UCD/Unihan/common-3500 inputs, pinned fonts, generated inventory/cache, fontTools and raster dependencies. Original modules are build_inventory, build_common_cases, build_oracles, compare_batch, crossfont_batch, coverage_state, release_gate, no_degradation, preflight_all3500, raster_metrics, test_inventory and extract_common3500. They need a separate portability/input-licensing pass, not automatic execution.
- Outline-coverage experiments: unreviewed non-product geometry experiments and large font/vector/raster outputs are not included.
- Third-party reference observer/cache: collection is **blocked at 83/3500**, not running or complete. Raw pages, response bodies, external SVG/PNG, request logs and cache are excluded; observer code still needs review.
- No common-3500 input dataset, font binary, raw third-party source archive, screenshot, personal path, private skill or credential is included.

Software license remains undecided. Existing upstream MIT/OFL/Unicode notices are not a license grant for this project's own code. These are research tools, not newly accepted product features.
