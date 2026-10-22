/**
 * KaTeX Math Auto-renderer for Zola
 * Triggered only when math = true is enabled in front matter.
 */

(function () {
  'use strict';

  function initMath() {
    const contentArea =
      document.querySelector('.page-body') ||
      document.querySelector('.content-page') ||
      document.querySelector('article') ||
      document.querySelector('main') ||
      document.body;

    if (typeof renderMathInElement === 'function') {
      renderMathInElement(contentArea, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
        ignoredClasses: ['no-math'],
        throwOnError: false
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMath);
  } else {
    initMath();
  }
})();
