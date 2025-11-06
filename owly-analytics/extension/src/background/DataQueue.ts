/**
 * DataQueue - Batches and syncs data to backend
 */

import { apiClient } from '../shared/api/client';
import type {
  PageView,
  Interaction,
  TypedContent,
} from '../shared/types/activity';

interface QueueData {
  pageViews: PageView[];
  interactions: Interaction[];
  typedContent: TypedContent[];
}

export class DataQueue {
  private queue: QueueData = {
    pageViews: [],
    interactions: [],
    typedContent: [],
  };

  private flushInterval: number = 60000; // 1 minute
  private maxBatchSize: number = 50;
  private timerId?: number;

  constructor() {
    this.startAutoFlush();
  }

  /**
   * Add page view to queue
   */
  addPageView(pageView: PageView): void {
    this.queue.pageViews.push(pageView);
    console.log('[DataQueue] Added page view:', pageView.url);

    if (this.queue.pageViews.length >= this.maxBatchSize) {
      this.flush('pageViews');
    }
  }

  /**
   * Add interaction to queue
   */
  addInteraction(interaction: Interaction): void {
    this.queue.interactions.push(interaction);
    console.log('[DataQueue] Added interaction:', interaction.interactionType);

    if (this.queue.interactions.length >= this.maxBatchSize) {
      this.flush('interactions');
    }
  }

  /**
   * Add typed content to queue
   */
  addTypedContent(typedContent: TypedContent): void {
    this.queue.typedContent.push(typedContent);
    console.log('[DataQueue] Added typed content');

    if (this.queue.typedContent.length >= this.maxBatchSize) {
      this.flush('typedContent');
    }
  }

  /**
   * Flush specific queue or all queues
   */
  async flush(type?: keyof QueueData): Promise<void> {
    if (type) {
      await this.flushQueue(type);
    } else {
      await this.flushAll();
    }
  }

  /**
   * Flush all queues
   */
  private async flushAll(): Promise<void> {
    await Promise.all([
      this.flushQueue('pageViews'),
      this.flushQueue('interactions'),
      this.flushQueue('typedContent'),
    ]);
  }

  /**
   * Flush specific queue
   */
  private async flushQueue(type: keyof QueueData): Promise<void> {
    const items = this.queue[type];

    if (items.length === 0) {
      return;
    }

    console.log(`[DataQueue] Flushing ${items.length} ${type}...`);

    try {
      switch (type) {
        case 'pageViews':
          await apiClient.sendPageViews({ pageViews: items as PageView[] });
          break;
        case 'interactions':
          await apiClient.sendInteractions({
            interactions: items as Interaction[],
          });
          break;
        case 'typedContent':
          await apiClient.sendTypedContent({
            typedContent: items as TypedContent[],
          });
          break;
      }

      // Clear queue on success
      this.queue[type] = [];
      console.log(`[DataQueue] Successfully synced ${items.length} ${type}`);
    } catch (error) {
      console.error(`[DataQueue] Failed to sync ${type}:`, error);
      // Keep items in queue for retry
    }
  }

  /**
   * Start automatic flushing
   */
  private startAutoFlush(): void {
    this.timerId = window.setInterval(() => {
      this.flushAll();
    }, this.flushInterval);

    console.log(
      `[DataQueue] Auto-flush started (interval: ${this.flushInterval}ms)`
    );
  }

  /**
   * Stop automatic flushing
   */
  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
      console.log('[DataQueue] Auto-flush stopped');
    }
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      pageViews: this.queue.pageViews.length,
      interactions: this.queue.interactions.length,
      typedContent: this.queue.typedContent.length,
      total:
        this.queue.pageViews.length +
        this.queue.interactions.length +
        this.queue.typedContent.length,
    };
  }
}
