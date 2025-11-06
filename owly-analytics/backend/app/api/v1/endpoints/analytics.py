"""Analytics endpoints."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import PageView, Interaction, TypedContent, Session

router = APIRouter()


@router.get("/overview")
async def get_overview(
    days: int = Query(default=7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    Get overview analytics for the specified time period.

    Returns summary statistics about user's digital activity.
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get page view count
    pv_result = await db.execute(
        select(func.count(PageView.id)).where(PageView.timestamp >= start_date)
    )
    page_view_count = pv_result.scalar() or 0

    # Get total time
    time_result = await db.execute(
        select(func.sum(PageView.active_time)).where(PageView.timestamp >= start_date)
    )
    total_time = time_result.scalar() or 0

    # Get interaction count
    int_result = await db.execute(
        select(func.count(Interaction.id)).where(Interaction.timestamp >= start_date)
    )
    interaction_count = int_result.scalar() or 0

    # Get session count
    session_result = await db.execute(
        select(func.count(Session.id)).where(Session.start_time >= start_date)
    )
    session_count = session_result.scalar() or 0

    # Get top domains
    domain_result = await db.execute(
        select(PageView.domain, func.sum(PageView.active_time).label("total_time"))
        .where(PageView.timestamp >= start_date)
        .group_by(PageView.domain)
        .order_by(func.sum(PageView.active_time).desc())
        .limit(10)
    )
    top_domains = [
        {"domain": row.domain, "time": row.total_time} for row in domain_result.all()
    ]

    return {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "end_date": datetime.utcnow().isoformat(),
        "summary": {
            "page_views": page_view_count,
            "total_time_seconds": total_time,
            "total_time_hours": round(total_time / 3600, 2),
            "interactions": interaction_count,
            "sessions": session_count,
            "avg_session_time": (
                round(total_time / session_count, 2) if session_count > 0 else 0
            ),
        },
        "top_domains": top_domains,
    }


@router.get("/time-series")
async def get_time_series(
    days: int = Query(default=7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    Get time series data for activity over time.

    Returns hourly activity breakdown.
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get activity by hour
    result = await db.execute(
        select(
            func.date_trunc("hour", PageView.timestamp).label("hour"),
            func.count(PageView.id).label("count"),
            func.sum(PageView.active_time).label("total_time"),
        )
        .where(PageView.timestamp >= start_date)
        .group_by(func.date_trunc("hour", PageView.timestamp))
        .order_by(func.date_trunc("hour", PageView.timestamp))
    )

    time_series = [
        {
            "hour": row.hour.isoformat(),
            "count": row.count,
            "total_time": row.total_time,
        }
        for row in result.all()
    ]

    return {
        "period_days": days,
        "data": time_series,
    }


@router.get("/categories")
async def get_categories(
    days: int = Query(default=7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    Get breakdown by content category.

    Note: Categories are populated by ML processing (to be implemented).
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get breakdown by category
    result = await db.execute(
        select(
            PageView.category,
            func.count(PageView.id).label("count"),
            func.sum(PageView.active_time).label("total_time"),
        )
        .where(PageView.timestamp >= start_date)
        .where(PageView.category.isnot(None))
        .group_by(PageView.category)
        .order_by(func.sum(PageView.active_time).desc())
    )

    categories = [
        {
            "category": row.category,
            "count": row.count,
            "total_time": row.total_time,
        }
        for row in result.all()
    ]

    return {
        "period_days": days,
        "categories": categories,
    }
