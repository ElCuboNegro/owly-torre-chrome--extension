# Video Analysis Guide

## Overview

Video tracking captures **what videos you watch** and **how you watch them** across all platforms - YouTube, Netflix, embedded videos, etc.

**Important:** Video analysis has two distinct levels:

1. **Metadata & Playback Tracking** ✅ (Implemented, lightweight)
2. **Content Analysis** 🔄 (Advanced, requires backend processing)

---

## 📊 Level 1: Metadata & Playback Tracking

### What Gets Tracked

**Video Identity:**
- URL and video source
- Platform (YouTube, Netflix, Vimeo, embedded, etc.)
- Title and channel (when available)
- Video dimensions (resolution)
- Duration (total length)

**Playback Behavior:**
```typescript
{
  watchedDuration: 180,        // Seconds you actually watched
  completionRate: 0.75,        // 75% of video watched
  maxWatchedPosition: 240,     // Furthest point reached
  playCount: 3,                // Hit play 3 times
  pauseCount: 5,               // Paused 5 times
  playbackSpeed: 1.5,          // Watched at 1.5x speed
  wasFullscreen: true,         // Used fullscreen mode
}
```

**Engagement Patterns:**
```typescript
{
  watchedSegments: [
    {start: 0, end: 60},       // Watched intro
    {start: 120, end: 240},    // Skipped middle, watched end
  ],

  seekEvents: [
    {from: 60, to: 120},       // Skipped forward
    {from: 180, to: 150},      // Rewatched section
  ],

  // Replay Detection:
  // If you watch 0-60, then seek back to 30 and watch to 60 again,
  // we know you replayed that section
}
```

### How It Works

**1. Universal Video Detection**

```typescript
// Tracks ALL <video> elements on any page
const videos = document.querySelectorAll('video');

// Watches for new videos added dynamically
const observer = new MutationObserver(() => {
  // Detect new videos in SPAs like YouTube
});
```

**2. Event Tracking**

Every video element gets listeners for:
- `play` → Count plays, start tracking
- `pause` → Record watched segment
- `seeked` → Log skip forward/back
- `ratechange` → Track playback speed
- `ended` → Mark as completed
- `timeupdate` → Track progress (every second)

**3. Platform-Specific Enhancements**

**YouTube:**
- Extracts video ID from URL (`?v=xxxx`)
- Gets video title from page title
- Finds channel name from DOM
- Tracks related video clicks

**Netflix:**
- Extracts show/movie title
- Episode information
- Auto-play detection

**Embedded Videos:**
- Source detection
- Parent page context

### Implementation

**In Browser (Extension):**
- `VideoTracker.ts` - Detects all videos
- `VideoSession` - Tracks individual video playback
- Sends data to background when video pauses/ends

**Storage:**
```sql
CREATE TABLE video_playback (
  id VARCHAR PRIMARY KEY,
  url TEXT,
  video_src TEXT,
  page_url TEXT,
  platform VARCHAR,

  -- Video info
  title TEXT,
  channel TEXT,
  duration INTEGER,
  width INTEGER,
  height INTEGER,

  -- Playback
  watched_duration INTEGER,
  completion_rate FLOAT,
  max_watched_position INTEGER,

  -- Behavior
  play_count INTEGER,
  pause_count INTEGER,
  seek_events JSON,
  watched_segments JSON,
  playback_speed FLOAT,
  was_fullscreen BOOLEAN,

  -- Timestamps
  timestamp TIMESTAMP,
  session_id VARCHAR,

  -- ML fields (for future content analysis)
  topics JSON,
  category VARCHAR,
  is_adult BOOLEAN
);
```

### Example Data

**Watching a YouTube video:**

```json
{
  "id": "video-123",
  "url": "https://www.youtube.com/watch?v=abc123",
  "platform": "youtube",
  "title": "Introduction to Machine Learning",
  "channel": "Tech Explained",
  "duration": 600,

  "watchedDuration": 450,      // Watched 7.5 minutes
  "completionRate": 0.75,      // 75% completion
  "maxWatchedPosition": 580,   // Got to 9:40

  "playCount": 2,              // Hit play twice
  "pauseCount": 3,             // Paused 3 times
  "playbackSpeed": 1.5,        // 1.5x speed
  "wasFullscreen": true,

  "seekEvents": [
    {"from": 60, "to": 120},   // Skipped intro
    {"from": 300, "to": 250},  // Rewatched section
  ],

  "watchedSegments": [
    {"start": 120, "end": 300},
    {"start": 250, "end": 580}
  ]
}
```

---

## 🧠 Level 2: Content Analysis

This is **much more advanced** and requires significant backend processing.

### What's Possible

**Visual Analysis:**
- Scene detection (identify key frames)
- Object detection (what objects are in video)
- Face detection (who appears in video)
- OCR (read text in video)
- NSFW content detection

**Audio Analysis:**
- Speech-to-text transcription
- Speaker identification
- Music detection
- Audio fingerprinting

**Combined:**
- Topic classification
- Sentiment analysis
- Content summarization
- Highlight detection

### Implementation Approaches

#### **Approach 1: Frame Extraction**

**Browser Side:**
```typescript
// Extract frames from video at intervals
function extractFrames(video: HTMLVideoElement, interval: number = 5) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const frames: string[] = [];

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Capture frame every N seconds
  const captureFrame = () => {
    ctx.drawImage(video, 0, 0);
    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    frames.push(frameData);
  };

  // Call captureFrame every 5 seconds
  setInterval(captureFrame, interval * 1000);

  return frames;
}
```

**Backend Side:**
```python
# Process frames with computer vision
from transformers import pipeline

class VideoContentAnalyzer:
    def __init__(self):
        self.image_classifier = pipeline("image-classification")
        self.object_detector = pipeline("object-detection")

    def analyze_frames(self, frames: list[bytes]):
        results = []

        for frame in frames:
            # Classify content
            classification = self.image_classifier(frame)

            # Detect objects
            objects = self.object_detector(frame)

            results.append({
                "classification": classification,
                "objects": objects
            })

        # Aggregate results
        return self.aggregate_analysis(results)
```

**Challenges:**
- ❌ High data transfer (many images)
- ❌ Processing time (seconds per frame)
- ❌ Storage (images are large)
- ❌ Privacy (sending video frames to server)

#### **Approach 2: Audio Transcription**

**Browser Side:**
```typescript
// Capture audio from video
const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(video);
const recorder = new MediaRecorder(stream);

// Record audio chunks
recorder.ondataavailable = (e) => {
  audioChunks.push(e.data);
};

// Send to backend for transcription
```

**Backend Side:**
```python
# Transcribe audio with Whisper
from transformers import pipeline

class AudioAnalyzer:
    def __init__(self):
        self.transcriber = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-base"
        )

    def transcribe(self, audio_file: bytes):
        result = self.transcriber(audio_file)
        return result["text"]

    def analyze_transcript(self, text: str):
        # Topic extraction, sentiment, etc.
        return {
            "topics": self.extract_topics(text),
            "sentiment": self.analyze_sentiment(text),
            "keywords": self.extract_keywords(text)
        }
```

**Advantages:**
- ✅ Rich content information
- ✅ Works for educational videos, podcasts
- ✅ Enables search by spoken words

**Challenges:**
- ⚠️ Requires sending audio to server
- ⚠️ Processing time (Whisper is slow on CPU)
- ⚠️ Only works for videos with speech

#### **Approach 3: Metadata-Only (Recommended)**

**Skip content analysis, use metadata:**

```python
class MetadataAnalyzer:
    """
    Analyze videos based on metadata only
    Much faster, still very useful
    """

    def analyze(self, video_data):
        # Use title, channel, description
        title = video_data['title']
        channel = video_data['channel']

        # Classify based on text
        category = self.classify_from_title(title)

        # Detect platform patterns
        if 'youtube.com' in video_data['url']:
            # YouTube API could give more metadata
            # (but requires API key)
            pass

        return {
            "category": category,
            "estimated_topic": self.extract_topic(title),
            "is_educational": self.is_educational(title, channel),
            "is_entertainment": self.is_entertainment(title)
        }
```

**Advantages:**
- ✅ Fast (no video processing)
- ✅ Privacy-friendly (no content sent)
- ✅ Low resource usage
- ✅ Still gives good insights

**Best for:**
- Tracking watch habits
- Time management
- Productivity analysis
- Platform preferences

---

## 🎯 Recommended Implementation

### **Phase 1: Metadata Tracking** (Done!)

✅ Track what videos, how watched
✅ Platform detection
✅ Playback behavior
✅ Engagement metrics

### **Phase 2: Smart Metadata Analysis** (Easy to add)

```python
# backend/app/services/ml/video_analyzer.py

class VideoAnalyzer:
    def analyze_from_metadata(self, video_data):
        """
        Analyze video without processing content
        Uses: title, channel, URL, playback behavior
        """

        title = video_data['title'].lower()
        url = video_data['url']

        # Categorize
        if any(kw in title for kw in ['tutorial', 'how to', 'learn']):
            category = 'educational'
        elif any(kw in title for kw in ['funny', 'comedy', 'laugh']):
            category = 'entertainment'
        elif 'news' in title or 'breaking' in title:
            category = 'news'
        else:
            category = 'other'

        # Detect quality indicators
        completion_rate = video_data['completion_rate']
        rewatch_count = video_data['play_count']

        engagement_score = (
            completion_rate * 0.6 +      # Did you finish it?
            (rewatch_count > 1) * 0.2 +  # Did you rewatch?
            (video_data['was_fullscreen']) * 0.2  # Fullscreen = focused
        )

        return {
            "category": category,
            "engagement_score": engagement_score,
            "quality_indicator": engagement_score > 0.7
        }
```

### **Phase 3: Content Analysis** (Advanced, optional)

Only if you need it:

1. **For specific videos** (not all):
   - Extract key frames (1 per minute)
   - Run object detection
   - Basic scene classification

2. **For important videos**:
   - Full transcription
   - Deep content analysis
   - Generate summary

3. **For NSFW detection**:
   - Sample frames
   - Run NSFW model (like CLIP or NudeNet)
   - Flag suspicious content

---

## 📊 Analytics You Can Do

### **Watch Time Analysis**

```sql
-- Total video watch time per day
SELECT
  DATE(timestamp) as day,
  SUM(watched_duration) / 3600 as hours_watched
FROM video_playback
GROUP BY day
ORDER BY day DESC;
```

### **Platform Breakdown**

```sql
-- Time per platform
SELECT
  platform,
  COUNT(*) as videos,
  SUM(watched_duration) / 3600 as hours
FROM video_playback
GROUP BY platform
ORDER BY hours DESC;
```

### **Completion Rate Analysis**

```sql
-- Videos you actually finish
SELECT
  platform,
  AVG(completion_rate) as avg_completion
FROM video_playback
GROUP BY platform;

-- Videos you abandoned quickly
SELECT title, url, completion_rate
FROM video_playback
WHERE completion_rate < 0.1
ORDER BY timestamp DESC
LIMIT 20;
```

### **Engagement Patterns**

```sql
-- Most rewatched videos (high quality indicator)
SELECT title, url, play_count, completion_rate
FROM video_playback
WHERE play_count > 1
ORDER BY play_count DESC;

-- Binge watching detection
SELECT
  DATE(timestamp) as day,
  COUNT(*) as videos_watched,
  SUM(watched_duration) / 3600 as hours
FROM video_playback
GROUP BY day
HAVING hours > 4  -- More than 4 hours
ORDER BY day DESC;
```

### **Playback Speed Analysis**

```sql
-- Do you watch videos at 2x speed?
SELECT
  AVG(playback_speed) as avg_speed,
  platform
FROM video_playback
GROUP BY platform;
```

---

## 🔐 Privacy Considerations

### What's Sent to Backend

**Metadata Only (Current):**
- ✅ Video URL, title, channel
- ✅ Watch duration, completion rate
- ✅ Platform, playback behavior
- ❌ NO video frames
- ❌ NO audio recording
- ❌ NO screen recording

**If You Add Content Analysis:**
- ⚠️ Selected video frames (1-2 per minute)
- ⚠️ Audio for transcription (optional)
- ⚠️ Consider encryption for sensitive videos

### NSFW Video Tracking

```python
# NSFW videos tracked same as any other
# But flagged in database for filtering

{
  "url": "...",
  "title": "...",
  "is_adult": true,  # Detected from URL or content
  "watched_duration": 180,
  # ...rest of tracking
}

# Query non-adult only:
SELECT * FROM video_playback WHERE is_adult = false;

# Analyze adult content separately:
SELECT AVG(watched_duration), platform
FROM video_playback
WHERE is_adult = true
GROUP BY platform;
```

---

## 🚀 Quick Start

### Already Implemented

The `VideoTracker` automatically tracks:
- ✅ All `<video>` elements on any page
- ✅ YouTube, Netflix, Vimeo detection
- ✅ Playback metrics
- ✅ Sends data to backend

Just build and reload the extension!

### To Add Content Analysis

1. **Frame Extraction** (simple):
```typescript
// In VideoTracker.ts, add:
private extractKeyFrame() {
  const canvas = document.createElement('canvas');
  canvas.width = this.video.videoWidth;
  canvas.height = this.video.videoHeight;
  canvas.getContext('2d')!.drawImage(this.video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.7);
}
```

2. **Backend Processing**:
```bash
cd backend
poetry add transformers torch pillow
```

```python
# app/services/ml/video_analyzer.py
from transformers import pipeline

class VideoContentAnalyzer:
    def __init__(self):
        self.classifier = pipeline("image-classification")

    def analyze_frame(self, image_data):
        return self.classifier(image_data)
```

---

## 📈 Performance

**Metadata Tracking:**
- Browser overhead: ~1% CPU
- Memory: ~10 MB per video session
- Network: ~1 KB per video tracked

**Content Analysis:**
- Frame extraction: 5-10 MB per video
- Backend processing: 100-500ms per frame
- Storage: 1-5 MB per video (with frames)

---

## ✅ Summary

**Level 1 (Implemented):**
- ✅ Tracks WHAT you watch
- ✅ Tracks HOW you watch (completion, speed, etc.)
- ✅ Platform detection
- ✅ Lightweight and fast
- ✅ Privacy-friendly

**Level 2 (Advanced, Optional):**
- Computer vision on video frames
- Audio transcription
- Deep content analysis
- Much heavier processing

**Recommended:**
- Use Level 1 for 99% of use cases
- Add Level 2 only for specific needs (NSFW detection, content moderation)
- Smart metadata analysis gives great insights without heavy processing
