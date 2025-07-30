// Inject MathJax into the page, scoped and non-destructive
(async function() {
  if (window.top !== window) return;
  if (window.__webtex_mathjax_injected) return;
  window.__webtex_mathjax_injected = true;

  // Check if enabled
  const enabled = await new Promise(resolve => {
    if (!chrome.storage) return resolve(true); // fallback: always on
    chrome.storage.sync.get({webtexEnabled: true}, data => resolve(data.webtexEnabled));
  });
  if (!enabled) return;

  // Set MathJax config directly (CSP safe)
  window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoreHtmlClass: 'webtex-ignore',
        processHtmlClass: 'webtex-process',
      },
      svg: {
        fontCache: 'global',
      },
      startup: {
        typeset: false,
      },
    };


  // Inject MathJax script from extension bundle
  const mathjaxScript = document.createElement('script');
  mathjaxScript.type = 'text/javascript';
  mathjaxScript.src = chrome.runtime.getURL('mathjax/es5/tex-svg.js');
  mathjaxScript.onload = function() {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  };
  document.documentElement.appendChild(mathjaxScript);

})();
