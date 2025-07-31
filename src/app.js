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

/* -------------------------------------------------- */
// Enhanced Custom LaTeX Parser for edge cases
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

	fixMalformedLatex(str) {
		// Fix common malformed patterns

		// Fix unclosed braces in fractions
		let braceCount = 0;
		let _inFrac = false;
		let result = "";

		for (let i = 0; i < str.length; i++) {
			const char = str[i];
			result += char;

			if (str.substr(i, 5) === "\\frac") {
				_inFrac = true;
			}

			if (char === "{") {
				braceCount++;
			} else if (char === "}") {
				braceCount--;
				if (braceCount < 0) {
					// Extra closing brace, remove it
					result = result.slice(0, -1);
					braceCount = 0;
				}
			}
		}

		// Add missing closing braces
		if (braceCount > 0) {
			result += "}".repeat(braceCount);
		}

		return result;
	}

	processFractionNotation(str) {
		// First fix any malformed nested fractions
		// Fix: \frac{\frac{1}{2} + \frac{1}{3}{\frac{1}{4} + \frac{1}{5}
		// This regex looks for \frac patterns with missing closing braces
		str = str.replace(
			/\\frac\{([^{}]+(?:\{[^{}]+\}[^{}]*)*)\}\{([^{}]+(?:\{[^{}]+\}[^{}]*)*)\b(?!\})/g,
			(_match, num, den) => {
				// Count braces in denominator
				const openCount = (den.match(/\{/g) || []).length;
				const closeCount = (den.match(/\}/g) || []).length;
				if (openCount > closeCount) {
					// Add missing closing braces
					den += "}}".repeat(openCount - closeCount);
				}
				return `\\frac{${num}}{${den}}`;
			},
		);

		// rac{num}{den}
		str = str.replace(/(?:\\f?rac|rac)\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}");
		// rac27 pattern
		str = str.replace(/\brac(\d)(\d+)/g, (_, a, b) => `\\frac{${a}}{${b}}`);
		// standalone rac
		str = str.replace(/\brac\b/g, "\\frac");
		return str;
	}

	processNuclearNotation(str) {
		// Enhanced nuclear notation processing

		// Handle \text{{}^{A}N} patterns - remove \text wrapper for nuclear notation
		str = str.replace(
			/\\text\{(\{\})?(\^\{[^}]+\})?(_\{[^}]+\})?([^}]*)\}/g,
			(match, empty, sup, sub, rest) => {
				if (sup || sub) {
					// This is nuclear notation inside \text{}, extract it
					return `${empty || ""}${sup || ""}${sub || ""}\\text{${rest.trim()}}`;
				}
				return match;
			},
		);

		// Basic nuclear notation: \text{_Z^A X} -> {}^{A}_{Z}\text{X}
		str = str.replace(/\\text\{_(\d+)\^(\d+)\s+([^}]+)\}/g, "{}^{$2}_{$1}\\text{$3}");

		// Nuclear notation with variables: \text{_Z^A N} -> {}^{A}_{Z}\text{N}
		str = str.replace(/\\text\{_([A-Z])\^([A-Z])\s+([^}]+)\}/g, "{}^{$2}_{$1}\\text{$3}");

		// Complex nuclear notation: \text{{Z-2}^{A-4} N'} -> {}^{A-4}_{Z-2}\text{N'}
		str = str.replace(/\\text\{\{([^}]+)\}\^\{([^}]+)\}\s+([^}]+)\}/g, "{}^{$2}_{$1}\\text{$3}");

		// Alternative notation: ^{A}_{Z}\text{N}
		str = str.replace(/\^\{([^}]+)\}_\{([^}]+)\}\\text\{([^}]+)\}/g, "{}^{$1}_{$2}\\text{$3}");

		// Handle already formatted notation: ^{A}{Z}\text{N} -> {}^{A}_{Z}\text{N}
		str = str.replace(/\^\{([^}]+)\}\{([^}]+)\}\\text\{([^}]+)\}/g, "{}^{$1}_{$2}\\text{$3}");

		// Handle the specific pattern from your examples: ^{A}{Z}\text{N}
		str = str.replace(/\^\{([^}]+)\}\{([^}]+)\}\\text\{([^}]+)\}/g, "{}^{$1}_{$2}\\text{$3}");

		// e^- and e^+ patterns - both inside and outside \text{}
		str = str.replace(/\\text\{e\}\^([-+])/g, "e^{$1}");
		str = str.replace(/\\text\{e\}\^\{([-+])\}/g, "e^{$1}");
		str = str.replace(/\\text\{e\^([-+])\}/g, "e^{$1}");
		str = str.replace(/\\text\{e\^\{([-+])\}\}/g, "e^{$1}");

		// Neutrino and antineutrino patterns
		str = str.replace(/\\bar\{\\nu\}/g, "\\overline{\\nu}");

		// Star notation for excited states
		str = str.replace(/\\text\{([^}]+)\*\}/g, "\\text{$1}^*");

		// Handle Z^A and _Z^A without \text{}
		str = str.replace(/([A-Z])\^([A-Z])\s+([A-Z])/g, "{}^{$2}\\text{$3}");
		str = str.replace(/_([A-Z])\^([A-Z])\s+([A-Z])/g, "{}^{$2}_{$1}\\text{$3}");

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
		// Enhanced \text{} processing
		return str.replace(/\\text\{([^{}]+)\}/g, (_m, inner) => {
			// Special patterns that should be kept in \text{}
			const keepPatterns = [
				/^[A-Z]'?$/, // Single uppercase letter possibly with prime (e.g., N, N')
				/^[a-z]'?$/, // Single lowercase letter possibly with prime
				/^(He|Li|Be|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca)$/, // Chemical elements
				/^e\^[+-]$/, // Electron/positron notation
				/^\w+['*]?$/, // Words with possible prime or star
			];

			// Check if we should keep \text{}
			for (const pattern of keepPatterns) {
				if (pattern.test(inner)) {
					return `\\mathrm{${inner}}`; // Use \mathrm instead of \text
				}
			}

			// For simple math expressions, remove \text{}
			if (/^[A-Za-z0-9_+\-*/=().,\s]+$/.test(inner)) {
				return inner;
			}

			// For everything else, convert to \mathrm
			return `\\mathrm{${inner}}`;
		});
	}

	processTypoFixes(str) {
		// fix common typos like infty -> \infty
		str = str.replace(/\binfty\b/g, "\\infty");

		// Fix limit arrow typos: \to -> \rightarrow
		str = str.replace(/\\to\b/g, "\\rightarrow");

		// Fix missing braces in limits: \lim_{x o infty} -> \lim_{x \to \infty}
		str = str.replace(/\\lim_\{([^}]*)\s+o\s+infty\}/g, "\\lim_{$1 \\to \\infty}");

		// Fix unmatched braces in expressions
		str = this.fixUnmatchedBraces(str);

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
			}
		}

		// Add missing closing braces
		while (openCount > 0) {
			result += "}";
			openCount--;
		}

		// Remove extra closing braces (simple approach)
		result = result.replace(/\}\}+/g, "}");

		return result;
	}

	processDerivatives(str) {
		// Handle derivatives properly
		// Convert d/dx patterns
		str = str.replace(/\\frac\{d\}\{dx\}/g, "\\frac{\\mathrm{d}}{\\mathrm{d}x}");

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
// Enhanced rendering function with intelligent fallback
async function renderMathExpression(tex, displayMode = false, element = null) {
	rendererState.totalAttempts++;

	// Try KaTeX first
	try {
		// Preprocess with custom parser FIRST, then handle Unicode
		let processedTex = tex;
		if (customParser.canHandle(tex)) {
			processedTex = customParser.simplify(tex);
		}
		processedTex = handleUnicodeInMath(processedTex);

		const katexOptions = {
			displayMode: displayMode,
			throwOnError: false,
			errorColor: "inherit",
			strict: false, // Disable strict mode to reduce warnings
			trust: true, // Trust input to allow more features
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
			},
			// Handle Unicode characters better
			minRuleThickness: 0.05,
			maxSize: 1000,
			maxExpand: 1000,
		};

		const rendered = katex.renderToString(processedTex, katexOptions);
		rendererState.katexSuccess++;

		if (element) {
			element.innerHTML = rendered;
			element.classList.add("webtex-katex-rendered");
		}

		return { success: true, method: "katex", element: element };
	} catch (_katexError) {
		// Try custom parser as fallback
		if (customParser.canHandle(tex)) {
			try {
				const simplified = customParser.simplify(tex);
				const processedSimplified = handleUnicodeInMath(simplified);
				const rendered = katex.renderToString(processedSimplified, {
					displayMode,
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
				return { success: true, method: "custom", element: element };
			} catch (_customError) {}
		}

		// Final fallback - show original text with error styling
		if (element) {
			const fallbackElement = customParser.renderFallback(tex, displayMode);
			element.innerHTML = "";
			element.appendChild(fallbackElement);
			element.classList.add("webtex-error-fallback");
		}

		return { success: false, method: "error", element: element };
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

			muts
				.flatMap((m) => [...m.addedNodes])
				.filter((n) => n.nodeType === 1 && !n.closest(".webtex-ignore"))
				.forEach(safeRender);
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
