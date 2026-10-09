-- Supabase Schema Update V3

-- 1. Add 'trainingslid' to profiles status check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'on-leave', 'retired', 'trainingslid'));

-- 2. Allow Captains to update other players' profiles (and users their own)
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

-- 3. Stored Procedure for secure profile updates by captains and users
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
