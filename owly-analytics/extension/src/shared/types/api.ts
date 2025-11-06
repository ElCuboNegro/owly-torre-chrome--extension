/**
 * API response types
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ServerHealth {
  status: string;
  service: string;
  version: string;
}

export interface AnalyticsOverview {
  periodDays: number;
  startDate: string;
  endDate: string;
  summary: {
    pageViews: number;
    totalTimeSeconds: number;
    totalTimeHours: number;
    interactions: number;
    sessions: number;
    avgSessionTime: number;
  };
  topDomains: Array<{
    domain: string;
    time: number;
  }>;
}
