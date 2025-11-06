/**
 * ContentExtractor - Extracts full content from web pages
 * Sends everything to backend for processing (no local ML)
 */

export class ContentExtractor {
  /**
   * Extract all meaningful content from the page
   */
  extractPageContent(): {
    mainText: string;
    fullText: string;
    title: string;
    metaDescription?: string;
    images: string[];
    links: string[];
    metadata: any;
  } {
    return {
      mainText: this.extractMainText(),
      fullText: this.extractFullText(),
      title: document.title,
      metaDescription: this.extractMetaDescription(),
      images: this.extractImages(),
      links: this.extractLinks(),
      metadata: this.extractMetadata(),
    };
  }

  /**
   * Extract main article/post content
   * Uses common selectors to find the main content area
   */
  private extractMainText(): string {
    // Try to find main content using common patterns
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '#content',
      '#main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.main-content',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.cleanText(element.textContent || '');
      }
    }

    // Fallback to body
    return this.cleanText(document.body.textContent || '');
  }

  /**
   * Extract ALL text from the page (including sidebars, etc.)
   */
  private extractFullText(): string {
    return this.cleanText(document.body.textContent || '');
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize newlines
      .trim();
  }

  /**
   * Extract meta description
   */
  private extractMetaDescription(): string | undefined {
    const meta = document.querySelector('meta[name="description"]');
    return meta?.getAttribute('content') || undefined;
  }

  /**
   * Extract all images
   */
  private extractImages(): string[] {
    const images: string[] = [];
    const imgElements = document.querySelectorAll('img[src]');

    imgElements.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        // Skip data URLs (inline images)
        images.push(src);
      }
    });

    return images;
  }

  /**
   * Extract all links
   */
  private extractLinks(): string[] {
    const links: string[] = [];
    const linkElements = document.querySelectorAll('a[href]');

    linkElements.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('http')) {
        // Only external links
        links.push(href);
      }
    });

    return [...new Set(links)]; // Deduplicate
  }

  /**
   * Extract metadata for better analysis
   */
  private extractMetadata() {
    const wordCount = this.extractFullText().split(/\s+/).length;

    return {
      // Content metrics
      wordCount,
      characterCount: this.extractFullText().length,
      imageCount: document.images.length,
      linkCount: document.links.length,

      // Page type hints
      hasVideo: document.querySelectorAll('video').length > 0,
      hasAudio: document.querySelectorAll('audio').length > 0,
      hasCodeBlocks: document.querySelectorAll('pre, code').length > 0,
      hasForm: document.querySelectorAll('form').length > 0,

      // Language hint (from html tag)
      language: document.documentElement.lang || undefined,

      // Open Graph data (social media)
      ogType: this.getMetaProperty('og:type'),
      ogImage: this.getMetaProperty('og:image'),

      // Author info
      author: this.getMetaProperty('author') || this.getMetaProperty('article:author'),

      // Publication date
      publishedTime:
        this.getMetaProperty('article:published_time') ||
        this.getMetaProperty('datePublished'),

      // Keywords
      keywords: this.getMetaContent('keywords'),
    };
  }

  /**
   * Get meta property value
   */
  private getMetaProperty(property: string): string | undefined {
    const meta = document.querySelector(`meta[property="${property}"]`);
    return meta?.getAttribute('content') || undefined;
  }

  /**
   * Get meta content value
   */
  private getMetaContent(name: string): string | undefined {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta?.getAttribute('content') || undefined;
  }
}
