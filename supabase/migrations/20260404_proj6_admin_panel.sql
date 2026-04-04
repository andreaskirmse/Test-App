-- PROJ-6: Admin Panel
-- Creates admin_audit_log table and adds admin RLS policies on ideas/comments

-- ============================================================
-- 1. Helper function: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. Create admin_audit_log table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action       TEXT        NOT NULL CHECK (action IN ('status_changed', 'comment_deleted')),
  target_type  TEXT        NOT NULL CHECK (target_type IN ('idea', 'comment')),
  target_id    UUID        NOT NULL,
  details      JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_admin_id   ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_target_id  ON public.admin_audit_log(target_id);

-- ============================================================
-- 3. RLS for admin_audit_log
-- ============================================================
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert audit log entries"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND admin_id = auth.uid()
  );

-- ============================================================
-- 4. Admin RLS policies on ideas table
-- ============================================================

-- Admins can view ALL ideas (regardless of status)
CREATE POLICY "Admins can view all ideas"
  ON public.ideas FOR SELECT
  USING (public.is_admin());

-- Admins can update any idea (e.g., change status)
CREATE POLICY "Admins can update any idea"
  ON public.ideas FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 5. Admin RLS policies on comments table
-- ============================================================

-- Admins can delete any comment (hard delete)
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- 6. Admin RLS policies on profiles table
-- ============================================================

-- Admins can view all profiles (for metrics and user info)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- 7. Admin RLS policies on votes table
-- ============================================================

-- Admins can view all votes (for metrics)
CREATE POLICY "Admins can view all votes"
  ON public.votes FOR SELECT
  USING (public.is_admin());
