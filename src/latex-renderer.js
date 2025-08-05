/*  src/latex-renderer.js  – Enhanced LaTeX renderer
    Self-contained LaTeX to HTML converter for Chrome extension
*/

class LatexRenderer {
	constructor() {
		this.isReady = true;
		this.init();
	}

	async init() {
		// LaTeX renderer is ready to use
	}

	// Parse and render LaTeX content
	renderLatex(latexContent, targetElement) {
		if (!this.isReady) {
			console.warn("LaTeX renderer not ready yet");
			return false;
		}

		try {
			const processedContent = this.latexToHTML(latexContent);
			targetElement.innerHTML = processedContent;
			return true;
		} catch (error) {
			console.error("LaTeX rendering error:", error);
			// Fallback to original content
			targetElement.textContent = latexContent;
			return false;
		}
	}

	// Convert LaTeX to HTML with enhanced parsing
	latexToHTML(latex) {
		if (!latex || typeof latex !== "string") {
			return "";
		}

		let html = latex.trim();

		// Remove LaTeX delimiters
		html = html.replace(/^\$\$|\$\$$/g, "").replace(/^\$|\$$/g, "");

		// Clean up any malformed expressions
		html = this.cleanupMalformedLatex(html);

		// Process complex expressions first (order matters)
		html = this.processComplexExpressions(html);

		// Then process basic symbols
		html = this.processBasicSymbols(html);

		return html;
	}

	// Clean up malformed LaTeX expressions
	cleanupMalformedLatex(html) {
		// Remove unmatched braces
		let braceCount = 0;
		let cleaned = "";

		for (let i = 0; i < html.length; i++) {
			const char = html[i];
			if (char === "{") {
				braceCount++;
				cleaned += char;
			} else if (char === "}") {
				if (braceCount > 0) {
					braceCount--;
					cleaned += char;
				}
				// Skip unmatched closing braces
			} else {
				cleaned += char;
			}
		}

		// Add missing closing braces
		while (braceCount > 0) {
			cleaned += "}";
			braceCount--;
		}

		return cleaned;
	}

	// Process complex LaTeX expressions
	processComplexExpressions(html) {
		try {
			// Nuclear physics notation with text commands - handle these first
			// Pattern: \text{_Z^A X} -> <span>Z<sup>A</sup>X</span>
			html = html.replace(
				/\\text\{_([^}]+)\^([^}]+)\s+([^}]+)\}/g,
				'<span style="font-style: normal;"><sub>$1</sub><sup>$2</sup>$3</span>',
			);

			// Pattern: \text{Z^A N} -> <span>Z<sup>A</sup>N</span>
			html = html.replace(
				/\\text\{([A-Za-z]+)\^([^}]+)\s+([^}]+)\}/g,
				'<span style="font-style: normal;">$1<sup>$2</sup>$3</span>',
			);

			// Pattern: \text{_Z^A N} -> <span><sub>Z</sub><sup>A</sup>N</span>
			html = html.replace(
				/\\text\{_([^}]+)\^([^}]+)\s+([^}]+)\}/g,
				'<span style="font-style: normal;"><sub>$1</sub><sup>$2</sup>$3</span>',
			);

			// Pattern: \text{{Z-2}^{A-4} N'} -> <span><sub>Z-2</sub><sup>A-4</sup>N'</span>
			html = html.replace(
				/\\text\{\{([^}]+)\}\^\{([^}]+)\}\s+([^}]+)\}/g,
				'<span style="font-style: normal;"><sub>$1</sub><sup>$2</sup>$3</span>',
			);

			// Pattern: \text{{Z+1}^{A} N'} -> <span><sub>Z+1</sub><sup>A</sup>N'</span>
			html = html.replace(
				/\\text\{\{([^}]+)\}\^\{([^}]+)\}\s+([^}]+)\}/g,
				'<span style="font-style: normal;"><sub>$1</sub><sup>$2</sup>$3</span>',
			);

			// Pattern: \text{_Z^A N*} -> <span><sub>Z</sub><sup>A</sup>N*</span>
			html = html.replace(
				/\\text\{_([^}]+)\^([^}]+)\s+([^}]+)\}/g,
				'<span style="font-style: normal;"><sub>$1</sub><sup>$2</sup>$3</span>',
			);

			// Handle nuclear decay arrows and particles
			html = html.replace(/\\text\{e\^-\}/g, '<span style="font-style: normal;">e⁻</span>');
			html = html.replace(/\\text\{e\^\+\}/g, '<span style="font-style: normal;">e⁺</span>');
			html = html.replace(/\\text\{neutrino\}/g, '<span style="font-style: normal;">ν</span>');
			html = html.replace(/\\text\{He\}/g, '<span style="font-style: normal;">He</span>');
			html = html.replace(/\\text\{Rn\}/g, '<span style="font-style: normal;">Rn</span>');
			html = html.replace(/\\text\{Ra\}/g, '<span style="font-style: normal;">Ra</span>');
			html = html.replace(/\\text\{C\}/g, '<span style="font-style: normal;">C</span>');
			html = html.replace(/\\text\{N\}/g, '<span style="font-style: normal;">N</span>');
			html = html.replace(/\\text\{Ne\}/g, '<span style="font-style: normal;">Ne</span>');
			html = html.replace(/\\text\{F\}/g, '<span style="font-style: normal;">F</span>');

			// Nuclear notation: ^{A}_{Z}X (handle various formats)
			html = html.replace(/\^\{([^}]+)\}_\{([^}]+)\}([A-Za-z])/g, "<sup>$1</sup><sub>$2</sub>$3");
			html = html.replace(
				/\^\{([^}]+)\}_\{([^}]+)\}\\text\{([^}]+)\}/g,
				'<sup>$1</sup><sub>$2</sub><span style="font-style: normal;">$3</span>',
			);

			// Simple superscript with braces: ^{A}
			html = html.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");

			// Simple subscript with braces: _{Z}
			html = html.replace(/_\{([^}]+)\}/g, "<sub>$1</sub>");

			// --------------------------
			// UPDATED REGEXES (handles multi-character subscripts/superscripts without braces)
			// Handle cases like x^10, y_i
			html = html.replace(/([A-Za-z0-9])\^([A-Za-z0-9]+)/g, "$1<sup>$2</sup>");
			html = html.replace(/([A-Za-z0-9])_([A-Za-z0-9]+)/g, "$1<sub>$2</sub>");
			// --------------------------

			// Fractions with complex numerators/denominators
			html = html.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_match, num, den) => {
				const processedNum = this.processBasicSymbols(num);
				const processedDen = this.processBasicSymbols(den);
				return `<span style="display: inline-block; vertical-align: middle; text-align: center; margin: 0 2px;">
          <span style="display: block; border-bottom: 1px solid; line-height: 1.2em; padding: 0 2px;">${processedNum}</span>
          <span style="display: block; line-height: 1.2em; padding: 0 2px;">${processedDen}</span>
        </span>`;
			});

			// Square roots with complex content
			html = html.replace(/\\sqrt\{([^}]+)\}/g, (_match, content) => {
				const processedContent = this.processBasicSymbols(content);
				return `√<span style="text-decoration: overline;">${processedContent}</span>`;
			});

			// Text formatting: \text{...} (general case)
			html = html.replace(/\\text\{([^}]+)\}/g, '<span style="font-style: normal;">$1</span>');

			// Math mode: \mathrm{...}
			html = html.replace(/\\mathrm\{([^}]+)\}/g, '<span style="font-family: serif;">$1</span>');

			// Bold: \mathbf{...}
			html = html.replace(/\\mathbf\{([^}]+)\}/g, "<strong>$1</strong>");

			// Italic: \mathit{...}
			html = html.replace(/\\mathit\{([^}]+)\}/g, "<em>$1</em>");

			// Subscripts and superscripts (handle nested cases)
			html = this.processSubscriptsAndSuperscripts(html);

			return html;
		} catch (error) {
			console.warn("Error processing complex expressions:", error);
			return html;
		}
	}

	// Process subscripts and superscripts with better handling
	processSubscriptsAndSuperscripts(html) {
		try {
			// Handle complex cases like ^{A-4}_{Z-2}
			html = html.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");
			html = html.replace(/_\{([^}]+)\}/g, "<sub>$1</sub>");

			// UPDATED REGEXES HERE AS WELL (multi-character)
			html = html.replace(/([A-Za-z0-9])\^([A-Za-z0-9]+)/g, "$1<sup>$2</sup>");
			html = html.replace(/([A-Za-z0-9])_([A-Za-z0-9]+)/g, "$1<sub>$2</sub>");

			return html;
		} catch (error) {
			console.warn("Error processing subscripts/superscripts:", error);
			return html;
		}
	}

	// Process basic LaTeX symbols
	processBasicSymbols(html) {
		try {
			const conversions = [
				// Greek letters
				{ pattern: /\\alpha/g, replacement: "α" },
				{ pattern: /\\beta/g, replacement: "β" },
				{ pattern: /\\gamma/g, replacement: "γ" },
				{ pattern: /\\delta/g, replacement: "δ" },
				{ pattern: /\\epsilon/g, replacement: "ε" },
				{ pattern: /\\zeta/g, replacement: "ζ" },
				{ pattern: /\\eta/g, replacement: "η" },
				{ pattern: /\\theta/g, replacement: "θ" },
				{ pattern: /\\iota/g, replacement: "ι" },
				{ pattern: /\\kappa/g, replacement: "κ" },
				{ pattern: /\\lambda/g, replacement: "λ" },
				{ pattern: /\\mu/g, replacement: "μ" },
				{ pattern: /\\nu/g, replacement: "ν" },
				{ pattern: /\\xi/g, replacement: "ξ" },
				{ pattern: /\\pi/g, replacement: "π" },
				{ pattern: /\\rho/g, replacement: "ρ" },
				{ pattern: /\\sigma/g, replacement: "σ" },
				{ pattern: /\\tau/g, replacement: "τ" },
				{ pattern: /\\upsilon/g, replacement: "υ" },
				{ pattern: /\\phi/g, replacement: "φ" },
				{ pattern: /\\chi/g, replacement: "χ" },
				{ pattern: /\\psi/g, replacement: "ψ" },
				{ pattern: /\\omega/g, replacement: "ω" },

				// Uppercase Greek letters
				{ pattern: /\\Alpha/g, replacement: "Α" },
				{ pattern: /\\Beta/g, replacement: "Β" },
				{ pattern: /\\Gamma/g, replacement: "Γ" },
				{ pattern: /\\Delta/g, replacement: "Δ" },
				{ pattern: /\\Epsilon/g, replacement: "Ε" },
				{ pattern: /\\Zeta/g, replacement: "Ζ" },
				{ pattern: /\\Eta/g, replacement: "Η" },
				{ pattern: /\\Theta/g, replacement: "Θ" },
				{ pattern: /\\Iota/g, replacement: "Ι" },
				{ pattern: /\\Kappa/g, replacement: "Κ" },
				{ pattern: /\\Lambda/g, replacement: "Λ" },
				{ pattern: /\\Mu/g, replacement: "Μ" },
				{ pattern: /\\Nu/g, replacement: "Ν" },
				{ pattern: /\\Xi/g, replacement: "Ξ" },
				{ pattern: /\\Pi/g, replacement: "Π" },
				{ pattern: /\\Rho/g, replacement: "Ρ" },
				{ pattern: /\\Sigma/g, replacement: "Σ" },
				{ pattern: /\\Tau/g, replacement: "Τ" },
				{ pattern: /\\Upsilon/g, replacement: "Υ" },
				{ pattern: /\\Phi/g, replacement: "Φ" },
				{ pattern: /\\Chi/g, replacement: "Χ" },
				{ pattern: /\\Psi/g, replacement: "Ψ" },
				{ pattern: /\\Omega/g, replacement: "Ω" },

				// Math symbols
				{ pattern: /\\times/g, replacement: "×" },
				{ pattern: /\\div/g, replacement: "÷" },
				{ pattern: /\\pm/g, replacement: "±" },
				{ pattern: /\\mp/g, replacement: "∓" },
				{ pattern: /\\leq/g, replacement: "≤" },
				{ pattern: /\\geq/g, replacement: "≥" },
				{ pattern: /\\neq/g, replacement: "≠" },
				{ pattern: /\\approx/g, replacement: "≈" },
				{ pattern: /\\equiv/g, replacement: "≡" },
				{ pattern: /\\propto/g, replacement: "∝" },
				{ pattern: /\\infty/g, replacement: "∞" },
				{ pattern: /\\partial/g, replacement: "∂" },
				{ pattern: /\\nabla/g, replacement: "∇" },
				{ pattern: /\\sum/g, replacement: "∑" },
				{ pattern: /\\prod/g, replacement: "∏" },
				{ pattern: /\\int/g, replacement: "∫" },
				{ pattern: /\\oint/g, replacement: "∮" },
				{ pattern: /\\forall/g, replacement: "∀" },
				{ pattern: /\\exists/g, replacement: "∃" },
				{ pattern: /\\nexists/g, replacement: "∄" },
				{ pattern: /\\in/g, replacement: "∈" },
				{ pattern: /\\notin/g, replacement: "∉" },
				{ pattern: /\\ni/g, replacement: "∋" },
				{ pattern: /\\subset/g, replacement: "⊂" },
				{ pattern: /\\supset/g, replacement: "⊃" },
				{ pattern: /\\subseteq/g, replacement: "⊆" },
				{ pattern: /\\supseteq/g, replacement: "⊇" },
				{ pattern: /\\cup/g, replacement: "∪" },
				{ pattern: /\\cap/g, replacement: "∩" },
				{ pattern: /\\emptyset/g, replacement: "∅" },
				{ pattern: /\\varnothing/g, replacement: "∅" },
				{ pattern: /\\wedge/g, replacement: "∧" },
				{ pattern: /\\vee/g, replacement: "∨" },
				{ pattern: /\\neg/g, replacement: "¬" },
				{ pattern: /\\oplus/g, replacement: "⊕" },
				{ pattern: /\\otimes/g, replacement: "⊗" },
				{ pattern: /\\perp/g, replacement: "⊥" },
				{ pattern: /\\parallel/g, replacement: "∥" },
				{ pattern: /\\angle/g, replacement: "∠" },
				{ pattern: /\\measuredangle/g, replacement: "∡" },
				{ pattern: /\\sphericalangle/g, replacement: "∢" },
				{ pattern: /\\degree/g, replacement: "°" },
				{ pattern: /\\prime/g, replacement: "′" },
				{ pattern: /\\doubleprime/g, replacement: "″" },
				{ pattern: /\\tripleprime/g, replacement: "‴" },
				{ pattern: /\\backslash/g, replacement: "\\" },
				{ pattern: /\\lbrace/g, replacement: "{" },
				{ pattern: /\\rbrace/g, replacement: "}" },
				{ pattern: /\\langle/g, replacement: "⟨" },
				{ pattern: /\\rangle/g, replacement: "⟩" },
				{ pattern: /\\lceil/g, replacement: "⌈" },
				{ pattern: /\\rceil/g, replacement: "⌉" },
				{ pattern: /\\lfloor/g, replacement: "⌊" },
				{ pattern: /\\rfloor/g, replacement: "⌋" },

				// Arrows
				{ pattern: /\\leftarrow/g, replacement: "←" },
				{ pattern: /\\rightarrow/g, replacement: "→" },
				{ pattern: /\\leftrightarrow/g, replacement: "↔" },
				{ pattern: /\\Leftarrow/g, replacement: "⇐" },
				{ pattern: /\\Rightarrow/g, replacement: "⇒" },
				{ pattern: /\\Leftrightarrow/g, replacement: "⇔" },
				{ pattern: /\\mapsto/g, replacement: "↦" },
				{ pattern: /\\hookleftarrow/g, replacement: "↩" },
				{ pattern: /\\hookrightarrow/g, replacement: "↪" },
				{ pattern: /\\leftharpoonup/g, replacement: "↼" },
				{ pattern: /\\rightharpoonup/g, replacement: "⇀" },
				{ pattern: /\\leftharpoondown/g, replacement: "↽" },
				{ pattern: /\\rightharpoondown/g, replacement: "⇁" },
				{ pattern: /\\rightleftharpoons/g, replacement: "⇌" },
				{ pattern: /\\leftrightharpoons/g, replacement: "⇋" },
				{ pattern: /\\uparrow/g, replacement: "↑" },
				{ pattern: /\\downarrow/g, replacement: "↓" },
				{ pattern: /\\updownarrow/g, replacement: "↕" },
				{ pattern: /\\Uparrow/g, replacement: "⇑" },
				{ pattern: /\\Downarrow/g, replacement: "⇓" },
				{ pattern: /\\Updownarrow/g, replacement: "⇕" },
				{ pattern: /\\nearrow/g, replacement: "↗" },
				{ pattern: /\\searrow/g, replacement: "↘" },
				{ pattern: /\\swarrow/g, replacement: "↙" },
				{ pattern: /\\nwarrow/g, replacement: "↖" },

				// Nuclear physics specific
				{
					pattern: /\\bar\{([^}]+)\}/g,
					replacement: '<span style="text-decoration: overline;">$1</span>',
				},
				{
					pattern: /\\vec\{([^}]+)\}/g,
					replacement: '<span style="text-decoration: overline;">$1</span>',
				},
				{
					pattern: /\\hat\{([^}]+)\}/g,
					replacement: '<span style="text-decoration: overline;">$1</span>',
				},
				{
					pattern: /\\tilde\{([^}]+)\}/g,
					replacement: '<span style="text-decoration: overline;">$1</span>',
				},

				// Units and measurements
				{ pattern: /\\text\{m\}/g, replacement: "m" },
				{ pattern: /\\text\{kg\}/g, replacement: "kg" },
				{ pattern: /\\text\{MeV\}/g, replacement: "MeV" },
				{ pattern: /\\text\{c\}/g, replacement: "c" },

				// Special characters that might cause font issues
				{ pattern: /\\frac\{1\}\{2\}/g, replacement: "½" },
				{ pattern: /\\frac\{1\}\{3\}/g, replacement: "⅓" },
				{ pattern: /\\frac\{2\}\{3\}/g, replacement: "⅔" },
				{ pattern: /\\frac\{1\}\{4\}/g, replacement: "¼" },
				{ pattern: /\\frac\{3\}\{4\}/g, replacement: "¾" },
				{ pattern: /\\frac\{1\}\{5\}/g, replacement: "⅕" },
				{ pattern: /\\frac\{2\}\{5\}/g, replacement: "⅖" },
				{ pattern: /\\frac\{3\}\{5\}/g, replacement: "⅗" },
				{ pattern: /\\frac\{4\}\{5\}/g, replacement: "⅘" },
				{ pattern: /\\frac\{1\}\{6\}/g, replacement: "⅙" },
				{ pattern: /\\frac\{5\}\{6\}/g, replacement: "⅚" },
				{ pattern: /\\frac\{1\}\{8\}/g, replacement: "⅛" },
				{ pattern: /\\frac\{3\}\{8\}/g, replacement: "⅜" },
				{ pattern: /\\frac\{5\}\{8\}/g, replacement: "⅝" },
				{ pattern: /\\frac\{7\}\{8\}/g, replacement: "⅞" },

				// Remove remaining LaTeX commands that we don't handle
				{ pattern: /\\[a-zA-Z]+\{[^}]*\}/g, replacement: "" },
				{ pattern: /\\[a-zA-Z]+/g, replacement: "" },
			];

			conversions.forEach((conv) => {
				try {
					html = html.replace(conv.pattern, conv.replacement);
				} catch (error) {
					console.warn("Error applying conversion:", conv, error);
				}
			});

			return html;
		} catch (error) {
			console.warn("Error processing basic symbols:", error);
			return html;
		}
	}

	// Render inline math (single $ or \( \))
	renderInlineMath(mathContent, targetElement) {
		const wrappedContent = `$${mathContent}$`;
		return this.renderLatex(wrappedContent, targetElement);
	}

	// Render display math (double $$ or \[ \])
	renderDisplayMath(mathContent, targetElement) {
		const wrappedContent = `$$${mathContent}$$`;
		return this.renderLatex(wrappedContent, targetElement);
	}

	// Find and render all LaTeX in a DOM element
	renderAllLatex(rootElement = document.body) {
		if (!this.isReady) return;

		try {
			// Find text nodes containing LaTeX patterns
			const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, {
				acceptNode: (node) => {
					const text = node.textContent;
					// Check for LaTeX patterns
					if (
						/\$[^$]+\$/.test(text) ||
						/\\\([^)]+\\\)/.test(text) ||
						/\$\$[^$]+\$\$/.test(text) ||
						/\\\[[^\]]+\\\]/.test(text)
					) {
						return NodeFilter.FILTER_ACCEPT;
					}
					return NodeFilter.FILTER_REJECT;
				},
			});

			const nodesToProcess = [];
			let node;
			while ((node = walker.nextNode())) {
				nodesToProcess.push(node);
			}

			// Process each node
			nodesToProcess.forEach((textNode) => {
				try {
					this.processTextNode(textNode);
				} catch (error) {
					console.warn("Error processing text node:", error);
				}
			});
		} catch (error) {
			console.error("Error in renderAllLatex:", error);
		}
	}

	// Process a text node containing LaTeX
	processTextNode(textNode) {
		const text = textNode.textContent;
		const parent = textNode.parentNode;

		// Skip if parent is already processed or in an ignored element
		if (
			parent.classList.contains("webtex-processed") ||
			parent.closest(".webtex-ignore") ||
			parent.closest("script, style, textarea, pre, code, input, select, button")
		) {
			return;
		}

		// Split text by LaTeX patterns
		const parts = this.splitByLatexPatterns(text);

		if (parts.length === 1) return; // No LaTeX found

		// Create a container for the processed content
		const container = document.createElement("span");
		container.classList.add("webtex-processed");

		parts.forEach((part) => {
			if (part.type === "text") {
				container.appendChild(document.createTextNode(part.content));
			} else if (part.type === "inline") {
				const mathSpan = document.createElement("span");
				mathSpan.classList.add("webtex-inline-math");
				if (this.renderInlineMath(part.content, mathSpan)) {
					container.appendChild(mathSpan);
				} else {
					// Fallback to original text if rendering fails
					container.appendChild(document.createTextNode(part.original));
				}
			} else if (part.type === "display") {
				const mathDiv = document.createElement("div");
				mathDiv.classList.add("webtex-display-math");
				if (this.renderDisplayMath(part.content, mathDiv)) {
					container.appendChild(mathDiv);
				} else {
					// Fallback to original text if rendering fails
					container.appendChild(document.createTextNode(part.original));
				}
			}
		});

		// Replace the text node with the processed content
		parent.replaceChild(container, textNode);
	}

	// Split text by LaTeX patterns
	splitByLatexPatterns(text) {
		try {
			const parts = [];
			// Patterns to match: $...$, $$...$$, \(...\), \[...\]
			const patterns = [
				{ regex: /\$\$([^$]+)\$\$/g, type: "display" },
				{ regex: /\$([^$]+)\$/g, type: "inline" },
				{ regex: /\\\[[^\]]+\\\]/g, type: "display" },
				{ regex: /\\\([^)]+\\\)/g, type: "inline" },
			];

			let lastIndex = 0;
			// Find all matches
			const matches = [];
			patterns.forEach((pattern) => {
				const regex = new RegExp(pattern.regex.source, "g");
				let match;
				while ((match = regex.exec(text)) !== null) {
					matches.push({
						index: match.index,
						endIndex: match.index + match[0].length,
						content: match[1],
						original: match[0],
						type: pattern.type,
					});
				}
			});

			// Sort matches by position
			matches.sort((a, b) => a.index - b.index);

			// Build parts array
			matches.forEach((match) => {
				// Add text before match
				if (match.index > lastIndex) {
					parts.push({ type: "text", content: text.substring(lastIndex, match.index) });
				}

				// Add the LaTeX match
				parts.push({ type: match.type, content: match.content, original: match.original });

				lastIndex = match.endIndex;
			});

			// Add remaining text
			if (lastIndex < text.length) {
				parts.push({ type: "text", content: text.substring(lastIndex) });
			}

			return parts;
		} catch (error) {
			console.warn("Error splitting LaTeX patterns:", error);
			return [{ type: "text", content: text }];
		}
	}

	// Clear all rendered LaTeX
	clear() {
		try {
			const processedElements = document.querySelectorAll(".webtex-processed");
			processedElements.forEach((element) => {
				const parent = element.parentNode;
				if (parent) {
					// Replace with original text content
					const textContent = element.textContent || element.innerText;
					const textNode = document.createTextNode(textContent);
					parent.replaceChild(textNode, element);
				}
			});
		} catch (error) {
			console.error("Error clearing LaTeX:", error);
		}
	}
}

export default LatexRenderer;
