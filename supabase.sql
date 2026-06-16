-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  role text DEFAULT 'player'::text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'on-leave'::text, 'retired'::text])),
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.events (
  reason_required_out boolean DEFAULT false,
  reason_required_maybe boolean DEFAULT false,
  title text NOT NULL,
  description text,
  event_type text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  location text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.attendance (
  reason text,
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['in'::text, 'out'::text, 'maybe'::text])),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.polls (
  question text NOT NULL,
  options jsonb NOT NULL,
  created_by uuid,
  max_choices integer DEFAULT 1,
  relevant_date timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT polls_pkey PRIMARY KEY (id),
  CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  option_index integer NOT NULL,
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT poll_votes_poll_id_user_id_option_index_key UNIQUE (poll_id, user_id, option_index),
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);