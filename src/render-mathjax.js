'use strict';

// Configure MathJax before loading the library
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  },
  svg: {
    fontCache: 'global'
  }
};

// Dynamically load the MathJax script from the extension package
const mjScript = document.createElement('script');
mjScript.src = chrome.runtime.getURL('mathjax/tex-svg.js');
mjScript.defer = true;

document.documentElement.appendChild(mjScript);

mjScript.onload = () => {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise();
  }
};
