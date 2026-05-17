import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, select

from database import get_db
from models import CommunityUser, CommunityPost, CommunityComment
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["account"])


@router.delete("/delete-account")
async def delete_account(
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete account: anonymize posts/comments, mark user as deleted."""
    user_id = user.user_id

    # Mark user as deleted
    user.deleted_at = datetime.now(timezone.utc)
    user.nickname = "탈퇴한 회원"

    # Anonymize posts (keep content, remove user_id reference)
    await db.execute(
        update(CommunityPost)
        .where(CommunityPost.user_id == user_id, CommunityPost.deleted_at.is_(None))
        .values(user_id=None)
    )

    # Anonymize comments
    await db.execute(
        update(CommunityComment)
        .where(CommunityComment.user_id == user_id, CommunityComment.deleted_at.is_(None))
        .values(user_id=None)
    )

    await db.commit()
    return {"message": "Account deleted. You have 30 days to re-login to restore."}


@router.get("/export-data")
async def export_data(
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all user data (posts, comments) as JSON."""
    user_id = user.user_id

    posts_result = await db.execute(
        select(CommunityPost).where(CommunityPost.user_id == user_id)
    )
    posts = posts_result.scalars().all()

    comments_result = await db.execute(
        select(CommunityComment).where(CommunityComment.user_id == user_id)
    )
    comments = comments_result.scalars().all()

    return {
        "user_id": user_id,
        "posts": [
            {
                "id": p.id,
                "title": p.title,
                "content": p.content,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in posts
        ],
        "comments": [
            {
                "id": c.id,
                "post_id": c.post_id,
                "content": c.content,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in comments
        ],
    }
