/**
 * PageTracker - Tracks page views and user engagement
 */

import { generateId, getDomain, now } from '../shared/utils/helpers';
import { ContentExtractor } from './ContentExtractor';

export class PageTracker {
  private pageId: string;
  private startTime: number;
  private lastActivityTime: number;
  private activeTime: number = 0;
  private idleTime: number = 0;
  private isActive: boolean = true;
  private maxScrollDepth: number = 0;
  private activityCheckInterval?: number;
  private contentExtractor: ContentExtractor;
  private contentExtracted: boolean = false;

  constructor() {
    this.pageId = generateId();
    this.startTime = Date.now();
    this.lastActivityTime = Date.now();
    this.contentExtractor = new ContentExtractor();

    this.init();
  }

  private init() {
    console.log('[PageTracker] Initialized for:', window.location.href);

    // Track activity
    this.trackActivity();

    // Track scroll
    this.trackScroll();

    // Send data before page unload
    window.addEventListener('beforeunload', () => {
      this.sendPageView();
    });

    // Send data periodically (every 10 seconds if active)
    setInterval(() => {
      if (this.isActive) {
        this.sendPageView();
      }
    }, 10000);

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
        this.sendPageView();
      } else {
        this.isActive = true;
        this.lastActivityTime = Date.now();
      }
    });
  }

  /**
   * Track user activity to detect idle time
   */
  private trackActivity() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const updateActivity = () => {
      this.lastActivityTime = Date.now();
      this.isActive = true;
    };

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for idle time every second
    this.activityCheckInterval = window.setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivityTime;
      const idleThreshold = 3000; // 3 seconds

      if (timeSinceActivity > idleThreshold) {
        this.isActive = false;
        this.idleTime += 1;
      } else {
        this.activeTime += 1;
      }
    }, 1000);
  }

  /**
   * Track scroll depth
   */
  private trackScroll() {
    const updateScrollDepth = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      const scrollPercentage = (scrollTop + windowHeight) / documentHeight;
      this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercentage);
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    updateScrollDepth(); // Initial check
  }

  /**
   * Calculate time spent on page
   */
  private getTimeOnPage(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get page data
   */
  private getPageData() {
    // Extract content once when page is likely loaded
    // (after first few seconds of activity)
    let content = undefined;
    if (!this.contentExtracted && this.getTimeOnPage() > 2) {
      try {
        content = this.contentExtractor.extractPageContent();
        this.contentExtracted = true;
        console.log('[PageTracker] Extracted content:', {
          wordCount: content.metadata.wordCount,
          imageCount: content.images.length,
        });
      } catch (error) {
        console.error('[PageTracker] Failed to extract content:', error);
      }
    }

    return {
      id: this.pageId,
      url: window.location.href,
      title: document.title,
      domain: getDomain(window.location.href),
      timestamp: now(),
      timeOnPage: this.getTimeOnPage(),
      activeTime: this.activeTime,
      idleTime: this.idleTime,
      scrollDepth: Math.min(this.maxScrollDepth, 1),
      referrer: document.referrer || undefined,
      metadata: {
        // Include extracted content if available
        ...(content && {
          content: content.mainText,
          fullContent: content.fullText,
          metaDescription: content.metaDescription,
          images: content.images,
          links: content.links,
          ...content.metadata,
        }),
      },
    };
  }

  /**
   * Send page view data to background
   */
  async sendPageView() {
    const data = this.getPageData();

    try {
      await chrome.runtime.sendMessage({
        type: 'PAGE_VIEW',
        data,
      });

      console.log('[PageTracker] Sent page view data');
    } catch (error) {
      console.error('[PageTracker] Failed to send page view:', error);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
  }
}
