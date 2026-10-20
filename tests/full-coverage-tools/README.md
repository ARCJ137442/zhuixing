# Full-coverage evidence contract (partial handoff)

This directory deliberately contains contracts and historical blocked reports, not the full runner or its input datasets. Nothing here establishes a full-CJK or common-3500 pass.

`STATE-MACHINE.json` defines 20,992 assigned core cases and the 3,500 common-character subset, per-stage evidence, missing/timeout/blocked semantics, resume rules and regression policy. `browser-matrix.json` is an unexecuted environment matrix, not browser evidence. `reference-manifest.example.json` is a format example, not supplied reference data.

`reports/` preserves six historical summaries: inventory membership, inventory stage counts, native-font control generation, missing candidate preflight, initial regression comparison and blocked release gate. Generating a native-font control is not proof that the product exports that glyph. Historical artifact hashes identify omitted inputs/outputs; those artifacts are not shipped here and the reports have not been recomputed by this handoff. Latest product CI is summarized in `../../research/README.md` separately.

The existing runnable 10-case gate remains `../known-regressions/`; it is not duplicated or weakened. A future full runner must pin actual inputs, obtain authorized local font/reference assets, record renderer and browser versions, and keep missing stages blocked. See `../../research/README.md` for the deferred module index. No dependencies are installed and no network collection is performed by this batch.
