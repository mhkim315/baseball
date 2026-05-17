-- Fullcount.kr Community DB Migration
-- Run: psql -U user -d fullcount -f migration.sql

CREATE TABLE IF NOT EXISTS community_users (
  user_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  nickname TEXT NOT NULL,
  profile_type TEXT DEFAULT 'character',
  profile_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES community_users(user_id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS community_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES community_users(user_id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for post listing (non-deleted, newest first)
CREATE INDEX IF NOT EXISTS idx_posts_active ON community_posts(created_at DESC) WHERE deleted_at IS NULL;

-- Index for comment listing by post
CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id, created_at ASC);

-- Index for user lookup by provider
CREATE INDEX IF NOT EXISTS idx_users_provider ON community_users(provider);
