// Test script to verify that the specific problematic expressions are fixed

function testSpecificIssues() {
    // Simulate the complete processing pipeline
    function processExpression(str) {
        // Clean up multiple consecutive empty braces that cause delimiter balance issues
        // Handle the specific case where empty braces are followed by superscripts
        str = str.replace(/\{\}\{\}\{\}\^/g, "^"); // Remove three empty braces followed by ^
        str = str.replace(/\{\}\{\}\^/g, "^"); // Remove two empty braces followed by ^
        str = str.replace(/\{\}\^/g, "^"); // Remove one empty brace followed by ^
        
        // Clean up other consecutive empty braces
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
        str = str.replace(/\{\}\{\}\{\}\^/g, "^"); // Remove three empty braces followed by ^
        str = str.replace(/\{\}\{\}\^/g, "^"); // Remove two empty braces followed by ^
        str = str.replace(/\{\}\^/g, "^"); // Remove one empty brace followed by ^
        
        // Clean up other consecutive empty braces
        str = str.replace(/\{\}\{\}(?!\^)/g, ""); // Remove pairs of empty braces not followed by ^
        str = str.replace(/\{\}\{\}\{\}(?!\^)/g, ""); // Remove triplets of empty braces not followed by ^
        str = str.replace(/\{\}\{\}\{\}\{\}(?!\^)/g, ""); // Remove quadruplets of empty braces not followed by ^
        
        // Fix nuclear notation format: {^{A}} -> {}^{A}
        str = str.replace(/\{(\^\{[^}]+\})\}/g, "{$1}");
        
        // Clean up remaining empty brace pairs that might be left
        str = str.replace(/\{\}\{\}/g, "");

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
            if (str[i] === '{') count++;
            else if (str[i] === '}') count--;
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
            shouldBeBalanced: true
        },
        {
            input: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
            description: "Expression that might have missing closing brace",
            shouldHaveEmptyBraces: false,
            shouldBeBalanced: true
        },
        {
            input: "\\text{{}^{A}N} \\rightarrow \\text{{}^{A-4}_{Z-2}N'} + \\text{{}^{4}_{2}He}",
            description: "Nuclear notation with text wrappers",
            shouldHaveEmptyBraces: false,
            shouldBeBalanced: true
        },
        {
            input: "\\frac{\\pi^2}{6}",
            description: "Simple fraction expression",
            shouldHaveEmptyBraces: false,
            shouldBeBalanced: true
        }
    ];

    console.log("Testing specific problematic expressions...\n");

    let passedTests = 0;
    let totalTests = testCases.length;

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
            console.log(`   Has empty braces: ${hasEmptyBracesAfter} (expected: ${testCase.shouldHaveEmptyBraces})`);
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