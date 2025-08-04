// Test script to verify that delimiter balance check works correctly with fixed expressions

function testDelimiterBalance() {
	// Simulate the hasUnbalancedDelimiters function
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

		let i = 0;
		while (i < str.length) {
			const char = str[i];

			// Check for LaTeX commands
			if (char === "\\") {
				// Look for \left or \right commands
				// Corrected regex patterns to accurately match LaTeX \left... and \right... delimiters
				const leftMatch = str
					.slice(i)
					.match(/^\\left(?:\(|\[|\\\{|\\.|\||\\\||\\lfloor|\\lceil|\\langle)/);
				const rightMatch = str
					.slice(i)
					.match(/^\\right(?:\)|\]|\\\}|\\.|\||\\\||\\rfloor|\\rceil|\\rangle)/);

				if (leftMatch) {
					const leftCmd = leftMatch[0];
					const rightCmd = pairs[leftCmd];
					if (rightCmd) {
						stack.push(rightCmd);
					}
					i += leftCmd.length;
					continue;
				} else if (rightMatch) {
					const rightCmd = rightMatch[0];
					if (stack.length > 0 && stack[stack.length - 1] === rightCmd) {
						stack.pop();
					} else {
						return true; // Unmatched right delimiter
					}
					i += rightCmd.length;
					continue;
				}
			}

			// Check for regular delimiters
			if (pairs[char]) {
				stack.push(pairs[char]);
			} else if (Object.values(pairs).includes(char)) {
				if (stack.length > 0 && stack[stack.length - 1] === char) {
					stack.pop();
				} else {
					return true; // Unmatched right delimiter
				}
			}

			i++;
		}

		return stack.length > 0; // Unmatched left delimiters
	}

	// Simulate the complete processing pipeline
	function processExpression(str) {
		// Clean up multiple consecutive empty braces that cause delimiter balance issues
		// But be careful not to remove braces that are part of valid nuclear notation
		str = str.replace(/\{\}\{\}(?!\^)/g, ""); // Remove pairs of empty braces not followed by ^
		str = str.replace(/\{\}\{\}\{\}(?!\^)/g, ""); // Remove triplets of empty braces not followed by ^
		str = str.replace(/\{\}\{\}\{\}\{\}(?!\^)/g, ""); // Remove quadruplets of empty braces not followed by ^

		// Simulate nuclear physics processing
		str = str.replace(
			/\\text\{(\{\})?(\^\{[^}]+\})?(_\{[^}]+\})?([^}]*)\}/g,
			(match, empty, sup, sub, rest) => {
				if (sup || sub) {
					// Create proper nuclear notation format
					let notation = "";
					if (sup) notation += sup;
					if (sub) notation += sub;
					return `{${notation}}\\text{${rest.trim()}}`;
				}
				return match;
			},
		);

		// Clean up again after processing
		str = str.replace(/\{\}\{\}(?!\^)/g, ""); // Remove pairs of empty braces not followed by ^
		str = str.replace(/\{\}\{\}\{\}(?!\^)/g, ""); // Remove triplets of empty braces not followed by ^
		str = str.replace(/\{\}\{\}\{\}\{\}(?!\^)/g, ""); // Remove quadruplets of empty braces not followed by ^

		// Fix nuclear notation format: {^{A}} -> {}^{A}
		str = str.replace(/\{(\^\{[^}]+\})\}/g, "{$1}");

		// Clean up remaining empty brace pairs that might be left
		str = str.replace(/\{\}\{\}/g, "");

		return str;
	}

	// Test cases
	const testCases = [
		{
			input: "{}^{A}\\text{N} \\rightarrow {}{}{}{}^{A-4}_{Z-2}\\text{N'} + {}{}^{4}_{2}He",
			description: "Original problematic expression",
			shouldBeBalanced: true,
		},
		{
			input: "\\text{{}^{A}N} \\rightarrow \\text{{}^{A-4}_{Z-2}N'} + \\text{{}^{4}_{2}He}",
			description: "Nuclear notation with text wrappers",
			shouldBeBalanced: true,
		},
		{
			input: "\\text{_Z^A N} \\to \\text{{Z-2}^{A-4} N'} + \\text{_2^4 He}",
			description: "Nuclear decay notation",
			shouldBeBalanced: true,
		},
		{
			input: "\\frac{1}{2} + \\frac{1}{3}",
			description: "Regular fractions",
			shouldBeBalanced: true,
		},
		{
			input: "\\frac{\\pi^2}{6}",
			description: "Fraction with superscript",
			shouldBeBalanced: true,
		},
		{
			input: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2}",
			description: "Complex mathematical expression",
			shouldBeBalanced: true,
		},
		{
			input: "\\text{e^-} + \\bar{\\nu}",
			description: "Electron and antineutrino",
			shouldBeBalanced: true,
		},
		{
			input: "\\text{{}^{A}N} \\rightarrow {}^{A}_{Z+1}\\text{N'} + e^{-} + \\overline{\\nu}",
			description: "Beta decay notation",
			shouldBeBalanced: true,
		},
		{
			input: "\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}",
			description: "Fraction equation",
			shouldBeBalanced: true,
		},
		{
			input: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
			description: "Integral expression",
			shouldBeBalanced: true,
		},
	];

	console.log("Testing delimiter balance with fixed expressions...\n");

	let passedTests = 0;
	const totalTests = testCases.length;

	testCases.forEach((testCase, index) => {
		const processed = processExpression(testCase.input);
		const isBalanced = !hasUnbalancedDelimiters(processed);
		const passed = isBalanced === testCase.shouldBeBalanced;

		if (passed) {
			console.log(`✅ Test ${index + 1} PASSED: ${testCase.description}`);
			passedTests++;
		} else {
			console.log(`❌ Test ${index + 1} FAILED: ${testCase.description}`);
			console.log(`   Input:    ${testCase.input}`);
			console.log(`   Processed: ${processed}`);
			console.log(`   Is balanced: ${isBalanced} (expected: ${testCase.shouldBeBalanced})`);
		}
		console.log("");
	});

	console.log(`\nResults: ${passedTests}/${totalTests} tests passed`);

	if (passedTests === totalTests) {
		console.log("🎉 All tests passed! The delimiter balance issue should be fixed.");
	} else {
		console.log("⚠️  Some tests failed. The fix may need adjustment.");
	}
}

// Run the test
testDelimiterBalance();
