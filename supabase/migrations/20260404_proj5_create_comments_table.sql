-- PROJ-5: Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for frequent queries
CREATE INDEX idx_comments_idea_id ON comments(idea_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
