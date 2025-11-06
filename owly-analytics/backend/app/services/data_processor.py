"""Data processing service."""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import PageView, Interaction, TypedContent, Session
from app.schemas.activity import (
    PageViewCreate,
    InteractionCreate,
    TypedContentCreate,
    SessionCreate,
    SessionUpdate,
)


class DataProcessor:
    """Process and store incoming data from extension."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def store_page_views(self, page_views: List[PageViewCreate]) -> List[PageView]:
        """Store page views in database."""
        db_page_views = []

        for pv in page_views:
            # Check if already exists
            result = await self.db.execute(select(PageView).where(PageView.id == pv.id))
            existing = result.scalar_one_or_none()

            if existing:
                # Update existing
                for key, value in pv.model_dump().items():
                    setattr(existing, key, value)
                db_page_views.append(existing)
            else:
                # Create new
                db_pv = PageView(**pv.model_dump())
                self.db.add(db_pv)
                db_page_views.append(db_pv)

        await self.db.flush()
        return db_page_views

    async def store_interactions(
        self, interactions: List[InteractionCreate]
    ) -> List[Interaction]:
        """Store interactions in database."""
        db_interactions = []

        for interaction in interactions:
            # Check if already exists
            result = await self.db.execute(
                select(Interaction).where(Interaction.id == interaction.id)
            )
            existing = result.scalar_one_or_none()

            if not existing:
                db_interaction = Interaction(**interaction.model_dump())
                self.db.add(db_interaction)
                db_interactions.append(db_interaction)

        await self.db.flush()
        return db_interactions

    async def store_typed_content(
        self, typed_content: List[TypedContentCreate]
    ) -> List[TypedContent]:
        """Store typed content in database."""
        db_typed_content = []

        for tc in typed_content:
            # Check if already exists
            result = await self.db.execute(
                select(TypedContent).where(TypedContent.id == tc.id)
            )
            existing = result.scalar_one_or_none()

            if not existing:
                db_tc = TypedContent(**tc.model_dump())
                self.db.add(db_tc)
                db_typed_content.append(db_tc)

        await self.db.flush()
        return db_typed_content

    async def create_session(self, session_data: SessionCreate) -> Session:
        """Create a new session."""
        db_session = Session(**session_data.model_dump())
        self.db.add(db_session)
        await self.db.flush()
        return db_session

    async def update_session(self, session_id: str, update_data: SessionUpdate) -> Session:
        """Update an existing session."""
        result = await self.db.execute(select(Session).where(Session.id == session_id))
        db_session = result.scalar_one_or_none()

        if not db_session:
            raise ValueError(f"Session {session_id} not found")

        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(db_session, key, value)

        await self.db.flush()
        return db_session
