/*  src/app.js  – compiled → build/app.js
    Bundles MathJax auto‑render + our logic.
*/
import './app.css';

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

// Configure MathJax
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
    typeset: false, // we'll typeset manually
    ready: () => {
      mathjaxLoaded = true;
      console.log('MathJax is ready.');
      // Trigger rendering if it was enabled before MathJax loaded
      if (isEnabled) {
        safeRender();
      }
      window.MathJax.startup.defaultReady();
    }
  }
};

// Load MathJax
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = chrome.runtime.getURL('mathjax/es5/tex-chtml-full.js');
script.async = true;
document.head.appendChild(script);


(async function main () {
  const { allowedDomains = [] } = await chrome.storage.local.get("allowedDomains");
  
  // Allow local files (file://) and check domain allowlist for web pages
  const isLocalFile = location.protocol === 'file:';
  const isDomainAllowed = allowedDomains.includes(location.hostname);
  
  isEnabled = isLocalFile || isDomainAllowed;
  
  if (isEnabled) {
    enableRendering();
  }

  /* listen for domain updates */
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === "domain-updated" && msg.allowed) {
      const newIsEnabled = location.protocol === 'file:' || msg.allowed.includes(location.hostname);
      
      if (newIsEnabled && !isEnabled) {
        // Turning ON - enable rendering
        isEnabled = true;
        enableRendering();
        setupNavigationHandlers(); // Also setup navigation detection
      } else if (!newIsEnabled && isEnabled) {
        // Turning OFF - disable rendering and restore original text
        isEnabled = false;
        disableRendering();
      }
    }
  });

  /* Handle single-page app navigation */
  setupNavigationHandlers();
})();

// Keep track of whether navigation handlers are already set up
let navigationHandlersSetup = false;

function setupNavigationHandlers() {
  if (!isEnabled || navigationHandlersSetup) return;
  
  navigationHandlersSetup = true;
  let lastUrl = location.href;
  
  // Create a debounced navigation handler
  const debouncedNavigationHandler = debounce(handleNavigation, 100);

  const navigationObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      debouncedNavigationHandler();
    }
  });

  navigationObserver.observe(document.body, { childList: true, subtree: true });
  
  // Handle back/forward navigation
  window.addEventListener('popstate', debouncedNavigationHandler);
}

function handleNavigation() {
  if (!isEnabled) return;
  console.debug('WebTeX: Detected navigation, re-rendering math');
  safeRender();
}

function enableRendering() {
  safeRender();

  /* re‑render on DOM changes */
  observer = new MutationObserver(debounce(muts => {
    if (mutationsOnlyRipple(muts) || userIsSelectingText() || typingInsideActiveElement(muts)) {
      return;
    }

    muts.flatMap(m => [...m.addedNodes])
        .filter(n => n.nodeType === 1 && !n.closest('.webtex-ignore'))
        .forEach(safeRender);
  }, 200));
  observer.observe(document.body, { childList:true, subtree:true });
}

function disableRendering() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  // Use MathJax's API to clear the rendered math
  if (window.MathJax && window.MathJax.typesetClear) {
    window.MathJax.typesetClear();
  }
}

/* ---------- core ---------- */

function preprocessMathText(node) {
  if (!node || !node.childNodes) return;
  node.childNodes.forEach(child => {
    if (child.nodeType === 3) { // Text node
      let text = child.textContent;
      
      text = decodeHTMLEntities(text);
      
      // Special handling for environments that should be display math
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

function safeRender (root = document.body) {
    if (!isEnabled || !mathjaxLoaded) {
        return;
    }
    try {
        preprocessMathText(root);
        
        // Find all math in the document and render it
        window.MathJax.typesetPromise([root]).catch(err => {
            console.warn('WebTeX: MathJax rendering error:', err);
        });
    } catch (e) {
        console.error('WebTeX: Error during rendering', e);
    }
}


/* ---------- helpers ---------- */

function nodeIsEditable (n) {
  if (n.getAttribute && n.getAttribute('contenteditable') === 'false') return false;
  return n.isContentEditable || (n.nodeType === 1 && /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName));
}

function typingInsideActiveElement (muts) {
  const active = document.activeElement;
  if (!active || !nodeIsEditable(active)) return false;
  return muts.every(m => active.contains(m.target));
}

function userIsSelectingText () {
  const sel = document.getSelection();
  return sel && sel.rangeCount > 0 && !sel.isCollapsed;
}

function isRippleNode (n) {
  return n.nodeType === 1 && n.classList && (
    n.classList.contains("mat-ripple") ||
    n.classList.contains("mdc-button__ripple") ||
    n.classList.contains("mat-focus-indicator")
  );
}
function mutationsOnlyRipple (muts) {
  return muts.every(m =>
    [...m.addedNodes, ...m.removedNodes].every(isRippleNode)
  );
}

function debounce (fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
