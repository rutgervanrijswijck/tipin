-- Supabase Schema Update V2

-- 1. Profiles updates
-- Drop the default constraint and change it to 'player' (it already is, but we want to allow 'captain' and 'trainer')
ALTER TABLE public.profiles ADD COLUMN joined_at timestamp with time zone DEFAULT now();

-- Update existing 'coach' roles to 'captain'
UPDATE public.profiles SET role = 'captain' WHERE role = 'coach';

-- 2. Events & Polls deadlines
ALTER TABLE public.events ADD COLUMN answer_by timestamp with time zone;
ALTER TABLE public.polls ADD COLUMN answer_by timestamp with time zone;

-- 3. Boete (Fine) System
CREATE TABLE public.boete_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_amount numeric NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT boete_types_pkey PRIMARY KEY (id)
);

CREATE TABLE public.boetes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  boete_type_id uuid NOT NULL,
  event_id uuid, -- Optional: Which event caused this fine?
  amount numeric NOT NULL,
  reason text,
  issued_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'unpaid'::text CHECK (status IN ('unpaid', 'paid')),
  CONSTRAINT boetes_pkey PRIMARY KEY (id),
  CONSTRAINT boetes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT boetes_boete_type_id_fkey FOREIGN KEY (boete_type_id) REFERENCES public.boete_types(id),
  CONSTRAINT boetes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);

-- Insert default boete types
INSERT INTO public.boete_types (name, default_amount) VALUES
  ('Missed deadline', 2.50),
  ('Arrived late', 5.00),
  ('No-show', 10.00),
  ('Invalid reason', 5.00);

-- 4. Adts System
CREATE TABLE public.adts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  time_seconds numeric NOT NULL,
  recorded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT adts_pkey PRIMARY KEY (id),
  CONSTRAINT adts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 5. Carpool System
CREATE TABLE public.carpools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  max_passengers integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carpools_pkey PRIMARY KEY (id),
  CONSTRAINT carpools_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT carpools_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.carpool_passengers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  carpool_id uuid NOT NULL,
  passenger_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carpool_passengers_pkey PRIMARY KEY (id),
  CONSTRAINT carpool_passengers_carpool_id_fkey FOREIGN KEY (carpool_id) REFERENCES public.carpools(id) ON DELETE CASCADE,
  CONSTRAINT carpool_passengers_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.profiles(id)
);
