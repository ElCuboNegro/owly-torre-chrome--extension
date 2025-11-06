# Content Tracking Documentation

## Overview

The extension now extracts **full page content** from every website you visit and sends it to your local backend for storage and analysis.

## What Gets Extracted

### From Every Page

**Text Content:**
- Main article/post text (extracted intelligently)
- Full page text (everything on the page)
- Meta description
- Word count

**Media:**
- All image URLs
- All outbound links

**Metadata:**
- Language
- Author (if available)
- Publication date (if available)
- OpenGraph data
- Content type indicators (has video, audio, code, forms)

## How It Works

### 1. Browser Extension (Data Collection)

```
Page Loads → Wait 2 seconds → Extract Content → Send to Backend
```

The `ContentExtractor` class:
- Tries to find main content area (article, main, etc.)
- Extracts all text and cleans it
- Finds all images and links
- Gathers metadata from HTML

**No ML runs in the browser** - it's just DOM parsing and text extraction.

### 2. Backend (Data Storage)

Content is stored in PostgreSQL with these fields:

```sql
page_views:
  -- Text content
  content TEXT              -- Main article text
  full_content TEXT         -- All page text
  word_count INTEGER
  meta_description TEXT

  -- Media
  image_urls JSON           -- ["url1", "url2"]
  link_urls JSON            -- ["url1", "url2"]

  -- Flags
  has_video BOOLEAN
  has_audio BOOLEAN
  has_code BOOLEAN

  -- ML results (populated by backend processing)
  category VARCHAR          -- e.g., "work", "entertainment"
  content_type VARCHAR      -- e.g., "article", "video"
  topics JSON               -- ["AI", "technology"]
  sentiment_score FLOAT     -- -1 to 1
  is_adult BOOLEAN
  language VARCHAR
```

### 3. Backend ML Processing (Optional)

You can add ML models to analyze content **on the server**:

```python
# backend/app/services/ml/content_analyzer.py

from transformers import pipeline

class ContentAnalyzer:
    def __init__(self):
        # Load models once on server startup
        self.sentiment = pipeline("sentiment-analysis")
        self.classifier = pipeline("zero-shot-classification")

    def analyze(self, content, url, title):
        return {
            "sentiment_score": self.analyze_sentiment(content),
            "category": self.classify(content),
            "topics": self.extract_topics(content),
            "is_adult": self.detect_nsfw(url, content)
        }
```

## Example: What Gets Stored

**Page:** "https://www.nytimes.com/2024/01/15/technology/ai-research.html"

```json
{
  "url": "https://www.nytimes.com/2024/01/15/technology/ai-research.html",
  "title": "New Breakthrough in AI Research",
  "domain": "nytimes.com",
  "content": "Scientists at MIT have announced a major breakthrough in artificial intelligence...",
  "full_content": "[Complete page text including sidebars, nav, etc.]",
  "word_count": 1847,
  "meta_description": "MIT researchers announce new AI breakthrough",
  "image_urls": [
    "https://nytimes.com/images/ai-lab.jpg",
    "https://nytimes.com/images/researcher.jpg"
  ],
  "link_urls": [
    "https://mit.edu/research/ai",
    "https://arxiv.org/paper/123"
  ],
  "has_video": false,
  "has_audio": false,
  "has_code": true,
  "language": "en",

  // ML-generated (if you add models):
  "category": "news",
  "content_type": "article",
  "topics": ["artificial intelligence", "research", "technology"],
  "sentiment_score": 0.65,
  "is_adult": false
}
```

## Storage Requirements

### Typical Page Sizes

- **Short article**: 2-5 KB
- **Medium article**: 10-20 KB
- **Long article**: 50-100 KB
- **Social media page**: 20-50 KB

### Database Size Estimates

Tracking 1000 pages/day for 30 days:

- **Metadata only**: ~50 MB
- **With content**: ~500 MB - 1 GB
- **With images/links**: +20%

**Note:** This is LOCAL storage on YOUR machine, so size isn't a big concern.

## Privacy Considerations

### Everything Stays Local

- ✅ Content stored in YOUR PostgreSQL database
- ✅ No external API calls (unless you add them)
- ✅ No cloud uploads
- ✅ You own all data

### NSFW Content

NSFW content is tracked the same as any other content:

```python
# Backend automatically detects NSFW based on URL/content
if url in nsfw_domains or content_has_adult_keywords:
    page_view.is_adult = True
```

You can then:
- Query all adult content: `SELECT * FROM page_views WHERE is_adult = true`
- Exclude from exports
- Analyze separately
- Apply encryption (future feature)

## Adding ML Models

### Step 1: Install Dependencies

```bash
cd backend
poetry add transformers torch
# or for lighter models:
poetry add sentence-transformers
```

### Step 2: Add Model to ContentAnalyzer

```python
# backend/app/services/ml/content_analyzer.py

from transformers import pipeline

class ContentAnalyzer:
    def __init__(self):
        # Load once on server startup
        self.sentiment_model = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )

    def _analyze_sentiment(self, content: str) -> float:
        result = self.sentiment_model(content[:512])[0]
        score = result['score']
        if result['label'] == 'NEGATIVE':
            score = -score
        return score
```

### Step 3: Process Content After Storage

```python
# backend/app/api/v1/endpoints/data.py

from app.services.ml.content_analyzer import ContentAnalyzer

analyzer = ContentAnalyzer()

@router.post("/page-views")
async def ingest_page_views(data: PageViewBatch, db: AsyncSession = Depends(get_db)):
    processor = DataProcessor(db)
    stored = await processor.store_page_views(data.page_views)

    # Process with ML
    for page_view in stored:
        if page_view.content:
            result = analyzer.analyze(
                content=page_view.content,
                url=page_view.url,
                title=page_view.title
            )

            # Update with ML results
            page_view.category = result['category']
            page_view.sentiment_score = result['sentiment_score']
            page_view.topics = result['topics']
            page_view.is_adult = result['is_adult']

    await db.commit()

    return {"success": True, "processed": len(stored)}
```

## Querying Content

### Full-Text Search

```python
# Find pages mentioning "machine learning"
SELECT url, title, content
FROM page_views
WHERE content ILIKE '%machine learning%'
ORDER BY timestamp DESC
LIMIT 10;
```

### Analyze Reading Habits

```python
# Most read categories
SELECT category, COUNT(*), SUM(active_time) as total_time
FROM page_views
WHERE content IS NOT NULL
GROUP BY category
ORDER BY total_time DESC;
```

### Find Long Reads

```python
# Articles over 2000 words
SELECT url, title, word_count, active_time
FROM page_views
WHERE word_count > 2000
ORDER BY word_count DESC;
```

### NSFW Analytics

```python
# Time spent on adult content
SELECT
  COUNT(*) as sessions,
  SUM(active_time) as total_time,
  AVG(active_time) as avg_time
FROM page_views
WHERE is_adult = true;
```

## Performance

### Browser Performance

- Content extraction: ~50-100ms per page
- No impact on browsing speed
- Extraction happens after 2 seconds (when page is loaded)

### Backend Performance

- Storage: ~10-50ms per page
- ML processing (if added): ~100-500ms per page
- Can process asynchronously with Celery workers

### Database Performance

- Indexed fields: url, domain, timestamp, category
- Full-text search: Add PostgreSQL text search indexes
- Typical query: <100ms for recent data

## Future Enhancements

### Easy to Add

1. **Better Content Extraction**
   - Use Mozilla Readability for clean article text
   - Platform-specific extractors (YouTube, Reddit, etc.)

2. **More ML Models**
   - Named Entity Recognition
   - Summarization
   - Keyword extraction
   - Reading level analysis

3. **Advanced Analytics**
   - Reading speed analysis
   - Content diversity metrics
   - Topic trends over time
   - Recommendation system

4. **Privacy Features**
   - Selective content tracking (by domain)
   - Encryption for sensitive content
   - Auto-deletion after X days

## Questions?

**Q: Does this slow down browsing?**
A: No, extraction happens after page load and runs in background.

**Q: What if I don't want content from some sites?**
A: Easy to add domain exclusions in ContentExtractor.

**Q: Can I search my reading history?**
A: Yes! Full-text search works on the `content` field.

**Q: How much GPU does ML need?**
A: Small models run fine on CPU. GPU helps for larger models.

**Q: Is sensitive content encrypted?**
A: Not yet, but easy to add with SQLAlchemy encryption.
