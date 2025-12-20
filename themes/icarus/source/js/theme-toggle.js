/**
 * Dark/Light Theme Toggle with PJAX support and Highlight.js theme switching
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme-mode';
  const TOGGLE_ID = 'dark-mode-toggle';
  const DARK_CLASS = 'dark-mode';
  const HLJS_LIGHT_ID = 'hljs-theme-light';
  const HLJS_DARK_ID = 'hljs-theme-dark';

  /**
   * Switch Highlight.js theme based on dark/light mode
   */
  function applyHighlightTheme(isDark) {
    const light = document.getElementById(HLJS_LIGHT_ID);
    const dark = document.getElementById(HLJS_DARK_ID);
    if (light && dark) {
      light.disabled = isDark;
      dark.disabled = !isDark;
    }
  }

  /**
   * Apply theme to document and update UI elements
   */
  function applyTheme(isDark) {
    // Toggle dark-mode class on html element
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
    
    // Switch highlight.js theme
    applyHighlightTheme(isDark);
    
    // Update toggle button
    const btn = document.getElementById(TOGGLE_ID);
    if (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }
    }
  }

  /**
   * Toggle between dark and light mode
   */
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains(DARK_CLASS);
    const newMode = !isDark;
    applyTheme(newMode);
    localStorage.setItem(STORAGE_KEY, String(newMode));
  }

  /**
   * Get stored theme preference
   */
  function getStoredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : false;
  }

  /**
   * Handle click on toggle button
   */
  function handleClick(e) {
    e.preventDefault();
    toggleTheme();
  }

  /**
   * Initialize theme and attach event handlers
   */
  function init() {
    // Apply stored theme immediately
    const isDark = getStoredTheme();
    applyTheme(isDark);

    // Attach click handler to toggle button
    const btn = document.getElementById(TOGGLE_ID);
    if (btn) {
      // Use onclick for proper removal/addition on PJAX navigations
      btn.onclick = handleClick;
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Reinitialize on PJAX navigation (for sites using PJAX)
  document.addEventListener('pjax:complete', init);
  
  // Also handle pjax:success for some PJAX implementations
  document.addEventListener('pjax:success', init);
})();
