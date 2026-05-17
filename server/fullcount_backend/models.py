from sqlalchemy import Column, String, Integer, Text, DateTime, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class CommunityUser(Base):
    __tablename__ = "community_users"

    user_id = Column(String, primary_key=True)  # "kakao_12345"
    provider = Column(String, nullable=False)  # kakao | naver | google | apple
    nickname = Column(String, nullable=False)
    profile_type = Column(String, default="character")
    profile_value = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True)  # NULL after account deletion
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, nullable=False)
    user_id = Column(String, nullable=True)  # NULL after account deletion
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
