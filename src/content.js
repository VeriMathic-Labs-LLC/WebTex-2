(() => {
  if (window.WebTexMathJaxLoaded) return;
  window.WebTexMathJaxLoaded = true;

  const config = document.createElement('script');
  config.type = 'text/javascript';
  config.textContent = `window.MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
    startup: { typeset: false }
  };`;
  document.documentElement.appendChild(config);

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL('mathjax/tex-mml-chtml.js');
  script.onload = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  };
  document.documentElement.appendChild(script);
})();
