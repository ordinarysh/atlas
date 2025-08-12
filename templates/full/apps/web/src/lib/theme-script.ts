/**
 * Theme initialization script to prevent FOUC
 * 
 * This script should be inlined in the <head> to run before React hydrates.
 * It sets the initial theme based on localStorage or system preference.
 */
export const themeScript = `
  (function() {
    try {
      const storageKey = 'atlas-theme';
      const attribute = 'data-theme';
      
      // Get stored theme or default to 'system'
      const storedTheme = localStorage.getItem(storageKey) || 'system';
      
      // Resolve the actual theme to apply
      let resolvedTheme = storedTheme;
      if (storedTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = prefersDark ? 'dark' : 'light';
      }
      
      // Apply theme to root element
      document.documentElement.setAttribute(attribute, resolvedTheme);
    } catch (e) {
      // Fallback to light theme if anything fails
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
`.trim()