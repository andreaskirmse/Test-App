-- PROJ-3: Add composite index for Ideenliste sorting/filtering
-- The existing idx_ideas_status and idx_ideas_created_at are single-column indexes.
-- This composite index optimizes queries that filter by status AND sort by created_at,
-- which is the primary query pattern for the Ideenliste feature.
-- Run this migration in Supabase SQL Editor.

CREATE INDEX IF NOT EXISTS idx_ideas_status_created_at
  ON public.ideas (status, created_at DESC);
