-- PROJ-4: Create votes table for Voting feature
-- Run this migration in Supabase SQL Editor

-- 1. Create the votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT votes_user_idea_unique UNIQUE (user_id, idea_id)
);

-- 2. Add index on idea_id for fast vote counting
CREATE INDEX idx_votes_idea_id ON public.votes(idea_id);

-- 3. Enable Row Level Security
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- SELECT: Any authenticated user can see all votes (needed for counts)
CREATE POLICY "Authenticated users can view all votes"
  ON public.votes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Users can only insert their own votes
CREATE POLICY "Users can insert own votes"
  ON public.votes
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- DELETE: Users can only delete their own votes
CREATE POLICY "Users can delete own votes"
  ON public.votes
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- No UPDATE policy — votes are immutable (insert or delete only)
