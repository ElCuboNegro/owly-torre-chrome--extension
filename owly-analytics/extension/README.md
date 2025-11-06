# Owly Analytics - Chrome Extension

Privacy-first digital behavior analytics extension.

## Features

- **Universal Tracking**: Tracks activity on all websites
- **Page Views**: Time spent, scroll depth, active vs idle time
- **Interactions**: Clicks, form submissions
- **Privacy-First**: All data stays local or on your own server
- **Real-time Sync**: Automatic batching and syncing to backend

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see `../backend/README.md`)

### Setup

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Development mode (watch for changes)
npm run dev
```

### Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder from this directory

The extension should now be loaded and active!

### Project Structure

```
extension/
├── public/
│   ├── manifest.json      # Extension manifest
│   └── icons/             # Extension icons
├── src/
│   ├── background/        # Background service worker
│   │   ├── service-worker.ts
│   │   └── DataQueue.ts
│   ├── content/           # Content scripts (run on pages)
│   │   ├── content.ts
│   │   ├── PageTracker.ts
│   │   └── InteractionTracker.ts
│   ├── popup/             # Extension popup
│   │   ├── Popup.tsx
│   │   └── popup.html
│   ├── dashboard/         # Full dashboard page
│   │   ├── Dashboard.tsx
│   │   └── dashboard.html
│   └── shared/            # Shared utilities
│       ├── api/          # API client
│       ├── types/        # TypeScript types
│       └── utils/        # Helper functions
└── package.json
```

## How It Works

### Data Flow

```
Web Page
  ↓ (Content Script tracks activity)
PageTracker + InteractionTracker
  ↓ (Send to background)
Background Service Worker
  ↓ (Queue in DataQueue)
DataQueue
  ↓ (Batch and flush every 60s or 50 items)
Backend API
  ↓ (Store in PostgreSQL)
Database
  ↓ (Query for analytics)
Dashboard
```

### What Gets Tracked

**Page Views:**
- URL, title, domain
- Time spent (active vs idle)
- Scroll depth
- Referrer
- Session association

**Interactions:**
- Clicks on links and buttons
- Form submissions
- Target information
- Context metadata

**Future (TODO):**
- Typed content (comments, searches)
- Video playback
- Platform-specific tracking (Facebook, YouTube, etc.)

## Configuration

The extension connects to `http://localhost:3000` by default.

To change this, edit `src/shared/api/client.ts`:

```typescript
const API_BASE_URL = 'http://your-server:port';
```

## Privacy

- All tracking happens locally in your browser
- Data is sent only to YOUR server (localhost by default)
- No external analytics, no third-party tracking
- You control all your data

## Next Steps

1. Add typed content tracking (search queries, comments)
2. Add platform-specific trackers (Facebook, YouTube, Reddit)
3. Add NSFW content detection and categorization
4. Add ML-powered content classification
5. Add real-time insights overlay
6. Add usage limits and warnings
7. Add data export functionality

## Debugging

### View Logs

- **Content Script**: Open DevTools on any page, check Console
- **Background Worker**: Go to `chrome://extensions/`, click "service worker" under the extension
- **Popup**: Right-click popup → Inspect

### Common Issues

**"Failed to send page view"**
- Make sure backend server is running
- Check `http://localhost:3000/health`

**Extension not tracking**
- Check if extension is enabled
- Refresh the page
- Check content script logs

## License

Private - All rights reserved
