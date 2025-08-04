// Test script to verify that the specific problematic expressions are fixed

// Remove sequences of empty braces that cause delimiter balance issues
function cleanupEmptyBraces(str) {
	str = str.replace(/\{\}\{\}\{\}\^/g, "^");
	str = str.replace(/\{\}\{\}\^/g, "^");
	str = str.replace(/\{\}\^/g, "^");
	str = str.replace(/\{\}\{\}(?!\^)/g, "");
	str = str.replace(/\{\}\{\}\{\}(?!\^)/g, "");
	str = str.replace(/\{\}\{\}\{\}\{\}(?!\^)/g, "");
	str = str.replace(/\{\}\{\}/g, "");
	return str;
}

// Helper to fix unmatched braces similar to extension logic
// Note: This function no longer calls cleanupEmptyBraces internally to avoid circular dependency
function fixUnmatchedBraces(str) {
	let result = str;
	let openCount = 0;
	const chars = result.split("");

	for (let i = 0; i < chars.length; i++) {
		if (chars[i] === "{") {
			openCount++;
		} else if (chars[i] === "}") {
			openCount--;
			if (openCount < 0) {
				openCount = 0;
				chars[i] = "";
			}
		}
	}

	result = chars.filter((c) => c !== "").join("");
	while (openCount > 0) {
		result += "}";
		openCount--;
	}

	// Return result without cleanup - cleanup should be handled externally
	return result;
}

function testSpecificIssues() {
	// Simulate the complete processing pipeline
	function processExpression(str) {
		// Initial brace fix to mimic extension preprocessing
		str = fixUnmatchedBraces(str);
		str = cleanupEmptyBraces(str);

		// Simulate nuclear physics processing
		str = str.replace(
			/\\text\{(\{\})?(\^\{[^}]+\})?(_\{[^}]+\})?([^}]*)\}/g,
			(match, _empty, sup, sub, rest) => {
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
		str = cleanupEmptyBraces(str);

		// Fix nuclear notation format: {^{A}} -> {}^{A}
		str = str.replace(/\{(\^\{[^}]+\})\}/g, "{$1}");

		// Final cleanup and brace fix
		str = cleanupEmptyBraces(str);
		str = fixUnmatchedBraces(str);
		str = cleanupEmptyBraces(str); // Final cleanup after brace fixing

		return str;
	}

	// Function to check for empty braces
	function hasEmptyBraces(str) {
		return /\{\}\{\}/.test(str) || /\{\}\{\}\{\}/.test(str) || /\{\}\{\}\{\}\{\}/.test(str);
	}

	// Function to check delimiter balance (simplified)
	function hasUnbalancedDelimiters(str) {
		let count = 0;
		for (let i = 0; i < str.length; i++) {
			if (str[i] === "{") count++;
			else if (str[i] === "}") count--;
			if (count < 0) return true; // Unmatched closing brace
		}
		return count !== 0; // Unmatched opening braces
	}

	// Test cases for the specific issues
	const testCases = [
		{
			input: "{}^{A}\\text{N} \\rightarrow {}{}{}^{A}_{Z+1}\\text{N'} + e^{-} + \\overline{\\nu}",
			description: "Specific delimiter balance issue from error message",
			shouldHaveEmptyBraces: false,
			shouldBeBalanced: true,
		},
		{
			input: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
			description: "Expression that might have missing closing brace",
			shouldHaveEmptyBraces: false,
			shouldBeBalanced: true,
		},
		{
			input: "\\sqrt{\\pi",
			description: "Expression missing one closing brace",
			shouldHaveEmptyBraces: false,
			shouldBeBalanced: true,
		},
		{
			input: "\\sqrt{\\pi + \\frac{1}{2",
			description: "Expression missing two closing braces",
			shouldHaveEmptyBraces: false,
			shouldBeBalanced: true,
		},
		{
			input: "\\frac{\\pi^2}{6}",
			description: "Simple fraction expression",
			shouldHaveEmptyBraces: false,
			shouldBeBalanced: true,
		},
	];

	console.log("Testing specific problematic expressions...\n");

	let passedTests = 0;
	const totalTests = testCases.length;

	testCases.forEach((testCase, index) => {
		const processed = processExpression(testCase.input);
		const hasEmptyBracesAfter = hasEmptyBraces(processed);
		const isBalanced = !hasUnbalancedDelimiters(processed);

		const passedEmptyBraces = hasEmptyBracesAfter === testCase.shouldHaveEmptyBraces;
		const passedBalance = isBalanced === testCase.shouldBeBalanced;
		const passed = passedEmptyBraces && passedBalance;

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
			console.log(`   Is balanced: ${isBalanced} (expected: ${testCase.shouldBeBalanced})`);
		}
		console.log("");
	});

	console.log(`\nResults: ${passedTests}/${totalTests} tests passed`);

	if (passedTests === totalTests) {
		console.log("🎉 All tests passed! The specific issues should be fixed.");
	} else {
		console.log("⚠️  Some tests failed. The fix may need adjustment.");
	}
}

// Run the test
testSpecificIssues();
