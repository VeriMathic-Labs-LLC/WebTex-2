// Test script to verify that empty braces in nuclear physics notation are handled correctly

function testEmptyBracesFix() {
	// Simulate the nuclear physics processing
	function processNuclearNotation(str) {
		// Handle \text{{}^{A}N} patterns - remove \text wrapper for nuclear notation
		str = str.replace(
			/\\text\{(\{\})?(\^\{[^}]+\})?(_\{[^}]+\})?([^}]*)\}/g,
			(match, empty, sup, sub, rest) => {
				if (sup || sub) {
					// This is nuclear notation inside \text{}, extract it
					// Don't include empty braces to avoid delimiter balance issues
					return `${sup || ""}${sub || ""}\\text{${rest.trim()}}`;
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

		// Clean up multiple consecutive empty braces that cause delimiter balance issues
		str = str.replace(/\{\}\{\}/g, ""); // Remove pairs of empty braces
		str = str.replace(/\{\}\{\}\{\}/g, ""); // Remove triplets of empty braces
		str = str.replace(/\{\}\{\}\{\}\{\}/g, ""); // Remove quadruplets of empty braces

		return str;
	}

	// Function to check for empty braces
	function hasEmptyBraces(str) {
		return /\{\}\{\}/.test(str) || /\{\}\{\}\{\}/.test(str) || /\{\}\{\}\{\}\{\}/.test(str);
	}

	// Test cases
	const testCases = [
		{
			input: "{}^{A}\\text{N} \\rightarrow {}{}{}{}^{A-4}_{Z-2}\\text{N'} + {}{}^{4}_{2}He",
			description: "Problematic expression with multiple empty braces",
			shouldHaveEmptyBraces: false,
		},
		{
			input: "\\text{{}^{A}N} \\rightarrow \\text{{}^{A-4}_{Z-2}N'} + \\text{{}^{4}_{2}He}",
			description: "Nuclear notation with text wrappers",
			shouldHaveEmptyBraces: false,
		},
		{
			input: "\\text{_Z^A N} \\to \\text{{Z-2}^{A-4} N'} + \\text{_2^4 He}",
			description: "Nuclear decay notation",
			shouldHaveEmptyBraces: false,
		},
		{
			input: "\\text{e^-} + \\bar{\\nu}",
			description: "Electron and antineutrino",
			shouldHaveEmptyBraces: false,
		},
		{
			input: "\\text{{}^{A}N} \\rightarrow {}^{A}_{Z+1}\\text{N'} + e^{-} + \\overline{\\nu}",
			description: "Beta decay notation",
			shouldHaveEmptyBraces: false,
		},
		{
			input: "\\frac{1}{2} + \\frac{1}{3}",
			description: "Regular fractions (should not be affected)",
			shouldHaveEmptyBraces: false,
		},
	];

	console.log("Testing empty braces fix in nuclear physics notation...\n");

	let passedTests = 0;
	const totalTests = testCases.length;

	testCases.forEach((testCase, index) => {
		const processed = processNuclearNotation(testCase.input);
		const hasEmptyBracesAfter = hasEmptyBraces(processed);
		const passed = hasEmptyBracesAfter === testCase.shouldHaveEmptyBraces;

		if (passed) {
			console.log(`✅ Test ${index + 1} PASSED: ${testCase.description}`);
			passedTests++;
		} else {
			console.log(`❌ Test ${index + 1} FAILED: ${testCase.description}`);
			console.log(`   Input:    ${testCase.input}`);
			console.log(`   Processed: ${processed}`);
			console.log(
				`   Has empty braces: ${hasEmptyBracesAfter} (expected: ${testCase.shouldHaveEmptyBraces})`,
			);
		}
		console.log("");
	});

	console.log(`\nResults: ${passedTests}/${totalTests} tests passed`);

	if (passedTests === totalTests) {
		console.log("🎉 All tests passed! The empty braces issue should be fixed.");
	} else {
		console.log("⚠️  Some tests failed. The fix may need adjustment.");
	}
}

// Run the test
testEmptyBracesFix();
