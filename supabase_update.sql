-- Supabase Schema Update

-- 1. Update profiles table to include 'status'
-- Status values: 'active', 'on-leave', 'retired'
ALTER TABLE public.profiles ADD COLUMN status text DEFAULT 'active'::text CHECK (status IN ('active', 'on-leave', 'retired'));

-- 2. Update polls table to include 'max_choices' and 'relevant_date'
ALTER TABLE public.polls ADD COLUMN max_choices integer DEFAULT 1;
ALTER TABLE public.polls ADD COLUMN relevant_date timestamp with time zone;

-- 3. Update poll_votes table to support multiple votes per user per poll
-- Drop the existing primary key or unique constraint that prevents multiple votes
-- If there's an existing constraint blocking this, you may need to adjust the DROP command depending on the exact name in your DB
-- Assuming we want a unique constraint on (poll_id, user_id, option_index)
ALTER TABLE public.poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_user_id_key;
ALTER TABLE public.poll_votes ADD CONSTRAINT poll_votes_poll_id_user_id_option_index_key UNIQUE (poll_id, user_id, option_index);