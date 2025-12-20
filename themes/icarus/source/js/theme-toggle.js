/**
 * Dark/Light Theme Toggle with PJAX support, Highlight.js theme switching,
 * and automatic system preference detection
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme-mode';
  const TOGGLE_ID = 'dark-mode-toggle';
  const DARK_CLASS = 'dark-mode';
  const HLJS_LIGHT_ID = 'hljs-theme-light';
  const HLJS_DARK_ID = 'hljs-theme-dark';

  /**
   * Check if system prefers dark mode
   */
  function getSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Get the effective theme (stored preference or system preference)
   */
  function getEffectiveTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    // No stored preference, use system preference
    return getSystemPreference();
  }

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
   * Toggle between dark and light mode (saves preference)
   */
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains(DARK_CLASS);
    const newMode = !isDark;
    applyTheme(newMode);
    // Save user preference
    localStorage.setItem(STORAGE_KEY, String(newMode));
  }

  /**
   * Handle click on toggle button
   */
  function handleClick(e) {
    e.preventDefault();
    toggleTheme();
  }

  /**
   * Handle system preference change
   */
  function handleSystemChange(e) {
    // Only auto-switch if user hasn't manually set a preference
    if (localStorage.getItem(STORAGE_KEY) === null) {
      applyTheme(e.matches);
    }
  }

  /**
   * Initialize theme and attach event handlers
   */
  function init() {
    // Apply effective theme immediately
    const isDark = getEffectiveTheme();
    applyTheme(isDark);

    // Attach click handler to toggle button
    const btn = document.getElementById(TOGGLE_ID);
    if (btn) {
      btn.onclick = handleClick;
    }
  }

  // Listen for system preference changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
      // Older Safari
      mediaQuery.addListener(handleSystemChange);
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Reinitialize on PJAX navigation
  document.addEventListener('pjax:complete', init);
  document.addEventListener('pjax:success', init);
})();
