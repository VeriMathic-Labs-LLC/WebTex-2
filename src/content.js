(async function() {
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    },
    svg: { fontCache: 'global' }
  };
  await import('mathjax/es5/tex-mml-chtml.js');
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
})();
