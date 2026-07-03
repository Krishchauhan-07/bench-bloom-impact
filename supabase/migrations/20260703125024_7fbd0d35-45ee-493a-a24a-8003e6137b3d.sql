
-- Trigger to update impact_stats automatically when a new donation is inserted
CREATE OR REPLACE FUNCTION public.bump_impact_on_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats_id uuid;
BEGIN
  SELECT id INTO stats_id FROM public.impact_stats ORDER BY updated_at ASC LIMIT 1;
  IF stats_id IS NULL THEN
    INSERT INTO public.impact_stats (raised_amount, total_donors, total_benches, total_plastic_kg, co2_saved_kg)
    VALUES (NEW.amount, 1, NEW.bench_count, NEW.bench_count * 12, (NEW.bench_count * 12 * 15) / 10);
  ELSE
    UPDATE public.impact_stats
    SET raised_amount = raised_amount + NEW.amount,
        total_donors = total_donors + 1,
        total_benches = total_benches + NEW.bench_count,
        total_plastic_kg = total_plastic_kg + (NEW.bench_count * 12),
        co2_saved_kg = co2_saved_kg + ((NEW.bench_count * 12 * 15) / 10),
        updated_at = now()
    WHERE id = stats_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_donation_bump_impact ON public.donations;
CREATE TRIGGER on_donation_bump_impact
AFTER INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.bump_impact_on_donation();

-- Enable realtime broadcasts
ALTER TABLE public.donations REPLICA IDENTITY FULL;
ALTER TABLE public.impact_stats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_stats;
