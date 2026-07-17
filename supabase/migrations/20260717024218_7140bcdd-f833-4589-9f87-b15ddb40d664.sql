
-- 1. profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_updated_at();

-- 2. Update impact trigger to use constants (KG_PER_RUPEE=0.2, COST_PER_BENCH=500)
CREATE OR REPLACE FUNCTION public.bump_impact_on_donation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  stats_id uuid;
  kg_per_rupee numeric := 0.2;
  cost_per_bench numeric := 500;
  add_kg int := GREATEST(0, floor(NEW.amount * kg_per_rupee)::int);
  add_benches int := GREATEST(0, floor(NEW.amount / cost_per_bench)::int);
  add_co2 int := GREATEST(0, floor(NEW.amount * kg_per_rupee * 1.5)::int);
BEGIN
  SELECT id INTO stats_id FROM public.impact_stats ORDER BY updated_at ASC LIMIT 1;
  IF stats_id IS NULL THEN
    INSERT INTO public.impact_stats (raised_amount, total_donors, total_benches, total_plastic_kg, co2_saved_kg)
    VALUES (NEW.amount, 1, add_benches, add_kg, add_co2);
  ELSE
    UPDATE public.impact_stats
    SET raised_amount = raised_amount + NEW.amount,
        total_donors = total_donors + 1,
        total_benches = total_benches + add_benches,
        total_plastic_kg = total_plastic_kg + add_kg,
        co2_saved_kg = co2_saved_kg + add_co2,
        updated_at = now()
    WHERE id = stats_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists on donations
DROP TRIGGER IF EXISTS donations_bump_impact ON public.donations;
CREATE TRIGGER donations_bump_impact
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.bump_impact_on_donation();

-- 3. Refresh donor_wall view to include amount and donor name (respecting consent)
DROP VIEW IF EXISTS public.donor_wall;
CREATE VIEW public.donor_wall
WITH (security_invoker = true) AS
SELECT
  donation_id,
  COALESCE(NULLIF(printed_name, ''), name) AS printed_name,
  amount,
  bench_count,
  created_at
FROM public.donations
WHERE print_name = true;

GRANT SELECT ON public.donor_wall TO anon, authenticated;

-- Make donor_wall readable by anon/authenticated even though donations is admin-only:
-- add a narrow policy on donations for the columns exposed by the view.
DROP POLICY IF EXISTS "public can read donor wall columns" ON public.donations;
CREATE POLICY "public can read donor wall columns" ON public.donations
  FOR SELECT TO anon, authenticated
  USING (print_name = true);

-- Enable realtime on donations & impact_stats (idempotent)
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_stats;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
