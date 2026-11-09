'use strict';

(() => {
  const DEFAULT_STYLE = 'classic';
  const styles = ['classic', 'editorial', 'noir', 'romantic'];
  const requestedStyle = new URLSearchParams(window.location.search).get('style');
  document.documentElement.dataset.style = styles.includes(requestedStyle) ? requestedStyle : DEFAULT_STYLE;
})();
