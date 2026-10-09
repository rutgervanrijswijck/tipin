-- Supabase Schema Update V3

-- ========================================================
-- 1. PROFILES: Status constraint & Captain update permissions
-- ========================================================

-- Add 'trainingslid' to profiles status check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'on-leave', 'retired', 'trainingslid'));

-- Enable RLS and grant update policies for users and captains
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile and captains can update all" ON public.profiles;
DROP POLICY IF EXISTS "Captains can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile and captains can update all" ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'captain')
)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'captain')
);

-- Stored Procedure for secure profile updates by captains and users (bypasses RLS)
CREATE OR REPLACE FUNCTION public.update_player_profile(
  target_user_id uuid,
  new_status text DEFAULT NULL,
  new_role text DEFAULT NULL,
  new_full_name text DEFAULT NULL,
  new_avatar_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO calling_user_role FROM public.profiles WHERE id = auth.uid();

  -- Caller must be captain or updating their own profile
  IF calling_user_role != 'captain' AND auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Permission denied: only captains can update other player profiles';
  END IF;

  IF new_status IS NOT NULL THEN
    UPDATE public.profiles SET status = new_status WHERE id = target_user_id;
  END IF;

  IF new_role IS NOT NULL AND (calling_user_role = 'captain' OR auth.uid() = target_user_id) THEN
    UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  END IF;

  IF new_full_name IS NOT NULL THEN
    UPDATE public.profiles SET full_name = new_full_name WHERE id = target_user_id;
  END IF;

  IF new_avatar_url IS NOT NULL THEN
    UPDATE public.profiles SET avatar_url = new_avatar_url WHERE id = target_user_id;
  END IF;

  RETURN true;
END;
$$;


-- ========================================================
-- 2. POLL VOTES: Delete policy & Unvote / Toggle procedure
-- ========================================================

-- Enable RLS on poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Allow users to delete their own votes (essential for unvoting!)
DROP POLICY IF EXISTS "Users can delete their own poll votes" ON public.poll_votes;
CREATE POLICY "Users can delete their own poll votes" ON public.poll_votes
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Ensure users can insert their own votes
DROP POLICY IF EXISTS "Users can insert their own poll votes" ON public.poll_votes;
CREATE POLICY "Users can insert their own poll votes" ON public.poll_votes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure users can read all poll votes
DROP POLICY IF EXISTS "Users can view poll votes" ON public.poll_votes;
CREATE POLICY "Users can view poll votes" ON public.poll_votes
FOR SELECT TO authenticated
USING (true);

-- Atomic Stored Procedure to toggle/unvote poll votes (bypasses RLS)
CREATE OR REPLACE FUNCTION public.toggle_poll_vote(
  p_poll_id uuid,
  p_option_index integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_max_choices integer;
  v_current_count integer;
  v_action text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if this exact vote exists
  SELECT id INTO v_existing_id
  FROM public.poll_votes
  WHERE poll_id = p_poll_id AND user_id = v_user_id AND option_index = p_option_index;

  IF v_existing_id IS NOT NULL THEN
    -- UNVOTE: Remove the vote
    DELETE FROM public.poll_votes WHERE id = v_existing_id;
    v_action := 'unvoted';
  ELSE
    -- VOTE: Check max_choices
    SELECT COALESCE(max_choices, 1) INTO v_max_choices FROM public.polls WHERE id = p_poll_id;
    
    IF v_max_choices = 1 THEN
      -- Single choice: replace any existing vote for this poll
      DELETE FROM public.poll_votes WHERE poll_id = p_poll_id AND user_id = v_user_id;
    ELSE
      SELECT COUNT(*) INTO v_current_count FROM public.poll_votes WHERE poll_id = p_poll_id AND user_id = v_user_id;
      IF v_current_count >= v_max_choices THEN
        RAISE EXCEPTION 'Maximum choices reached';
      END IF;
    END IF;

    -- Insert new vote
    INSERT INTO public.poll_votes (poll_id, user_id, option_index)
    VALUES (p_poll_id, v_user_id, p_option_index);
    v_action := 'voted';
  END IF;

  RETURN json_build_object('action', v_action);
END;
$$;
