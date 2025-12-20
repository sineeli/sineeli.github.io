/**
 * Simple Dark/Light Theme Toggle with PJAX support
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme-mode';
  const TOGGLE_ID = 'dark-mode-toggle';
  const DARK_CLASS = 'dark-mode';
  const HLJS_LIGHT_ID = 'hljs-theme-light';
  const HLJS_DARK_ID = 'hljs-theme-dark';
  let initialized = false;

  function applyHighlightTheme(isDark) {
    const light = document.getElementById(HLJS_LIGHT_ID);
    const dark = document.getElementById(HLJS_DARK_ID);
    if (!light || !dark) return;
    light.disabled = !!isDark;
    dark.disabled = !isDark;
  }

  function applyTheme(isDark) {
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
    applyHighlightTheme(isDark);
    const btn = document.getElementById(TOGGLE_ID);
    if (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains(DARK_CLASS);
    const newMode = !isDark;
    applyTheme(newMode);
    localStorage.setItem(STORAGE_KEY, String(newMode));
  }

  function init() {
    // Prevent duplicate initialization
    if (initialized) return;
    
    // Read preference from localStorage (default to light mode)
    const stored = localStorage.getItem(STORAGE_KEY);
    const isDark = stored !== null ? stored === 'true' : false;
    
    // Apply immediately to avoid flash
    applyTheme(isDark);

    // Attach click handler when DOM ready
    function attachHandler() {
      const btn = document.getElementById(TOGGLE_ID);
      if (btn) {
        // Remove old handler if exists
        btn.removeEventListener('click', handleClick);
        btn.addEventListener('click', handleClick);
        initialized = true;
      }
    }

    function handleClick(e) {
      e.preventDefault();
      toggleTheme();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachHandler);
    } else {
      attachHandler();
    }
  }

  // Initial load
  init();
  
  // Reinitialize on PJAX navigation
  document.addEventListener('pjax:complete', function() {
    initialized = false;
    init();
  });
})();
