/**
 * Background Service Worker (Manifest V3)
 * Coordinates data collection and syncing
 */

import { DataQueue } from './DataQueue';
import { apiClient } from '../shared/api/client';
import { generateId, now } from '../shared/utils/helpers';
import type { PageView, Interaction, TypedContent, VideoPlayback } from '../shared/types/activity';

console.log('[Background] Service worker starting...');

// Initialize data queue
const dataQueue = new DataQueue();

// Current session tracking
let currentSessionId: string | null = null;

/**
 * Initialize extension
 */
async function initialize() {
  console.log('[Background] Initializing...');

  // Check server health
  try {
    const health = await apiClient.checkHealth();
    console.log('[Background] Server health:', health);
  } catch (error) {
    console.error('[Background] Server not reachable:', error);
  }

  // Start new session
  await startSession();

  console.log('[Background] Initialization complete');
}

/**
 * Start a new browsing session
 */
async function startSession() {
  currentSessionId = generateId();

  try {
    await apiClient.createSession({
      id: currentSessionId,
      startTime: now(),
    });

    console.log('[Background] Session started:', currentSessionId);
  } catch (error) {
    console.error('[Background] Failed to create session:', error);
  }
}

/**
 * End current session
 */
async function endSession() {
  if (!currentSessionId) return;

  try {
    await dataQueue.flush(); // Flush pending data

    await apiClient.updateSession(currentSessionId, {
      endTime: now(),
    });

    console.log('[Background] Session ended:', currentSessionId);
    currentSessionId = null;
  } catch (error) {
    console.error('[Background] Failed to end session:', error);
  }
}

/**
 * Message handler - receives data from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);

  switch (message.type) {
    case 'PAGE_VIEW':
      handlePageView(message.data);
      sendResponse({ success: true });
      break;

    case 'INTERACTION':
      handleInteraction(message.data);
      sendResponse({ success: true });
      break;

    case 'TYPED_CONTENT':
      handleTypedContent(message.data);
      sendResponse({ success: true });
      break;

    case 'VIDEO_PLAYBACK':
      handleVideoPlayback(message.data);
      sendResponse({ success: true });
      break;

    case 'GET_SESSION_ID':
      sendResponse({ sessionId: currentSessionId });
      break;

    case 'GET_QUEUE_STATS':
      sendResponse(dataQueue.getStats());
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

/**
 * Handle page view data
 */
function handlePageView(data: Partial<PageView>) {
  const pageView: PageView = {
    id: data.id || generateId(),
    url: data.url!,
    title: data.title!,
    domain: data.domain!,
    timestamp: data.timestamp || now(),
    timeOnPage: data.timeOnPage || 0,
    activeTime: data.activeTime || 0,
    idleTime: data.idleTime || 0,
    scrollDepth: data.scrollDepth || 0,
    scrollSpeed: data.scrollSpeed,
    referrer: data.referrer,
    sessionId: currentSessionId || undefined,
    metadata: data.metadata,
  };

  dataQueue.addPageView(pageView);
}

/**
 * Handle interaction data
 */
function handleInteraction(data: Partial<Interaction>) {
  const interaction: Interaction = {
    id: data.id || generateId(),
    timestamp: data.timestamp || now(),
    interactionType: data.interactionType!,
    targetUrl: data.targetUrl,
    targetId: data.targetId,
    targetType: data.targetType,
    pageUrl: data.pageUrl!,
    sessionId: currentSessionId || undefined,
    metadata: data.metadata,
  };

  dataQueue.addInteraction(interaction);
}

/**
 * Handle typed content data
 */
function handleTypedContent(data: Partial<TypedContent>) {
  const typedContent: TypedContent = {
    id: data.id || generateId(),
    timestamp: data.timestamp || now(),
    content: data.content!,
    contentType: data.contentType!,
    platform: data.platform!,
    pageUrl: data.pageUrl!,
    sessionId: currentSessionId || undefined,
    metadata: data.metadata,
  };

  dataQueue.addTypedContent(typedContent);
}

/**
 * Handle video playback data
 */
function handleVideoPlayback(data: Partial<VideoPlayback>) {
  const videoPlayback: VideoPlayback = {
    id: data.id || generateId(),
    timestamp: data.timestamp || now(),
    url: data.url!,
    videoSrc: data.videoSrc,
    pageUrl: data.pageUrl!,
    platform: data.platform,
    title: data.title,
    channel: data.channel,
    duration: data.duration || 0,
    width: data.width,
    height: data.height,
    watchedDuration: data.watchedDuration || 0,
    completionRate: data.completionRate || 0,
    maxWatchedPosition: data.maxWatchedPosition || 0,
    playCount: data.playCount || 0,
    pauseCount: data.pauseCount || 0,
    seekEvents: data.seekEvents,
    watchedSegments: data.watchedSegments,
    playbackSpeed: data.playbackSpeed || 1.0,
    wasFullscreen: data.wasFullscreen || false,
    sessionId: currentSessionId || undefined,
    metadata: data.metadata,
  };

  dataQueue.addVideoPlayback(videoPlayback);
}

/**
 * Handle extension lifecycle events
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  await initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[Background] Browser started');
  await initialize();
});

// Handle before unload - flush data
self.addEventListener('beforeunload', async () => {
  console.log('[Background] Service worker unloading...');
  await endSession();
});

// Periodic session update (every 30 seconds)
setInterval(async () => {
  if (currentSessionId) {
    const stats = dataQueue.getStats();

    try {
      await apiClient.updateSession(currentSessionId, {
        pageViews: stats.total,
      });
    } catch (error) {
      console.error('[Background] Failed to update session:', error);
    }
  }
}, 30000);

// Initialize on load
initialize();
