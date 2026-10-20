# Explicit portable and privacy migration · 2026-10-20

Original suite retained outside Git. Prior failure reports, test inputs and expectations are preserved in this portable copy; only private conversation routing identifiers and absolute workspace prefixes are removed. pre-portable-corpus-baseline.json records the old hashes; corpus-baseline.json is explicitly re-recorded for this sanitation, not to hide a changed test expectation.

Runtime dependencies now resolve to app/ and app/optical-engine-source/. The historical 0.1.4 fixture retains its runtime but drops embedded product documentation. host-v020.html now comes from the sanitized final aae434037124a10c829cc7db472c6466dc0c4dd507d41b17a0c69d7859b64558 release, whose 16 runtime script blocks are identical to that frozen source. Earlier c1b17 reports remain historical and do not validate the final guard.

The target lock is explicitly re-recorded for these reviewed path, fixture and sanitation changes. Historical lock files are evidence only, not the current runnable target. New runs report their own targets and suite hashes.

No external reference pixels or SVGs are included. Descriptive numerical comparisons remain historical, not visual-quality approvals. A newer guard may properly expose obsolete test expectations; any correction is documented without deleting failures.

The first portable final-host run exposed an obsolete expectation: both 乃至 and 三木 now use the explicit same-font guard. The failed JSON/TAP is retained as portable-pre-guard-expectation. After independent review, the assertion now checks the exact route and guard metrics; see regressions/quality-guard-migration.json. Three seeded reruns each produced 52 tests, 49 pass and 3 explicit skips.
