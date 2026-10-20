# Annotated IDS import checkpoint

No product candidate has been changed. 0.3.1 naming remains frozen and unpublished.

The pinned MIT source is yi-bai/ids commit 267e3fb5d0a32de63128e67ef2f329277cc4013c. Upstream README documents column 2 as primary, column 3 as alternatives, semicolon-separated sequences, and trailing parenthesized variant indicators. It does not define all node suffixes, overlap parameters, references, or stroke annotations.

The current importer preserves every raw line and sequence, source positions, column roles, multiple variant groups, parameter groups, opaque references and suffix tokens. Audit of all 102033 lines and 166916 sequences round-trips the exact line content; this is only envelope coverage, NOT proof of semantic understanding or matching/rendering coverage. Projection is disabled pending evidence and separately reviewed rules. Unknown syntax must remain inspectable and must not silently enter the Unicode matching index.

User regression input: ⿰亻报⿰亻包⿰扌包抱. Existing strict index lacks 抱 and 包, and missing 包 outline invokes font fallback. This establishes a coverage gap, not a complete root-cause finding. ⿰亻报 must never be rewritten to 保 by visual similarity. Preserve the original source and editing/undo behavior regardless of material availability.

Preserved audit output: envelope-audit.json. Official pinned README is linked in grammar-evidence.md. No data is fetched at application runtime. No third-party glyph paths are used.
