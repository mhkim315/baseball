import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from database import get_db
from models import CommunityUser, CommunityPost, CommunityComment
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/community", tags=["community"])


# --- Schemas ---

class PostCreate(BaseModel):
    title: str
    content: str

    @field_validator("content")
    @classmethod
    def content_length(cls, v: str) -> str:
        if len(v) > 5000:
            raise ValueError("Content must be 5000 characters or fewer")
        return v

    @field_validator("title")
    @classmethod
    def title_length(cls, v: str) -> str:
        if len(v) > 100:
            raise ValueError("Title must be 100 characters or fewer")
        return v


class PostUpdate(BaseModel):
    title: str | None = None
    content: str | None = None

    @field_validator("content")
    @classmethod
    def content_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 5000:
            raise ValueError("Content must be 5000 characters or fewer")
        return v

    @field_validator("title")
    @classmethod
    def title_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 100:
            raise ValueError("Title must be 100 characters or fewer")
        return v


class CommentCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_length(cls, v: str) -> str:
        if len(v) > 1000:
            raise ValueError("Comment must be 1000 characters or fewer")
        return v


class PostSummary(BaseModel):
    id: int
    title: str
    author_nickname: str
    author_deleted: bool
    comment_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PostDetail(BaseModel):
    id: int
    title: str
    content: str
    author_nickname: str
    author_deleted: bool
    author_profile_type: str
    author_profile_value: str | None
    created_at: datetime
    updated_at: datetime | None
    comments: list["CommentDetail"] = []

    class Config:
        from_attributes = True


class CommentDetail(BaseModel):
    id: int
    content: str
    author_nickname: str
    author_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    posts: list[PostSummary]
    total: int
    page: int
    page_size: int


# --- Helper ---

async def get_user_info(db: AsyncSession, user_id: str | None) -> tuple[str, bool, str, str | None]:
    """Get display info for a user, handling deleted accounts."""
    if user_id is None:
        return "탈퇴한 회원", True, "character", None
    result = await db.execute(select(CommunityUser).where(CommunityUser.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.deleted_at:
        return "탈퇴한 회원", True, "character", None
    return user.nickname, False, user.profile_type or "character", user.profile_value


# --- Routes ---

@router.get("/posts", response_model=PostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated post list (non-deleted posts only, newest first)."""
    # Count total
    count_q = select(func.count()).where(
        CommunityPost.deleted_at.is_(None)
    )
    total = (await db.execute(count_q)).scalar()

    # Fetch posts
    q = (
        select(CommunityPost)
        .where(CommunityPost.deleted_at.is_(None))
        .order_by(CommunityPost.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    posts = (await db.execute(q)).scalars().all()

    # Get comment counts
    post_ids = [p.id for p in posts]
    comment_counts = {}
    if post_ids:
        cc_q = select(
            CommunityComment.post_id, func.count().label("cnt")
        ).where(
            CommunityComment.post_id.in_(post_ids),
            CommunityComment.deleted_at.is_(None),
        ).group_by(CommunityComment.post_id)
        for row in await db.execute(cc_q):
            comment_counts[row.post_id] = row.cnt

    # Batch-fetch user info for all post authors
    user_ids = list({p.user_id for p in posts if p.user_id})
    user_map: dict[str, tuple[str, bool, str, str | None]] = {}
    if user_ids:
        user_q = select(CommunityUser).where(CommunityUser.user_id.in_(user_ids))
        user_rows = (await db.execute(user_q)).scalars().all()
        for u in user_rows:
            deleted = u.deleted_at is not None
            user_map[u.user_id] = (u.nickname, deleted, u.profile_type or "character", u.profile_value)
        # Fill in any missing IDs (deleted accounts whose user row may be gone)
        for uid in user_ids:
            if uid not in user_map:
                user_map[uid] = ("탈퇴한 회원", True, "character", None)

    result = []
    for p in posts:
        if p.user_id and p.user_id in user_map:
            nickname, deleted, _, _ = user_map[p.user_id]
        else:
            nickname, deleted, _, _ = "탈퇴한 회원", True, "character", None
        result.append(PostSummary(
            id=p.id,
            title=p.title,
            author_nickname=nickname,
            author_deleted=deleted,
            comment_count=comment_counts.get(p.id, 0),
            created_at=p.created_at,
        ))

    return PostListResponse(posts=result, total=total, page=page, page_size=page_size)


@router.post("/posts", status_code=201)
async def create_post(
    post: PostCreate,
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new post. Requires JWT in Authorization header."""
    if not post.title.strip() or not post.content.strip():
        raise HTTPException(status_code=400, detail="Title and content are required")

    new_post = CommunityPost(
        user_id=user.user_id,
        title=post.title.strip(),
        content=post.content.strip(),
    )
    db.add(new_post)
    await db.commit()
    return {"id": new_post.id, "message": "Post created"}


@router.get("/posts/{post_id}", response_model=PostDetail)
async def get_post(post_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single post with its comments."""
    result = await db.execute(
        select(CommunityPost).where(
            CommunityPost.id == post_id,
            CommunityPost.deleted_at.is_(None),
        )
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    nickname, deleted, ptype, pval = await get_user_info(db, post.user_id)

    # Fetch comments
    c_result = await db.execute(
        select(CommunityComment).where(
            CommunityComment.post_id == post_id,
            CommunityComment.deleted_at.is_(None),
        ).order_by(CommunityComment.created_at.asc())
    )
    comments = c_result.scalars().all()

    # Batch-fetch comment user info
    c_user_ids = list({c.user_id for c in comments if c.user_id})
    c_user_map: dict[str, tuple[str, bool, str, str | None]] = {}
    if c_user_ids:
        c_user_q = select(CommunityUser).where(CommunityUser.user_id.in_(c_user_ids))
        c_user_rows = (await db.execute(c_user_q)).scalars().all()
        for u in c_user_rows:
            deleted = u.deleted_at is not None
            c_user_map[u.user_id] = (u.nickname, deleted, u.profile_type or "character", u.profile_value)
        for uid in c_user_ids:
            if uid not in c_user_map:
                c_user_map[uid] = ("탈퇴한 회원", True, "character", None)

    comment_list = []
    for c in comments:
        if c.user_id and c.user_id in c_user_map:
            c_nick, c_deleted, _, _ = c_user_map[c.user_id]
        else:
            c_nick, c_deleted, _, _ = "탈퇴한 회원", True, "character", None
        comment_list.append(CommentDetail(
            id=c.id,
            content=c.content,
            author_nickname=c_nick,
            author_deleted=c_deleted,
            created_at=c.created_at,
        ))

    return PostDetail(
        id=post.id,
        title=post.title,
        content=post.content,
        author_nickname=nickname,
        author_deleted=deleted,
        author_profile_type=ptype,
        author_profile_value=pval,
        created_at=post.created_at,
        updated_at=post.updated_at,
        comments=comment_list,
    )


@router.put("/posts/{post_id}")
async def update_post(
    post_id: int,
    update: PostUpdate,
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update own post. Soft delete the old content (replaced by new)."""


    result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id, CommunityPost.deleted_at.is_(None))
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not your post")

    if update.title is not None:
        post.title = update.title.strip()
    if update.content is not None:
        post.content = update.content.strip()
    post.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Post updated"}


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete own post."""


    result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id, CommunityPost.deleted_at.is_(None))
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not your post")

    post.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Post deleted"}


@router.post("/posts/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a comment to a post. Requires JWT."""


    # Verify post exists
    result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id, CommunityPost.deleted_at.is_(None))
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Post not found")
    if not comment.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    new_comment = CommunityComment(
        post_id=post_id,
        user_id=user.user_id,
        content=comment.content.strip(),
    )
    db.add(new_comment)
    await db.commit()
    return {"id": new_comment.id, "message": "Comment created"}


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete own comment."""


    result = await db.execute(
        select(CommunityComment).where(CommunityComment.id == comment_id, CommunityComment.deleted_at.is_(None))
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not your comment")

    comment.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Comment deleted"}
