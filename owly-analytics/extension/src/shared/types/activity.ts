/**
 * Activity tracking types
 * Matches backend schemas
 */

export interface PageView {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: string; // ISO string
  timeOnPage: number; // seconds
  activeTime: number; // seconds
  idleTime: number; // seconds
  scrollDepth: number; // 0-1
  scrollSpeed?: number;
  referrer?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface Interaction {
  id: string;
  timestamp: string; // ISO string
  interactionType: string; // 'click', 'like', 'share', etc.
  targetUrl?: string;
  targetId?: string;
  targetType?: string;
  pageUrl: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface TypedContent {
  id: string;
  timestamp: string; // ISO string
  content: string;
  contentType: string; // 'comment', 'post', 'message', 'search'
  platform: string; // 'facebook', 'twitter', 'google', etc.
  pageUrl: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface Session {
  id: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  duration: number; // seconds
  activeTime: number; // seconds
  pageViews: number;
  interactions: number;
  metadata?: Record<string, any>;
}

export interface PageViewBatch {
  pageViews: PageView[];
}

export interface InteractionBatch {
  interactions: Interaction[];
}

export interface TypedContentBatch {
  typedContent: TypedContent[];
}
