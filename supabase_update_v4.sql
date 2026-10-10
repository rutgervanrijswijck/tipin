-- Supabase Schema Update V4: Mobile Push Notifications & User Preferences

-- ========================================================
-- 1. PUSH SUBSCRIPTIONS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own push subscriptions
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ========================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- ========================================================
-- Users are opted in for everything by default (all columns default to true)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notify_new_poll boolean NOT NULL DEFAULT true,
  notify_attendance_deadline boolean NOT NULL DEFAULT true,
  notify_poll_deadline boolean NOT NULL DEFAULT true,
  notify_fine_received boolean NOT NULL DEFAULT true,
  notify_new_borrel boolean NOT NULL DEFAULT true,
  notify_new_adt_timer boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Helper procedure to atomically upsert notification preferences
CREATE OR REPLACE FUNCTION public.upsert_notification_preferences(
  p_notify_new_poll boolean,
  p_notify_attendance_deadline boolean,
  p_notify_poll_deadline boolean,
  p_notify_fine_received boolean,
  p_notify_new_borrel boolean,
  p_notify_new_adt_timer boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.notification_preferences (
    user_id,
    notify_new_poll,
    notify_attendance_deadline,
    notify_poll_deadline,
    notify_fine_received,
    notify_new_borrel,
    notify_new_adt_timer,
    updated_at
  )
  VALUES (
    v_user_id,
    p_notify_new_poll,
    p_notify_attendance_deadline,
    p_notify_poll_deadline,
    p_notify_fine_received,
    p_notify_new_borrel,
    p_notify_new_adt_timer,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    notify_new_poll = EXCLUDED.notify_new_poll,
    notify_attendance_deadline = EXCLUDED.notify_attendance_deadline,
    notify_poll_deadline = EXCLUDED.notify_poll_deadline,
    notify_fine_received = EXCLUDED.notify_fine_received,
    notify_new_borrel = EXCLUDED.notify_new_borrel,
    notify_new_adt_timer = EXCLUDED.notify_new_adt_timer,
    updated_at = now();

  RETURN json_build_object('success', true);
END;
$$;

-- Helper function to fetch all push recipients for a given broadcast notification type
CREATE OR REPLACE FUNCTION public.get_push_recipients(p_notification_type text)
RETURNS TABLE (
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth
  FROM public.push_subscriptions ps
  LEFT JOIN public.notification_preferences np ON np.user_id = ps.user_id
  WHERE 
    CASE 
      WHEN p_notification_type = 'new_poll' THEN COALESCE(np.notify_new_poll, true)
      WHEN p_notification_type = 'attendance_deadline' THEN COALESCE(np.notify_attendance_deadline, true)
      WHEN p_notification_type = 'poll_deadline' THEN COALESCE(np.notify_poll_deadline, true)
      WHEN p_notification_type = 'fine_received' THEN COALESCE(np.notify_fine_received, true)
      WHEN p_notification_type = 'new_borrel' THEN COALESCE(np.notify_new_borrel, true)
      WHEN p_notification_type = 'new_adt_timer' THEN COALESCE(np.notify_new_adt_timer, true)
      ELSE true
    END = true;
END;
$$;

-- Helper function to fetch push recipients for targeted notification (e.g. fine received or user-specific deadline)
CREATE OR REPLACE FUNCTION public.get_user_push_recipients(p_user_id uuid, p_notification_type text)
RETURNS TABLE (
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth
  FROM public.push_subscriptions ps
  LEFT JOIN public.notification_preferences np ON np.user_id = ps.user_id
  WHERE ps.user_id = p_user_id
    AND CASE 
      WHEN p_notification_type = 'fine_received' THEN COALESCE(np.notify_fine_received, true)
      WHEN p_notification_type = 'attendance_deadline' THEN COALESCE(np.notify_attendance_deadline, true)
      WHEN p_notification_type = 'poll_deadline' THEN COALESCE(np.notify_poll_deadline, true)
      ELSE true
    END = true;
END;
$$;
