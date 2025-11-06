"""Data ingestion endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.activity import (
    PageViewBatch,
    InteractionBatch,
    TypedContentBatch,
    SessionCreate,
    SessionUpdate,
)
from app.services.data_processor import DataProcessor

router = APIRouter()


@router.post("/page-views")
async def ingest_page_views(
    data: PageViewBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest page views from extension.

    This endpoint receives batches of page views and stores them.
    """
    processor = DataProcessor(db)
    stored = await processor.store_page_views(data.page_views)

    return {
        "success": True,
        "processed": len(stored),
        "message": f"Stored {len(stored)} page views",
    }


@router.post("/interactions")
async def ingest_interactions(
    data: InteractionBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest user interactions from extension.

    Tracks clicks, likes, shares, etc.
    """
    processor = DataProcessor(db)
    stored = await processor.store_interactions(data.interactions)

    return {
        "success": True,
        "processed": len(stored),
        "message": f"Stored {len(stored)} interactions",
    }


@router.post("/typed-content")
async def ingest_typed_content(
    data: TypedContentBatch,
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest typed content from extension.

    Tracks comments, posts, searches, etc.
    """
    processor = DataProcessor(db)
    stored = await processor.store_typed_content(data.typed_content)

    return {
        "success": True,
        "processed": len(stored),
        "message": f"Stored {len(stored)} typed content items",
    }


@router.post("/sessions")
async def create_session(
    data: SessionCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new browsing session.

    Called when user starts browsing.
    """
    processor = DataProcessor(db)
    session = await processor.create_session(data)

    return {
        "success": True,
        "session_id": session.id,
        "message": "Session created",
    }


@router.patch("/sessions/{session_id}")
async def update_session(
    session_id: str,
    data: SessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing session.

    Called periodically and when session ends.
    """
    processor = DataProcessor(db)

    try:
        session = await processor.update_session(session_id, data)
        return {
            "success": True,
            "session_id": session.id,
            "message": "Session updated",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
