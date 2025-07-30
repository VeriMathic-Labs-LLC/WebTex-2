/*  src/app.js  – compiled → build/app.js
    Bundles KaTeX auto‑render + our logic with custom renderer fallback.
*/
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";
import './app.css';
import LatexRenderer from './latex-renderer.js';

const DELIMITERS = [
  { left: "$$", right: "$$", display: true },
  { left: "\\[", right: "\\]", display: true },
  { left: "$",   right: "$",   display: false },
  { left: "\\(", right: "\\)", display: false },
];

/* -------------------------------------------------- */
// Inline math detector with negative lookbehind (Chromium supports this)
const INLINE_MATH_REGEX = /(?<!\\)\$(?!\$)([^\$\r\n]*?)\$(?!\$)/g;

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
let latexRenderer = null;
let useKatex = true; // Flag to control which renderer to use
let hasNuclearPhysicsContent = false; // Flag to detect nuclear physics content

// Initialize LaTeX renderer
async function initializeLatexRenderer() {
  try {
    latexRenderer = new LatexRenderer();
    // Wait for the renderer to be ready
    while (!latexRenderer.isReady) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Custom LaTeX renderer is ready (fallback)');
    
    // Trigger rendering if it was enabled before renderer loaded
    if (isEnabled) {
      safeRender();
    }
  } catch (error) {
    console.error('Failed to initialize custom LaTeX renderer:', error);
  }
}

(async function main () {
  const { allowedDomains = [] } = await chrome.storage.local.get("allowedDomains");
  
  // Allow local files (file://) and check domain allowlist for web pages
  const isLocalFile = location.protocol === 'file:';
  const isDomainAllowed = allowedDomains.includes(location.hostname);
  
  isEnabled = isLocalFile || isDomainAllowed;
  
  // Initialize custom LaTeX renderer as fallback
  await initializeLatexRenderer();
  
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
  
  // Handle clicks on links (for traditional navigation)
  document.addEventListener('click', (e) => {
    // Find the closest anchor element
    const link = e.target.closest('a');
    if (link && link.href && !link.target && link.href.startsWith(location.origin)) {
      // Internal link clicked - navigation will happen
      setTimeout(() => {
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          handleNavigation();
        }
      }, 50);
    }
  }, true);
  
  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      handleNavigation();
    }
  });
  
  // Override pushState and replaceState to detect programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        handleNavigation();
      }
    }, 0);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        handleNavigation();
      }
    }, 0);
  };
  
  // Monitor for significant DOM changes that might indicate navigation
  // This helps catch navigation in SPAs that don't change URLs
  watchForMajorDOMChanges();
}

function watchForMajorDOMChanges() {
  let contentHash = '';
  
  // Function to generate a simple hash of main content areas
  function getContentHash() {
    const main = document.querySelector('main, article, [role="main"], .content, #content') || document.body;
    // Get a simple representation of the content structure
    return main.children.length + '-' + main.textContent.length;
  }
  
  // Check periodically for major content changes
  setInterval(() => {
    const newHash = getContentHash();
    if (newHash !== contentHash && contentHash !== '') {
      contentHash = newHash;
      handleNavigation();
    }
    contentHash = newHash;
  }, 1000);
}

function handleNavigation() {
  if (!isEnabled) return;
  
  // Re-render the entire page on navigation
  console.debug('WebTeX: Detected navigation, re-rendering math');
  
  // Small delay to ensure new content is loaded
  setTimeout(() => {
    safeRender();
  }, 100);
}

function enableRendering() {
  safeRender();                              // ★ renamed from renderWholePage()

  /* re‑render on DOM changes ------------------------------------- */
  observer = new MutationObserver(debounce(muts => {
    /* ① If mutations are only UI ripples → ignore ---------------- */
    if (mutationsOnlyRipple(muts)) return;          // ★ new guard

    /* ② If user is selecting text → ignore ----------------------- */
    if (userIsSelectingText()) return;              // ★ new guard

    /* ③ If user is typing in an active editor → ignore ----------- */
    if (typingInsideActiveElement(muts)) return;    // ★ new guard

    /* ④ Otherwise, re‑render only the nodes that were added ------ */
    muts.flatMap(m => [...m.addedNodes])
        .filter(n => n.nodeType === 1)
        .forEach(safeRender);
  }, 200));
  observer.observe(document.body, { childList:true, subtree:true });
}

function disableRendering() {
  // Stop observing changes
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  if (useKatex) {
    // Remove all rendered KaTeX elements and restore original text
    const katexElements = document.querySelectorAll('.katex');
    katexElements.forEach(elem => {
      try {
        // Find the original math delimiter
        const mathAnnotation = elem.querySelector('annotation[encoding="application/x-tex"]');
        if (!mathAnnotation) return;
        
        const mathContent = mathAnnotation.textContent;
        
        // Check if parent element still exists (element might have been removed)
        if (!elem.parentNode) return;
        
        // Determine if it was display or inline math
        const isDisplay = elem.classList.contains('katex-display');
        let originalText = mathContent;
        
        // Try to restore with proper delimiters based on context
        if (isDisplay) {
          // For display math, check if it contains environments
          if (/\\begin\{/.test(mathContent)) {
            originalText = '$$' + mathContent + '$$';
          } else {
            // Could be $$ or \[ \], default to $$
            originalText = '$$' + mathContent + '$$';
          }
        } else {
          // For inline math, default to $
          originalText = '$' + mathContent + '$';
        }
        
        // Replace the KaTeX element with a text node
        const textNode = document.createTextNode(originalText);
        
        // Handle case where KaTeX might have wrapped content in additional spans
        const parent = elem.parentNode;
        if (parent.classList && parent.classList.contains('katex-display')) {
          parent.parentNode.replaceChild(textNode, parent);
        } else {
          elem.parentNode.replaceChild(textNode, elem);
        }
      } catch (e) {
        console.warn('WebTeX: Error restoring math element', e);
      }
    });
  } else {
    // Clear all rendered LaTeX using custom renderer
    if (latexRenderer) {
      latexRenderer.clear();
    }
  }
}

/* ---------- core ---------- */

function preprocessMathText(node) {
  if (!node || !node.childNodes) return;
  node.childNodes.forEach(child => {
    if (child.nodeType === 3) { // Text node
      let text = child.textContent;
      
      // First, decode HTML entities
      text = decodeHTMLEntities(text);
      
      // Check for nuclear physics patterns that KaTeX struggles with
      if (/\\text\{_[^}]+\^[^}]+\s+[^}]+\}/.test(text) || 
          /\\text\{[A-Za-z]+\^[^}]+\s+[^}]+\}/.test(text) ||
          /\\text\{\{[^}]+\}\^\{[^}]+\}\s+[^}]+\}/.test(text)) {
        hasNuclearPhysicsContent = true;
        console.log('Nuclear physics content detected, will use custom renderer');
      }
      
      // Handle block math: $$...$$ and \[...\]
      // Keep original spacing for display math
      text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m, inner) => {
        // Decode entities within math content as well
        const decodedInner = decodeHTMLEntities(inner);
        return inner !== undefined ? '$$' + decodedInner + '$$' : m;
      });
      
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, (m, inner) => {
        const decodedInner = inner.replace(/&amp;/g, '&')
                                  .replace(/&lt;/g, '<')
                                  .replace(/&gt;/g, '>')
                                  .replace(/&quot;/g, '"')
                                  .replace(/&#39;/g, "'");
        return inner !== undefined ? '\\[' + decodedInner + '\\]' : m;
      });
      
      // Special handling for single $ with multi-line content (convert to display math)
      // Check the full match to avoid already delimited content
      text = text.replace(/\$\s*\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}\s*\$/g, (m, env, content, offset, str) => {
        // Check if this is already within $$ delimiters
        if (offset > 0 && str[offset - 1] === '$') return m;
        if (offset + m.length < str.length && str[offset + m.length] === '$') return m;
        
        const decodedContent = decodeHTMLEntities(content);
        return '$$\\begin{' + env + '}' + decodedContent + '\\end{' + env + '}$$';
      });
      
      // Handle inline math: $...$ and \(...\)
      // Simplified approach - less restrictive pattern matching
      text = text.replace(INLINE_MATH_REGEX, (m, inner) => {
        const trimmed = inner.trim();
        
        // Check if this contains environments that should be display math
        if (/\\begin\{(align|equation|gather|multline)/.test(trimmed)) {
          return '$$' + trimmed + '$$';
        }
        
        // Accept any non-empty content that contains typical math characters
        // This is more permissive and handles mixed content better
        if (trimmed && (
          /\\[a-zA-Z]/.test(trimmed) ||           // LaTeX commands
          /[a-zA-Z]_/.test(trimmed) ||            // Subscripts
          /[a-zA-Z]\^/.test(trimmed) ||           // Superscripts  
          /[{}\[\]()]/.test(trimmed) ||           // Braces/brackets
          /[=+\-*/≤≥≠∞∂∇∆Ω∈∉⊂⊃∪∩∀∃∑∏∫√±]/.test(trimmed) || // Math symbols
          (/[a-zA-Z]/.test(trimmed) && /[0-9]/.test(trimmed)) // Variables with numbers
        )) {
          // Decode entities within inline math too
          const decodedTrimmed = decodeHTMLEntities(trimmed);
          return '$' + decodedTrimmed + '$';
        }
        return m;
      });
      
      // Handle \(...\) - parentheses delimited inline math
      text = text.replace(/\\\(([^\)\r\n]*?)\\\)/g, (m, inner) => {
        if (inner !== undefined) {
          const decodedInner = decodeHTMLEntities(inner);
          return '\\(' + decodedInner + '\\)';
        }
        return m;
      });
      
      child.textContent = text;
    } else if (child.nodeType === 1 && !["SCRIPT","STYLE","TEXTAREA","PRE","CODE","NOSCRIPT","INPUT","SELECT"].includes(child.tagName)) {
      preprocessMathText(child);
    }
  });
}

function safeRender (root = document.body) {
  try {
    preprocessMathText(root); // Preprocess before rendering
    
    // If nuclear physics content is detected, use custom renderer directly
    if (hasNuclearPhysicsContent) {
      console.log('Using custom renderer for nuclear physics content');
      useKatex = false;
      if (latexRenderer && latexRenderer.isReady) {
        latexRenderer.renderAllLatex(root);
      }
      return;
    }
    
    if (useKatex) {
      // Try KaTeX first
      try {
        let katexErrorCount = 0;
        
        renderMathInElement(root, {
          delimiters: DELIMITERS,
          ignoredTags: [
            "script","style","textarea","pre","code","noscript",
            "input","select",
          ],
          strict: "ignore",
          errorCallback: (msg, err) => {
            console.warn('KaTeX rendering error:', msg, err);
            katexErrorCount++;
            
            // If we get multiple errors, switch to custom renderer
            if (katexErrorCount > 2) {
              console.log('Multiple KaTeX errors detected, switching to custom renderer');
              useKatex = false;
              // Clear any KaTeX elements and re-render
              setTimeout(() => {
                const katexElements = document.querySelectorAll('.katex, .katex-error');
                katexElements.forEach(elem => {
                  if (elem.parentNode) {
                    const originalText = elem.getAttribute('data-original-text') || elem.textContent;
                    const textNode = document.createTextNode(originalText);
                    elem.parentNode.replaceChild(textNode, elem);
                  }
                });
                if (latexRenderer && latexRenderer.isReady) {
                  latexRenderer.renderAllLatex(root);
                }
              }, 10);
            }
            
            // Don't return the error message - let KaTeX continue
            return false;
          }
        });
        
        // Check for KaTeX errors after rendering
        setTimeout(() => {
          const katexErrors = document.querySelectorAll('.katex-error');
          if (katexErrors.length > 0) {
            console.log('KaTeX errors detected after rendering, switching to custom renderer');
            useKatex = false;
            // Clear KaTeX errors and re-render with custom renderer
            katexErrors.forEach(elem => {
              if (elem.parentNode) {
                const originalText = elem.getAttribute('data-original-text') || elem.textContent;
                const textNode = document.createTextNode(originalText);
                elem.parentNode.replaceChild(textNode, elem);
              }
            });
            if (latexRenderer && latexRenderer.isReady) {
              latexRenderer.renderAllLatex(root);
            }
          }
        }, 100);
        
      } catch (e) {
        console.warn('KaTeX failed completely, falling back to custom renderer:', e);
        useKatex = false;
        if (latexRenderer && latexRenderer.isReady) {
          latexRenderer.renderAllLatex(root);
        }
      }
    } else {
      // Use custom renderer
      if (latexRenderer && latexRenderer.isReady) {
        latexRenderer.renderAllLatex(root);
      }
    }
  } catch (e) {
    console.error('WebTeX: Error during rendering', e);
    // Final fallback - try custom renderer even if everything else fails
    if (latexRenderer && latexRenderer.isReady) {
      try {
        latexRenderer.renderAllLatex(root);
      } catch (fallbackError) {
        console.error('WebTeX: Custom renderer also failed:', fallbackError);
      }
    }
  }
}

/* ---------- helpers ---------- */

/* Skip nodes inside <input>, <textarea>, or [contenteditable] ------- */
function nodeIsEditable (n) {
  // Treat [contenteditable="false"] as non-editable despite the isContentEditable flag
  if (n.getAttribute && n.getAttribute('contenteditable') === 'false') return false;
  return n.isContentEditable ||
         (n.nodeType === 1 &&
          /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName));
}

/* Mutations entirely inside the active editor? --------------------- */
function typingInsideActiveElement (muts) {         // ★ new
  const active = document.activeElement;
  if (!active || !nodeIsEditable(active)) return false;
  return muts.every(m => active.contains(m.target));
}

/* True if the user currently has text selected -------------------- */
function userIsSelectingText () {
  const sel = document.getSelection();
  return sel && sel.rangeCount > 0 && !sel.isCollapsed;
}

/* Ignore Angular / MDC hover‑ripples to avoid re‑renders ------------ */
function isRippleNode (n) {                         // ★ new
  return n.nodeType === 1 && n.classList && (
    n.classList.contains("mat-ripple") ||
    n.classList.contains("mdc-button__ripple") ||
    n.classList.contains("mat-focus-indicator")
  );
}
function mutationsOnlyRipple (muts) {              // ★ new
  return muts.every(m =>
    [...m.addedNodes, ...m.removedNodes].every(isRippleNode)
  );
}

/* Simple debounce helper ------------------------------------------- */
function debounce (fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
