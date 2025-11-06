/**
 * API client for communicating with backend
 */

import type {
  PageViewBatch,
  InteractionBatch,
  TypedContentBatch,
  Session,
} from '../types/activity';
import type { ServerHealth, AnalyticsOverview } from '../types/api';

const API_BASE_URL = 'http://localhost:3000';

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<ServerHealth> {
    return this.request<ServerHealth>('/health');
  }

  // Data ingestion
  async sendPageViews(data: PageViewBatch): Promise<any> {
    return this.request('/api/v1/data/page-views', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendInteractions(data: InteractionBatch): Promise<any> {
    return this.request('/api/v1/data/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendTypedContent(data: TypedContentBatch): Promise<any> {
    return this.request('/api/v1/data/typed-content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createSession(session: Partial<Session>): Promise<any> {
    return this.request('/api/v1/data/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async updateSession(
    sessionId: string,
    update: Partial<Session>
  ): Promise<any> {
    return this.request(`/api/v1/data/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }

  // Analytics
  async getOverview(days: number = 7): Promise<AnalyticsOverview> {
    return this.request<AnalyticsOverview>(
      `/api/v1/analytics/overview?days=${days}`
    );
  }

  async getTimeSeries(days: number = 7): Promise<any> {
    return this.request(`/api/v1/analytics/time-series?days=${days}`);
  }

  async getCategories(days: number = 7): Promise<any> {
    return this.request(`/api/v1/analytics/categories?days=${days}`);
  }
}

export const apiClient = new APIClient();
