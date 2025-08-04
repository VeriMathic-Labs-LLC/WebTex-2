/*  src/app.js  – compiled → build/app.js
    Enhanced WebTeX with KaTeX + custom parser
*/
import katex from "katex";

// CSS injection management
let injectedStylesheets = [];

async function injectCSS() {
	if (injectedStylesheets.length > 0) return; // Already injected

	try {
		// Inject app.css
		const appStyle = document.createElement("style");
		appStyle.id = "webtex-app-styles";
		appStyle.textContent = `/* WebTeX Extension Styles - Scoped to extension elements only */

/* WebTeX Enhanced Styling with proper color inheritance */
.webtex-math-container {
	display: inline;
	color: inherit !important;
}

.webtex-math {
	display: inline-block;
	color: inherit !important;
}

.webtex-display {
	display: block;
	text-align: center;
	margin: 1em 0;
	color: inherit !important;
}

.webtex-inline-math {
	display: inline;
	vertical-align: middle;
	color: inherit !important;
}

.webtex-display-math {
	display: block;
	text-align: center;
	margin: 1em 0;
	color: inherit !important;
}

.webtex-processed {
	display: inline;
	color: inherit !important;
}

/* KaTeX styling that adapts to website color scheme */
.katex {
	color: inherit !important;
	font-size: 1.1em;
}

.katex-display {
	color: inherit !important;
	margin: 1em 0;
}

.katex .katex-html {
	color: inherit !important;
}

.katex .katex-mathml {
	color: inherit !important;
}

/* Ensure all KaTeX elements inherit color */
.katex,
.katex *,
.katex .katex-html *,
.katex .katex-mathml * {
	color: inherit !important;
}

/* Custom fallback styling */
.webtex-custom-fallback {
	font-family: "Computer Modern", "Times New Roman", serif, sans-serif;
	font-size: 1.1em;
	color: inherit !important;
	background: rgba(255, 235, 238, 0.3);
	padding: 2px 4px;
	border-radius: 3px;
	border: 1px solid rgba(239, 154, 154, 0.5);
	box-sizing: border-box;
}

/* Error fallback styling */
.webtex-error-fallback {
	font-family: "Courier New", "Monaco", monospace, sans-serif;
	font-size: 0.9em;
	color: inherit !important;
	background: rgba(255, 235, 238, 0.3);
	padding: 2px 4px;
	border-radius: 3px;
	border: 1px solid rgba(239, 154, 154, 0.5);
	margin: 0 2px;
	box-sizing: border-box;
}

/* Ensure all rendered elements inherit color */
.webtex-katex-rendered,
.webtex-custom-rendered {
	color: inherit !important;
}`;
		document.head.appendChild(appStyle);
		injectedStylesheets.push(appStyle);

		// Fetch and inject KaTeX CSS directly
		const katexCssUrl = chrome.runtime.getURL("katex/katex.min.css");
		const response = await fetch(katexCssUrl);
		const katexCssContent = await response.text();

		// Rewrite relative font paths to absolute extension URLs
		const baseFontPath = chrome.runtime.getURL("katex/fonts/");
		const fixedKatexCss = katexCssContent.replace(
			/url\((['"]?)fonts\//g,
			(_match, quote) => `url(${quote}${baseFontPath}`,
		);

		const katexStyle = document.createElement("style");
		katexStyle.id = "webtex-katex-styles";
		katexStyle.textContent =
			fixedKatexCss +
			`
/* WebTeX Font Path Fixes */
@font-face {
	font-family: 'KaTeX_Main';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Main-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Main-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Main-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Main';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Main-Bold.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Main-Bold.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Main-Bold.ttf")}') format('truetype');
	font-weight: bold;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Math';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Math-Italic.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Math-Italic.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Math-Italic.ttf")}') format('truetype');
	font-weight: normal;
	font-style: italic;
}
@font-face {
	font-family: 'KaTeX_AMS';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_AMS-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_AMS-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_AMS-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Caligraphic';
	src: url('${chrome.runtime.getURL(
		"katex/fonts/KaTeX_Caligraphic-Regular.woff2",
	)}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Caligraphic-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL(
					"katex/fonts/KaTeX_Caligraphic-Regular.ttf",
				)}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Fraktur';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Fraktur-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Fraktur-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Fraktur-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_SansSerif';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_SansSerif-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_SansSerif-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL(
					"katex/fonts/KaTeX_SansSerif-Regular.ttf",
				)}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Script';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Script-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Script-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Script-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Typewriter';
	src: url('${chrome.runtime.getURL(
		"katex/fonts/KaTeX_Typewriter-Regular.woff2",
	)}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Typewriter-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL(
					"katex/fonts/KaTeX_Typewriter-Regular.ttf",
				)}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Size1';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size1-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size1-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size1-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Size2';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size2-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size2-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size2-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Size3';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size3-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size3-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size3-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}
@font-face {
	font-family: 'KaTeX_Size4';
	src: url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size4-Regular.woff2")}') format('woff2'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size4-Regular.woff")}') format('woff'),
			 url('${chrome.runtime.getURL("katex/fonts/KaTeX_Size4-Regular.ttf")}') format('truetype');
	font-weight: normal;
	font-style: normal;
}`;
		document.head.appendChild(katexStyle);
		injectedStylesheets.push(katexStyle);
	} catch (_error) {
		// Fallback: inject minimal CSS
		const fallbackStyle = document.createElement("style");
		fallbackStyle.id = "webtex-fallback-styles";
		fallbackStyle.textContent = `
.katex { color: inherit !important; font-size: 1.1em; }
.katex-display { color: inherit !important; margin: 1em 0; }
.webtex-katex-rendered, .webtex-custom-rendered { color: inherit !important; }
`;
		document.head.appendChild(fallbackStyle);
		injectedStylesheets.push(fallbackStyle);
	}
}

function removeCSS() {
	injectedStylesheets.forEach((style) => {
		if (style.parentNode) {
			style.parentNode.removeChild(style);
		}
	});
	injectedStylesheets = [];
}

/* -------------------------------------------------- */
// Reusable entity decoder for performance
function decodeHTMLEntities(text) {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/* -------------------------------------------------- */
let observer = null;
let isEnabled = false;
const _katexLoaded = true; // KaTeX is bundled
const rendererState = {
	katexSuccess: 0,
	customParserFallback: 0,
	totalAttempts: 0,
};

// Expose renderer state globally for debugging
window.rendererState = rendererState;

// Collect KaTeX parse errors for debugging
window.webtexErrors = [];
function reportKaTeXError(tex, error) {
	const message = error?.message || (typeof error === "string" ? error : "Unknown KaTeX error");
	window.webtexErrors.push({ tex, message, time: Date.now() });
	console.warn("[WebTeX] KaTeX parse error:", message, "in", tex);

	// Dispatch a custom event for external listeners/devtools panels
	try {
		const evt = new CustomEvent("webtex-katex-error", { detail: { tex, message } });
		document.dispatchEvent(evt);
	} catch (_) {}
}

/* -------------------------------------------------- */
// Enhanced Custom LaTeX Parser for edge cases

function cleanupEmptyBraces(str) {
	str = str.replace(/\{\}\{\}\{\}\^/g, "^");
	str = str.replace(/\{\}\{\}\^/g, "^");
	str = str.replace(/\{\}\^/g, "^");
	str = str.replace(/\{\}\{\}(?!\^)/g, "");
	str = str.replace(/\{\}\{\}\{\}(?!\^)/g, "");
	str = str.replace(/\{\}\{\}\{\}\{\}(?!\^)/g, "");
	str = str.replace(/\{\}\{\}/g, "");
	str = str.replace(/\{\}(?!\^)/g, ""); // Remove single empty braces not followed by ^
	return str;
}

// --------------------------------------------------
// NEW SHARED HELPER: fixIncompleteCommands
// Centralises fixes for incomplete \text{} commands and malformed integral
// limits that were previously duplicated in multiple locations.
function fixIncompleteCommands(str) {
    // --- Incomplete \text{}
    // Replace standalone "\\text" at string end or followed by whitespace
    str = str.replace(/\\text(?=$|\s)/g, "\\text{}");

    // Replace "\\text" not followed by an opening brace
    str = str.replace(/\\text(?!\s*\{)/g, "\\text{}");

    // Replace "\\text{" that has no closing brace until end-of-string
    str = str.replace(/\\text\{[^}]*$/g, "\\text{}");

    // --- Malformed integrals (missing superscripts)
    // \int_{<sub>}^<nothing>
    str = str.replace(/\\int_\{([^}]+)\}\^\s*$/g, "\\int_{$1}^{}");

    // \int_{<sub>}^  <whitespace>
    str = str.replace(/\\int_\{([^}]+)\}\^\s+/g, "\\int_{$1}^{} ");

    // \int_{<sub>}^<token>   (token not wrapped in braces)
    str = str.replace(/\\int_\{([^}]+)\}\^(?!\s*\{)/g, "\\int_{$1}^{}");

    // Also handle variants without braces around subscript, e.g. \int_0^
    // Pattern allows either a LaTeX command (e.g., \\alpha) or bare token
    const SUBSCRIPT_TOKEN = "(?:\\\\[a-zA-Z]+|[^_\\\\\s{}]+)";
    const reSubNoBraceEnd = new RegExp(`\\\\int_${SUBSCRIPT_TOKEN}\\^\\s*$`, "g");
    const reSubNoBraceToken = new RegExp(`\\\\int_${SUBSCRIPT_TOKEN}\\^(?!\\s*\\{)`, "g");
    str = str.replace(reSubNoBraceEnd, (_m) => _m.replace(/\\int_/, "\\int_{").replace(/\^/, "}^{}"));
    str = str.replace(reSubNoBraceToken, (_m) => _m.replace(/\\int_/, "\\int_{").replace(/\^/, "}^{}"));

    // \int_0^{  (missing closing brace on superscript)
    const reSubMissingBrace = new RegExp(`\\\\int_${SUBSCRIPT_TOKEN}\\^\\{[^}]*$`, "g");
    str = str.replace(reSubMissingBrace, (_m) => {
        return _m.replace(/\\int_/, "\\int_{").replace(/\^\{[^}]*$/, "}^{}");
    });

    return str;
}
// --------------------------------------------------

class CustomLatexParser {
	constructor() {
		this.supportedEnvironments = [
			"matrix",
			"pmatrix",
			"bmatrix",
			"vmatrix",
			"Vmatrix",
			"array",
			"align",
			"aligned",
			"gather",
			"gathered",
			"cases",
			"split",
			"multline",
			"eqnarray",
		];
	}

	// Check if expression can be handled by custom parser
	canHandle(_tex) {
		// Always try the custom parser for ANY expression
		return true;
	}

	// Convert to simplified LaTeX that KaTeX can handle
	simplify(tex) {
		// Remove stray leading/trailing $ around environments (e.g. "$\\begin{pmatrix}")
		if (/^\$\\begin\{/.test(tex)) {
			tex = tex.replace(/^\$/, "");
		}
		if (/\\end\{[^}]+\}\$$/.test(tex)) {
			tex = tex.replace(/\$$/, "");
		}

		let simplified = tex;

		// First, fix any structural issues
		simplified = this.fixMalformedLatex(simplified);

		// Process fractions
		simplified = this.processFractionNotation(simplified);

		// Process nuclear notation BEFORE text processing
		simplified = this.processNuclearNotation(simplified);

		// Process environments
		simplified = this.processEquationEnvironments(simplified);
		simplified = this.processAlignEnvironment(simplified);

		// Process arrows and symbols
		simplified = this.processArrows(simplified);
		simplified = this.processLimits(simplified);
		simplified = this.processDerivatives(simplified);

		// Process text wrappers AFTER nuclear notation
		simplified = this.processTextWrappers(simplified);
		simplified = this.processTypoFixes(simplified);

		// Handle matrix environments
		simplified = simplified.replace(/\\begin\{matrix\}/g, "\\begin{array}");
		simplified = simplified.replace(/\\end\{matrix\}/g, "\\end{array}");

		return simplified;
	}

	getNextArgument(str, index) {
		let i = index;
		while (i < str.length && /\s/.test(str[i])) {
			i++; // Skip whitespace
		}
		if (i >= str.length) return null;

		const startIndex = i;
		const char = str[i];

		if (char === "{") {
			let braceCount = 1;
			let j = i + 1;
			while (j < str.length) {
				if (str[j] === "{" && str[j - 1] !== "\\") {
					braceCount++;
				} else if (str[j] === "}" && str[j - 1] !== "\\") {
					braceCount--;
				}
				if (braceCount === 0) {
					return { value: str.substring(i + 1, j), length: j + 1 - startIndex };
				}
				j++;
			}
			// Unmatched brace, return rest of string
			return { value: str.substring(i + 1), length: str.length - startIndex };
		}

		if (char === "\\") {
			const match = str.slice(i).match(/^\\[a-zA-Z]+(?=\s|{|}|\[|\(|\[|$)/);
			if (match) {
				return { value: match[0], length: match[0].length + (i - startIndex) };
			}
			// Escaped char
			return { value: str.slice(i, i + 2), length: 2 + (i - startIndex) };
		}

		// Single character
		return { value: char, length: 1 + (i - startIndex) };
	}

	fixMalformedLatex(str) {
		let fixed = "";
		let i = 0;
		while (i < str.length) {
			const char = str[i];

			if (char === "\\") {
				const commandMatch = str.slice(i).match(/^\\[a-zA-Z]+/);
				if (commandMatch) {
					const command = commandMatch[0];
					fixed += command;
					i += command.length;

					if (command === "\\frac") {
						const arg1Result = this.getNextArgument(str, i);
						if (arg1Result) {
							fixed += `{${arg1Result.value}}`;
							i += arg1Result.length;
							const arg2Result = this.getNextArgument(str, i);
							if (arg2Result) {
								fixed += `{${arg2Result.value}}`;
								i += arg2Result.length;
							} else {
								fixed += "{}";
							}
						} else {
							fixed += "{}";
						}
					}
				} else {
					fixed += char;
					i++;
				}
			} else if (char === "^" || char === "_") {
				fixed += char;
				i++;
				const argResult = this.getNextArgument(str, i);
				if (argResult) {
					fixed += `{${argResult.value}}`;
					i += argResult.length;
				} else {
					fixed += "{}";
				}
			} else {
				fixed += char;
				i++;
			}
		}

		// Final brace balancing pass
		let braceCount = 0;
		let finalResult = "";
		for (const char of fixed) {
			if (char === "{") {
				braceCount++;
			} else if (char === "}") {
				if (braceCount <= 0) continue; // Skip extra closing brace
				braceCount--;
			}
			finalResult += char;
		}
		if (braceCount > 0) {
			finalResult += "}".repeat(braceCount);
		}

		return finalResult;
	}

	processFractionNotation(str) {
		// First, protect existing \frac commands to avoid breaking them
		str = str.replace(/\\frac/g, "\\FRAC_TEMP");

		// Fix malformed fractions by ensuring they have two braced arguments
		str = str.replace(/\\FRAC_TEMP(?![{[])/g, (match, offset) => {
			const following = str.slice(offset + match.length);
			// Check for content that needs to be wrapped in braces
			const arg1Match = following.match(/^([^{[]|[\d\w]+)/);
			if (arg1Match) {
				const arg1 = arg1Match[0];
				const rest = following.slice(arg1.length);
				const arg2Match = rest.match(/^([^{[]|[\d\w]+)/);
				if (arg2Match) {
					const arg2 = arg2Match[0];
					return `\\FRAC_TEMP{${arg1}}{${arg2}}`;
				}
			}
			return match; // Return original if no fix is applied
		});

		// Fix missing braces around denominator like \frac{a}{b + c}d → wrap single token
		// But be careful not to break expressions with nested braces or superscripts
		str = str.replace(/\\FRAC_TEMP\{([^{}]+)\}([^{}\s])/g, (_m, num, following) => {
			// Only fix if the following character is not part of a superscript or subscript
			// and if the numerator doesn't end with a superscript/subscript
			if (!/[\^_]/.test(num.slice(-1)) && !/[\^_]/.test(following)) {
				return `\\FRAC_TEMP{${num}}{${following}}`;
			}
			return _m; // Return original if it might break superscripts/subscripts
		});

		// Handle incomplete fractions at the end of expressions
		str = str.replace(/\\FRAC_TEMP\{([^}]+)\}\{([^}]*)(?:\s*)$/g, "\\FRAC_TEMP{$1}{$2}");

		// Handle fractions with missing closing brace in numerator
		str = str.replace(/\\FRAC_TEMP\{([^}]*)(?:\s*)$/g, "\\FRAC_TEMP{$1}{}");

		// rac{num}{den} - convert rac to \frac
		str = str.replace(/rac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}");

		// rac27 pattern
		str = str.replace(/\brac(\d)(\d+)/g, (_, a, b) => `\\frac{${a}}{${b}}`);

		// standalone rac - convert to \frac
		str = str.replace(/\brac\b/g, "\\frac");

		// Fix fractions with double braces
		str = str.replace(/\\FRAC_TEMP\{\{([^}]+)\}\}\{\{([^}]+)\}\}/g, "\\FRAC_TEMP{$1}{$2}");

		// Fix malformed fractions with superscripts in numerator
		// Handle cases like \frac{\pi^{2}{6} -> \frac{\pi^{2}}{6}
		str = str.replace(/\\FRAC_TEMP\{([^}]*\^\{[^}]*\})\{([^}]*)\}/g, "\\FRAC_TEMP{$1}{$2}");

		// Fix fractions where the closing brace is missing after superscripts
		str = str.replace(/\\FRAC_TEMP\{([^}]*\^\{[^}]*\})\s*([^{}\s])/g, "\\FRAC_TEMP{$1}{$2}");

		// Finally, restore \frac commands
		str = str.replace(/\\FRAC_TEMP/g, "\\frac");

		return str;
	}

	processNuclearNotation(str) {
		// Enhanced nuclear notation processing with better error handling

		// First, clean up any existing malformed patterns
		str = cleanupEmptyBraces(str);

		// Handle specific nuclear notation patterns in \text{} commands
		// Pattern: \text{{}^{A}N} -> {}^{A}\text{N}
		str = str.replace(/\\text\{\{\}\^\{([^}]+)\}([^}]*)\}/g, "{}^{$1}\\text{$2}");

		// Pattern: \text{{}^{A}_{Z}N} -> {}^{A}_{Z}\text{N}
		str = str.replace(/\\text\{\{\}\^\{([^}]+)\}_\{([^}]+)\}([^}]*)\}/g, "{}^{$1}_{$2}\\text{$3}");

		// Pattern: \text{_Z^A X} -> {}^{A}_{Z}\text{X}
		str = str.replace(/\\text\{_(\d+)\^(\d+)\s+([^}]+)\}/g, "{}^{$2}_{$1}\\text{$3}");
		str = str.replace(/\\text\{_([A-Z])\^([A-Z])\s+([^}]+)\}/g, "{}^{$2}_{$1}\\text{$3}");

		// Pattern: \text{{Z-2}^{A-4} N'} -> {}^{A-4}_{Z-2}\text{N'}
		str = str.replace(/\\text\{\{([^}]+)\}\^\{([^}]+)\}\s+([^}]+)\}/g, "{}^{$2}_{$1}\\text{$3}");

		// Handle already formatted notation: ^{A}_{Z}\text{N} and ^{A}{Z}\text{N}
		str = str.replace(/\^\{([^}]+)\}_\{([^}]+)\}\\text\{([^}]+)\}/g, "{}^{$1}_{$2}\\text{$3}");
		str = str.replace(/\^\{([^}]+)\}\{([^}]+)\}\\text\{([^}]+)\}/g, "{}^{$1}_{$2}\\text{$3}");

		// e^- and e^+ patterns - both inside and outside \text{}
		str = str.replace(/\\text\{e\}\^([-+])/g, "e^{$1}");
		str = str.replace(/\\text\{e\}\^\{([-+])\}/g, "e^{$1}");
		str = str.replace(/\\text\{e\^([-+])\}/g, "e^{$1}");
		str = str.replace(/\\text\{e\^\{([-+])\}\}/g, "e^{$1}");

		// Neutrino and antineutrino patterns
		str = str.replace(/\\bar\{\\nu\}/g, "\\overline{\\nu}");

		// Handle overline nu patterns that might be malformed
		str = str.replace(/\\overline\{\\nu(.*?)\}/g, (match, rest) => {
			if (rest === "") return "\\overline{\\nu}";
			return match; // Keep as is if it has content
		});

		// Star notation for excited states
		str = str.replace(/\\text\{([^}]+)\*\}/g, "\\text{$1}^*");

		// Handle Z^A and _Z^A without \text{}
		str = str.replace(/([A-Z])\^([A-Z])\s+([A-Z])/g, "{}^{$2}\\text{$3}");
		str = str.replace(/_([A-Z])\^([A-Z])\s+([A-Z])/g, "{}^{$2}_{$1}\\text{$3}");

		// Fix common malformed nuclear notation patterns
		// Handle cases like {}^{A}\text{N} -> {}^{A}\text{N}
		str = str.replace(/\{\}\^\{([^}]+)\}\\text\{([^}]+)\}/g, "{}^{$1}\\text{$2}");

		// Handle cases like {}^{A}_{Z+1}\text{N'} + e^{-} + \overline{\nu}
		str = str.replace(/\{\}\^\{([^}]+)\}_\{([^}]+)\}\\text\{([^}]+)\}/g, "{}^{$1}_{$2}\\text{$3}");

		// Fix nuclear notation format: {^{A}} -> {}^{A}
		str = str.replace(/\{(\^\{[^}]+\})\}/g, "{$1}");

		// Fix nested \text commands in nuclear notation like: \text{^{A}\text{N}} -> {}^{A}\text{N}
		// This handles malformed input where superscript A and element N are both wrapped in \text{}
		// Multi-line, commented regex for maintainability
		const MALFORMED_NESTED_TEXT_PATTERN = new RegExp(
			[
				// Match \text{^{A}\text{N}}
				String.raw`\\text\{`, // Match literal \text{
				String.raw`\\\^\{([^}]+)\}`, // Match ^{A} (superscript), capture A
				String.raw`\\text\{([^}]*)\}`, // Match \text{N}, capture N
				String.raw`\}`, // Match closing }
			].join(""),
			"g",
		);
		str = str.replace(MALFORMED_NESTED_TEXT_PATTERN, "{}^{$1}\\text{$2}");

		// Handle nested form without escaped caret: \text{^{A}\text{N}} -> {}^{A}\text{N}
		str = str.replace(/\\text\{\^\{([^}]+)\}\\text\{([^}]+)\}\}/g, "{}^{$1}\\text{$2}");

		// Final cleanup using the helper method
		str = cleanupEmptyBraces(str);

		return str;
	}

	processEquationEnvironments(str) {
		return str.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, "$1");
	}

	processAlignEnvironment(str) {
		return str.replace(
			/\\begin\{align\}([\s\S]*?)\\end\{align\}/g,
			"\\begin{aligned}$1\\end{aligned}",
		);
	}

	processArrows(str) {
		str = str.replace(/\\to/g, "\\rightarrow");
		str = str.replace(/→/g, "\\rightarrow");
		return str;
	}

	processTextWrappers(str) {
		// Enhanced \text{} processing - avoid nesting \mathrm inside \text
		return str.replace(/\\text\{([^{}]+)\}/g, (_m, inner) => {
			// Special patterns that should be kept in \text{} as-is
			const keepPatterns = [
				/^[A-Z]'?$/, // Single uppercase letter possibly with prime (e.g., N, N')
				/^[a-z]'?$/, // Single lowercase letter possibly with prime
				/^(He|Li|Be|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca)$/, // Chemical elements
				/^e\^[+-]$/, // Electron/positron notation
				/^\w+['*]?$/, // Words with possible prime or star
			];

			// Check if we should keep \text{} as-is
			for (const pattern of keepPatterns) {
				if (pattern.test(inner)) {
					return `\\text{${inner}}`; // Keep as \text{} to avoid nesting issues
				}
			}

			// For simple math expressions, remove \text{} wrapper
			if (/^[A-Za-z0-9_+\-*/=().,\s]+$/.test(inner)) {
				return inner;
			}

			// For everything else, keep as \text{} to avoid nesting \mathrm inside \text
			return `\\text{${inner}}`;
		});
	}

	processTypoFixes(str) {
		// fix common typos like infty -> \infty
		str = str.replace(/\binfty\b/g, "\\infty");

		// Fix limit arrow typos: \to -> \rightarrow
		str = str.replace(/\\to\b/g, "\\rightarrow");

		// Fix missing braces in limits: \lim_{x o infty} -> \lim_{x \to \infty}
		str = str.replace(/\\lim_\{([^}]*)\s+o\s+infty\}/g, "\\lim_{$1 \\to \\infty}");

		// Delegate incomplete command and integral fixes to shared helper
		str = fixIncompleteCommands(str);

		// Auto-wrap bare ^ and _ arguments with braces
		str = str.replace(/(\^|_)(?![{\\])\s*([A-Za-z0-9+-])/g, "$1{$2}");

		// Fix unmatched braces in expressions
		str = this.fixUnmatchedBraces(str);
		str = cleanupEmptyBraces(str);

		return str;
	}

	fixUnmatchedBraces(str) {
		let result = str;
		let openCount = 0;
		const chars = result.split("");

		// Count and fix missing closing braces
		for (let i = 0; i < chars.length; i++) {
			if (chars[i] === "{") {
				openCount++;
			} else if (chars[i] === "}") {
				openCount--;
				// Handle extra closing braces
				if (openCount < 0) {
					openCount = 0; // Reset count but don't add the brace back
					chars[i] = ""; // Remove this brace
				}
			}
		}

		// Rebuild string without extra closing braces
		result = chars.filter((char) => char !== "").join("");

		// Add missing closing braces
		while (openCount > 0) {
			result += "}";
			openCount--;
		}

		// Return result without cleanup; cleanup (e.g., removing empty braces) is handled by cleanupEmptyBraces in processTypoFixes
		return result;
	}

	processDerivatives(str) {
		// Handle derivatives properly
		// Convert d/dx patterns
		str = str.replace(/\\frac\{d\}\{dx\}/g, "\\frac{\\mathrm{d}}{\\mathrm{d}x}");
		str = str.replace(
			/\\frac\\{\\mathrm\\{d\\}([^}]*)\\{\\mathrm\\{d\\}x/g,
			"\\frac{\\mathrm{d}}{\\mathrm{d}x}",
		);

		// Handle standalone d in derivatives (but not in other contexts)
		str = str.replace(/\b([dfgh])\(x\)/g, "$1(x)"); // Keep function names as-is
		str = str.replace(/\bd([xy])/g, "\\mathrm{d}$1"); // Convert dx, dy to \mathrm{d}x
		str = str.replace(/([dfgh])'\(x\)/g, "$1'(x)"); // Keep derivative notation

		return str;
	}

	processLimits(str) {
		// Fix "lim_{x o infty}" -> "lim_{x \to \infty}"
		str = str.replace(/lim_\{([^}]+)\s+o\s+([^}]+)\}/g, "\\lim_{$1 \\to $2}");
		// Fix standalone "lim" -> "\lim"
		str = str.replace(/\blim\b/g, "\\lim");
		return str;
	}

	// Create a simple fallback rendering
	renderFallback(tex, displayMode = false) {
		const container = document.createElement("span");
		container.className = "webtex-custom-fallback";
		container.style.cssText = `
      display: ${displayMode ? "block" : "inline-block"};
      font-family: 'Computer Modern', serif;
      font-size: 1.1em;
      color: inherit;
      background: rgba(255, 235, 238, 0.3);
      padding: 2px 4px;
      border-radius: 3px;
      border: 1px solid rgba(239, 154, 154, 0.5);
    `;
		container.textContent = tex;
		return container;
	}
}

const customParser = new CustomLatexParser();

/* -------------------------------------------------- */
// Enhanced delimiter balance check with LaTeX-specific handling
function hasUnbalancedDelimiters(str) {
	// Skip empty or very short strings
	if (!str || str.length < 2) return false;

	const stack = [];
	const pairs = {
		"(": ")",
		"[": "]",
		"{": "}",
		"\\left(": "\\right)",
		"\\left[": "\\right]",
		"\\left\\{": "\\right\\}",
		"\\left.": "\\right.",
		"\\left|": "\\right|",
		"\\left\\|": "\\right\\|",
		"\\left\\lfloor": "\\right\\rfloor",
		"\\left\\lceil": "\\right\\rceil",
		"\\left\\langle": "\\right\\rangle",
	};

	// Skip LaTeX commands and environments that might look like delimiters
	const skipPatterns = [
		/^\\(?:begin|end)\{/, // \\begin{...} or \\end{...}
		/^\\[a-zA-Z]+/, // Any LaTeX command
	];

	// Skip over LaTeX commands and environments
	const shouldSkip = (s, i) => {
		if (s[i] !== "\\") return false;
		return skipPatterns.some((pattern) => {
			pattern.lastIndex = i;
			return pattern.test(s);
		});
	};

	// Check for \\left and \\right commands
	const isLeftRightPair = (left, right) => {
		if (left.startsWith("\\left") && right.startsWith("\\right")) {
			const leftType = left.slice(5);
			const rightType = right.slice(6);

			// Handle special cases like \\left. and \\right.
			if (leftType === "." || rightType === ".") return true;

			// Check if they match (e.g., \\left( with \\right))
			const leftChar = leftType[0];
			const rightChar = rightType[0];

			return (
				leftChar === rightChar ||
				(leftChar === "(" && rightChar === ")") ||
				(leftChar === "[" && rightChar === "]") ||
				(leftChar === "{" && rightChar === "}") ||
				(leftChar === "<" && rightChar === ">")
			);
		}
		return false;
	};

	// Main scanning loop
	for (let i = 0; i < str.length; i++) {
		// Skip LaTeX commands and environments
		if (shouldSkip(str, i)) {
			// Skip to the end of the command
			while (i < str.length && /[a-zA-Z]/.test(str[i + 1])) i++;
			continue;
		}

		const char = str[i];

		// Check for \\left command
		if (str.startsWith("\\left", i)) {
			// Find the complete \\left command
			let commandEnd = i + 5; // length of '\\left'

			// Handle delimiter specified by a command, e.g., \left\{
			if (commandEnd < str.length && str[commandEnd] === "\\") {
				let cmdWordEnd = commandEnd + 1;
				while (cmdWordEnd < str.length && str[cmdWordEnd].match(/[a-zA-Z]/)) {
					cmdWordEnd++;
				}
				// If it's a command like \{, the command is the delimiter
				if (cmdWordEnd > commandEnd + 1) {
					commandEnd = cmdWordEnd;
				} else {
					// It's a single character escaped, like \|
					commandEnd++;
				}
			} else if (commandEnd < str.length && "([{.| ".includes(str[commandEnd])) {
				// Handle single character delimiters like (, [, {, |, .
				commandEnd++;
			}
			const fullCommand = str.substring(i, commandEnd);
			stack.push(fullCommand);
			i = commandEnd - 1; // -1 because the loop will increment
			continue;
		}

		// Check for \\right command
		if (str.startsWith("\\right", i)) {
			// Find the complete \\right command
			let commandEnd = i + 6; // length of '\\right'

			// Handle delimiter specified by a command, e.g., \right\}
			if (commandEnd < str.length && str[commandEnd] === "\\") {
				let cmdWordEnd = commandEnd + 1;
				while (cmdWordEnd < str.length && str[cmdWordEnd].match(/[a-zA-Z]/)) {
					cmdWordEnd++;
				}
				// If it's a command like \}, the command is the delimiter
				if (cmdWordEnd > commandEnd + 1) {
					commandEnd = cmdWordEnd;
				} else {
					// It's a single character escaped, like \|
					commandEnd++;
				}
			} else if (commandEnd < str.length && ")]}.| ".includes(str[commandEnd])) {
				// Handle single character delimiters like ), ], }, |, .
				commandEnd++;
			}

			const fullCommand = str.substring(i, commandEnd);

			if (stack.length === 0 || !isLeftRightPair(stack[stack.length - 1], fullCommand)) {
				// Warn in console when unmatched delimiter is detected, but avoid using console.log
				console.warn(`Unmatched delimiter: ${fullCommand}`);
				return true; // Unmatched \\right
			}
			stack.pop();
			i = commandEnd - 1; // -1 because the loop will increment
			continue;
		}

		// Handle regular delimiters
		if (pairs[char]) {
			stack.push(char);
		} else if (char === ")" || char === "]" || char === "}") {
			if (stack.length === 0 || pairs[stack.pop()] !== char) {
				return true; // Unmatched closing delimiter
			}
		}
	}

	// Check for unclosed environments
	const envStack = [];
	const envRegex = /\\(begin|end)\s*\{([^}]*)\}/g;
	let match;

	while ((match = envRegex.exec(str)) !== null) {
		const [_, type, name] = match;
		if (type === "begin") {
			envStack.push(name);
		} else if (type === "end") {
			if (envStack.length === 0 || envStack[envStack.length - 1] !== name) {
				return true; // Unmatched \\end
			}
			envStack.pop();
		}
	}

	// If we get here, check if all delimiters and environments are closed
	return stack.length > 0 || envStack.length > 0;
}

/* -------------------------------------------------- */
// Enhanced rendering function with better error handling and fallback logic
async function renderMathExpression(tex, displayMode = false, element = null) {
	rendererState.totalAttempts++;

	// Skip empty or whitespace-only input
	if (!tex || !tex.trim()) {
		if (element) {
			element.textContent = tex || "";
		}
		return { success: false, method: "empty", element };
	}

	// Clean up the input
	let cleanedTex = tex.trim();

	// Clean up multiple consecutive empty braces that cause delimiter balance issues
	cleanedTex = cleanupEmptyBraces(cleanedTex);

	// Handle display mode delimiters
	const isDisplayMath =
		displayMode ||
		(cleanedTex.startsWith("$$") && cleanedTex.endsWith("$$")) ||
		(cleanedTex.startsWith("\\[") && cleanedTex.endsWith("\\]"));

	// Remove delimiters for processing
	if (isDisplayMath) {
		cleanedTex = cleanedTex
			.replace(/^\$\$|\$\$$/g, "")
			.replace(/^\\\[|\\\]$/g, "")
			.trim();
	}

	// Handle common LaTeX newline issues
	// In display mode, \ or \newline do nothing, so we remove them to avoid warnings
	if (isDisplayMath) {
		cleanedTex = cleanedTex.replace(/\\\\(?:\s*\n?)?/g, " ");
		cleanedTex = cleanedTex.replace(/\\newline(?:\s*\n?)?/g, " ");
	} else {
		// In inline mode, replace with actual line breaks
		cleanedTex = cleanedTex.replace(/\\(?:newline|\\)\s*\n?/g, "\\\\");
	}

	// Pre-fix common malformed patterns before any processing
	let prefixedTex = cleanedTex;

	// Debug: log expressions that match our problematic patterns
	if (prefixedTex.includes("\\text") && !prefixedTex.includes("\\text{")) {
		console.log("[WebTeX Debug] Fixing incomplete \\text command in:", prefixedTex);
	}
	if (prefixedTex.match(/\\int_\{[^}]+\}\^(?!\{)/)) {
		console.log("[WebTeX Debug] Fixing malformed integral in:", prefixedTex);
	}

	// Apply shared fixes for incomplete commands and malformed integrals
	prefixedTex = fixIncompleteCommands(prefixedTex);

	// Debug: log the result after fixes
	if (cleanedTex !== prefixedTex) {
		console.log("[WebTeX Debug] Fixed expression from:", cleanedTex, "to:", prefixedTex);
	}

	// Fix unmatched braces before checking balance
	if (customParser && typeof customParser.fixUnmatchedBraces === "function") {
		prefixedTex = customParser.fixUnmatchedBraces(prefixedTex);
		prefixedTex = cleanupEmptyBraces(prefixedTex);
	}

	// Check for unbalanced delimiters with more detailed reporting
	if (hasUnbalancedDelimiters(prefixedTex)) {
		console.warn(`Unbalanced delimiters in: ${prefixedTex}`);
		if (element) {
			const fb = customParser.renderFallback(tex, isDisplayMath);
			element.innerHTML = "";
			element.appendChild(fb);
			element.classList.add("webtex-error-fallback");
			element.title = "Unbalanced delimiters";
		}
		return { success: false, method: "unbalanced", element };
	}

	// Try KaTeX first with the original text
	try {
		// Preprocess with custom parser
		let processedTex = prefixedTex;
		if (customParser.canHandle(prefixedTex)) {
			try {
				processedTex = customParser.simplify(prefixedTex);
			} catch (simplifyError) {
				console.warn("Error in custom parser simplification:", simplifyError);
				// Continue with original text if simplification fails
			}
		}

		// Handle Unicode characters
		processedTex = handleUnicodeInMath(processedTex);

		// Configure KaTeX options
		const katexOptions = {
			displayMode: isDisplayMath,
			errorColor: "inherit",
			strict: (errorCode) => {
				// Handle specific error codes to reduce warnings
				if (errorCode === "newLineInDisplayMode") {
					// In display mode, newlines are ignored, so we can safely ignore this warning
					return "ignore";
				}
				// For other errors, warn but continue
				return "warn";
			},
			trust: (context) => {
				// Allow common commands that need trust
				const trustedCommands = [
					"\\href",
					"\\url",
					"\\includegraphics",
					"\\htmlId",
					"\\htmlClass",
					"\\htmlData",
					"\\htmlStyle",
					"\\class",
					"\\id",
					"\\data",
					"\\style",
				];
				if (trustedCommands.includes(context.command)) {
					return true;
				}
				// Allow specific protocols in URLs
				if (["href", "url", "includegraphics"].includes(context.command)) {
					const safeProtocols = ["http", "https", "data", "mailto", "ftp"];
					return safeProtocols.some((proto) => context.url.startsWith(proto));
				}
				return false;
			},
			macros: {
				"\\RR": "\\mathbb{R}",
				"\\NN": "\\mathbb{N}",
				"\\ZZ": "\\mathbb{Z}",
				"\\QQ": "\\mathbb{Q}",
				"\\CC": "\\mathbb{C}",
				"\\half": "\\frac{1}{2}",
				"\\quarter": "\\frac{1}{4}",
				"\\third": "\\frac{1}{3}",
				"\\twothirds": "\\frac{2}{3}",
				"\\threequarters": "\\frac{3}{4}",
				"\\to": "\\rightarrow",
				"\\rac": "\\frac",
				"\\qed": "\\quad \\blacksquare",
				"\\abs": "\\left|#1\\right|",
				"\\norm": "\\left\\|#1\\right\\|",
				"\\set": "\\left\\{#1\\right\\}",
				"\\paren": "\\left(#1\\right)",
				"\\brack": "\\left[#1\\right]",
				"\\eval": "\\left.#1\\right|_{#2}",
			},
			maxSize: 1000,
			maxExpand: 1000,
			maxCharacterCount: 10000,
			throwOnError: true,
		};

		// Try rendering with KaTeX
		const rendered = katex.renderToString(processedTex, katexOptions);
		rendererState.katexSuccess++;

		if (element) {
			element.innerHTML = rendered;
			element.classList.add("webtex-katex-rendered");
		}

		return { success: true, method: "katex", element };
	} catch (katexError) {
		console.warn("KaTeX rendering failed, falling back to custom parser:", katexError);
		reportKaTeXError(tex, katexError);

		// Check if this is an invalid command error
		const isInvalidCommand =
			katexError.message &&
			/undefined control sequence|can't use function|unknown function|invalid\s*command/i.test(
				katexError.message,
			);

		// Try custom parser as fallback
		try {
			const simplified = customParser.simplify(cleanedTex);
			const processedSimplified = handleUnicodeInMath(simplified);

			// Use KaTeX in non-strict mode for the fallback
			const rendered = katex.renderToString(processedSimplified, {
				displayMode: isDisplayMath,
				throwOnError: false,
				errorColor: "inherit",
				strict: false,
				trust: true,
			});

			if (element) {
				element.innerHTML = rendered;
				element.classList.add("webtex-custom-rendered");
			}

			rendererState.customParserFallback++;
			return { success: true, method: "custom", element };
		} catch (customError) {
			console.warn("Custom parser fallback failed:", customError);

			// Final fallback - show original text with error styling
			if (element) {
				const fallbackElement = customParser.renderFallback(tex, isDisplayMath);
				element.innerHTML = "";
				element.appendChild(fallbackElement);
				element.classList.add("webtex-error-fallback");

				// Provide more specific error information
				let errorMessage = "Rendering failed";
				if (isInvalidCommand) {
					errorMessage = "Invalid LaTeX command";
				} else if (customError.message) {
					errorMessage = customError.message;
				}
				element.title = errorMessage;
			}

			return { success: false, method: "error", element, error: customError };
		}
	}
}

/* -------------------------------------------------- */
// Enhanced math detection and processing
function findMathExpressions(root) {
	const mathExpressions = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) => {
			// Skip if parent is already processed or should be ignored
			if (
				node.parentElement &&
				(node.parentElement.classList.contains("webtex-processed") ||
					node.parentElement.classList.contains("webtex-ignore") ||
					node.parentElement.closest(".webtex-ignore"))
			) {
				return NodeFilter.FILTER_REJECT;
			}
			return NodeFilter.FILTER_ACCEPT;
		},
	});

	let node;
	while ((node = walker.nextNode())) {
		const text = node.textContent;

		// Enhanced regex patterns for math detection
		const patterns = [
			// Display math
			{ pattern: /\$\$([\s\S]*?)\$\$/g, display: true },
			{ pattern: /\\\[([\s\S]*?)\\\]/g, display: true },
			// Inline math
			{ pattern: /\$([^$\n]+?)\$/g, display: false },
			{ pattern: /\\\(([\s\S]*?)\\\)/g, display: false },
		];

		patterns.forEach(({ pattern, display }) => {
			let match = pattern.exec(text);
			while (match !== null) {
				const tex = decodeHTMLEntities(match[1].trim());
				if (tex) {
					mathExpressions.push({
						tex: tex,
						display: display,
						node: node,
						match: match[0],
						start: match.index,
						end: match.index + match[0].length,
					});
				}
				match = pattern.exec(text);
			}
		});
	}

	return mathExpressions;
}

/* -------------------------------------------------- */
// Process math expressions with intelligent fallback
async function processMathExpressions(expressions) {
	const processedNodes = new Set();

	for (const expr of expressions) {
		if (processedNodes.has(expr.node)) continue;

		// Check if node still exists and has a parent
		if (!expr.node || !expr.node.parentNode) {
			continue;
		}

		const text = expr.node.textContent;
		const container = document.createElement("span");
		container.className = "webtex-math-container";

		// Replace the math expression with a container
		const before = text.substring(0, expr.start);
		const after = text.substring(expr.end);

		if (before) {
			container.appendChild(document.createTextNode(before));
		}

		const mathElement = document.createElement("span");
		mathElement.className = `webtex-math ${expr.display ? "webtex-display" : "webtex-inline"}`;

		const result = await renderMathExpression(expr.tex, expr.display, mathElement);

		if (result.success) {
			// Store original text for potential restoration
			mathElement.dataset.originalText = expr.match;
			container.appendChild(mathElement);
		} else {
			// Keep original text if all renderers failed
			const textNode = document.createTextNode(expr.match);
			textNode.dataset = { originalText: expr.match };
			container.appendChild(textNode);
		}

		if (after) {
			container.appendChild(document.createTextNode(after));
		}

		// Double-check parent exists before replacing
		if (expr.node.parentNode) {
			expr.node.parentNode.replaceChild(container, expr.node);
			processedNodes.add(expr.node);
		}
	}
}

/* -------------------------------------------------- */
// Enhanced preprocessing with Unicode handling
function preprocessMathText(node) {
	if (!node || !node.childNodes) return;

	node.childNodes.forEach((child) => {
		if (child.nodeType === 3) {
			// Text node
			let text = child.textContent;
			text = decodeHTMLEntities(text);
			// Normalize nuclear notation sequences so KaTeX can parse them
			text = customParser.processNuclearNotation(text);

			// Enhanced environment handling
			text = text.replace(
				/\$\s*\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}\s*\$/g,
				(_m, env, content) => {
					const decodedContent = decodeHTMLEntities(content);
					return `$$\\begin{${env}}${decodedContent}\\end{${env}}$$`;
				},
			);

			child.textContent = text;
		} else if (
			child.nodeType === 1 &&
			![
				"SCRIPT",
				"STYLE",
				"TEXTAREA",
				"PRE",
				"CODE",
				"NOSCRIPT",
				"INPUT",
				"SELECT",
				"BUTTON",
			].includes(child.tagName)
		) {
			preprocessMathText(child);
		}
	});
}

// Function to handle Unicode characters in math expressions
function handleUnicodeInMath(tex) {
	// Common Unicode fractions
	const unicodeFractions = {
		"½": "\\frac{1}{2}",
		"⅓": "\\frac{1}{3}",
		"⅔": "\\frac{2}{3}",
		"¼": "\\frac{1}{4}",
		"¾": "\\frac{3}{4}",
		"⅕": "\\frac{1}{5}",
		"⅖": "\\frac{2}{5}",
		"⅗": "\\frac{3}{5}",
		"⅘": "\\frac{4}{5}",
		"⅙": "\\frac{1}{6}",
		"⅚": "\\frac{5}{6}",
		"⅐": "\\frac{1}{7}",
		"⅛": "\\frac{1}{8}",
		"⅜": "\\frac{3}{8}",
		"⅝": "\\frac{5}{8}",
		"⅞": "\\frac{7}{8}",
		"⅑": "\\frac{1}{9}",
		"⅒": "\\frac{1}{10}",
	};

	let processed = tex;

	// Replace Unicode fractions with LaTeX fractions
	Object.entries(unicodeFractions).forEach(([unicode, latex]) => {
		processed = processed.replace(new RegExp(unicode, "g"), latex);
	});

	// Common Unicode math symbols
	processed = processed.replace(/→/g, "\\rightarrow");
	processed = processed.replace(/∈/g, "\\in");
	processed = processed.replace(/⊆/g, "\\subseteq");
	processed = processed.replace(/ν/g, "\\nu");
	processed = processed.replace(/γ/g, "\\gamma");

	// Handle other Unicode characters by wrapping them in \text{}
	// This regex matches Unicode characters that are not already in \text{} or other commands
	processed = processed.replace(/([^ -~])/g, (_match, char) => {
		// Skip if already in \text{} or other commands
		if (
			processed.includes(`\\text{${char}}`) ||
			processed.includes(`\\mathrm{${char}}`) ||
			processed.includes(`\\mathit{${char}}`)
		) {
			return char;
		}
		return `\\text{${char}}`;
	});

	return processed;
}

/* -------------------------------------------------- */
// Main rendering function
async function safeRender(root = document.body) {
	if (!isEnabled) return;

	try {
		preprocessMathText(root);

		const expressions = findMathExpressions(root);
		if (expressions.length > 0) {
			await processMathExpressions(expressions);
		}
	} catch (_e) {}
}

/* -------------------------------------------------- */
// Main initialization
(async function main() {
	const { allowedDomains = [] } = await chrome.storage.local.get("allowedDomains");

	const isLocalFile = location.protocol === "file:";
	const isDomainAllowed = allowedDomains.includes(location.hostname);
	const isTestFile = location.pathname.includes("test-comprehensive.html");

	// Enable on local files, allowed domains, or test files
	isEnabled =
		isLocalFile || isDomainAllowed || isTestFile || location.pathname.includes("test-simple.html");

	if (isEnabled) {
		await enableRendering();
	}

	// Listen for domain updates with better response handling
	chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
		if (msg.action === "domain-updated" && msg.allowed) {
			const newIsEnabled = location.protocol === "file:" || msg.allowed.includes(location.hostname);

			if (newIsEnabled && !isEnabled) {
				isEnabled = true;
				await enableRendering();
				setupNavigationHandlers();
			} else if (!newIsEnabled && isEnabled) {
				isEnabled = false;
				disableRendering();
			}

			// Always send response
			sendResponse({ success: true, enabled: isEnabled });
		}

		return true; // Keep message channel open for async response
	});

	setupNavigationHandlers();
})();

/* -------------------------------------------------- */
// Navigation and observer setup
let navigationHandlersSetup = false;

function setupNavigationHandlers() {
	if (!isEnabled || navigationHandlersSetup) return;

	navigationHandlersSetup = true;
	let lastUrl = location.href;

	const debouncedNavigationHandler = debounce(handleNavigation, 100);

	const navigationObserver = new MutationObserver(() => {
		if (location.href !== lastUrl) {
			lastUrl = location.href;
			debouncedNavigationHandler();
		}
	});

	navigationObserver.observe(document.body, { childList: true, subtree: true });
	window.addEventListener("popstate", debouncedNavigationHandler);
}

function handleNavigation() {
	if (!isEnabled) return;
	safeRender();
}

async function enableRendering() {
	await injectCSS(); // Inject styles when enabling
	safeRender();

	observer = new MutationObserver(
		debounce((muts) => {
			if (mutationsOnlyRipple(muts) || userIsSelectingText() || typingInsideActiveElement(muts)) {
				return;
			}

			muts;
			muts.forEach((m) => {
				// Process the mutation target itself (covers character data changes)
				safeRender(m.target);

				// Handle added nodes (elements OR text)
				m.addedNodes.forEach((n) => {
					if (n.nodeType === 3) {
						// Text node – re-render its parent
						safeRender(n.parentNode || document.body);
					} else if (n.nodeType === 1 && !n.closest(".webtex-ignore")) {
						safeRender(n);
					}
				});
			});
		}, 200),
	);

	observer.observe(document.body, { childList: true, subtree: true });
}

function disableRendering() {
	if (observer) {
		observer.disconnect();
		observer = null;
	}

	// Restore original DOM structure completely
	document.querySelectorAll(".webtex-math-container").forEach((container) => {
		// Find all original text nodes and math elements within
		const textParts = [];
		container.childNodes.forEach((node) => {
			if (node.nodeType === 3) {
				// Text node
				textParts.push(node.textContent);
			} else if (node.dataset?.originalText) {
				textParts.push(node.dataset.originalText);
			} else {
				textParts.push(node.textContent || "");
			}
		});

		// Replace container with original text node
		const originalText = textParts.join("");
		const textNode = document.createTextNode(originalText);
		if (container.parentNode) {
			container.parentNode.replaceChild(textNode, container);
		}
	});

	// Clean up any remaining WebTeX elements
	document
		.querySelectorAll(
			".webtex-katex-rendered, .webtex-custom-rendered, .webtex-math, .webtex-display, .webtex-inline, .webtex-error-fallback, .webtex-custom-fallback",
		)
		.forEach((el) => {
			if (el.dataset.originalText) {
				const textNode = document.createTextNode(el.dataset.originalText);
				if (el.parentNode) {
					el.parentNode.replaceChild(textNode, el);
				}
			} else {
				el.remove();
			}
		});

	removeCSS(); // Remove injected styles
}

/* -------------------------------------------------- */
// Helper functions
function nodeIsEditable(n) {
	if (n.getAttribute && n.getAttribute("contenteditable") === "false") return false;
	return n.isContentEditable || (n.nodeType === 1 && /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName));
}

function typingInsideActiveElement(muts) {
	const active = document.activeElement;
	if (!active || !nodeIsEditable(active)) return false;
	return muts.every((m) => active.contains(m.target));
}

function userIsSelectingText() {
	const sel = document.getSelection();
	return sel && sel.rangeCount > 0 && !sel.isCollapsed;
}

function isRippleNode(n) {
	return (
		n.nodeType === 1 &&
		n.classList &&
		(n.classList.contains("mat-ripple") ||
			n.classList.contains("mdc-button__ripple") ||
			n.classList.contains("mat-focus-indicator"))
	);
}

function mutationsOnlyRipple(muts) {
	return muts.every((m) => [...m.addedNodes, ...m.removedNodes].every(isRippleNode));
}

function debounce(fn, ms) {
	let t;
	return (...a) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...a), ms);
	};
}
