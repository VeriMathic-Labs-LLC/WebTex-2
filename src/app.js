/*  src/app.js  – compiled → build/app.js
    Enhanced WebTeX with KaTeX + MathJax fallback + custom parser
*/
import './app.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/* -------------------------------------------------- */
// Reusable entity decoder for performance
function decodeHTMLEntities(text) {
  return text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
}

/* -------------------------------------------------- */
let observer = null;
let isEnabled = false;
let mathjaxLoaded = false;
let katexLoaded = true; // KaTeX is bundled
let rendererState = {
  katexSuccess: 0,
  mathjaxFallback: 0,
  customParserFallback: 0,
  totalAttempts: 0
};

// Expose renderer state globally for debugging
window.rendererState = rendererState;

// Enhanced MathJax configuration
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'input', 'select', 'button'],
    ignoreHtmlClass: 'webtex-ignore',
    processHtmlClass: 'webtex-process'
  },
  startup: {
    typeset: false,
    ready: () => {
      mathjaxLoaded = true;
      console.log('WebTeX: MathJax is ready for fallback rendering.');
      if (isEnabled) {
        safeRender();
      }
      window.MathJax.startup.defaultReady();
    }
  }
};

// MathJax removed – KaTeX-only build

/* -------------------------------------------------- */
// Custom LaTeX Parser for edge cases
class CustomLatexParser {
  /* Quick heuristic: does this expression likely need preprocessing? */
  canHandle(tex) {
    return /\\text\{[^}]*(_\d+\^\d+|\^\d+_\d+|rac|\\begin\{(?:equation|align)\})/u.test(tex);
  }

  /* Main entry converting unsupported constructs into KaTeX-friendly ones */
  simplify(tex) {
    let t = this.stripControlChars(tex);
    t = this.processFractionNotation(t);
    t = this.processNuclearNotation(t);
    t = this.processEquationEnvironments(t);
    t = this.processAlignEnvironment(t);
    return t;
  }

  stripControlChars(str) {
    return str.replace(/[\f\v\r]/g, '');
  }

  /* rac27 -> \frac{2}{7}, rac{1}{7} -> \frac{1}{7} */
  processFractionNotation(str) {
    // rac{num}{den}
    str = str.replace(/(?:\\f?rac|rac)\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
    // rac27 pattern
    str = str.replace(/(?:\\f?rac|rac)(\d)(\d+)/g, (_, a, b) => `\\frac{${a}}{${b}}`);
    return str;
  }

  /* Converts nuclear notation inside \text{} into proper super/sub scripts */
  processNuclearNotation(str) {
    // pattern _Z^A Symbol
    str = str.replace(/\\text\{_?(\d+)\^(\d+)\s+([^}]+)\}/g, (_, Z, A, sym) => `{ }^{${A}}_{${Z}}\\text{${sym}}`);
    // pattern ^A_Z Symbol
    str = str.replace(/\\text\{\^\{(\d+)\}_\{(\d+)\}\s*([^}]+)\}/g, (_, A, Z, sym) => `{ }^{${A}}_{${Z}}\\text{${sym}}`);
    return str;
  }

  /* Strip equation environment wrappers */
  processEquationEnvironments(str) {
    return str.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, '$1');
  }

  /* Replace align with aligned */
  processAlignEnvironment(str) {
    return str.replace(/\\begin\{align\}([\s\S]*?)\\end\{align\}/g, '\\begin{aligned}$1\\end{aligned}');
  }

  /* Fallback render as plain text */
  renderFallback(tex, displayMode = false) {
    const span = document.createElement('span');
    span.className = 'webtex-custom-fallback';
    span.textContent = tex;
    span.style.display = displayMode ? 'block' : 'inline-block';
    return span;
  }
}

const customParser = new CustomLatexParser();

/* -------------------------------------------------- */
// Enhanced rendering function with intelligent fallback
async function renderMathExpression(tex, displayMode = false, element = null) {
  rendererState.totalAttempts++;
  
  // Try KaTeX first
  try {
    // Preprocess the LaTeX to handle Unicode characters
    const processedTex = handleUnicodeInMath(tex);
    
    const katexOptions = {
      displayMode: displayMode,
      throwOnError: false,
      errorColor: 'inherit',
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
        "\\rac": "\\frac"
      },
      // Handle Unicode characters better
      minRuleThickness: 0.05,
      maxSize: 1000,
      maxExpand: 1000
    };
    
    const rendered = katex.renderToString(processedTex, katexOptions);
    rendererState.katexSuccess++;
    
    if (element) {
      element.innerHTML = rendered;
      element.classList.add('webtex-katex-rendered');
    }
    
    return { success: true, method: 'katex', element: element };
  } catch (katexError) {
    console.debug('WebTeX: KaTeX failed, trying MathJax fallback:', katexError.message);
    
    // Try MathJax fallback
    if (mathjaxLoaded) {
      try {
        if (element) {
          element.className = 'mj';
          element.innerHTML = displayMode ? `\\[${tex}\\]` : `\\(${tex}\\)`;
          
          await window.MathJax.typesetPromise([element]);
          rendererState.mathjaxFallback++;
          element.classList.add('webtex-mathjax-rendered');
          
          return { success: true, method: 'mathjax', element: element };
        }
      } catch (mathjaxError) {
        console.debug('WebTeX: MathJax fallback failed:', mathjaxError.message);
      }
    }
    
    // Try custom parser as last resort
    if (customParser.canHandle(tex)) {
      try {
        const simplified = customParser.simplify(tex);
        const processedSimplified = handleUnicodeInMath(simplified);
        const rendered = katex.renderToString(processedSimplified, { displayMode, throwOnError: false });
        
        if (element) {
          element.innerHTML = rendered;
          element.classList.add('webtex-custom-rendered');
        }
        
        rendererState.customParserFallback++;
        return { success: true, method: 'custom', element: element };
      } catch (customError) {
        console.debug('WebTeX: Custom parser failed:', customError.message);
      }
    }
    
    // Final fallback - show original text with error styling
    if (element) {
      const fallbackElement = customParser.renderFallback(tex, displayMode);
      element.innerHTML = '';
      element.appendChild(fallbackElement);
      element.classList.add('webtex-error-fallback');
    }
    
    return { success: false, method: 'error', element: element };
  }
}

/* -------------------------------------------------- */
// Enhanced math detection and processing
function findMathExpressions(root) {
  const mathExpressions = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip if parent is already processed or should be ignored
        if (node.parentElement && (
          node.parentElement.classList.contains('webtex-processed') ||
          node.parentElement.classList.contains('webtex-ignore') ||
          node.parentElement.closest('.webtex-ignore')
        )) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent;
    
    // Enhanced regex patterns for math detection
    const patterns = [
      // Display math
      { pattern: /\$\$([\s\S]*?)\$\$/g, display: true },
      { pattern: /\\\[([\s\S]*?)\\\]/g, display: true },
      // Inline math
      { pattern: /\$([^\$\n]+?)\$/g, display: false },
      { pattern: /\\\(([\s\S]*?)\\\)/g, display: false }
    ];

    patterns.forEach(({ pattern, display }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const tex = decodeHTMLEntities(match[1].trim());
        if (tex) {
          mathExpressions.push({
            tex: tex,
            display: display,
            node: node,
            match: match[0],
            start: match.index,
            end: match.index + match[0].length
          });
        }
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
    
    const text = expr.node.textContent;
    const container = document.createElement('span');
    container.className = 'webtex-math-container';
    
    // Replace the math expression with a container
    const before = text.substring(0, expr.start);
    const after = text.substring(expr.end);
    
    if (before) {
      container.appendChild(document.createTextNode(before));
    }
    
    const mathElement = document.createElement('span');
    mathElement.className = `webtex-math ${expr.display ? 'webtex-display' : 'webtex-inline'}`;
    
    const result = await renderMathExpression(expr.tex, expr.display, mathElement);
    
    if (result.success) {
      container.appendChild(mathElement);
    } else {
      // Keep original text if all renderers failed
      container.appendChild(document.createTextNode(expr.match));
    }
    
    if (after) {
      container.appendChild(document.createTextNode(after));
    }
    
    expr.node.parentNode.replaceChild(container, expr.node);
    processedNodes.add(expr.node);
  }
}

/* -------------------------------------------------- */
// Enhanced preprocessing with Unicode handling
function preprocessMathText(node) {
  if (!node || !node.childNodes) return;
  
  node.childNodes.forEach(child => {
    if (child.nodeType === 3) { // Text node
      let text = child.textContent;
      text = decodeHTMLEntities(text);
      
      // Enhanced environment handling
      text = text.replace(/\$\s*\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}\s*\$/g, (m, env, content) => {
        const decodedContent = decodeHTMLEntities(content);
        return '$$\\begin{' + env + '}' + decodedContent + '\\end{' + env + '}$$';
      });
      
      child.textContent = text;
    } else if (child.nodeType === 1 && !["SCRIPT","STYLE","TEXTAREA","PRE","CODE","NOSCRIPT","INPUT","SELECT","BUTTON"].includes(child.tagName)) {
      preprocessMathText(child);
    }
  });
}

// Function to handle Unicode characters in math expressions
function handleUnicodeInMath(tex) {
  // Common Unicode fractions
  const unicodeFractions = {
    '½': '\\frac{1}{2}',
    '⅓': '\\frac{1}{3}',
    '⅔': '\\frac{2}{3}',
    '¼': '\\frac{1}{4}',
    '¾': '\\frac{3}{4}',
    '⅕': '\\frac{1}{5}',
    '⅖': '\\frac{2}{5}',
    '⅗': '\\frac{3}{5}',
    '⅘': '\\frac{4}{5}',
    '⅙': '\\frac{1}{6}',
    '⅚': '\\frac{5}{6}',
    '⅐': '\\frac{1}{7}',
    '⅛': '\\frac{1}{8}',
    '⅜': '\\frac{3}{8}',
    '⅝': '\\frac{5}{8}',
    '⅞': '\\frac{7}{8}',
    '⅑': '\\frac{1}{9}',
    '⅒': '\\frac{1}{10}'
  };
  
  let processed = tex;
  
  // Replace Unicode fractions with LaTeX fractions
  Object.entries(unicodeFractions).forEach(([unicode, latex]) => {
    processed = processed.replace(new RegExp(unicode, 'g'), latex);
  });

  // Common Unicode math symbols
  processed = processed.replace(/→/g, '\\rightarrow');
  processed = processed.replace(/∈/g, '\\in');
  processed = processed.replace(/⊆/g, '\\subseteq');
  processed = processed.replace(/ν/g, '\\nu');
  processed = processed.replace(/γ/g, '\\gamma');
  
  // Handle other Unicode characters by wrapping them in \text{}
  // This regex matches Unicode characters that are not already in \text{} or other commands
  processed = processed.replace(/([^\u0000-\u007F])/g, (match, char) => {
    // Skip if already in \text{} or other commands
    if (processed.includes(`\\text{${char}}`) || 
        processed.includes(`\\mathrm{${char}}`) ||
        processed.includes(`\\mathit{${char}}`)) {
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
      
      // Log rendering statistics
      console.log('WebTeX: Rendering complete', {
        total: rendererState.totalAttempts,
        katex: rendererState.katexSuccess,
        mathjax: rendererState.mathjaxFallback,
        custom: rendererState.customParserFallback,
        successRate: ((rendererState.katexSuccess + rendererState.mathjaxFallback + rendererState.customParserFallback) / rendererState.totalAttempts * 100).toFixed(1) + '%'
      });
    }
  } catch (e) {
    console.error('WebTeX: Error during rendering', e);
  }
}

/* -------------------------------------------------- */
// Main initialization
(async function main() {
  const { allowedDomains = [] } = await chrome.storage.local.get("allowedDomains");
  
  const isLocalFile = location.protocol === 'file:';
  const isDomainAllowed = allowedDomains.includes(location.hostname);
  
  isEnabled = isLocalFile || isDomainAllowed;
  
  if (isEnabled) {
    enableRendering();
  }

  // Listen for domain updates
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === "domain-updated" && msg.allowed) {
      const newIsEnabled = location.protocol === 'file:' || msg.allowed.includes(location.hostname);
      
      if (newIsEnabled && !isEnabled) {
        isEnabled = true;
        enableRendering();
        setupNavigationHandlers();
      } else if (!newIsEnabled && isEnabled) {
        isEnabled = false;
        disableRendering();
      }
    }
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
  window.addEventListener('popstate', debouncedNavigationHandler);
}

function handleNavigation() {
  if (!isEnabled) return;
  console.debug('WebTeX: Detected navigation, re-rendering math');
  safeRender();
}

function enableRendering() {
  safeRender();

  observer = new MutationObserver(debounce(muts => {
    if (mutationsOnlyRipple(muts) || userIsSelectingText() || typingInsideActiveElement(muts)) {
      return;
    }

    muts.flatMap(m => [...m.addedNodes])
        .filter(n => n.nodeType === 1 && !n.closest('.webtex-ignore'))
        .forEach(safeRender);
  }, 200));
  
  observer.observe(document.body, { childList: true, subtree: true });
}

function disableRendering() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  // Clear KaTeX rendered elements
  document.querySelectorAll('.webtex-katex-rendered, .webtex-custom-rendered').forEach(el => {
    el.classList.remove('webtex-katex-rendered', 'webtex-custom-rendered');
  });
}

/* -------------------------------------------------- */
// Helper functions
function nodeIsEditable(n) {
  if (n.getAttribute && n.getAttribute('contenteditable') === 'false') return false;
  return n.isContentEditable || (n.nodeType === 1 && /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName));
}

function typingInsideActiveElement(muts) {
  const active = document.activeElement;
  if (!active || !nodeIsEditable(active)) return false;
  return muts.every(m => active.contains(m.target));
}

function userIsSelectingText() {
  const sel = document.getSelection();
  return sel && sel.rangeCount > 0 && !sel.isCollapsed;
}

function isRippleNode(n) {
  return n.nodeType === 1 && n.classList && (
    n.classList.contains("mat-ripple") ||
    n.classList.contains("mdc-button__ripple") ||
    n.classList.contains("mat-focus-indicator")
  );
}

function mutationsOnlyRipple(muts) {
  return muts.every(m =>
    [...m.addedNodes, ...m.removedNodes].every(isRippleNode)
  );
}

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
