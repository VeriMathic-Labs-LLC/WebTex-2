# WebTex-2 Code Review and Bug Investigation Todo

## Completed
- [x] Review main directory and source structure
  - Initial inspection of project layout and key files completed.

## In Progress
- [ ] Review all core JS files for bugs (in progress)
  
  ### src/latex-renderer.js
  1. **Missing capture groups** in `splitByLatexPatterns` for `\\[...\\]` and `\\(...\\)` → `part.content` becomes undefined.
  2. **Simplistic delimiter stripping** (`replace(/^^\$\$|\$\$$/)`) mis-handles nested or unmatched `$`/`$$`.
  3. **Brace cleanup** (`cleanupMalformedLatex`) appends closing braces indiscriminately, corrupting nested structures.
  4. **Performance**: dozens of regex passes per render without caching compiled patterns.
  5. **False positives**: symbol regexes lack word boundaries (e.g. `\\sum` matches in `\\summation`).
  6. **Limited LaTeX support**: no handling of fractions (`\\frac`), roots (`\\sqrt`), environments (`\\begin`/`\\end`), macros.
  7. **Silent failures**: inner errors are caught and only logged as warnings; no user feedback.

  ### src/domain-utils.js
  1. **Duplicate logic**: two `parts.length > 2` checks and oversimplified country-TLD handling.
  2. **IP/localhost regex** ignores ports and IPv6 addresses.
  3. **Redundant branches** in `domainMatches` for exact match.

  ### src/app.js
  1. **Undefined `safeRender`** called in `handleNavigation` and `enableRendering` → ReferenceError crash.
  2. **Brittle error filter**: relies on `event.filename.includes("app.js")`, misses minified or bundled errors.
  3. **Observer overload**: MutationObserver set on `characterData` + `subtree` floods on every DOM/text change.
  4. **incorrect selectors** in `disableRendering` (uses `.webtex-math-container` instead of actual processed classes).
  5. **XSS risk**: `decodeHTMLEntities` uses `innerHTML` on untrusted input without sanitization.
  6. **Memory leaks**: globals (`injectedStylesheets`, `observer`, `rendererState`, `webtexErrors`) never cleaned up.
  7. **Timezone mismatch**: log timestamp slicing uses UTC ISO string as if local.

## Pending Tasks
- [ ] Identify causes of occasional crashes
  - Example: missing `safeRender` ReferenceError.
- [ ] Assess and document current LaTeX handling capabilities and limitations
  - Create documentation of supported commands and known gaps.
- [ ] Suggest fixes for discovered issues and bugs
- [ ] Propose improvements for broader LaTeX support
  - E.g. implement `\\frac`, `\\sqrt`, environment parsing, macros.
- [ ] Add unit/integration tests (e.g. Jest) for parser and domain logic
- [ ] Consider migration to TypeScript for stronger type guarantees




4. Build, docs & testing
No unit/integration tests for any parser or domain logic.
No documentation listing supported LaTeX commands or known limitations.
Entire codebase is JavaScript; migrating to TypeScript would catch many of these errors at compile-time.

Recommended next steps
Fix 
safeRender
 (or point it to the existing render function).
Revise 
splitByLatexPatterns
 to use capturing groups:
js
/\$\$([\s\S]+?)\$\$/g,
/\$([\s\S]+?)\$/g,
/\\\[([\s\S]+?)\\\]/g,
/\\\(([\s\S]+?)\\\)/g
Add \b/lookarounds to symbol regexes to avoid over-matching.
Throttle or scope the MutationObserver to avoid flooding.
Enhance error reporting so users know which LaTeX failed and why.
Add a test suite (e.g. Jest) covering a broad variety of valid/invalid LaTeX.
Document supported commands and known gaps.
Consider migrating to TypeScript for stronger guarantees.
Let me know which of these you’d like to tackle first, or if you’d like me to start implementing any of the above fixes.