# yi-bai/ids annotated import: evidence and projection boundary

## Source and verified facts

Fixed upstream revision: `267e3fb5d0a32de63128e67ef2f329277cc4013c`.

Official pinned README: https://github.com/yi-bai/ids/blob/267e3fb5d0a32de63128e67ef2f329277cc4013c/README.md

Official pinned dataset: https://github.com/yi-bai/ids/blob/267e3fb5d0a32de63128e67ef2f329277cc4013c/ids_lv0.txt

Official tree API: https://api.github.com/repos/yi-bai/ids/git/trees/267e3fb5d0a32de63128e67ef2f329277cc4013c

The pinned tree contains only LICENSE, README.md, ids_lv0.txt, ids_lv1.txt, ids_lv2.txt, and ts.txt. The README was retrieved through the official API at the pinned revision and checked against the previously fetched README. There is no additional grammar document in that tree. No third-party code was executed.

The README establishes that the first column is the character; the second contains primary sequences; the third contains alternative sequences. Semicolons separate entries within each of the latter columns. Trailing parenthesized comma-separated indicators identify variants. The README describes lv0 as retaining stroke distinctions, lv1 as merging stroke-level differences, and lv2 as additionally merging some UCV variants. These levels must not be treated as interchangeable.

Local authorized lv0 file SHA-256: `5dd94c9e02f7eab0f5dacb1005fc1010f2281ac6f0b101aefb51b2d99a10c43f`.

Corpus observations, not upstream semantic documentation:

- 102,033 records: 95,042 have two actual tab fields and 6,991 have three. Treat an absent third field as absent, not malformed; preserve absent versus explicitly empty if reconstructing exact text.
- The corpus contains all U+2FF0–U+2FFF operators, including newer unary forms. An implementation limited to the original twelve operators cannot claim full parsing coverage.
- Annotation characters occur in multiple contexts: leaf suffixes, bracket groups, brace groups, parenthetical stroke payloads, and trailing variant indicators. They are not globally removable punctuation.

## Unresolved semantics

The pinned README does NOT explain any of the following:

1. Whether `.` is a default glyph selector, a formal terminator, or something else when attached to a component.
2. The meanings or composition rules of Latin/digit suffixes, including multicharacter suffixes such as `dy`, `zs`, or `x1`. In particular, uppercase letters must not be assumed to be regional codes merely from their names.
3. The coordinate system, field count, empty-field meaning, or behavior of bracket parameters. `[l,l,.]` is present immediately after `⿻`, but the meanings of `l` and `.` are not documented in README. Other payloads include `[1:]`, `[:-1]`, `[_x,_x]`, `[,b_,_b]`, and `[1:|b]`. A parser cannot safely equate them or discard them as whitespace.
4. The exact meaning of brace annotations such as `{一}`, `{?0丗}`, and `{?2牜}`.
5. The `#(...)` stroke-expression grammar and meanings of letters, hyphens, numbers, and embedded annotated Unicode strokes within it.
6. The semantics or precedence of variants, even where indicators are explicitly recognized as variant labels. Source ordering is not proof of default selection or equal rendering.

Reading issue comments to resolve these meanings was rejected by auto-review because the assignment restricted research to official repository documents. No denied comments were fetched, and no alternate route was attempted. After the parent supplied scope clarification and transcript evidence, the same known-unexecuted read-only operation was retried once; auto-review again denied it because the provided user quotes did not explicitly expand the documentation-only scope. Comment research then stopped. The blocked action was read-only retrieval of comments from repository issues #1, #2, #6, and #11. Further comment research requires explicit expanded authorization; current semantics remain unresolved.

## Safe lossless grammar: lexical envelope, not a semantic IDS specification

Use a tokenizer and raw spans first. The following is a deliberately conservative importer envelope:

    record := key TAB primary [TAB alternative]
    column := entry (';' entry)*
    entry := opaque_body [variant_indicator]
    variant_indicator := '(' indicator_text ')'

The optional variant indicator is recognized ONLY as a trailing, balanced, top-level parenthesis group that is not the operand payload of `#`. Preserve its entire original spelling and comma-separated subfields without assigning meanings to individual indicator characters. Do not use a regex that deletes every parenthesized expression: `#(H)(.)` has a stroke payload `(H)` and a variant indicator `(.)`, whereas `#(S)` has only a stroke payload.

Before separating entries or suffixes, scan bracket, brace, and parenthesis boundaries with a balanced-group stack. Delimiters inside a group are retained as payload rather than interpreted as column/entry delimiters. Store unrecognized or unbalanced forms verbatim with an explicit diagnostic instead of repairing or discarding them. Retain source line, field role, entry ordinal, byte/codepoint spans, and raw record text so that unsupported constructs still round-trip.

A provisional annotated token stream can distinguish:

- IDC scalar (recognized Unicode operator, with separately verified operator arity).
- Non-ASCII scalar atom and a following opaque ASCII suffix span.
- Bracket group: exact raw payload, including every comma and empty field.
- Brace group: exact raw payload.
- Hash-parenthesis group: exact raw payload, parsed before any trailing indicator detection.
- Other/unknown token: exact raw span and diagnostic.

This is a storage/inspection representation, not a claim that all suffix spans attach to the preceding scalar under the authoritative language grammar. Only promote nodes to a semantic AST after the relevant interpretation is independently justified. Keep lexical and semantic status separate.

## Concrete regression fixtures

    丁<TAB>⿱一.亅
    包<TAB>⿻[l,l,.]勹巳.(.);⿻[l,l,.]勹己.(J);⿻[l,l,.]勹巳t(.t)
    一<TAB>#(H)(.);{一}#(T)(t)
    三<TAB>⿱一.二.<TAB>⿱二.一.
    丙<TAB>⿱一.内.(.);⿱一.内P(.n);⿱一.内z.(z.)<TAB>⿻𠆣d冂.(.);⿻𠆣.冂.(.n);⿻𠆣d冂z(z.)
    臦<TAB>⿰⿼コ⿳丨匚.丨臣(.);⿰⿾臣臣(m)

`<TAB>` in these illustrative fixtures denotes an actual tab. They demonstrate why deleting periods, letters, brackets, braces, or every parenthetical expression is not a valid import strategy.

## Projection contract

Maintain two distinct results:

1. **Lossless source import:** Every entry may be retained with primary/alternative role and annotation bytes intact, regardless of whether it can be rendered.
2. **Verified projection:** Emit a plain IDS only when all participating operator arities and leaf boundaries are verified and no unresolved construct is silently dropped or reinterpreted. Return explicit `unresolved_annotation` / `unsupported_stroke_expression` / `unsupported_operator` statuses otherwise. Keep provenance linking projected nodes to source spans.

A consciously lossy topology preview may be a separate opt-in output, clearly labeled as such; it is not a verified projection and must not be silently used for candidate equivalence, exact glyph synthesis, or source-coverage claims. For example, rendering `⿻勹巳` after removing `[l,l,.]` and suffixes from 包 is only a proposed approximation until parameter and selector meanings are established.

Do not merge entries because their stripped text happens to match. Do not promote alternatives to primaries, collapse variant labels, conflate lv0/lv1/lv2, or claim all source variants are visually equivalent. No authoritative dot/Latin or bracket-parameter semantics have been established by the documents available within this assignment's scope.
