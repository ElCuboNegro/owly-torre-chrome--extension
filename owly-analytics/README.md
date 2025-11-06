# Owly Analytics

**Privacy-first digital behavior analytics system**

Track and analyze your complete digital behavior across all websites with 100% local data processing.

## 🌟 Features

- **Universal Tracking**: Works on every website
- **Complete Privacy**: All data stays on YOUR machine
- **Comprehensive Analytics**: Time tracking, interactions, content analysis
- **Real-time Insights**: Live dashboard with detailed statistics
- **Extensible**: Easy to add new trackers and analytics
- **Production-Ready**: Built with modern stack (FastAPI + React + TypeScript)

## 📦 What's Included

- **Backend** (Python/FastAPI): REST API with PostgreSQL database
- **Chrome Extension** (TypeScript/React): Universal tracker for all websites
- **Dashboard**: Beautiful analytics interface
- **Data Queue**: Intelligent batching and syncing

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for database)
- Chrome browser

### 1. Setup Backend

```bash
cd backend

# Start database
docker-compose up -d

# Install dependencies
pip install poetry
poetry install

# Run server
poetry run python -m app.main
```

Server will start at `http://localhost:3000`

**Check it's working:**
```bash
curl http://localhost:3000/health
```

### 2. Setup Extension

```bash
cd extension

# Install dependencies
npm install

# Build extension
npm run build
```

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder

You should see the Owly Analytics icon in your toolbar!

### 4. Start Browsing

- Browse any website - tracking starts automatically
- Click the extension icon to see quick stats
- Click "Open Dashboard" for full analytics

## 📊 What Gets Tracked

### Currently Implemented

✅ **Page Views**
- URL, title, domain
- Time spent (accurate active time vs idle)
- Scroll depth
- Session tracking

✅ **Interactions**
- Link clicks
- Button clicks
- Form submissions

✅ **Analytics**
- Time spent per domain
- Activity over time
- Session statistics

### Coming Soon (Easy to Add)

🔜 **Typed Content**
- Search queries
- Comments
- Posts

🔜 **Platform-Specific**
- Facebook posts you view
- YouTube videos you watch
- Reddit threads you read
- Twitter/X timeline

🔜 **ML-Powered**
- Content classification
- Sentiment analysis
- Topic extraction
- NSFW detection

🔜 **Advanced Analytics**
- Productivity scoring
- Focus time analysis
- Digital wellbeing metrics
- Behavioral patterns

## 📂 Project Structure

```
owly-analytics/
├── backend/              # Python/FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── db/          # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── main.py      # FastAPI app
│   ├── docker-compose.yml
│   └── README.md
│
├── extension/           # Chrome extension
│   ├── src/
│   │   ├── background/  # Service worker
│   │   ├── content/     # Page trackers
│   │   ├── popup/       # Extension popup
│   │   ├── dashboard/   # Full dashboard
│   │   └── shared/      # Shared code
│   ├── public/
│   │   └── manifest.json
│   └── README.md
│
└── README.md           # This file
```

## 🔧 Development

### Backend Development

```bash
cd backend

# Run with auto-reload
poetry run uvicorn app.main:app --reload --port 3000

# Format code
poetry run black app/

# Type check
poetry run mypy app/

# API docs at: http://localhost:3000/docs
```

### Extension Development

```bash
cd extension

# Watch mode (auto-rebuild on changes)
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

## 📡 API Endpoints

### Data Ingestion

- `POST /api/v1/data/page-views` - Store page views
- `POST /api/v1/data/interactions` - Store interactions
- `POST /api/v1/data/typed-content` - Store typed content
- `POST /api/v1/data/sessions` - Create/update sessions

### Analytics

- `GET /api/v1/analytics/overview?days=7` - Overview statistics
- `GET /api/v1/analytics/time-series?days=7` - Time-series data
- `GET /api/v1/analytics/categories?days=7` - Category breakdown

### Health

- `GET /health` - Server health check

Full API documentation: http://localhost:3000/docs

## 🗄️ Database Schema

**page_views**
- Tracks every page you visit
- Time spent, scroll depth, engagement metrics

**interactions**
- Clicks, form submissions, etc.

**typed_content**
- Search queries, comments (to be implemented)

**sessions**
- Browsing sessions with aggregated stats

## 🎯 How to Extend

### Add a New Platform Tracker

1. Create `extension/src/content/platforms/youtube.ts`:

```typescript
export class YouTubeTracker {
  trackVideo(videoId: string) {
    // Track YouTube video
  }
}
```

2. Use in content script:

```typescript
if (window.location.hostname === 'www.youtube.com') {
  const youtubeTracker = new YouTubeTracker();
}
```

### Add ML Processing

1. Add to `backend/app/services/ml/`:

```python
class ContentClassifier:
    async def classify(self, text: str):
        # Classify content
        return {"category": "technology"}
```

2. Use in data processor

3. Update database models with new fields

## 🔒 Privacy & Security

- **100% Local**: All data stored on your machine
- **No Cloud**: No external services, no data leaves your control
- **Encrypted**: Sensitive data can be encrypted (TODO)
- **Open Source**: You can audit every line of code
- **Your Data**: Export, delete, or modify anytime

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check database is running
docker-compose ps

# Check port 3000 is free
lsof -i :3000

# Check logs
docker-compose logs postgres
```

### Extension not tracking

1. Check extension is enabled in `chrome://extensions/`
2. Check background service worker logs (click "service worker" in extensions page)
3. Check content script logs (F12 on any page, Console tab)
4. Verify backend is running: `curl http://localhost:3000/health`

### Data not showing in dashboard

1. Browse some pages first (generate data)
2. Wait for auto-sync (60 seconds) or trigger manually
3. Check queue stats in popup
4. Verify backend received data: check database or API logs

## 📈 Roadmap

**Phase 1: Foundation** ✅ (DONE!)
- ✅ Backend API
- ✅ Universal page tracking
- ✅ Basic dashboard
- ✅ Data syncing

**Phase 2: Enhanced Tracking** 🔄 (NEXT)
- Typed content tracking
- Platform-specific trackers (Facebook, YouTube, etc.)
- Video/media tracking
- Reading time analysis

**Phase 3: ML & Intelligence**
- Content classification
- Sentiment analysis
- Topic modeling
- Behavioral pattern detection

**Phase 4: Advanced Features**
- Real-time insights overlay
- Usage warnings & limits
- Productivity scoring
- Digital wellbeing metrics
- NSFW tracking & analytics

**Phase 5: Polish**
- Data export
- Visualizations
- Mobile support (via web dashboard)
- Multi-device sync (optional)

## 🤝 Contributing

This is a personal project, but feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

Private - All rights reserved

## 🙏 Acknowledgments

Built with:
- FastAPI (Python backend)
- React + TypeScript (Extension UI)
- PostgreSQL (Database)
- Vite (Build tool)

Inspired by:
- RescueTime
- ActivityWatch
- Facebook Data Selfie project

---

**Made with ❤️ for self-knowledge and digital wellbeing**
