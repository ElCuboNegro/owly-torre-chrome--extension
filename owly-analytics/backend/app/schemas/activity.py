"""Activity schemas for API validation."""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field


class PageViewCreate(BaseModel):
    """Schema for creating a page view."""

    id: str
    url: str
    title: str
    domain: str
    timestamp: datetime
    time_on_page: int = Field(..., ge=0)
    active_time: int = Field(..., ge=0)
    idle_time: int = Field(default=0, ge=0)
    scroll_depth: float = Field(default=0.0, ge=0.0, le=1.0)
    scroll_speed: Optional[float] = None
    referrer: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PageViewBatch(BaseModel):
    """Batch of page views."""

    page_views: List[PageViewCreate]


class InteractionCreate(BaseModel):
    """Schema for creating an interaction."""

    id: str
    timestamp: datetime
    interaction_type: str
    target_url: Optional[str] = None
    target_id: Optional[str] = None
    target_type: Optional[str] = None
    page_url: str
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class InteractionBatch(BaseModel):
    """Batch of interactions."""

    interactions: List[InteractionCreate]


class TypedContentCreate(BaseModel):
    """Schema for creating typed content."""

    id: str
    timestamp: datetime
    content: str
    content_type: str  # comment, post, message, search
    platform: str  # facebook, twitter, google, etc.
    page_url: str
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TypedContentBatch(BaseModel):
    """Batch of typed content."""

    typed_content: List[TypedContentCreate]


class SessionCreate(BaseModel):
    """Schema for creating a session."""

    id: str
    start_time: datetime
    metadata: Optional[Dict[str, Any]] = None


class SessionUpdate(BaseModel):
    """Schema for updating a session."""

    end_time: Optional[datetime] = None
    duration: Optional[int] = Field(default=None, ge=0)
    active_time: Optional[int] = Field(default=None, ge=0)
    page_views: Optional[int] = Field(default=None, ge=0)
    interactions: Optional[int] = Field(default=None, ge=0)
    metadata: Optional[Dict[str, Any]] = None
