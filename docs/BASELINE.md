# 0.1.6 sanitized repository baseline

Source: frozen structure-glyph-0.1.6-source.zip.
ZIP SHA-256: 3b31dcb278e324d4914b96c6af6ef744d104c98002f7e879cc256ff3bfdf0bce.

This is a sanitized version-control baseline, not a byte-identical release repackaging. Runtime source comes only from that frozen ZIP, never from the concurrently edited working application.

Included: current HTML and product Markdown, generated component data and provenance, font subset, OFL and IDS MIT notices, component/document maintenance scripts, all ten current test suites, parser test cases, and only the 0.1.1/0.1.4 HTML fixtures needed by historical regression tests.

Excluded: work plans and logs, historical delivery bundles, raw research, private skill sources, user screenshots, observed reference SVGs, conversation identifiers and local execution records.

Sanitization: private design-skill attribution replaced by product design principles; private deployment/access troubleshooting history removed and replaced by the unchanged unverified-browser limitation; references to user screenshots generalized without changing the known limitation; document integration script changed from an unrelated absolute workspace dependency to require('markdown-it'). The latter dependency is only needed to regenerate embedded documentation, not to run the delivered HTML or tests. No dependency was installed.

The historical HTML fixtures are test fixtures, not supported releases. Documentation sanitation applies to them too. Application behavior was not intentionally changed. This baseline does not imply real-browser, IME or visual acceptance, and has no software open-source license yet.
