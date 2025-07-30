(function() {
  // Configure MathJax before loading
  window.MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
    startup: {
      typeset: false,
      ready: () => {
        MathJax.startup.defaultReady();
        MathJax.typesetPromise();
      }
    }
  };

  const src = chrome.runtime.getURL('mathjax/tex-chtml-full.js');
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
})();
