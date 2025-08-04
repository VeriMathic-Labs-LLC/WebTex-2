// Test script to verify the regex patterns for fixing malformed LaTeX fractions

function applyFractionFix(tex) {
    let fixed = tex;
    
    // Fix specific malformed fraction patterns before processing
    // Handle cases like \frac{\pi^{2}{6} -> \frac{\pi^{2}}{6}
    fixed = fixed.replace(/\\frac\{([^}]*\^\{[^}]*\})\{([^}]*)\}/g, "\\frac{$1}{$2}");
    
    // Fix fractions where the closing brace is missing after superscripts
    fixed = fixed.replace(/\\frac\{([^}]*\^\{[^}]*\})\s*([^{}\s])/g, "\\frac{$1}{$2}");
    
    return fixed;
}

// Test cases
const testCases = [
    {
        input: "\\frac{\\pi^{2}{6}",
        expected: "\\frac{\\pi^{2}}{6}",
        description: "Basic malformed fraction with superscript"
    },
    {
        input: "\\frac{a^{2}{b}",
        expected: "\\frac{a^{2}}{b}",
        description: "Another malformed fraction with superscript"
    },
    {
        input: "\\frac{x^{2}}{y} + \\frac{a^{3}{b}",
        expected: "\\frac{x^{2}}{y} + \\frac{a^{3}}{b}",
        description: "Multiple fractions, one malformed"
    },
    {
        input: "\\frac{\\pi^{2}}{6}",
        expected: "\\frac{\\pi^{2}}{6}",
        description: "Already correct fraction (should not change)"
    },
    {
        input: "\\frac{a}{b}",
        expected: "\\frac{a}{b}",
        description: "Simple correct fraction (should not change)"
    },
    {
        input: "\\frac{\\pi^{2}{6} + \\frac{a^{3}{b}",
        expected: "\\frac{\\pi^{2}}{6} + \\frac{a^{3}}{b}",
        description: "Multiple malformed fractions in one expression"
    },
    {
        input: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^{2}{6}",
        expected: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^{2}}{6}",
        description: "Complex expression with malformed fraction"
    }
];

console.log("Testing fraction fix patterns...\n");

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
    const fixed = applyFractionFix(testCase.input);
    const passed = fixed === testCase.expected;
    
    if (passed) {
        console.log(`✅ Test ${index + 1} PASSED: ${testCase.description}`);
        passedTests++;
    } else {
        console.log(`❌ Test ${index + 1} FAILED: ${testCase.description}`);
        console.log(`   Input:    ${testCase.input}`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Got:      ${fixed}`);
    }
    console.log("");
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log("🎉 All tests passed! The fix should work correctly.");
} else {
    console.log("⚠️  Some tests failed. The fix may need adjustment.");
}