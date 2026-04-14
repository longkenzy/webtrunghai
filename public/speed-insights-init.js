/**
 * Vercel Speed Insights Initialization
 * This script initializes Speed Insights tracking for the application
 */
(function() {
  // Only load in production (when deployed on Vercel)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('[Speed Insights] Skipping in development mode');
    return;
  }

  // Create the Speed Insights script tag
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://va.vercel-scripts.com/v1/speed-insights/script.js';
  
  // Optional: Add error handling
  script.onerror = function() {
    console.warn('[Speed Insights] Failed to load tracking script');
  };
  
  // Append to head
  document.head.appendChild(script);
  
  console.log('[Speed Insights] Initialized');
})();
