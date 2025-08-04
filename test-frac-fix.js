// Test script to verify that \frac commands are not being truncated

function testFractionProcessing() {
    // Simulate the processFractionNotation function
    function processFractionNotation(str) {
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
        str = str.replace(
            /\\FRAC_TEMP\{([^{}]+)\}([^{}\s])/g,
            (_m, num, following) => {
                // Only fix if the following character is not part of a superscript or subscript
                // and if the numerator doesn't end with a superscript/subscript
                if (!/[\^_]/.test(num.slice(-1)) && !/[\^_]/.test(following)) {
                    return `\\FRAC_TEMP{${num}}{${following}}`;
                }
                return _m; // Return original if it might break superscripts/subscripts
            },
        );

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

    // Test cases
    const testCases = [
        {
            input: "\\frac{\\pi^2}{6}",
            expected: "\\frac{\\pi^2}{6}",
            description: "Correct \frac expression (should not change)"
        },
        {
            input: "\\frac{\\pi^{2}}{6}",
            expected: "\\frac{\\pi^{2}}{6}",
            description: "Correct \frac expression with superscript (should not change)"
        },
        {
            input: "rac{1}{2}",
            expected: "\\frac{1}{2}",
            description: "rac command should be converted to \frac"
        },
        {
            input: "\\frac{1}{2} + rac{3}{4}",
            expected: "\\frac{1}{2} + \\frac{3}{4}",
            description: "Mixed \frac and rac commands"
        },
        {
            input: "\\frac{\\pi^{2}{6}",
            expected: "\\frac{\\pi^{2}}{6}",
            description: "Malformed fraction with superscript (should be fixed)"
        },
        {
            input: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}",
            expected: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}",
            description: "Complex expression with correct \frac (should not change)"
        }
    ];

    console.log("Testing \frac processing to ensure no truncation...\n");

    let passedTests = 0;
    let totalTests = testCases.length;

    testCases.forEach((testCase, index) => {
        const processed = processFractionNotation(testCase.input);
        const passed = processed === testCase.expected;
        
        if (passed) {
            console.log(`✅ Test ${index + 1} PASSED: ${testCase.description}`);
            passedTests++;
        } else {
            console.log(`❌ Test ${index + 1} FAILED: ${testCase.description}`);
            console.log(`   Input:    ${testCase.input}`);
            console.log(`   Expected: ${testCase.expected}`);
            console.log(`   Got:      ${processed}`);
        }
        console.log("");
    });

    console.log(`\nResults: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log("🎉 All tests passed! The \frac truncation issue should be fixed.");
    } else {
        console.log("⚠️  Some tests failed. The fix may need adjustment.");
    }
}

// Run the test
testFractionProcessing();