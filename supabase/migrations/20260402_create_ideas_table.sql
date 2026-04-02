-- PROJ-2: Create ideas table for "Ideen einreichen"
-- Run this migration in Supabase SQL Editor

-- 1. Create the ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add indexes for frequently queried columns
CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_ideas_status ON public.ideas(status);
CREATE INDEX idx_ideas_created_at ON public.ideas(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- SELECT: Users can see approved ideas + their own pending ideas
CREATE POLICY "Users can view approved ideas"
  ON public.ideas
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      status = 'approved'
      OR user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create ideas (only for themselves)
CREATE POLICY "Authenticated users can create ideas"
  ON public.ideas
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- UPDATE: Users can only update their own ideas
CREATE POLICY "Users can update own ideas"
  ON public.ideas
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- DELETE: Users can only delete their own ideas
CREATE POLICY "Users can delete own ideas"
  ON public.ideas
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );
