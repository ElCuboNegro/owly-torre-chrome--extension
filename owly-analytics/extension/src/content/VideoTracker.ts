/**
 * VideoTracker - Tracks video playback across all platforms
 * Works with: YouTube, Netflix, Vimeo, embedded videos, etc.
 */

import { generateId, now } from '../shared/utils/helpers';

interface SeekEvent {
  from: number;
  to: number;
  timestamp: string;
}

interface TimeRange {
  start: number;
  end: number;
}

export class VideoTracker {
  private videos: Map<HTMLVideoElement, VideoSession> = new Map();
  private observer?: MutationObserver;

  constructor() {
    this.init();
  }

  private init() {
    console.log('[VideoTracker] Initializing...');

    // Track existing videos
    this.trackExistingVideos();

    // Watch for new videos added to page
    this.watchForNewVideos();

    // Platform-specific tracking
    this.initPlatformTracking();

    console.log('[VideoTracker] Initialized');
  }

  /**
   * Track all existing video elements
   */
  private trackExistingVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => this.trackVideo(video));
  }

  /**
   * Watch for new video elements added to DOM
   */
  private watchForNewVideos() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if node itself is video
            if (node instanceof HTMLVideoElement) {
              this.trackVideo(node);
            }
            // Check children
            const videos = node.querySelectorAll('video');
            videos.forEach((video) => this.trackVideo(video));
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Track a specific video element
   */
  private trackVideo(video: HTMLVideoElement) {
    // Skip if already tracking
    if (this.videos.has(video)) return;

    console.log('[VideoTracker] Tracking new video:', video.src);

    const session = new VideoSession(video);
    this.videos.set(video, session);

    // Listen for video removal
    const checkRemoved = setInterval(() => {
      if (!document.contains(video)) {
        clearInterval(checkRemoved);
        this.stopTracking(video);
      }
    }, 5000);
  }

  /**
   * Stop tracking a video
   */
  private stopTracking(video: HTMLVideoElement) {
    const session = this.videos.get(video);
    if (session) {
      session.sendData();
      session.destroy();
      this.videos.delete(video);
      console.log('[VideoTracker] Stopped tracking video');
    }
  }

  /**
   * Platform-specific tracking (YouTube, Netflix, etc.)
   */
  private initPlatformTracking() {
    const hostname = window.location.hostname;

    if (hostname.includes('youtube.com')) {
      this.trackYouTube();
    } else if (hostname.includes('netflix.com')) {
      this.trackNetflix();
    } else if (hostname.includes('vimeo.com')) {
      this.trackVimeo();
    }
  }

  /**
   * YouTube-specific tracking
   */
  private trackYouTube() {
    console.log('[VideoTracker] YouTube detected');

    // YouTube uses custom player, not native <video>
    // Extract video info from page
    const getVideoInfo = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v');

      if (!videoId) return null;

      return {
        platform: 'youtube' as const,
        videoId,
        title: document.title.replace(' - YouTube', ''),
        channel: document.querySelector('#channel-name')?.textContent?.trim(),
        url: window.location.href,
      };
    };

    // Send video info when found
    const checkInterval = setInterval(() => {
      const info = getVideoInfo();
      if (info) {
        clearInterval(checkInterval);
        this.sendVideoMetadata(info);
      }
    }, 1000);
  }

  /**
   * Netflix-specific tracking
   */
  private trackNetflix() {
    console.log('[VideoTracker] Netflix detected');

    // Netflix metadata is in the page
    const getNetflixInfo = () => {
      return {
        platform: 'netflix' as const,
        title: document.querySelector('.video-title')?.textContent?.trim() || 'Unknown',
        url: window.location.href,
      };
    };

    setTimeout(() => {
      this.sendVideoMetadata(getNetflixInfo());
    }, 2000);
  }

  /**
   * Vimeo-specific tracking
   */
  private trackVimeo() {
    console.log('[VideoTracker] Vimeo detected');
    // Similar approach to YouTube
  }

  /**
   * Send video metadata to background
   */
  private async sendVideoMetadata(data: any) {
    try {
      await chrome.runtime.sendMessage({
        type: 'VIDEO_METADATA',
        data,
      });
      console.log('[VideoTracker] Sent video metadata');
    } catch (error) {
      console.error('[VideoTracker] Failed to send metadata:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.videos.forEach((session) => {
      session.sendData();
      session.destroy();
    });
    this.videos.clear();

    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * VideoSession - Tracks a single video playback session
 */
class VideoSession {
  private id: string;
  private video: HTMLVideoElement;
  private startTime: Date;
  private lastPosition: number = 0;
  private watchedSegments: TimeRange[] = [];
  private seekEvents: SeekEvent[] = [];
  private playCount: number = 0;
  private pauseCount: number = 0;
  private maxPosition: number = 0;
  private wasFullscreen: boolean = false;
  private playbackSpeed: number = 1.0;
  private updateInterval?: number;

  constructor(video: HTMLVideoElement) {
    this.id = generateId();
    this.video = video;
    this.startTime = new Date();

    this.attachListeners();
    this.startTracking();
  }

  /**
   * Attach event listeners to video
   */
  private attachListeners() {
    // Playback events
    this.video.addEventListener('play', this.onPlay.bind(this));
    this.video.addEventListener('pause', this.onPause.bind(this));
    this.video.addEventListener('ended', this.onEnded.bind(this));
    this.video.addEventListener('seeked', this.onSeeked.bind(this));
    this.video.addEventListener('ratechange', this.onRateChange.bind(this));

    // Fullscreen
    document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  }

  private onPlay() {
    this.playCount++;
    console.log('[VideoSession] Play:', this.playCount);
  }

  private onPause() {
    this.pauseCount++;
    this.recordWatchedSegment();
    console.log('[VideoSession] Pause:', this.pauseCount);
  }

  private onEnded() {
    this.recordWatchedSegment();
    this.sendData();
    console.log('[VideoSession] Ended');
  }

  private onSeeked() {
    const from = this.lastPosition;
    const to = this.video.currentTime;

    this.seekEvents.push({
      from,
      to,
      timestamp: now(),
    });

    this.lastPosition = to;
    console.log('[VideoSession] Seeked:', from, '→', to);
  }

  private onRateChange() {
    this.playbackSpeed = this.video.playbackRate;
    console.log('[VideoSession] Speed:', this.playbackSpeed);
  }

  private onFullscreenChange() {
    this.wasFullscreen = this.wasFullscreen || !!document.fullscreenElement;
  }

  /**
   * Start tracking playback progress
   */
  private startTracking() {
    this.updateInterval = window.setInterval(() => {
      if (!this.video.paused) {
        const currentTime = this.video.currentTime;

        // Track max position reached
        this.maxPosition = Math.max(this.maxPosition, currentTime);

        // Update last position
        this.lastPosition = currentTime;
      }
    }, 1000);
  }

  /**
   * Record a watched segment
   */
  private recordWatchedSegment() {
    if (this.video.currentTime > this.lastPosition) {
      this.watchedSegments.push({
        start: this.lastPosition,
        end: this.video.currentTime,
      });
    }
  }

  /**
   * Calculate total watched duration
   */
  private calculateWatchedDuration(): number {
    return this.watchedSegments.reduce(
      (total, segment) => total + (segment.end - segment.start),
      0
    );
  }

  /**
   * Get video data
   */
  private getVideoData() {
    const duration = this.video.duration || 0;
    const watchedDuration = this.calculateWatchedDuration();

    return {
      id: this.id,
      url: this.video.src || window.location.href,
      videoSrc: this.video.src,
      pageUrl: window.location.href,
      timestamp: this.startTime.toISOString(),

      // Video info
      duration,
      width: this.video.videoWidth,
      height: this.video.videoHeight,

      // Playback metrics
      watchedDuration,
      completionRate: duration > 0 ? watchedDuration / duration : 0,
      maxWatchedPosition: this.maxPosition,

      // Behavior
      playCount: this.playCount,
      pauseCount: this.pauseCount,
      seekEvents: this.seekEvents,
      watchedSegments: this.watchedSegments,
      playbackSpeed: this.playbackSpeed,
      wasFullscreen: this.wasFullscreen,

      // Context
      sessionId: null, // Will be set by background
    };
  }

  /**
   * Send data to background
   */
  async sendData() {
    const data = this.getVideoData();

    // Only send if video was actually watched
    if (data.watchedDuration > 0) {
      try {
        await chrome.runtime.sendMessage({
          type: 'VIDEO_PLAYBACK',
          data,
        });
        console.log('[VideoSession] Sent video data:', {
          duration: data.duration.toFixed(1),
          watched: data.watchedDuration.toFixed(1),
          completion: (data.completionRate * 100).toFixed(1) + '%',
        });
      } catch (error) {
        console.error('[VideoSession] Failed to send data:', error);
      }
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
