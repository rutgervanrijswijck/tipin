-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'on-leave'::text, 'retired'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'player'::text,
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.events (
  answer_by timestamp with time zone,
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
  max_choices integer DEFAULT 1,
  relevant_date timestamp with time zone,
  answer_by timestamp with time zone,
  question text NOT NULL,
  options jsonb NOT NULL,
  created_by uuid,
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
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.boete_types (
  name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  default_amount numeric NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT boete_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.boetes (
  user_id uuid NOT NULL,
  boete_type_id uuid NOT NULL,
  event_id uuid,
  amount numeric NOT NULL,
  reason text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issued_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'unpaid'::text CHECK (status = ANY (ARRAY['unpaid'::text, 'paid'::text])),
  CONSTRAINT boetes_pkey PRIMARY KEY (id),
  CONSTRAINT boetes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT boetes_boete_type_id_fkey FOREIGN KEY (boete_type_id) REFERENCES public.boete_types(id),
  CONSTRAINT boetes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.adts (
  user_id uuid NOT NULL,
  time_seconds numeric NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recorded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT adts_pkey PRIMARY KEY (id),
  CONSTRAINT adts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.carpools (
  event_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  max_passengers integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carpools_pkey PRIMARY KEY (id),
  CONSTRAINT carpools_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT carpools_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.carpool_passengers (
  carpool_id uuid NOT NULL,
  passenger_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carpool_passengers_pkey PRIMARY KEY (id),
  CONSTRAINT carpool_passengers_carpool_id_fkey FOREIGN KEY (carpool_id) REFERENCES public.carpools(id),
  CONSTRAINT carpool_passengers_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.profiles(id)
);