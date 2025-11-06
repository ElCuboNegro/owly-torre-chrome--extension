/**
 * InteractionTracker - Tracks clicks and other interactions
 */

import { generateId, now } from '../shared/utils/helpers';

export class InteractionTracker {
  constructor() {
    this.init();
  }

  private init() {
    console.log('[InteractionTracker] Initialized');

    // Track clicks
    document.addEventListener('click', (e) => this.handleClick(e), true);

    // Track form submissions
    document.addEventListener('submit', (e) => this.handleSubmit(e), true);
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Get link if clicked
    const link = target.closest('a');
    const button = target.closest('button');

    if (link) {
      this.trackInteraction({
        interactionType: 'click_link',
        targetUrl: link.href,
        targetType: 'link',
        pageUrl: window.location.href,
        metadata: {
          linkText: link.textContent?.trim(),
        },
      });
    } else if (button) {
      this.trackInteraction({
        interactionType: 'click_button',
        targetType: 'button',
        pageUrl: window.location.href,
        metadata: {
          buttonText: button.textContent?.trim(),
          buttonType: button.getAttribute('type'),
        },
      });
    }
  }

  /**
   * Handle form submissions
   */
  private handleSubmit(event: Event) {
    const form = event.target as HTMLFormElement;

    this.trackInteraction({
      interactionType: 'form_submit',
      targetType: 'form',
      pageUrl: window.location.href,
      metadata: {
        formAction: form.action,
        formMethod: form.method,
      },
    });
  }

  /**
   * Track interaction
   */
  private async trackInteraction(data: {
    interactionType: string;
    targetUrl?: string;
    targetType?: string;
    pageUrl: string;
    metadata?: any;
  }) {
    const interaction = {
      id: generateId(),
      timestamp: now(),
      ...data,
    };

    try {
      await chrome.runtime.sendMessage({
        type: 'INTERACTION',
        data: interaction,
      });

      console.log('[InteractionTracker] Tracked:', interaction.interactionType);
    } catch (error) {
      console.error('[InteractionTracker] Failed to track interaction:', error);
    }
  }
}
