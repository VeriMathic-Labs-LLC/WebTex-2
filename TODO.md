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



Delimiter-stripping is too simplistic
js
html = html.replace(/^\$\$|\$\$$/g,"").replace(/^\$|\$$/g,"");
Strips only the first or last $$/$, can mis-handle odd counts or nested delimiters.
Leads to off-by-one removals.
Unbalanced-brace “fix” can corrupt nesting
cleanupMalformedLatex
 simply counts {/} and appends } at end. For deeply nested or interleaved {} this can produce invalid structure instead of surfacing the error.
Regex‐heavy conversions on every render
processComplexExpressions
 + 
processBasicSymbols
 run 100s of regex passes per render → slow on large documents.
No caching of compiled regex or conversion map.
No word-boundaries on symbol replacements
Converting /\\sum/g will also rewrite \summation, etc. → false positives.
Minimal LaTeX support
No handling of \frac, \sqrt, \begin{…}/\end{…}, user macros, accents outside a handful, etc.
No environment parsing or nested math.
Error handling is too coarse
Top-level try/catch in 
renderLatex
 & 
renderAllLatex
 simply falls back to plaintext.
Inner errors are swallowed with console.warn → silent failures.
2. src/domain-utils.js
Redundant and oversimplified logic
Two parts.length > 2 checks in normalization.
The “country-tld” array logic applies to all 3+ part domains, even if subdomain isn’t common.
IP and localhost handling
IPv4 regex ^\d+\.\d+\.\d+\.\d+$ won’t catch ports (:8080) or IPv6.
domainMatches
 duplicates exact-match check
Clean up to one branch.
3. src/app.js
safeRender
 is never defined
js
await safeRender();  // ReferenceError → app crashes on load
Likely the single biggest crash cause.
Global error handler filter is brittle
Checks event.filename.includes("app.js")—won’t catch errors in minified/bundled names.
MutationObserver overload
Observes characterData + subtree on body → floods on every DOM/text change. Debounce helps, but still risky on large sites.
disableRendering
 targets the wrong selector
Queries .webtex-math-container but all renders use .webtex-processed, .webtex-inline-math, etc. → original text never restored.
decodeHTMLEntities
 XSS risk
Setting textarea.innerHTML = text without sanitization can execute <script> if present.
Memory leaks & globals
injectedStylesheets, observer, rendererState, webtexErrors never fully cleaned up if 
disableRendering
 isn’t called.
Timezone mismatch in logs
Uses toISOString() (UTC) but slices as if local time.
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