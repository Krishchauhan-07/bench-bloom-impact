
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id TEXT NOT NULL UNIQUE DEFAULT ('DON-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  nation TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  bench_count INTEGER NOT NULL CHECK (bench_count > 0),
  print_name BOOLEAN NOT NULL DEFAULT false,
  printed_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.donations TO anon;
GRANT SELECT, INSERT ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a donation (demo payment flow)
CREATE POLICY "anyone can insert donation" ON public.donations FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Only admins can view full donation records
CREATE POLICY "admins can view donations" ON public.donations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public donor wall view (only opt-in printed names)
CREATE VIEW public.donor_wall AS
  SELECT donation_id, printed_name, bench_count, created_at
  FROM public.donations
  WHERE print_name = true AND printed_name IS NOT NULL AND length(trim(printed_name)) > 0;
GRANT SELECT ON public.donor_wall TO anon, authenticated;

-- Impact stats (single row)
CREATE TABLE public.impact_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_benches INTEGER NOT NULL DEFAULT 0,
  total_plastic_kg INTEGER NOT NULL DEFAULT 0,
  kids_helped INTEGER NOT NULL DEFAULT 0,
  total_donors INTEGER NOT NULL DEFAULT 0,
  co2_saved_kg INTEGER NOT NULL DEFAULT 0,
  goal_amount INTEGER NOT NULL DEFAULT 100000,
  raised_amount INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.impact_stats TO anon, authenticated;
GRANT UPDATE ON public.impact_stats TO authenticated;
GRANT ALL ON public.impact_stats TO service_role;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view impact" ON public.impact_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins can update impact" ON public.impact_stats FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.impact_stats (total_benches, total_plastic_kg, kids_helped, total_donors, co2_saved_kg, goal_amount, raised_amount)
VALUES (127, 3400, 850, 312, 5100, 100000, 45000);
