-- PROJ-4: Public board access + server-side vote sorting

-- 1. Allow anonymous users to see approved ideas
CREATE POLICY "Anon can view approved ideas"
  ON public.ideas
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- 2. Allow anonymous users to see votes (for vote counts)
CREATE POLICY "Anon can view votes"
  ON public.votes
  FOR SELECT
  TO anon
  USING (true);

-- 3. RPC: server-side sorted and paginated ideas
--    Handles vote-count ordering correctly across all pages.
--    SECURITY DEFINER: enforces visibility rules inside the function.
CREATE OR REPLACE FUNCTION public.get_ideas_paginated(
  p_sort      TEXT    DEFAULT 'date',
  p_page      INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10,
  p_user_id   UUID    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER := (p_page - 1) * p_page_size;
  v_total  INTEGER;
  v_ideas  JSONB;
BEGIN
  -- Count visible ideas
  SELECT COUNT(*)::INTEGER INTO v_total
  FROM ideas i
  WHERE i.status = 'approved'
     OR (p_user_id IS NOT NULL AND i.user_id = p_user_id);

  -- Fetch paginated ideas with server-side vote count ordering
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO v_ideas
  FROM (
    SELECT
      i.id,
      i.user_id,
      i.title,
      i.description,
      i.status,
      i.created_at,
      COALESCE(pr.email, NULL)                          AS author_email,
      COUNT(v.id)::INTEGER                              AS vote_count,
      COALESCE(BOOL_OR(v.user_id = p_user_id), FALSE)  AS user_has_voted
    FROM ideas i
    LEFT JOIN profiles pr ON pr.id = i.user_id
    LEFT JOIN votes v     ON v.idea_id = i.id
    WHERE i.status = 'approved'
       OR (p_user_id IS NOT NULL AND i.user_id = p_user_id)
    GROUP BY i.id, i.user_id, i.title, i.description, i.status, i.created_at, pr.email
    ORDER BY
      CASE WHEN p_sort = 'votes' THEN COUNT(v.id) END DESC NULLS LAST,
      i.created_at DESC
    LIMIT  p_page_size
    OFFSET v_offset
  ) r;

  RETURN jsonb_build_object('ideas', v_ideas, 'total', v_total);
END;
$$;

-- 4. Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_ideas_paginated TO anon, authenticated;
