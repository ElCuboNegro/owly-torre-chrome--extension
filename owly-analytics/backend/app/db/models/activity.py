"""Activity tracking models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, DateTime, Text, JSON, Boolean, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PageView(Base):
    """Track page views across all websites."""

    __tablename__ = "page_views"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    url: Mapped[str] = mapped_column(Text, index=True)
    title: Mapped[str] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(String, index=True)

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Time tracking
    time_on_page: Mapped[int] = mapped_column(Integer)  # seconds
    active_time: Mapped[int] = mapped_column(Integer)  # seconds actively engaged
    idle_time: Mapped[int] = mapped_column(Integer, default=0)

    # Engagement
    scroll_depth: Mapped[float] = mapped_column(Float, default=0.0)  # 0-1
    scroll_speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Page Content (extracted from DOM)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Main article text
    full_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # All text
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Media and Links
    image_urls: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of image URLs
    link_urls: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of links

    # Content metrics
    has_video: Mapped[bool] = mapped_column(Boolean, default=False)
    has_audio: Mapped[bool] = mapped_column(Boolean, default=False)
    has_code: Mapped[bool] = mapped_column(Boolean, default=False)

    # Content classification (will be filled by ML later)
    content_type: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    is_adult: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # ML-generated fields (to be populated by backend processing)
    topics: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # ["technology", "AI"]
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # -1 to 1
    language: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Context
    referrer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # Additional data (flexible JSON for anything else)
    metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class Interaction(Base):
    """Track user interactions (clicks, etc.)."""

    __tablename__ = "interactions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Type of interaction
    interaction_type: Mapped[str] = mapped_column(String, index=True)  # click, like, share, etc.

    # Target
    target_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # post, link, button

    # Context
    page_url: Mapped[str] = mapped_column(Text)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # Additional data
    metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class TypedContent(Base):
    """Track content user types (comments, posts, etc.)."""

    __tablename__ = "typed_content"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Content
    content: Mapped[str] = mapped_column(Text)
    content_type: Mapped[str] = mapped_column(String)  # comment, post, message, search

    # Where it was typed
    platform: Mapped[str] = mapped_column(String, index=True)  # facebook, twitter, google, etc.
    page_url: Mapped[str] = mapped_column(Text)

    # Context
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # ML fields (filled later)
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sentiment_label: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Additional data
    metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class Session(Base):
    """Track browsing sessions."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Duration
    duration: Mapped[int] = mapped_column(Integer, default=0)  # seconds
    active_time: Mapped[int] = mapped_column(Integer, default=0)  # seconds

    # Activity
    page_views: Mapped[int] = mapped_column(Integer, default=0)
    interactions: Mapped[int] = mapped_column(Integer, default=0)

    # Additional data
    metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class VideoPlayback(Base):
    """Track video playback across all platforms."""

    __tablename__ = "video_playback"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Video identity
    url: Mapped[str] = mapped_column(Text, index=True)  # Page URL
    video_src: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Video source URL
    page_url: Mapped[str] = mapped_column(Text)  # Page where video was watched
    platform: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)  # youtube, netflix, vimeo, etc.

    # Video info
    title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    channel: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    duration: Mapped[int] = mapped_column(Integer)  # Total video duration in seconds
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Playback metrics
    watched_duration: Mapped[int] = mapped_column(Integer)  # Actual seconds watched
    completion_rate: Mapped[float] = mapped_column(Float)  # 0-1
    max_watched_position: Mapped[int] = mapped_column(Integer)  # Furthest point reached

    # Behavior
    play_count: Mapped[int] = mapped_column(Integer, default=0)
    pause_count: Mapped[int] = mapped_column(Integer, default=0)
    seek_events: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # [{from, to}]
    watched_segments: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # [{start, end}]
    playback_speed: Mapped[float] = mapped_column(Float, default=1.0)
    was_fullscreen: Mapped[bool] = mapped_column(Boolean, default=False)

    # Context
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # ML fields (for future content analysis)
    topics: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    is_adult: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    language: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Additional data
    metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
