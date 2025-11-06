/**
 * Content Script - Runs on all pages
 * Coordinates all tracking activities
 */

import { PageTracker } from './PageTracker';
import { InteractionTracker } from './InteractionTracker';

console.log('[Content] Owly Analytics content script loaded on:', window.location.href);

// Initialize trackers
let pageTracker: PageTracker | null = null;
let interactionTracker: InteractionTracker | null = null;

function initializeTrackers() {
  // Clean up existing trackers
  if (pageTracker) {
    pageTracker.destroy();
  }

  // Initialize new trackers
  pageTracker = new PageTracker();
  interactionTracker = new InteractionTracker();

  console.log('[Content] Trackers initialized');
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTrackers);
} else {
  initializeTrackers();
}

// Re-initialize on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('[Content] Navigation detected:', url);
    initializeTrackers();
  }
}).observe(document, { subtree: true, childList: true });
