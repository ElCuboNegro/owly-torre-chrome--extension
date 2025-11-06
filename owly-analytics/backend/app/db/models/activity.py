"""Activity tracking models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, DateTime, Text, JSON, Boolean
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

    # Content classification (will be filled by ML later)
    content_type: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    is_adult: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Context
    referrer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # Additional data (flexible JSON)
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
